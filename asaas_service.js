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

// Se for chave de homologação/sandbox (_hmlg_), utiliza api-sandbox.asaas.com
const ASAAS_HOST = ASAAS_API_KEY.includes('_hmlg_') ? 'api-sandbox.asaas.com' : 'api.asaas.com';

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
    const isPaid = payment.status === 'RECEIVED' || payment.status === 'CONFIRMED' || payment.status === 'RECEIVED_IN_CASH';
    return {
        id: payment.id,
        status: payment.status, // RECEIVED, CONFIRMED, RECEIVED_IN_CASH, PENDING, etc.
        isPaid: isPaid,
        paymentDate: payment.paymentDate,
        clientPaymentDate: payment.clientPaymentDate
    };
}

// 4. Simular Confirmação de Pagamento no Sandbox (recebimento oficial)
async function simulatePayment(paymentId, value) {
    const today = new Date().toISOString().split('T')[0];
    let payValue = value;
    if (!payValue) {
        try {
            const p = await asaasRequest('GET', `/v3/payments/${paymentId}`);
            if (p && p.value) payValue = p.value;
        } catch(e) {}
    }
    const res = await asaasRequest('POST', `/v3/payments/${paymentId}/receiveInCash`, {
        paymentDate: today,
        value: Number(payValue) || 897
    });
    return res;
}

// 5. Listar cobranças com dados dos clientes para o Painel do Produtor
async function listPayments(limit = 20) {
    const paymentsRes = await asaasRequest('GET', `/v3/payments?limit=${limit}&order=desc`);
    if (!paymentsRes || !paymentsRes.data) return [];

    const list = [];
    for (const p of paymentsRes.data) {
        let customerName = 'Cliente';
        let customerEmail = '';
        let customerPhone = '';
        let customerCpf = '';

        try {
            if (p.customer) {
                const c = await asaasRequest('GET', `/v3/customers/${p.customer}`);
                if (c) {
                    customerName = c.name || customerName;
                    customerEmail = c.email || customerEmail;
                    customerPhone = c.mobilePhone || c.phone || customerPhone;
                    customerCpf = c.cpfCnpj || customerCpf;
                }
            }
        } catch(e) {}

        const isPaid = p.status === 'RECEIVED' || p.status === 'CONFIRMED' || p.status === 'RECEIVED_IN_CASH';

        list.push({
            id: p.id,
            orderId: p.externalReference || p.id,
            status: p.status,
            isPaid: isPaid,
            statusLabel: isPaid ? 'PAGO / CONFIRMADO' : (p.status === 'PENDING' ? 'AGUARDANDO PIX' : p.status),
            value: p.value,
            valueFormatted: `R$ ${Number(p.value).toFixed(2).replace('.', ',')}`,
            description: p.description,
            dateCreated: p.dateCreated,
            clientName: customerName,
            clientEmail: customerEmail,
            clientPhone: customerPhone,
            clientCpf: customerCpf
        });
    }

    return list;
}

module.exports = {
    asaasRequest,
    getOrCreateCustomer,
    createPixPayment,
    checkPaymentStatus,
    simulatePayment,
    listPayments
};
