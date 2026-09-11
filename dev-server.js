const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5500;
const ROOT = __dirname;

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.mp3': 'audio/mpeg',
    '.webm': 'video/webm',
    '.mp4': 'video/mp4',
    '.ico': 'image/x-icon'
};

const sseClients = new Set();

// =========================================================================
// CLOUDFLARE D1 & R2 HELPERS
// =========================================================================
let cloudflareCfg = null;
try {
    cloudflareCfg = require('./config.local.js');
} catch(e) {}

const https = require('https');

function d1Query(sql, params = []) {
    return new Promise((resolve, reject) => {
        if (!cloudflareCfg || !cloudflareCfg.CLOUDFLARE_API_TOKEN) {
            return resolve({ success: false, reason: 'No Cloudflare credentials' });
        }
        const payload = JSON.stringify({ sql, params });
        const options = {
            hostname: 'api.cloudflare.com',
            path: `/client/v4/accounts/${cloudflareCfg.CLOUDFLARE_ACCOUNT_ID}/d1/database/${cloudflareCfg.CLOUDFLARE_D1_DATABASE_ID}/query`,
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${cloudflareCfg.CLOUDFLARE_API_TOKEN}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        };
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.success) {
                        resolve({ success: true, result: parsed.result });
                    } else {
                        console.error('❌ [Cloudflare D1 Query Error]:', parsed.errors);
                        resolve({ success: false, errors: parsed.errors });
                    }
                } catch(err) {
                    resolve({ success: false, error: err.message });
                }
            });
        });
        req.on('error', err => {
            console.error('❌ [Cloudflare D1 Network Error]:', err);
            resolve({ success: false, error: err.message });
        });
        req.write(payload);
        req.end();
    });
}

