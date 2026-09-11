/**
 * Cloudflare Pages Function: /api/asaas/pay-credit-card
 */
export async function onRequestOptions() {
    return new Response(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST,OPTIONS',
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
        const {
            name,
            cpf,
            email,
            phone,
            value,
            orderId,
            planName,
            installmentCount,
            creditCard,
            creditCardHolderInfo
        } = bodyData || {};

        if (!name || !cpf || !value || !creditCard) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Dados obrigatórios incompletos (nome, cpf, valor ou dados do cartão).'
            }), {
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
        const installments = parseInt(installmentCount, 10) || 1;

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

        // 2. Cobrança de Cartão
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

        // Gravar no Cloudflare D1
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
            } catch(dbErr) {
                console.error('[D1 Card Insertion Warning]:', dbErr);
            }
        }

        return new Response(JSON.stringify({
            success: true,
            isPaid: isPaid,
            status: payment.status,
            paymentId: payment.id,
            installmentCount: installments
        }), {
            status: 200,
            headers: corsHeaders
        });

    } catch (err) {
        console.error('[Cloudflare pay-credit-card error]:', err);
        let errorMsg = 'Não foi possível processar o cartão de crédito.';
        if (err && err.errors && Array.isArray(err.errors) && err.errors.length > 0) {
            errorMsg = err.errors.map(e => e.description).join('. ');
        } else if (err && err.message) {
            errorMsg = err.message;
        }
        return new Response(JSON.stringify({
            success: false,
            error: errorMsg
        }), {
            status: 400,
            headers: corsHeaders
        });
    }
}
