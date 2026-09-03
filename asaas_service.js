/**
 * Reviva Memories - Asaas Integration Service
 * Gerencia a criação de clientes, cobranças PIX e verificação de status.
 */

const https = require('https');

let ASAAS_API_KEY = process.env.ASAAS_API_KEY || '';
try {
    const localCfg = require('./config.local.js');
    if (localCfg && localCfg.ASAAS_API_KEY) {
        ASAAS_API_KEY = localCfg.ASAAS_API_KEY;
    }
} catch(e) {}

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

// 1. Encontrar ou Criar Cliente no Asaas
async function getOrCreateCustomer({ name, cpfCnpj, email, phone }) {
    const cleanCpf = (cpfCnpj || '').replace(/\D/g, '');
    const cleanPhone = (phone || '').replace(/\D/g, '');

    // Buscar se já existe pelo CPF
    try {
        const search = await asaasRequest('GET', `/v3/customers?cpfCnpj=${cleanCpf}`);
        if (search && search.data && search.data.length > 0) {
            return search.data[0].id;
        }
    } catch (e) {
        console.warn('[Asaas] Busca por cliente falhou, criando novo:', e?.message || e);
    }

    // Criar novo cliente
    const newCustomer = await asaasRequest('POST', '/v3/customers', {
        name: name,
        cpfCnpj: cleanCpf,
        email: email,
        mobilePhone: cleanPhone,
        notificationDisabled: false
    });

    return newCustomer.id;
}

// 2. Criar Cobrança PIX e Obter QR Code Oficial
async function createPixPayment({ customerId, value, orderId, planName, description }) {
    // Data de vencimento para amanhã (ou 2 dias)
    const dueDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const payment = await asaasRequest('POST', '/v3/payments', {
        customer: customerId,
        billingType: 'PIX',
        value: Number(value),
        dueDate: dueDate,
        description: description || `Reviva Memories - ${planName} (#${orderId})`,
        externalReference: orderId,
        postalService: false
    });

    // Buscar QR Code e Código Copia-e-Cola do PIX
    const pixData = await asaasRequest('GET', `/v3/payments/${payment.id}/pixQrCode`);

    return {
        paymentId: payment.id,
        invoiceUrl: payment.invoiceUrl,
        value: payment.value,
        status: payment.status,
        encodedImage: pixData.encodedImage, // base64 da imagem do QR Code
        payload: pixData.payload,           // string "Copia e Cola" do PIX
        expirationDate: pixData.expirationDate
    };
}

// 3. Consultar Status do Pagamento
async function checkPaymentStatus(paymentId) {
    const payment = await asaasRequest('GET', `/v3/payments/${paymentId}`);
    return {
        id: payment.id,
        status: payment.status, // RECEIVED, CONFIRMED, PENDING, etc.
        isPaid: payment.status === 'RECEIVED' || payment.status === 'CONFIRMED',
        paymentDate: payment.paymentDate,
        clientPaymentDate: payment.clientPaymentDate
    };
}

module.exports = {
    asaasRequest,
    getOrCreateCustomer,
    createPixPayment,
    checkPaymentStatus
};
