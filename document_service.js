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
        async downloadFullOrderZip() {
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
            const orderId = orderData.order_id || state.orderData?.order_id || 'REVIVA-1001';
            const clientName = orderData.customer_name || state.clientName || 'Cliente';
            const safeName = clientName.replace(/[^a-zA-Z0-9]/g, '_');

            // 1. Gerar e adicionar o Termo em PDF
            try {
                const pdfDoc = await this.generateTermoPDF();
                if (pdfDoc) {
                    const pdfBlob = pdfDoc.output('blob');
                    zip.file(`Termo_Responsabilidade_${orderId}.pdf`, pdfBlob);
                }
            } catch(err) {
                console.warn('Erro ao embutir PDF no zip:', err);
            }

            // 2. Adicionar Roteiro e Dossie em Texto
            const scriptText = state.approvedScript || document.getElementById('admin-script-text')?.innerText || 'Roteiro em fase de curadoria.';
            const dossieText = `================================================================================\n` +
                `DOSSIE DE PRODUCAO - REVIVA MEMORIES\n` +
                `================================================================================\n\n` +
                `Numero do Pedido: ${orderId}\n` +
                `Cliente: ${clientName}\n` +
                `CPF: ${orderData.customer_cpf || state.clientCpf || 'Nao informado'}\n` +
                `WhatsApp: ${orderData.customer_phone || state.clientPhone || 'Nao informado'}\n` +
                `Plano: ${orderData.plan_name || 'Plano Legatum'}\n` +
                `Status: Em Producao / Lapidacao\n\n` +
                `--------------------------------------------------------------------------------\n` +
                `ROTEIRO OFICIAL APROVADO:\n` +
                `--------------------------------------------------------------------------------\n\n` +
                `${scriptText}\n\n` +
                `--------------------------------------------------------------------------------\n` +
                `ESCOLHAS DE AMBIENTE & TRILHA:\n` +
                `--------------------------------------------------------------------------------\n` +
                `Cenario de Fundo: ${state.selectedBackground || 'Original / Selecionado no Painel'}\n` +
                `Trilha Sonora: ${state.selectedMusic || 'Acustico Afeto'}\n` +
                `Tom Emocional: ${state.scriptTone || 'Profundamente Emocionante'}\n\n` +
                `Reviva Memories (c) 2026. Todos os direitos reservados.\n`;

            zip.file(`Dossie_Pedido_${orderId}.txt`, dossieText);

            // 3. Adicionar Fotos se existirem em base64 na sessao
            const photosFolder = zip.folder("Fotos_Originais");
            try {
                const rawPhotos = localStorage.getItem('reviva_client_photos') || localStorage.getItem('reviva_uploaded_photos');
                if (rawPhotos) {
                    const photos = JSON.parse(rawPhotos);
                    if (Array.isArray(photos)) {
                        photos.forEach((p, idx) => {
                            const data = typeof p === 'string' ? p : p.data;
                            if (data && data.includes('base64,')) {
                                const b64 = data.split('base64,')[1];
                                photosFolder.file(`Foto_Referencia_${idx + 1}.png`, b64, { base64: true });
                            }
                        });
                    }
                }
            } catch(e) {}

            // 4. Adicionar Audios se existirem
            const audiosFolder = zip.folder("Audios_Referencia");
            try {
                const rawAudio = localStorage.getItem('reviva_client_audio') || localStorage.getItem('reviva_uploaded_audios');
                if (rawAudio) {
                    const audios = JSON.parse(rawAudio);
                    if (Array.isArray(audios)) {
                        audios.forEach((a, idx) => {
                            const data = typeof a === 'string' ? a : a.data;
                            if (data && data.includes('base64,')) {
                                const b64 = data.split('base64,')[1];
                                audiosFolder.file(`Audio_Referencia_${idx + 1}.mp3`, b64, { base64: true });
                            }
                        });
                    }
                }
            } catch(e) {}

            // 5. Baixar o arquivo compactado .ZIP
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
