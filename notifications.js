/**
 * Reviva Memories - Sistema de Notificações Transacionais Pós-Compra
 * E-mail de Boas-Vindas & Disparo Oficial no WhatsApp do Cliente
 */

(function(window) {
    'use strict';

    try { if (window.emailjs) window.emailjs.init({ publicKey: 'cJK5bgnd3WLyMAq43' }); } catch(e) {}

    const NOTIFICATIONS = {
        config: {
            supportPhone: '5531995701447',
            supportPhoneFormatted: '(31) 99570-1447',
            supportEmail: 'contato@revivamemories.com.br',
            websiteUrl: 'https://revivamemories.com.br',
            emailjsServiceId: 'service_48cpts2',
            emailjsTemplateId: 'template_royargg',
            emailjsPublicKey: 'cJK5bgnd3WLyMAq43',
            // Configurações da Meta Cloud API Oficial (WhatsApp Business)
            metaPhoneNumberId: '1371114042741994',
            metaApiToken: 'EAAdO0uIExdUBSfG8dMGS2G0XINniMyi4AZCZAJn5JsbpuVELMzHbZCyQzdBXyX3wkP2TCCpobvsBXjo2yUeVIDUvHB3NnN0DHSU7hRQqmhsvr7u1ZAkQWHkz7WTR5Njqpm5AZClmrUMWlEDLdvD15z1jpR6y5wj4WRZByfk2EjALHIhl4vOZAR25fNCrHPnNHWahV5kSecRoZAv9e8aV6ZBQSlGNaYGLS6pPjBRVLD8jt0XoNg4c16LuxjJ2qnhFuNFqvqCidBcymMOMYvvZC7ZAhNTKOhc',
            metaTemplateName: 'confirmacao_pedido_reviva'
        },

        /**
         * Gera o texto formatado para envio direto via WhatsApp
         */
        generateWhatsAppMessage(orderData, clientData) {
            const name = (clientData?.name || orderData?.customer_name || 'Cliente').trim();
            const orderId = orderData?.order_id || 'REVIVA-1001';
            const planName = orderData?.plan_name || 'Plano Legatum';
            const duration = orderData?.plan_duration || '2 Minutos';
            const format = orderData?.plan_format || 'Formato Horizontal';
            const price = orderData?.total_price || 'R$ 897,00';
            const cpf = (clientData?.cpf || orderData?.customer_cpf || '').trim();
            const origin = window.location.origin || this.config.websiteUrl;
            const loginLink = `${origin}/login.html`;
            const dateStr = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

            return `*REVIVA MEMORIES | CONFIRMAÇÃO DO SEU PEDIDO*\n\n` +
                   `Olá, *${name}*! É uma imensa honra acolher você e sua família.\n\n` +
                   `Confirmamos o recebimento do seu pedido para a criação da sua homenagem afetiva!\n\n` +
                   `*RESUMO DA CONTRATAÇÃO:*\n` +
                   `• *Código do Pedido:* \`${orderId}\`\n` +
                   `• *Plano:* ${planName}\n` +
                   `• *Especificações:* ${duration} • ${format}\n` +
                   `• *Investimento Total:* ${price}\n` +
                   `• *Data de Aprovação:* ${dateStr}\n` +
                   `• *Status:* Pagamento Confirmado\n\n` +
                   `*COMO ACESSAR O SEU PAINEL EXCLUSIVO:*\n` +
                   `1. Acesse o link oficial: ${loginLink}\n` +
                   `2. Informe o seu CPF cadastrado: *${cpf}*\n` +
                   `3. Você poderá enviar as fotos e áudios do ente querido no seu ritmo, com tranquilidade pelo painel.\n\n` +
                   `*SUPORTE WHATSAPP:*\n` +
                   `Nossa equipe já está a postos. Caso tenha qualquer dúvida, estamos sempre à disposição!\n\n` +
                   `Com profundo afeto e respeito,\n` +
                   `*Equipe Reviva Memories*`;
        },

        /**
         * Gera a URL para abertura direta do WhatsApp
         */
        getWhatsAppUrl(phone, orderData, clientData) {
            let cleanPhone = (phone || '').replace(/\D/g, '');
            if (!cleanPhone) cleanPhone = this.config.supportPhone;
            if (!cleanPhone.startsWith('55') && cleanPhone.length <= 11) {
                cleanPhone = '55' + cleanPhone;
            }
            const msg = this.generateWhatsAppMessage(orderData, clientData);
            return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
        },

        /**
         * Gera o HTML completo do E-mail Transacional de Boas-Vindas
         */
        generateEmailHtml(orderData, clientData) {
            const name = (clientData?.name || orderData?.customer_name || 'Cliente').trim();
            const orderId = orderData?.order_id || 'REVIVA-1001';
            const planName = orderData?.plan_name || 'Plano Legatum';
            const duration = orderData?.plan_duration || '2 Minutos';
            const format = orderData?.plan_format || 'Formato Horizontal';
            const price = orderData?.total_price || 'R$ 897,00';
            const cpf = (clientData?.cpf || orderData?.customer_cpf || '').trim();
            const origin = window.location.origin || this.config.websiteUrl;
            const loginLink = `${origin}/login.html`;
            const dateStr = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

            return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Confirmação de Pedido - Reviva Memories</title>
</head>
<body style="margin:0; padding:24px 10px; background-color:#050302; font-family:'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color:#fdf6ec; -webkit-font-smoothing:antialiased;">
  <div style="max-width:600px; margin:0 auto; background:#0e0906; border:1px solid #c5a059; border-radius:12px; overflow:hidden; box-shadow:0 12px 50px rgba(0,0,0,0.85);">
    
    <!-- Cabeçalho Dourado / Nobre com Logotipo Centralizado -->
    <div style="background:linear-gradient(180deg, #1b110b 0%, #0e0906 100%); padding:32px 24px 24px 24px; text-align:center; border-bottom:1px solid rgba(197, 160, 89, 0.35);">
      <img src="${origin && !origin.startsWith('file:') ? origin : 'https://revivamemories.com.br'}/logo.png" alt="Reviva Memories" style="height:52px; width:auto; margin:0 auto 10px auto; display:block; filter:drop-shadow(0 2px 8px rgba(0,0,0,0.8));">
      <div style="font-family:'Cormorant Garamond', Georgia, serif; font-style:italic; font-size:15px; color:#e5c378; letter-spacing:1px; margin-bottom:4px;">Memórias que transcendem o tempo.</div>
    </div>

    <!-- Faixa de Confirmação de Pagamento -->
    <div style="background:rgba(34, 197, 94, 0.15); border-bottom:1px solid rgba(74, 222, 128, 0.35); padding:12px 20px; text-align:center;">
      <span style="color:#4ade80; font-weight:700; font-size:13px; letter-spacing:0.8px; text-transform:uppercase;">
        Pagamento Confirmado & Pedido em Andamento
      </span>
    </div>

    <!-- Conteúdo Principal -->
    <div style="padding:28px 24px; font-size:14.5px; line-height:1.65; color:#e2e8f0;">
      <p style="margin-top:0; font-size:16px;">Olá, <strong style="color:#f6e3c5;">${name}</strong>!</p>
      
      <p>É uma imensa honra acolher você na <strong>Reviva Memories</strong>. Recebemos a confirmação do seu pedido e nossa equipe já está pronta para conduzir a produção da sua homenagem com profundo respeito e sensibilidade.</p>

      <!-- Card Resumo do Pedido -->
      <div style="background:rgba(197, 160, 89, 0.08); border:1px solid rgba(197, 160, 89, 0.35); border-radius:8px; padding:18px 20px; margin:22px 0;">
        <div style="font-family:Georgia, serif; font-size:16px; color:#f6e3c5; font-weight:700; text-transform:uppercase; letter-spacing:1px; margin-bottom:12px; border-bottom:1px solid rgba(197, 160, 89, 0.2); padding-bottom:6px;">
          Detalhes do Pedido
        </div>
        <table style="width:100%; border-collapse:collapse; font-size:13.5px; color:#e2e8f0;">
          <tr>
            <td style="padding:5px 0; color:#94a3b8;">Número do Pedido:</td>
            <td style="padding:5px 0; text-align:right; font-weight:700; color:#f6e3c5; font-family:monospace; font-size:14px;">${orderId}</td>
          </tr>
          <tr>
            <td style="padding:5px 0; color:#94a3b8;">Plano Escolhido:</td>
            <td style="padding:5px 0; text-align:right; font-weight:700; color:#e5c378;">${planName}</td>
          </tr>
          <tr>
            <td style="padding:5px 0; color:#94a3b8;">Formato & Duração:</td>
            <td style="padding:5px 0; text-align:right; color:#f1f5f9;">${duration} • ${format}</td>
          </tr>
          <tr>
            <td style="padding:5px 0; color:#94a3b8;">Valor Total:</td>
            <td style="padding:5px 0; text-align:right; font-weight:800; color:#4ade80; font-size:15px;">${price}</td>
          </tr>
          <tr>
            <td style="padding:5px 0; color:#94a3b8;">Data da Compra:</td>
            <td style="padding:5px 0; text-align:right; color:#cbd5e1;">${dateStr}</td>
          </tr>
        </table>
      </div>

      <!-- Caixa de Instruções de Acesso -->
      <div style="background:rgba(0, 0, 0, 0.55); border-left:4px solid #c5a059; padding:18px; border-radius:0 8px 8px 0; margin-bottom:24px;">
        <div style="color:#e5c378; font-size:13.5px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px;">
          Como Acessar o Seu Painel Exclusivo
        </div>
        <p style="margin:0 0 14px 0; font-size:13px; color:#cbd5e1; line-height:1.5;">
          O seu acesso está vinculado ao seu CPF: <strong style="color:#fff; font-family:monospace;">${cpf}</strong>.<br>
          Clique no botão abaixo para dar início ao processo agora mesmo:
        </p>
        <div style="text-align:center;">
          <a href="${loginLink}" style="display:inline-block; background:linear-gradient(135deg, #c5a059 0%, #9c7247 100%); color:#ffffff; text-decoration:none; font-weight:700; font-size:13px; padding:12px 26px; border-radius:6px; letter-spacing:0.8px; text-transform:uppercase; box-shadow:0 4px 15px rgba(197, 160, 89, 0.4);">
            ACESSAR MEU PAINEL AGORA
          </a>
        </div>
      </div>

      <!-- Bloco de Suporte -->
      <div style="background:rgba(14, 9, 6, 0.7); border:1px solid rgba(197, 160, 89, 0.25); border-radius:8px; padding:14px 16px; text-align:center; font-size:12.5px;">
        <p style="margin:0 0 6px 0; color:#94a3b8;">Precisa de ajuda ou tem alguma dúvida?</p>
        <a href="https://wa.me/${this.config.supportPhone}?text=${encodeURIComponent('Olá! Acabei de realizar a compra da homenagem na Reviva Memories (Pedido: ' + orderId + ') e gostaria de suporte.')}" style="color:#4ade80; font-weight:700; text-decoration:none;">
          Suporte WhatsApp: ${this.config.supportPhoneFormatted}
        </a>
      </div>

      <div style="margin-top:24px; text-align:center; color:#94a3b8; font-size:13px;">
        Com profunda estima e carinho,<br>
        <strong style="color:#f6e3c5; font-family:Georgia, serif; font-size:16px;">Equipe Reviva Memories</strong>
      </div>
    </div>

    <!-- Rodapé -->
    <div style="background:#070403; padding:18px; text-align:center; font-size:11px; color:#64748b; border-top:1px solid rgba(197, 160, 89, 0.2);">
      <p style="margin:0 0 4px 0;">Reviva Memories © 2026. Todos os direitos reservados.</p>
      <p style="margin:0;">Produção humanizada de memórias afetivas com respeito, sigilo e segurança.</p>
    </div>
  </div>
</body>
</html>`;
        },

        /**
         * Gera o texto puro do e-mail (para fallback ou cópia)
         */
        generateEmailText(orderData, clientData) {
            const name = (clientData?.name || orderData?.customer_name || 'Cliente').trim();
            const orderId = orderData?.order_id || 'REVIVA-1001';
            const planName = orderData?.plan_name || 'Plano Legatum';
            const duration = orderData?.plan_duration || '2 Minutos';
            const format = orderData?.plan_format || 'Formato Horizontal';
            const price = orderData?.total_price || 'R$ 897,00';
            const cpf = (clientData?.cpf || orderData?.customer_cpf || '').trim();
            const origin = window.location.origin || this.config.websiteUrl;
            const loginLink = `${origin}/login.html`;

            return `REVIVA MEMORIES | CONFIRMAÇÃO DE PEDIDO\n` +
                   `===================================================\n\n` +
                   `Olá, ${name}!\n\n` +
                   `É uma imensa honra acolher você na Reviva Memories. Recebemos a confirmação do seu pedido e nossa equipe já está pronta para conduzir a produção da sua homenagem com profundo respeito e sensibilidade.\n\n` +
                   `DETALHES DO PEDIDO:\n` +
                   `- Número do Pedido: ${orderId}\n` +
                   `- Plano Contratado: ${planName}\n` +
                   `- Formato: ${duration} • ${format}\n` +
                   `- Valor: ${price}\n` +
                   `- Status: Pagamento Confirmado\n\n` +
                   `COMO ACESSAR SEU PAINEL EXCLUSIVO:\n` +
                   `Acesse: ${loginLink}\n` +
                   `Chave de Acesso: CPF ${cpf}\n\n` +
                   `SUPORTE WHATSAPP: ${this.config.supportPhoneFormatted}\n` +
                   `E-MAIL: ${this.config.supportEmail}\n\n` +
                   `Equipe Reviva Memories`;
        },

        /**
         * Dispara o envio do E-mail e registra o histórico local
         */
        sendWelcomeNotifications(orderData, clientData) {
            const html = this.generateEmailHtml(orderData, clientData);
            const text = this.generateEmailText(orderData, clientData);
            const waMsg = this.generateWhatsAppMessage(orderData, clientData);
            const waUrl = this.getWhatsAppUrl(clientData?.phone || orderData?.customer_phone, orderData, clientData);

            const payload = {
                orderId: orderData?.order_id,
                customerName: clientData?.name || orderData?.customer_name,
                customerEmail: clientData?.email || orderData?.customer_email,
                customerPhone: clientData?.phone || orderData?.customer_phone,
                customerCpf: clientData?.cpf || orderData?.customer_cpf,
                planName: orderData?.plan_name,
                totalPrice: orderData?.total_price,
                htmlContent: html,
                textContent: text,
                whatsAppMessage: waMsg,
                whatsAppUrl: waUrl,
                sentAt: new Date().toISOString()
            };

            // 1. Armazenar no localStorage para histórico e prévia
            try {
                (window.localStorage || localStorage).setItem('reviva_last_sent_email', JSON.stringify(payload));
                
                const rawHistory = (window.localStorage || localStorage).getItem('reviva_email_history');
                const history = rawHistory ? JSON.parse(rawHistory) : [];
                history.unshift(payload);
                if (history.length > 20) history.pop();
                (window.localStorage || localStorage).setItem('reviva_email_history', JSON.stringify(history));
            } catch(e) {
                console.warn('[Reviva Notifications] Erro ao salvar histórico local:', e);
            }

            // 2. Disparo via EmailJS
            if (window.emailjs) {
                try {
                    // Inicializar SDK v4 explicitamente com objeto
                    window.emailjs.init({
                        publicKey: this.config.emailjsPublicKey
                    });

                    const templateParams = {
                        to_name: payload.customerName,
                        name: payload.customerName,
                        to_email: payload.customerEmail,
                        email: payload.customerEmail,
                        user_email: payload.customerEmail,
                        recipient: payload.customerEmail,
                        reply_to: 'contato@revivamemories.com.br',
                        customer_cpf: payload.customerCpf,
                        customer_phone: payload.customerPhone,
                        order_id: payload.orderId,
                        plan_name: payload.planName,
                        total_price: payload.totalPrice,
                        access_link: `${window.location.origin || this.config.websiteUrl}/login.html`,
                        email_html_body: html,
                        message: text
                    };

                    console.log('🚀 [Reviva Notifications] Disparando e-mail para:', payload.customerEmail);

                    window.emailjs.send(
                        this.config.emailjsServiceId,
                        this.config.emailjsTemplateId,
                        templateParams,
                        { publicKey: this.config.emailjsPublicKey }
                    ).then((response) => {
                        console.log('✨ [Reviva Notifications] E-mail oficial de boas-vindas enviado com SUCESSO via EmailJS!', response.status, response.text);
                        const statusEl = document.getElementById('email-delivery-status-tag');
                        if (statusEl) {
                            statusEl.innerHTML = '<span style="color:#4ade80; font-weight:700;">✓ E-mail Entregue com Sucesso pelo Gmail (200 OK)</span>';
                        }
                    }).catch(err => {
                        console.error('❌ [Reviva Notifications] Falha ao enviar via EmailJS:', err);
                        const statusEl = document.getElementById('email-delivery-status-tag');
                        if (statusEl) {
                            const errDesc = err?.text || err?.message || JSON.stringify(err);
                            statusEl.innerHTML = '<span style="color:#f87171; font-weight:700;">⚠️ Erro no envio do e-mail: ' + errDesc + '</span>';
                        }
                    });
                } catch(err) {
                    console.error('❌ [Reviva Notifications] Erro na chamada do EmailJS:', err);
                }
            } else {
                console.warn('⚠️ [Reviva Notifications] window.emailjs não encontrado no DOM.');
            }

            // 3. Disparo Automático 100% em Segundo Plano via Meta Cloud API Oficial (WhatsApp Business)
            this.sendMetaWhatsAppNotification(payload);

            return payload;
        },

        /**
         * Disparo 100% Autônomo e Silencioso via Meta Cloud API (WhatsApp Oficial)
         */
        async sendMetaWhatsAppNotification(payload) {
            const phoneId = this.config.metaPhoneNumberId;
            const token = this.config.metaApiToken;

            // Se as chaves ainda não foram cadastradas pelo produtor, loga simulação no console
            if (!phoneId || !token) {
                console.log('%c[Meta WhatsApp API] Modo de Pré-configuração Ativo', 'color: #38bdf8; font-weight: bold;');
                console.log('Mensagem pronta para entrega automática via Meta Cloud API para:', payload.customerPhone);
                console.log('Conteúdo:', payload.whatsAppMessage);
                return { success: true, simulated: true };
            }

            // Normaliza o telefone para formato internacional (ex: 5531999999999)
            let recipient = (payload.customerPhone || '').replace(/\D/g, '');
            if (!recipient.startsWith('55') && recipient.length <= 11) {
                recipient = '55' + recipient;
            }

            try {
                const endpoint = `https://graph.facebook.com/v20.0/${phoneId}/messages`;
                
                // Disparo com template oficial ou texto direto
                const bodyPayload = {
                    messaging_product: 'whatsapp',
                    recipient_type: 'individual',
                    to: recipient,
                    type: 'text',
                    text: {
                        preview_url: true,
                        body: payload.whatsAppMessage
                    }
                };

                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(bodyPayload)
                });

                const data = await response.json();
                if (response.ok) {
                    console.log('✨ [Meta WhatsApp API] Mensagem entregue com SUCESSO no celular do cliente!', data);
                    return { success: true, data };
                } else {
                    console.warn('⚠️ [Meta WhatsApp API] Resposta da Meta:', data);
                    return { success: false, error: data };
                }
            } catch (err) {
                console.error('❌ [Meta WhatsApp API] Erro na conexão com os servidores da Meta:', err);
                return { success: false, error: err };
            }
        }
    };

    // Expor no escopo global
    window.RevivaNotifications = NOTIFICATIONS;
    window.generateWelcomeEmailHtml = (order, client) => NOTIFICATIONS.generateEmailHtml(order, client);
    window.generateWelcomeEmailText = (order, client) => NOTIFICATIONS.generateEmailText(order, client);
    window.generateWelcomeWhatsAppMessage = (order, client) => NOTIFICATIONS.generateWhatsAppMessage(order, client);
    window.getWelcomeWhatsAppUrl = (phone, order, client) => NOTIFICATIONS.getWhatsAppUrl(phone, order, client);
    window.sendPostPurchaseWelcomeNotifications = (order, client) => NOTIFICATIONS.sendWelcomeNotifications(order, client);

    /**
     * Abre o modal de visualização e cópia do e-mail enviado
     */
    window.openEmailPreviewModal = function(orderDataCustom) {
        let payload = null;
        try {
            if (orderDataCustom) {
                payload = {
                    customerEmail: orderDataCustom.customer_email,
                    htmlContent: NOTIFICATIONS.generateEmailHtml(orderDataCustom, { name: orderDataCustom.customer_name, cpf: orderDataCustom.customer_cpf, email: orderDataCustom.customer_email, phone: orderDataCustom.customer_phone }),
                    textContent: NOTIFICATIONS.generateEmailText(orderDataCustom, { name: orderDataCustom.customer_name, cpf: orderDataCustom.customer_cpf, email: orderDataCustom.customer_email, phone: orderDataCustom.customer_phone })
                };
            } else {
                const raw = (window.localStorage || localStorage).getItem('reviva_last_sent_email');
                if (raw) payload = JSON.parse(raw);
                else {
                    const rawOrder = (window.localStorage || localStorage).getItem('reviva_order_data');
                    if (rawOrder) {
                        const ord = JSON.parse(rawOrder);
                        payload = {
                            customerEmail: ord.customer_email,
                            htmlContent: NOTIFICATIONS.generateEmailHtml(ord, { name: ord.customer_name, cpf: ord.customer_cpf, email: ord.customer_email, phone: ord.customer_phone }),
                            textContent: NOTIFICATIONS.generateEmailText(ord, { name: ord.customer_name, cpf: ord.customer_cpf, email: ord.customer_email, phone: ord.customer_phone })
                        };
                    }
                }
            }
        } catch(e) {}

        if (!payload) {
            alert('Nenhum e-mail registrado recentemente.');
            return;
        }

        let modal = document.getElementById('modal-email-preview-global');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'modal-email-preview-global';
            modal.style.cssText = 'position:fixed; inset:0; background:rgba(5,3,2,0.92); backdrop-filter:blur(14px); z-index:100010; display:flex; align-items:center; justify-content:center; padding:16px;';
            document.body.appendChild(modal);
        }

        modal.innerHTML = `
            <div style="width:100%; max-width:680px; background:rgba(14,9,6,0.98); border:1.5px solid var(--border-gold, #c5a059); border-radius:12px; padding:22px 24px; box-shadow:0 0 50px rgba(0,0,0,0.95); max-height:90vh; display:flex; flex-direction:column; gap:14px; position:relative;">
                
                <div style="display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid rgba(197,160,89,0.3); padding-bottom:10px;">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <i data-lucide="mail" style="width:20px; height:20px; color:#e5c378;"></i>
                        <strong style="font-family:'Cormorant Garamond', Georgia, serif; font-size:1.2rem; color:#f6e3c5;">Cópia do E-mail Transacional de Boas-Vindas</strong>
                    </div>
                    <button type="button" onclick="closeEmailPreviewModal()" style="background:none; border:none; color:#94a3b8; font-size:22px; cursor:pointer; padding:2px;">✕</button>
                </div>

                <div style="display:flex; align-items:center; justify-content:space-between; background:rgba(197,160,89,0.1); border:1px solid rgba(197,160,89,0.25); border-radius:6px; padding:8px 12px; font-size:0.76rem; color:#cbd5e1;">
                    <div><strong>Destinatário:</strong> ${payload.customerEmail || 'cliente@exemplo.com'}</div>
                    <div style="color:#4ade80; font-weight:700;">✓ Template Renderizado</div>
                </div>

                <!-- Preview Container -->
                <div id="email-preview-frame-container" style="flex:1; max-height:55vh; overflow-y:auto; background:#050302; border:1px solid rgba(197,160,89,0.3); border-radius:8px; padding:12px;">
                    ${payload.htmlContent}
                </div>

                <!-- Botões de Ação -->
                <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; margin-top:4px;">
                    <button type="button" onclick="copyEmailTextPayload()" style="background:rgba(197,160,89,0.15); border:1px solid rgba(197,160,89,0.4); color:#f6e3c5; border-radius:6px; padding:9px 10px; font-size:0.75rem; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px;">
                        <i data-lucide="copy" style="width:14px; height:14px;"></i> COPIAR TEXTO
                    </button>
                    <button type="button" onclick="copyEmailHtmlPayload()" style="background:rgba(197,160,89,0.15); border:1px solid rgba(197,160,89,0.4); color:#f6e3c5; border-radius:6px; padding:9px 10px; font-size:0.75rem; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px;">
                        <i data-lucide="code" style="width:14px; height:14px;"></i> COPIAR HTML
                    </button>
                    <button type="button" onclick="closeEmailPreviewModal()" style="background:linear-gradient(135deg, #c5a059 0%, #9c7247 100%); border:1px solid #e5c378; color:#fff; border-radius:6px; padding:9px 10px; font-size:0.75rem; font-weight:700; cursor:pointer;">
                        FECHAR
                    </button>
                </div>
            </div>
        `;

        modal.style.display = 'flex';
        if (window.lucide) lucide.createIcons();
    };

    window.closeEmailPreviewModal = function() {
        const modal = document.getElementById('modal-email-preview-global');
        if (modal) modal.style.display = 'none';
    };

    window.copyEmailTextPayload = function() {
        try {
            const raw = (window.localStorage || localStorage).getItem('reviva_last_sent_email');
            if (raw) {
                const p = JSON.parse(raw);
                navigator.clipboard?.writeText(p.textContent || '').then(() => {
                    alert('✓ Texto do e-mail copiado para a área de transferência!');
                });
            }
        } catch(e) {}
    };

    window.copyEmailHtmlPayload = function() {
        try {
            const raw = (window.localStorage || localStorage).getItem('reviva_last_sent_email');
            if (raw) {
                const p = JSON.parse(raw);
                navigator.clipboard?.writeText(p.htmlContent || '').then(() => {
                    alert('✓ Código HTML do e-mail copiado com sucesso!');
                });
            }
        } catch(e) {}
    };

})(window);