const server = http.createServer((req, res) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    let pathname = decodeURIComponent(parsedUrl.pathname);

    // SSE Endpoint para Live Reload Instantâneo
    if (pathname === '/_reload') {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*'
        });
        res.write('data: connected\n\n');
        sseClients.add(res);
        req.on('close', () => sseClients.delete(res));
        return;
    }

    // =========================================================================
    // ENDPOINTS DO ASAAS (BACKEND LOCAL SEGURO)
    // =========================================================================
    if (pathname === '/api/asaas/create-pix' && req.method === 'POST') {
        let bodyStr = '';
        req.on('data', chunk => bodyStr += chunk);
        req.on('end', async () => {
            try {
                const asaas = require('./asaas_service.js');
                const data = JSON.parse(bodyStr);
                const customerId = await asaas.getOrCreateCustomer({
                    name: data.name,
                    cpfCnpj: data.cpf,
                    email: data.email,
                    phone: data.phone
                });
                const pixResult = await asaas.createPixPayment({
                    customerId: customerId,
                    value: data.value,
                    orderId: data.orderId,
                    planName: data.planName,
                    description: data.description
                });

                // Persistir Pedido e Perfil no Cloudflare D1 em tempo real
                d1Query(
                    `INSERT INTO profiles (id, full_name, email, phone) 
                     VALUES (?, ?, ?, ?) 
                     ON CONFLICT(id) DO UPDATE SET full_name=excluded.full_name, phone=excluded.phone`,
                    [data.cpf || customerId, data.name, data.email, data.phone]
                ).catch(e => console.error('Erro profile D1:', e));

                d1Query(
                    `INSERT INTO orders (id, user_id, customer_name, customer_email, customer_cpf, plan_name, status, payment_id, amount) 
                     VALUES (?, ?, ?, ?, ?, ?, 'pending_pix', ?, ?) 
                     ON CONFLICT(id) DO UPDATE SET status='pending_pix', payment_id=excluded.payment_id`,
                    [data.orderId, data.cpf || customerId, data.name, data.email, data.cpf, data.planName, pixResult.paymentId, data.value]
                ).catch(e => console.error('Erro order D1:', e));

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, ...pixResult }));
            } catch (err) {
                console.error('❌ [Asaas Endpoint Error]:', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: err?.message || err }));
            }
        });
        return;
    }

    if (pathname.startsWith('/api/asaas/check-status') && req.method === 'GET') {
        const queryParamId = parsedUrl.searchParams.get('paymentId');
        const paymentId = queryParamId || pathname.split('/').pop();
        (async () => {
            try {
                const asaas = require('./asaas_service.js');
                const statusResult = await asaas.checkPaymentStatus(paymentId);

                // Se o pagamento foi confirmado, atualiza no Cloudflare D1
                if (statusResult && (statusResult.status === 'RECEIVED' || statusResult.status === 'CONFIRMED')) {
                    d1Query(
                        `UPDATE orders SET status = 'paid' WHERE payment_id = ?`,
                        [paymentId]
                    ).catch(e => console.error('Erro update status D1:', e));
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, ...statusResult }));
            } catch (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: err?.message || err }));
            }
        })();
        return;
    }

    if (pathname === '/api/asaas/simulate-payment' && req.method === 'POST') {
        let bodyStr = '';
        req.on('data', chunk => bodyStr += chunk);
        req.on('end', async () => {
            try {
                const asaas = require('./asaas_service.js');
                const data = JSON.parse(bodyStr);
                const simResult = await asaas.simulatePayment(data.paymentId, data.value);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, ...simResult }));
            } catch (err) {
                console.error('❌ [Simulate Payment Dev Server Error]:', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: err?.message || err }));
            }
        });
        return;
    }

    // Endpoint para zerar todos os pedidos e limpar histórico anterior
    if (pathname === '/api/asaas/purge-orders' && (req.method === 'POST' || req.method === 'GET')) {
        try {
            const purgeFile = path.join(ROOT, '.purged_orders_timestamp');
            fs.writeFileSync(purgeFile, Date.now().toString(), 'utf8');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, message: 'Todos os pedidos e contadores foram zerados com sucesso.' }));
        } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: err?.message || err }));
        }
        return;
    }

    if (pathname === '/api/asaas/orders' && req.method === 'GET') {
        (async () => {
            try {
                const asaas = require('./asaas_service.js');
                let orders = await asaas.listPayments(20);
                
                // Se o ambiente foi purgado/zerado, oculta os pedidos anteriores ao reset
                const purgeFile = path.join(ROOT, '.purged_orders_timestamp');
                if (fs.existsSync(purgeFile)) {
                    const purgeData = JSON.parse(fs.readFileSync(purgeFile, 'utf8') || '{}');
                    const purgedIds = new Set(purgeData.purgedIds || []);
                    orders = orders.filter(o => !purgedIds.has(o.id));
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, orders }));
            } catch (err) {
                console.error('❌ [List Orders Error]:', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: err?.message || err, orders: [] }));
            }
        })();
        return;
    }

    if (pathname === '/api/asaas/pay-credit-card' && req.method === 'POST') {
        let bodyStr = '';
        req.on('data', chunk => bodyStr += chunk);
        req.on('end', async () => {
            try {
                const serverlessHandler = require('./api/asaas/pay-credit-card.js');
                const mockReq = {
                    method: 'POST',
                    body: JSON.parse(bodyStr),
                    headers: req.headers
                };
                const mockRes = {
                    statusCode: 200,
                    headers: {},
                    setHeader(k, v) { this.headers[k] = v; },
                    status(code) { this.statusCode = code; return this; },
                    json(data) {
                        res.writeHead(this.statusCode, { 'Content-Type': 'application/json', ...this.headers });
                        res.end(JSON.stringify(data));
                    },
                    end() { res.end(); }
                };
                await serverlessHandler(mockReq, mockRes);
            } catch (err) {
                console.error('❌ [Credit Card Dev Server Error]:', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: err?.message || err }));
            }
        });
        return;
    }

    // =========================================================================
    // ENDPOINTS CLOUDFLARE (D1 QUERY & R2 UPLOADS)
    // =========================================================================
    if (pathname === '/api/cloudflare/d1' && req.method === 'POST') {
        let bodyStr = '';
        req.on('data', chunk => bodyStr += chunk);
        req.on('end', async () => {
            try {
                const data = JSON.parse(bodyStr);
                const queryRes = await d1Query(data.sql, data.params || []);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(queryRes));
            } catch(err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: err.message }));
            }
        });
        return;
    }

    if (pathname === '/api/cloudflare/upload-r2' && req.method === 'POST') {
        let chunks = [];
        req.on('data', chunk => chunks.push(chunk));
        req.on('end', async () => {
            try {
                const buffer = Buffer.concat(chunks);
                const fileName = req.headers['x-file-name'] || ('upload_' + Date.now());
                const contentType = req.headers['content-type'] || 'application/octet-stream';
                
                if (!cloudflareCfg || !cloudflareCfg.CLOUDFLARE_API_TOKEN) {
                    throw new Error('Credenciais Cloudflare não configuradas');
                }

                // Upload direto para o Cloudflare R2
                const r2Req = https.request({
                    hostname: 'api.cloudflare.com',
                    path: `/client/v4/accounts/${cloudflareCfg.CLOUDFLARE_ACCOUNT_ID}/r2/buckets/${cloudflareCfg.CLOUDFLARE_R2_BUCKET}/objects/${encodeURIComponent(fileName)}`,
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${cloudflareCfg.CLOUDFLARE_API_TOKEN}`,
                        'Content-Type': contentType,
                        'Content-Length': buffer.length
                    }
                }, (r2Res) => {
                    let r2Data = '';
                    r2Res.on('data', c => r2Data += c);
                    r2Res.on('end', () => {
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ 
                            success: true, 
                            fileName,
                            publicUrl: `/r2/${fileName}` 
                        }));
                    });
                });

                r2Req.on('error', (err) => {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: err.message }));
                });

                r2Req.write(buffer);
                r2Req.end();
            } catch(err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: err.message }));
            }
        });
        return;
    }

    // Resolução de Arquivo com Suporte a URLs Limpas (/painel -> painel.html)
    let filePath = path.join(ROOT, pathname);

    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, 'index.html');
    }

    if (!fs.existsSync(filePath)) {
        if (fs.existsSync(filePath + '.html')) {
            filePath = filePath + '.html';
        } else if (pathname === '/painel') {
            filePath = path.join(ROOT, 'painel.html');
        }
    }

    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`<h2>404 Não Encontrado</h2><p>O arquivo <code>${pathname}</code> não existe.</p>`);
        return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // Injeção de Script de Live Reload nos Arquivos HTML
    if (ext === '.html') {
        fs.readFile(filePath, 'utf8', (err, html) => {
            if (err) {
                res.writeHead(500);
                res.end('Erro ao ler arquivo.');
                return;
            }
            const reloadScript = `
<!-- Live Reload Script Automatizado -->
<script>
(function() {
    let es;
    function connect() {
        es = new EventSource('/_reload');
        es.onmessage = function(e) {
            if (e.data === 'reload') {
                console.log('[LiveReload] Atualização detectada, recarregando...');
                window.location.reload();
            }
        };
        es.onerror = function() {
            es.close();
            setTimeout(connect, 1500);
        };
    }
    connect();
})();
</script>
`;
            let injectedHtml = html;
            if (injectedHtml.includes('</body>')) {
                injectedHtml = injectedHtml.replace('</body>', `${reloadScript}</body>`);
            } else {
                injectedHtml += reloadScript;
            }
            res.writeHead(200, {
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            });
            res.end(injectedHtml);
        });
        return;
    }

    // Suporte a Streaming Parcial para Vídeos e Áudios
    const stat = fs.statSync(filePath);
    const range = req.headers.range;

    if (range && (ext === '.mp3' || ext === '.webm' || ext === '.mp4')) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(filePath, { start, end });
        res.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${stat.size}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': contentType
        });
        file.pipe(res);
    } else {
        res.writeHead(200, {
            'Content-Type': contentType,
            'Content-Length': stat.size,
            'Cache-Control': 'no-cache'
        });
        fs.createReadStream(filePath).pipe(res);
    }
});

// File Watcher com Debounce para Disparar Reload
let debounceTimer = null;
fs.watch(ROOT, { recursive: false }, (eventType, filename) => {
    if (!filename) return;
    const ext = path.extname(filename).toLowerCase();
    if (['.html', '.js', '.css'].includes(ext)) {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            console.log(`[Watcher] Alteração detectada em ${filename}. Recarregando navegadores...`);
            for (const client of sseClients) {
                client.write('data: reload\n\n');
            }
        }, 120);
    }
});

function convertAllAmbientes() {
    const { spawnSync } = require('child_process');
    const psCode = `
[System.Reflection.Assembly]::LoadWithPartialName('System.Drawing') | Out-Null
$src = 'G:\\Meu Drive\\02_BIBLIOTECAS\\06_INTELIGÊNCIA ARTIFICIAL\\22_REVIVA\\IMAGENS\\PAISAGENS'
$dst = 'c:\\_DESENVOLVIMENTO\\reviva_memories\\assets\\ambientes'
if (-not (Test-Path -LiteralPath $dst)) { New-Item -ItemType Directory -Path $dst -Force | Out-Null }
$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }

$list = @(
  @('CÉU.png', 'bg_ceu.jpg'),
  @('DESCAMPAGO.png', 'bg_descampado.jpg'),
  @('FLORESTA.png', 'bg_floresta.jpg'),
  @('GIRASSÓIS.png', 'bg_girassois.jpg'),
  @('LAGO.png', 'bg_lago.jpg'),
  @('MONTANHAS.png', 'bg_montanhas.jpg'),
  @('PALMEIRAS.png', 'bg_palmeiras.jpg'),
  @('VALE.png', 'bg_vale.jpg')
)

foreach ($item in $list) {
  $srcFile = Join-Path $src $item[0]
  $dstFile = Join-Path $dst $item[1]
  if (Test-Path -LiteralPath $srcFile) {
    $bmp = [System.Drawing.Bitmap]::FromFile($srcFile)
    $maxW = 1280.0
    $ratio = [Math]::Min(1.0, $maxW / $bmp.Width)
    $w = [int]($bmp.Width * $ratio)
    $h = [int]($bmp.Height * $ratio)
    $newBmp = New-Object System.Drawing.Bitmap($w, $h)
    $g = [System.Drawing.Graphics]::FromImage($newBmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.DrawImage($bmp, 0, 0, $w, $h)
    $g.Dispose()
    $bmp.Dispose()
    $ep = New-Object System.Drawing.Imaging.EncoderParameters(1)
    $ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]80)
    $newBmp.Save($dstFile, $codec, $ep)
    $newBmp.Dispose()
    Write-Host ('Processado com sucesso: ' + $item[1])
  }
}
`;
    fs.writeFileSync(path.join(ROOT, 'convert_task.ps1'), psCode, 'utf8');
    const res = spawnSync('powershell.exe', ['-ExecutionPolicy', 'Bypass', '-File', path.join(ROOT, 'convert_task.ps1')], { encoding: 'utf8' });
    console.log('[Ambientes Converter Result]:\n', res.stdout || res.stderr);
}

convertAllAmbientes();

server.listen(PORT, () => {
    console.log(`\n=================================================`);
    console.log(`🚀 Live Server Ativo em http://localhost:${PORT}`);
    console.log(`🔗 Painel (URL Limpa): http://localhost:${PORT}/painel`);
    console.log(`🔗 Painel (.html):     http://localhost:${PORT}/painel.html`);
    console.log(`🔄 Auto-Reload SSE:    Ativo e Sincronizado em tempo real`);
    console.log(`=================================================\n`);
});

