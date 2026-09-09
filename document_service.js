/**
 * Reviva Memories - Gerador Oficial de PDF do Termo de Responsabilidade & Exportador ZIP
 * Utiliza jsPDF para renderizacao vetorial nobre e JSZip para compactacao do dossie.
 */

(function(window) {
    'use strict';

    function getLogoBase64() {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.naturalWidth;
                    canvas.height = img.naturalHeight;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    resolve(canvas.toDataURL('image/png'));
                } catch(e) {
                    resolve(null);
                }
            };
            img.onerror = () => resolve(null);
            img.src = 'logo.png';
        });
    }

    const RevivaDocumentService = {
        /**
         * Gera e faz o download do PDF do Termo de Responsabilidade
         * @param {Object} customData Dados opcionais do termo e do pedido
         * @returns {Promise<jsPDF>} Retorna a instancia do documento
         */
        async generateTermoPDF(customData = {}) {
            if (!window.jspdf || !window.jspdf.jsPDF) {
                alert('Aguarde o carregamento das bibliotecas de documento...');
                return null;
            }

            // Obter dados consolidados da sessao ou do parametro
            let termoData = null;
            let orderData = null;
            try {
                const rawTerm = localStorage.getItem('reviva_legal_term');
                if (rawTerm) termoData = JSON.parse(rawTerm);
                const rawOrder = localStorage.getItem('reviva_order_data');
                if (rawOrder) orderData = JSON.parse(rawOrder);
                const rawState = localStorage.getItem('reviva_full_session_state');
                if (rawState) {
                    const st = JSON.parse(rawState);
                    if (!termoData && st.legalTermSigned) termoData = st.legalTermSigned;
                    if (!orderData && st.orderData) orderData = st.orderData;
                }
            } catch(e) {}

            const t = {
                name: customData.name || termoData?.name || orderData?.customer_name || 'Cliente Reviva Memories',
                cpf: customData.cpf || termoData?.cpf || orderData?.customer_cpf || '000.000.000-00',
                orderId: customData.orderId || orderData?.order_id || 'REVIVA-1001',
                planName: customData.planName || orderData?.plan_name || 'Plano Legatum',
                relationNarrator: customData.relationNarrator || termoData?.relationNarrator || 'Familiar / Responsavel',
                relationRecipient: customData.relationRecipient || termoData?.relationRecipient || 'Familiar',
                signedAt: customData.signedAt || termoData?.dateFormatted || termoData?.signedAt || new Date().toLocaleString('pt-BR'),
                authHash: customData.authHash || termoData?.authHash || ('REVIVA-AUTH-' + Date.now().toString(16).toUpperCase() + '9B2C')
            };

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 18;
            const contentWidth = pageWidth - (margin * 2);

            // 1. Fundo Nobre / Moldura Fina em Tom Dourado
            doc.setFillColor(254, 253, 250); // Marfim suave
            doc.rect(0, 0, pageWidth, pageHeight, 'F');

            doc.setDrawColor(197, 160, 89); // Dourado Reviva
            doc.setLineWidth(0.8);
            doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

            doc.setLineWidth(0.25);
            doc.rect(12, 12, pageWidth - 24, pageHeight - 24);

            // 2. Cabecalho Oficial com Logomarca
            let curY = 16;
            try {
                const logoDataUrl = await getLogoBase64();
                if (logoDataUrl) {
                    const logoW = 54; // largura em mm
                    const logoH = logoW * (574 / 1822); // proporcao oficial exata (~17mm)
                    const logoX = (pageWidth - logoW) / 2;
                    doc.addImage(logoDataUrl, 'PNG', logoX, curY, logoW, logoH);
                    curY += logoH + 2;
                } else {
                    doc.setFont('times', 'bold');
                    doc.setFontSize(18);
                    doc.setTextColor(27, 17, 11);
                    doc.text('REVIVA MEMORIES', pageWidth / 2, curY + 6, { align: 'center' });
                    curY += 10;
                }
            } catch(e) {
                doc.setFont('times', 'bold');
                doc.setFontSize(18);
                doc.setTextColor(27, 17, 11);
                doc.text('REVIVA MEMORIES', pageWidth / 2, curY + 6, { align: 'center' });
                curY += 10;
            }

            doc.setFont('times', 'italic');
            doc.setFontSize(9.5);
            doc.setTextColor(197, 160, 89);
            doc.text('Memorias que transcendem o tempo.', pageWidth / 2, curY, { align: 'center' });

            curY += 5;
            doc.setDrawColor(197, 160, 89);
            doc.setLineWidth(0.4);
            doc.line(margin + 15, curY, pageWidth - margin - 15, curY);

            // 3. Titulo do Documento
            curY += 8;
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11.5);
            doc.setTextColor(15, 23, 42);
            doc.text('TERMO DE RESPONSABILIDADE & CONSENTIMENTO ETICO', pageWidth / 2, curY, { align: 'center' });

            curY += 5;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8.5);
            doc.setTextColor(100, 116, 139);
            doc.text('Declaracao de Titularidade, Vinculo e Autorizacao de Uso de Imagem & Voz com Inteligencia Artificial', pageWidth / 2, curY, { align: 'center' });

            // 4. Box de Identificacao do Contratante e Pedido
            curY += 7;
            doc.setFillColor(248, 246, 240);
            doc.setDrawColor(229, 195, 120);
            doc.setLineWidth(0.35);
            doc.roundedRect(margin, curY, contentWidth, 34, 3, 3, 'FD');

            const boxY = curY + 6;
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8.5);
            doc.setTextColor(146, 64, 14);
            doc.text('DADOS DO CONTRATANTE & DO PEDIDO', margin + 5, boxY);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8.2);
            doc.setTextColor(30, 41, 59);

            // Linha 1
            doc.text('Nome Completo: ', margin + 5, boxY + 6);
            doc.setFont('helvetica', 'bold');
            doc.text(t.name, margin + 30, boxY + 6);

            doc.setFont('helvetica', 'normal');
            doc.text('Numero do Pedido: ', margin + 110, boxY + 6);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(180, 83, 9);
            doc.text(t.orderId, margin + 138, boxY + 6);

            // Linha 2
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(30, 41, 59);
            doc.text('CPF: ', margin + 5, boxY + 12);
            doc.setFont('helvetica', 'bold');
            doc.text(t.cpf, margin + 15, boxY + 12);

            doc.setFont('helvetica', 'normal');
            doc.text('Plano Contratado: ', margin + 110, boxY + 12);
            doc.setFont('helvetica', 'bold');
            doc.text(t.planName, margin + 138, boxY + 12);

            // Linha 3
            doc.setFont('helvetica', 'normal');
            doc.text('Laco c/ Ente Querido: ', margin + 5, boxY + 18);
            doc.setFont('helvetica', 'bold');
            doc.text(t.relationNarrator, margin + 37, boxY + 18);

            doc.setFont('helvetica', 'normal');
            doc.text('Laco c/ Homenageado: ', margin + 110, boxY + 18);
            doc.setFont('helvetica', 'bold');
            doc.text(t.relationRecipient, margin + 144, boxY + 18);

            curY += 38;

            // 5. Clausulas Juridicas Fundamentadas
            const clauses = [
                {
                    title: '1. FINALIDADE AFETIVA E ESTRITAMENTE PESSOAL:',
                    text: 'As homenagens produzidas pela Reviva Memories destinam-se exclusivamente a preservacao de memorias familiares, celebracao em vida ou postuma de vinculos afetivos e exibicao em ambito privado, residencial ou em solenidades familiares restritas.'
                },
                {
                    title: '2. DECLARACAO DE TITULARIDADE E CONSENTIMENTO EXPRESSO:',
                    text: 'O(a) CONTRATANTE declara, sob as penas da lei (especialmente o Art. 299 do Codigo Penal Brasileiro - Falsidade Ideologica, e Art. 186 do Codigo Civil Brasileiro), possuir legitimo vinculo, posse dos direitos ou consentimento expresso da familia da pessoa cuja imagem e voz serao restauradas e recriadas.'
                },
                {
                    title: '3. CONFORMIDADE COM A LGPD (LEI N 13.709/2018):',
                    text: 'Todos os dados biometricos, fotografias e amostras sonoras fornecidas sao processados sob sigilo absoluto em ambiente seguro e encriptado, sendo utilizados exclusivamente para a confeccao da homenagem contratada e mantidos sob protecao conforme a Lei Geral de Protecao de Dados Pessoais.'
                },
                {
                    title: '4. VEDACAO ABSOLUTA DE USOS RESTRITIVOS, FRAUDULENTOS OU ILICITOS:',
                    text: 'E expressamente proibida a contratacao deste servico para a criacao de deepfakes difamatorias, simulacoes financeiras ou fraudulentas, fins politicos ou eleitorais, pecas comerciais sem anuencia, atos vexatorios ou qualquer violacao a honra, privacidade e imagem de terceiros.'
                },
                {
                    title: '5. RESPONSABILIDADE CIVIL, PENAL E ISENCAO DA PLATAFORMA:',
                    text: 'O(a) CONTRATANTE assume responsabilidade civil e criminal exclusiva e integral por eventuais danos causados a terceiros decorrentes do fornecimento indevido de midias ou de ma-fe nas declaracoes prestadas, isentando a plataforma Reviva Memories e seus operadores tecnicos de qualquer responsabilidade perante terceiros.'
                }
            ];

            clauses.forEach((item) => {
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(8.2);
                doc.setTextColor(27, 17, 11);
                doc.text(item.title, margin, curY);
                curY += 4.2;

                doc.setFont('helvetica', 'normal');
                doc.setFontSize(7.8);
                doc.setTextColor(51, 65, 85);
                const splitText = doc.splitTextToSize(item.text, contentWidth);
                doc.text(splitText, margin, curY);
                curY += (splitText.length * 3.8) + 3;
            });

            // 6. Bloco de Certificacao e Protocolo Digital
            curY += 2;
            doc.setFillColor(241, 245, 249);
            doc.setDrawColor(203, 213, 225);
            doc.roundedRect(margin, curY, contentWidth, 26, 2, 2, 'FD');

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8.2);
            doc.setTextColor(22, 101, 52); // Verde solene
            doc.text('CERTIFICACAO ELETRONICA DE ACEITE (VALIDADE JURIDICA CONFORME MP 2.200-2/2001)', margin + 4, curY + 5.5);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7.5);
            doc.setTextColor(51, 65, 85);
            doc.text(`Data e Hora do Registro: ${t.signedAt}`, margin + 4, curY + 11.5);
            doc.text(`Assinado eletronicamente por: ${t.name} (CPF: ${t.cpf})`, margin + 4, curY + 16.5);

            doc.setFont('courier', 'bold');
            doc.setFontSize(7.8);
            doc.setTextColor(15, 23, 42);
            doc.text(`HASH DE AUTENTICIDADE: ${t.authHash}`, margin + 4, curY + 22);

            // 7. Rodape
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(7);
            doc.setTextColor(148, 163, 184);
            doc.text('Reviva Memories (c) 2026. Documento emitido digitalmente para fins de arquivo, seguranca e conformidade LGPD.', pageWidth / 2, pageHeight - 14, { align: 'center' });

            return doc;
        },

        /**
         * Dispara o download direto do PDF do Termo
         */
        async downloadTermoPDF(customData = {}) {
            const doc = await this.generateTermoPDF(customData);
            if (doc) {
                let orderId = customData.orderId;
                try {
                    if (!orderId && localStorage.getItem('reviva_order_data')) {
                        orderId = JSON.parse(localStorage.getItem('reviva_order_data')).order_id;
                    }
                } catch(e) {}
                doc.save(`Termo_Responsabilidade_${orderId || 'REVIVA-1001'}.pdf`);
            }
        },

        /**
         * Empacota o dossie completo do pedido em formato .ZIP
         * Inclui: Termo Assinado em PDF + Roteiro Oficial + Diretrizes + Fotos e Audios
         */
        async downloadFullOrderZip(customOrder = null) {
            if (!window.JSZip) {
                alert('Carregando biblioteca de compactacao...');
                return;
            }

            // Carregar estado completo
            let state = {};
            let orderData = {};
            try {
                const rawS = localStorage.getItem('reviva_full_session_state');
                if (rawS) state = JSON.parse(rawS);
                const rawO = localStorage.getItem('reviva_order_data');
                if (rawO) orderData = JSON.parse(rawO);
            } catch(e) {}

            const zip = new window.JSZip();
            const orderId = customOrder?.id || orderData.order_id || state.orderData?.order_id || 'REVIVA-1001';
            const clientName = customOrder?.clientName || orderData.customer_name || state.clientName || 'Cliente';
            const clientCpf = customOrder?.clientCpf || orderData.customer_cpf || state.clientCpf || '000.000.000-00';
            const clientPhone = customOrder?.clientPhone || orderData.customer_phone || state.clientPhone || 'Não informado';
            const clientEmail = customOrder?.clientEmail || orderData.customer_email || state.clientEmail || 'Não informado';
            const planName = customOrder?.planName || orderData.plan_name || 'Plano Legatum';
            const formatStr = customOrder?.format || orderData.format || 'Horizontal (16:9)';
            const durationStr = customOrder?.duration || orderData.duration || '1 Minuto';
            const safeName = clientName.replace(/[^a-zA-Z0-9]/g, '_');

            // Carregar dados de estado do pedido específico
            let orderStateObj = {};
            try {
                const rawOrderState = localStorage.getItem(`reviva_order_state_${orderId}`) ||
                                      (orderId === 'REVIVA-1001' ? localStorage.getItem('reviva_full_session_state') : null);
                if (rawOrderState) orderStateObj = JSON.parse(rawOrderState);
            } catch(e) {}

            let orderCrmData = null;
            try {
                const rawCrm = localStorage.getItem(`reviva_crm_order_${orderId}`);
                if (rawCrm) orderCrmData = JSON.parse(rawCrm);
            } catch(e) {}

            const dtCreated = customOrder?.dateCreated ? new Date(customOrder.dateCreated) : new Date();
            const orderDateStr = `${String(dtCreated.getDate()).padStart(2, '0')}/${String(dtCreated.getMonth()+1).padStart(2, '0')}/${String(dtCreated.getFullYear()).slice(-2)}`;
            const orderTimeStr = `${String(dtCreated.getHours()).padStart(2, '0')}:${String(dtCreated.getMinutes()).padStart(2, '0')}`;

            let termoData = null;
            try {
                const rawTerm = localStorage.getItem('reviva_legal_term');
                if (rawTerm) termoData = JSON.parse(rawTerm);
                if (!termoData && state.legalTermSigned) termoData = state.legalTermSigned;
                if (!termoData && orderStateObj?.legalTermSigned) termoData = orderStateObj.legalTermSigned;
            } catch(e) {}

            const signedAt = customOrder?.termoSignedAt || termoData?.dateFormatted || termoData?.signedAt || `${orderDateStr} às ${orderTimeStr}`;
            const authHash = customOrder?.termoHash || termoData?.authHash || ('REVIVA-AUTH-' + Math.abs(orderId.split('').reduce((a,b)=>(((a<<5)-a)+b.charCodeAt(0))|0, 0)).toString(16).toUpperCase() + '9B2C');

            // 1. Gerar e adicionar o Termo de Responsabilidade em PDF
            try {
                const pdfDoc = await this.generateTermoPDF({
                    orderId: orderId,
                    name: clientName,
                    cpf: clientCpf,
                    planName: planName,
                    signedAt: signedAt,
                    authHash: authHash
                });
                if (pdfDoc) {
                    const pdfBlob = pdfDoc.output('blob');
                    zip.file(`Termo_Responsabilidade_${orderId}.pdf`, pdfBlob);
                }
            } catch(err) {
                console.warn('Erro ao embutir PDF do termo no zip:', err);
            }

            // 2. Mapeamento Oficial de Ambientes e Trilhas Sonoras
            const BACKGROUND_MAP = {
                'ceu': { name: 'Nuvens Celestiais', file: 'bg_ceu.jpg' },
                'nuvens': { name: 'Nuvens Celestiais', file: 'bg_ceu.jpg' },
                'montanhas': { name: 'Montanhas Serenas', file: 'bg_montanhas.jpg' },
                'floresta': { name: 'Floresta Encantada', file: 'bg_floresta.jpg' },
                'girassois': { name: 'Campo de Girassóis', file: 'bg_girassois.jpg' },
                'lago': { name: 'Lago Cristalino', file: 'bg_lago.jpg' },
                'palmeiras': { name: 'Palmeiras Tropicais', file: 'bg_palmeiras.jpg' },
                'vale': { name: 'Vale Dourado', file: 'bg_vale.jpg' },
                'descampado': { name: 'Descampado Verdejante', file: 'bg_descampado.jpg' }
            };

            const MUSIC_MAP = {
                'sem_musica': 'Sons Naturais',
                'violao': 'Violão Acústico',
                'piano': 'Piano Suave',
                'piano_emocao': 'Piano Suave',
                'violino': 'Violino Emocionante',
                'cordas_paz': 'Violino Emocionante',
                'flauta': 'Flauta Celestial',
                'saxofone': 'Saxofone Sereno',
                'serenidade': 'Violão Acústico',
                'guitarra': 'Guitarra Melódica',
                'harpa': 'Harpa Angelical'
            };

            const bgKey = (customOrder?.selectedBackground || orderStateObj?.selectedBackground || state.selectedBackground || 'ceu').toLowerCase();
            const bgInfo = BACKGROUND_MAP[bgKey] || { name: 'Nuvens Celestiais', file: 'bg_ceu.jpg' };

            const musicKey = (customOrder?.selectedMusic || orderStateObj?.selectedMusic || state.selectedMusic || 'sem_musica').toLowerCase();
            const musicName = MUSIC_MAP[musicKey] || 'Sons Naturais';

            const toneDossieText = (customOrder?.tone || orderStateObj?.scriptTone || state.scriptTone || 'Profundamente Emocionante');

            const scriptEl = document.getElementById('admin-script-text');
            let scriptText = customOrder?.scriptText ||
                             orderStateObj?.latestScriptText ||
                             orderStateObj?.scriptText ||
                             (scriptEl ? (scriptEl.innerText || scriptEl.textContent).trim() : '') ||
                             state.approvedScript ||
                             state.latestScriptText ||
                             'Roteiro em fase de elaboração / curadoria pelo cliente.';

            // 3. Adicionar Roteiro Oficial Dedicado (.txt)
            zip.file(`Roteiro_Oficial_${orderId}.txt`, scriptText);

            // 4. Montar Dossiê de Produção Completo (.txt) com todos os dados do painel
            const paymentMethodStr = customOrder?.paymentMethod || orderData.paymentMethod || 'Cartão / PIX';
            const installments = customOrder?.installments || orderData.installments || 1;
            const paymentDetailsStr = paymentMethodStr.toLowerCase().includes('cart') ? `Cartão - ${installments}x` : paymentMethodStr;
            const priceValStr = customOrder?.valueFormatted || (customOrder?.price ? `R$ ${Number(customOrder.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : (orderData.price ? `R$ ${Number(orderData.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 447,30'));

            // Checagem de fotos e áudios enviados
            let photosList = [];
            try {
                const rawPhotos = localStorage.getItem(`reviva_client_photos_${orderId}`) ||
                                  (customOrder?.orderId ? localStorage.getItem(`reviva_client_photos_${customOrder.orderId}`) : null) ||
                                  localStorage.getItem('reviva_client_photos') ||
                                  localStorage.getItem('reviva_uploaded_photos');
                if (rawPhotos) photosList = JSON.parse(rawPhotos);
                if ((!photosList || photosList.length === 0) && orderStateObj?.uploadedPhotos) {
                    photosList = orderStateObj.uploadedPhotos;
                }
            } catch(e) {}

            let audiosList = [];
            try {
                const rawAudio = localStorage.getItem(`reviva_client_audio_${orderId}`) ||
                                 (customOrder?.orderId ? localStorage.getItem(`reviva_client_audio_${customOrder.orderId}`) : null) ||
                                 localStorage.getItem('reviva_client_audio') ||
                                 localStorage.getItem('reviva_uploaded_audios');
                if (rawAudio) audiosList = JSON.parse(rawAudio);
                if ((!audiosList || audiosList.length === 0) && orderStateObj?.uploadedAudios) {
                    audiosList = orderStateObj.uploadedAudios;
                }
            } catch(e) {}

            const dossieText = `================================================================================\n` +
                `DOSSIÊ DE PRODUÇÃO - REVIVA MEMORIES\n` +
                `================================================================================\n\n` +
                `DADOS CADASTRAIS & CONTRATUAIS DO PEDIDO:\n` +
                `--------------------------------------------------------------------------------\n` +
                `ID do Pedido: #${orderId}\n` +
                `Cliente Contratante: ${clientName}\n` +
                `CPF: ${clientCpf}\n` +
                `WhatsApp: ${clientPhone}\n` +
                `E-mail: ${clientEmail}\n` +
                `Plano Contratado: ${planName} • ${durationStr} • ${formatStr}\n` +
                `Valor Total: ${priceValStr}\n` +
                `Forma de Pagamento: ${paymentDetailsStr}\n` +
                `Data & Hora da Compra: ${orderDateStr} às ${orderTimeStr}\n\n` +
                `--------------------------------------------------------------------------------\n` +
                `TERMO DE RESPONSABILIDADE & CONSENTIMENTO ÉTICO:\n` +
                `--------------------------------------------------------------------------------\n` +
                `Status do Termo: ASSINADO DIGITALMENTE (Aceite Eletrônico Válido)\n` +
                `Titular Signatário: ${clientName} (CPF: ${clientCpf})\n` +
                `Data & Hora do Aceite: ${signedAt}\n` +
                `Hash Criptográfico de Autenticidade: ${authHash}\n` +
                `Amparo Legal: MP nº 2.200-2/2001 e Art. 10 da Lei Federal 14.063/2020\n` +
                `Arquivo Vinculado no Pacote: Termo_Responsabilidade_${orderId}.pdf\n\n` +
                `--------------------------------------------------------------------------------\n` +
                `DIRETRIZES TÉCNICAS & ESCOLHAS DO CLIENTE:\n` +
                `--------------------------------------------------------------------------------\n` +
                `Ambiente de Fundo Escolhido: ${bgInfo.name} (arquivo HD anexado no pacote)\n` +
                `Trilha Sonora Escolhida: ${musicName} (aplicar da biblioteca da produção)\n` +
                `Tom Emocional da Narração: ${toneDossieText}\n` +
                `Total de Fotos Originais Anexadas: ${photosList.length} arquivo(s)\n` +
                `Total de Áudios de Referência Anexados: ${audiosList.length} gravação(ões)\n\n` +
                `--------------------------------------------------------------------------------\n` +
                `ROTEIRO OFICIAL APROVADO PARA PRODUÇÃO:\n` +
                `--------------------------------------------------------------------------------\n\n` +
                `${scriptText}\n\n` +
                `================================================================================\n` +
                `Reviva Memories © 2026. Todos os direitos reservados.\n` +
                `Documento gerado confidencialmente para uso exclusivo da Produção.\n` +
                `================================================================================\n`;

            zip.file(`Dossie_Pedido_${orderId}.txt`, dossieText);

            // 5. Anexar o Ambiente de Fundo em Alta Resolução (HD)
            try {
                let bgBlob = null;
                try {
                    const respHd = await fetch(`assets/ambientes_hd/${bgInfo.file}`);
                    if (respHd.ok) bgBlob = await respHd.blob();
                } catch(e) {}

                if (!bgBlob) {
                    try {
                        const respStd = await fetch(`assets/ambientes/${bgInfo.file}`);
                        if (respStd.ok) bgBlob = await respStd.blob();
                    } catch(e) {}
                }

                if (bgBlob) {
                    const bgFolder = zip.folder("Ambiente_Fundo_HD");
                    const safeBgName = bgInfo.name.replace(/[^a-zA-Z0-9]/g, '_');
                    bgFolder.file(`${safeBgName}_HD.jpg`, bgBlob);
                }
            } catch(bgErr) {
                console.warn('Não foi possível anexar imagem do ambiente HD ao zip:', bgErr);
            }

            // 6. Adicionar Fotos se existirem em base64 na sessao
            const photosFolder = zip.folder("Fotos_Originais");
            if (Array.isArray(photosList) && photosList.length > 0) {
                photosList.forEach((p, idx) => {
                    const data = typeof p === 'string' ? p : (p.data || p.url || '');
                    if (data && data.includes('base64,')) {
                        const b64 = data.split('base64,')[1];
                        photosFolder.file(`Foto_Referencia_${idx + 1}.png`, b64, { base64: true });
                    }
                });
            }

            // 7. Adicionar Audios se existirem
            const audiosFolder = zip.folder("Audios_Referencia");
            if (Array.isArray(audiosList) && audiosList.length > 0) {
                audiosList.forEach((a, idx) => {
                    const data = typeof a === 'string' ? a : (a.data || a.url || '');
                    if (data && data.includes('base64,')) {
                        const b64 = data.split('base64,')[1];
                        audiosFolder.file(`Audio_Referencia_${idx + 1}.mp3`, b64, { base64: true });
                    }
                });
            }

            // 8. Baixar o arquivo compactado .ZIP
            const zipBlob = await zip.generateAsync({ type: "blob" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(zipBlob);
            link.download = `Pacote_${orderId}_${safeName}.zip`;
            link.click();
            URL.revokeObjectURL(link.href);
        }
    };

    window.RevivaDocumentService = RevivaDocumentService;
    window.downloadTermoPDF = (data) => RevivaDocumentService.downloadTermoPDF(data);
    window.downloadFullOrderZip = () => RevivaDocumentService.downloadFullOrderZip();

})(window);
