/**
 * Vercel Serverless Function: /api/asaas/pay-credit-card
 * Processa pagamento com Cartão de Crédito de forma transparente diretamente via API Asaas
 */
const https = require('https');

const rawKey = process.env.ASAAS_API_KEY || '';
const ASAAS_API_KEY = rawKey.replace(/[^\x20-\x7E]/g, '').trim().replace(/^["']|["']$/g, '');
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
        } = bodyData;

        if (!name || !cpf || !value || !creditCard) {
            return res.status(400).json({
                success: false,
                error: 'Dados obrigatórios incompletos (nome, cpf, valor ou dados do cartão).'
            });
        }

        const cleanCpf = cpf.replace(/\D/g, '');
        const cleanPhone = (phone || '').replace(/\D/g, '');
        const installments = parseInt(installmentCount, 10) || 1;

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

        // 2. Data de Vencimento
        const dueDate = new Date().toISOString().split('T')[0];

        // 3. Montar Cobrança de Cartão de Crédito
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

        // Adiciona parcelamento se for > 1
        if (installments > 1) {
            paymentPayload.installmentCount = Math.min(installments, 6);
            paymentPayload.totalValue = parseFloat(value);
            delete paymentPayload.value;
        }

        const payment = await asaasRequest('POST', '/v3/payments', paymentPayload);

        const isPaid = payment.status === 'CONFIRMED' || payment.status === 'RECEIVED';

        return res.status(200).json({
            success: true,
            isPaid: isPaid,
            status: payment.status,
            paymentId: payment.id,
            installmentCount: installments
        });

    } catch (err) {
        console.error('[Asaas Credit Card Error]:', err);
        let errorMsg = 'Não foi possível processar o cartão de crédito.';
        if (err && err.errors && Array.isArray(err.errors) && err.errors.length > 0) {
            errorMsg = err.errors.map(e => e.description).join('. ');
        } else if (err && err.message) {
            errorMsg = err.message;
        }
        return res.status(400).json({
            success: false,
            error: errorMsg
        });
    }
};
