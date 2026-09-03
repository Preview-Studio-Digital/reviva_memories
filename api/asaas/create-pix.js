/**
 * Vercel Serverless Function: /api/asaas/create-pix
 */
const https = require('https');

const ASAAS_API_KEY = process.env.ASAAS_API_KEY || '';
const ASAAS_HOST = 'api.asaas.com';

function asaasRequest(method, path, body = null) {
    return new Promise((resolve, reject) => {
        const payload = body ? JSON.stringify(body) : null;
        const options = {
            hostname: ASAAS_HOST,
            path: path,
            method: method,
            headers: {
                'access_token': ASAAS_API_KEY,
                'Content-Type': 'application/json',
                'User-Agent': 'RevivaMemories'
            }
        };
        if (payload) {
            options.headers['Content-Length'] = Buffer.byteLength(payload);
        }

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(parsed);
                    } else {
                        reject(parsed);
                    }
                } catch (e) {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(data);
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                    }
                }
            });
        });

        req.on('error', (err) => reject(err));
        if (payload) req.write(payload);
        req.end();
    });
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        let bodyData = req.body;
        if (typeof bodyData === 'string') {
            try { bodyData = JSON.parse(bodyData); } catch(e) {}
        }
        bodyData = bodyData || {};

        const { name, cpf, email, phone, value, orderId, planName, description } = bodyData;
        if (!name || !cpf || !value) {
            return res.status(400).json({ error: 'Dados obrigatórios incompletos (name, cpf, value)' });
        }

        const cleanCpf = cpf.replace(/\D/g, '');
        const cleanPhone = (phone || '').replace(/\D/g, '');

        // 1. Obter ou Criar Cliente no Asaas
        let customerId = null;
        const searchRes = await asaasRequest('GET', `/v3/customers?cpfCnpj=${cleanCpf}`);
        if (searchRes && searchRes.data && searchRes.data.length > 0) {
            customerId = searchRes.data[0].id;
        } else {
            const newCust = await asaasRequest('POST', '/v3/customers', {
                name: name.trim(),
                cpfCnpj: cleanCpf,
                email: (email || '').trim().toLowerCase(),
                mobilePhone: cleanPhone || undefined,
                notificationDisabled: true
            });
            customerId = newCust.id;
        }

        // 2. Criar Cobrança PIX
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 2);
        const dueDate = tomorrow.toISOString().split('T')[0];

        const paymentBody = {
            customer: customerId,
            billingType: 'PIX',
            value: parseFloat(value),
            dueDate: dueDate,
            description: description || `Reviva Memories - ${planName || 'Homenagem'} (${orderId || 'S/N'})`,
            externalReference: orderId || undefined,
            postalService: false
        };

        const payment = await asaasRequest('POST', '/v3/payments', paymentBody);

        // 3. Obter QR Code PIX
        const qrData = await asaasRequest('GET', `/v3/payments/${payment.id}/pixQrCode`);

        return res.status(200).json({
            success: true,
            paymentId: payment.id,
            invoiceUrl: payment.invoiceUrl,
            encodedImage: qrData.encodedImage,
            payload: qrData.payload,
            expirationDate: qrData.expirationDate
        });
    } catch (err) {
        console.error('[Vercel API create-pix error]:', err);
        return res.status(500).json({
            success: false,
            error: err?.message || (err?.errors ? err.errors.map(e => e.description).join(', ') : 'Erro ao processar PIX no Asaas')
        });
    }
};
