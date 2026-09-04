/**
 * Vercel Serverless Function: /api/asaas/check-status
 */
const https = require('https');

let rawKey = process.env.ASAAS_API_KEY || '';
try {
    const localCfg = require('../../config.local.js');
    if (localCfg && localCfg.ASAAS_API_KEY) rawKey = localCfg.ASAAS_API_KEY;
} catch(e) {}
const ASAAS_API_KEY = rawKey.replace(/[^\x20-\x7E]/g, '').trim().replace(/^["']|["']$/g, '');
const ASAAS_HOST = ASAAS_API_KEY.includes('_hmlg_') ? 'api-sandbox.asaas.com' : 'api.asaas.com';

function asaasRequest(method, path) {
    return new Promise((resolve, reject) => {
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
        req.end();
    });
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        const paymentId = req.query.paymentId || req.query.id;
        if (!paymentId) {
            return res.status(400).json({ error: 'paymentId obrigatório' });
        }

        const payment = await asaasRequest('GET', `/v3/payments/${paymentId}`);
        const isPaid = payment.status === 'RECEIVED' || payment.status === 'CONFIRMED' || payment.status === 'RECEIVED_IN_CASH';

        return res.status(200).json({
            success: true,
            status: payment.status,
            isPaid: isPaid,
            paymentDate: payment.paymentDate || payment.clientPaymentDate || null
        });
    } catch (err) {
        console.error('[Vercel API check-status error]:', err);
        return res.status(500).json({
            success: false,
            error: err?.message || 'Erro ao checar status do pagamento'
        });
    }
};
