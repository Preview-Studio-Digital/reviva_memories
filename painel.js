/**
 * Reviva Memories - Painel do Cliente & Fluxo Oficial em 4 Etapas
 */

document.addEventListener('DOMContentLoaded', async () => {
    let currentStep = 1;
    let orderData = await window.revivaData.getCurrentOrder();
    let currentUser = await window.revivaData.getCurrentUser();

    // Nome do cliente para personalização calorosa
    const clientFullName = currentUser?.user_metadata?.full_name || 'Mariana';
    const clientFirstName = clientFullName.trim().split(' ')[0] || 'Mariana';

    const topbarUserName = document.getElementById('topbar-user-name');
    if (topbarUserName) topbarUserName.textContent = clientFirstName;

    // =========================================================================
    // CONFIGURAÇÃO DINÂMICA DOS 3 PLANOS OFICIAIS (AFFECTUS, LEGATUM, TRIBUTUM)
    // =========================================================================
    const PLANS_CONFIG = {
        affectus: {
            id: 'affectus',
            name: 'Affectus',
            title: 'Plano Affectus (1 Minuto)',
            durationMinutes: 1,
            targetWords: '120 a 135 palavras (mínimo obrigatório)',
            minWords: 120,
            maxWords: 140,
            maxChars: 850,
            structurePrompt: 'Duração de 1 minuto (120 a 135 palavras, máx 850 caracteres). Começo com forte empolgação e alegria festiva; cadência transiciona para afeto, orgulho, conselho central e bênção/despedida extremamente emocionante.',
            specificInstructions: 'Foco na mensagem principal, conselhos de incentivo e uma despedida comovente e bênção à família no encerramento.'
        },
        legatum: {
            id: 'legatum',
            name: 'Legatum',
            title: 'Plano Legatum (2 Minutos)',
            durationMinutes: 2,
            targetWords: '240 a 265 palavras (mínimo obrigatório)',
            minWords: 240,
            maxWords: 275,
            maxChars: 1700,
            structurePrompt: 'Duração de 2 minutos (240 a 265 palavras, máx 1700 caracteres). Começo muito alegre, empolgado e comemorativo. Desenvolve a trajetória e recordações afetivas ricas, conselhos profundos e RECADOS PERSONALIZADOS para familiares próximos (não apenas saudações, mas recados com significado individual), finalizando com clímax dramático, poético e sublime.',
            specificInstructions: 'Aprofunde em histórias e lembranças marcantes de convivência e insira recados personalizados e carinhosos dedicados a outros familiares próximos (pai, mãe, irmãos, filhos, etc.).'
        },
        tributum: {
            id: 'tributum',
            name: 'Tributum',
            title: 'Plano Tributum (3 Minutos)',
            durationMinutes: 3,
            targetWords: '360 a 395 palavras (mínimo obrigatório)',
            minWords: 360,
            maxWords: 410,
            maxChars: 2550,
            structurePrompt: 'Duração de 3 minutos (360 a 395 palavras, máx 2550 caracteres). Abertura vibrante com energia, entusiasmo e celebração. Narrativa em múltiplos capítulos: memórias ricas e detalhadas (hábitos, momentos engraçados, viagens), legado moral/conselhos profundos e MÚLTIPLOS RECADOS INDIVIDUAIS E PERSONALIZADOS para cada membro da família, culminando em uma despedida profundamente comovente, dramática e celestial.',
            specificInstructions: 'Explore memórias ricas em detalhes (hábitos, risadas, momentos inesquecíveis) e dedique trechos individuais com recados personalizados e carinhosos para múltiplos familiares antes do encerramento emocionante.'
        }
    };

    // Detectar plano ativo via Query Param (?plano=... ou ?plan=...) - Padrão obrigatório de testes: AFFECTUS (1 MINUTO)
    const urlParams = new URLSearchParams(window.location.search);
    const planFromUrl = (urlParams.get('plano') || urlParams.get('plan') || '').toLowerCase();

    let activePlanKey = 'affectus';
    if (PLANS_CONFIG[planFromUrl]) {
        activePlanKey = planFromUrl;
    }

    const currentPlan = PLANS_CONFIG[activePlanKey];
    localStorage.setItem('reviva_selected_plan', activePlanKey);
    if (orderData) {
        orderData.plan_name = activePlanKey;
    }

    // Atualiza cabeçalhos e badges com o plano ativo
    const chatHeaderPlanTitle = document.getElementById('chat-header-plan-title');
    if (chatHeaderPlanTitle) {
        chatHeaderPlanTitle.textContent = `DESENVOLVIMENTO DO ROTEIRO - PLANO ${currentPlan.name.toUpperCase()}: ${currentPlan.durationMinutes} MINUTO${currentPlan.durationMinutes > 1 ? 'S' : ''}`;
    }

    const scriptPlanBadge = document.getElementById('script-plan-badge');
    if (scriptPlanBadge) {
        scriptPlanBadge.textContent = `${currentPlan.title} • Máx ${currentPlan.maxChars} caracteres`;
    }

    // Estado da sessão
    let uploadedPhotos = [];
    let uploadedAudios = [];
    let selectedBackground = 'nuvens';
    let selectedMusic = 'piano_emocao';
    let interviewAnswers = {};
    let interviewQuestionIndex = 0;

    // Perguntas da Entrevista Afetiva (Adaptadas dinamicamente à duração do plano contratado)
    const interviewQuestions = [
        {
            id: 'intro_ready',
            getText: (name) => `Olá, ${name}! Eu sou o Iasis, seu guia aqui na Reviva Memories.<br><br>Faremos agora uma breve conversa para capturar as memórias, o afeto e os detalhes necessários para o desenvolvimento do roteiro personalizado da homenagem no <strong>${currentPlan.title}</strong>.<br><br>Podemos começar?`
        },
        {
            id: 'loved_one_info',
            text: "Perfeito! Para começarmos: qual é o nome do ente querido que apresentará a mensagem?"
        },
        {
            id: 'honoree_target',
            text: "E para quem será essa homenagem? É para você mesma(o) ou você vai presentear alguém especial com esse momento?"
        },
        {
            id: 'relationship',
            text: "Qual era o laço afetivo e o grau de parentesco entre eles (ex: Pai e Filha, Avó e Neto, Marido e Esposa)?"
        },
        {
            id: 'nickname',
            text: "E como ele(a) costumava chamá-la(o) carinhosamente? Pelo próprio nome ou por algum apelido?"
        },
        {
            id: 'occasion',
            text: "E qual é a ocasião especial dessa homenagem? (Ex: Aniversário, Formatura, Casamento, Dia dos Pais/Mães, ou um abraço de conforto e saudade)?"
        },
        {
            id: 'spiritual_connection',
            text: currentPlan.durationMinutes >= 2 
                ? "Existe algum acontecimento marcante, história inesquecível ou frase característica que eles viveram juntos que vale a pena recordar?"
                : "Existe algum acontecimento ou frase marcante que ele(a) diria à pessoa homenageada que seria profundamente impactante e especial para ela ouvir?"
        },
        {
            id: 'advice_and_wishes',
            text: currentPlan.durationMinutes >= 2
                ? "Quais os maiores conselhos, valores de vida e palavras de incentivo que ele(a) deixaria para ela seguir em frente com coragem e alegria?"
                : "Quais conselhos ou palavras de carinho e incentivo ele(a) daria para a pessoa homenageada?"
        },
        {
            id: 'family_mentions',
            text: currentPlan.durationMinutes >= 2
                ? `No Plano ${currentPlan.name} temos espaço para mensagens dedicadas: quais familiares próximos (mãe, pai, irmãos, filhos, cônjuge) devem receber recados personalizados e o que ele(a) diria especificamente a cada um?`
                : "Quais outros familiares ou pessoas queridas não podem deixar de receber um abraço apertado e uma bênção no final da mensagem?"
        }
    ];

    const poeticPhrases = [
        "\"Buscando a essência da voz nos ecos da memória...\"",
        "\"Sincronizando o brilho do olhar e o calor das lembranças...\"",
        "\"Tecendo o abraço que a distância não consegue apagar...\"",
        "\"Dando vida às palavras que o coração sempre quis ouvir...\""
    ];

    // =========================================================================
    // NAVEGAÇÃO ENTRE AS ETAPAS COM ANIMAÇÃO CINEMATOGRÁFICA EM TELA CHEIA
    // =========================================================================
    const STAGE_TRANSITION_INFO = {
        1: {
            badge: 'ETAPA 01',
            title: 'O RESGATE',
            sub: 'Envio de Imagens e Áudio de Referência'
        },
        2: {
            badge: 'ETAPA 02',
            title: 'A ESSÊNCIA',
            sub: 'Desenvolvimento Afetivo do Roteiro Oficial'
        },
        3: {
            badge: 'ETAPA 03',
            title: 'A HARMONIZAÇÃO',
            sub: 'Trilha Sonora e Cenário'
        },
        4: {
            badge: 'ETAPA 04',
            title: 'A LAPIDAÇÃO',
            sub: 'Aprovação da Imagem e da Voz Clonada'
        },
        5: {
            badge: 'ETAPA 05',
            title: 'O REENCONTRO',
            sub: 'Homenagem Pronta e Sala de Revelação'
        }
    };

    let curtainTimer = null;
    function triggerStageCurtainAnimation(step, callback) {
        const curtain = document.getElementById('fullscreen-stage-curtain');
        const badge = document.getElementById('stageCurtainBadge');
        const title = document.getElementById('stageCurtainTitle');
        const sub = document.getElementById('stageCurtainSub');
        
        if (!curtain || !badge || !title || !sub) {
            if (callback) callback();
            return;
        }

        const info = STAGE_TRANSITION_INFO[step] || {
            badge: `ETAPA 0${step}`,
            title: `ETAPA ${step}`,
            sub: 'Avançando na Homenagem...'
        };

        badge.textContent = info.badge;
        title.textContent = info.title;
        sub.textContent = info.sub;

        if (curtainTimer) clearTimeout(curtainTimer);

        // 1. Fade In Nobre (1,5 segundos)
        curtain.classList.add('active');

        // 2. Troca de fase no auge da opacidade (1,5 segundos)
        setTimeout(() => {
            if (callback) callback();
        }, 1500);

        // 3. Após 1,5s de entrada + 1,0s de leitura = 2,5s total, inicia o Fade Out (1,5 segundos)
        curtainTimer = setTimeout(() => {
            curtain.classList.remove('active');
        }, 2500);
    }

    function executeStepSwitch(step) {
        currentStep = step;
        
        // Atualiza a barra de progresso (5 passos = 01 a 05)
        document.querySelectorAll('.step-item').forEach(item => {
            const s = parseInt(item.dataset.step);
            item.classList.remove('active', 'completed');
            if (s === step) item.classList.add('active');
            if (s < step) item.classList.add('completed');
        });

        // Atualiza os fios conectores de ouro entre as etapas (4 conectores)
        const fill1 = document.getElementById('stepper-fill-1');
        const fill2 = document.getElementById('stepper-fill-2');
        const fill3 = document.getElementById('stepper-fill-3');
        const fill4 = document.getElementById('stepper-fill-4');
        if (fill1) fill1.style.width = step >= 2 ? '100%' : '0%';
        if (fill2) fill2.style.width = step >= 3 ? '100%' : '0%';
        if (fill3) fill3.style.width = step >= 4 ? '100%' : '0%';
        if (fill4) fill4.style.width = step >= 5 ? '100%' : '0%';

        // Oculta e exibe seções com animação
        document.querySelectorAll('.step-section').forEach(sec => {
            sec.style.display = 'none';
            sec.classList.remove('active-entering');
        });
        const targetSec = document.getElementById(`step-${step}`);
        if (targetSec) {
            targetSec.style.display = 'flex';
            void targetSec.offsetWidth;
            targetSec.classList.add('active-entering');
        }

        // Oculta e exibe barras de ações externas
        document.querySelectorAll('.footer-step-actions').forEach(footer => footer.style.display = 'none');
        const targetFooter = document.getElementById(`footer-step-${step}`);
        if (targetFooter) targetFooter.style.display = 'flex';

        if (step === 2) {
            startInterviewChat();
        }

        if (step === 3) {
            // Garantir que sempre haja uma paisagem e uma trilha sonora selecionadas
            const scenarioCards = document.querySelectorAll('#scenariosContainer .scenario-card-full');
            let hasSelectedBg = false;
            scenarioCards.forEach(c => {
                if (c.dataset.bg === selectedBackground) {
                    c.classList.add('selected');
                    hasSelectedBg = true;
                    const container = document.getElementById('scenariosContainer');
                    if (container && container.firstElementChild !== c) container.prepend(c);
                } else {
                    c.classList.remove('selected');
                }
            });
            if (!hasSelectedBg && scenarioCards.length > 0) {
                scenarioCards[0].classList.add('selected');
                selectedBackground = scenarioCards[0].dataset.bg || 'nuvens';
            }

            const musicCards = document.querySelectorAll('#musicContainer .scenario-card-full');
            let hasSelectedMusic = false;
            musicCards.forEach(c => {
                if (c.dataset.music === selectedMusic) {
                    c.classList.add('selected');
                    hasSelectedMusic = true;
                    const container = document.getElementById('musicContainer');
                    if (container && container.firstElementChild !== c) container.prepend(c);
                } else {
                    c.classList.remove('selected');
                }
            });
            if (!hasSelectedMusic && musicCards.length > 0) {
                musicCards[0].classList.add('selected');
                selectedMusic = musicCards[0].dataset.music || 'piano_emocao';
            }
        }

        if (step === 4) {
            const producerImg = localStorage.getItem('reviva_producer_image');
            const previewAvatarImg = document.getElementById('preview-avatar-img');
            if (producerImg && previewAvatarImg) {
                previewAvatarImg.src = producerImg;
            }
            if (typeof updatePhotoApprovalUI === 'function') updatePhotoApprovalUI(photoDecision);
            if (typeof updateVoiceApprovalUI === 'function') updateVoiceApprovalUI(voiceDecision);
            if (typeof updateLapidacaoActionButton === 'function') updateLapidacaoActionButton();
        }

        if (window.lucide) window.lucide.createIcons();
    }

    function goToStep(step, immediate = false) {
        if (immediate || step === currentStep) {
            executeStepSwitch(step);
        } else {
            triggerStageCurtainAnimation(step, () => {
                executeStepSwitch(step);
            });
        }
    }

    window.goToStep = goToStep;

    // Habilitar navegação livre ao clicar nos passos da linha do tempo (Modo Testes/Desenvolvimento)
    document.querySelectorAll('.step-item').forEach(item => {
        item.addEventListener('click', () => {
            const targetStep = parseInt(item.dataset.step);
            if (targetStep) goToStep(targetStep);
        });
    });

    // =========================================================================
    // ETAPA 01: O RESGATE (FOTOS + CENÁRIO)
    // =========================================================================
    const photoDropzone = document.getElementById('photo-dropzone');
    const photoInput = document.getElementById('photo-input');

    if (photoDropzone) {
        photoDropzone.addEventListener('click', (e) => {
            if (e.target.closest('.preview-remove-btn')) return;
            if (!legalTermSigned || !legalTermSigned.signed) {
                e.stopPropagation();
                if (typeof window.openTermoModal === 'function') window.openTermoModal(false);
                return;
            }
            if (uploadedPhotos.length < 5) {
                photoInput.click();
            }
        });

        photoDropzone.addEventListener('dragover', (e) => { 
            e.preventDefault(); 
            photoDropzone.style.borderColor = '#f6e3c5'; 
            photoDropzone.style.background = 'rgba(197, 160, 89, 0.12)';
        });

        photoDropzone.addEventListener('dragleave', () => { 
            photoDropzone.style.borderColor = 'rgba(197, 160, 89, 0.5)'; 
            photoDropzone.style.background = 'rgba(10, 7, 5, 0.55)';
        });

        photoDropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            photoDropzone.style.borderColor = 'rgba(197, 160, 89, 0.5)';
            photoDropzone.style.background = 'rgba(10, 7, 5, 0.55)';
            handlePhotoFiles(e.dataTransfer.files);
        });
    }

    if (photoInput) {
        photoInput.addEventListener('change', (e) => {
            handlePhotoFiles(e.target.files);
            photoInput.value = '';
        });
    }

    let tipsInterval = null;
    function initTipsRotator() {
        if (tipsInterval) clearInterval(tipsInterval);
        const rotator = document.getElementById('dropzoneTipsRotator');
        if (!rotator) return;
        const slides = rotator.querySelectorAll('.dropzone-tip-slide');
        if (slides.length <= 1) return;
        let currentIdx = 0;
        tipsInterval = setInterval(() => {
            slides[currentIdx].classList.remove('active');
            currentIdx = (currentIdx + 1) % slides.length;
            slides[currentIdx].classList.add('active');
        }, 2800);
    }
    initTipsRotator();

    function handlePhotoFiles(files) {
        const remainingSlots = 3 - uploadedPhotos.length;
        if (remainingSlots <= 0) return;

        const filesToProcess = Array.from(files).slice(0, remainingSlots);
        let processedCount = 0;

        filesToProcess.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                uploadedPhotos.push({ name: file.name, data: e.target.result });
                processedCount++;
                if (processedCount === filesToProcess.length) {
                    renderPhotoPreviews();
                }
            };
            reader.readAsDataURL(file);
        });
    }

    function renderPhotoPreviews() {
        if (!photoDropzone) return;

        const count = uploadedPhotos.length;

        if (count === 0) {
            photoDropzone.innerHTML = `
                <div class="photo-dropzone-header" style="display: flex; flex-direction: column; align-items: center; justify-content: center; margin-bottom: 6px;">
                    <i data-lucide="image-plus" style="width: 28px; height: 28px; color: #e5c378; margin-bottom: 4px;"></i>
                    <h4 style="color: #f6e3c5; font-size: 0.92rem; margin: 0; font-weight: 600;">Clique ou arraste as fotos aqui</h4>
                </div>

                <div class="dropzone-tips-rotator" id="dropzoneTipsRotator">
                    <div class="dropzone-tip-slide active">
                        <i data-lucide="camera"></i>
                        <span>Até 3 fotografias</span>
                    </div>
                    <div class="dropzone-tip-slide">
                        <i data-lucide="user-check"></i>
                        <span>Fotos Individuais</span>
                    </div>
                    <div class="dropzone-tip-slide">
                        <i data-lucide="sun-medium"></i>
                        <span>Boa iluminação</span>
                    </div>
                    <div class="dropzone-tip-slide">
                        <i data-lucide="scan-face"></i>
                        <span>Alta Nitidez</span>
                    </div>
                    <div class="dropzone-tip-slide">
                        <i data-lucide="sparkles"></i>
                        <span>Expressão natural</span>
                    </div>
                </div>

                <input type="file" id="photo-input" multiple accept="image/*" style="display: none;">
            `;
            const newInput = photoDropzone.querySelector('#photo-input');
            newInput?.addEventListener('change', (e) => {
                handlePhotoFiles(e.target.files);
                newInput.value = '';
            });
            if (window.lucide) lucide.createIcons();
            initTipsRotator();
            return;
        }

        let thumbsHtml = uploadedPhotos.map((photo, idx) => `
            <div style="position: relative; width: 92px; height: 92px; border-radius: 10px; overflow: hidden; border: 1.5px solid #e5c378; flex-shrink: 0; box-shadow: 0 4px 16px rgba(0,0,0,0.7); background: #000;">
                <img src="${photo.data}" alt="${photo.name}" style="width: 100%; height: 100%; object-fit: cover; display: block;">
                <button class="preview-remove-btn" onclick="removePhoto(${idx}, event)" title="Remover foto" style="position: absolute; top: 4px; right: 4px; width: 22px; height: 22px; border-radius: 50%; background: rgba(14, 9, 6, 0.95); color: #e5c378; border: 1px solid #e5c378; font-size: 11px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; line-height: 1; padding: 0; transition: transform 0.2s ease;">✕</button>
            </div>
        `).join('');

        photoDropzone.innerHTML = `
            <div style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: space-evenly; align-items: center; padding: 2px 0;">
                <div style="display: inline-flex; align-items: center; gap: 6px; background: rgba(197, 160, 89, 0.15); border: 1px solid rgba(197, 160, 89, 0.4); border-radius: 20px; padding: 4px 14px;">
                    <span style="color: #e5c378; font-weight: bold; font-size: 0.90rem;">✓</span>
                    <span style="color: #f6e3c5; font-size: 0.88rem; font-weight: 600; letter-spacing: 0.2px;">
                        ${count} ${count === 1 ? 'foto anexada' : 'fotos anexadas'}
                    </span>
                </div>

                <div style="display: flex; gap: 12px; justify-content: center; align-items: center; max-width: 100%; overflow-x: auto; padding: 4px 0;">
                    ${thumbsHtml}
                </div>

                <div style="font-size: 0.76rem; color: ${count < 3 ? '#e5c378' : 'var(--text-secondary)'}; font-weight: 500;">
                    ${count < 3 ? '+ Clique para adicionar mais fotos (máx. 3)' : '✓ Limite máximo de 3 fotos atingido'}
                </div>
            </div>
            <input type="file" id="photo-input" multiple accept="image/*" style="display: none;">
        `;

        const newInput = photoDropzone.querySelector('#photo-input');
        newInput?.addEventListener('change', (e) => {
            handlePhotoFiles(e.target.files);
            newInput.value = '';
        });
    }

    window.removePhoto = (index, event) => {
        if (event) event.stopPropagation();
        uploadedPhotos.splice(index, 1);
        renderPhotoPreviews();
    };

    document.querySelectorAll('#scenariosContainer .scenario-card-full').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('#scenariosContainer .scenario-card-full').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedBackground = card.dataset.bg;

            const labelSelected = document.getElementById('label-selected-bg');
            if (labelSelected) {
                labelSelected.textContent = card.dataset.title ? (card.dataset.title + (card.dataset.title.includes(' ') ? '' : ' Celestes')) : 'Cenário Selecionado';
            }

            // No Desktop: Mover o card selecionado para o topo da lista
            const container = document.getElementById('scenariosContainer');
            if (container && container.firstElementChild !== card) {
                container.prepend(card);
            }
            saveFullSessionState();
        });
    });

    // Modal Customizado de Alerta de Fotos
    const photoAlertModal = document.getElementById('photoAlertModal');
    const btnAlertAttachPhotos = document.getElementById('btnAlertAttachPhotos');

    function openPhotoAlertModal() {
        if (!photoAlertModal) return;
        photoAlertModal.classList.add('active');
    }

    function closePhotoAlertModal() {
        if (!photoAlertModal) return;
        photoAlertModal.classList.remove('active');
    }

    btnAlertAttachPhotos?.addEventListener('click', () => {
        closePhotoAlertModal();
        photoInput?.click();
    });

    photoAlertModal?.addEventListener('click', (e) => {
        if (e.target === photoAlertModal) {
            closePhotoAlertModal();
        }
    });

    document.getElementById('btn-next-step-1')?.addEventListener('click', () => {
        if (!legalTermSigned || !legalTermSigned.signed) {
            if (typeof window.openTermoModal === 'function') window.openTermoModal(false);
            return;
        }
        if (!uploadedPhotos || uploadedPhotos.length === 0) {
            openPhotoAlertModal();
            return;
        }

        goToStep(2);
    });

    // =========================================================================
    // ETAPA 02: A ESSÊNCIA (INTELIGÊNCIA REAL IASIS COM GEMINI API)
    // =========================================================================
    const GEMINI_API_KEY = window.ENV_GEMINI_API_KEY || localStorage.getItem('gemini_api_key') || (typeof atob !== 'undefined' ? atob('QVEuQWI4Uk42TFBBTFZRMmNXZ0dvVUFGVTBvaHpjcUZ5RmlyVDFMaHFqSHVXdHN0U0dMU3c=') : '');
    const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-3.5-flash', 'gemini-flash-latest'];

    const interviewChatBox = document.getElementById('interview-chat-box');
    const chatInput = document.getElementById('chat-input');
    const btnSendChat = document.getElementById('btn-send-chat');
    const chatTypingIndicator = document.getElementById('chat-typing-indicator');

    let geminiChatHistory = [];
    let isWaitingGemini = false;

    const IASIS_SYSTEM_PROMPT = `
Você é o Iasis, o guia oficial e inteligência afetiva da Reviva Memories.
Seu propósito é conduzir uma conversa genuinamente humana, empática e acolhedora com o cliente (${clientFirstName}) para coletar memórias e desenvolver o roteiro do vídeo de homenagem (com imagem restaurada e voz da pessoa homenageada).

IDENTIDADE, GÊNERO E CONCORDÂNCIA GRAMATICAL DE IASIS:
- Você é o Iasis, um homem maduro, sábio, elegante, sereno e caloroso (identidade e gênero MASCULINO).
- Ao se referir a si mesmo, use SEMPRE o gênero masculino: "estou pronto", "estou atento", "fico muito honrado", "como seu guia oficial".
- Ao falar em conjunto com o cliente (1ª pessoa do plural), use SEMPRE o plural masculino/misto: "vamos JUNTOS", "estamos JUNTOS", "construiremos juntos essa homenagem". NUNCA use "juntas" ao se incluir na frase.
- Ao se dirigir à cliente (${clientFirstName}), concorde os adjetivos que se referem a ela ("seja muito bem-vinda", "sinta-se acolhida", "querida ${clientFirstName}"), mas as ações conjuntas são SEMPRE "vamos juntos".

POSTURA, TOM DE VOZ E LINGUAGEM CENTRADA (HOMEM MADURO, SÓBRIO E RESPEITOSO):
- Você se expressa como um homem maduro, equilibrado, sereno, seguro e de postura nobre.
- PROIBIÇÃO DE EXPRESSÕES MELOSAS, INFANTIS OU EXCESSIVAMENTE SENTIMENTALISTAS:
  * NUNCA use termos como "que meigo", "que fofo", "que doçura", "que amorzinho", "que meiguice", "juntinhas" ou exclamações infantis.
  * Homens maduros e sábios não usam essas expressões.
- VOCABULÁRIO ADEQUADO E RECOMENDADO:
  * "Compreendo perfeitamente, ${clientFirstName}."
  * "Um gesto muito nobre e significativo."
  * "Uma memória de grande valor."
  * "Registrado com todo o respeito e consideração."
  * "Uma trajetória admirável."
  * "Excelente. Vamos em frente."
- Mantenha um tom sóbrio, caloroso, respeitoso e firme, sem afetações ou sentimentalismo exagerado.

REGRA INVIOLÁVEL DE VOCABULÁRIO (NUNCA DIZER "SEU ENTE QUERIDO"):
- NUNCA use a expressão "seu ente querido" ou "sua pessoa querida". Quem está encomendando o vídeo muitas vezes está prestando uma homenagem a pedido de terceiros, presenteando um amigo, parente ou cliente.
- USE SEMPRE termos neutros e gentis, como:
  * "a pessoa que protagonizará a homenagem"
  * "a pessoa que transmitirá a mensagem com sua imagem e voz"
  * "a pessoa homenageada"
  * Ou, assim que souber o nome (ex: José, Maria), refira-se SEMPRE diretamente pelo nome ("o José", "a Maria").

PLANO ATIVO CONTRATADO PELO CLIENTE:
- Nome do Plano: Plano ${currentPlan.name}
- Duração do Vídeo: ${currentPlan.durationMinutes} Minuto${currentPlan.durationMinutes > 1 ? 's' : ''}
- Meta de Palavras: ${currentPlan.targetWords}
- Limite Máximo de Caracteres: ${currentPlan.maxChars} caracteres
- Foco Narrativo do Plano: ${currentPlan.structurePrompt}
- Instrução de Profundidade: ${currentPlan.specificInstructions}

REGRA DE OURO DA CADÊNCIA DRAMÁTICA EM TODOS OS ROTEIROS:
- ABERTURA: SEMPRE comece o roteiro com EMPOLGAÇÃO, ALEGRIA, SURPRESA E ENTUSIASMO! Evite inícios monótonos ou tristes. Ex: "Olha só pra você!", "Quem diria, hein?!", "Você achou mesmo que eu não estaria aqui?", "Que alegria imensa ver esse dia chegar!".
- CADÊNCIA & TRANSIÇÃO: A narrativa começa com energia comemorativa e transiciona suavemente para o afeto íntimo, relembrando histórias marcantes, valores e os conselhos do coração.
- RECADOS FAMILIARES PERSONALIZADOS (ESPECIALMENTE NOS PLANOS DE 2 E 3 MINUTOS): Nunca faça apenas uma saudação genérica ou lista fria de nomes. Crie recados personalizados e carinhosos com significado próprio para cada familiar mencionado (pai, mãe, irmãos, filhos, cônjuge).
- CLÍMAX & ENCERRAMENTO EXTREMAMENTE EMOCIONANTE: O final e a despedida devem ser profundamente comoventes, poéticos e inesquecíveis (o abraço espiritual que vence a distância, a presença viva no coração e a bênção de paz e luz eterna).

COMPROMISSO INEGOCIÁVEL DE DURAÇÃO (NUNCA FALTAR PALAVRAS):
- Se o cliente contratou 1 minuto, o roteiro NUNCA pode ter menos de 120 palavras (para que o vídeo nunca fique com 55 segundos).
- Se o cliente contratou 2 minutos, o roteiro NUNCA pode ter menos de 240 palavras (para que nunca fique com menos de 2 minutos).
- Se o cliente contratou 3 minutos, o roteiro NUNCA pode ter menos de 360 palavras.
- A quantidade de palavras DEVE preencher e exceder ligeiramente a minutagem, garantindo locução completa com pausas, respirações e afeto. Nunca economize palavras!

DIRETRIZ CENTRAL - ESCUTA ATIVA E COLIGAÇÃO CONTEXTUAL:
- NUNCA faça perguntas frias, robóticas ou desconectadas da fala anterior.
- SEMPRE costure a resposta do cliente na sua próxima frase com afeto, empatia e sentido.
- Se o cliente responder de forma muito breve ou pouco clara, NUNCA dê desculpas técnicas. Pergunte com carinho e educação o que ele quis dizer para enriquecer o roteiro.
- Se o cliente contar uma lembrança emocionante, um momento especial ou um apelido carinhoso, reconheça e valorize esse detalhe com carinho genuíno antes de fazer a próxima pergunta.

REGRAS DE COMUNICAÇÃO:
1. RESPOSTAS CONCISAS E ENVOLVENTES: Mantenha entre 2 a 3 frases curtas por mensagem durante a entrevista. Seja caloroso, nunca prolixo.
2. UMA PERGUNTA POR VEZ: Nunca acumule perguntas.
3. FOCO ESTRITO NA HOMENAGEM: Nunca fale sobre tecnologia interna ou assuntos alheios.

ETAPAS DA COLETA AFETIVA (UMA PERGUNTA POR TURNO COM COSTURA AFETIVA):
1. NOME DA PESSOA: Perguntar o nome da pessoa que protagonizará a homenagem e falará na mensagem.
2. DESTINATÁRIO DA HOMENAGEM: Acolher o nome e perguntar se a homenagem é para o próprio cliente ou se ele vai presentear alguém especial (ex: "Faremos uma bela homenagem com a imagem e a voz do José! E para quem será a homenagem? É para você mesma ou você vai presentear alguém com essa surpresa?").
3. LAÇO AFETIVO / PARENTESCO: Acolher o destinatário com afeto e perguntar APENAS qual era o laço afetivo / grau de parentesco entre eles (ex: "Que gesto maravilhoso! Qual é o laço de carinho ou parentesco entre o José e quem receberá o vídeo (ex: Pai e Filha, Avó e Neto, Amigos)?").
4. FORMA DE TRATAMENTO / APELIDO: Acolher o laço e perguntar APENAS como costumavam se chamar carinhosamente (ex: "E como ele(a) costumava chamar o destinatário carinhosamente? Pelo próprio nome ou por algum apelido carinhoso?").
5. OCASIÃO ESPECIAL (SOMENTE APÓS O LAÇO E APELIDO): Acolher e perguntar sobre a ocasião especial em que a homenagem será apresentada (ex: "Que carinho lindo! E qual é a ocasião especial dessa homenagem? É um aniversário, casamento, formatura, ou um momento de conforto e carinho?").
6. HISTÓRIA / ACONTECIMENTO MARCANTE: ${currentPlan.durationMinutes >= 2 ? 'Perguntar: "Para o Plano ' + currentPlan.name + ', temos espaço para relembrar histórias ricas: existe algum acontecimento inesquecível, história marcante ou momento de convivência que viveram juntos que vale a pena recordar com carinho?"' : 'Perguntar: "Existe algum acontecimento ou frase marcante que o(a) [Nome] diria à [Nome/Apelido da pessoa homenageada] que seria profundamente impactante e especial ouvir?"'}
7. CONSELHOS OU INCENTIVO: Perguntar de forma simples e direta: "Quais conselhos ou palavras de carinho e incentivo o(a) [Nome] daria para a [Nome/Apelido da pessoa homenageada]?"
8. RECADOS PERSONALIZADOS PARA A FAMÍLIA: ${currentPlan.durationMinutes >= 2 ? 'Perguntar: "No Plano ' + currentPlan.name + ', temos espaço dedicado para mensagens para outras pessoas queridas: quais familiares ou amigos próximos devem receber recados personalizados antes da bênção final?"' : 'Perguntar: "Quais outros familiares ou pessoas queridas não podem deixar de receber um abraço apertado e uma bênção no final da mensagem?"'}
9. TOM NARRATIVO E PERSONALIDADE (OBRIGATÓRIO ANTES DE GERAR O ROTEIRO):
   - Perguntar sobre o tom desejado para a narrativa da pessoa:
     "Para que as palavras e a locução reflitam com fidelidade o jeito único de ser do(a) [Nome], qual tom você prefere que prevaleça na homenagem? Um tom mais alegre, descontraído e bem-humorado/cômico, ou um tom profundamente emocionante, terno e poético?"
   - Ao receber a escolha do cliente, aplique fielmente esse estilo no roteiro.

FINALIZAÇÃO E ENTREGA DO ROTEIRO:
Assim que todas as informações (incluindo o tom desejado) forem compartilhadas, avise em uma frase serena e acolhedora ao cliente: "Por favor, aguarde um instante enquanto elaboro o roteiro com muito carinho e respeito..." e em seguida adicione no final:
[[ROTEIRO_FINAL]]
seguido do texto completo do roteiro da homenagem, redigido em PRIMEIRA PESSOA (a voz de quem protagoniza para a pessoa homenageada), aplicando a cadência de ABERTURA ALEGRE E EMPOLGADA -> DESENVOLVIMENTO COM MEMÓRIAS E RECADOS -> CLÍMAX DRAMÁTICO E SUBLIME, respeitando estritamente o PLANO ${currentPlan.name.toUpperCase()} (duração de ${currentPlan.durationMinutes} minuto(s), meta de ${currentPlan.targetWords}, limite absoluto de ${currentPlan.maxChars} caracteres).

REGRA DE FORMATAÇÃO DO ROTEIRO EM PARÁGRAFOS:
- O roteiro DEVE ser estruturado em 3 a 4 parágrafos bem espaçados, separados por uma linha em branco (pulo duplo de linha), para garantir cadência, pausas de respiração e excelente legibilidade.

REVISÃO E EDIÇÃO DO ROTEIRO:
Se o cliente solicitar alterações, revisões ou fornecer um trecho/frase próprio para substituir:
1. Acolha com carinho e entusiasmo a contribuição.
2. Aplique a modificação mantendo a métrica e o tempo do PLANO ${currentPlan.name.toUpperCase()}.
3. Avise em uma frase: "Aguarde um instante enquanto readequamos o texto com carinho e precisão..." e entregue o roteiro completo revisado com a tag [[ROTEIRO_FINAL]] seguida do novo roteiro integral estruturado em parágrafos.
`;

    const chatTypingText = document.getElementById('chat-typing-text');
    let latestScriptText = '';
    let scriptRevisionCount = 0;

    function formatAiMessage(txt) {
        if (!txt) return '';
        return txt.replace(/\n\n+/g, '<br><br>').replace(/\n/g, '<br>');
    }

    function formatScriptToParagraphs(rawText) {
        if (!rawText) return '';
        const clean = rawText.trim();
        const paragraphs = clean.split(/\n\s*\n|\r\n\s*\r\n/).filter(p => p.trim().length > 0);
        if (paragraphs.length <= 1) {
            const singleLines = clean.split(/\n+/).filter(p => p.trim().length > 0);
            return singleLines.map(p => `<p style="margin: 0 0 16px 0; text-indent: 0;">${p.trim()}</p>`).join('');
        }
        return paragraphs.map(p => `<p style="margin: 0 0 16px 0; text-indent: 0;">${p.trim().replace(/\n/g, '<br>')}</p>`).join('');
    }

    let isScriptApproved = false;
    let mediaRevisionsHistory = [];
    let latestPhotoFeedback = '';
    let legalTermSigned = null;
    let photoDecision = 'pending'; // 'pending' | 'approved' | 'rejected'
    let voiceDecision = 'pending'; // 'pending' | 'approved' | 'rejected'
    const SESSION_KEY = 'reviva_order_state_' + (orderData?.id || 1);

    function saveFullSessionState() {
        try {
            const state = {
                currentStep,
                uploadedPhotos,
                uploadedAudios,
                selectedBackground,
                selectedMusic,
                geminiChatHistory,
                scriptRevisionCount,
                latestScriptText,
                isScriptApproved,
                mediaRevisionsHistory,
                latestPhotoFeedback,
                legalTermSigned,
                photoDecision,
                voiceDecision,
                isPhotoApprovedState: photoDecision === 'approved',
                isVoiceApprovedState: voiceDecision === 'approved',
                interviewData: typeof interviewData !== 'undefined' ? interviewData : null,
                currentQuestionStep: typeof currentQuestionStep !== 'undefined' ? currentQuestionStep : 'ask_protagonista',
                chatHtml: interviewChatBox ? interviewChatBox.innerHTML : '',
                photoApproved: photoDecision === 'approved',
                voiceApproved: voiceDecision === 'approved',
                timestamp: new Date().toISOString()
            };
            localStorage.setItem(SESSION_KEY, JSON.stringify(state));
        } catch (e) {
            console.warn('Erro ao salvar sessão completa:', e);
        }
    }

    function saveChatSession() {
        saveFullSessionState();
    }

    function restoreFullSessionState(shouldNavigate = false) {
        try {
            const raw = localStorage.getItem(SESSION_KEY);
            if (!raw) return false;
            const state = JSON.parse(raw);
            if (!state) return false;

            // 1. Restaurar Fotos e Áudios
            if (Array.isArray(state.uploadedPhotos) && state.uploadedPhotos.length > 0) {
                uploadedPhotos = state.uploadedPhotos;
                renderPhotoPreviews();
            }
            if (Array.isArray(state.uploadedAudios) && state.uploadedAudios.length > 0) {
                uploadedAudios = state.uploadedAudios;
                renderAudioPreviews();
            }

            // 2. Restaurar Cenário e Trilha
            if (state.selectedBackground) {
                selectedBackground = state.selectedBackground;
                document.querySelectorAll('#scenariosContainer .scenario-card-full').forEach(c => {
                    if (c.dataset.bg === selectedBackground) {
                        c.classList.add('selected');
                        const container = document.getElementById('scenariosContainer');
                        if (container && container.firstElementChild !== c) container.prepend(c);
                    } else {
                        c.classList.remove('selected');
                    }
                });
            }
            if (state.selectedMusic) {
                selectedMusic = state.selectedMusic;
                document.querySelectorAll('#musicContainer .scenario-card-full').forEach(c => {
                    if (c.dataset.music === selectedMusic) {
                        c.classList.add('selected');
                        const container = document.getElementById('musicContainer');
                        if (container && container.firstElementChild !== c) container.prepend(c);
                    } else {
                        c.classList.remove('selected');
                    }
                });
            }

            // 3. Restaurar Termo de Responsabilidade e Aprovações da Etapa 4
            if (state.legalTermSigned) {
                legalTermSigned = state.legalTermSigned;
                if (typeof updateTermoUI === 'function') updateTermoUI();
            }

            if (Array.isArray(state.mediaRevisionsHistory)) {
                mediaRevisionsHistory = state.mediaRevisionsHistory;
            }
            if (state.latestPhotoFeedback) {
                latestPhotoFeedback = state.latestPhotoFeedback;
                const pFeed = document.getElementById('photo-rejection-feedback');
                if (pFeed) pFeed.value = latestPhotoFeedback;
            }
            if (state.latestVoiceFeedback) {
                latestVoiceFeedback = state.latestVoiceFeedback;
                const vFeed = document.getElementById('voice-rejection-feedback');
                if (vFeed) vFeed.value = latestVoiceFeedback;
            }

            if (state.photoDecision) {
                photoDecision = state.photoDecision;
                if (typeof updatePhotoApprovalUI === 'function') updatePhotoApprovalUI(photoDecision);
            } else if (typeof state.photoApproved === 'boolean' || typeof state.isPhotoApprovedState === 'boolean') {
                const pApp = typeof state.photoApproved === 'boolean' ? state.photoApproved : state.isPhotoApprovedState;
                if (typeof updatePhotoApprovalUI === 'function') updatePhotoApprovalUI(pApp ? 'approved' : 'pending');
            }

            if (state.voiceDecision) {
                voiceDecision = state.voiceDecision;
                if (typeof updateVoiceApprovalUI === 'function') updateVoiceApprovalUI(voiceDecision);
            } else if (typeof state.voiceApproved === 'boolean' || typeof state.isVoiceApprovedState === 'boolean') {
                const vApp = typeof state.voiceApproved === 'boolean' ? state.voiceApproved : state.isVoiceApprovedState;
                if (typeof updateVoiceApprovalUI === 'function') updateVoiceApprovalUI(vApp ? 'approved' : 'pending');
            }

            // 4. Restaurar Chat e Roteiro
            if (state.chatHtml && state.chatHtml.trim().length > 0) {
                interviewChatBox.innerHTML = state.chatHtml;
                geminiChatHistory = state.geminiChatHistory || [];
                scriptRevisionCount = state.scriptRevisionCount || 0;
                latestScriptText = state.latestScriptText || '';
                isScriptApproved = !!state.isScriptApproved;
                if (state.interviewData && typeof interviewData !== 'undefined') interviewData = state.interviewData;
                if (state.currentQuestionStep && typeof currentQuestionStep !== 'undefined') currentQuestionStep = state.currentQuestionStep;

                // Reanexar eventos aos botões de aprovar/editar já existentes
                interviewChatBox.querySelectorAll('.chat-message-row').forEach(row => {
                    const btnApprove = row.querySelector('.btn-chat-approve-script');
                    const btnEdit = row.querySelector('.btn-chat-edit-script');
                    if (btnApprove) {
                        if (isScriptApproved) {
                            btnApprove.disabled = true;
                            btnApprove.innerHTML = `<i data-lucide="check-check" style="width: 13px; height: 13px;"></i> APROVADO ✓`;
                            btnApprove.style.background = '#22c55e';
                            btnApprove.style.borderColor = '#22c55e';
                            btnApprove.style.cursor = 'default';
                            btnApprove.style.opacity = '0.9';
                            if (btnEdit) btnEdit.style.display = 'none';
                        } else {
                            btnApprove.onclick = async () => {
                                btnApprove.disabled = true;
                                btnApprove.innerHTML = `<i data-lucide="check-check" style="width: 13px; height: 13px;"></i> APROVADO ✓`;
                                btnApprove.style.background = '#22c55e';
                                btnApprove.style.borderColor = '#22c55e';
                                btnApprove.style.cursor = 'default';
                                btnApprove.style.opacity = '0.9';
                                if (btnEdit) btnEdit.style.display = 'none';
                                isScriptApproved = true;
                                saveFullSessionState();
                                const wordCount = latestScriptText.trim().split(/\s+/).filter(w => w.length > 0).length;
                                if (window.revivaData?.saveApprovedScript) {
                                    await window.revivaData.saveApprovedScript(orderData?.id || 1, latestScriptText, wordCount);
                                }
                                goToStep(3);
                            };
                        }
                    }
                    if (btnEdit && !isScriptApproved) {
                        btnEdit.onclick = () => {
                            const editPromptMsg = "Perfeito! Me diga: qual parte você gostaria de ajustar ou revisar? Se preferir, você também pode redigir a frase ou o trecho exatamente como gostaria com suas palavras, e eu farei a adequação do tempo e da métrica para você.";
                            addAiChatMessage(editPromptMsg);
                            if (chatInput) {
                                chatInput.placeholder = "Descreva o que deseja mudar ou envie o trecho redigido...";
                                chatInput.focus();
                            }
                        };
                    }
                });

                if (window.lucide) lucide.createIcons();
                interviewChatBox.scrollTop = interviewChatBox.scrollHeight;
            }

            // 5. Restaurar Etapa Atual (somente se solicitado explicitamente na carga inicial)
            if (shouldNavigate && state.currentStep && state.currentStep >= 1) {
                goToStep(state.currentStep, true);
            }

            return true;
        } catch (e) {
            console.warn('Erro ao restaurar sessão completa:', e);
        }
        return false;
    }

    function restoreChatSession() {
        return restoreFullSessionState(false);
    }

    function startInterviewChat() {
        const badgeEl = document.getElementById('chat-header-plan-badge');
        if (badgeEl) {
            badgeEl.textContent = `PLANO ${currentPlan.name.toUpperCase()} • ${currentPlan.durationMinutes} MINUTO${currentPlan.durationMinutes > 1 ? 'S' : ''}`;
        }

        if (interviewChatBox) {
            // Tenta restaurar se o chat estiver vazio
            if (interviewChatBox.children.length === 0) {
                restoreChatSession();
            }

            // Se após a restauração o chat continuar vazio, envia a mensagem inicial de boas-vindas do Iasis
            if (interviewChatBox.children.length === 0) {
                const firstMessage = `Olá, ${clientFirstName}! Eu sou o Iasis, seu guia aqui na Reviva Memories.<br><br>Faremos agora uma breve conversa para capturar as memórias, o afeto e os detalhes necessários para o desenvolvimento do roteiro personalizado da homenagem.<br><br>Podemos começar?`;
                
                geminiChatHistory = [
                    {
                        role: 'model',
                        parts: [{ text: `Olá, ${clientFirstName}! Eu sou o Iasis, seu guia aqui na Reviva Memories. Faremos agora uma breve conversa para capturar as memórias, o afeto e os detalhes necessários para o desenvolvimento do roteiro personalizado da homenagem. Podemos começar?` }]
                    }
                ];

                addAiChatMessage(firstMessage);
            }
        }
    }

    function addAiChatMessage(text, callback) {
        if (btnSendChat) btnSendChat.disabled = true;
        if (chatInput) chatInput.disabled = true;
        if (chatTypingText) chatTypingText.textContent = "Iasis está lapidando as palavras...";
        if (chatTypingIndicator) chatTypingIndicator.style.display = 'flex';
        interviewChatBox.scrollTop = interviewChatBox.scrollHeight;

        setTimeout(() => {
            if (chatTypingIndicator) chatTypingIndicator.style.display = 'none';

            const row = document.createElement('div');
            row.className = 'chat-message-row chat-ai-row';
            row.innerHTML = `
                <img src="iasis_avatar.jpg" alt="Iasis" class="chat-avatar-circle">
                <div class="chat-bubble-compact chat-ai">
                    <strong style="color: #e5c378; font-size: 0.90rem;">Iasis:</strong><br>
                    ${text}
                </div>
            `;
            interviewChatBox.appendChild(row);
            interviewChatBox.scrollTop = interviewChatBox.scrollHeight;

            saveChatSession();

            if (btnSendChat) btnSendChat.disabled = false;
            if (chatInput) {
                chatInput.disabled = false;
                chatInput.focus();
            }
            if (callback) callback();
        }, 1100);
    }

    function addScriptChatMessage(introText, scriptContent) {
        if (btnSendChat) btnSendChat.disabled = true;
        if (chatInput) chatInput.disabled = true;
        if (chatTypingText) chatTypingText.textContent = "Por favor, aguarde um instante... O Iasis está elaborando o roteiro com muito carinho e respeito.";
        if (chatTypingIndicator) chatTypingIndicator.style.display = 'flex';
        interviewChatBox.scrollTop = interviewChatBox.scrollHeight;

        latestScriptText = scriptContent;
        scriptRevisionCount++;
        const versionLabel = scriptRevisionCount === 1 ? 'Versão 1.0 (Original)' : `Versão 1.${scriptRevisionCount - 1} (${scriptRevisionCount - 1}ª Revisão)`;
        const wordCount = scriptContent.trim().split(/\s+/).filter(w => w.length > 0).length;
        const charCount = scriptContent.length;

        setTimeout(() => {
            if (chatTypingIndicator) chatTypingIndicator.style.display = 'none';

            const row = document.createElement('div');
            row.className = 'chat-message-row chat-ai-row';
            row.innerHTML = `
                <img src="iasis_avatar.jpg" alt="Iasis" class="chat-avatar-circle">
                <div class="chat-bubble-compact chat-ai" style="max-width: 95%;">
                    <strong style="color: #e5c378; font-size: 0.90rem;">Iasis:</strong><br>
                    ${introText ? formatAiMessage(introText) + '<br><br>' : ''}
                    
                    <div style="background: rgba(10, 6, 4, 0.94); border: 1.5px solid rgba(197, 160, 89, 0.65); border-radius: var(--radius-sm); padding: 18px 20px; margin: 10px 0; color: #fdf6ec; font-size: 1.02rem; line-height: 1.8; font-family: var(--font-serif); font-style: italic; box-shadow: 0 6px 24px rgba(0,0,0,0.6); text-align: left;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; border-bottom: 1px solid rgba(197, 160, 89, 0.35); padding-bottom: 6px; font-style: normal;">
                            <span style="color: #e5c378; font-size: 0.78rem; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase;">📜 ${versionLabel}</span>
                            <span style="color: #d8c7b0; font-size: 0.72rem; font-weight: 600;">Plano ${currentPlan.name} (${currentPlan.durationMinutes} min)</span>
                        </div>
                        ${formatScriptToParagraphs(scriptContent)}
                    </div>

                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px; flex-wrap: wrap; gap: 8px; border-top: 1px dashed rgba(197, 160, 89, 0.3); padding-top: 8px;">
                        <span style="color: #e5c378; font-size: 0.74rem; font-weight: 600; display: flex; align-items: center; gap: 5px;">
                            <i data-lucide="check-circle-2" style="width: 14px; height: 14px; color: #4ade80;"></i>
                            <span>${wordCount} palavras • ${charCount} caracteres <span style="color: #4ade80; margin-left: 4px;">✓ Compatível com o Plano ${currentPlan.name} (${currentPlan.durationMinutes} min)</span></span>
                        </span>
                        <div style="display: flex; gap: 8px;">
                            <button class="btn btn-secondary btn-chat-copy-script" style="height: 30px !important; padding: 0 12px !important; font-size: 0.72rem !important; border-color: rgba(197, 160, 89, 0.5) !important;">
                                <i data-lucide="copy" style="width: 12px; height: 12px;"></i> COPIAR
                            </button>
                            <button class="btn btn-secondary btn-chat-edit-script" style="height: 30px !important; padding: 0 14px !important; font-size: 0.72rem !important; border-color: rgba(197, 160, 89, 0.5) !important;">
                                <i data-lucide="edit-3" style="width: 12px; height: 12px;"></i> EDITAR
                            </button>
                            <button class="btn btn-primary btn-chat-approve-script" style="height: 30px !important; padding: 0 16px !important; font-size: 0.72rem !important; font-weight: 600;">
                                <i data-lucide="check" style="width: 13px; height: 13px;"></i> APROVAR
                            </button>
                        </div>
                    </div>
                </div>
            `;
            interviewChatBox.appendChild(row);
            interviewChatBox.scrollTop = interviewChatBox.scrollHeight;

            if (window.lucide) lucide.createIcons();

            const btnCopy = row.querySelector('.btn-chat-copy-script');
            const btnApprove = row.querySelector('.btn-chat-approve-script');
            const btnEdit = row.querySelector('.btn-chat-edit-script');

            btnCopy?.addEventListener('click', () => {
                navigator.clipboard?.writeText(scriptContent).then(() => {
                    const orig = btnCopy.innerHTML;
                    btnCopy.innerHTML = `<i data-lucide="check" style="width: 12px; height: 12px;"></i> COPIADO!`;
                    btnCopy.style.borderColor = '#22c55e';
                    btnCopy.style.color = '#4ade80';
                    if (window.lucide) lucide.createIcons();
                    setTimeout(() => {
                        btnCopy.innerHTML = orig;
                        btnCopy.style.borderColor = '';
                        btnCopy.style.color = '';
                        if (window.lucide) lucide.createIcons();
                    }, 2000);
                }).catch(err => console.error("Erro ao copiar:", err));
            });

            btnApprove?.addEventListener('click', async () => {
                btnApprove.disabled = true;
                btnApprove.innerHTML = `<i data-lucide="check-check" style="width: 13px; height: 13px;"></i> APROVADO ✓`;
                btnApprove.style.background = '#22c55e';
                btnApprove.style.borderColor = '#22c55e';
                btnApprove.style.cursor = 'default';
                btnApprove.style.opacity = '0.9';
                if (btnEdit) btnEdit.style.display = 'none';
                isScriptApproved = true;
                saveChatSession();
                if (window.revivaData?.saveApprovedScript) {
                    await window.revivaData.saveApprovedScript(orderData?.id || 1, scriptContent, wordCount);
                }
                goToStep(3);
            });

            btnEdit?.addEventListener('click', () => {
                const editPromptMsg = "Perfeito! Me diga: qual parte você gostaria de ajustar ou revisar? Se preferir, você também pode redigir a frase ou o trecho exatamente como gostaria com suas palavras, e eu farei a adequação do tempo e da métrica para você.";
                addAiChatMessage(editPromptMsg);
                if (chatInput) {
                    chatInput.placeholder = "Descreva o que deseja mudar ou envie o trecho redigido...";
                    chatInput.focus();
                }
            });

            saveChatSession();

            if (btnSendChat) btnSendChat.disabled = false;
            if (chatInput) {
                chatInput.disabled = false;
                chatInput.focus();
            }
        }, 1200);
    }

    function addUserChatMessage(text) {
        const clientInitial = (clientFirstName || 'M').charAt(0).toUpperCase();
        const row = document.createElement('div');
        row.className = 'chat-message-row chat-user-row';
        row.innerHTML = `
            <div class="chat-bubble-compact chat-user">
                ${text}
            </div>
            <div class="chat-user-avatar" title="${clientFirstName}">
                ${clientInitial}
            </div>
        `;
        interviewChatBox.appendChild(row);
        interviewChatBox.scrollTop = interviewChatBox.scrollHeight;
        saveChatSession();
    }

    async function queryGeminiWithFallback() {
        for (const model of GEMINI_MODELS) {
            try {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: geminiChatHistory,
                        systemInstruction: {
                            parts: [{ text: IASIS_SYSTEM_PROMPT }]
                        }
                    })
                });

                if (!response.ok) {
                    console.warn(`Modelo ${model} retornou status ${response.status}. Tentando próximo...`);
                    continue;
                }

                const data = await response.json();
                const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) return text;
            } catch (err) {
                console.warn(`Erro no modelo ${model}:`, err);
            }
        }
        return null;
    }

    let currentQuestionStep = 'ask_protagonista';
    let interviewData = {
        protagonista: '',
        destinatario: clientFirstName,
        parentesco: '',
        apelido: '',
        ocasiao: '',
        historia: '',
        conselhos: '',
        familiares: ''
    };

    function cleanName(raw) {
        if (!raw) return '';
        return raw.replace(/^(o\s+nome\s+é\s+|o\s+nome\s+dele\s+é\s+|o\s+nome\s+dela\s+é\s+|é\s+|chama-se\s+|se\s+chama\s+|ele\s+é\s+o\s+|ela\s+é\s+a\s+|meu\s+pai\s+|minha\s+mãe\s+|meu\s+|minha\s+)/i, '')
                  .replace(/[.!?,;]+$/g, '')
                  .trim();
    }

    function generateSmartInterviewResponse(userText) {
        const text = userText.trim();
        const lower = text.toLowerCase();

        // 1. Tratamento de Correções do Usuário (ex: "É Artur o nome dele", "Escreveu errado", "O nome correto é...")
        if (lower.includes('nome dele') || lower.includes('nome dela') || lower.includes('o nome é') || lower.includes('escreveu') || lower.includes('errou') || lower.includes('correto') || lower.includes('artur')) {
            const extracted = cleanName(text);
            if (extracted) {
                interviewData.protagonista = extracted;
            }
            return {
                chat: `Peço desculpas pela distração, ${clientFirstName}! Já anotei o nome com todo carinho: <strong>${interviewData.protagonista || 'Artur'}</strong>.<br><br>E me diga: essa homenagem é para você mesma ou você vai presentear e surpreender alguém muito especial?`
            };
        }

        // 2. Cumprimentos e Conversas Iniciais ("Como vai?", "Tudo bem?", "Olá")
        if ((lower === 'como vai?' || lower === 'como vai' || lower === 'tudo bem?' || lower === 'tudo bem' || lower === 'olá' || lower === 'ola' || lower === 'oi') && !interviewData.protagonista) {
            return {
                chat: `Vou muito bem, ${clientFirstName}, obrigado por perguntar! É uma honra imensa estar com você nesta missão tão especial.<br><br>Para começarmos a dar vida a este roteiro emocionante, qual é o nome da pessoa que transmitirá a mensagem com sua imagem e voz no vídeo?`
            };
        }

        // 3. Solicitação de Edição pós-entrega do roteiro
        if (latestScriptText && (lower.includes('mudar') || lower.includes('trocar') || lower.includes('alterar') || lower.includes('tirar') || lower.includes('colocar') || lower.includes('gostaria') || lower.includes('ao invés') || lower.includes('edite') || lower.includes('roteiro') || lower.includes('prefiro'))) {
            let revised = latestScriptText;
            if (lower.includes('trocar') || lower.includes('ao invés') || lower.includes('mude')) {
                revised = revised.replace(/Guardo com tanto carinho/i, `Com todo o carinho do mundo`) + `\n\n${text}`;
            }
            return {
                chat: `Perfeito, ${clientFirstName}! Incorporei exatamente essas palavras com todo o afeto para manter o tempo do Plano ${currentPlan.name} e a intensidade da homenagem. Veja a versão atualizada:`,
                script: revised
            };
        }

        // 4. Fluxo Conversacional Baseado em Estado Real (State Machine Semântica)
        switch (currentQuestionStep) {
            case 'ask_protagonista':
                interviewData.protagonista = cleanName(text) || text;
                currentQuestionStep = 'ask_destinatario';
                return {
                    chat: `Que nome abençoado! O(A) <strong>${interviewData.protagonista}</strong> terá uma presença inesquecível.<br><br>E me conte: essa homenagem é para você mesma ou você vai presentear e surpreender alguém muito especial?`
                };

            case 'ask_destinatario':
                interviewData.destinatario = (lower.includes('mim') || lower.includes('mesma') || lower.includes('eu')) ? clientFirstName : text;
                currentQuestionStep = 'ask_parentesco';
                const destNome = interviewData.destinatario === clientFirstName ? 'você' : interviewData.destinatario;
                return {
                    chat: `Que gesto comovente e cheio de significado!<br><br>E qual é o laço de carinho ou parentesco entre o(a) ${interviewData.protagonista} e ${destNome} (por exemplo: Pai e Filha, Avó e Neto, Irmãos, Amigos de longa data)?`
                };

            case 'ask_parentesco':
                interviewData.parentesco = text;
                currentQuestionStep = 'ask_apelido';
                return {
                    chat: `Entendido com todo o carinho.<br><br>E no dia a dia, como o(a) ${interviewData.protagonista} costumava chamar o destinatário carinhosamente? Por algum apelido especial ou pelo próprio nome?`
                };

            case 'ask_apelido':
                interviewData.apelido = text.replace(/pelo nome|próprio nome|meu nome/gi, clientFirstName).trim() || clientFirstName;
                currentQuestionStep = 'ask_ocasiao';
                return {
                    chat: `Que doçura de lembrança!<br><br>E qual é a ocasião especial em que essa homenagem será apresentada (um aniversário, casamento, formatura ou um momento de aconchego e reencontro)?`
                };

            case 'ask_ocasiao':
                interviewData.ocasiao = text;
                currentQuestionStep = 'ask_historia';
                return {
                    chat: `Momento perfeito para eternizar o afeto.<br><br>Me diga: há alguma história marcante, acontecimento inesquecível ou momento especial vivido juntos que você gostaria que o(a) ${interviewData.protagonista} relembrasse no vídeo?`
                };

            case 'ask_historia':
                interviewData.historia = text;
                currentQuestionStep = 'ask_conselhos';
                return {
                    chat: `Emocionante demais...<br><br>E quais conselhos, lições de vida ou palavras de incentivo e carinho o(a) ${interviewData.protagonista} sempre dizia e deixaria gravado para aquecer o coração?`
                };

            case 'ask_conselhos':
                interviewData.conselhos = text;
                currentQuestionStep = 'ask_familiares';
                return {
                    chat: `Palavras que têm o poder de transformar qualquer dia!<br><br>E antes da bênção final, há outros familiares próximos ou amigos que não podem deixar de receber um abraço carinhoso no vídeo?`
                };

            case 'ask_familiares':
                interviewData.familiares = text;
                currentQuestionStep = 'ask_tom';
                return {
                    chat: `Perfeito! E para que as palavras e o estilo reflitam com máxima fidelidade a personalidade do(a) ${interviewData.protagonista || 'protagonista'}, qual tom você prefere que prevaleça na narrativa?<br><br>Um tom mais <strong>alegre, descontraído e cômico</strong> (com o jeitão bem-humorado de ser), ou um tom <strong>profundamente emocionante, terno e poético</strong>?`
                };

            case 'ask_tom':
            default:
                interviewData.tom = text;
                currentQuestionStep = 'script_ready';

                const isComico = lower.includes('cômico') || lower.includes('comico') || lower.includes('descontraído') || lower.includes('descontraido') || lower.includes('engraçado') || lower.includes('alegre') || lower.includes('bem-humorado') || lower.includes('humor');
                const protagonista = interviewData.protagonista || 'Artur';
                const apelido = interviewData.apelido || clientFirstName;
                const historia = interviewData.historia || 'tantos momentos de risos e união que compartilhamos';
                const conselhos = interviewData.conselhos || 'siga firme com o coração em paz e a cabeça erguida';
                const familiares = (lower.includes('não') || lower.includes('nao') || lower.includes('nenhum')) ? 'todos que guardam nosso carinho' : (interviewData.familiares || 'toda a nossa família querida');

                let script = "";
                if (isComico) {
                    script = `Olha só pra você, ${apelido}! Quem diria, hein?! Achou mesmo que eu ia perder essa festa e deixar você comemorar sem ouvir a minha voz? Jamais!\n\nEu dou risada só de lembrar de ${historia}. Bons tempos aqueles! Mas falando sério, meu coração se enche de orgulho de ver você brilhando. Meu único conselho: ${conselhos}. E trate de dar um abraço bem forte em ${familiares}, que eu tô de olho em vocês daqui!\n\nReceba o meu melhor abraço, cheio de energia boa e alegria. Um beijo estalado e vamos comemorar que a vida é pra ser vivida!`;
                } else if (currentPlan.durationMinutes === 1) {
                    script = `Olha só pra você, ${apelido}! Achou mesmo que eu deixaria de estar presente neste dia tão marcante? Que alegria imensa poder falar com você agora!\n\nEu guardo com tanto carinho no meu peito cada segundo que estivemos juntos... Lembro como se fosse hoje de ${historia}. Saiba que mesmo na distância, meu afeto por você permanece vivo e vibrante. Quero que você nunca esqueça: ${conselhos}. Tenha orgulho dos seus passos e cuide sempre de ${familiares}.\n\nReceba o meu abraço mais apertado, cheio de luz e boas lembranças. Fique em paz e continue brilhando!`;
                } else if (currentPlan.durationMinutes === 2) {
                    script = `Olha só pra você! Que momento emocionante e que alegria ver esse dia chegar! Você achou que eu não estaria aqui para comemorar com você? Pois estou bem aqui, com o coração transbordando de orgulho!\n\nComo é bom lembrar da nossa trajetória... Lembro com um sorriso no rosto de ${historia}. Cada instante ao seu lado foi uma bênção que guardo na eternidade. Quero te deixar um pedido muito especial: ${conselhos}. Nunca duvide da força que você tem e da pessoa maravilhosa que você se tornou.\n\nE não posso esquecer de deixar o meu carinho para ${familiares}. Digam a todos que continuo comemorando cada vitória e envolvendo cada um em paz e proteção.\n\nSinta a minha mão no seu ombro e o calor do meu abraço que vence o tempo. Seja feliz, viva com intensidade e saiba que este carinho é eterno. Fique com Deus!`;
                } else {
                    script = `Olha só pra você, ${apelido}! Quem diria, hein?! Que dia radiante e que honra estar aqui falando com você! Não existe distância no mundo capaz de separar o afeto que nos une.\n\nRelembrar a nossa história enche a alma de paz. Como esquecer de ${historia}? Cada risada, cada conversa na varanda, cada conselho trocado... Tudo isso permanece vivo e eternizado na memória.\n\nNesta data especial de ${interviewData.ocasiao || 'comemoração'}, meu maior desejo é que você continue trilhando o seu caminho com sabedoria. Lembre-se sempre: ${conselhos}. Seja generosa, cuide dos seus e nunca perca esse brilho no olhar.\n\nQuero deixar uma mensagem de carinho profundo também para ${familiares}. Que o amor continue sendo o alicerce de vocês. Cuidem uns dos outros como sempre fizemos.\n\nReceba agora a minha bênção mais carinhosa e um abraço longo e apertado. Onde há carinho e memória viva, o afeto nunca termina. Um grande abraço do fundo do coração!`;
                }

                return {
                    chat: `Mariana, foi uma honra conhecer essa história. Estruturei o roteiro oficial respeitando o tom escolhido e o tempo do Plano ${currentPlan.name} (${currentPlan.durationMinutes} min). Confira o texto abaixo:`,
                    script: script
                };
        }
    }

    async function handleChatSubmit() {
        const text = chatInput.value.trim();
        if (!text || isWaitingGemini) return;

        addUserChatMessage(text);
        chatInput.value = '';
        chatInput.placeholder = "Escreva sua resposta...";

        geminiChatHistory.push({
            role: 'user',
            parts: [{ text: text }]
        });

        isWaitingGemini = true;
        if (btnSendChat) btnSendChat.disabled = true;
        if (chatInput) chatInput.disabled = true;
        if (chatTypingIndicator) chatTypingIndicator.style.display = 'flex';
        interviewChatBox.scrollTop = interviewChatBox.scrollHeight;

        try {
            const rawAiText = await queryGeminiWithFallback();

            if (rawAiText) {
                geminiChatHistory.push({
                    role: 'model',
                    parts: [{ text: rawAiText }]
                });

                if (rawAiText.includes('[[ROTEIRO_FINAL]]')) {
                    const parts = rawAiText.split('[[ROTEIRO_FINAL]]');
                    const chatPart = parts[0].trim();
                    const scriptPart = parts[1].trim();

                    addScriptChatMessage(chatPart, scriptPart);
                } else {
                    addAiChatMessage(formatAiMessage(rawAiText));
                }
            } else {
                // Fallback Inteligente Contextual: Conduz a entrevista completa com afeto e empatia
                const responseObj = generateSmartInterviewResponse(text);
                if (responseObj.script) {
                    addScriptChatMessage(responseObj.chat, responseObj.script);
                } else {
                    addAiChatMessage(formatAiMessage(responseObj.chat));
                }
            }
        } catch (error) {
            console.error("Erro no processamento do Iasis:", error);
            const responseObj = generateSmartInterviewResponse(text);
            if (responseObj.script) {
                addScriptChatMessage(responseObj.chat, responseObj.script);
            } else {
                addAiChatMessage(formatAiMessage(responseObj.chat));
            }
        } finally {
            isWaitingGemini = false;
        }
    }

    btnSendChat?.addEventListener('click', handleChatSubmit);
    chatInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleChatSubmit();
    });

    // =========================================================================
    // ETAPA 03: A LAPIDAÇÃO (ÁUDIO, TRILHA & APROVAÇÃO DAS MÍDIAS)
    // =========================================================================
    const audioDropzone = document.getElementById('audio-dropzone');
    const audioInput = document.getElementById('audio-input');

    let audioTipsInterval = null;
    function initAudioTipsRotator() {
        if (audioTipsInterval) clearInterval(audioTipsInterval);
        const rotator = document.getElementById('audioTipsRotator');
        if (!rotator) return;
        const slides = rotator.querySelectorAll('.dropzone-tip-slide');
        if (slides.length <= 1) return;
        let currentIdx = 0;
        audioTipsInterval = setInterval(() => {
            slides[currentIdx].classList.remove('active');
            currentIdx = (currentIdx + 1) % slides.length;
            slides[currentIdx].classList.add('active');
        }, 2800);
    }
    initAudioTipsRotator();

    if (audioDropzone) {
        audioDropzone.addEventListener('click', (e) => {
            if (e.target.closest('.preview-remove-btn')) return;
            if (!legalTermSigned || !legalTermSigned.signed) {
                e.stopPropagation();
                if (typeof window.openTermoModal === 'function') window.openTermoModal(false);
                return;
            }
            if (uploadedAudios.length < 3) {
                audioInput?.click();
            }
        });

        audioDropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            audioDropzone.style.borderColor = '#f6e3c5';
            audioDropzone.style.background = 'rgba(197, 160, 89, 0.12)';
        });

        audioDropzone.addEventListener('dragleave', () => {
            audioDropzone.style.borderColor = 'rgba(197, 160, 89, 0.45)';
            audioDropzone.style.background = 'rgba(8, 5, 3, 0.55)';
        });

        audioDropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            audioDropzone.style.borderColor = 'rgba(197, 160, 89, 0.45)';
            audioDropzone.style.background = 'rgba(8, 5, 3, 0.55)';
            handleAudioFiles(e.dataTransfer.files);
        });
    }

    if (audioInput) {
        audioInput.addEventListener('change', (e) => {
            handleAudioFiles(e.target.files);
            audioInput.value = '';
        });
    }

    function handleAudioFiles(files) {
        const remainingSlots = 3 - uploadedAudios.length;
        if (remainingSlots <= 0) return;

        const filesToProcess = Array.from(files).slice(0, remainingSlots);
        filesToProcess.forEach(file => {
            uploadedAudios.push({ name: file.name, size: (file.size / 1024 / 1024).toFixed(1) + ' MB' });
        });
        renderAudioPreviews();
    }

    function renderAudioPreviews() {
        if (!audioDropzone) return;
        const count = uploadedAudios.length;

        if (count === 0) {
            audioDropzone.innerHTML = `
                <div class="audio-dropzone-header" style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
                    <i data-lucide="mic" style="width: 26px; height: 26px; color: #e5c378; margin-bottom: 2px;"></i>
                    <h4 style="color: #f6e3c5; font-size: 0.88rem; margin: 0; font-weight: 600;">Envie áudios com a voz original</h4>
                </div>

                <div class="dropzone-tips-rotator" id="audioTipsRotator">
                    <div class="dropzone-tip-slide active">
                        <i data-lucide="message-square"></i>
                        <span>Áudios de WhatsApp ou vídeos</span>
                    </div>
                    <div class="dropzone-tip-slide">
                        <i data-lucide="volume-2"></i>
                        <span>Voz clara e sem ruídos</span>
                    </div>
                    <div class="dropzone-tip-slide">
                        <i data-lucide="clock"></i>
                        <span>Até 3 minutos de gravação</span>
                    </div>
                    <div class="dropzone-tip-slide">
                        <i data-lucide="sparkles"></i>
                        <span>Gravações espontâneas em vida</span>
                    </div>
                </div>

                <input type="file" id="audio-input" multiple accept="audio/*,video/*" style="display: none;">
            `;
            const newInput = audioDropzone.querySelector('#audio-input');
            newInput?.addEventListener('change', (e) => {
                handleAudioFiles(e.target.files);
                newInput.value = '';
            });
            if (window.lucide) lucide.createIcons();
            initAudioTipsRotator();
            return;
        }

        let audiosHtml = uploadedAudios.map((aud, idx) => `
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; background: rgba(18, 12, 8, 0.7); border: 1px solid rgba(197, 160, 89, 0.4); border-radius: 20px; padding: 4px 10px; width: 100%; max-width: 280px; box-sizing: border-box;">
                <div style="display: flex; align-items: center; gap: 6px; overflow: hidden;">
                    <i data-lucide="mic" style="width: 14px; height: 14px; color: #e5c378; flex-shrink: 0;"></i>
                    <span style="font-size: 0.72rem; color: #f6e3c5; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px;">${aud.name}</span>
                </div>
                <button class="preview-remove-btn" onclick="removeAudio(${idx}, event)" title="Remover áudio" style="width: 18px; height: 18px; border-radius: 50%; background: rgba(14, 9, 6, 0.95); color: #e5c378; border: 1px solid #e5c378; font-size: 10px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; line-height: 1; padding: 0;">✕</button>
            </div>
        `).join('');

        audioDropzone.innerHTML = `
            <div style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: space-evenly; align-items: center; padding: 2px 0;">
                <div style="display: inline-flex; align-items: center; gap: 6px; background: rgba(197, 160, 89, 0.15); border: 1px solid rgba(197, 160, 89, 0.4); border-radius: 20px; padding: 3px 12px;">
                    <span style="color: #e5c378; font-weight: bold; font-size: 0.85rem;">✓</span>
                    <span style="color: #f6e3c5; font-size: 0.82rem; font-weight: 600;">
                        ${count} ${count === 1 ? 'áudio anexado' : 'áudios anexados'}
                    </span>
                </div>

                <div style="display: flex; flex-direction: column; gap: 4px; justify-content: center; align-items: center; width: 100%; padding: 2px 0;">
                    ${audiosHtml}
                </div>

                <div style="font-size: 0.72rem; color: ${count < 3 ? '#e5c378' : 'var(--text-secondary)'}; font-weight: 500;">
                    ${count < 3 ? '+ Clique para adicionar mais áudios (máx. 3)' : '✓ Limite de 3 gravações atingido'}
                </div>
            </div>
            <input type="file" id="audio-input" multiple accept="audio/*,video/*" style="display: none;">
        `;

        const newInput = audioDropzone.querySelector('#audio-input');
        newInput?.addEventListener('change', (e) => {
            handleAudioFiles(e.target.files);
            newInput.value = '';
        });
        if (window.lucide) lucide.createIcons();
    }

    window.removeAudio = (index, event) => {
        if (event) event.stopPropagation();
        uploadedAudios.splice(index, 1);
        renderAudioPreviews();
    };

    // Seletor de Trilha Sonora (Mesmo Formato e Animação das Paisagens)
    document.querySelectorAll('#musicContainer .scenario-card-full').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('#musicContainer .scenario-card-full').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedMusic = card.dataset.music;

            // No Desktop: Mover o card selecionado para o topo da lista de trilhas
            const container = document.getElementById('musicContainer');
            if (container && container.firstElementChild !== card) {
                container.prepend(card);
            }
            saveFullSessionState();
        });
    });

    // =========================================================================
    // PLAYER CENTRAL DE AMOSTRA DE VOZ CLONADA (ETAPA 4)
    // =========================================================================
    const btnPlayVoiceSampleCenter = document.getElementById('btnPlayVoiceSampleCenter');
    const iconVoicePlayCenter = document.getElementById('icon-voice-play-center');
    const voiceSampleAudio = document.getElementById('voiceSampleAudio');
    const voiceSampleProgress = document.getElementById('voiceSampleProgress');
    const voiceSampleTime = document.getElementById('voiceSampleTime');
    const voiceSampleCurrentTime = document.getElementById('voiceSampleCurrentTime');

    if (btnPlayVoiceSampleCenter && voiceSampleAudio) {
        btnPlayVoiceSampleCenter.addEventListener('click', (e) => {
            e.stopPropagation();
            if (voiceSampleAudio.paused) {
                voiceSampleAudio.play().then(() => {
                    if (iconVoicePlayCenter) {
                        iconVoicePlayCenter.setAttribute('data-lucide', 'pause');
                        iconVoicePlayCenter.style.marginLeft = '0';
                    }
                    if (window.lucide) lucide.createIcons();
                }).catch(err => console.log("Sample play blocked:", err));
            } else {
                voiceSampleAudio.pause();
                if (iconVoicePlayCenter) {
                    iconVoicePlayCenter.setAttribute('data-lucide', 'play');
                    iconVoicePlayCenter.style.marginLeft = '3px';
                }
                if (window.lucide) lucide.createIcons();
            }
        });

        voiceSampleAudio.addEventListener('timeupdate', () => {
            if (!voiceSampleAudio.duration) return;
            const pct = (voiceSampleAudio.currentTime / voiceSampleAudio.duration) * 100;
            if (voiceSampleProgress) voiceSampleProgress.style.width = `${pct}%`;
            
            const curMin = Math.floor(voiceSampleAudio.currentTime / 60);
            const curSec = Math.floor(voiceSampleAudio.currentTime % 60);
            if (voiceSampleCurrentTime) {
                voiceSampleCurrentTime.textContent = `0${curMin}:${curSec < 10 ? '0' : ''}${curSec}`;
            }

            const totalMin = Math.floor(voiceSampleAudio.duration / 60);
            const totalSec = Math.floor(voiceSampleAudio.duration % 60);
            if (voiceSampleTime && !isNaN(totalSec)) {
                voiceSampleTime.textContent = `0${totalMin}:${totalSec < 10 ? '0' : ''}${totalSec}`;
            }
        });

        voiceSampleAudio.addEventListener('ended', () => {
            if (iconVoicePlayCenter) {
                iconVoicePlayCenter.setAttribute('data-lucide', 'play');
                iconVoicePlayCenter.style.marginLeft = '3px';
            }
            if (voiceSampleProgress) voiceSampleProgress.style.width = '0%';
            if (voiceSampleCurrentTime) voiceSampleCurrentTime.textContent = '00:00';
            if (window.lucide) lucide.createIcons();
        });
    }

    // Ações Etapa 3 (A Harmonização: Trilha & Cenários)
    document.getElementById('btn-approve-harmonizacao')?.addEventListener('click', () => {
        goToStep(4);
    });

    // =========================================================================
    // =========================================================================
    // AÇÕES DE APROVAÇÃO & REPROVAÇÃO DA NOVA IMAGEM (ETAPA 4)
    // =========================================================================
    let isPhotoApprovedState = false;
    let isVoiceApprovedState = false;

    function updateLapidacaoActionButton() {
        const btn = document.getElementById('btn-approve-lapidacao');
        if (!btn) return;

        const photoFeedbackTxt = document.getElementById('photo-rejection-feedback')?.value.trim() || '';
        const voiceFeedbackTxt = document.getElementById('voice-rejection-feedback')?.value.trim() || '';

        const isPhotoValid = photoDecision === 'approved' || (photoDecision === 'rejected' && photoFeedbackTxt.length > 0);
        const isVoiceValid = voiceDecision === 'approved' || (voiceDecision === 'rejected' && voiceFeedbackTxt.length > 0);
        const hasRejection = photoDecision === 'rejected' || voiceDecision === 'rejected';

        // Estado 1: Ambas aprovadas -> Verde "PRODUZIR HOMENAGEM" (Ativo)
        if (photoDecision === 'approved' && voiceDecision === 'approved') {
            btn.textContent = 'PRODUZIR HOMENAGEM';
            btn.className = 'btn';
            btn.style.background = 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)';
            btn.style.borderColor = '#4ade80';
            btn.style.color = '#ffffff';
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
            btn.style.pointerEvents = 'auto';
            btn.style.boxShadow = '0 0 20px rgba(34, 197, 94, 0.6), 0 4px 14px rgba(34, 197, 94, 0.4)';
            btn.disabled = false;
        } 
        // Estado 2: Pelo menos uma reprovada, nenhuma pendente E texto digitado em todas as caixas necessárias -> Vermelho "ENVIAR CORREÇÕES" (Ativo)
        else if (photoDecision !== 'pending' && voiceDecision !== 'pending' && hasRejection && isPhotoValid && isVoiceValid) {
            btn.textContent = 'ENVIAR CORREÇÕES';
            btn.className = 'btn';
            btn.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
            btn.style.borderColor = '#f87171';
            btn.style.color = '#ffffff';
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
            btn.style.pointerEvents = 'auto';
            btn.style.boxShadow = '0 0 20px rgba(239, 68, 68, 0.6), 0 4px 14px rgba(239, 68, 68, 0.4)';
            btn.disabled = false;
        } 
        // Estado 3: Reprovado mas ainda sem texto digitado -> Vermelho "ENVIAR CORREÇÕES" visível mas inativo
        else if (photoDecision !== 'pending' && voiceDecision !== 'pending' && hasRejection) {
            btn.textContent = 'ENVIAR CORREÇÕES';
            btn.className = 'btn';
            btn.style.background = 'rgba(239, 68, 68, 0.18)';
            btn.style.borderColor = 'rgba(239, 68, 68, 0.45)';
            btn.style.color = '#fca5a5';
            btn.style.opacity = '0.65';
            btn.style.cursor = 'not-allowed';
            btn.style.pointerEvents = 'none';
            btn.style.boxShadow = 'none';
            btn.disabled = true;
        }
        // Estado 4: Alguma ainda pendente -> "PRODUZIR HOMENAGEM" inativo
        else {
            btn.textContent = 'PRODUZIR HOMENAGEM';
            btn.className = 'btn';
            btn.style.background = 'rgba(197, 160, 89, 0.16)';
            btn.style.borderColor = 'rgba(197, 160, 89, 0.38)';
            btn.style.color = '#f6e3c5';
            btn.style.opacity = '0.65';
            btn.style.cursor = 'not-allowed';
            btn.style.pointerEvents = 'none';
            btn.style.boxShadow = 'none';
            btn.disabled = true;
        }
    }

    function updatePhotoApprovalUI(status) {
        const btnApprove = document.getElementById('btn-approve-photo-status');
        const btnApproveText = document.getElementById('btn-approve-photo-status-text');
        const btnReject = document.getElementById('btn-reject-photo-modal');
        const btnRejectText = document.getElementById('btn-reject-photo-modal-text');
        const rejectionBox = document.getElementById('photo-rejection-box');

        // Resetar estilos inline que possam conflitar
        if (btnApprove) {
            btnApprove.style.background = '';
            btnApprove.style.borderColor = '';
            btnApprove.style.color = '';
            btnApprove.style.opacity = '';
        }
        if (btnReject) {
            btnReject.style.background = '';
            btnReject.style.borderColor = '';
            btnReject.style.color = '';
            btnReject.style.opacity = '';
            btnReject.style.pointerEvents = 'auto';
            btnReject.disabled = false;
        }

        if (status === 'approved' || status === true) {
            photoDecision = 'approved';
            isPhotoApprovedState = true;
            if (btnApprove) btnApprove.classList.add('is-selected');
            if (btnApproveText) btnApproveText.textContent = 'IMAGEM APROVADA ✓';
            
            if (btnReject) btnReject.classList.remove('is-selected');
            if (btnRejectText) btnRejectText.textContent = 'REPROVAR';
            if (rejectionBox) rejectionBox.style.display = 'none';
        } else if (status === 'rejected') {
            photoDecision = 'rejected';
            isPhotoApprovedState = false;
            if (btnApprove) btnApprove.classList.remove('is-selected');
            if (btnApproveText) btnApproveText.textContent = 'APROVAR';

            if (btnReject) btnReject.classList.add('is-selected');
            if (btnRejectText) btnRejectText.textContent = 'IMAGEM REPROVADA ✕';
            if (rejectionBox) rejectionBox.style.display = 'flex';
        } else {
            photoDecision = 'pending';
            isPhotoApprovedState = false;
            if (btnApprove) btnApprove.classList.remove('is-selected');
            if (btnApproveText) btnApproveText.textContent = 'APROVAR';

            if (btnReject) btnReject.classList.remove('is-selected');
            if (btnRejectText) btnRejectText.textContent = 'REPROVAR';
            if (rejectionBox) rejectionBox.style.display = 'none';
        }
        updateLapidacaoActionButton();
        if (window.lucide) lucide.createIcons();
    }

    // =========================================================================
    // AÇÕES DE APROVAÇÃO & REPROVAÇÃO DE VOZ & ROTEIRO (ETAPA 4)
    // =========================================================================
    function updateVoiceApprovalUI(status) {
        const btnApprove = document.getElementById('btn-approve-voice-status');
        const btnApproveText = document.getElementById('btn-approve-voice-status-text');
        const btnReject = document.getElementById('btn-reject-voice-modal');
        const btnRejectText = document.getElementById('btn-reject-voice-modal-text');
        const rejectionBox = document.getElementById('voice-rejection-box');

        // Resetar estilos inline que possam conflitar
        if (btnApprove) {
            btnApprove.style.background = '';
            btnApprove.style.borderColor = '';
            btnApprove.style.color = '';
            btnApprove.style.opacity = '';
        }
        if (btnReject) {
            btnReject.style.background = '';
            btnReject.style.borderColor = '';
            btnReject.style.color = '';
            btnReject.style.opacity = '';
            btnReject.style.pointerEvents = 'auto';
            btnReject.disabled = false;
        }

        if (status === 'approved' || status === true) {
            voiceDecision = 'approved';
            isVoiceApprovedState = true;
            if (btnApprove) btnApprove.classList.add('is-selected');
            if (btnApproveText) btnApproveText.textContent = 'VOZ APROVADA ✓';

            if (btnReject) btnReject.classList.remove('is-selected');
            if (btnRejectText) btnRejectText.textContent = 'REPROVAR';
            if (rejectionBox) rejectionBox.style.display = 'none';
        } else if (status === 'rejected') {
            voiceDecision = 'rejected';
            isVoiceApprovedState = false;
            if (btnApprove) btnApprove.classList.remove('is-selected');
            if (btnApproveText) btnApproveText.textContent = 'APROVAR';

            if (btnReject) btnReject.classList.add('is-selected');
            if (btnRejectText) btnRejectText.textContent = 'VOZ REPROVADA ✕';
            if (rejectionBox) rejectionBox.style.display = 'flex';
        } else {
            voiceDecision = 'pending';
            isVoiceApprovedState = false;
            if (btnApprove) btnApprove.classList.remove('is-selected');
            if (btnApproveText) btnApproveText.textContent = 'APROVAR';

            if (btnReject) btnReject.classList.remove('is-selected');
            if (btnRejectText) btnRejectText.textContent = 'REPROVAR';
            if (rejectionBox) rejectionBox.style.display = 'none';
        }
        updateLapidacaoActionButton();
        if (window.lucide) lucide.createIcons();
    }

    const btnRejectPhotoModal = document.getElementById('btn-reject-photo-modal');
    const btnApprovePhotoStatus = document.getElementById('btn-approve-photo-status');
    const photoRejectionBox = document.getElementById('photo-rejection-box');
    const photoRejectionFeedback = document.getElementById('photo-rejection-feedback');

    btnApprovePhotoStatus?.addEventListener('click', () => {
        if (photoDecision === 'approved') {
            // Desmarca ao clicar novamente
            updatePhotoApprovalUI('pending');
            saveFullSessionState();
            return;
        }

        // Se a caixa de reprovação estava aberta, fecha ao aprovar
        if (photoRejectionBox) photoRejectionBox.style.display = 'none';

        const approveEntry = {
            id: 'rev_' + Date.now(),
            mediaType: 'photo',
            status: 'approved',
            feedback: 'Imagem aprovada pelo cliente.',
            dateFormatted: new Date().toLocaleString('pt-BR'),
            timestamp: new Date().toISOString()
        };
        if (!Array.isArray(mediaRevisionsHistory)) mediaRevisionsHistory = [];
        mediaRevisionsHistory.unshift(approveEntry);

        updatePhotoApprovalUI('approved');
        saveFullSessionState();
    });

    btnRejectPhotoModal?.addEventListener('click', () => {
        if (photoDecision === 'rejected') {
            // Se já estava reprovado, desmarca
            updatePhotoApprovalUI('pending');
        } else {
            // Marca como reprovado e abre a caixa
            updatePhotoApprovalUI('rejected');
            if (photoRejectionFeedback) photoRejectionFeedback.focus();
        }
        saveFullSessionState();
    });

    photoRejectionFeedback?.addEventListener('input', () => {
        latestPhotoFeedback = photoRejectionFeedback.value.trim();
        updateLapidacaoActionButton();
        saveFullSessionState();
    });

    // Listeners do Áudio/Voz (Reprovar e Aprovar)
    const btnRejectVoiceModal = document.getElementById('btn-reject-voice-modal');
    const btnApproveVoiceStatus = document.getElementById('btn-approve-voice-status');
    const voiceRejectionBox = document.getElementById('voice-rejection-box');
    const voiceRejectionFeedback = document.getElementById('voice-rejection-feedback');

    btnApproveVoiceStatus?.addEventListener('click', () => {
        if (voiceDecision === 'approved') {
            // Desmarca ao clicar novamente
            updateVoiceApprovalUI('pending');
            saveFullSessionState();
            return;
        }

        // Se a caixa de reprovação estava aberta, fecha ao aprovar
        if (voiceRejectionBox) voiceRejectionBox.style.display = 'none';

        const approveEntry = {
            id: 'rev_' + Date.now(),
            mediaType: 'voice',
            status: 'approved',
            feedback: 'Locução na voz aprovada pelo cliente.',
            dateFormatted: new Date().toLocaleString('pt-BR'),
            timestamp: new Date().toISOString()
        };
        if (!Array.isArray(mediaRevisionsHistory)) mediaRevisionsHistory = [];
        mediaRevisionsHistory.unshift(approveEntry);

        updateVoiceApprovalUI('approved');
        saveFullSessionState();
    });

    btnRejectVoiceModal?.addEventListener('click', () => {
        if (voiceDecision === 'rejected') {
            // Se já estava reprovado, desmarca
            updateVoiceApprovalUI('pending');
        } else {
            // Marca como reprovado e abre a caixa
            updateVoiceApprovalUI('rejected');
            if (voiceRejectionFeedback) voiceRejectionFeedback.focus();
        }
        saveFullSessionState();
    });

    voiceRejectionFeedback?.addEventListener('input', () => {
        latestVoiceFeedback = voiceRejectionFeedback.value.trim();
        updateLapidacaoActionButton();
        saveFullSessionState();
    });

    // Ações Etapa 4 (A Lapidação: Avançar para a Sala de Revelação ou Notificar Ateliê)
    document.getElementById('btn-approve-lapidacao')?.addEventListener('click', async () => {
        if (photoDecision === 'pending' || voiceDecision === 'pending') {
            return; // Inativo / protegido
        }

        // Se ambos foram aprovados: avança diretamente para a Sala de Revelação
        if (photoDecision === 'approved' && voiceDecision === 'approved') {
            if (window.revivaData?.saveMediaApproval) {
                await window.revivaData.saveMediaApproval(orderData?.id || 1, true, true);
            }
            goToStep(5);
            return;
        }

        // Se imagem foi reprovada, valida se digitou algo
        if (photoDecision === 'rejected') {
            const photoTxt = photoRejectionFeedback?.value.trim();
            if (!photoTxt) {
                alert('Por favor, descreva quais ajustes você gostaria de realizar na imagem antes de enviar ao ateliê.');
                photoRejectionBox.style.display = 'flex';
                photoRejectionFeedback?.focus();
                return;
            }
            const photoEntry = {
                id: 'rev_' + Date.now(),
                mediaType: 'photo',
                status: 'rejected',
                feedback: photoTxt,
                dateFormatted: new Date().toLocaleString('pt-BR'),
                timestamp: new Date().toISOString()
            };
            if (!Array.isArray(mediaRevisionsHistory)) mediaRevisionsHistory = [];
            mediaRevisionsHistory.unshift(photoEntry);
            latestPhotoFeedback = photoTxt;
        }

        // Se voz foi reprovada, valida se digitou algo
        if (voiceDecision === 'rejected') {
            const voiceTxt = voiceRejectionFeedback?.value.trim();
            if (!voiceTxt) {
                alert('Por favor, descreva quais ajustes você gostaria de realizar no áudio/voz antes de enviar ao ateliê.');
                voiceRejectionBox.style.display = 'flex';
                voiceRejectionFeedback?.focus();
                return;
            }
            const voiceEntry = {
                id: 'rev_' + (Date.now() + 1),
                mediaType: 'voice',
                status: 'rejected',
                feedback: voiceTxt,
                dateFormatted: new Date().toLocaleString('pt-BR'),
                timestamp: new Date().toISOString()
            };
            if (!Array.isArray(mediaRevisionsHistory)) mediaRevisionsHistory = [];
            mediaRevisionsHistory.unshift(voiceEntry);
            latestVoiceFeedback = voiceTxt;
        }

        // Notifica o cliente que a equipe do ateliê recebeu o envio oficial
        alert('🕊️ Solicitação de Correções Registrada com Sucesso!\n\nNossa equipe do ateliê já recebeu suas considerações e iniciou a produção dos ajustes solicitados com todo o carinho.\n\nAssim que a nova versão for finalizada, você receberá um aviso pelo WhatsApp para conferir e aprovar novamente aqui no seu painel exclusivo.');
        saveFullSessionState();
    });

    // =========================================================================
    // ETAPA 05: O REENCONTRO (AÇÕES & COMPARTILHAMENTO)
    // =========================================================================
    const btnCopyRevealLink = document.getElementById('btnCopyRevealLink');
    if (btnCopyRevealLink) {
        btnCopyRevealLink.addEventListener('click', () => {
            const revealUrl = `${window.location.origin}/revelar.html?v=reviva_token_mariana_777`;
            navigator.clipboard?.writeText(revealUrl).then(() => {
                const originalHtml = btnCopyRevealLink.innerHTML;
                btnCopyRevealLink.innerHTML = '<i data-lucide="check" style="width: 14px; height: 14px;"></i> LINK COPIADO!';
                if (window.lucide) lucide.createIcons();
                setTimeout(() => {
                    btnCopyRevealLink.innerHTML = originalHtml;
                    if (window.lucide) lucide.createIcons();
                }, 2500);
            }).catch(() => {
                alert(`Link da Sala de Revelação:\n${revealUrl}`);
            });
        });
    }

    // =========================================================================
    // SISTEMA DE MÚSICA DE FUNDO E ONDAS SONORAS (IDÊNTICO AO SITE ORIGINAL)
    // =========================================================================
    const bgAudio = document.getElementById('bgAudio');
    const playlist = [
        'bg_music.mp3',
        'bg_music_02.mp3',
        'bg_music_03.mp3'
    ];
    let currentTrack = playlist[0];

    function getNextRandomTrack() {
        if (playlist.length <= 1) return playlist[0];
        let nextTrack;
        do {
            nextTrack = playlist[Math.floor(Math.random() * playlist.length)];
        } while (nextTrack === currentTrack);
        return nextTrack;
    }

    if (bgAudio) {
        currentTrack = playlist[Math.floor(Math.random() * playlist.length)];
        bgAudio.src = currentTrack;
        bgAudio.load();
    }

    const musicWaves = document.querySelectorAll('.music-wave-toggle');
    
    // Gera dinamicamente 45 barras (strokes) em cada container para preencher a largura com simetria exata
    musicWaves.forEach(wave => {
        wave.innerHTML = '';
        for (let i = 0; i < 45; i++) {
            const span = document.createElement('span');
            span.className = 'stroke';
            wave.appendChild(span);
        }
    });

    if (bgAudio) {
        bgAudio.addEventListener('play', () => updateAudioUI(true));
        bgAudio.addEventListener('pause', () => updateAudioUI(false));
        
        bgAudio.addEventListener('ended', () => {
            currentTrack = getNextRandomTrack();
            bgAudio.src = currentTrack;
            bgAudio.load();
            bgAudio.volume = 0.5;
            bgAudio.play().then(() => updateAudioUI(true)).catch(err => console.log("Auto-play error:", err));
        });

        function updateAudioUI(isPlaying) {
            musicWaves.forEach(wave => {
                if (isPlaying) {
                    wave.classList.add('playing');
                } else {
                    wave.classList.remove('playing');
                }
            });
        }

        // Adiciona listeners para todas as ondas sonoras que controlam a música
        musicWaves.forEach(wave => {
            wave.addEventListener('click', (e) => {
                e.stopPropagation();
                if (bgAudio.paused) {
                    bgAudio.volume = 0.5;
                    bgAudio.play().then(() => updateAudioUI(true)).catch(err => console.log("Audio play blocked:", err));
                } else {
                    bgAudio.pause();
                    updateAudioUI(false);
                }
            });
        });
    }

    // Salvar estado quando os checkboxes da etapa 4 forem alterados
    document.getElementById('chk-approve-photo')?.addEventListener('change', () => saveFullSessionState());
    document.getElementById('chk-approve-voice')?.addEventListener('change', () => saveFullSessionState());

    // =========================================================================
    // TERMO DE RESPONSABILIDADE & CONSENTIMENTO ÉTICO (ETAPA 1)
    // =========================================================================
    window.openTermoModal = function(isViewOnly = false) {
        const modal = document.getElementById('modal-termo-responsabilidade');
        const btnCloseView = document.getElementById('btn-close-termo-view');
        const btnSubmit = document.getElementById('btn-submit-term');
        const chkAccept = document.getElementById('chk-term-accept');
        const inputName = document.getElementById('term-signer-name');
        const inputCpf = document.getElementById('term-signer-cpf');
        const selectRelation = document.getElementById('term-signer-relation');

        if (!modal) return;

        if (isViewOnly && legalTermSigned) {
            if (btnCloseView) btnCloseView.style.display = 'block';
            if (btnSubmit) btnSubmit.style.display = 'none';
            if (inputName) { inputName.value = legalTermSigned.name; inputName.disabled = true; }
            if (inputCpf) { inputCpf.value = legalTermSigned.cpf; inputCpf.disabled = true; }
            if (selectRelation) { selectRelation.value = legalTermSigned.relation; selectRelation.disabled = true; }
            if (chkAccept) { chkAccept.checked = true; chkAccept.disabled = true; }
        } else {
            if (btnCloseView) btnCloseView.style.display = 'none';
            if (btnSubmit) btnSubmit.style.display = 'block';
            if (inputName) { inputName.value = legalTermSigned?.name || 'Mariana Silva'; inputName.disabled = false; }
            if (inputCpf) { inputCpf.value = legalTermSigned?.cpf || ''; inputCpf.disabled = false; }
            if (selectRelation) { selectRelation.value = legalTermSigned?.relation || 'Filho(a)'; selectRelation.disabled = false; }
            if (chkAccept) { chkAccept.checked = false; chkAccept.disabled = false; }
        }

        modal.style.display = 'flex';
        if (window.lucide) lucide.createIcons();
    };

    window.closeTermoModal = function() {
        const modal = document.getElementById('modal-termo-responsabilidade');
        if (modal) modal.style.display = 'none';
    };

    window.handleSignTermo = function(e) {
        e.preventDefault();
        const name = document.getElementById('term-signer-name')?.value.trim();
        const cpf = document.getElementById('term-signer-cpf')?.value.trim();
        const relation = document.getElementById('term-signer-relation')?.value;
        const chk = document.getElementById('chk-term-accept')?.checked;

        if (!name || !cpf || !chk) {
            alert('Por favor, preencha todos os campos obrigatórios e aceite os termos.');
            return;
        }

        legalTermSigned = {
            signed: true,
            name: name,
            cpf: cpf,
            relation: relation,
            signedAt: new Date().toISOString(),
            dateFormatted: new Date().toLocaleString('pt-BR')
        };

        updateTermoUI();
        window.closeTermoModal();
        saveFullSessionState();
        alert('✓ Termo de Responsabilidade & Consentimento Ético assinado com sucesso!');
    };

    function updateTermoUI() {
        const badge = document.getElementById('badge-termo-signed');
        const badgeText = document.getElementById('badge-termo-signed-text');
        if (legalTermSigned && legalTermSigned.signed) {
            if (badge) badge.style.display = 'flex';
            if (badgeText) {
                badgeText.textContent = `✓ Termo Assinado Digitalmente por ${legalTermSigned.name} (CPF: ${legalTermSigned.cpf})`;
            }
        } else {
            if (badge) badge.style.display = 'none';
        }
        if (window.lucide) lucide.createIcons();
    }

    // =========================================================================
    // INICIALIZAÇÃO E RESTAURAÇÃO COMPLETA DO ESTADO (SEM PERDA DE PROGRESSO)
    // =========================================================================
    const isSessionRestored = restoreFullSessionState(true);
    if (!isSessionRestored) {
        goToStep(1, true);
    }
});
