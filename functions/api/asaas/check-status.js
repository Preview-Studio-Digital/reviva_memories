/**
 * Cloudflare Pages Function: /api/asaas/check-status
 */
export async function onRequestOptions() {
    return new Response(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET,OPTIONS',
            'Access-Control-Allow-Headers': '*'
        }
    });
}

export async function onRequestGet(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const paymentId = url.searchParams.get('paymentId') || url.searchParams.get('id');

    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
    };

    if (!paymentId) {
        return new Response(JSON.stringify({ error: 'paymentId obrigatório' }), {
            status: 400,
            headers: corsHeaders
        });
    }

    try {
        const rawKey = env.ASAAS_API_KEY || '';
        const ASAAS_API_KEY = rawKey.replace(/[^\x20-\x7E]/g, '').trim().replace(/^["']|["']$/g, '');
        const ASAAS_HOST = ASAAS_API_KEY.includes('_hmlg_') ? 'https://api-sandbox.asaas.com' : 'https://api.asaas.com';

        const res = await fetch(`${ASAAS_HOST}/v3/payments/${paymentId}`, {
            headers: {
                'access_token': ASAAS_API_KEY,
                'Content-Type': 'application/json',
                'User-Agent': 'RevivaMemories'
            }
        });
        const payment = await res.json();
        if (!res.ok) throw payment;

        const isPaid = payment.status === 'RECEIVED' || payment.status === 'CONFIRMED' || payment.status === 'RECEIVED_IN_CASH';

        // Atualizar status no Cloudflare D1 se estiver pago
        if (isPaid && env.DB) {
            try {
                await env.DB.prepare("UPDATE orders SET status = 'paid' WHERE payment_id = ?").bind(paymentId).run();
            } catch(dbErr) {
                console.error('[D1 Status Update Warning]:', dbErr);
            }
        }

        return new Response(JSON.stringify({
            success: true,
            status: payment.status,
            isPaid: isPaid,
            paymentDate: payment.paymentDate || payment.clientPaymentDate || null
        }), {
            status: 200,
            headers: corsHeaders
        });

    } catch (err) {
        console.error('[Cloudflare check-status error]:', err);
        return new Response(JSON.stringify({
            success: false,
            error: err?.message || 'Erro ao checar status do pagamento'
        }), {
            status: 500,
            headers: corsHeaders
        });
    }
}
