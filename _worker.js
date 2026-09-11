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
                        await env.DB.prepare(
                            `INSERT INTO profiles (id, full_name, email, phone) 
                             VALUES (?, ?, ?, ?) 
                             ON CONFLICT(id) DO UPDATE SET full_name=excluded.full_name, phone=excluded.phone`
                        ).bind(cleanCpf || customerId, name.trim(), email || '', phone || '').run();

                        await env.DB.prepare(
                            `INSERT INTO orders (id, user_id, customer_name, customer_email, customer_cpf, plan_name, status, payment_id, amount) 
                             VALUES (?, ?, ?, ?, ?, ?, 'pending_pix', ?, ?) 
                             ON CONFLICT(id) DO UPDATE SET status='pending_pix', payment_id=excluded.payment_id`
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
                const resSim = await asaasFetch(`/v3/payments/${paymentId}/receiveInCash`, 'POST', {
                    paymentDate: today,
                    value: body.value || 897
                });

                if (env.DB) {
                    try {
                        await env.DB.prepare("UPDATE orders SET status = 'paid' WHERE payment_id = ?").bind(paymentId).run();
                    } catch(e) {}
                }

                return new Response(JSON.stringify({ success: true, ...resSim }), { status: 200, headers: corsHeaders });
            } catch(err) {
                return new Response(JSON.stringify({ success: false, error: err?.message || 'Erro ao simular' }), { status: 500, headers: corsHeaders });
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
                        await env.DB.prepare(
                            `INSERT INTO profiles (id, full_name, email, phone) 
                             VALUES (?, ?, ?, ?) 
                             ON CONFLICT(id) DO UPDATE SET full_name=excluded.full_name, phone=excluded.phone`
                        ).bind(cleanCpf || customerId, name.trim(), email || '', phone || '').run();

                        await env.DB.prepare(
                            `INSERT INTO orders (id, user_id, customer_name, customer_email, customer_cpf, plan_name, status, payment_id, amount) 
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) 
                             ON CONFLICT(id) DO UPDATE SET status=excluded.status, payment_id=excluded.payment_id`
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

        // 5. Se não for endpoint de API, entrega os arquivos estáticos do site (HTML, CSS, imagens, vídeos)
        if (env.ASSETS) {
            // Suporte a rotas limpas: /painel -> painel.html
            if (pathname === '/painel') {
                const painelUrl = new URL('/painel.html', request.url);
                return env.ASSETS.fetch(new Request(painelUrl, request));
            }
            return env.ASSETS.fetch(request);
        }

        return new Response('Página não encontrada', { status: 404 });
    }
};
