/**
 * Cloudflare Pages Function: /api/asaas/create-pix
 */
export async function onRequestOptions() {
    return new Response(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
            'Access-Control-Allow-Headers': '*'
        }
    });
}

export async function onRequestPost(context) {
    const { request, env } = context;
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
    };

    try {
        const bodyData = await request.json();
        const { name, cpf, email, phone, value, orderId, planName, description } = bodyData;

        if (!name || !cpf || !value) {
            return new Response(JSON.stringify({ error: 'Dados obrigatórios incompletos (name, cpf, value)' }), {
                status: 400,
                headers: corsHeaders
            });
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

        const cleanCpf = cpf.replace(/\D/g, '');
        const cleanPhone = (phone || '').replace(/\D/g, '');

        // 1. Obter ou Criar Cliente
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

        // 2. Criar Cobrança PIX
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

        // 3. Obter QR Code PIX
        const qrData = await asaasFetch(`/v3/payments/${payment.id}/pixQrCode`);

        // 4. Gravar diretamente no Cloudflare D1 se configurado
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
            } catch(dbErr) {
                console.error('[D1 Insertion Warning]:', dbErr);
            }
        }

        return new Response(JSON.stringify({
            success: true,
            paymentId: payment.id,
            invoiceUrl: payment.invoiceUrl,
            encodedImage: qrData.encodedImage,
            payload: qrData.payload,
            expirationDate: qrData.expirationDate
        }), {
            status: 200,
            headers: corsHeaders
        });

    } catch (err) {
        console.error('[Cloudflare create-pix error]:', err);
        return new Response(JSON.stringify({
            success: false,
            error: err?.message || (err?.errors ? err.errors.map(e => e.description).join(', ') : 'Erro ao processar PIX no Asaas')
        }), {
            status: 500,
            headers: corsHeaders
        });
    }
}
