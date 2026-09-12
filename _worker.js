/**
 * Cloudflare Native Worker Router (_worker.js)
 * Substitui 100% o Vercel. Processa APIs do Asaas, integra com Cloudflare D1 e serve os arquivos estáticos.
 */

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const pathname = url.pathname;

        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
            'Access-Control-Allow-Headers': '*',
            'Content-Type': 'application/json'
        };

        if (request.method === 'OPTIONS') {
            return new Response(null, { status: 200, headers: corsHeaders });
        }

        const rawKey = env.ASAAS_API_KEY || '';
        const ASAAS_API_KEY = rawKey.replace(/[^\x20-\x7E]/g, '').trim().replace(/^["']|["']$/g, '');
        const ASAAS_HOST = ASAAS_API_KEY.includes('_hmlg_') ? 'https://api-sandbox.asaas.com' : 'https://api.asaas.com';

        async function asaasFetch(path, method = 'GET', body = null) {
            const res = await fetch(`${ASAAS_HOST}${path}`, {
                method,
                headers: {
                    'access_token': ASAAS_API_KEY,
                    'Content-Type': 'application/json',
                    'User-Agent': 'RevivaMemories'
                },
                body: body ? JSON.stringify(body) : null
            });
            const data = await res.json();
            if (!res.ok) throw data;
            return data;
        }

        // 1. ENDPOINT: /api/asaas/create-pix
        if (pathname === '/api/asaas/create-pix' && request.method === 'POST') {
            try {
                const bodyData = await request.json();
                const { name, cpf, email, phone, value, orderId, planName, description } = bodyData;

                if (!name || !cpf || !value) {
                    return new Response(JSON.stringify({ error: 'Dados incompletos (nome, cpf ou valor)' }), {
                        status: 400,
                        headers: corsHeaders
                    });
                }

                const cleanCpf = cpf.replace(/\D/g, '');
                const cleanPhone = (phone || '').replace(/\D/g, '');

                // Obter ou criar cliente no Asaas
                let customerId = null;
                const searchRes = await asaasFetch(`/v3/customers?cpfCnpj=${cleanCpf}`);
                if (searchRes && searchRes.data && searchRes.data.length > 0) {
                    customerId = searchRes.data[0].id;
                } else {
                    const newCust = await asaasFetch('/v3/customers', 'POST', {
                        name: name.trim(),
                        cpfCnpj: cleanCpf,
                        email: (email || '').trim().toLowerCase(),
                        mobilePhone: cleanPhone || undefined,
                        notificationDisabled: true
                    });
                    customerId = newCust.id;
                }

                // Criar cobrança PIX
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 2);
                const dueDate = tomorrow.toISOString().split('T')[0];

                const payment = await asaasFetch('/v3/payments', 'POST', {
                    customer: customerId,
                    billingType: 'PIX',
                    value: parseFloat(value),
                    dueDate: dueDate,
                    description: description || `Reviva Memories - ${planName || 'Homenagem'} (${orderId || 'S/N'})`,
                    externalReference: orderId || undefined,
                    postalService: false
                });

                // Obter QR Code PIX
                const qrData = await asaasFetch(`/v3/payments/${payment.id}/pixQrCode`);

                // Persistir no Cloudflare D1
                if (env.DB) {
                    try {
                        await env.DB.prepare("DELETE FROM deleted_orders WHERE id = ? OR payment_id = ?").bind(payment.id, payment.id).run();

                        await env.DB.prepare(
                            `INSERT INTO profiles (id, full_name, email, phone) 
                             VALUES (?, ?, ?, ?) 
                             ON CONFLICT(id) DO UPDATE SET full_name=excluded.full_name, phone=excluded.phone`
                        ).bind(cleanCpf || customerId, name.trim(), email || '', phone || '').run();

                        await env.DB.prepare(
                            `INSERT INTO orders (id, user_id, customer_name, customer_email, customer_cpf, plan_name, status, payment_id, amount) 
                             VALUES (?, ?, ?, ?, ?, ?, 'pending_pix', ?, ?) 
                             ON CONFLICT(id) DO UPDATE SET 
                                customer_name=excluded.customer_name, 
                                customer_email=excluded.customer_email, 
                                customer_cpf=excluded.customer_cpf, 
                                plan_name=excluded.plan_name, 
                                status='pending_pix', 
                                payment_id=excluded.payment_id,
                                amount=excluded.amount`
                        ).bind(orderId || payment.id, cleanCpf || customerId, name.trim(), email || '', cleanCpf, planName || 'Plano', payment.id, parseFloat(value)).run();
                    } catch(d1Err) {
                        console.error('[D1 Worker Warning]:', d1Err);
                    }
                }

                return new Response(JSON.stringify({
                    success: true,
                    paymentId: payment.id,
                    invoiceUrl: payment.invoiceUrl,
                    encodedImage: qrData.encodedImage,
                    payload: qrData.payload,
                    expirationDate: qrData.expirationDate
                }), { status: 200, headers: corsHeaders });

            } catch (err) {
                console.error('[Worker create-pix error]:', err);
                return new Response(JSON.stringify({
                    success: false,
                    error: err?.message || (err?.errors ? err.errors.map(e => e.description).join(', ') : 'Erro ao processar PIX no Asaas')
                }), { status: 500, headers: corsHeaders });
            }
        }

        // 2. ENDPOINT: /api/asaas/check-status
        if (pathname === '/api/asaas/check-status' && request.method === 'GET') {
            const paymentId = url.searchParams.get('paymentId') || url.searchParams.get('id');
            if (!paymentId) {
                return new Response(JSON.stringify({ error: 'paymentId obrigatório' }), { status: 400, headers: corsHeaders });
            }
            try {
                const payment = await asaasFetch(`/v3/payments/${paymentId}`);
                const isPaid = payment.status === 'RECEIVED' || payment.status === 'CONFIRMED' || payment.status === 'RECEIVED_IN_CASH';

                if (isPaid && env.DB) {
                    try {
                        await env.DB.prepare("UPDATE orders SET status = 'paid' WHERE payment_id = ?").bind(paymentId).run();
                    } catch(e) {}
                }

                return new Response(JSON.stringify({
                    success: true,
                    status: payment.status,
                    isPaid: isPaid,
                    paymentDate: payment.paymentDate || payment.clientPaymentDate || null
                }), { status: 200, headers: corsHeaders });
            } catch(err) {
                return new Response(JSON.stringify({ success: false, error: err?.message || 'Erro ao checar status' }), { status: 500, headers: corsHeaders });
            }
        }

        // 3. ENDPOINT: /api/asaas/simulate-payment (Simulação de Confirmação no Sandbox)
        if (pathname === '/api/asaas/simulate-payment' && request.method === 'POST') {
            try {
                const body = await request.json();
                const paymentId = body.paymentId;
                const today = new Date().toISOString().split('T')[0];

                let payValue = body.value;
                let externalRef = null;
                if (paymentId) {
                    try {
                        const payInfo = await asaasFetch(`/v3/payments/${paymentId}`);
                        if (payInfo) {
                            payValue = payInfo.originalValue || payInfo.value || payValue;
                            externalRef = payInfo.externalReference || null;
                        }
                    } catch(e) {}
                }

                const resSim = await asaasFetch(`/v3/payments/${paymentId}/receiveInCash`, 'POST', {
                    paymentDate: today,
                    value: payValue ? Number(payValue) : 807.30
                });

                if (env.DB) {
                    try {
                        await env.DB.prepare("UPDATE orders SET status = 'paid' WHERE payment_id = ? OR id = ?").bind(paymentId, externalRef || '').run();
                    } catch(e) {}
                }

                return new Response(JSON.stringify({ success: true, ...resSim }), { status: 200, headers: corsHeaders });
            } catch(err) {
                return new Response(JSON.stringify({ success: false, error: err?.message || 'Erro ao simular' }), { status: 500, headers: corsHeaders });
            }
        }

        // 3.1 ENDPOINT: /api/asaas/orders (Consulta pedidos recentes no Asaas para o Painel Admin com filtro de excluídos e enriquecimento D1)
        if (pathname === '/api/asaas/orders' && request.method === 'GET') {
            try {
                const deletedSet = new Set();
                const d1OrdersMap = new Map();
                const d1ProfilesMap = new Map();
                const d1StateMap = new Map();

                if (env.DB) {
                    try {
                        await env.DB.prepare("CREATE TABLE IF NOT EXISTS deleted_orders (id TEXT PRIMARY KEY, payment_id TEXT, deleted_at TEXT)").run();
                        const deletedRows = await env.DB.prepare("SELECT id, payment_id FROM deleted_orders").all();
                        if (deletedRows && deletedRows.results) {
                            deletedRows.results.forEach(r => {
                                const pId = String(r.payment_id || r.id || '').toLowerCase().trim();
                                if (pId) {
                                    deletedSet.add(pId);
                                }
                            });
                        }

                        const ordRes = await env.DB.prepare("SELECT id, payment_id, user_id, customer_name, customer_email, customer_cpf, plan_name, status, amount FROM orders").all();
                        if (ordRes && ordRes.results) {
                            ordRes.results.forEach(row => {
                                if (row.id) d1OrdersMap.set(String(row.id).toLowerCase(), row);
                                if (row.payment_id) d1OrdersMap.set(String(row.payment_id).toLowerCase(), row);
                            });
                        }

                        const profRes = await env.DB.prepare("SELECT id, full_name, email, phone FROM profiles").all();
                        if (profRes && profRes.results) {
                            profRes.results.forEach(row => {
                                if (row.id) d1ProfilesMap.set(String(row.id).toLowerCase(), row);
                            });
                        }

                        await env.DB.prepare("CREATE TABLE IF NOT EXISTS order_state (order_id TEXT PRIMARY KEY, state_json TEXT, updated_at TEXT)").run();
                        const stateRows = await env.DB.prepare("SELECT order_id, state_json, updated_at FROM order_state").all();
                        if (stateRows && stateRows.results) {
                            stateRows.results.forEach(row => {
                                if (row.order_id && row.state_json) {
                                    try {
                                        d1StateMap.set(String(row.order_id).toLowerCase().trim(), JSON.parse(row.state_json));
                                    } catch(e) {}
                                }
                            });
                        }
                    } catch(d1Err) {
                        console.warn('[Worker D1 sync warning]:', d1Err);
                    }
                }

                // Consulta pagamentos e clientes no Asaas em paralelo
                const [paymentsData, customersData] = await Promise.all([
                    asaasFetch('/v3/payments?limit=100&order=desc').catch(() => ({ data: [] })),
                    asaasFetch('/v3/customers?limit=100').catch(() => ({ data: [] }))
                ]);

                const list = (paymentsData && Array.isArray(paymentsData.data)) ? paymentsData.data : [];
                
                const asaasCustomersMap = new Map();
                if (customersData && Array.isArray(customersData.data)) {
                    customersData.data.forEach(c => {
                        if (c && c.id) {
                            asaasCustomersMap.set(String(c.id).toLowerCase().trim(), c);
                        }
                    });
                }
                
                const ordersByRef = new Map();

                for (const p of list) {
                    const extRef = p.externalReference || p.id;
                    const paymentId = p.id;
                    const extRefLow = String(extRef).toLowerCase().trim();
                    const paymentIdLow = String(paymentId).toLowerCase().trim();
                    
                    // Se este pagamento específico ou referência foi excluído definitivamente pelo administrador, ignora
                    if (deletedSet.has(paymentIdLow) || deletedSet.has(extRefLow)) {
                        continue;
                    }

                    const isPaid = p.status === 'RECEIVED' || p.status === 'CONFIRMED' || p.status === 'RECEIVED_IN_CASH';
                    const asCustomer = p.customer ? asaasCustomersMap.get(String(p.customer).toLowerCase().trim()) : null;
                    const d1Order = d1OrdersMap.get(extRefLow) || d1OrdersMap.get(paymentIdLow);
                    const d1Profile = d1Order?.user_id ? d1ProfilesMap.get(String(d1Order.user_id).toLowerCase()) : null;

                    const clientName = d1Order?.customer_name || asCustomer?.name || 'Cliente Reviva';
                    const clientEmail = d1Order?.customer_email || asCustomer?.email || d1Profile?.email || '';
                    const clientPhone = d1Profile?.phone || asCustomer?.mobilePhone || asCustomer?.phone || '';
                    const clientCpf = d1Order?.customer_cpf || asCustomer?.cpfCnpj || '';

                    const isPix = String(p.billingType || '').toUpperCase() === 'PIX' || (p.originalValue && Number(p.originalValue) > 0);
                    const rawVal = (isPix && p.originalValue) ? Number(p.originalValue) : Number(p.value);
                    const trueValue = !isNaN(rawVal) && rawVal > 0 ? rawVal : Number(p.value);
                    const paymentMethodName = isPix ? 'PIX' : (String(p.billingType || '').toUpperCase() === 'CREDIT_CARD' ? 'Cartão' : (p.billingType || 'PIX'));

                    const cloudState = d1StateMap.get(extRefLow) || d1StateMap.get(paymentIdLow) || null;

                    const orderItem = {
                        id: extRef,
                        orderId: extRef,
                        paymentId: paymentId,
                        clientName: clientName,
                        clientEmail: clientEmail,
                        clientPhone: clientPhone,
                        clientCpf: clientCpf,
                        description: p.description || d1Order?.plan_name || 'Homenagem Reviva Memories',
                        planName: d1Order?.plan_name || p.description || 'Plano Personalizado',
                        value: trueValue,
                        valueFormatted: `R$ ${trueValue.toFixed(2).replace('.', ',')}`,
                        billingType: isPix ? 'PIX' : (p.billingType || 'CREDIT_CARD'),
                        paymentMethod: paymentMethodName,
                        isPaid: isPaid,
                        status: p.status,
                        statusLabel: isPaid ? 'PAGO / CONFIRMADO' : 'AGUARDANDO PAGTO',
                        dateCreated: p.dateCreated || new Date().toISOString(),
                        cloudState: cloudState
                    };

                    // Deduplicação estrita: se já temos esse orderId / externalReference
                    if (ordersByRef.has(extRefLow)) {
                        const existing = ordersByRef.get(extRefLow);
                        const bestIsPaid = Boolean(existing.isPaid || isPaid);
                        const bestStatus = isPaid ? p.status : (existing.isPaid ? existing.status : p.status);
                        const bestClientName = (clientName && clientName !== 'Cliente Reviva') ? clientName : existing.clientName;
                        const bestEmail = clientEmail || existing.clientEmail;
                        const bestPhone = clientPhone || existing.clientPhone;
                        const bestCpf = clientCpf || existing.clientCpf;
                        const bestPaymentId = isPaid ? paymentId : existing.paymentId;
                        const finalVal = (isPix && p.originalValue) ? Number(p.originalValue) : (isPix ? trueValue : (existing.billingType === 'PIX' ? existing.value : trueValue));

                        const merged = {
                            ...existing,
                            ...orderItem,
                            paymentId: bestPaymentId,
                            clientName: bestClientName,
                            clientEmail: bestEmail,
                            clientPhone: bestPhone,
                            clientCpf: bestCpf,
                            isPaid: bestIsPaid,
                            status: bestStatus,
                            statusLabel: bestIsPaid ? 'PAGO / CONFIRMADO' : 'AGUARDANDO PAGTO',
                            value: finalVal,
                            valueFormatted: `R$ ${finalVal.toFixed(2).replace('.', ',')}`,
                            billingType: (isPix || existing.billingType === 'PIX') ? 'PIX' : (orderItem.billingType || existing.billingType),
                            paymentMethod: (isPix || existing.billingType === 'PIX') ? 'PIX' : (orderItem.paymentMethod || existing.paymentMethod),
                            cloudState: cloudState || existing.cloudState || null
                        };
                        ordersByRef.set(extRefLow, merged);
                    } else {
                        ordersByRef.set(extRefLow, orderItem);
                    }
                }

                // Inclui também pedidos que estejam exclusivamente no D1 (não excluídos e não listados pelo Asaas)
                if (env.DB) {
                    for (const [key, d1O] of d1OrdersMap.entries()) {
                        const oIdLow = String(d1O.id || '').toLowerCase().trim();
                        const pIdLow = String(d1O.payment_id || '').toLowerCase().trim();
                        if (deletedSet.has(oIdLow) || deletedSet.has(pIdLow) || ordersByRef.has(oIdLow) || (pIdLow && ordersByRef.has(pIdLow))) {
                            continue;
                        }

                        const d1Prof = d1O.user_id ? d1ProfilesMap.get(String(d1O.user_id).toLowerCase()) : null;
                        const isPaid = d1O.status === 'paid' || d1O.status === 'CONFIRMED' || d1O.status === 'RECEIVED';
                        ordersByRef.set(oIdLow, {
                            id: d1O.id,
                            orderId: d1O.id,
                            paymentId: d1O.payment_id || d1O.id,
                            clientName: d1O.customer_name || 'Cliente Reviva',
                            clientEmail: d1O.customer_email || d1Prof?.email || '',
                            clientPhone: d1Prof?.phone || '',
                            clientCpf: d1O.customer_cpf || '',
                            description: d1O.plan_name || 'Homenagem Reviva Memories',
                            planName: d1O.plan_name || 'Plano Personalizado',
                            value: Number(d1O.amount) || 447.30,
                            valueFormatted: `R$ ${Number(d1O.amount || 447.30).toFixed(2).replace('.', ',')}`,
                            isPaid: isPaid,
                            status: d1O.status,
                            statusLabel: isPaid ? 'PAGO / CONFIRMADO' : 'AGUARDANDO PAGTO',
                            dateCreated: new Date().toISOString()
                        });
                    }
                }

                const formattedOrders = Array.from(ordersByRef.values());
                return new Response(JSON.stringify({ success: true, orders: formattedOrders }), { status: 200, headers: corsHeaders });
            } catch (err) {
                return new Response(JSON.stringify({ success: false, orders: [], error: err?.message || 'Erro ao consultar pedidos' }), { status: 200, headers: corsHeaders });
            }
        }

        // 3.2 ENDPOINT: /api/admin/orders/delete (Exclui pedido definitivamente no D1 e cancela no Asaas)
        if (pathname === '/api/admin/orders/delete' && request.method === 'POST') {
            try {
                const body = await request.json();
                const { id, paymentId, orderId } = body || {};

                if (!id && !paymentId && !orderId) {
                    return new Response(JSON.stringify({ success: false, error: 'Identificador do pedido ausente' }), { status: 400, headers: corsHeaders });
                }

                const nowIso = new Date().toISOString();

                if (env.DB) {
                    try {
                        await env.DB.prepare("CREATE TABLE IF NOT EXISTS deleted_orders (id TEXT PRIMARY KEY, payment_id TEXT, deleted_at TEXT)").run();
                        
                        // Registra exclusivamente o paymentId real do Asaas para evitar colisão com números de pedidos futuros
                        const payTarget = (paymentId && String(paymentId).startsWith('pay_')) ? String(paymentId).trim() : null;
                        if (payTarget) {
                            await env.DB.prepare("INSERT OR REPLACE INTO deleted_orders (id, payment_id, deleted_at) VALUES (?, ?, ?)")
                                .bind(payTarget, payTarget, nowIso).run();
                        }

                        // Remove das tabelas operacionais do D1
                        await env.DB.prepare("DELETE FROM orders WHERE id = ? OR payment_id = ? OR id = ?")
                            .bind(String(id || ''), String(paymentId || ''), String(orderId || '')).run();
                        await env.DB.prepare("DELETE FROM media_uploads WHERE order_id = ? OR order_id = ?")
                            .bind(String(id || ''), String(orderId || '')).run();
                        await env.DB.prepare("DELETE FROM interviews WHERE order_id = ? OR order_id = ?")
                            .bind(String(id || ''), String(orderId || '')).run();
                        await env.DB.prepare("DELETE FROM scripts WHERE order_id = ? OR order_id = ?")
                            .bind(String(id || ''), String(orderId || '')).run();
                        await env.DB.prepare("DELETE FROM approvals WHERE order_id = ? OR order_id = ?")
                            .bind(String(id || ''), String(orderId || '')).run();
                    } catch(d1Err) {
                        console.error('[Worker D1 delete error]:', d1Err);
                    }
                }

                // Tenta cancelar / excluir cobrança pendente no Asaas
                if (paymentId && String(paymentId).startsWith('pay_')) {
                    try {
                        await asaasFetch(`/v3/payments/${paymentId}`, 'DELETE');
                    } catch(asaasErr) {
                        console.warn('[Asaas payment delete info]:', asaasErr?.message || asaasErr);
                    }
                }

                return new Response(JSON.stringify({ success: true, message: 'Pedido excluído definitivamente' }), { status: 200, headers: corsHeaders });
            } catch(err) {
                console.error('[Worker delete order error]:', err);
                return new Response(JSON.stringify({ success: false, error: err?.message || 'Erro ao excluir pedido' }), { status: 500, headers: corsHeaders });
            }
        }

        // 3.3 ENDPOINT: /api/admin/orders/purge (Limpa todos os pedidos de teste)
        if (pathname === '/api/admin/orders/purge' && request.method === 'POST') {
            try {
                const nowIso = new Date().toISOString();

                // Busca pagamentos atuais no Asaas para registrar na tabela de excluídos
                let asaasPayments = [];
                try {
                    const pData = await asaasFetch('/v3/payments?limit=100&order=desc');
                    if (pData && pData.data) asaasPayments = pData.data;
                } catch(e) {}

                if (env.DB) {
                    try {
                        await env.DB.prepare("CREATE TABLE IF NOT EXISTS deleted_orders (id TEXT PRIMARY KEY, payment_id TEXT, deleted_at TEXT)").run();

                        for (const p of asaasPayments) {
                            if (p.id && String(p.id).startsWith('pay_')) {
                                await env.DB.prepare("INSERT OR REPLACE INTO deleted_orders (id, payment_id, deleted_at) VALUES (?, ?, ?)")
                                    .bind(String(p.id).trim(), String(p.id).trim(), nowIso).run();
                            }
                        }

                        const existingOrders = await env.DB.prepare("SELECT id, payment_id FROM orders").all();
                        if (existingOrders && existingOrders.results) {
                            for (const ord of existingOrders.results) {
                                if (ord.payment_id && String(ord.payment_id).startsWith('pay_')) {
                                    await env.DB.prepare("INSERT OR REPLACE INTO deleted_orders (id, payment_id, deleted_at) VALUES (?, ?, ?)")
                                        .bind(String(ord.payment_id).trim(), String(ord.payment_id).trim(), nowIso).run();
                                }
                            }
                        }

                        // Limpa tabelas operacionais do D1
                        await env.DB.prepare("DELETE FROM orders").run();
                        await env.DB.prepare("DELETE FROM media_uploads").run();
                        await env.DB.prepare("DELETE FROM interviews").run();
                        await env.DB.prepare("DELETE FROM scripts").run();
                        await env.DB.prepare("DELETE FROM approvals").run();
                    } catch(d1Err) {
                        console.error('[Worker D1 purge error]:', d1Err);
                    }
                }

                // Tenta cancelar pagamentos pendentes no Asaas
                for (const p of asaasPayments) {
                    if (p.status === 'PENDING' && p.id) {
                        try { await asaasFetch(`/v3/payments/${p.id}`, 'DELETE'); } catch(e) {}
                    }
                }

                return new Response(JSON.stringify({ success: true, message: 'Todos os pedidos de teste foram limpos com sucesso' }), { status: 200, headers: corsHeaders });
            } catch(err) {
                console.error('[Worker purge orders error]:', err);
                return new Response(JSON.stringify({ success: false, error: err?.message || 'Erro ao limpar pedidos' }), { status: 500, headers: corsHeaders });
            }
        }

        // 3.4 ENDPOINT: /api/order/state (Consulta o estado consolidado do pedido no D1)
        if (pathname === '/api/order/state' && request.method === 'GET') {
            try {
                const orderId = (url.searchParams.get('orderId') || '').trim();
                if (!orderId) {
                    return new Response(JSON.stringify({ success: false, error: 'orderId ausente' }), { status: 400, headers: corsHeaders });
                }

                if (!env.DB) {
                    return new Response(JSON.stringify({ success: true, state: null, note: 'DB not configured' }), { status: 200, headers: corsHeaders });
                }

                await env.DB.prepare("CREATE TABLE IF NOT EXISTS order_state (order_id TEXT PRIMARY KEY, state_json TEXT, updated_at TEXT)").run();
                const row = await env.DB.prepare("SELECT state_json, updated_at FROM order_state WHERE order_id = ? OR order_id = ?").bind(orderId, orderId.toLowerCase()).first();

                if (row && row.state_json) {
                    let parsed = null;
                    try { parsed = JSON.parse(row.state_json); } catch(e) {}
                    return new Response(JSON.stringify({ success: true, state: parsed, updatedAt: row.updated_at }), { status: 200, headers: corsHeaders });
                }

                return new Response(JSON.stringify({ success: true, state: null }), { status: 200, headers: corsHeaders });
            } catch(err) {
                console.error('[Worker get order_state error]:', err);
                return new Response(JSON.stringify({ success: false, error: err?.message }), { status: 500, headers: corsHeaders });
            }
        }

        // 3.5 ENDPOINT: /api/order/state (Salva/atualiza o estado consolidado do pedido no D1)
        if (pathname === '/api/order/state' && request.method === 'POST') {
            try {
                const bodyData = await request.json();
                const { orderId, state } = bodyData || {};
                if (!orderId || !state) {
                    return new Response(JSON.stringify({ success: false, error: 'orderId e state são obrigatórios' }), { status: 400, headers: corsHeaders });
                }

                if (!env.DB) {
                    return new Response(JSON.stringify({ success: true, note: 'DB not configured' }), { status: 200, headers: corsHeaders });
                }

                await env.DB.prepare("CREATE TABLE IF NOT EXISTS order_state (order_id TEXT PRIMARY KEY, state_json TEXT, updated_at TEXT)").run();

                // Busca registro anterior para mesclagem inteligente
                let existingState = {};
                try {
                    const existingRow = await env.DB.prepare("SELECT state_json FROM order_state WHERE order_id = ?").bind(orderId).first();
                    if (existingRow && existingRow.state_json) {
                        existingState = JSON.parse(existingRow.state_json) || {};
                    }
                } catch(e) {}

                const mergedState = { ...existingState, ...state };
                const stateJson = JSON.stringify(mergedState);
                const nowIso = new Date().toISOString();

                await env.DB.prepare(
                    `INSERT INTO order_state (order_id, state_json, updated_at) 
                     VALUES (?, ?, ?) 
                     ON CONFLICT(order_id) DO UPDATE SET state_json = excluded.state_json, updated_at = excluded.updated_at`
                ).bind(orderId, stateJson, nowIso).run();

                return new Response(JSON.stringify({ success: true, state: mergedState, updatedAt: nowIso }), { status: 200, headers: corsHeaders });
            } catch(err) {
                console.error('[Worker save order_state error]:', err);
                return new Response(JSON.stringify({ success: false, error: err?.message }), { status: 500, headers: corsHeaders });
            }
        }

        // 4. ENDPOINT: /api/asaas/pay-credit-card
        if (pathname === '/api/asaas/pay-credit-card' && request.method === 'POST') {
            try {
                const bodyData = await request.json();
                const { name, cpf, email, phone, value, orderId, planName, installmentCount, creditCard, creditCardHolderInfo } = bodyData || {};

                if (!name || !cpf || !value || !creditCard) {
                    return new Response(JSON.stringify({ success: false, error: 'Dados obrigatórios incompletos' }), { status: 400, headers: corsHeaders });
                }

                const cleanCpf = cpf.replace(/\D/g, '');
                const cleanPhone = (phone || '').replace(/\D/g, '');
                const installments = parseInt(installmentCount, 10) || 1;

                let customerId = null;
                const searchRes = await asaasFetch(`/v3/customers?cpfCnpj=${cleanCpf}`);
                if (searchRes && searchRes.data && searchRes.data.length > 0) {
                    customerId = searchRes.data[0].id;
                } else {
                    const newCust = await asaasFetch('/v3/customers', 'POST', {
                        name: name.trim(),
                        cpfCnpj: cleanCpf,
                        email: (email || '').trim().toLowerCase(),
                        mobilePhone: cleanPhone || undefined,
                        notificationDisabled: true
                    });
                    customerId = newCust.id;
                }

                const dueDate = new Date().toISOString().split('T')[0];
                const paymentPayload = {
                    customer: customerId,
                    billingType: 'CREDIT_CARD',
                    value: parseFloat(value),
                    dueDate: dueDate,
                    description: `Reviva Memories - ${planName || 'Homenagem'} (${orderId || 'S/N'})`,
                    externalReference: orderId || undefined,
                    creditCard: {
                        holderName: creditCard.holderName,
                        number: creditCard.number.replace(/\D/g, ''),
                        expiryMonth: creditCard.expiryMonth,
                        expiryYear: creditCard.expiryYear,
                        ccv: creditCard.ccv
                    },
                    creditCardHolderInfo: {
                        name: creditCardHolderInfo?.name || name,
                        email: creditCardHolderInfo?.email || email,
                        cpfCnpj: (creditCardHolderInfo?.cpfCnpj || cleanCpf).replace(/\D/g, ''),
                        postalCode: creditCardHolderInfo?.postalCode ? creditCardHolderInfo.postalCode.replace(/\D/g, '') : undefined,
                        addressNumber: creditCardHolderInfo?.addressNumber || undefined,
                        mobilePhone: cleanPhone || undefined
                    }
                };

                if (installments > 1) {
                    paymentPayload.installmentCount = Math.min(installments, 6);
                    paymentPayload.totalValue = parseFloat(value);
                    delete paymentPayload.value;
                }

                const payment = await asaasFetch('/v3/payments', 'POST', paymentPayload);
                const isPaid = payment.status === 'CONFIRMED' || payment.status === 'RECEIVED';

                if (env.DB) {
                    try {
                        await env.DB.prepare("DELETE FROM deleted_orders WHERE id = ? OR payment_id = ?").bind(payment.id, payment.id).run();

                        await env.DB.prepare(
                            `INSERT INTO profiles (id, full_name, email, phone) 
                             VALUES (?, ?, ?, ?) 
                             ON CONFLICT(id) DO UPDATE SET full_name=excluded.full_name, phone=excluded.phone`
                        ).bind(cleanCpf || customerId, name.trim(), email || '', phone || '').run();

                        await env.DB.prepare(
                            `INSERT INTO orders (id, user_id, customer_name, customer_email, customer_cpf, plan_name, status, payment_id, amount) 
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) 
                             ON CONFLICT(id) DO UPDATE SET 
                                    customer_name=excluded.customer_name, 
                                    customer_email=excluded.customer_email, 
                                    customer_cpf=excluded.customer_cpf, 
                                    plan_name=excluded.plan_name, 
                                    status=excluded.status, 
                                    payment_id=excluded.payment_id,
                                    amount=excluded.amount`
                        ).bind(orderId || payment.id, cleanCpf || customerId, name.trim(), email || '', cleanCpf, planName || 'Plano', isPaid ? 'paid' : 'pending', payment.id, parseFloat(value)).run();
                    } catch(e) {}
                }

                return new Response(JSON.stringify({
                    success: true,
                    isPaid: isPaid,
                    status: payment.status,
                    paymentId: payment.id,
                    installmentCount: installments
                }), { status: 200, headers: corsHeaders });

            } catch(err) {
                return new Response(JSON.stringify({
                    success: false,
                    error: err?.message || (err?.errors ? err.errors.map(e => e.description).join('. ') : 'Erro ao processar cartão')
                }), { status: 400, headers: corsHeaders });
            }
        }

        // 4.1 ENDPOINT: /api/media/upload (Upload de arquivos para Cloudflare R2: Fotos, Áudios de 28MB+, Vídeos)
        if (pathname === '/api/media/upload' && request.method === 'POST') {
            try {
                if (!env.MEDIA_BUCKET) {
                    return new Response(JSON.stringify({ success: false, error: 'Storage R2 não configurado no worker' }), { status: 500, headers: corsHeaders });
                }

                const formData = await request.formData();
                const file = formData.get('file');
                const orderId = (formData.get('orderId') || 'general').replace(/[^a-zA-Z0-9_-]/g, '');
                const category = (formData.get('category') || 'media').replace(/[^a-zA-Z0-9_-]/g, ''); // photos, audios, videos, etc.

                if (!file || typeof file === 'string') {
                    return new Response(JSON.stringify({ success: false, error: 'Arquivo inválido ou ausente' }), { status: 400, headers: corsHeaders });
                }

                const ext = file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : 'bin';
                const randomId = Math.random().toString(36).substring(2, 9);
                const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
                const objectKey = `${orderId}/${category}/${Date.now()}_${randomId}_${safeName}`;

                await env.MEDIA_BUCKET.put(objectKey, file.stream(), {
                    httpMetadata: {
                        contentType: file.type || 'application/octet-stream'
                    },
                    customMetadata: {
                        originalName: file.name,
                        orderId: orderId,
                        size: String(file.size),
                        uploadedAt: new Date().toISOString()
                    }
                });

                const publicUrl = `/api/media/${objectKey}`;

                return new Response(JSON.stringify({
                    success: true,
                    url: publicUrl,
                    key: objectKey,
                    name: file.name,
                    size: file.size,
                    type: file.type
                }), { status: 200, headers: corsHeaders });
            } catch (err) {
                console.error('[Worker R2 upload error]:', err);
                return new Response(JSON.stringify({ success: false, error: err?.message || 'Falha no upload para R2' }), { status: 500, headers: corsHeaders });
            }
        }

        // 4.2 ENDPOINT: /api/media/* (Serve arquivos armazenados no Cloudflare R2 com streaming e range requests)
        if (pathname.startsWith('/api/media/') && request.method === 'GET') {
            try {
                if (!env.MEDIA_BUCKET) {
                    return new Response('Storage não disponível', { status: 500 });
                }

                const objectKey = decodeURIComponent(pathname.replace('/api/media/', ''));
                if (!objectKey) {
                    return new Response('Arquivo não especificado', { status: 400 });
                }

                const range = request.headers.get('range');
                const object = await env.MEDIA_BUCKET.get(objectKey, {
                    range: range ? request.headers : undefined,
                    onlyIf: request.headers
                });

                if (!object) {
                    return new Response('Arquivo não encontrado no storage', { status: 404 });
                }

                const headers = new Headers();
                object.writeHttpMetadata(headers);
                headers.set('etag', object.httpEtag);
                headers.set('Access-Control-Allow-Origin', '*');
                headers.set('Cache-Control', 'public, max-age=31536000, immutable');

                if (range && object.range) {
                    headers.set('content-range', `bytes ${object.range.offset}-${object.range.offset + object.range.length - 1}/${object.size}`);
                    return new Response(object.body, { status: 206, headers });
                }

                return new Response(object.body, { headers });
            } catch (err) {
                console.error('[Worker R2 get error]:', err);
                return new Response('Erro ao buscar arquivo no storage', { status: 500 });
            }
        }

        // 5. Se não for endpoint de API, entrega os arquivos estáticos do site (HTML, CSS, imagens, vídeos)
        if (env.ASSETS) {
            // Suporte a rotas limpas: /painel -> painel.html, /admin -> admin.html, /termo -> termo.html
            if (pathname === '/painel' || pathname === '/painel.html') {
                const painelUrl = new URL('/painel.html', request.url);
                return env.ASSETS.fetch(new Request(painelUrl, request));
            }
            if (pathname === '/admin' || pathname === '/admin.html') {
                const adminUrl = new URL('/admin.html', request.url);
                return env.ASSETS.fetch(new Request(adminUrl, request));
            }
            if (pathname === '/termo' || pathname === '/termo.html') {
                const termoUrl = new URL('/termo.html', request.url);
                return env.ASSETS.fetch(new Request(termoUrl, request));
            }
            return env.ASSETS.fetch(request);
        }

        return new Response('Página não encontrada', { status: 404 });
    }
};
