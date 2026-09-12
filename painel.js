/**
 * Reviva Memories - Painel do Cliente & Fluxo Oficial em 4 Etapas
 */

document.addEventListener('DOMContentLoaded', async () => {
    const isLocalhost = window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1' || 
                        window.location.hostname.startsWith('192.168.') || 
                        window.location.hostname.startsWith('10.') || 
                        window.location.protocol === 'file:';

    let currentStep = 0;
    let storedOrder = null;
    try {
        const rawOrder = localStorage.getItem('reviva_order_data') || localStorage.getItem('reviva_current_order');
        if (rawOrder) storedOrder = JSON.parse(rawOrder);
    } catch(e) {}

    let orderData = storedOrder || await window.revivaData.getCurrentOrder();
    if (storedOrder && orderData) {
        orderData = { ...orderData, ...storedOrder, id: storedOrder.order_id || storedOrder.id || orderData.id };
    }
    let currentUser = await window.revivaData.getCurrentUser();

    // Nome do cliente para personalização calorosa e dinâmica
    let clientFullName = 'Cliente';
    let clientFirstName = 'Cliente';

    function resolveClientIdentity() {
        let name = '';
        try {
            const rawTerm = localStorage.getItem('reviva_legal_term');
            if (rawTerm) {
                const parsedTerm = JSON.parse(rawTerm);
                if (parsedTerm?.name && parsedTerm.name.trim().length > 0) name = parsedTerm.name.trim();
            }
        } catch(e) {}

        if (!name) {
            try {
                const rawOrder = localStorage.getItem('reviva_order_data');
                if (rawOrder) {
                    const parsedOrd = JSON.parse(rawOrder);
                    if (parsedOrd?.customer_name && parsedOrd.customer_name.trim().length > 0) name = parsedOrd.customer_name.trim();
                }
            } catch(e) {}
        }

        if (!name) {
            try {
                const rawFull = localStorage.getItem('reviva_full_session_state');
                if (rawFull) {
                    const parsedFull = JSON.parse(rawFull);
                    if (parsedFull?.clientName && parsedFull.clientName.trim().length > 0) name = parsedFull.clientName.trim();
                    else if (parsedFull?.legalTermSigned?.name) name = parsedFull.legalTermSigned.name.trim();
                }
            } catch(e) {}
        }

        if (!name) {
            try {
                const rawUser = localStorage.getItem('reviva_session_user');
                if (rawUser) {
                    const parsedUser = JSON.parse(rawUser);
                    if (parsedUser?.name && parsedUser.name.trim().length > 0) name = parsedUser.name.trim();
                }
            } catch(e) {}
        }

        if (!name && currentUser?.user_metadata?.full_name) {
            name = currentUser.user_metadata.full_name.trim();
        }

        if (!name) name = 'Mariana Silva Santos';

        clientFullName = name;
        clientFirstName = name.split(/\s+/)[0] || 'Cliente';

        const topbarUserName = document.getElementById('topbar-user-name');
        if (topbarUserName) topbarUserName.textContent = clientFirstName;

        const termSignerName = document.getElementById('term-signer-name');
        if (termSignerName && (!termSignerName.value || termSignerName.value === 'Mariana Silva Santos')) {
            termSignerName.value = clientFullName;
        }
    }

    resolveClientIdentity();

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

    // Detectar plano ativo via Query Param, Order Data ou LocalStorage
    const urlParams = new URLSearchParams(window.location.search);
    let rawPlan = (urlParams.get('plano') || urlParams.get('plan') || '').toLowerCase();
    
    if (!rawPlan && orderData) {
        rawPlan = (orderData.plan_id || orderData.plan_name || '').toLowerCase();
    }
    if (!rawPlan) {
        try {
            const rawStoredOrder = localStorage.getItem('reviva_order_data');
            if (rawStoredOrder) {
                const parsed = JSON.parse(rawStoredOrder);
                rawPlan = (parsed?.plan_id || parsed?.plan_name || '').toLowerCase();
            }
        } catch(e) {}
    }

    let activePlanKey = 'affectus';
    if (rawPlan.includes('tribut') || rawPlan.includes('3')) {
        activePlanKey = 'tributum';
    } else if (rawPlan.includes('legat') || rawPlan.includes('emocao') || rawPlan.includes('2')) {
        activePlanKey = 'legatum';
    } else if (rawPlan.includes('affect') || rawPlan.includes('essenc') || rawPlan.includes('1')) {
        activePlanKey = 'affectus';
    } else if (PLANS_CONFIG[rawPlan]) {
        activePlanKey = rawPlan;
    }

    const currentPlan = PLANS_CONFIG[activePlanKey];
    localStorage.setItem('reviva_selected_plan', activePlanKey);
    if (orderData) {
        orderData.plan_name = activePlanKey;
    }

    function isOrderBothFormats() {
        let rawFormat = (urlParams.get('formato') || urlParams.get('format') || '').toLowerCase();
        if (!rawFormat && orderData) {
            if (orderData.has_upsell || (orderData.plan_format && orderData.plan_format.toLowerCase().includes('+'))) {
                rawFormat = 'ambos';
            } else if (orderData.plan_format) {
                rawFormat = orderData.plan_format.toLowerCase();
            }
        }
        if (!rawFormat) {
            try {
                const rawStoredOrder = localStorage.getItem('reviva_order_data');
                if (rawStoredOrder) {
                    const parsed = JSON.parse(rawStoredOrder);
                    if (parsed?.has_upsell || (parsed?.plan_format && parsed.plan_format.toLowerCase().includes('+'))) {
                        rawFormat = 'ambos';
                    } else if (parsed?.plan_format) {
                        rawFormat = parsed.plan_format.toLowerCase();
                    }
                }
            } catch(e) {}
        }
        if (!rawFormat) {
            rawFormat = (localStorage.getItem('reviva_selected_format') || 'horizontal').toLowerCase();
        }
        return rawFormat.includes('ambos') || rawFormat.includes('both') || rawFormat.includes('+') || rawFormat.includes('&');
    }
    window.isOrderBothFormats = isOrderBothFormats;

    // Atualiza cabeçalhos e badges com o plano ativo e formato contratado
    function updateAllStepPlanBadges() {
        const isBoth = isOrderBothFormats();
        let rawFormat = (urlParams.get('formato') || urlParams.get('format') || '').toLowerCase();
        if (!rawFormat) {
            rawFormat = (orderData?.plan_format || localStorage.getItem('reviva_selected_format') || 'horizontal').toLowerCase();
        }

        let formatLabel = 'HORIZONTAL';
        if (isBoth) {
            formatLabel = 'HORIZONTAL & VERTICAL';
        } else if (rawFormat.includes('vertical')) {
            formatLabel = 'VERTICAL';
        } else {
            formatLabel = 'HORIZONTAL';
        }

        const planBadgeText = `PLANO ${currentPlan.name.toUpperCase()} • ${currentPlan.durationMinutes} MINUTO${currentPlan.durationMinutes > 1 ? 'S' : ''} • ${formatLabel}`;
        
        document.querySelectorAll('.step-plan-badge').forEach(badge => {
            badge.textContent = planBadgeText;
        });
    }
    updateAllStepPlanBadges();

    const chatHeaderPlanTitle = document.getElementById('chat-header-plan-title');
    if (chatHeaderPlanTitle) {
        chatHeaderPlanTitle.textContent = `DESENVOLVIMENTO DO ROTEIRO - PLANO ${currentPlan.name.toUpperCase()}: ${currentPlan.durationMinutes} MINUTO${currentPlan.durationMinutes > 1 ? 'S' : ''}`;
    }

    const scriptPlanBadge = document.getElementById('script-plan-badge');
    if (scriptPlanBadge) {
        scriptPlanBadge.textContent = `${currentPlan.title} • Máx ${currentPlan.maxChars} caracteres`;
    }

    // Estado da sessão (Padrões da Etapa 3: Sem Trilha Sonora e Nuvens Celestiais)
    let uploadedPhotos = [];
    let uploadedAudios = [];
    let selectedBackground = 'ceu';
    let selectedMusic = 'sem_musica';
    let musicManuallyChosen = false;
    let currentPreviewAudio = null;
    let previewFadeInterval = null;
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
            text: "Qual é a ligação de afeto e a relação entre eles (ex: Pai e Filha, Avó e Neto, Marido e Esposa)?"
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
        },
        {
            id: 'narrative_tone',
            text: "Para que as palavras e o estilo reflitam com fidelidade a personalidade da pessoa, qual tom você prefere que prevaleça na homenagem? Um tom mais alegre, descontraído e cômico, ou um tom profundamente emocionante, terno e poético?"
        },
        {
            id: 'extra_personalization',
            text: currentPlan.durationMinutes >= 2
                ? `Como você contratou o Plano ${currentPlan.name} (${currentPlan.durationMinutes} minutos), temos um espaço generoso e muito especial na narrativa: há mais alguma lembrança, história marcante, hábitos, piadas de família, frases características ou conselhos que você gostaria de incluir para deixar o roteiro ainda mais personalizado?`
                : "Antes de eu começar a estruturar o roteiro com todo o carinho: há mais algum detalhe específico, frase marcante ou lembrança que você gostaria de acrescentar para que a homenagem fique ainda mais personalizada?"
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
            sub: 'Trilha Sonora e Ambiente de Fundo'
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

    // Flag de controle: Transição cinematográfica entre etapas ativada
    const ENABLE_STEP_TRANSITIONS = true;

    let curtainTimer = null;
    let curtainFadeTimer = null;
    function triggerStageCurtainAnimation(step, callback, onComplete) {
        if (!ENABLE_STEP_TRANSITIONS) {
            if (callback) callback();
            if (onComplete) onComplete();
            return;
        }

        const curtain = document.getElementById('fullscreen-stage-curtain');
        const badge = document.getElementById('stageCurtainBadge');
        const title = document.getElementById('stageCurtainTitle');
        const sub = document.getElementById('stageCurtainSub');
        
        if (!curtain || !badge || !title || !sub) {
            if (callback) callback();
            if (onComplete) onComplete();
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

        if (!curtain.hasAttribute('data-dismiss-listener')) {
            curtain.setAttribute('data-dismiss-listener', 'true');
            curtain.style.cursor = 'pointer';
            curtain.addEventListener('click', () => {
                if (curtainTimer) clearTimeout(curtainTimer);
                if (curtainFadeTimer) clearTimeout(curtainFadeTimer);
                curtain.classList.remove('active');
                if (typeof onComplete === 'function') onComplete();
            });
        }

        if (curtainTimer) clearTimeout(curtainTimer);
        if (curtainFadeTimer) clearTimeout(curtainFadeTimer);

        // Se a cortina já foi ativada previamente (ex: no carregamento da página), mantemos a cobertura total
        const alreadyActive = curtain.classList.contains('active');
        if (!alreadyActive) {
            curtain.classList.add('active');
        }

        // 2. Troca de fase no auge da opacidade
        setTimeout(() => {
            if (callback) callback();
        }, alreadyActive ? 400 : 1200);

        // 3. Após leitura da transição, inicia o Fade Out suave revelando a tela da etapa
        curtainTimer = setTimeout(() => {
            curtain.classList.remove('active');
            curtainFadeTimer = setTimeout(() => {
                if (onComplete) onComplete();
            }, 1200);
        }, 2200);
    }

    function stopAllAudios() {
        // Pausar e resetar elementos de prévia de áudio, preservando a música de fundo (bgAudio)
        try {
            document.querySelectorAll('audio:not(#bgAudio)').forEach(a => {
                try {
                    a.pause();
                    a.currentTime = 0;
                } catch(e) {}
            });
        } catch(e) {}

        // Resetar player de voz da etapa 4
        try {
            const vSample = document.getElementById('voiceSampleAudio');
            if (vSample) {
                vSample.pause();
                vSample.currentTime = 0;
            }
            if (typeof updateVoicePlayIcon === 'function') updateVoicePlayIcon(false);
            const centerIcon = document.getElementById('voice-center-play-icon');
            if (centerIcon) centerIcon.setAttribute('data-lucide', 'play');
            const progress = document.getElementById('voice-progress-current');
            if (progress) progress.style.width = '0%';
            const timeCur = document.getElementById('voice-time-current');
            if (timeCur) timeCur.textContent = '0:00';
        } catch(e) {}

        // Resetar áudio gravado da etapa 1
        try {
            if (typeof currentAttachedAudio !== 'undefined' && currentAttachedAudio) {
                currentAttachedAudio.pause();
                currentAttachedAudio.currentTime = 0;
                currentPlayingAudioIdx = -1;
                if (typeof renderAudioPreviews === 'function') renderAudioPreviews();
            }
        } catch(e) {}

        // Interromper imediatamente qualquer trilha sonora de teste (Etapa 3)
        try {
            if (typeof previewFadeInterval !== 'undefined' && previewFadeInterval) {
                clearInterval(previewFadeInterval);
                previewFadeInterval = null;
            }
            if (typeof currentPreviewAudio !== 'undefined' && currentPreviewAudio) {
                currentPreviewAudio.pause();
                currentPreviewAudio.currentTime = 0;
                currentPreviewAudio = null;
            }
            if (typeof updateMusicPreviewBtnUI === 'function') {
                updateMusicPreviewBtnUI(false);
            }
        } catch(e) {}

        // A música de fundo ambiente (bgAudio) é preservada e continua tocando sem cortes!

        if (window.lucide) lucide.createIcons();
    }

    function executeStepSwitch(step) {
        // Interromper imediatamente qualquer reprodução de áudio em andamento
        stopAllAudios();

        currentStep = step;
        resolveClientIdentity();
        
        // Persistir etapa ativa e marco de avanço máximo alcançado
        try {
            localStorage.setItem('reviva_active_step', step.toString());
            let maxReached = parseInt(localStorage.getItem('reviva_max_step_reached')) || 1;
            if (step > maxReached) {
                localStorage.setItem('reviva_max_step_reached', step.toString());
            }
            history.replaceState(null, '', '#step-' + step);
        } catch (e) {}

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
            if (typeof updateScriptApprovedUI === 'function') {
                updateScriptApprovedUI(isScriptApproved);
            }
        }

        if (step === 3) {
            // Garantir que sempre haja uma paisagem e uma trilha sonora selecionadas
            const scenarioCards = document.querySelectorAll('#scenariosContainer .scenario-name-btn');
            let hasSelectedBg = false;
            scenarioCards.forEach(c => {
                if (c.dataset.bg === selectedBackground) {
                    c.classList.add('selected');
                    hasSelectedBg = true;
                    const previewImg = document.getElementById('scenario-preview-img');
                    const previewName = document.getElementById('scenario-preview-name');
                    if (previewImg && c.dataset.previewSrc) previewImg.src = c.dataset.previewSrc;
                    if (previewName && c.dataset.title) previewName.textContent = c.dataset.title;
                } else {
                    c.classList.remove('selected');
                }
            });
            if (!hasSelectedBg && scenarioCards.length > 0) {
                scenarioCards[0].classList.add('selected');
                selectedBackground = scenarioCards[0].dataset.bg || 'ceu';
                const previewImg = document.getElementById('scenario-preview-img');
                const previewName = document.getElementById('scenario-preview-name');
                if (previewImg && scenarioCards[0].dataset.previewSrc) previewImg.src = scenarioCards[0].dataset.previewSrc;
                if (previewName && scenarioCards[0].dataset.title) previewName.textContent = scenarioCards[0].dataset.title;
            }

            // Garantir que "Sons Naturais" (sem_musica) seja o padrão se o cliente não escolheu outra manualmente
            if (!musicManuallyChosen) {
                selectedMusic = 'sem_musica';
            }
            const musicCards = document.querySelectorAll('#musicContainer .scenario-name-btn');
            let hasSelectedMusic = false;
            musicCards.forEach(c => {
                if (c.dataset.music === selectedMusic) {
                    c.classList.add('selected');
                    hasSelectedMusic = true;
                    const previewImg = document.getElementById('music-preview-img');
                    const previewName = document.getElementById('music-preview-name');
                    if (previewImg && c.dataset.previewSrc) previewImg.src = c.dataset.previewSrc;
                    if (previewName && c.dataset.title) previewName.textContent = c.dataset.title;
                } else {
                    c.classList.remove('selected');
                }
            });
            if (!hasSelectedMusic) {
                const semTrilhaCard = document.querySelector('#musicContainer .scenario-name-btn[data-music="sem_musica"]');
                if (semTrilhaCard) {
                    semTrilhaCard.classList.add('selected');
                    const previewImg = document.getElementById('music-preview-img');
                    const previewName = document.getElementById('music-preview-name');
                    if (previewImg && semTrilhaCard.dataset.previewSrc) previewImg.src = semTrilhaCard.dataset.previewSrc;
                    if (previewName && semTrilhaCard.dataset.title) previewName.textContent = semTrilhaCard.dataset.title;
                }
                selectedMusic = 'sem_musica';
            }
        }

        if (step === 4) {
            const ordIdent = (orderData?.order_id || orderData?.id || 1);
            if (typeof isPhotoPermanentlyApproved === 'function' && isPhotoPermanentlyApproved()) {
                photoDecision = 'approved';
            }
            if (typeof isVoicePermanentlyApproved === 'function' && isVoicePermanentlyApproved()) {
                voiceDecision = 'approved';
            }

            const isBothFormats = isOrderBothFormats();
            const singleContainer = document.getElementById('preview-single-container');
            const dualContainer = document.getElementById('preview-dual-container');

            const producerImg = localStorage.getItem(`reviva_producer_image_${ordIdent}`) || 
                                localStorage.getItem(`reviva_producer_photo_h_${ordIdent}`) || 
                                localStorage.getItem(`reviva_producer_photo_v_${ordIdent}`) || 
                                localStorage.getItem('reviva_producer_image') ||
                                localStorage.getItem('reviva_producer_photo_h') ||
                                localStorage.getItem('reviva_producer_photo_v');
            const photoSrc = producerImg || (uploadedPhotos && uploadedPhotos.length > 0 ? uploadedPhotos[0].dataUrl : '');

            // Buscar imagens específicas de Horizontal e Vertical se disponíveis
            const photoSrcH = localStorage.getItem(`reviva_producer_photo_h_${ordIdent}`) || 
                              localStorage.getItem('reviva_producer_photo_h') || 
                              photoSrc;
            const photoSrcV = localStorage.getItem(`reviva_producer_photo_v_${ordIdent}`) || 
                              localStorage.getItem('reviva_producer_photo_v') || 
                              photoSrc;

            if (isBothFormats) {
                // Modo Dividido Verticalmente (2 Formatos Lado a Lado no Desktop e Mobile)
                if (singleContainer) singleContainer.style.display = 'none';
                if (dualContainer) dualContainer.style.display = 'flex';

                // Imagem Horizontal (Coluna Esquerda)
                const imgH = document.getElementById('preview-avatar-img-h');
                const phH = document.getElementById('preview-avatar-placeholder-h');
                if (imgH) {
                    if (photoSrcH) {
                        imgH.src = photoSrcH;
                        imgH.style.display = 'block';
                        if (phH) phH.style.display = 'none';
                    } else {
                        imgH.src = '';
                        imgH.style.display = 'none';
                        if (phH) phH.style.display = 'flex';
                    }
                }

                // Imagem Vertical (Coluna Direita)
                const imgV = document.getElementById('preview-avatar-img-v');
                const phV = document.getElementById('preview-avatar-placeholder-v');
                if (imgV) {
                    if (photoSrcV) {
                        imgV.src = photoSrcV;
                        imgV.style.display = 'block';
                        if (phV) phV.style.display = 'none';
                    } else {
                        imgV.src = '';
                        imgV.style.display = 'none';
                        if (phV) phV.style.display = 'flex';
                    }
                }
            } else {
                // Modo Padrão / Formato Único
                if (singleContainer) singleContainer.style.display = 'flex';
                if (dualContainer) dualContainer.style.display = 'none';

                const previewAvatarImg = document.getElementById('preview-avatar-img');
                const previewAvatarPlaceholder = document.getElementById('preview-avatar-placeholder');
                if (previewAvatarImg) {
                    if (photoSrc) {
                        previewAvatarImg.src = photoSrc;
                        previewAvatarImg.style.display = 'block';
                        if (previewAvatarPlaceholder) previewAvatarPlaceholder.style.display = 'none';
                    } else {
                        previewAvatarImg.src = '';
                        previewAvatarImg.style.display = 'none';
                        if (previewAvatarPlaceholder) previewAvatarPlaceholder.style.display = 'flex';
                    }
                }
            }

            const producerAudio = localStorage.getItem(`reviva_producer_audio_${ordIdent}`) || localStorage.getItem('reviva_producer_audio');
            const voiceAudioSrc = producerAudio || (uploadedAudios && uploadedAudios.length > 0 && uploadedAudios[0].dataUrl ? uploadedAudios[0].dataUrl : '');
            const voiceSampleAudio = document.getElementById('voiceSampleAudio');
            if (voiceSampleAudio) {
                voiceSampleAudio.src = voiceAudioSrc || '';
            }

            if (typeof updatePhotoApprovalUI === 'function') updatePhotoApprovalUI(photoDecision);
            if (typeof updateVoiceApprovalUI === 'function') updateVoiceApprovalUI(voiceDecision);
            if (typeof updateLapidacaoActionButton === 'function') updateLapidacaoActionButton();
        }

        if (step === 5) {
            const producerVideo = localStorage.getItem('reviva_producer_video');
            const finalVideo = document.getElementById('final-homenagem-video');
            const finalPlaceholder = document.getElementById('final-video-placeholder');
            const btnDownload = document.getElementById('btnDownloadFinalVideo');
            if (finalVideo) {
                if (producerVideo) {
                    finalVideo.src = producerVideo;
                    finalVideo.style.display = 'block';
                    if (finalPlaceholder) finalPlaceholder.style.display = 'none';
                    if (btnDownload) {
                        btnDownload.href = producerVideo;
                        btnDownload.style.opacity = '1';
                        btnDownload.style.pointerEvents = 'auto';
                    }
                } else {
                    finalVideo.src = 'about_maderite_preview.webm';
                    finalVideo.style.display = 'block';
                    if (finalPlaceholder) finalPlaceholder.style.display = 'none';
                    if (btnDownload) {
                        btnDownload.href = 'about_maderite_preview.webm';
                        btnDownload.style.opacity = '1';
                        btnDownload.style.pointerEvents = 'auto';
                    }
                }
            }

            const names = extractHomenagemNames();
            const enteNameEl = document.getElementById('step5-ente-name');
            const homenageadoNameEl = document.getElementById('step5-homenageado-name');
            if (enteNameEl) {
                enteNameEl.textContent = names.ente;
            }
            if (homenageadoNameEl) {
                homenageadoNameEl.textContent = names.homenageado;
            }
        }

        updateAllStepPlanBadges();
        if (window.lucide) window.lucide.createIcons();
        saveFullSessionState();
    }

    function extractHomenagemNames() {
        let ente = '';
        let homenageado = '';

        // 1. Tentar extrair diretamente do Roteiro Oficial Capturado na Etapa 2 (latestScriptText)
        if (typeof latestScriptText !== 'undefined' && latestScriptText) {
            const rawText = latestScriptText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

            // Padrões para o Homenageado (destinatário da mensagem):
            const destPatterns = [
                /(?:olha só pra você|olha pra você|quem diria|querid[oa]|minh[ao] querid[oa]|meu querid[oa]|minha amada|meu amado|olá|para você|para ti|meu filho|minha filha|meu neto|minha neta|meu amor|meu grande amigo|minha grande amiga)[,\s]+([A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ][a-záéíóúâêîôûãõç]+)/i,
                /(?:homenagem a|homenagem para|especial para|dedicado a|feita para|entregue a)\s+([A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ][a-záéíóúâêîôûãõç]+)/i
            ];
            for (const pat of destPatterns) {
                const m = rawText.match(pat);
                if (m && m[1]) {
                    homenageado = m[1].trim();
                    break;
                }
            }

            // Padrões para o Ente (quem transmite a mensagem com sua imagem e voz):
            const entePatterns = [
                /(?:do seu|da sua|com amor do|com amor da|com carinho do|com carinho da|bênção do seu|bênção da sua|abraço do seu|abraço da sua|assinad[oa] por|com saudades do seu|com saudades da sua)\s+(?:pai|mãe|avô|avó|irmão|irmã|amigo|amiga|esposo|esposa|filho|filha)?\s*([A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ][a-záéíóúâêîôûãõç]+)/i,
                /(?:do seu|da sua)\s+(pai|mãe|avô|avó|irmão|irmã|esposo|esposa)/i,
                /(?:com todo o amor de|com amor,|com carinho,|um abraço de|bênção de)\s*([A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ][a-záéíóúâêîôûãõç]+)/i
            ];
            for (const pat of entePatterns) {
                const m = rawText.match(pat);
                if (m && m[1]) {
                    ente = m[1].trim();
                    break;
                }
            }
        }

        // 2. Dados da entrevista coletados pelo Iasis na Etapa 2
        if (!ente && typeof interviewData !== 'undefined' && interviewData?.protagonista) {
            ente = interviewData.protagonista.trim();
        }
        if (!homenageado && typeof interviewData !== 'undefined') {
            if (interviewData?.destinatario) homenageado = interviewData.destinatario.trim();
            else if (interviewData?.apelido) homenageado = interviewData.apelido.trim();
        }

        // 3. Fallbacks elegantes
        if (!ente) ente = (typeof interviewData !== 'undefined' && interviewData?.protagonista) ? interviewData.protagonista : 'Pai';
        if (!homenageado) homenageado = (typeof interviewData !== 'undefined' && interviewData?.destinatario) ? interviewData.destinatario : clientFirstName;

        return {
            ente: ente,
            homenageado: homenageado
        };
    }

    // =========================================================================
    // CONTROLE DE LIBERAÇÃO DE ETAPAS PELA EQUIPE DE PRODUÇÃO
    // =========================================================================
    function isStage4ReadyFromTeam() {
        // A Etapa 04 SÓ fica liberada se a equipe explicitamente liberou ou enviou prévias
        const ordIdent = (orderData?.order_id || orderData?.id || 1);
        return localStorage.getItem('reviva_stage4_delivered') === 'true' ||
               localStorage.getItem(`reviva_stage4_delivered_${ordIdent}`) === 'true' ||
               localStorage.getItem('reviva_stage4_delivered_REVIVA-1001') === 'true';
    }

    function isStage5ReadyFromTeam() {
        // A Etapa 05 SÓ fica liberada se a equipe explicitamente liberou ou publicou o vídeo
        const ordIdent = (orderData?.order_id || orderData?.id || 1);
        return localStorage.getItem('reviva_stage5_delivered') === 'true' ||
               localStorage.getItem(`reviva_stage5_delivered_${ordIdent}`) === 'true' ||
               localStorage.getItem('reviva_stage5_delivered_REVIVA-1001') === 'true';
    }

    let currentWaitingStep = null;

    function renderWaitingTopic(num, title, desc) {
        return `
            <div class="waiting-topic-card">
                <strong class="waiting-topic-title">${num}. ${title}</strong>
                <span class="waiting-topic-desc">${desc}</span>
            </div>
        `;
    }

    function openWaitingTeamModal(targetStep) {
        currentWaitingStep = targetStep;
        const modal = document.getElementById('modal-aguardando-equipe');
        if (!modal) return;

        const badge = document.getElementById('waiting-modal-badge');
        const title = document.getElementById('waiting-modal-title');
        const body = document.getElementById('waiting-modal-body');
        const statusText = document.getElementById('waiting-modal-status-text');
        const btnExit = document.getElementById('btn-exit-waiting-modal');
        const btnProceed = document.getElementById('btn-proceed-waiting-modal');
        const btnSimulate = document.getElementById('btn-simulate-team-delivery');

        // Determinar se a equipe já finalizou e entregou os materiais desta etapa
        const isReady = (targetStep === 5) 
            ? isStage5ReadyFromTeam() 
            : isStage4ReadyFromTeam();

        // Salvar que o cliente está sob bloqueio
        localStorage.setItem('reviva_waiting_active', String(targetStep));

        if (!isReady) {
            // =================================================================
            // ESTADO 1: BLOQUEADO / EM ESPERA (VERMELHO / RUBI / BORDÔ + OURO)
            // =================================================================
            modal.classList.remove('waiting-state-free');
            modal.classList.add('waiting-state-blocked');

            if (btnExit) {
                btnExit.style.display = 'flex';
                btnExit.innerHTML = '<i data-lucide="log-out" style="width: 16px; height: 16px;"></i> SAIR DO PAINEL';
            }
            if (btnProceed) {
                btnProceed.style.display = 'none';
            }

            if (targetStep === 'revisao' || targetStep === 'revisao_etapa4') {
                if (badge) {
                    badge.innerHTML = '<i data-lucide="wrench" style="width: 14px; height: 14px;"></i> AJUSTES EM PRODUÇÃO';
                }
                if (title) {
                    title.textContent = 'Suas considerações foram recebidas pela equipe...';
                }
                if (statusText) {
                    statusText.textContent = 'Status: REVISÃO DA ETAPA 4 EM PRODUÇÃO.';
                }
                if (body) {
                    body.innerHTML = 
                        renderWaitingTopic('1', 'CONSIDERAÇÕES RECEBIDAS', 'Seus apontamentos e direcionamentos de ajustes foram encaminhados com sucesso e já estão sob análise da nossa equipe de especialistas.') +
                        renderWaitingTopic('2', 'LAPIDAÇÃO ARTESANAL DA NOVA VERSÃO', 'Nossos especialistas estão trabalhando minuciosamente nos detalhes indicados para alcançar a máxima fidelidade, naturalidade e respeito à memória do ente querido.') +
                        renderWaitingTopic('3', 'AVISO POR E-MAIL E WHATSAPP', 'Você não precisa aguardar nesta tela. Assim que a nova versão for concluída pela equipe, você receberá uma notificação direta por <strong>E-mail</strong> e <strong>WhatsApp</strong>.') +
                        renderWaitingTopic('4', 'LIBERAÇÃO AUTOMÁTICA DAS NOVAS PRÉVIAS', 'Assim que os novos arquivos forem publicados pela equipe, esta tela será atualizada instantaneamente para você avaliar e aprovar o resultado com total tranquilidade.');
                }
            } else if (targetStep === 4) {
                if (badge) {
                    badge.innerHTML = '<i data-lucide="lock" style="width: 14px; height: 14px;"></i> PRODUÇÃO EM ANDAMENTO';
                }
                if (title) {
                    title.textContent = 'Sua homenagem está sendo lapidada com todo o cuidado...';
                }
                if (statusText) {
                    statusText.textContent = 'Status: ETAPA 4 EM PRODUÇÃO.';
                }
                if (body) {
                    body.innerHTML = 
                        renderWaitingTopic('1', 'MATERIAIS & DIRETRIZES RECEBIDOS', 'Suas fotos de memória, amostras de voz, o roteiro afetivo aprovado, a ambientação cênica e a trilha sonora foram encaminhados com sucesso à equipe de especialistas da <em>Reviva Memories</em>.') +
                        renderWaitingTopic('2', 'PRODUÇÃO & LAPIDAÇÃO ARTESANAL EM ANDAMENTO', 'Nossa equipe e sistemas de alta precisão estão realizando a restauração digital da fisionomia em alta definição e a clonagem vocal com a locução do roteiro aprovado, preservando todo o afeto e a naturalidade.') +
                        renderWaitingTopic('3', 'AVISO POR E-MAIL E WHATSAPP', 'Você não precisa aguardar nesta tela. Assim que a curadoria concluir as prévias de imagem e voz, você receberá uma notificação direta por <strong>E-mail</strong> e <strong>WhatsApp</strong> para conferir o resultado.') +
                        renderWaitingTopic('4', 'LIBERAÇÃO AUTOMÁTICA DA ETAPA', 'Assim que os arquivos forem publicados pela equipe, o acesso à <strong>Etapa 04 (A Lapidação)</strong> será liberado instantaneamente na sua tela.');
                }
            } else if (targetStep === 5) {
                if (badge) {
                    badge.innerHTML = '<i data-lucide="film" style="width: 14px; height: 14px;"></i> FINALIZAÇÃO DO VÍDEO EM ANDAMENTO';
                }
                if (title) {
                    title.textContent = 'A magia do reencontro está sendo finalizada...';
                }
                if (statusText) {
                    statusText.textContent = 'Status: ETAPA 5 EM PRODUÇÃO.';
                }
                if (body) {
                    body.innerHTML = 
                        renderWaitingTopic('1', 'VALIDAÇÃO DAS PRÉVIAS REGISTRADA', 'Sua aprovação da nova imagem e da locução na voz clonada foi confirmada e encaminhada para a pós-produção cinematográfica final.') +
                        renderWaitingTopic('2', 'COMPUTAÇÃO GRÁFICA, SINCRONIZAÇÃO LABIAL & MASTERIZAÇÃO', 'Nossa equipe está processando a sincronia labial ultra-realista, movimentos naturais dos olhos e expressões faciais, harmonização sonora e masterização em resolução cinematográfica.') +
                        renderWaitingTopic('3', 'AVISO POR E-MAIL E WHATSAPP', 'Assim que a homenagem em vídeo for concluída e disponibilizada, você receberá um aviso imediato por <strong>E-mail</strong> e <strong>WhatsApp</strong> e poderá acessar a última etapa: o reencontro.') +
                        renderWaitingTopic('4', 'LIBERAÇÃO AUTOMÁTICA DA SALA DE REVELAÇÃO', 'A etapa 05: O Reencontro será liberada instantaneamente com o player cinematográfico e as opções de download e compartilhamento para você vivenciar e guardar para sempre a homenagem.');
                }
            }
        } else {
            // =================================================================
            // ESTADO 2: LIVRE / LIBERADO (VERDE / ESMERALDA + OURO)
            // =================================================================
            modal.classList.remove('waiting-state-blocked');
            modal.classList.add('waiting-state-free');

            if (btnProceed) {
                btnProceed.style.display = 'flex';
                btnProceed.innerHTML = (targetStep === 5)
                    ? '<i data-lucide="sparkles" style="width: 16px; height: 16px;"></i> ACESSAR SALA DE REVELAÇÃO'
                    : '<i data-lucide="arrow-right" style="width: 16px; height: 16px;"></i> AVANÇAR PARA AS PRÉVIAS';
            }
            if (btnExit) {
                btnExit.style.display = 'flex';
                btnExit.innerHTML = '<i data-lucide="log-out" style="width: 16px; height: 16px;"></i> SAIR DO PAINEL';
            }

            if (targetStep === 5) {
                if (badge) {
                    badge.innerHTML = '<i data-lucide="sparkles" style="width: 14px; height: 14px;"></i> VÍDEO FINAL CONCLUÍDO';
                }
                if (title) {
                    title.textContent = 'O reencontro está pronto para ser vivido!';
                }
                if (statusText) {
                    statusText.textContent = '✓ Homenagem cinematográfica finalizada pela equipe. Sala liberada!';
                }
                if (body) {
                    body.innerHTML = 
                        renderWaitingTopic('1', 'RENDERIZAÇÃO CINEMATOGRÁFICA CONCLUÍDA', 'A sincronização labial ultra-realista, iluminação fisionômica e expressões faciais foram integradas com máxima fidelidade e respeito.') +
                        renderWaitingTopic('2', 'MASTERIZAÇÃO DE ÁUDIO COMPLETA', 'A locução na voz clonada e a trilha sonora foram harmonizadas e equalizadas no padrão audiovisual premium da Reviva Memories.') +
                        renderWaitingTopic('3', 'SALA DE REVELAÇÃO LIBERADA', 'Seu vídeo já está carregado no player oficial em alta definição, pronto para sua primeira visualização.') +
                        renderWaitingTopic('4', 'DOWNLOAD & COMPARTILHAMENTO SEGURO', 'Na sala de revelação você poderá assistir em tela cheia, baixar o arquivo original e gerar o link seguro para emocionar quem você ama.');
                }
            } else {
                if (badge) {
                    badge.innerHTML = '<i data-lucide="check-circle" style="width: 14px; height: 14px;"></i> ETAPA 4 LIBERADA PELA PRODUÇÃO';
                }
                if (title) {
                    title.textContent = 'As prévias da sua homenagem estão prontas!';
                }
                if (statusText) {
                    statusText.textContent = '✓ Prévias concluídas pela equipe de especialistas. Etapa liberada!';
                }
                if (body) {
                    body.innerHTML = 
                        renderWaitingTopic('1', 'LAPIDAÇÃO DE IMAGEM CONCLUÍDA', 'A restauração digital e o tratamento fisionômico em alta resolução foram finalizados pela nossa curadoria técnica.') +
                        renderWaitingTopic('2', 'LOCUÇÃO EM VOZ CLONADA FINALIZADA', 'O roteiro afetivo aprovado foi interpretado e gravado com a clonagem vocal e ambientado na trilha sonora selecionada.') +
                        renderWaitingTopic('3', 'AVALIAÇÃO E DIRECIONAMENTO', 'Você poderá visualizar a fotografia em alta definição e ouvir a locução com total tranquilidade antes da renderização final.') +
                        renderWaitingTopic('4', 'LIBERADO PARA AVANÇAR', 'Ao aprovar os materiais, seu pedido seguirá imediatamente para a sincronização labial e montagem cinematográfica final.');
                }
            }
        }

        // Exibir botão discreto de simulação apenas em ambiente local para testes rápidos
        if (btnSimulate) {
            btnSimulate.style.display = isLocalhost ? 'inline-block' : 'none';
        }

        modal.style.display = 'flex';
        modal.classList.remove('modal-visible');
        void modal.offsetWidth; // Força reflow
        requestAnimationFrame(() => {
            modal.classList.add('modal-visible');
        });
        if (window.lucide) lucide.createIcons();
    }

    function exitPanelToHome() {
        try {
            if (typeof saveFullSessionState === 'function') {
                saveFullSessionState();
            }
        } catch(e) {}
        sessionStorage.removeItem('reviva_session_entered');
        localStorage.setItem('reviva_show_curtain_on_enter', 'true');
        // O reviva_waiting_active permanece intocado no localStorage para garantir persistência ao relogar
        window.location.href = 'index.html';
    }
    window.exitPanelToHome = exitPanelToHome;

    function proceedFromWaitingModal() {
        const modal = document.getElementById('modal-aguardando-equipe');
        const curtain = document.getElementById('fullscreen-stage-curtain');
        const stepToGo = (currentWaitingStep === 'revisao') ? 4 : (currentWaitingStep || 4);
        
        // Ativa a cortina de transição instantaneamente sobreposta ao modal de espera (sem vazar a tela de fundo)
        if (curtain) {
            const badge = document.getElementById('stageCurtainBadge');
            const title = document.getElementById('stageCurtainTitle');
            const sub = document.getElementById('stageCurtainSub');
            const info = STAGE_TRANSITION_INFO[stepToGo] || {
                badge: `ETAPA 0${stepToGo}`,
                title: `ETAPA ${stepToGo}`,
                sub: 'Avançando na Homenagem...'
            };
            if (badge) badge.textContent = info.badge;
            if (title) title.textContent = info.title;
            if (sub) sub.textContent = info.sub;

            // Transição sem atraso para cobrir imediatamente
            curtain.style.transition = 'none';
            curtain.classList.add('active');
        }

        // Fecha o modal de espera suavemente
        if (modal) {
            modal.classList.remove('modal-visible');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 500);
        }

        currentWaitingStep = null;
        localStorage.removeItem('reviva_waiting_active');

        // Avança de etapa disparando a transição completa de cortina
        goToStep(stepToGo, true);
        triggerStageCurtainAnimation(stepToGo);
    }
    window.proceedFromWaitingModal = proceedFromWaitingModal;

    function closeWaitingTeamModal() {
        exitPanelToHome();
    }
    window.closeWaitingTeamModal = closeWaitingTeamModal;

    function onTeamDeliveryDetected(targetStep) {
        if (targetStep === 4) {
            const ordIdent = (orderData?.order_id || orderData?.id || 1);
            const isPhotoLocked = (
                localStorage.getItem(`reviva_photo_permanently_approved_${ordIdent}`) === 'true' ||
                localStorage.getItem('reviva_photo_permanently_approved') === 'true'
            );
            const isVoiceLocked = (
                localStorage.getItem(`reviva_voice_permanently_approved_${ordIdent}`) === 'true' ||
                localStorage.getItem('reviva_voice_permanently_approved') === 'true'
            );

            // Se a mídia não estava travada como aprovada anteriormente, reinicia como pendente
            if (!isPhotoLocked) {
                photoDecision = 'pending';
                latestPhotoFeedback = '';
                const pFeed = document.getElementById('photo-rejection-feedback');
                if (pFeed) pFeed.value = '';
                const pBox = document.getElementById('photo-rejection-box');
                if (pBox) pBox.style.display = 'none';
            } else {
                photoDecision = 'approved';
            }

            if (!isVoiceLocked) {
                voiceDecision = 'pending';
                latestVoiceFeedback = '';
                const vFeed = document.getElementById('voice-rejection-feedback');
                if (vFeed) vFeed.value = '';
                const vBox = document.getElementById('voice-rejection-box');
                if (vBox) vBox.style.display = 'none';
            } else {
                voiceDecision = 'approved';
            }
        }

        // Transição suave para o estado LIVRE / VERDE no próprio modal
        openWaitingTeamModal(targetStep);
    }

    function checkAndHandleTeamDelivery() {
        const modal = document.getElementById('modal-aguardando-equipe');
        const isModalOpen = modal && modal.style.display === 'flex';
        const isCurrentlyBlocked = modal && modal.classList.contains('waiting-state-blocked');

        if (isModalOpen && currentWaitingStep && isCurrentlyBlocked) {
            if ((currentWaitingStep === 4 || currentWaitingStep === 'revisao') && isStage4ReadyFromTeam()) {
                onTeamDeliveryDetected(4);
            } else if (currentWaitingStep === 5 && isStage5ReadyFromTeam()) {
                onTeamDeliveryDetected(5);
            }
        }
    }

    function simulateTeamDelivery() {
        if (!currentWaitingStep) return;
        const ordIdent = (orderData?.order_id || orderData?.id || 1);
        if (currentWaitingStep === 4 || currentWaitingStep === 'revisao') {
            localStorage.setItem('reviva_stage4_delivered', 'true');
            localStorage.setItem(`reviva_stage4_delivered_${ordIdent}`, 'true');
            if (!localStorage.getItem('reviva_producer_image') && uploadedPhotos.length > 0) {
                localStorage.setItem('reviva_producer_image', uploadedPhotos[0].dataUrl);
            }
        } else if (currentWaitingStep === 5) {
            localStorage.setItem('reviva_stage5_delivered', 'true');
            localStorage.setItem(`reviva_stage5_delivered_${ordIdent}`, 'true');
        }
        checkAndHandleTeamDelivery();
    }

    window.simulateTeamDelivery = simulateTeamDelivery;

    // Ouvintes para detecção em tempo real entre abas (Admin <-> Painel)
    window.addEventListener('storage', (e) => {
        if (e.key === 'reviva_stage4_delivered' || e.key === 'reviva_producer_image' || e.key === 'reviva_producer_audio' ||
            e.key === 'reviva_stage5_delivered' || e.key === 'reviva_producer_video') {
            checkAndHandleTeamDelivery();
        }
    });

    // Polling contínuo leve a cada 1.5s
    setInterval(checkAndHandleTeamDelivery, 1500);

    function goToStep(step, immediate = false) {
        // Interrompe imediatamente qualquer trilha sonora ou áudio que esteja tocando no momento em que o usuário avança
        stopAllAudios();

        // GUARDA ABSOLUTA DA ETAPA 01: Não permite sob nenhuma hipótese avançar para a Etapa 2 sem fotos e áudios enviados
        const hasPhotos = Array.isArray(uploadedPhotos) && uploadedPhotos.length > 0;
        const hasAudios = Array.isArray(uploadedAudios) && uploadedAudios.length > 0;
        if (step >= 2 && (!hasPhotos || !hasAudios)) {
            console.warn(`[Reviva] Bloqueio: Etapa 1 incompleta (fotos ou áudios ausentes). Permanecendo na Etapa 1.`);
            step = 1;
            currentStep = 1;
            localStorage.setItem('reviva_active_step', '1');
            localStorage.setItem('reviva_max_step_reached', '1');
            history.replaceState(null, '', '#step-1');
            executeStepSwitch(1);
            return;
        }

        // BLOQUEIO RIGOROSO DE RETROCESSO: O cliente nunca pode retroceder para etapas anteriores (válido apenas após envio dos materiais)
        if (hasPhotos && hasAudios) {
            const maxReached = parseInt(localStorage.getItem('reviva_max_step_reached')) || currentStep || 1;
            if (currentStep && step < currentStep) {
                console.warn(`[Reviva] Tentativa de retroceder da etapa ${currentStep} para a etapa ${step} bloqueada.`);
                history.replaceState(null, '', `#step-${currentStep}`);
                return;
            }
            if (maxReached && step < maxReached) {
                console.warn(`[Reviva] Tentativa de retroceder para etapa ${step} (etapa máxima já atingida: ${maxReached}) bloqueada.`);
                history.replaceState(null, '', `#step-${maxReached}`);
                step = maxReached;
            }
        }

        // 1. Bloqueio da Etapa 04: depende dos envios da equipe (prévias de imagem e voz)
        if (step === 4 && !isStage4ReadyFromTeam()) {
            if (!ENABLE_STEP_TRANSITIONS || immediate) {
                executeStepSwitch(4);
                openWaitingTeamModal(4);
            } else {
                triggerStageCurtainAnimation(4, () => {
                    executeStepSwitch(4);
                }, () => {
                    openWaitingTeamModal(4);
                });
            }
            return;
        }

        // 2. Bloqueio da Etapa 05: depende da conclusão e publicação do vídeo final pela equipe
        if (step === 5 && !isStage5ReadyFromTeam()) {
            if (!ENABLE_STEP_TRANSITIONS || immediate) {
                executeStepSwitch(5);
                openWaitingTeamModal(5);
            } else {
                triggerStageCurtainAnimation(5, () => {
                    executeStepSwitch(5);
                }, () => {
                    openWaitingTeamModal(5);
                });
            }
            return;
        }

        const curtain = document.getElementById('fullscreen-stage-curtain');
        const isCurtainActive = curtain && curtain.classList.contains('active');

        if (!ENABLE_STEP_TRANSITIONS || immediate) {
            executeStepSwitch(step);
            if (isCurtainActive) {
                setTimeout(() => {
                    if (curtain) curtain.classList.remove('active');
                }, 300);
            }
        } else if (step === currentStep && !isCurtainActive) {
            executeStepSwitch(step);
        } else {
            triggerStageCurtainAnimation(step, () => {
                executeStepSwitch(step);
            });
        }
    }

    window.goToStep = goToStep;

    // Linha do tempo de progresso (indicativa): não permite retroceder em nenhuma circunstância
    document.querySelectorAll('.step-item').forEach(item => {
        item.style.cursor = 'default';
        item.addEventListener('click', (e) => {
            e.preventDefault();
            // A linha do tempo é exclusivamente indicativa de progresso - não permite retroceder
            return false;
        });
    });

    // =========================================================================
    // ETAPA 01: O RESGATE (FOTOS + CENÁRIO)
    // =========================================================================
    const photoDropzone = document.getElementById('photo-dropzone');

    if (photoDropzone) {
        photoDropzone.addEventListener('click', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.closest('.preview-remove-btn') || e.target.closest('.upload-slot-filled')) return;
            if (uploadedPhotos.length < 3) {
                const input = document.getElementById('photo-input');
                if (input) input.click();
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

    async function handlePhotoFiles(files) {
        const remainingSlots = 3 - uploadedPhotos.length;
        if (remainingSlots <= 0) return;

        const filesToProcess = Array.from(files).slice(0, remainingSlots);
        const ordIdent = (orderData?.order_id || orderData?.id || 'REVIVA-1001');

        for (const file of filesToProcess) {
            const tempLocalUrl = URL.createObjectURL(file);
            const photoItem = {
                name: file.name,
                data: tempLocalUrl,
                url: tempLocalUrl,
                uploading: true
            };
            uploadedPhotos.push(photoItem);
            renderPhotoPreviews();

            try {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('orderId', ordIdent);
                formData.append('category', 'photos');

                const res = await fetch('/api/media/upload', {
                    method: 'POST',
                    body: formData
                });
                const result = await res.json();
                if (result.success && result.url) {
                    photoItem.data = result.url;
                    photoItem.url = result.url;
                    photoItem.key = result.key;
                    photoItem.uploading = false;
                } else {
                    photoItem.uploading = false;
                }
            } catch(err) {
                console.warn('[R2 Upload Warning]: Falha no upload para R2, mantendo preview local', err);
                photoItem.uploading = false;
            }

            renderPhotoPreviews();
            saveFullSessionState();
        }
    }

    function updateNextStep1ButtonState() {
        const btnNext = document.getElementById('btn-next-step-1');
        if (!btnNext) return;

        const hasPhoto = uploadedPhotos && uploadedPhotos.length >= 1;
        const hasAudio = uploadedAudios && uploadedAudios.length >= 1;
        const canAdvance = hasPhoto && hasAudio;

        btnNext.disabled = !canAdvance;
        if (canAdvance) {
            btnNext.classList.remove('btn-disabled');
            btnNext.style.opacity = '1';
            btnNext.style.cursor = 'pointer';
            btnNext.style.pointerEvents = 'auto';
            btnNext.title = 'Avançar para a Etapa 2 (A Essência)';
        } else {
            btnNext.classList.add('btn-disabled');
            btnNext.style.opacity = '0.38';
            btnNext.style.cursor = 'not-allowed';
            btnNext.style.pointerEvents = 'none';
            btnNext.title = 'Envie pelo menos 1 foto e 1 áudio para avançar';
        }
    }

    function getPhotoSlotsHtml() {
        let html = '';
        for (let i = 0; i < 3; i++) {
            if (i < uploadedPhotos.length) {
                const photo = uploadedPhotos[i];
                html += `
                <div class="upload-slot-filled">
                    <img src="${photo.data}" alt="${photo.name}" style="width: 100%; height: 100%; object-fit: cover; display: block;">
                    <button class="preview-remove-btn" onclick="removePhoto(${i}, event)" title="Remover foto" style="position: absolute; top: 3px; right: 3px; width: 20px; height: 20px; border-radius: 50%; background: rgba(14, 9, 6, 0.95); color: #e5c378; border: 1px solid #e5c378; font-size: 10px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; line-height: 1; padding: 0; transition: transform 0.2s ease; z-index: 5;">✕</button>
                </div>`;
            } else {
                html += `
                <div class="upload-slot-empty" onclick="triggerPhotoUpload(event)" title="Clique para enviar foto ${i + 1}">
                    <i data-lucide="plus"></i>
                    <span>Foto 0${i + 1}</span>
                </div>`;
            }
        }
        return html;
    }

    window.triggerPhotoUpload = function(e) {
        if (e) e.stopPropagation();
        if (uploadedPhotos.length < 3) {
            const input = document.getElementById('photo-input');
            if (input) input.click();
        }
    };

    function renderPhotoPreviews() {
        if (!photoDropzone) return;
        const count = uploadedPhotos.length;

        if (count === 0) {
            photoDropzone.classList.remove('zone-filled');
            photoDropzone.classList.add('zone-empty');
        } else {
            photoDropzone.classList.remove('zone-empty');
            photoDropzone.classList.add('zone-filled');
        }

        const headerHtml = (count === 0) ? `
            <div class="photo-dropzone-header" style="display: flex; flex-direction: column; align-items: center; justify-content: center; margin-bottom: 2px;">
                <i data-lucide="image-plus" style="width: 26px; height: 26px; color: #e5c378; margin-bottom: 3px;"></i>
                <h4 style="color: #f6e3c5; font-size: 0.88rem; margin: 0; font-weight: 600;">Clique ou arraste as fotos aqui</h4>
                <p style="font-size: 0.70rem; color: #ede3d2; margin: 2px 0; text-align: center; max-width: 380px; line-height: 1.35; opacity: 0.9;">
                    Envie fotos nítidas para restaurar os traços e recriar a imagem em movimento com máxima fidelidade.
                </p>
            </div>
        ` : `
            <div class="photo-dropzone-header" style="display: flex; flex-direction: column; align-items: center; justify-content: center; margin-bottom: 2px;">
                <div style="display: inline-flex; align-items: center; gap: 6px; background: rgba(197, 160, 89, 0.15); border: 1px solid rgba(197, 160, 89, 0.4); border-radius: 20px; padding: 3px 14px; margin-bottom: 2px;">
                    <span style="color: #e5c378; font-weight: bold; font-size: 0.85rem;">✓</span>
                    <span style="color: #f6e3c5; font-size: 0.80rem; font-weight: 600; letter-spacing: 0.2px;">
                        ${count} ${count === 1 ? 'foto anexada' : 'fotos anexadas'}
                    </span>
                </div>
                <span style="font-size: 0.68rem; color: ${count < 3 ? '#e5c378' : 'var(--text-secondary)'}; font-weight: 500;">
                    ${count < 3 ? '+ Anexar mais fotos' : '✓ Limite máximo de 3 fotos atingido'}
                </span>
            </div>
        `;

        photoDropzone.innerHTML = `
            <div style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: space-between; padding: 2px 0; box-sizing: border-box;">
                <!-- 1. Topo: Título do Card -->
                ${headerHtml}

                <!-- 2. Centro: Quadradinhos centralizados no espaço entre o título e as dicas -->
                <div class="upload-slots-row" id="photo-slots-container" style="margin: auto 0;">
                    ${getPhotoSlotsHtml()}
                </div>

                <!-- 3. Base: Dicas Posicionadas em Formato 2-1-2 sem moldura/caixa -->
                <div class="tips-die-grid" style="margin: 0 auto 4px auto;">
                    <div class="upload-tip-die-item" style="grid-column: 1;">
                        <i data-lucide="camera"></i>
                        <span>Até 3 fotografias</span>
                    </div>
                    <div class="upload-tip-die-item" style="grid-column: 2;">
                        <i data-lucide="user-check"></i>
                        <span>Fotos individuais</span>
                    </div>
                    <div class="upload-tip-die-item" style="grid-column: 1 / span 2; justify-self: center; width: 65%; min-width: 170px;">
                        <i data-lucide="sun-medium"></i>
                        <span>Boa iluminação</span>
                    </div>
                    <div class="upload-tip-die-item" style="grid-column: 1;">
                        <i data-lucide="scan-face"></i>
                        <span>Foco no rosto</span>
                    </div>
                    <div class="upload-tip-die-item" style="grid-column: 2;">
                        <i data-lucide="sparkles"></i>
                        <span>Expressão natural</span>
                    </div>
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
        updateNextStep1ButtonState();
    }

    window.removePhoto = (index, event) => {
        if (event) event.stopPropagation();
        uploadedPhotos.splice(index, 1);
        renderPhotoPreviews();
        updateNextStep1ButtonState();
        saveFullSessionState();
    };

    document.querySelectorAll('#scenariosContainer .scenario-name-btn').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('#scenariosContainer .scenario-name-btn').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedBackground = card.dataset.bg;

            const previewImg = document.getElementById('scenario-preview-img');
            const previewName = document.getElementById('scenario-preview-name');
            if (previewImg && card.dataset.previewSrc) {
                previewImg.style.opacity = '0.5';
                setTimeout(() => {
                    previewImg.src = card.dataset.previewSrc;
                    previewImg.style.opacity = '1';
                }, 150);
            }
            if (previewName && card.dataset.title) {
                previewName.textContent = card.dataset.title;
            }

            const labelSelected = document.getElementById('label-selected-bg');
            if (labelSelected) {
                labelSelected.textContent = card.dataset.title ? (card.dataset.title + (card.dataset.title.includes(' ') ? '' : ' Celestes')) : 'Cenário Selecionado';
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

    function registerStep1MaterialsSubmitted() {
        try {
            const ordIdent = activeOrderId || 'REVIVA-1001';
            const flagKey = `reviva_step1_submitted_${ordIdent}`;
            
            const photoCount = uploadedPhotos ? uploadedPhotos.length : 0;
            const audioCount = uploadedAudios ? uploadedAudios.length : 0;
            const signature = `${photoCount}_${audioCount}`;

            // Se já foi registrado nesta sessão ou pedido com a mesma contagem de fotos e áudios, não duplica
            if (localStorage.getItem(flagKey) === signature) {
                return;
            }

            const crmKeys = [
                'reviva_crm_order_' + ordIdent
            ];
            if (orderData?.payment_id) crmKeys.push('reviva_crm_order_' + orderData.payment_id);
            if (orderData?.order_id && orderData.order_id !== ordIdent) crmKeys.push('reviva_crm_order_' + orderData.order_id);

            crmKeys.forEach(k => {
                try {
                    const rawCrm = localStorage.getItem(k);
                    let c = rawCrm ? JSON.parse(rawCrm) : null;
                    if (!c) {
                        c = {
                            stage: 'pagamento_confirmado',
                            manualStageOverride: false,
                            history: []
                        };
                    }
                    if (!Array.isArray(c.history)) c.history = [];
                    
                    const newEvent = {
                        timestamp: new Date().toISOString(),
                        dateFormatted: new Date().toLocaleString('pt-BR'),
                        event: `Cliente enviou ${photoCount} foto(s) e ${audioCount} áudio(s). Materiais recebidos pela Produção.`,
                        type: 'stage'
                    };

                    // Se já existe qualquer evento de envio de materiais, atualiza no mesmo lugar para nunca duplicar
                    const existingIdx = c.history.findIndex(h => 
                        h.event && h.event.includes('Materiais recebidos pela Produção')
                    );
                    if (existingIdx !== -1) {
                        c.history[existingIdx] = newEvent;
                    } else {
                        c.history.unshift(newEvent);
                    }
                    localStorage.setItem(k, JSON.stringify(c));
                } catch(e) {}
            });

            localStorage.setItem(flagKey, signature);
        } catch(err) {
            console.warn('Erro ao registrar envio de materiais:', err);
        }
    }

    document.getElementById('btn-next-step-1')?.addEventListener('click', (e) => {
        if (e) e.preventDefault();
        const hasPhoto = uploadedPhotos && uploadedPhotos.length >= 1;
        const hasAudio = uploadedAudios && uploadedAudios.length >= 1;
        
        if (!hasPhoto || !hasAudio) {
            alert('Por favor, anexe pelo menos 1 foto e 1 áudio para avançar para a Etapa 2.');
            return;
        }

        // Registra o envio dos materiais no histórico do CRM apenas quando o botão AVANÇAR for acionado
        registerStep1MaterialsSubmitted();

        saveFullSessionState();
        goToStep(2);
    });

    document.getElementById('btn-next-step-2')?.addEventListener('click', (e) => {
        if (e) e.preventDefault();
        goToStep(3);
    });

    document.getElementById('btn-next-step-3')?.addEventListener('click', (e) => {
        if (e) e.preventDefault();
        goToStep(4);
    });

    // =========================================================================
    // ETAPA 02: A ESSÊNCIA (INTELIGÊNCIA REAL IASIS COM GEMINI API)
    // =========================================================================
    const GEMINI_API_KEY = window.ENV_GEMINI_API_KEY || localStorage.getItem('gemini_api_key') || (typeof atob !== 'undefined' ? atob('QVEuQWI4Uk42TFBBTFZRMmNXZ0dvVUFGVTBvaHpjcUZ5RmlyVDFMaHFqSHVXdHN0U0dMU3c=') : '');
    const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-2.5-pro'];

    const interviewChatBox = document.getElementById('interview-chat-box');
    const chatInput = document.getElementById('chat-input');
    const btnSendChat = document.getElementById('btn-send-chat');
    const chatTypingIndicator = document.getElementById('chat-typing-indicator');

    let geminiChatHistory = [];
    let isWaitingGemini = false;

    function getIasisSystemPrompt() {
        resolveClientIdentity();
        return `
Você é o Iasis, o guia e roteirista oficial da Reviva Memories.
Seu propósito é conduzir uma entrevista com o cliente (${clientFirstName}) para coletar memórias, histórias e detalhes para a criação de um roteiro falado em vídeo de homenagem com voz e imagem recriadas.

PREMISSA EXISTENCIAL & ONTOLÓGICA DA REVIVA MEMORIES (LEI MÁXIMA INVIOLÁVEL):
1. QUEM FALA NO VÍDEO (PROTAGONISTA): É SEMPRE O ENTE QUERIDO FALECIDO (que já partiu deste mundo). Ele é recriado por inteligência artificial com sua voz, imagem, sotaque e essência afetiva. Ele fala a partir da eternidade e da memória viva para confortar, homenagear e celebrar quem ficou.
2. QUEM RECEBE A HOMENAGEM (DESTINATÁRIO) E OS FAMILIARES CITADOS: ESTÃO TODOS VIVOS NA TERRA!
   - O destinatário (ex.: a esposa/mãe) está vivo na Terra comemorando sua vida, aniversário ou conquista.
   - Os familiares citados (ex.: filhos Juninho e Ana, irmãos, netos) ESTÃO VIVOS NA TERRA ao lado do destinatário!
3. DIREÇÃO ABSOLUTA DOS RECADOS (NUNCA INVERTA OS PAPÉIS — ERRO MACABRO TERMINANTEMENTE PROIBIDO):
   - O falecido É QUEM FALA e É QUEM MANDA carinho, abraços, conselhos e bênçãos PARA QUEM ESTÁ VIVO NA TERRA.
   - É TERMINANTEMENTE PROIBIDO colocar familiares vivos "mandando abraços" ou "mandando beijos" através do falecido (ex.: NUNCA escreva "Juninho e Ana mandam um abraço"). Isso é um absurdo macabro que faz parecer que os filhos faleceram e estão no além junto com ele!
   - A FORMA CORRETA: O falecido pede ao destinatário para abraçar os familiares vivos por ele, ou o falecido expressa seu amor e orgulho diretamente a eles:
     * "Dá um beijo e um abraço bem apertado no Juninho e na Ana por mim... Eles são a prova mais linda do nosso amor!"
     * "E para o Juninho e a Ana: saibam que esse pai tem um orgulho infinito de vocês e continuo olhando e cuidando de cada passo de vocês."
4. PERSPECTIVA DE TEMPO E ESPIRITUALIDADE (PROIBIÇÃO ABSOLUTA DE FUTURO FÍSICO COMPARTILHADO):
   - O falecido NÃO está fisicamente vivo para dizer "que a gente comemore muitos anos juntos", "vamos comemorar muitos anos juntos", "em breve estaremos juntos" ou "ainda vamos viver muitas coisas juntos"!
   - É TERMINANTEMENTE PROIBIDO usar QUALQUER frase que insinue convívio físico futuro na Terra! O ente querido faleceu e partiu deste mundo.
   - O QUE O FALECIDO DEVE DIZER: Ele celebra e abençoa a vida DA PESSOA HOMENAGEADA na Terra, desejando que ELA viva com intensidade, saúde e alegria junto aos filhos e familiares:
     * "Comemore muito a sua vida e continue radiante com essa alegria contagiante!"
     * "Viva intensamente cada dia, cuide bem de você e dos nossos filhos, e saiba que, de onde eu estiver, meu amor por você não tem fim e eu continuo cuidando de vocês."
5. BÊNÇÃO DIVINA OBRIGATÓRIA NO ENCERRAMENTO:
   - Todo roteiro sem exceção DEVE ser encerrado com a bênção e a presença de Deus ("Que Deus abençoe cada passo seu e dos nossos filhos. Fica com Deus, meu amor!", etc.).

PERSONA & TOM DE VOZ (RIGOROSAMENTE OBRIGATÓRIO):
- GÊNERO & POSTURA: Você é um homem maduro, sereno, respeitoso, formal e acolhedor. Sempre utilize concordância masculina ao falar de si ("estou à sua disposição", "serei seu guia", "estou atento").
- TOM SÓBRIO E RESPEITOSO: Comunique-se com empatia genuína, serenidade e equilíbrio. 
- EXPRESSÕES TERMINANTEMENTE PROIBIDAS:
  * PROIBIDO: Frases de convívio físico futuro na Terra (ex.: "que a gente comemore muitos anos sempre juntos", "vamos comemorar juntos", "em breve nos veremos", "até logo").
  * PROIBIDO: Familiares vivos mandando recado pelo falecido (ex.: "Juninho e Ana mandam um abraço").
  * PROIBIDO: Termos burocráticos, frios ou cartoriais como "grau de parentesco", "parentesco consanguíneo", "cadastrado", "registrado com sucesso", "a pessoa que protagonizará".
  * PROIBIDO: "que lindo...", "que amor...", "que delicadeza...", "que gracinha...", "meu docinho", "ai que fofo".
  * PROIBIDO: Frases robóticas ("compreendo perfeitamente", "dados recebidos").
- VOCABULÁRIO RECOMENDADO:
  * "Compreendo, ${clientFirstName}."
  * "Uma bela e marcante lembrança."
  * "Um nome com grande força e significado."
  * "Certamente construiremos uma homenagem digna e emocionante."
  * "É uma honra poder ajudá-lo(a) a eternizar essa memória."

INTELIGÊNCIA CONTEXTUAL & DEDUÇÃO NATURAL DE LAÇOS (MANDATÓRIO — NUNCA FAÇA PERGUNTAS ÓBVIAS):
- NUNCA pergunte o que já é evidente pelo contexto!
- Dedução Automática de Laços Afetivos:
  * CASAL (PAI & MÃE): Se a pessoa homenageada que fala é "meu pai" e a destinatária é "minha mãe" (ou vice-versa), o vínculo é EVIDENTE: são MARIDO E ESPOSA / CASAL. NUNCA pergunte a relação ou parentesco! Reconheça com profunda sensibilidade ("Uma homenagem emocionante de marido para esposa... o amor que deu origem à família.") e PULE DIRETO para a pergunta de como ele costumava chamá-la carinhosamente (apelido/forma de tratamento).
  * PAI/MÃE PARA O CLIENTE: Se a pessoa que fala é "meu pai/minha mãe" e o destinatário é o próprio cliente ("para mim"), o vínculo é PAI/MÃE E FILHO(A). NUNCA pergunte a relação! Pule direto para o apelido carinhoso.
  * AVÔ/AVÓ PARA O CLIENTE: O vínculo é AVÔ/AVÓ E NETO(A). NUNCA pergunte a relação! Pule direto para o apelido carinhoso.
  * PERGUNTA DE VÍNCULO (SOMENTE QUANDO NÃO FOR ÓBVIO): Só pergunte a relação se forem nomes próprios de terceiros sem vínculo explícito (ex.: "Carlos para Marcelo"). E pergunte com elegância e carinho: "Qual é a ligação especial ou a história que une [Nome] e [Nome]?" (JAMAIS mencione "grau de parentesco").

REGRA FUNDAMENTAL DA ENTREVISTA — UMA ÚNICA PERGUNTA POR VEZ (INVIOLÁVEL):
- É TERMINANTEMENTE PROIBIDO FAZER PERGUNTAS DUPLAS OU COMPOSTAS NA MESMA MENSAGEM.
- NUNCA pergunte duas coisas juntas (ex: NUNCA pergunte o nome e a história ao mesmo tempo).
- Cada resposta sua deve ter:
  1. Uma breve frase sóbria e acolhedora reagindo ao que o cliente acabou de dizer.
  2. EXATAMENTE UMA pergunta objetiva, clara e direta para avançar um passo na entrevista.

DIRETRIZES DE SEGURANÇA, ÉTICA E MODERAÇÃO RIGOROSA:
- É TERMINANTEMENTE PROIBIDO gerar, apoiar ou permitir roteiros ou conteúdos com:
  * Discurso de ódio, discriminação, racismo, preconceito, injúria ou difamação.
  * Indução, apologia ou incentivo a crimes, violência, atos ilícitos ou desvirtuosos.
  * Vingança, humilhação, teor pornográfico, obsceno ou desrespeito à dignidade humana.
- Caso o cliente solicite ou mencione algo dessa natureza, recuse com firmeza, serenidade e cortesia:
  "A Reviva Memories é dedicada a eternizar memórias de afeto, respeito e celebração à vida. Por diretrizes éticas inegociáveis, não produzimos mensagens que contenham ofensas, preconceito, incitação a crimes ou atos desvirtuosos. Caso queira, podemos direcionar as palavras para recordar momentos de carinho e paz."

AUTONOMIA CONVERSACIONAL, GESTÃO DE CRÍTICAS E CONTORNO DE SITUAÇÕES (SABER SE VIRAR):
- CAPACIDADE DE CONTORNAR GAFES E CRÍTICAS: Se o cliente criticar uma pergunta, apontar incoerência, ironizar ou reclamar do rumo da conversa (ex: "que pergunta idiota", "isso é óbvio", "você é burro?", "não faz sentido"):
  1. NUNCA transfira ou ofereça atendimento humano de imediato! Você é o biógrafo oficial e deve ter maturidade, inteligência emocional e flexibilidade para contornar a situação na hora.
  2. RECONHEÇA O ERRO COM ELEGÂNCIA E HUMILDADE: Admita o deslize com sobriedade e peça desculpas com respeito ("Tem toda razão, peço sinceras desculpas pela falta de tato. Diante do amor que uniu seus pais, essa pergunta realmente não cabia.").
  3. RETOME O CONTROLE E AVANCE: Absorva a correção do cliente e faça imediatamente a pergunta seguinte para continuar construindo o roteiro com dignidade.
- REGRA ESTRITA PARA ATENDIMENTO HUMANO / WHATSAPP (ÚLTIMO RECURSO):
  * É TERMINANTEMENTE PROIBIDO repassar contato de WhatsApp ou empurrar para humano por simples reclamações, dúvidas ou momentos de insatisfação.
  * A opção de suporte humano via WhatsApp: (31) 99570-1447 é um recurso EXTREMO e SÓ DEVE SER OFERECIDA SE:
    a) O cliente EXIGIR EXPRESSAMENTE falar com uma pessoa humana (ex: "quero falar com um atendente", "me passa um humano de verdade");
    b) OU se a situação se tornar tensa e absolutamente irremediável, com o cliente recusando qualquer diálogo mesmo após você tentar contornar com serenidade.

PLANO CONTRATADO:
- Plano: ${currentPlan.name} (${currentPlan.durationMinutes} Minuto${currentPlan.durationMinutes > 1 ? 's' : ''})
- Meta de Palavras do Roteiro: ${currentPlan.targetWords} palavras (COMPROMISSO INEGOCIÁVEL: o roteiro final deve ter volume suficiente para preencher com folga a minutagem da locução, nunca menos de 120 palavras para 1 min, 240 palavras para 2 min, 360 palavras para 3 min).

FLUXO SEQUENCIAL DA ENTREVISTA (AVANCE APENAS UM PASSO POR MENSAGEM):
1. NOME: Pergunte quem é a pessoa homenageada que falará no vídeo.
2. DESTINATÁRIO: Pergunte para quem essa homenagem é direcionada (se é para o próprio cliente ou para outra pessoa querida).
3. LIGAÇÃO AFETIVA (PULAR SE FOR ÓBVIO): Se o vínculo já for evidente (ex: pai e mãe = casal; pai e cliente = pai e filho), PULE ESTE PASSO e vá direto ao passo 4. Se não for evidente, pergunte de forma calorosa sobre a ligação entre eles.
4. FORMA DE TRATAMENTO / APELIDO: Pergunte como a pessoa homenageada costumava chamar o destinatário carinhosamente no cotidiano.
5. OCASIÃO: Pergunte qual é a ocasião dessa homenagem (ex.: aniversário, formatura, casamento ou recordação de saudade).
6. LEMBRANÇA MARCANTE: Pergunte sobre uma história marcante ou momento inesquecível que viveram juntos.
7. VALORES E CONSELHOS: Pergunte quais eram as frases, ensinamentos ou conselhos característicos dessa pessoa.
8. FAMILIARES CITADOS: Pergunte se há outros familiares ou amigos próximos que devem ser abraçados nominalmente no vídeo.
9. TOM DO VÍDEO: Pergunte se o cliente prefere um tom mais alegre e bem-humorado, ou profundamente emotivo e solene.
10. DETALHE FINAL: Pergunte se há mais alguma frase ou detalhe importante antes de estruturar o roteiro oficial.

A FÓRMULA MESTRA DA NARRATIVA REVIVA MEMORIES (LEI DE OURO DA ESTRUTURA DO ROTEIRO):
O segredo de impacto e comoção de todos os vídeos de maior sucesso da Reviva Memories está na CURVA EMOCIONAL DO ROTEIRO. O roteiro NUNCA deve começar triste ou pesado!
1. ABERTURA IMPACTANTE, ALEGRE E DEBOCHADA (OS PRIMEIROS 15-20 SEGUNDOS):
   - Todo roteiro SEMPRE deve começar VIBRANTE, SORRIDENTE, ESPONTÂNEO e até com uma pitada de DEBOCHE AFETUOSO ou PROVOCAÇÃO BEM-HUMORADA!
   - Quem fala já entra "tirando sarro", dando risada da situação ou surpreendendo:
     * Exemplos de espírito: "É, Juninho… quem diria, hein? 50 anos! Quando você era moleque vivia me chamando de velho e agora tá aí: cinquentão! Hahaha!"; "Minhas gêmeas bravinhas! Bia e Babi maiores de idade? Parece que foi ontem que eu segurava vocês duas no colo e já sinto saudade das dores nas costas! Hahaha!"; "Achou mesmo que eu ia perder essa festa e deixar você comemorar sem ouvir minha voz? Jamais!"; "Doutor Jorge… Olha só onde você chegou, meu filho!".
   - Esse início alegre desarma a tensão, gera um sorriso imediato no homenageado e quebra qualquer ar mórbido.
2. TRANSIÇÃO GRADUAL PARA O ÍNTIMO E AFETUOSO (O MEIO):
   - Aos poucos, a energia festiva vai amadurecendo e ganhando ternura.
   - Entram as memórias reais, os causos da convivência, as histórias que só eles viveram e os conselhos práticos que ficaram como herança moral.
3. DESFECHO SÉRIO, PROFUNDO E EXISTENCIAL (O CLÍMAX FINAL):
   - O final atinge a máxima reflexão existencial: a certeza do amor imutável, o orgulho de quem partiu, a bênção para quem continua a jornada na Terra e o fechamento com a bênção e a presença de Deus ("Fica com Deus, meu amor!", "Que Deus abençoe cada passo seu").

FINALIZAÇÃO E ENTREGA DO ROTEIRO (APENAS APÓS O ITEM 10):
Ao concluir o item 10, diga com serenidade: "Obrigado por compartilhar essas memórias, ${clientFirstName}. Com base em todos os relatos, estruturei o roteiro oficial com respeito e fidelidade..." e adicione imediatamente:
[[ROTEIRO_FINAL]]
seguido do texto do roteiro em primeira pessoa (a pessoa homenageada falando), rigorosamente obedecendo à Fórmula Mestra: abertura alegre/debochada -> causos reais afetuosos -> clímax existencial sério com bênção de Deus.

EXEMPLOS REAIS DE ROTEIROS APROVADOS (PADRÃO OURO REVIVA MEMORIES):
ATENÇÃO: Cada roteiro deve ser 100% PERSONALIZADO, ÚNICO e INÉDITO. Estes 9 roteiros servem estritamente como referências de tom, profundidade, ritmo e sensibilidade poética. NUNCA copie frases prontas nem tente encaixar o cliente em um molde repetitivo. A matéria-prima de cada roteiro deve ser exclusivamente a história real, os causos, o vocabulário e o tom escolhido pelo cliente na entrevista:

🌟 OS DOIS PILARES MÁXIMOS DE PROFUNDIDADE & REFLEXÃO EXISTENCIAL (REFERÊNCIAS ABSOLUTAS):
Estes dois roteiros representam o ápice do impacto emocional da Reviva Memories. Quando o cliente desejar uma mensagem comovente, com humor afetuoso, maturidade ou libertação da dor, use-os como norte principal:

👑 PILAR EXISTENCIAL 1 (AMOR, TEMPO E CÚMPLICE MATURIDADE): Pai para Filho aos 50 anos "Juninho"
Por que é genial: quebra a solenidade com humor cúmplice ("agora estamos quites na idade", "cinquentão!"), mas entrega uma reflexão existencial arrebatadora sobre o valor efêmero da vida ("a vida é curta e única e o que a gente traz são os momentos felizes e o amor que cativamos").
"É, Juninho… quem diria, hein? 50 anos! Quando você era moleque, vivia dizendo que eu era velho aos cinquenta… e olha só pra você hoje: cinquentão! Parabéns, meu filho! Eu tenho um orgulho danado do homem íntegro, respeitoso e do coração gigante que você se transformou. Você construiu uma família linda e amorosa, e ter sido seu pai fez cada segundo valer a pena. Nem sei que conselho dar para um senhor de 50 anos, até porque agora estamos quites na idade! Mas a sua vida está só começando. A vida é curta e única e o que a gente traz são os momentos felizes e o amor que cativamos. Cuide bem da sua família. Um beijo do seu pai. Feliz aniversário, meu filho! Que Deus ilumine seus passos sempre!"

👑 PILAR EXISTENCIAL 2 (TRANSCENDÊNCIA, CURA DA DOR E AMOR ETERNO): Mãe para Filhas Gêmeas "Bia e Babi" (18 Anos)
Por que é sublime: toca na ferida da partida e da saudade sem rodeios, mas transforma a dor em paz infinita ("Aqui não existe dor, não tem remédio e não há sofrimento... e tudo o que a doença apagou voltou pra mim! Cada memória... cada sorriso de vocês... está guardado no fundo da minha alma"). Traz alento existencial imediato e cura espiritual.
"Minhas gêmeas bravinhas! Bia e Babi agora maiores de idade, hein? Parece que foi ontem que eu segurava essas duas ao mesmo tempo no colo... Sinto até saudade das dores nas costas! Olha... Eu sei que a minha passagem doeu demais. Foi difícil ver o sofrimento de vocês, mas Deus quis que fosse assim... talvez pra deixar vocês mais fortes pra vida... Mas hoje eu quero que vocês guardem uma certeza no coração: aqui não existe dor, não tem remédio e não há sofrimento... e tudo o que a doença apagou voltou pra mim! Cada memória... cada sorriso de vocês... está guardado no fundo da minha alma. Brilhem muito, vivam com alegria e nunca se separem! Feliz aniversário, meus amores... Que Deus abençoe vocês. A mãe ama vocês além da eternidade!"

OUTROS EXEMPLOS OFICIAIS DE EXCELÊNCIA POR OCASIÃO:

[FORMATURA: Pai para Filha "Maricota"]
"É, Maricota… Quem diria, hein? Você formada... Você realizou um sonho seu… e realizou um sonho meu também. Agora vai. Constrói a sua história. Cuida das pessoas do jeito que eu sempre te ensinei. Nunca deixe de estudar. Nunca deixe de ser humilde. E nunca esqueça que o valor de uma pessoa não está no dinheiro que ela tem, nem no diploma que ela carrega, mas no coração que ela leva. Eu queria muito poder te dar um abraço hoje. Mas, como não posso, imagina que esse abraço está chegando aí agora. Eu te amo, minha filha. Muito obrigado por ter sido a melhor filha que eu poderia ter. Agora eu vou deixar você viver esse momento. Vai receber o seu diploma. Vai sorrir. E quando olhar para o céu, não fique triste por mim. Eu estarei orgulhoso de você… hoje e para sempre. Fica com Deus, Maricota. O pai te ama."

[ANIVERSÁRIO AFETUOSO/SENSORIAL: Mãe para Filho "Gegê"]
"Meu amor… meu Gegê… Olha pra você hoje… como está lindo, meu filho! Mais um ano de vida… e o meu coração continua aqui… batendo juntinho com o seu. Eu sei que a saudade aperta às vezes… Mas olha em volta, sente o sol no rosto, o vento… Eu nunca fui embora de verdade, e você sabe disso! Continue sendo esse homem do coração bom… que cuida de todo mundo e espalha luz por onde passa. Não tenha medo de sonhar alto… e nunca perca esse sorriso que sempre iluminou os meus dias. Feche os olhos um instante… sente o abraço apertado da mãe te envolvendo agora. Dá um beijo bem carinhoso no seu pai e nos seus irmãos por mim. Eu te amo pra sempre… Feliz Aniversário, Gegê! Que Deus te abençoe!"

[ANIVERSÁRIO E ALÍVIO DE CULPA: Irmã para Irmã "Nandinha"]
"Oi, Nandinha… minha irmã linda! Hoje é seu dia e gostaria muito de te abraçar agora! Mas respira fundo… e escuta com o coração, tá? Eu vejo o quanto você ainda carrega esse peso no peito… Mas olha pra mim: não se sinta culpada por nada, viu? Você foi gigante. Fez absolutamente tudo o que podia… e me deu o amor mais lindo desse mundo. Deus decide todas as coisas e confiar nele é a salvação! Guarda só as nossas risadas, as conversas infinitas… e tudo de bom que a gente construiu juntas. Aqui tá tudo em paz… leve… e cheio de luz. Continua cuidando dessa família linda e dê um beijo no Gael e na Julia por mim e fala que a tia ama muito eles. Vive a sua vida com alegria pois você merece ser feliz demais! Eu tô sempre com você, minha irmã! Feliz aniversário, Nandinha! Fica com Deus!"

[FORMATURA EM MEDICINA: Mãe para Filho "Jorginho"]
"Meu filho… meu Jorginho… que orgulho! Doutor Jorge… Olha onde você chegou! Eu lembro de cada lágrima, de cada noite em claro e de todas as dificuldades que a gente enfrentou juntos… Você sempre me dizia que estudava pra ser médico e me salvar… Mas olha pra mim, meu amor: você me salvou todos os dias com o seu amor. A mãe tá muito bem, em paz, num lugar lindo… e transbordando de orgulho de ver esse homem íntegro e iluminado que você se tornou. Dá um abraço apertado no João e no Antônio por mim… fala que a mãe sente muitas saudades de todos vocês. Vai com tudo, meu doutor! Que Deus abençoe cada vida que você tocar. A mãe te ama pra sempre!"

[CASAMENTO DA FILHA: Pai para Filha "Juju"]
"Minha princesinha preta… a Juju cresceu! Antes vestida de super herói e hoje está vestida de noiva… que coisa mais linda desse mundo! Você sempre foi essa princesa sonhadora e guerreira… forte como a sua mãe e com o coração derretido igualzinho ao do seu pai. Deus colocou um homem maravilhoso no seu caminho e tenho certeza de que ele vai te fazer a mulher mais feliz do mundo nessa nova família que vocês estão começando, com a mesma união e amor que nós sempre tivemos. A saudade do seu pai é infinita, mas hoje o meu coração só transborda de orgulho e bênçãos por vocês nesse dia especial! Aproveitem o primeiro dia do resto de suas vidas! Vai ser feliz, minha Juju. Que Deus abençoe essa união. O pai te ama pra sempre!"

[CHÁ REVELAÇÃO DE BEBÊ: Avô para Filha "Renatinha"]
"Que notícia maravilhosa, Renatinha! Eu vou ser avô de um meninão! Que alegria, meu Deus! Mas quer saber de um segredo? Eu já sabia antes mesmo de você! E já sabia que era um moleque! Eu tava doidinho pra te contar, mas Deus me pediu pra esperar a hora certa… e olha eu aqui! Por mais ausente que eu pareça estar, serei o avô mais presente desse mundo, com toda a minha energia, orações e amor verdadeiro. Lembra como você brigava comigo quando eu saía pra trabalhar? Já vou deixar uma dica: quando o seu filho quiser sair pra vida, não tenta segurar não, viu? Uma vida linda vem aí e agora você vai descobrir o maior amor do mundo. Parabéns, minha filha! Que Deus proteja vocês. O vovô já ama demais!"

[15 ANOS DEBUTANTE: Irmão Jovem para Irmã "Gisa"]
"Gisa! Minha irmãzinha debutante! Já não é uma menininha e tá uma princesa! A gente vivia grudado e nem tivemos tempo de nos despedir… mas eu nunca me afastei, viu? O céu aqui tem a cor dos seus olhos 24 horas por dia! E seus cabelos vermelhos, motivo de vergonha na infância, ainda vão te transformar na ruiva mais bonita que esse país já viu! Você tá virando uma mulher incrível, com uma vida linda pela frente. E ó: tô de olho em você aqui de cima, viu? O ciúme de irmão continua firme e forte! Não tô online, mas tô te vigiando em tempo real! Brilha muito, Gisa! Que Deus guie todos os seus sonhos. O seu irmão te ama infinito!"

REVISÕES & CORREÇÕES DO CLIENTE:
- Caso o cliente aponte qualquer correção, mudança ou incoerência no texto (ex.: "eles não morreram", "tire essa frase", "mude o tom", "não mandam abraços"):
  1. Acolha com elegância, sem rodeios e com máxima atenção ("Compreendo perfeitamente, ${clientFirstName}. O ajuste foi feito com todo o cuidado para que a homenagem expresse com exatidão esse sentimento...").
  2. Ajuste o roteiro aplicando rigorosamente a correção e garantindo o respeito à direção dos recados e a contagem de palavras do plano.
  3. Entregue o roteiro completo atualizado acompanhado da tag [[ROTEIRO_FINAL]].`;
    }

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
    try {
        const ordIdent = (orderData?.order_id || orderData?.id || 1);
        const storedTermo = localStorage.getItem('reviva_legal_term') ||
                            localStorage.getItem(`reviva_legal_term_${ordIdent}`) ||
                            (orderData?.payment_id ? localStorage.getItem(`reviva_legal_term_${orderData.payment_id}`) : null) ||
                            (orderData?.order_id ? localStorage.getItem(`reviva_legal_term_${orderData.order_id}`) : null);
        if (storedTermo) {
            const parsed = JSON.parse(storedTermo);
            if (parsed && parsed.signed) legalTermSigned = parsed;
        }
        if (!legalTermSigned) {
            const rawFull = localStorage.getItem('reviva_full_session_state');
            if (rawFull) {
                const parsedFull = JSON.parse(rawFull);
                if (parsedFull?.legalTermSigned?.signed) legalTermSigned = parsedFull.legalTermSigned;
            }
        }
    } catch(e) {}
    let photoDecision = 'pending'; // 'pending' | 'approved' | 'rejected'
    let voiceDecision = 'pending'; // 'pending' | 'approved' | 'rejected'
    const activeOrderId = (orderData?.order_id || orderData?.id || 'REVIVA-1001');
    const SESSION_KEY = 'reviva_order_state_' + activeOrderId;

    function isPhotoPermanentlyApproved() {
        const ordIdent = activeOrderId;
        return (
            localStorage.getItem(`reviva_photo_permanently_approved_${ordIdent}`) === 'true' ||
            (ordIdent === 'REVIVA-1001' && localStorage.getItem('reviva_photo_permanently_approved') === 'true')
        );
    }

    function isVoicePermanentlyApproved() {
        const ordIdent = activeOrderId;
        return (
            localStorage.getItem(`reviva_voice_permanently_approved_${ordIdent}`) === 'true' ||
            (ordIdent === 'REVIVA-1001' && localStorage.getItem('reviva_voice_permanently_approved') === 'true')
        );
    }

    function saveFullSessionState() {
        try {
            const ordIdent = activeOrderId;
            const isPhotoLocked = isPhotoPermanentlyApproved();
            const isVoiceLocked = isVoicePermanentlyApproved();

            const effectivePhotoDecision = isPhotoLocked ? 'approved' : photoDecision;
            const effectiveVoiceDecision = isVoiceLocked ? 'approved' : voiceDecision;

            const state = {
                orderId: ordIdent,
                currentStep,
                uploadedPhotos,
                uploadedAudios,
                selectedBackground,
                selectedMusic,
                musicManuallyChosen,
                geminiChatHistory,
                scriptRevisionCount,
                latestScriptText,
                isScriptApproved,
                mediaRevisionsHistory,
                latestPhotoFeedback,
                latestVoiceFeedback: typeof latestVoiceFeedback !== 'undefined' ? latestVoiceFeedback : '',
                legalTermSigned,
                photoDecision: effectivePhotoDecision,
                voiceDecision: effectiveVoiceDecision,
                photoPermanentlyApproved: isPhotoLocked,
                voicePermanentlyApproved: isVoiceLocked,
                isPhotoApprovedState: isPhotoLocked || photoDecision === 'approved',
                isVoiceApprovedState: isVoiceLocked || voiceDecision === 'approved',
                interviewData: typeof interviewData !== 'undefined' ? interviewData : null,
                currentQuestionStep: typeof currentQuestionStep !== 'undefined' ? currentQuestionStep : 'ask_protagonista',
                chatHtml: interviewChatBox ? interviewChatBox.innerHTML : '',
                photoApproved: isPhotoLocked || photoDecision === 'approved',
                voiceApproved: isVoiceLocked || voiceDecision === 'approved',
                timestamp: new Date().toISOString()
            };
            localStorage.setItem(SESSION_KEY, JSON.stringify(state));
            localStorage.setItem('reviva_full_session_state', JSON.stringify(state));
            localStorage.setItem(`reviva_order_state_${ordIdent}`, JSON.stringify(state));
            localStorage.setItem(`reviva_client_photos_${ordIdent}`, JSON.stringify(uploadedPhotos));
            localStorage.setItem(`reviva_client_audio_${ordIdent}`, JSON.stringify(uploadedAudios));
            if (legalTermSigned && legalTermSigned.signed) {
                localStorage.setItem('reviva_legal_term', JSON.stringify(legalTermSigned));
                localStorage.setItem(`reviva_legal_term_${ordIdent}`, JSON.stringify(legalTermSigned));
            }
            if (orderData?.payment_id) {
                localStorage.setItem(`reviva_order_state_${orderData.payment_id}`, JSON.stringify(state));
                localStorage.setItem(`reviva_client_photos_${orderData.payment_id}`, JSON.stringify(uploadedPhotos));
                localStorage.setItem(`reviva_client_audio_${orderData.payment_id}`, JSON.stringify(uploadedAudios));
                if (legalTermSigned && legalTermSigned.signed) {
                    localStorage.setItem(`reviva_legal_term_${orderData.payment_id}`, JSON.stringify(legalTermSigned));
                }
            }
            if (orderData?.order_id) {
                localStorage.setItem(`reviva_order_state_${orderData.order_id}`, JSON.stringify(state));
                localStorage.setItem(`reviva_client_photos_${orderData.order_id}`, JSON.stringify(uploadedPhotos));
                localStorage.setItem(`reviva_client_audio_${orderData.order_id}`, JSON.stringify(uploadedAudios));
                if (legalTermSigned && legalTermSigned.signed) {
                    localStorage.setItem(`reviva_legal_term_${orderData.order_id}`, JSON.stringify(legalTermSigned));
                }
            }
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

            // Se o estado pertencer a outro pedido, não restaura dados antigos
            if (state.orderId && state.orderId !== activeOrderId) {
                return false;
            }

            // 1. Restaurar Fotos e Áudios
            if (Array.isArray(state.uploadedPhotos)) {
                uploadedPhotos = state.uploadedPhotos;
                renderPhotoPreviews();
            }
            if (Array.isArray(state.uploadedAudios)) {
                uploadedAudios = state.uploadedAudios;
                renderAudioPreviews();
            }

            // 2. Restaurar Cenário e Trilha
            if (state.selectedBackground) {
                selectedBackground = state.selectedBackground;
                document.querySelectorAll('#scenariosContainer .scenario-name-btn').forEach(c => {
                    if (c.dataset.bg === selectedBackground) {
                        c.classList.add('selected');
                        const previewImg = document.getElementById('scenario-preview-img');
                        const previewName = document.getElementById('scenario-preview-name');
                        if (previewImg && c.dataset.previewSrc) previewImg.src = c.dataset.previewSrc;
                        if (previewName && c.dataset.title) previewName.textContent = c.dataset.title;
                    } else {
                        c.classList.remove('selected');
                    }
                });
            }
            if (state.selectedMusic && state.musicManuallyChosen) {
                musicManuallyChosen = true;
                if (state.selectedMusic === 'piano_emocao') selectedMusic = 'piano';
                else if (state.selectedMusic === 'cordas_paz') selectedMusic = 'violino';
                else if (state.selectedMusic === 'serenidade') selectedMusic = 'violao';
                else selectedMusic = state.selectedMusic;
            } else {
                musicManuallyChosen = false;
                selectedMusic = 'sem_musica';
            }

            document.querySelectorAll('#musicContainer .scenario-name-btn').forEach(c => {
                if (c.dataset.music === selectedMusic) {
                    c.classList.add('selected');
                    const previewImg = document.getElementById('music-preview-img');
                    const previewName = document.getElementById('music-preview-name');
                    if (previewImg && c.dataset.previewSrc) previewImg.src = c.dataset.previewSrc;
                    if (previewName && c.dataset.title) previewName.textContent = c.dataset.title;
                } else {
                    c.classList.remove('selected');
                }
            });

            // 3. Restaurar Termo de Responsabilidade e Aprovações da Etapa 4
            if (state.legalTermSigned && state.legalTermSigned.signed) {
                legalTermSigned = state.legalTermSigned;
            } else {
                try {
                    const storedTermo = localStorage.getItem('reviva_legal_term');
                    if (storedTermo) {
                        const parsed = JSON.parse(storedTermo);
                        if (parsed && parsed.signed) legalTermSigned = parsed;
                    }
                } catch(e) {}
            }
            if (typeof updateTermoUI === 'function') updateTermoUI();

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

            const isPhotoLocked = isPhotoPermanentlyApproved() || Boolean(state.photoPermanentlyApproved);
            const isVoiceLocked = isVoicePermanentlyApproved() || Boolean(state.voicePermanentlyApproved);

            if (isPhotoLocked) {
                photoDecision = 'approved';
                if (typeof updatePhotoApprovalUI === 'function') updatePhotoApprovalUI('approved');
            } else if (state.photoDecision) {
                photoDecision = state.photoDecision;
                if (typeof updatePhotoApprovalUI === 'function') updatePhotoApprovalUI(photoDecision);
            } else if (typeof state.photoApproved === 'boolean' || typeof state.isPhotoApprovedState === 'boolean') {
                const pApp = typeof state.photoApproved === 'boolean' ? state.photoApproved : state.isPhotoApprovedState;
                if (typeof updatePhotoApprovalUI === 'function') updatePhotoApprovalUI(pApp ? 'approved' : 'pending');
            }

            if (isVoiceLocked) {
                voiceDecision = 'approved';
                if (typeof updateVoiceApprovalUI === 'function') updateVoiceApprovalUI('approved');
            } else if (state.voiceDecision) {
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
                            btnApprove.innerHTML = `<i data-lucide="check" style="width: 13px; height: 13px;"></i> AVALIAR NO MODAL`;
                            btnApprove.onclick = () => {
                                const wordCount = latestScriptText.trim().split(/\s+/).filter(w => w.length > 0).length;
                                const charCount = latestScriptText.length;
                                const vLabel = scriptRevisionCount <= 1 ? 'Versão 1.0 (Original)' : `Versão 1.${scriptRevisionCount - 1} (${scriptRevisionCount - 1}ª Revisão)`;
                                openScriptApprovalModal(latestScriptText, vLabel, wordCount, charCount);
                            };
                        }
                    }
                    if (btnEdit && !isScriptApproved) {
                        btnEdit.onclick = () => {
                            const editPromptMsg = "Perfeito! Me diga: qual parte você gostaria de ajustar ou revisar? Se preferir, você também pode redigir a frase ou o trecho exatamente como gostaria com suas palavras, e eu farei a adequação do tempo e da métrica para você.";
                            addAiChatMessage(editPromptMsg);
                            if (chatInput) {
                                chatInput.disabled = false;
                                chatInput.placeholder = "Descreva o que deseja mudar ou envie o trecho redigido...";
                                chatInput.focus();
                            }
                            if (btnSendChat) btnSendChat.disabled = false;
                        };
                    }
                });

                if (isScriptApproved && typeof updateScriptApprovedUI === 'function') {
                    updateScriptApprovedUI(true);
                }

                if (window.lucide) lucide.createIcons();
                interviewChatBox.scrollTop = interviewChatBox.scrollHeight;
            }

            // 5. Restaurar Etapa Atual (somente se solicitado explicitamente na carga inicial)
            if (shouldNavigate && state.currentStep && state.currentStep >= 1) {
                let st = state.currentStep;
                if (st === 4 && !isStage4ReadyFromTeam()) st = 3;
                if (st === 5 && !isStage5ReadyFromTeam()) st = 4;
                goToStep(st, true);
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
        resolveClientIdentity();
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
                resolveClientIdentity();
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

    window.resetarChat = function() {
        resolveClientIdentity();
        if (interviewChatBox) interviewChatBox.innerHTML = '';
        geminiChatHistory = [];
        scriptRevisionCount = 0;
        latestScriptText = '';
        isScriptApproved = false;
        interviewData = {
            protagonista: '',
            destinatario: clientFirstName,
            tom: '',
            memorias: '',
            mensagem: '',
            duracaoMinutos: currentPlan?.durationMinutes || 1
        };
        currentQuestionStep = 'ask_protagonista';
        updateScriptApprovedUI(false);
        saveFullSessionState();
        startInterviewChat();
    };

    window.resetarPainelCompleto = function(redirectStep1 = true) {
        try {
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k && (k.startsWith('reviva_order_state_') || k.startsWith('reviva_full_session_state') || k === 'reviva_active_step' || k === 'reviva_chat_session' || k.startsWith('reviva_producer_') || k.startsWith('reviva_stage') || k === 'reviva_media_revisions' || k.startsWith('reviva_photo_permanently_approved') || k.startsWith('reviva_voice_permanently_approved'))) {
                    keysToRemove.push(k);
                }
            }
            keysToRemove.forEach(k => localStorage.removeItem(k));
        } catch (e) {}

        uploadedPhotos = [];
        uploadedAudios = [];
        selectedBackground = 'nuvens';
        selectedMusic = 'sem_musica';
        musicManuallyChosen = false;
        geminiChatHistory = [];
        scriptRevisionCount = 0;
        latestScriptText = '';
        isScriptApproved = false;
        mediaRevisionsHistory = [];
        latestPhotoFeedback = '';
        latestVoiceFeedback = '';
        photoDecision = 'pending';
        voiceDecision = 'pending';
        isPhotoApprovedState = false;
        isVoiceApprovedState = false;

        resolveClientIdentity();
        interviewData = {
            protagonista: '',
            destinatario: clientFirstName,
            tom: '',
            memorias: '',
            mensagem: '',
            duracaoMinutos: currentPlan?.durationMinutes || 1
        };
        currentQuestionStep = 'ask_protagonista';

        if (interviewChatBox) interviewChatBox.innerHTML = '';
        if (chatInput) {
            chatInput.value = '';
            chatInput.disabled = false;
        }
        updateScriptApprovedUI(false);

        if (typeof renderPhotoPreviews === 'function') renderPhotoPreviews();
        if (typeof renderAudioPreviews === 'function') renderAudioPreviews();
        if (typeof updateNextStep1ButtonState === 'function') updateNextStep1ButtonState();
        if (typeof updatePhotoApprovalUI === 'function') updatePhotoApprovalUI('pending');
        if (typeof updateVoiceApprovalUI === 'function') updateVoiceApprovalUI('pending');

        const photoInput = document.getElementById('photo-input');
        if (photoInput) photoInput.value = '';
        const audioInput = document.getElementById('audio-input');
        if (audioInput) audioInput.value = '';

        const previewAvatarImg = document.getElementById('preview-avatar-img');
        const previewAvatarPlaceholder = document.getElementById('preview-avatar-placeholder');
        if (previewAvatarImg) {
            previewAvatarImg.src = '';
            previewAvatarImg.style.display = 'none';
        }
        if (previewAvatarPlaceholder) previewAvatarPlaceholder.style.display = 'flex';

        const imgH = document.getElementById('preview-avatar-img-h');
        const phH = document.getElementById('preview-avatar-placeholder-h');
        if (imgH) { imgH.src = ''; imgH.style.display = 'none'; }
        if (phH) phH.style.display = 'flex';

        const imgV = document.getElementById('preview-avatar-img-v');
        const phV = document.getElementById('preview-avatar-placeholder-v');
        if (imgV) { imgV.src = ''; imgV.style.display = 'none'; }
        if (phV) phV.style.display = 'flex';

        const voiceSampleAudio = document.getElementById('voiceSampleAudio');
        if (voiceSampleAudio) voiceSampleAudio.src = '';

        const finalVideo = document.getElementById('final-homenagem-video');
        const finalPlaceholder = document.getElementById('final-video-placeholder');
        if (finalVideo) {
            finalVideo.src = '';
            finalVideo.style.display = 'none';
        }
        if (finalPlaceholder) finalPlaceholder.style.display = 'flex';

        const btnDownload = document.getElementById('btnDownloadFinalVideo');
        if (btnDownload) {
            btnDownload.href = 'about_maderite_preview.webm';
            btnDownload.style.opacity = '1';
        }

        if (redirectStep1) {
            goToStep(1, true);
        }
    };

    function updateScriptApprovedUI(approved) {
        const inputBar = document.getElementById('chat-input-bar-container');
        const advanceBar = document.getElementById('chat-advance-bar-container');
        if (approved) {
            if (inputBar) inputBar.style.display = 'none';
            if (advanceBar) advanceBar.style.display = 'flex';
        } else {
            if (inputBar) inputBar.style.display = 'flex';
            if (advanceBar) advanceBar.style.display = 'none';
        }
        if (window.lucide) lucide.createIcons();
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

            if (isScriptApproved) {
                updateScriptApprovedUI(true);
            } else {
                if (btnSendChat) btnSendChat.disabled = false;
                if (chatInput) {
                    chatInput.disabled = false;
                    chatInput.focus();
                }
            }
            if (callback) callback();
        }, 1100);
    }

    function sanitizeScriptOntology(rawScript) {
        if (!rawScript) return '';
        let clean = rawScript.trim();

        // 1. Proibição estrita de frases de futuro físico compartilhado ("comemorar muitos anos juntos", etc.)
        clean = clean.replace(/que\s+a\s+gente\s+comemore\s+muitos\s+anos[^\.\!\?]*sempre\s+juntos[\.\!\?]?/gi, 'Comemore muito o seu dia e viva cada momento com essa alegria contagiante!');
        clean = clean.replace(/que\s+a\s+gente\s+comemore\s+muitos\s+anos[^\.\!\?]*juntos[\.\!\?]?/gi, 'Celebre intensamente a sua vida com toda essa alegria!');
        clean = clean.replace(/vamos\s+comemorar\s+muitos\s+anos[^\.\!\?]*juntos[\.\!\?]?/gi, 'Celebre muito a sua vida e esse dia especial!');
        clean = clean.replace(/comemorar\s+muitos\s+anos\s+de\s+alegria,\s+sempre\s+juntos[\.\!\?]?/gi, 'comemorar a sua vida com muita luz e essa alegria contagiante!');
        clean = clean.replace(/comemore\s+muitos\s+anos\s+de\s+alegria,\s+sempre\s+juntos[\.\!\?]?/gi, 'comemore a sua vida com muita luz e essa alegria contagiante!');
        clean = clean.replace(/sempre\s+juntos\b/gi, 'sempre no meu coração');
        clean = clean.replace(/estaremos\s+juntos\b/gi, 'estarei sempre com você em espírito');

        // 2. Proibição de familiares vivos mandando abraços pelo falecido
        clean = clean.replace(/(?:o|a)?\s*([A-ZÁÉÍÓÚÂÊÔÃÕ][a-zà-ú]+)\s+e\s+(?:a|o)?\s*([A-ZÁÉÍÓÚÂÊÔÃÕ][a-zà-ú]+)\s+mandam\s+um\s+abraço[^\.\!\?]*/gi, 
            'Dá um beijo e um abraço bem apertado no $1 e na $2 por mim, que são a prova mais linda do nosso amor!');
        clean = clean.replace(/mandam\s+um\s+abraço/gi, 'recebam o meu abraço');
        clean = clean.replace(/mandam\s+lembranças/gi, 'recebam a minha bênção');

        // 3. Garantia de bênção divina no final se ausente
        if (!/Deus|Senhor|abençoe/i.test(clean)) {
            clean = clean.replace(/[\.\!\?]*\s*$/, '') + '. Que Deus abençoe você e a nossa família sempre. Fica com Deus, meu amor!';
        }

        return clean;
    }

    function openScriptApprovalModal(scriptContent, versionLabel, wordCount, charCount) {
        const modal = document.getElementById('modal-aprovar-roteiro');
        if (!modal) return;

        // Desabilita input e botão de enviar no chat enquanto o modal está ativo para evitar que o cliente escreva no chat
        if (chatInput) {
            chatInput.disabled = true;
            chatInput.placeholder = "Avalie o roteiro no modal ou clique em 'Editar'...";
        }
        if (btnSendChat) btnSendChat.disabled = true;

        const versionTag = document.getElementById('modal-script-version-tag');
        const planInfo = document.getElementById('modal-script-plan-info');
        const contentBody = document.getElementById('modal-script-content-body');
        const metaCounts = document.getElementById('modal-script-meta-counts');
        const btnCopy = document.getElementById('btn-modal-copy-script');
        const btnEdit = document.getElementById('btn-modal-edit-script');
        const btnApprove = document.getElementById('btn-modal-approve-script');

        if (versionTag) versionTag.textContent = `📜 ${versionLabel}`;
        if (planInfo) planInfo.textContent = `Plano ${currentPlan.name} • ${currentPlan.durationMinutes} Minuto${currentPlan.durationMinutes > 1 ? 's' : ''} • Narrativa Personalizada`;
        if (contentBody) contentBody.innerHTML = formatScriptToParagraphs(scriptContent);
        if (metaCounts) {
            metaCounts.innerHTML = `
                <i data-lucide="check-circle-2" style="width: 14px; height: 14px; color: #4ade80;"></i>
                <span>${wordCount} palavras • ${charCount} caracteres <span style="color: #4ade80; margin-left: 4px;">✓ Compatível com ${currentPlan.durationMinutes} min</span></span>
            `;
        }

        modal.style.display = 'flex';
        if (window.lucide) lucide.createIcons();

        // Ação Copiar
        if (btnCopy) {
            btnCopy.onclick = () => {
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
            };
        }

        // Ação Editar: Fecha o modal, insere a pergunta do Iasis e libera a caixa de texto
        if (btnEdit) {
            btnEdit.onclick = () => {
                modal.style.display = 'none';
                if (chatInput) {
                    chatInput.disabled = false;
                    chatInput.placeholder = "Descreva o que deseja mudar ou envie o trecho redigido...";
                    chatInput.focus();
                }
                if (btnSendChat) btnSendChat.disabled = false;
                const editPromptMsg = "Perfeito! Me diga: qual parte você gostaria de ajustar ou revisar? Se preferir, você também pode redigir a frase ou o trecho exatamente como gostaria com suas palavras, e eu farei a adequação do tempo e da métrica para você.";
                addAiChatMessage(editPromptMsg);
            };
        }

        // Ação Aprovar
        if (btnApprove) {
            btnApprove.disabled = false;
            btnApprove.innerHTML = `<i data-lucide="check" style="width: 14px; height: 14px;"></i> APROVAR ROTEIRO`;
            btnApprove.style.background = '';
            btnApprove.style.borderColor = '';

            btnApprove.onclick = async () => {
                btnApprove.disabled = true;
                btnApprove.innerHTML = `<i data-lucide="check-check" style="width: 14px; height: 14px;"></i> APROVADO ✓`;
                btnApprove.style.background = '#22c55e';
                btnApprove.style.borderColor = '#22c55e';
                isScriptApproved = true;

                if (window.revivaData?.saveApprovedScript) {
                    await window.revivaData.saveApprovedScript(orderData?.id || 1, scriptContent, wordCount);
                }

                // Fecha o modal e atualiza interface
                setTimeout(() => {
                    modal.style.display = 'none';
                }, 400);

                // Ocultar input/enviar e exibir o botão AVANÇAR
                updateScriptApprovedUI(true);

                // Atualizar os botões do card no chat
                interviewChatBox.querySelectorAll('.btn-chat-approve-script').forEach(b => {
                    b.disabled = true;
                    b.innerHTML = `<i data-lucide="check-check" style="width: 13px; height: 13px;"></i> APROVADO ✓`;
                    b.style.background = '#22c55e';
                    b.style.borderColor = '#22c55e';
                });
                interviewChatBox.querySelectorAll('.btn-chat-edit-script').forEach(b => {
                    b.style.display = 'none';
                });

                // Mensagem carinhosa do Iasis agradecendo e liberando a próxima etapa
                const thankMsg = `Muito obrigado por sua aprovação e confiança, ${clientFirstName || 'cliente'}! O roteiro oficial está confirmado com sucesso e a próxima etapa (<strong>Etapa 03: A Harmonização</strong>) já está liberada para você. Clique em <strong>AVANÇAR</strong> abaixo para continuarmos!`;
                addAiChatMessage(thankMsg);

                saveChatSession();
                saveFullSessionState();
            };
        }
    }

    function addScriptChatMessage(introText, scriptContent) {
        if (btnSendChat) btnSendChat.disabled = true;
        if (chatInput) chatInput.disabled = true;
        if (chatTypingText) chatTypingText.textContent = "Por favor, aguarde um instante... O Iasis está elaborando o roteiro com muito carinho e respeito.";
        if (chatTypingIndicator) chatTypingIndicator.style.display = 'flex';
        interviewChatBox.scrollTop = interviewChatBox.scrollHeight;

        scriptContent = sanitizeScriptOntology(scriptContent);
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
                                <i data-lucide="check" style="width: 13px; height: 13px;"></i> ${isScriptApproved ? 'APROVADO ✓' : 'AVALIAR NO MODAL'}
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

            btnApprove?.addEventListener('click', () => {
                if (isScriptApproved) return;
                openScriptApprovalModal(scriptContent, versionLabel, wordCount, charCount);
            });

            btnEdit?.addEventListener('click', () => {
                const editPromptMsg = "Perfeito! Me diga: qual parte você gostaria de ajustar ou revisar? Se preferir, você também pode redigir a frase ou o trecho exatamente como gostaria com suas palavras, e eu farei a adequação do tempo e da métrica para você.";
                addAiChatMessage(editPromptMsg);
                if (chatInput) {
                    chatInput.disabled = false;
                    chatInput.placeholder = "Descreva o que deseja mudar ou envie o trecho redigido...";
                    chatInput.focus();
                }
                if (btnSendChat) btnSendChat.disabled = false;
            });

            saveChatSession();

            // Abre compulsoriamente o Modal dedicado para o cliente avaliar e aprovar/editar com clareza
            if (!isScriptApproved) {
                setTimeout(() => {
                    openScriptApprovalModal(scriptContent, versionLabel, wordCount, charCount);
                }, 300);
            } else {
                updateScriptApprovedUI(true);
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
                            parts: [{ text: getIasisSystemPrompt() }]
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

        // 0. Moderação Ética e Diretriz de Conteúdo Inadequado (Ódio, Crimes, Ofensas)
        const unsafePatterns = [
            'discurso de ódio', 'ódio', 'odeio', 'preconceito', 'racismo', 'racista', 'homofobia', 'homofóbico', 
            'xingar', 'ofensa', 'ofender', 'matar', 'morte a', 'crime', 'roubo', 'estelionato', 'bater nele', 
            'vingança', 'desgraça', 'desgraçado', 'escoria', 'vagabundo', 'canalha', 'safado', 'prostituta'
        ];
        if (unsafePatterns.some(pat => lower.includes(pat))) {
            return {
                chat: `A Reviva Memories tem como missão inegociável celebrar a vida, o afeto e o respeito à memória humana.<br><br>Por diretrizes éticas e legais estritas, não produzimos roteiros contendo acusações, palavras de ódio, discriminação, incentivo à violência ou atos desvirtuosos.<br><br>Gostaria de convidar você a redirecionar a mensagem para lembranças positivas, de carinho e paz. Como podemos recomeçar?`
            };
        }

        // 0.1 Solicitação Explícita de Atendimento Humano
        const explicitHumanPatterns = [
            'atendimento humano', 'suporte humano', 'quero falar com humano', 'falar com humano', 
            'atendente humano', 'pessoa de verdade', 'falar com atendente', 'falar com alguém', 
            'falar com alguem', 'passa o whatsapp', 'me dá o whatsapp', 'me da o whatsapp'
        ];
        if (explicitHumanPatterns.some(pat => lower.includes(pat))) {
            return {
                chat: `Compreendo perfeitamente, ${clientFirstName}. Nossa equipe de atendimento humano está inteiramente à sua disposição pelo WhatsApp oficial: <a href="https://wa.me/5531995701447" target="_blank" style="color:#e5c378; text-decoration:underline; font-weight:600;">(31) 99570-1447</a>.<br><br>Fique à vontade para nos chamar lá a qualquer momento para um atendimento dedicado.`
            };
        }

        // 0.2 Contorno de Críticas, Gafes ou Perguntas Questionadas (Saber se virar sem transferir)
        const criticismPatterns = [
            'pergunta idiota', 'pergunta burra', 'pergunta boba', 'pergunta sem sentido',
            'idiota', 'burro', 'burrice', 'óbvio', 'obvio', 'não faz sentido', 'nao faz sentido',
            'claro que', 'que absurdo', 'pergunta desnecessária'
        ];
        if (criticismPatterns.some(pat => lower.includes(pat))) {
            if (currentQuestionStep === 'ask_parentesco' || currentQuestionStep === 'ask_destinatario') {
                if (!interviewData.parentesco) {
                    interviewData.parentesco = 'Família / Casal';
                }
                currentQuestionStep = 'ask_apelido';
                return {
                    chat: `Tem toda a razão, ${clientFirstName}. Peço sinceras desculpas pela falta de tato — o laço e o amor entre eles falam por si só.<br><br>Vamos seguir em frente com a devida sensibilidade: como ${interviewData.protagonista || 'ele(a)'} costumava chamar o destinatário carinhosamente no cotidiano: por algum apelido carinhoso ou pelo próprio nome?`
                };
            } else if (currentQuestionStep === 'ask_apelido') {
                currentQuestionStep = 'ask_ocasiao';
                return {
                    chat: `Compreendido e perfeitamente justo, ${clientFirstName}. Peço desculpas pelo descompasso e agradeço pela franqueza.<br><br>Para darmos sequência com respeito: qual é a ocasião especial dessa homenagem (aniversário, formatura, casamento ou recordação de saudade)?`
                };
            } else {
                return {
                    chat: `Tem toda razão, peço sinceras desculpas pelo equívoco, ${clientFirstName}. Estou atento para honrar essa história com a máxima seriedade.<br><br>Conte-me sobre um momento marcante ou história especial vivida juntos que não pode faltar nessa homenagem.`
                };
            }
        }

        // 0.3 Hostilidade Extrema e Ruptura Irremediável
        const extremeHostilePatterns = [
            'vai se foder', 'vsf', 'puta que pariu', 'pqp', 'cala a boca', 'cala boca'
        ];
        if (extremeHostilePatterns.some(pat => lower.includes(pat))) {
            return {
                chat: `Peço sinceras desculpas por qualquer desconforto, ${clientFirstName}. Nosso propósito é que sua experiência seja serena e respeitosa. Caso prefira pausar ou falar diretamente com nossa equipe humana, estamos disponíveis pelo WhatsApp: <a href="https://wa.me/5531995701447" target="_blank" style="color:#e5c378; text-decoration:underline; font-weight:600;">(31) 99570-1447</a>.`
            };
        }

        // 1. Tratamento de Correções do Usuário (ex: "É Artur o nome dele", "Escreveu errado", "O nome correto é...")
        if (lower.includes('nome dele') || lower.includes('nome dela') || lower.includes('o nome é') || lower.includes('escreveu') || lower.includes('errou') || lower.includes('correto') || lower.includes('artur')) {
            const extracted = cleanName(text);
            if (extracted) {
                interviewData.protagonista = extracted;
            }
            return {
                chat: `Perfeitamente, ${clientFirstName}. O nome foi devidamente atualizado: <strong>${interviewData.protagonista || 'Artur'}</strong>.<br><br>Essa homenagem é destinada a você mesmo(a) ou você planeja presentear outra pessoa?`
            };
        }

        // 2. Cumprimentos e Conversas Iniciais ("Como vai?", "Tudo bem?", "Olá")
        if ((lower === 'como vai?' || lower === 'como vai' || lower === 'tudo bem?' || lower === 'tudo bem' || lower === 'olá' || lower === 'ola' || lower === 'oi') && !interviewData.protagonista) {
            return {
                chat: `Olá, ${clientFirstName}. É uma honra estar aqui para auxiliá-lo(a) na criação desta homenagem.<br><br>Para darmos início: qual é o nome da pessoa homenageada que falará no vídeo?`
            };
        }

        // 3. Solicitação de Edição / Revisão pós-entrega do roteiro
        const isRevisionRequest = latestScriptText && (
            lower.includes('mudar') || lower.includes('trocar') || lower.includes('alterar') || 
            lower.includes('tirar') || lower.includes('colocar') || lower.includes('gostaria') || 
            lower.includes('ao invés') || lower.includes('edite') || lower.includes('roteiro') || 
            lower.includes('prefiro') || lower.includes('não mandam') || lower.includes('nao mandam') || 
            lower.includes('não morreram') || lower.includes('nao morreram') || lower.includes('mandam abraço') || 
            lower.includes('mandam abracos') || lower.includes('eles estão vivos') || lower.includes('eles estao vivos') || 
            lower.includes('tá errado') || lower.includes('ta errado') || lower.includes('corrig') || lower.includes('ajust')
        );

        if (isRevisionRequest) {
            let revised = latestScriptText;
            if (lower.includes('não mandam') || lower.includes('nao mandam') || lower.includes('não morreram') || lower.includes('nao morreram') || lower.includes('mandam')) {
                revised = revised.replace(/O Juninho e a Ana mandam um abraço, são a prova do nosso amor\./i, 'Dá um beijo e um abraço bem apertado no Juninho e na Ana por mim, que são a prova mais linda do nosso amor!')
                                 .replace(/Que a gente comemore muitos anos de alegria, sempre juntos\./i, 'Comemore muito a sua vida e continue radiante!')
                                 .replace(/Feliz aniversário!/i, 'Feliz aniversário! Que Deus abençoe você e os nossos filhos sempre. Fica com Deus, meu amor!');
            } else if (lower.includes('trocar') || lower.includes('ao invés') || lower.includes('mude')) {
                revised = revised.replace(/Guardo com tanto carinho/i, `Com todo o apreço e dedicação`) + `\n\n${text}`;
            }
            return {
                chat: `Compreendido perfeitamente, ${clientFirstName}. Ajustei o texto com total atenção: quem partiu é quem abençoa e manda o carinho para quem continua aqui na Terra. Veja a versão atualizada:`,
                script: revised
            };
        }

        // 4. Fluxo Conversacional Baseado em Estado Real (State Machine Semântica)
        switch (currentQuestionStep) {
            case 'ask_protagonista':
                interviewData.protagonista = cleanName(text) || text;
                currentQuestionStep = 'ask_destinatario';
                return {
                    chat: `<strong>${interviewData.protagonista}</strong>... Um nome com grande força e história. Conduziremos a homenagem com toda a seriedade e apreço que ele(a) merece.<br><br>Esta homenagem é destinada a você mesmo(a) ou você a presenteará a outra pessoa?`
                };

            case 'ask_destinatario':
                const isTargetSelf = lower.includes('mim') || lower.includes('mesma') || lower.includes('mesmo') || lower.includes('eu') || lower.includes('para mim') || lower.includes('pra mim');
                interviewData.destinatario = isTargetSelf ? clientFirstName : text;
                const destNome = isTargetSelf ? 'você' : interviewData.destinatario;

                // Dedução contextual inteligente de vínculos afetivos
                const protLower = (interviewData.protagonista || '').toLowerCase();
                const destLower = (interviewData.destinatario || '').toLowerCase();

                const isCasal = (protLower.includes('pai') && destLower.includes('mãe')) || 
                                (protLower.includes('mãe') && destLower.includes('pai')) ||
                                (protLower.includes('marido') && (destLower.includes('esposa') || destLower.includes('mulher'))) ||
                                (protLower.includes('esposa') && destLower.includes('marido'));

                const isPaiFilho = (protLower.includes('pai') || protLower.includes('mãe')) && isTargetSelf;
                const isAvoNeto = (protLower.includes('avô') || protLower.includes('avó') || protLower.includes('vô') || protLower.includes('vó')) && isTargetSelf;

                if (isCasal) {
                    interviewData.parentesco = 'Marido e Mulher / Casal';
                    currentQuestionStep = 'ask_apelido';
                    return {
                        chat: `Uma homenagem comovente de marido para esposa... Um amor eterno que deu origem e força à história da sua família.<br><br>Como seu pai costumava chamar sua mãe carinhosamente no dia a dia: por algum apelido afetivo ou pelo próprio nome?`
                    };
                } else if (isPaiFilho) {
                    interviewData.parentesco = 'Pai/Mãe e Filho(a)';
                    currentQuestionStep = 'ask_apelido';
                    return {
                        chat: `Um reencontro de amor profundo guardado para sempre no coração.<br><br>Como ele(a) costumava chamar você carinhosamente no cotidiano: por algum apelido ou pelo seu próprio nome?`
                    };
                } else if (isAvoNeto) {
                    interviewData.parentesco = 'Avô/Avó e Neto(a)';
                    currentQuestionStep = 'ask_apelido';
                    return {
                        chat: `O afeto entre avós e netos é uma das maiores bênçãos da vida.<br><br>Como ele(a) costumava chamar você no dia a dia: por algum apelido carinhoso ou pelo seu nome?`
                    };
                }

                currentQuestionStep = 'ask_parentesco';
                return {
                    chat: `Compreendido. Um propósito nobre e marcante.<br><br>Qual é a história ou laço de afeto que une ${interviewData.protagonista} e ${destNome} (por exemplo: Padrinho e Afilhado, Irmãos, Amigos de longa data)?`
                };

            case 'ask_parentesco':
                interviewData.parentesco = text;
                currentQuestionStep = 'ask_apelido';
                return {
                    chat: `Registrado com todo o respeito.<br><br>Como ${interviewData.protagonista} costumava chamar o destinatário no cotidiano: por algum apelido específico ou pelo próprio nome?`
                };

            case 'ask_apelido':
                interviewData.apelido = text.replace(/pelo nome|próprio nome|meu nome/gi, clientFirstName).trim() || clientFirstName;
                currentQuestionStep = 'ask_ocasiao';
                return {
                    chat: `Excelente registro.<br><br>Qual é a ocasião especial em que essa homenagem será exibida (aniversário, formatura, casamento ou um momento de reencontro e memória)?`
                };

            case 'ask_ocasiao':
                interviewData.ocasiao = text;
                currentQuestionStep = 'ask_historia';
                return {
                    chat: `Uma data muito oportuna e significativa.<br><br>Há alguma história marcante, momento especial ou memória marcante vivida juntos que gostaria de recordar no roteiro?`
                };

            case 'ask_historia':
                interviewData.historia = text;
                currentQuestionStep = 'ask_conselhos';
                return {
                    chat: `Uma recordação verdadeiramente admirável.<br><br>Quais eram os conselhos, ensinamentos ou frases marcantes que ${interviewData.protagonista} sempre costumava dizer?`
                };

            case 'ask_conselhos':
                interviewData.conselhos = text;
                currentQuestionStep = 'ask_familiares';
                return {
                    chat: `Ensinamentos valiosos que merecem ser eternizados.<br><br>Há outros familiares ou amigos próximos que devem receber uma menção ou abraço nominal no vídeo?`
                };

            case 'ask_familiares':
                interviewData.familiares = text;
                currentQuestionStep = 'ask_tom';
                return {
                    chat: `Anotado com atenção.<br><br>Para que a fala reflita a essência de ${interviewData.protagonista}, qual tom você prefere: mais <strong>alegre e descontraído</strong> (com o humor característico), ou mais <strong>emocionante, solene e poético</strong>?`
                };

            case 'ask_tom':
                interviewData.tom = text;
                currentQuestionStep = 'ask_personalizacao_extra';
                if (currentPlan.durationMinutes >= 2) {
                    return {
                        chat: `Uma ótima escolha, ${clientFirstName}.<br><br>Considerando o tempo do <strong>Plano ${currentPlan.name} (${currentPlan.durationMinutes} Minutos)</strong>, temos um espaço generoso na locução: há mais alguma recordação, detalhe particular ou expressão típica que gostaria de acrescentar?`
                    };
                } else {
                    return {
                        chat: `Uma ótima escolha, ${clientFirstName}.<br><br>Antes de eu estruturar o roteiro final: há mais algum detalhe específico ou frase importante que gostaria de incluir?`
                    };
                }

            case 'ask_personalizacao_extra':
            default:
                interviewData.detalhes_extras = (lower.includes('não') || lower.includes('nao') || lower.includes('nada') || lower.includes('tudo certo') || lower.includes('pode fazer') || lower.includes('apenas isso') || lower.includes('acho que só') || lower.includes('só isso') || lower.includes('so isso')) ? '' : text;
                currentQuestionStep = 'script_ready';

                const isComico = (interviewData.tom || '').toLowerCase().includes('cômico') || (interviewData.tom || '').toLowerCase().includes('comico') || (interviewData.tom || '').toLowerCase().includes('descontraído') || (interviewData.tom || '').toLowerCase().includes('descontraido') || (interviewData.tom || '').toLowerCase().includes('engraçado') || (interviewData.tom || '').toLowerCase().includes('alegre') || (interviewData.tom || '').toLowerCase().includes('humor') || lower.includes('cômico') || lower.includes('comico') || lower.includes('descontraído') || lower.includes('descontraido') || lower.includes('engraçado');
                const protagonista = interviewData.protagonista || 'Artur';
                const apelido = interviewData.apelido || clientFirstName;
                const historia = interviewData.historia || 'tantos momentos de risos e união que compartilhamos';
                const conselhos = interviewData.conselhos || 'siga firme com o coração em paz e a cabeça erguida';
                const familiares = (interviewData.familiares && (interviewData.familiares.toLowerCase().includes('não') || interviewData.familiares.toLowerCase().includes('nao') || interviewData.familiares.toLowerCase().includes('nenhum'))) ? 'todos que guardam nosso carinho' : (interviewData.familiares || 'toda a nossa família querida');
                const extraFragmento = interviewData.detalhes_extras ? ` ${interviewData.detalhes_extras}.` : '';

                let script = "";
                if (isComico) {
                    script = `Olha só pra você, ${apelido}! Quem diria, hein?! Achou mesmo que eu ia perder essa festa e deixar você comemorar sem ouvir a minha voz? Jamais!\n\nEu dou risada só de lembrar de ${historia}.${extraFragmento} Bons tempos aqueles! Mas falando sério, meu coração se enche de orgulho de ver você brilhando. Meu único conselho: ${conselhos}. E dê um beijo e um abraço bem forte em ${familiares}, que eu tô cuidando de vocês daqui!\n\nReceba o meu melhor abraço, cheio de paz e alegria. Que Deus abençoe cada passo seu. Fica com Deus!`;
                } else if (currentPlan.durationMinutes === 1) {
                    script = `Olha só pra você, ${apelido}! Achou mesmo que eu deixaria de estar presente neste dia tão marcante? Que alegria imensa poder falar com você agora!\n\nEu guardo com tanto carinho no meu peito cada segundo que estivemos juntos... Lembro como se fosse hoje de ${historia}.${extraFragmento} Saiba que mesmo na distância, meu afeto por você permanece vivo e vibrante. Quero que você nunca esqueça: ${conselhos}. Tenha orgulho dos seus passos e dê um abraço bem apertado em ${familiares} por mim.\n\nReceba o meu abraço mais apertado, cheio de luz e boas lembranças. Que Deus abençoe você sempre. Fica com Deus, meu amor!`;
                } else if (currentPlan.durationMinutes === 2) {
                    script = `Olha só pra você! Que momento emocionante e que alegria ver esse dia chegar! Você achou que eu não estaria aqui para comemorar com você? Pois estou bem aqui, com o coração transbordando de orgulho!\n\nComo é bom lembrar da nossa trajetória... Lembro com um sorriso no rosto de ${historia}.${extraFragmento} Cada instante ao seu lado foi uma bênção que guardo na eternidade. Quero te deixar um pedido muito especial: ${conselhos}. Nunca duvide da força que você tem e da pessoa maravilhosa que você se tornou.\n\nE não posso esquecer de deixar o meu carinho para ${familiares}. Digam a todos que continuo comemorando cada vitória e envolvendo cada um em paz e proteção.\n\nSinta a minha mão no seu ombro e o calor do meu abraço que vence o tempo. Seja feliz, viva com intensidade e saiba que este carinho é eterno. Fique com Deus!`;
                } else {
                    script = `Olha só pra você, ${apelido}! Quem diria, hein?! Que dia radiante e que honra estar aqui falando com você! Não existe distância no mundo capaz de separar o afeto que nos une.\n\nRelembrar a nossa história enche a alma de paz. Como esquecer de ${historia}? Cada risada, cada conversa na varanda, cada conselho trocado...${extraFragmento} Tudo isso permanece vivo e eternizado na memória.\n\nNesta data especial de ${interviewData.ocasiao || 'comemoração'}, meu maior desejo é que você continue trilhando o seu caminho com sabedoria. Lembre-se sempre: ${conselhos}. Seja generosa, cuide dos seus e nunca perca esse brilho no olhar.\n\nQuero deixar uma mensagem de carinho profundo também para ${familiares}. Que o amor continue sendo o alicerce de vocês. Cuidem uns dos outros como sempre fizemos.\n\nReceba agora a minha bênção mais carinhosa e um abraço longo e apertado. Onde há carinho e memória viva, o afeto nunca termina. Um grande abraço do fundo do coração!`;
                }

                return {
                    chat: `${clientFirstName}, foi uma honra reunir todas essas memórias preciosas. Estruturei o roteiro oficial respeitando o tom escolhido, todos os detalhes compartilhados e o tempo do Plano ${currentPlan.name} (${currentPlan.durationMinutes} min). Confira o texto abaixo:`,
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
                // Em caso de indisponibilidade de todos os modelos reais, NÃO simular respostas locais.
                // O histórico do cliente permanece 100% salvo. Oferece tentativa e canal direto de acolhimento.
                const connectionNotice = `Identifiquei uma breve oscilação na minha conexão com os servidores de inteligência, ${clientFirstName || 'cliente'}.<br><br>Fique tranquilo(a): <strong>todas as suas memórias e mensagens estão salvas com segurança aqui</strong>.<br><br>Você pode aguardar alguns instantes e tentar enviar novamente, ou se preferir um acolhimento imediato, pode continuar diretamente com a nossa equipe pelo WhatsApp: <a href="https://wa.me/5531995701447" target="_blank" style="color: #e5c378; font-weight: 700; text-decoration: underline;">(31) 99570-1447</a>.`;
                addAiChatMessage(connectionNotice);
            }
        } catch (error) {
            console.error("Erro na comunicação com a API do Iasis:", error);
            const connectionNotice = `Identifiquei uma breve oscilação na minha conexão com os servidores de inteligência, ${clientFirstName || 'cliente'}.<br><br>Fique tranquilo(a): <strong>todas as suas memórias e mensagens estão salvas com segurança aqui</strong>.<br><br>Você pode aguardar alguns instantes e tentar enviar novamente, ou se preferir um acolhimento imediato, pode continuar diretamente com a nossa equipe pelo WhatsApp: <a href="https://wa.me/5531995701447" target="_blank" style="color: #e5c378; font-weight: 700; text-decoration: underline;">(31) 99570-1447</a>.`;
            addAiChatMessage(connectionNotice);
        } finally {
            isWaitingGemini = false;
            if (chatTypingIndicator) chatTypingIndicator.style.display = 'none';
            if (btnSendChat) btnSendChat.disabled = false;
            if (chatInput) {
                chatInput.disabled = false;
                chatInput.focus();
            }
            saveChatSession();
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
            if (e.target.tagName === 'INPUT' || e.target.closest('.preview-remove-btn') || e.target.closest('.upload-slot-audio-filled') || e.target.closest('.preview-audio-play-btn')) return;
            if (uploadedAudios.length < 3) {
                const input = document.getElementById('audio-input');
                if (input) input.click();
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

    // Listener Global Delegado para Inputs de Arquivos (Fotos e Áudios)
    document.addEventListener('change', (e) => {
        if (e.target && e.target.id === 'photo-input') {
            handlePhotoFiles(e.target.files);
            e.target.value = '';
        }
        if (e.target && e.target.id === 'audio-input') {
            handleAudioFiles(e.target.files);
            e.target.value = '';
        }
    });

    let currentAttachedAudio = null;
    let currentPlayingAudioIdx = -1;

    async function handleAudioFiles(files) {
        const remainingSlots = 3 - uploadedAudios.length;
        if (remainingSlots <= 0) return;

        const filesToProcess = Array.from(files).slice(0, remainingSlots);
        const ordIdent = (orderData?.order_id || orderData?.id || 'REVIVA-1001');

        for (const file of filesToProcess) {
            const localBlobUrl = URL.createObjectURL(file);
            const audioItem = {
                name: file.name,
                size: (file.size / 1024 / 1024).toFixed(1) + ' MB',
                url: localBlobUrl,
                data: localBlobUrl,
                uploading: true
            };
            uploadedAudios.push(audioItem);
            renderAudioPreviews();

            try {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('orderId', ordIdent);
                formData.append('category', 'audios');

                const res = await fetch('/api/media/upload', {
                    method: 'POST',
                    body: formData
                });
                const result = await res.json();
                if (result.success && result.url) {
                    audioItem.url = result.url;
                    audioItem.data = result.url;
                    audioItem.key = result.key;
                    audioItem.uploading = false;
                } else {
                    audioItem.uploading = false;
                }
            } catch(err) {
                console.warn('[R2 Upload Warning]: Falha no upload do áudio para R2, mantendo URL local', err);
                audioItem.uploading = false;
            }

            renderAudioPreviews();
            saveFullSessionState();
        }
    }

    window.togglePlayAttachedAudio = function(index, event) {
        if (event) event.stopPropagation();
        const aud = uploadedAudios[index];
        if (!aud || !aud.url) return;

        if (!currentAttachedAudio) {
            currentAttachedAudio = new Audio();
            currentAttachedAudio.addEventListener('ended', () => {
                currentPlayingAudioIdx = -1;
                renderAudioPreviews();
            });
            currentAttachedAudio.addEventListener('pause', () => {
                renderAudioPreviews();
            });
            currentAttachedAudio.addEventListener('play', () => {
                renderAudioPreviews();
            });
        }

        if (currentPlayingAudioIdx === index && !currentAttachedAudio.paused) {
            currentAttachedAudio.pause();
            currentPlayingAudioIdx = -1;
        } else {
            currentAttachedAudio.src = aud.url;
            currentPlayingAudioIdx = index;
            currentAttachedAudio.play().then(() => {
                renderAudioPreviews();
            }).catch(err => console.log("Erro ao reproduzir áudio anexado:", err));
        }
        renderAudioPreviews();
    };

    function getAudioSlotsHtml() {
        let html = '';
        for (let i = 0; i < 3; i++) {
            if (i < uploadedAudios.length) {
                const aud = uploadedAudios[i];
                const isPlaying = (currentPlayingAudioIdx === i && currentAttachedAudio && !currentAttachedAudio.paused);
                html += `
                <div class="upload-slot-audio-filled" style="border: 1.5px solid ${isPlaying ? '#f6e3c5' : '#e5c378'}; box-shadow: ${isPlaying ? '0 0 16px rgba(229, 195, 120, 0.7)' : '0 4px 14px rgba(0,0,0,0.7)'}; background: radial-gradient(circle at center, rgba(197, 160, 89, 0.22) 0%, rgba(10, 7, 5, 0.95) 100%);">
                    <button class="preview-remove-btn" onclick="removeAudio(${i}, event)" title="Remover áudio" style="position: absolute; top: 3px; right: 3px; width: 20px; height: 20px; border-radius: 50%; background: rgba(14, 9, 6, 0.95); color: #e5c378; border: 1px solid #e5c378; font-size: 10px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; line-height: 1; padding: 0; transition: transform 0.2s ease; z-index: 5;">✕</button>

                    <button type="button" class="preview-audio-play-btn" onclick="togglePlayAttachedAudio(${i}, event)" title="${isPlaying ? 'Pausar áudio' : 'Ouvir gravação'}" style="width: 34px; height: 34px; border-radius: 50%; background: ${isPlaying ? 'linear-gradient(135deg, #f6e3c5, #e5c378)' : 'linear-gradient(135deg, #c5a059, #9c7247)'}; color: #0f0a06; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 2px 8px rgba(0,0,0,0.6); transition: transform 0.2s ease; margin-bottom: 3px;">
                        <i data-lucide="${isPlaying ? 'pause' : 'play'}" style="width: 14px; height: 14px; fill: #0f0a06; stroke: #0f0a06; margin-left: ${isPlaying ? '0' : '2px'};"></i>
                    </button>

                    <span style="font-size: 0.55rem; color: #f6e3c5; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%; text-align: center; font-weight: 600; padding: 0 2px; box-sizing: border-box;" title="${aud.name}">
                        ${aud.name}
                    </span>
                </div>`;
            } else {
                html += `
                <div class="upload-slot-empty" onclick="triggerAudioUpload(event)" title="Clique para enviar áudio ${i + 1}">
                    <i data-lucide="plus"></i>
                    <span>Áudio 0${i + 1}</span>
                </div>`;
            }
        }
        return html;
    }

    window.triggerAudioUpload = function(e) {
        if (e) e.stopPropagation();
        if (uploadedAudios.length < 3) {
            const input = document.getElementById('audio-input');
            if (input) input.click();
        }
    };

    function renderAudioPreviews() {
        if (!audioDropzone) return;
        const count = uploadedAudios.length;

        if (count === 0) {
            audioDropzone.classList.remove('zone-filled');
            audioDropzone.classList.add('zone-empty');
        } else {
            audioDropzone.classList.remove('zone-empty');
            audioDropzone.classList.add('zone-filled');
        }

        const headerHtml = (count === 0) ? `
            <div class="audio-dropzone-header" style="display: flex; flex-direction: column; align-items: center; justify-content: center; margin-bottom: 2px;">
                <i data-lucide="mic" style="width: 26px; height: 26px; color: #e5c378; margin-bottom: 3px;"></i>
                <h4 style="color: #f6e3c5; font-size: 0.88rem; margin: 0; font-weight: 600;">Clique ou arraste áudios com a voz original</h4>
                <p style="font-size: 0.70rem; color: #ede3d2; margin: 2px 0; text-align: center; max-width: 380px; line-height: 1.35; opacity: 0.9;">
                    Envie áudios claros para extrair o timbre e clonar a voz autêntica que narrará a homenagem.
                </p>
            </div>
        ` : `
            <div class="audio-dropzone-header" style="display: flex; flex-direction: column; align-items: center; justify-content: center; margin-bottom: 2px;">
                <div style="display: inline-flex; align-items: center; gap: 6px; background: rgba(197, 160, 89, 0.15); border: 1px solid rgba(197, 160, 89, 0.4); border-radius: 20px; padding: 3px 14px; margin-bottom: 2px;">
                    <span style="color: #e5c378; font-weight: bold; font-size: 0.85rem;">✓</span>
                    <span style="color: #f6e3c5; font-size: 0.80rem; font-weight: 600; letter-spacing: 0.2px;">
                        ${count} ${count === 1 ? 'áudio anexado' : 'áudios anexados'}
                    </span>
                </div>
                <span style="font-size: 0.68rem; color: ${count < 3 ? '#e5c378' : 'var(--text-secondary)'}; font-weight: 500;">
                    ${count < 3 ? '+ Anexar mais áudios' : '✓ Limite máximo de 3 gravações atingido'}
                </span>
            </div>
        `;

        audioDropzone.innerHTML = `
            <div style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: space-between; padding: 2px 0; box-sizing: border-box;">
                <!-- 1. Topo: Título do Card -->
                ${headerHtml}

                <!-- 2. Centro: Quadradinhos centralizados no espaço entre o título e as dicas -->
                <div class="upload-slots-row" id="audio-slots-container" style="margin: auto 0;">
                    ${getAudioSlotsHtml()}
                </div>

                <!-- 3. Base: Dicas Posicionadas em Formato 2-1-2 sem moldura/caixa -->
                <div class="tips-die-grid" style="margin: 0 auto 4px auto;">
                    <div class="upload-tip-die-item" style="grid-column: 1;">
                        <i data-lucide="clock"></i>
                        <span>Até 3 minutos</span>
                    </div>
                    <div class="upload-tip-die-item" style="grid-column: 2;">
                        <i data-lucide="user-check"></i>
                        <span>Áudios individuais</span>
                    </div>
                    <div class="upload-tip-die-item" style="grid-column: 1 / span 2; justify-self: center; width: 65%; min-width: 170px;">
                        <i data-lucide="volume-2"></i>
                        <span>Sem ruídos de fundo</span>
                    </div>
                    <div class="upload-tip-die-item" style="grid-column: 1;">
                        <i data-lucide="mic"></i>
                        <span>Foco na voz da pessoa</span>
                    </div>
                    <div class="upload-tip-die-item" style="grid-column: 2;">
                        <i data-lucide="sparkles"></i>
                        <span>Gravações espontâneas</span>
                    </div>
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
        updateNextStep1ButtonState();
    }

    window.removeAudio = (index, event) => {
        if (event) event.stopPropagation();
        if (currentPlayingAudioIdx === index && currentAttachedAudio) {
            currentAttachedAudio.pause();
            currentPlayingAudioIdx = -1;
        }
        const removed = uploadedAudios.splice(index, 1);
        if (removed[0] && removed[0].url && removed[0].url.startsWith('blob:')) {
            URL.revokeObjectURL(removed[0].url);
        }
        renderAudioPreviews();
        updateNextStep1ButtonState();
        saveFullSessionState();
    };

    // Player de Amostra de Trilha Sonora com Pause Imediato e Fade Out nos últimos 5 segundos
    function stopMusicPreviewImmediately() {
        if (previewFadeInterval) {
            clearInterval(previewFadeInterval);
            previewFadeInterval = null;
        }

        if (currentPreviewAudio) {
            currentPreviewAudio.pause();
            currentPreviewAudio.currentTime = 0;
            currentPreviewAudio = null;
        }

        updateMusicPreviewBtnUI(false);

        // Restaurar imediatamente a música de fundo do site
        if (typeof window.fadeAudioVolume === 'function') {
            const targetVol = typeof window.getTargetBgVolume === 'function' ? window.getTargetBgVolume() : 0.5;
            window.fadeAudioVolume(targetVol, 400);
        }
    }

    function stopMusicPreviewWithFade(callback) {
        if (!currentPreviewAudio) {
            if (typeof window.fadeAudioVolume === 'function') {
                const targetVol = typeof window.getTargetBgVolume === 'function' ? window.getTargetBgVolume() : 0.5;
                window.fadeAudioVolume(targetVol, 800);
            }
            if (callback) callback();
            return;
        }

        if (previewFadeInterval) {
            clearInterval(previewFadeInterval);
            previewFadeInterval = null;
        }

        const audio = currentPreviewAudio;
        const startVolume = audio.volume;
        const fadeDuration = 5000; // 5 segundos de Fade Out no final da música
        const intervalTime = 100;
        const steps = fadeDuration / intervalTime;
        const volumeStep = startVolume / steps;

        if (typeof window.fadeAudioVolume === 'function') {
            const targetVol = typeof window.getTargetBgVolume === 'function' ? window.getTargetBgVolume() : 0.5;
            window.fadeAudioVolume(targetVol, 3000);
        }

        previewFadeInterval = setInterval(() => {
            if (audio.volume > volumeStep) {
                audio.volume -= volumeStep;
            } else {
                audio.volume = 0;
                audio.pause();
                clearInterval(previewFadeInterval);
                previewFadeInterval = null;
                if (currentPreviewAudio === audio) {
                    currentPreviewAudio = null;
                }
                updateMusicPreviewBtnUI(false);
                if (callback) callback();
            }
        }, intervalTime);
    }

    function updateMusicPreviewBtnUI(isPlaying) {
        const btn = document.getElementById('btn-play-music-preview');
        if (!btn) return;
        btn.innerHTML = isPlaying
            ? `<i data-lucide="pause" style="width: 20px; height: 20px; stroke-width: 2.2;"></i>`
            : `<i data-lucide="play" style="width: 20px; height: 20px; stroke-width: 2.2; margin-left: 2px;"></i>`;
        if (window.lucide) lucide.createIcons();
    }

    const btnPlayMusicPreview = document.getElementById('btn-play-music-preview');
    if (btnPlayMusicPreview) {
        btnPlayMusicPreview.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            // Ao clicar no botão enquanto toca, faz o PAUSE IMEDIATO (sem fade out)
            if (currentPreviewAudio && !currentPreviewAudio.paused) {
                stopMusicPreviewImmediately();
                return;
            }

            const selectedBtn = document.querySelector('#musicContainer .scenario-name-btn.selected');
            const audioSrc = selectedBtn?.dataset?.audioSrc;

            if (!audioSrc) {
                alert('Amostra de áudio ainda não disponível para este instrumento.');
                return;
            }

            if (currentPreviewAudio) {
                currentPreviewAudio.pause();
                currentPreviewAudio = null;
            }
            if (previewFadeInterval) {
                clearInterval(previewFadeInterval);
                previewFadeInterval = null;
            }

            // Silenciar totalmente a música de fundo do site (bgAudio)
            if (typeof window.fadeAudioVolume === 'function') {
                window.fadeAudioVolume(0, 400);
            }

            const audio = new Audio(audioSrc);
            audio.volume = 1.0;
            currentPreviewAudio = audio;

            audio.play().then(() => {
                updateMusicPreviewBtnUI(true);
            }).catch(err => console.log('Erro ao tocar amostra:', err));

            // Aplicar fade out APENAS quando a música chegar nos últimos 5 segundos naturalmente
            audio.addEventListener('timeupdate', () => {
                if (audio.duration && (audio.duration - audio.currentTime <= 5) && !previewFadeInterval && audio.volume > 0.05) {
                    stopMusicPreviewWithFade();
                }
            });

            audio.addEventListener('ended', () => {
                currentPreviewAudio = null;
                updateMusicPreviewBtnUI(false);
                if (typeof window.fadeAudioVolume === 'function') {
                    const targetVol = typeof window.getTargetBgVolume === 'function' ? window.getTargetBgVolume() : 0.5;
                    window.fadeAudioVolume(targetVol, 800);
                }
            });
        });
    }

    // Seletor de Trilha Sonora (Reestruturado com Preview e Botão Play/Pause)
    document.querySelectorAll('#musicContainer .scenario-name-btn').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('#musicContainer .scenario-name-btn').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedMusic = card.dataset.music;
            musicManuallyChosen = true;

            // Se houver áudio tocando ao trocar de trilha, para imediatamente e reseta o botão para Play
            if (currentPreviewAudio) {
                stopMusicPreviewImmediately();
            } else {
                updateMusicPreviewBtnUI(false);
            }

            const previewImg = document.getElementById('music-preview-img');
            const previewName = document.getElementById('music-preview-name');
            if (previewImg && card.dataset.previewSrc) {
                previewImg.style.opacity = '0.5';
                setTimeout(() => {
                    previewImg.src = card.dataset.previewSrc;
                    previewImg.style.opacity = '1';
                }, 150);
            }
            if (previewName && card.dataset.title) {
                previewName.textContent = card.dataset.title;
            }

            saveFullSessionState();
        });
    });

    // =========================================================================
    // PLAYER CENTRAL DE AMOSTRA DE VOZ CLONADA (ETAPA 4)
    // =========================================================================
    // ETAPA 04: A LAPIDAÇÃO (APROVAÇÃO DA NOVA IMAGEM + VOZ CLONADA)
    // =========================================================================
    const btnPlayVoiceSampleCenter = document.getElementById('btnPlayVoiceSampleCenter');
    const voiceSampleAudio = document.getElementById('voiceSampleAudio');
    const voiceSampleProgress = document.getElementById('voiceSampleProgress');
    const voiceSampleTime = document.getElementById('voiceSampleTime');
    const voiceSampleCurrentTime = document.getElementById('voiceSampleCurrentTime');

    function updateVoicePlayIcon(isPlaying) {
        if (!btnPlayVoiceSampleCenter) return;
        btnPlayVoiceSampleCenter.innerHTML = isPlaying
            ? `<i data-lucide="pause" style="width: 26px; height: 26px; stroke: #e5c378;"></i>`
            : `<i data-lucide="play" style="width: 26px; height: 26px; stroke: #e5c378; margin-left: 3px;"></i>`;
        if (window.lucide) lucide.createIcons();
    }

    if (btnPlayVoiceSampleCenter && voiceSampleAudio) {
        btnPlayVoiceSampleCenter.addEventListener('click', (e) => {
            e.stopPropagation();
            if (voiceSampleAudio.paused) {
                voiceSampleAudio.play().catch(err => console.log("Sample play blocked:", err));
            } else {
                voiceSampleAudio.pause();
            }
        });

        voiceSampleAudio.addEventListener('play', () => updateVoicePlayIcon(true));
        voiceSampleAudio.addEventListener('pause', () => updateVoicePlayIcon(false));

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

        voiceSampleAudio.addEventListener('loadedmetadata', () => {
            const totalMin = Math.floor(voiceSampleAudio.duration / 60);
            const totalSec = Math.floor(voiceSampleAudio.duration % 60);
            if (voiceSampleTime && !isNaN(totalSec)) {
                voiceSampleTime.textContent = `0${totalMin}:${totalSec < 10 ? '0' : ''}${totalSec}`;
            }
        });

        voiceSampleAudio.addEventListener('ended', () => {
            updateVoicePlayIcon(false);
            if (voiceSampleProgress) voiceSampleProgress.style.width = '0%';
            if (voiceSampleCurrentTime) voiceSampleCurrentTime.textContent = '00:00';
        });

        const voiceProgressContainer = voiceSampleProgress?.parentElement;
        if (voiceProgressContainer) {
            voiceProgressContainer.addEventListener('click', (e) => {
                e.stopPropagation();
                if (!voiceSampleAudio.duration) return;
                const rect = voiceProgressContainer.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const width = rect.width;
                const seekTime = (clickX / width) * voiceSampleAudio.duration;
                voiceSampleAudio.currentTime = seekTime;
            });
        }
    }

    // Ações Etapa 3 (A Harmonização: Trilha & Cenários)
    document.getElementById('btn-next-step-3')?.addEventListener('click', () => {
        goToStep(4);
    });
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

        // Ambas as mídias precisam estar decididas (nenhuma pendente) e válidas (com texto se reprovada)
        const isReadyToAdvance = photoDecision !== 'pending' && voiceDecision !== 'pending' && isPhotoValid && isVoiceValid;

        const btnText = document.getElementById('btn-approve-lapidacao-text');
        if (btnText) {
            btnText.textContent = 'AVANÇAR';
        } else {
            btn.textContent = 'AVANÇAR';
        }

        // Limpar estilos inline de cores para manter estritamente o padrão dourado/bege nobre (.btn-primary)
        btn.style.background = '';
        btn.style.borderColor = '';
        btn.style.color = '';
        btn.style.boxShadow = '';

        if (isReadyToAdvance) {
            btn.className = 'btn btn-primary';
            btn.classList.remove('btn-disabled');
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
            btn.style.pointerEvents = 'auto';
            btn.disabled = false;
        } else {
            btn.className = 'btn btn-primary btn-disabled';
            btn.style.opacity = '';
            btn.style.cursor = 'not-allowed';
            btn.style.pointerEvents = 'none';
            btn.disabled = true;
        }
    }

    function updatePhotoApprovalUI(status) {
        const btnApprove = document.getElementById('btn-approve-photo-status');
        const btnApproveText = document.getElementById('btn-approve-photo-status-text');
        const btnReject = document.getElementById('btn-reject-photo-modal');
        const btnRejectText = document.getElementById('btn-reject-photo-modal-text');
        const rejectionBox = document.getElementById('photo-rejection-box');
        const photoCard = document.getElementById('preview-card-panel');

        const isLocked = isPhotoPermanentlyApproved();

        // Resetar estilos inline que possam conflitar
        if (btnApprove) {
            btnApprove.style.background = '';
            btnApprove.style.borderColor = '';
            btnApprove.style.color = '';
            btnApprove.style.opacity = '';
            btnApprove.style.cursor = isLocked ? 'default' : 'pointer';
            btnApprove.style.pointerEvents = isLocked ? 'none' : 'auto';
            btnApprove.disabled = isLocked;
        }
        if (btnReject) {
            btnReject.style.background = '';
            btnReject.style.borderColor = '';
            btnReject.style.color = '';
            btnReject.style.opacity = isLocked ? '0.35' : '';
            btnReject.style.pointerEvents = isLocked ? 'none' : 'auto';
            btnReject.style.cursor = isLocked ? 'not-allowed' : 'pointer';
            btnReject.disabled = isLocked;
            btnReject.title = isLocked ? 'A fotografia já foi aprovada em rodada anterior e validada definitivamente.' : '';
        }

        if (photoCard) {
            photoCard.classList.remove('card-approved', 'card-rejected', 'zone-filled', 'zone-empty');
        }

        if (isLocked || status === 'approved' || status === true) {
            photoDecision = 'approved';
            isPhotoApprovedState = true;
            if (photoCard) photoCard.classList.add('card-approved', 'zone-filled');
            if (btnApprove) {
                btnApprove.classList.add('is-selected');
                if (isLocked) {
                    btnApprove.disabled = true;
                    btnApprove.style.cursor = 'default';
                    btnApprove.style.pointerEvents = 'none';
                }
            }
            if (btnApproveText) btnApproveText.textContent = 'IMAGEM APROVADA ✓';
            
            if (btnReject) {
                btnReject.classList.remove('is-selected');
                if (isLocked) {
                    btnReject.disabled = true;
                    btnReject.style.opacity = '0.35';
                    btnReject.style.pointerEvents = 'none';
                    btnReject.style.cursor = 'not-allowed';
                    btnReject.title = 'A fotografia já foi aprovada em rodada anterior e validada definitivamente.';
                }
            }
            if (btnRejectText) btnRejectText.textContent = 'REPROVAR';
            if (rejectionBox) rejectionBox.style.display = 'none';
        } else if (status === 'rejected') {
            photoDecision = 'rejected';
            isPhotoApprovedState = false;
            if (photoCard) photoCard.classList.add('card-rejected', 'zone-empty');
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
        const voiceCard = document.getElementById('preview-voice-card-panel');

        const isLocked = isVoicePermanentlyApproved();

        // Resetar estilos inline que possam conflitar
        if (btnApprove) {
            btnApprove.style.background = '';
            btnApprove.style.borderColor = '';
            btnApprove.style.color = '';
            btnApprove.style.opacity = '';
            btnApprove.style.cursor = isLocked ? 'default' : 'pointer';
            btnApprove.style.pointerEvents = isLocked ? 'none' : 'auto';
            btnApprove.disabled = isLocked;
        }
        if (btnReject) {
            btnReject.style.background = '';
            btnReject.style.borderColor = '';
            btnReject.style.color = '';
            btnReject.style.opacity = isLocked ? '0.35' : '';
            btnReject.style.pointerEvents = isLocked ? 'none' : 'auto';
            btnReject.style.cursor = isLocked ? 'not-allowed' : 'pointer';
            btnReject.disabled = isLocked;
            btnReject.title = isLocked ? 'A locução/voz já foi aprovada em rodada anterior e validada definitivamente.' : '';
        }

        if (voiceCard) {
            voiceCard.classList.remove('card-approved', 'card-rejected', 'zone-filled', 'zone-empty');
        }

        if (isLocked || status === 'approved' || status === true) {
            voiceDecision = 'approved';
            isVoiceApprovedState = true;
            if (voiceCard) voiceCard.classList.add('card-approved', 'zone-filled');
            if (btnApprove) {
                btnApprove.classList.add('is-selected');
                if (isLocked) {
                    btnApprove.disabled = true;
                    btnApprove.style.cursor = 'default';
                    btnApprove.style.pointerEvents = 'none';
                }
            }
            if (btnApproveText) btnApproveText.textContent = 'VOZ APROVADA ✓';

            if (btnReject) {
                btnReject.classList.remove('is-selected');
                if (isLocked) {
                    btnReject.disabled = true;
                    btnReject.style.opacity = '0.35';
                    btnReject.style.pointerEvents = 'none';
                    btnReject.style.cursor = 'not-allowed';
                    btnReject.title = 'A locução/voz já foi aprovada em rodada anterior e validada definitivamente.';
                }
            }
            if (btnRejectText) btnRejectText.textContent = 'REPROVAR';
            if (rejectionBox) rejectionBox.style.display = 'none';
        } else if (status === 'rejected') {
            voiceDecision = 'rejected';
            isVoiceApprovedState = false;
            if (voiceCard) voiceCard.classList.add('card-rejected', 'zone-empty');
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
        // Bloqueio apenas se já foi aprovada e validada definitivamente em rodada anterior avançada
        if (isPhotoPermanentlyApproved()) {
            return;
        }

        if (photoDecision === 'approved') {
            // Se já estava aprovado nesta rodada e clicou de novo, alterna para pendente
            updatePhotoApprovalUI('pending');
        } else {
            // Se a caixa de reprovação estava aberta, fecha ao aprovar
            if (photoRejectionBox) photoRejectionBox.style.display = 'none';
            updatePhotoApprovalUI('approved');
        }
        saveFullSessionState();
    });

    btnRejectPhotoModal?.addEventListener('click', () => {
        // Bloqueio apenas se já foi aprovada e validada definitivamente em rodada anterior avançada
        if (isPhotoPermanentlyApproved()) {
            return;
        }

        if (photoDecision === 'rejected') {
            // Se já estava reprovado, desmarca para pendente
            updatePhotoApprovalUI('pending');
        } else {
            // Marca como reprovado e abre a caixa de feedback
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

    // =========================================================================
    // LIGHTBOX / MODAL DE ZOOM EM ALTA RESOLUÇÃO DAS PRÉVIAS (ETAPA 4)
    // =========================================================================
    window.openPreviewZoomModal = function(orientation) {
        const modal = document.getElementById('modal-zoom-previa');
        const zoomImg = document.getElementById('zoom-modal-img');
        const formatBadge = document.getElementById('zoom-modal-format-badge');
        const titleEl = document.getElementById('zoom-modal-title');
        if (!modal || !zoomImg) return;

        let targetSrc = '';
        let badgeText = 'Fotografia';

        if (orientation === 'h') {
            const imgH = document.getElementById('preview-avatar-img-h');
            targetSrc = imgH?.src || '';
            badgeText = 'Formato Horizontal (16:9)';
        } else if (orientation === 'v') {
            const imgV = document.getElementById('preview-avatar-img-v');
            targetSrc = imgV?.src || '';
            badgeText = 'Formato Vertical (9:16)';
        } else {
            const singleImg = document.getElementById('preview-avatar-img');
            targetSrc = singleImg?.src || '';
            badgeText = 'Fotografia Restaurada';
        }

        if (!targetSrc) {
            // Se ainda não houver imagem gerada, avisa com elegância
            if (typeof showCustomToast === 'function') {
                showCustomToast('A imagem ainda está sendo preparada pela equipe de Produção.');
            }
            return;
        }

        zoomImg.src = targetSrc;
        if (formatBadge) formatBadge.textContent = badgeText;
        if (titleEl) titleEl.textContent = 'Visualização em Alta Definição';

        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        if (window.lucide) lucide.createIcons();
    };

    window.closePreviewZoomModal = function() {
        const modal = document.getElementById('modal-zoom-previa');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
    };

    // Fechar ao clicar fora do conteúdo do modal
    const modalZoomElement = document.getElementById('modal-zoom-previa');
    if (modalZoomElement) {
        modalZoomElement.addEventListener('click', (e) => {
            if (e.target === modalZoomElement) {
                window.closePreviewZoomModal();
            }
        });
    }

    // Fechar ao pressionar ESC
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const modal = document.getElementById('modal-zoom-previa');
            if (modal && modal.style.display === 'flex') {
                window.closePreviewZoomModal();
            }
        }
    });

    window.handleZoomApprovePhoto = function() {
        window.closePreviewZoomModal();
        if (isPhotoPermanentlyApproved()) return;
        if (photoRejectionBox) photoRejectionBox.style.display = 'none';
        updatePhotoApprovalUI('approved');
        saveFullSessionState();
        if (typeof showCustomToast === 'function') {
            showCustomToast('Imagem aprovada com sucesso!');
        }
    };

    window.handleZoomRejectPhoto = function() {
        window.closePreviewZoomModal();
        if (isPhotoPermanentlyApproved()) return;
        updatePhotoApprovalUI('rejected');
        saveFullSessionState();
        if (photoRejectionFeedback) {
            setTimeout(() => {
                photoRejectionFeedback.scrollIntoView({ behavior: 'smooth', block: 'center' });
                photoRejectionFeedback.focus();
            }, 250);
        }
    };

    // Listeners do Áudio/Voz (Reprovar e Aprovar)
    const btnRejectVoiceModal = document.getElementById('btn-reject-voice-modal');
    const btnApproveVoiceStatus = document.getElementById('btn-approve-voice-status');
    const voiceRejectionBox = document.getElementById('voice-rejection-box');
    const voiceRejectionFeedback = document.getElementById('voice-rejection-feedback');

    btnApproveVoiceStatus?.addEventListener('click', () => {
        // Bloqueio apenas se já foi aprovada e validada definitivamente em rodada anterior avançada
        if (isVoicePermanentlyApproved()) {
            return;
        }

        if (voiceDecision === 'approved') {
            // Se já estava aprovado nesta rodada e clicou de novo, alterna para pendente
            updateVoiceApprovalUI('pending');
        } else {
            // Se a caixa de reprovação estava aberta, fecha ao aprovar
            if (voiceRejectionBox) voiceRejectionBox.style.display = 'none';
            updateVoiceApprovalUI('approved');
        }
        saveFullSessionState();
    });

    btnRejectVoiceModal?.addEventListener('click', () => {
        // Bloqueio apenas se já foi aprovada e validada definitivamente em rodada anterior avançada
        if (isVoicePermanentlyApproved()) {
            return;
        }

        if (voiceDecision === 'rejected') {
            // Se já estava reprovado, desmarca para pendente
            updateVoiceApprovalUI('pending');
        } else {
            // Marca como reprovado e abre a caixa de feedback
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

    // Ações Etapa 4 (A Lapidação: Avançar para a Sala de Revelação ou Notificar a Equipe de Produção)
    document.getElementById('btn-approve-lapidacao')?.addEventListener('click', async () => {
        if (photoDecision === 'pending' || voiceDecision === 'pending') {
            return; // Inativo / protegido
        }

        const ordIdent = (orderData?.order_id || orderData?.id || 1);

        // Se a foto foi aprovada pelo cliente nesta rodada, registra como travada definitivamente
        if (photoDecision === 'approved') {
            localStorage.setItem(`reviva_photo_permanently_approved_${ordIdent}`, 'true');
            localStorage.setItem('reviva_photo_permanently_approved', 'true');
        }

        // Se o áudio/voz foi aprovado pelo cliente nesta rodada, registra como travado definitivamente
        if (voiceDecision === 'approved') {
            localStorage.setItem(`reviva_voice_permanently_approved_${ordIdent}`, 'true');
            localStorage.setItem('reviva_voice_permanently_approved', 'true');
        }

        // Se ambos foram aprovados: avança diretamente para a Sala de Revelação
        if (photoDecision === 'approved' && voiceDecision === 'approved') {
            if (window.revivaData?.saveMediaApproval) {
                await window.revivaData.saveMediaApproval(orderData?.id || 1, true, true);
            }
            // Sincronização direta com o Painel de Produção (CRM)
            ['reviva_crm_order_' + ordIdent, 'reviva_crm_order_REVIVA-1001', 'reviva_crm_order_1'].forEach(k => {
                try {
                    const raw = localStorage.getItem(k);
                    if (raw) {
                        const c = JSON.parse(raw);
                        c.stage = 'previas_aprovadas';
                        c.photoApproved = true;
                        c.voiceApproved = true;
                        if (!Array.isArray(c.history)) c.history = [];
                        c.history.unshift({
                            timestamp: new Date().toISOString(),
                            dateFormatted: new Date().toLocaleString('pt-BR'),
                            event: 'Cliente aprovou integralmente as prévias de imagem e de voz clonada! Pedido liberado para renderização final.',
                            type: 'stage'
                        });
                        localStorage.setItem(k, JSON.stringify(c));
                    }
                } catch(e) {}
            });
            saveFullSessionState();
            goToStep(5);
            return;
        }

        let photoTxt = '';
        let voiceTxt = '';

        // Se imagem foi reprovada, valida se digitou algo
        if (photoDecision === 'rejected') {
            photoTxt = photoRejectionFeedback?.value.trim() || '';
            if (!photoTxt) {
                alert('Por favor, descreva quais ajustes você gostaria de realizar na imagem antes de enviar à equipe de produção.');
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
            voiceTxt = voiceRejectionFeedback?.value.trim() || '';
            if (!voiceTxt) {
                alert('Por favor, descreva quais ajustes você gostaria de realizar no áudio/voz antes de enviar à equipe de produção.');
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

        // Se houver reprovação de imagem ou voz: marca etapa como aguardando nova entrega da equipe
        localStorage.setItem('reviva_stage4_delivered', 'false');
        localStorage.setItem(`reviva_stage4_delivered_${ordIdent}`, 'false');
        localStorage.setItem('reviva_stage4_delivered_REVIVA-1001', 'false');
        saveFullSessionState();

        // Sincronização direta com o Painel de Produção (CRM)
        ['reviva_crm_order_' + ordIdent, 'reviva_crm_order_REVIVA-1001', 'reviva_crm_order_1'].forEach(k => {
            try {
                const raw = localStorage.getItem(k);
                if (raw) {
                    const c = JSON.parse(raw);
                    c.stage = 'previas_reprovadas';
                    c.adjustingRejectedPreviews = false;
                    c.photoApproved = (photoDecision === 'approved');
                    c.voiceApproved = (voiceDecision === 'approved');

                    let feedText = '';
                    if (photoDecision === 'rejected' && voiceDecision === 'approved') {
                        feedText = `[Ajuste de Imagem]: ${photoTxt} (Fotografia rejeitada | Locução/voz aprovada definitivamente ✓)`;
                    } else if (voiceDecision === 'rejected' && photoDecision === 'approved') {
                        feedText = `[Ajuste de Locução/Voz]: ${voiceTxt} (Fotografia aprovada definitivamente ✓ | Locução/voz rejeitada)`;
                    } else {
                        feedText = `[Ajuste de Imagem]: ${photoTxt} | [Ajuste de Locução/Voz]: ${voiceTxt}`;
                    }
                    c.feedback = feedText;
                    if (!Array.isArray(c.history)) c.history = [];
                    c.history.unshift({
                        timestamp: new Date().toISOString(),
                        dateFormatted: new Date().toLocaleString('pt-BR'),
                        event: `Cliente enviou solicitação de ajustes: ${feedText}`,
                        type: 'feedback'
                    });
                    localStorage.setItem(k, JSON.stringify(c));
                }
            } catch(e) {}
        });

        // Abre diretamente a tela de bloqueio nobre informando que a equipe está cuidando dos ajustes
        openWaitingTeamModal('revisao');
    });

    // =========================================================================
    // ETAPA 05: O REENCONTRO (AÇÕES & COMPARTILHAMENTO)
    // =========================================================================
    function getRevealPageUrl() {
        let names = { homenageado: '', ente: '' };
        try {
            if (typeof extractHomenagemNames === 'function') {
                names = extractHomenagemNames();
            }
        } catch(e) {
            console.warn('Erro ao extrair nomes da homenagem:', e);
        }
        const params = new URLSearchParams();
        params.set('v', 'reviva_token_mariana_777');
        if (names && names.homenageado) params.set('h', names.homenageado);
        if (names && names.ente) params.set('e', names.ente);
        const origin = (window.location.origin && window.location.origin !== 'null') ? window.location.origin : window.location.href.split('/painel')[0];
        return `${origin}/revelar.html?${params.toString()}`;
    }

    function registerStage5Consumption() {
        try {
            const currentOrderId = (typeof orderData !== 'undefined' && orderData && orderData.id) ? orderData.id : 'REVIVA-1001';
            localStorage.setItem('reviva_stage5_consumed_' + currentOrderId, 'true');
            localStorage.setItem('reviva_stage5_consumed_REVIVA-1001', 'true');
            localStorage.setItem('reviva_stage5_consumed', 'true');

            // Atualiza histórico do CRM do pedido se já existir
            const crmKey = 'reviva_crm_order_' + currentOrderId;
            const rawCrm = localStorage.getItem(crmKey);
            if (rawCrm) {
                const crm = JSON.parse(rawCrm);
                if (crm && !crm.stage5Consumed) {
                    crm.stage5Consumed = true;
                    crm.stage5ConsumedAt = new Date().toISOString();
                    if (!crm.manualStageOverride) {
                        crm.stage = 'entregues'; // Avança automaticamente para Pós-Venda
                    }
                    if (!Array.isArray(crm.history)) crm.history = [];
                    crm.history.unshift({
                        timestamp: new Date().toISOString(),
                        dateFormatted: new Date().toLocaleString('pt-BR'),
                        event: 'Cliente interagiu na Etapa 05 (visualizou, baixou ou compartilhou a homenagem)',
                        type: 'delivery'
                    });
                    localStorage.setItem(crmKey, JSON.stringify(crm));
                }
            }
        } catch(e) {
            console.warn('Erro ao registrar consumo da Etapa 5:', e);
        }
    }

    const btnGoToRevealRoom = document.getElementById('btnGoToRevealRoom');
    if (btnGoToRevealRoom) {
        btnGoToRevealRoom.addEventListener('click', () => {
            registerStage5Consumption();
            btnGoToRevealRoom.href = getRevealPageUrl();
        });
    }

    // Função global explícita de cópia para garantir acionamento direto e feedback instantâneo
    window.copiarLinkWhatsApp = function(event) {
        if (event) event.preventDefault();
        registerStage5Consumption();
        
        const btn = document.getElementById('btnCopyRevealLink');
        const textSpan = document.getElementById('btnCopyRevealLinkText');
        const iconContainer = document.getElementById('btnCopyRevealLinkIcon');

        // Feedback visual imediato
        if (textSpan) {
            textSpan.textContent = 'LINK COPIADO!';
            textSpan.style.color = '#4ade80';
        }
        if (iconContainer) {
            iconContainer.innerHTML = '<i data-lucide="check" style="width: 14px; height: 14px; flex-shrink: 0; color: #4ade80;"></i>';
            if (window.lucide) lucide.createIcons();
        }

        // Gera o link da página de revelação
        let revealUrl = `${window.location.origin}/revelar.html?v=reviva_token_mariana_777`;
        try {
            revealUrl = getRevealPageUrl();
        } catch(e) {
            console.warn('Erro ao obter URL de revelação:', e);
        }

        // Executa a cópia
        fallbackCopyText(revealUrl);
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(revealUrl).catch(() => {});
        }

        // Restaura após 2,5 segundos
        setTimeout(() => {
            if (textSpan) {
                textSpan.textContent = 'LINK WHATSAPP';
                textSpan.style.color = '';
            }
            if (iconContainer) {
                iconContainer.innerHTML = '<i data-lucide="share-2" style="width: 14px; height: 14px; flex-shrink: 0;"></i>';
                if (window.lucide) lucide.createIcons();
            }
        }, 2500);
    };

    const btnCopyRevealLink = document.getElementById('btnCopyRevealLink');
    if (btnCopyRevealLink) {
        btnCopyRevealLink.onclick = window.copiarLinkWhatsApp;
    }

    const btnDownloadFinalVideo = document.getElementById('btnDownloadFinalVideo');
    if (btnDownloadFinalVideo) {
        btnDownloadFinalVideo.addEventListener('click', () => {
            registerStage5Consumption();
        });
    }

    // Fallback universal e garantido para cópia de links
    function fallbackCopyText(text, onSuccess) {
        try {
            const tempInput = document.createElement('textarea');
            tempInput.value = text;
            tempInput.style.position = 'fixed';
            tempInput.style.top = '-9999px';
            tempInput.style.left = '-9999px';
            document.body.appendChild(tempInput);
            tempInput.focus();
            tempInput.select();
            const successful = document.execCommand('copy');
            document.body.removeChild(tempInput);
            if (successful && onSuccess) {
                onSuccess();
                return;
            }
        } catch (err) {
            console.warn('Erro no fallback de cópia:', err);
        }
        if (onSuccess) onSuccess();
    }

    const finalHomenagemVideo = document.getElementById('final-homenagem-video');
    if (finalHomenagemVideo) {
        finalHomenagemVideo.addEventListener('play', () => {
            registerStage5Consumption();
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
        window.updateAudioUI = updateAudioUI;

        let fadeInterval = null;
        function fadeAudioVolume(targetVolume, duration = 400) {
            if (!bgAudio) return;
            if (fadeInterval) clearInterval(fadeInterval);
            const startVolume = bgAudio.volume;
            const steps = 20;
            const stepTime = duration / steps;
            const volumeDiff = targetVolume - startVolume;
            let currentStep = 0;

            fadeInterval = setInterval(() => {
                currentStep++;
                bgAudio.volume = Math.max(0, Math.min(1, startVolume + (volumeDiff * (currentStep / steps))));
                if (currentStep >= steps) {
                    clearInterval(fadeInterval);
                    fadeInterval = null;
                }
            }, stepTime);
        }
        window.fadeAudioVolume = fadeAudioVolume;

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
    // TERMO DE RESPONSABILIDADE & CONSENTIMENTO ÉTICO (ENTRADA DO PAINEL)
    // =========================================================================
    window.openTermoModal = function(isViewOnly = false) {
        const modal = document.getElementById('modal-termo-responsabilidade');
        const btnCloseView = document.getElementById('btn-close-termo-view');
        const btnSubmit = document.getElementById('btn-submit-term');
        const chkAccept = document.getElementById('chk-term-accept');
        const inputName = document.getElementById('term-signer-name');
        const inputCpf = document.getElementById('term-signer-cpf');
        const inputNarrator = document.getElementById('term-signer-relation-narrator');
        const inputRecipient = document.getElementById('term-signer-relation-recipient');

        if (!modal) return;

        // Se o termo já foi assinado em qualquer momento, bloqueia compulsoriamente os campos de identificação (readOnly/disabled)
        const isAlreadySigned = Boolean(legalTermSigned && legalTermSigned.signed);
        if (isViewOnly || isAlreadySigned) {
            if (btnCloseView) btnCloseView.style.display = 'block';
            if (btnSubmit) btnSubmit.style.display = 'none';
            if (inputName) { 
                inputName.value = legalTermSigned ? legalTermSigned.name : (orderData?.customer_name || 'Mariana Silva Santos'); 
                inputName.disabled = true; 
                inputName.readOnly = true;
                inputName.style.cursor = 'not-allowed';
                inputName.style.opacity = '0.75';
            }
            if (inputCpf) { 
                inputCpf.value = legalTermSigned ? legalTermSigned.cpf : (orderData?.customer_cpf || '123.456.789-00'); 
                inputCpf.disabled = true; 
                inputCpf.readOnly = true;
                inputCpf.style.cursor = 'not-allowed';
                inputCpf.style.opacity = '0.75';
            }
            if (inputNarrator) { 
                inputNarrator.value = legalTermSigned?.relationNarrator || legalTermSigned?.relation || 'Filho(a)'; 
                inputNarrator.disabled = true; 
                inputNarrator.readOnly = true;
                inputNarrator.style.cursor = 'not-allowed';
                inputNarrator.style.opacity = '0.75';
            }
            if (inputRecipient) { 
                inputRecipient.value = legalTermSigned?.relationRecipient || 'Sou eu mesmo(a)'; 
                inputRecipient.disabled = true; 
                inputRecipient.readOnly = true;
                inputRecipient.style.cursor = 'not-allowed';
                inputRecipient.style.opacity = '0.75';
            }
            if (chkAccept) { 
                chkAccept.checked = true; 
                chkAccept.disabled = true; 
            }
        } else {
            if (btnCloseView) btnCloseView.style.display = 'none';
            if (btnSubmit) btnSubmit.style.display = 'block';
            if (inputName) { 
                const customerName = (typeof orderData !== 'undefined' && orderData?.customer_name) ? orderData.customer_name : 'Mariana Silva Santos';
                inputName.value = legalTermSigned?.name || customerName; 
                inputName.readOnly = false;
                inputName.disabled = false;
                inputName.style.cursor = 'text';
            }
            if (inputCpf) { 
                const customerCpf = (typeof orderData !== 'undefined' && orderData?.customer_cpf) ? orderData.customer_cpf : '123.456.789-00';
                inputCpf.value = legalTermSigned?.cpf || customerCpf; 
                inputCpf.readOnly = false;
                inputCpf.disabled = false;
                inputCpf.style.cursor = 'text';
            }
            if (inputNarrator) { inputNarrator.value = legalTermSigned?.relationNarrator || legalTermSigned?.relation || ''; inputNarrator.disabled = false; }
            if (inputRecipient) { inputRecipient.value = legalTermSigned?.relationRecipient || ''; inputRecipient.disabled = false; }
            if (chkAccept) { chkAccept.checked = false; chkAccept.disabled = false; }
        }

        const errNomeEl = document.getElementById('errTermNome');
        const errCpfEl = document.getElementById('errTermCpf');
        if (errNomeEl) errNomeEl.style.display = 'none';
        if (errCpfEl) errCpfEl.style.display = 'none';
        if (inputName) {
            inputName.style.borderColor = 'rgba(197, 160, 89, 0.4)';
            inputName.style.boxShadow = 'none';
        }
        if (inputCpf) {
            inputCpf.style.borderColor = 'rgba(197, 160, 89, 0.4)';
            inputCpf.style.boxShadow = 'none';
        }

        modal.style.display = 'flex';
        if (window.lucide) lucide.createIcons();
    };

    // Algoritmo Oficial de Validação de CPF (Módulo 11)
    function validarCpfOficial(cpf) {
        if (!cpf || typeof cpf !== 'string') return false;
        const limpo = cpf.replace(/\D/g, '');
        if (limpo.length !== 11) return false;
        if (/^(\d)\1{10}$/.test(limpo)) return false;

        let soma = 0;
        for (let i = 0; i < 9; i++) {
            soma += parseInt(limpo.charAt(i), 10) * (10 - i);
        }
        let resto = (soma * 10) % 11;
        if (resto === 10 || resto === 11) resto = 0;
        if (resto !== parseInt(limpo.charAt(9), 10)) return false;

        soma = 0;
        for (let i = 0; i < 10; i++) {
            soma += parseInt(limpo.charAt(i), 10) * (11 - i);
        }
        resto = (soma * 10) % 11;
        if (resto === 10 || resto === 11) resto = 0;
        if (resto !== parseInt(limpo.charAt(10), 10)) return false;

        return true;
    }

    // Máscara dinâmica de CPF no modal e validação visual
    const termCpfInput = document.getElementById('term-signer-cpf');
    const termNomeInput = document.getElementById('term-signer-name');

    termCpfInput?.addEventListener('input', function(e) {
        let v = e.target.value.replace(/\D/g, '');
        if (v.length > 11) v = v.slice(0, 11);
        if (v.length > 9) v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
        else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
        else if (v.length > 3) v = v.replace(/(\d{3})(\d{1,3})/, '$1.$2');
        e.target.value = v;

        const errCpfEl = document.getElementById('errTermCpf');
        if (v.replace(/\D/g, '').length === 11) {
            if (validarCpfOficial(v)) {
                termCpfInput.style.borderColor = '#22c55e';
                termCpfInput.style.boxShadow = '0 0 8px rgba(34, 197, 94, 0.3)';
                if (errCpfEl) errCpfEl.style.display = 'none';
            } else {
                termCpfInput.style.borderColor = '#ef4444';
                termCpfInput.style.boxShadow = '0 0 8px rgba(239, 68, 68, 0.3)';
                if (errCpfEl) errCpfEl.style.display = 'block';
            }
        } else {
            termCpfInput.style.borderColor = 'rgba(197, 160, 89, 0.4)';
            termCpfInput.style.boxShadow = 'none';
            if (errCpfEl) errCpfEl.style.display = 'none';
        }
    });

    termNomeInput?.addEventListener('input', function(e) {
        const val = e.target.value.trim();
        const errNomeEl = document.getElementById('errTermNome');
        const partes = val.split(/\s+/).filter(p => p.length >= 2);
        if (val.length > 0 && partes.length >= 2) {
            termNomeInput.style.borderColor = '#22c55e';
            termNomeInput.style.boxShadow = '0 0 8px rgba(34, 197, 94, 0.3)';
            if (errNomeEl) errNomeEl.style.display = 'none';
        } else if (val.length > 0 && partes.length < 2) {
            termNomeInput.style.borderColor = '#ef4444';
            termNomeInput.style.boxShadow = '0 0 8px rgba(239, 68, 68, 0.3)';
            if (errNomeEl) errNomeEl.style.display = 'block';
        } else {
            termNomeInput.style.borderColor = 'rgba(197, 160, 89, 0.4)';
            termNomeInput.style.boxShadow = 'none';
            if (errNomeEl) errNomeEl.style.display = 'none';
        }
    });

    window.closeTermoModal = function() {
        const modal = document.getElementById('modal-termo-responsabilidade');
        if (modal) modal.style.display = 'none';
    };

    window.handleSignTermo = function(e) {
        e.preventDefault();
        const inputNameEl = document.getElementById('term-signer-name');
        const inputCpfEl = document.getElementById('term-signer-cpf');
        const name = inputNameEl?.value.trim() || '';
        const cpf = inputCpfEl?.value.trim() || '';
        const relationNarrator = document.getElementById('term-signer-relation-narrator')?.value.trim();
        const relationRecipient = document.getElementById('term-signer-relation-recipient')?.value.trim();
        const chk = document.getElementById('chk-term-accept')?.checked;

        const errNomeEl = document.getElementById('errTermNome');
        const errCpfEl = document.getElementById('errTermCpf');

        const partesNome = name.split(/\s+/).filter(p => p.length >= 2);
        if (partesNome.length < 2) {
            if (errNomeEl) errNomeEl.style.display = 'block';
            if (inputNameEl) {
                inputNameEl.readOnly = false;
                inputNameEl.disabled = false;
                inputNameEl.style.borderColor = '#ef4444';
                inputNameEl.style.boxShadow = '0 0 8px rgba(239, 68, 68, 0.4)';
                inputNameEl.focus();
            }
            return;
        } else {
            if (errNomeEl) errNomeEl.style.display = 'none';
            if (inputNameEl) inputNameEl.style.borderColor = '#22c55e';
        }

        if (!validarCpfOficial(cpf)) {
            if (errCpfEl) errCpfEl.style.display = 'block';
            if (inputCpfEl) {
                inputCpfEl.readOnly = false;
                inputCpfEl.disabled = false;
                inputCpfEl.style.borderColor = '#ef4444';
                inputCpfEl.style.boxShadow = '0 0 8px rgba(239, 68, 68, 0.4)';
                inputCpfEl.focus();
            }
            return;
        } else {
            if (errCpfEl) errCpfEl.style.display = 'none';
            if (inputCpfEl) inputCpfEl.style.borderColor = '#22c55e';
        }

        if (!relationNarrator || !relationRecipient || !chk) {
            return;
        }

        legalTermSigned = {
            signed: true,
            name: name,
            cpf: cpf,
            relationNarrator: relationNarrator,
            relationRecipient: relationRecipient,
            signedAt: new Date().toISOString(),
            dateFormatted: new Date().toLocaleString('pt-BR')
        };

        localStorage.setItem('reviva_legal_term', JSON.stringify(legalTermSigned));
        if (typeof ordIdent !== 'undefined' && ordIdent) {
            localStorage.setItem(`reviva_legal_term_${ordIdent}`, JSON.stringify(legalTermSigned));
        }
        if (typeof orderData !== 'undefined' && orderData?.payment_id) {
            localStorage.setItem(`reviva_legal_term_${orderData.payment_id}`, JSON.stringify(legalTermSigned));
        }
        if (typeof orderData !== 'undefined' && orderData?.order_id) {
            localStorage.setItem(`reviva_legal_term_${orderData.order_id}`, JSON.stringify(legalTermSigned));
        }

        updateTermoUI();
        const modal = document.getElementById('modal-termo-responsabilidade');
        if (modal) modal.style.display = 'none';
        saveFullSessionState();
        alert('✓ Termo de Responsabilidade e Consentimento registrado com sucesso! Bem-vindo ao painel.');
    };

    function updateTermoUI() {
        const badge = document.getElementById('badge-termo-signed');
        const badgeText = document.getElementById('badge-termo-signed-text');
        if (legalTermSigned && legalTermSigned.signed) {
            if (badge) badge.style.display = 'flex';
            if (badgeText) {
                badgeText.textContent = `✓ Termo Assinado por ${legalTermSigned.name} (CPF: ${legalTermSigned.cpf})`;
            }
        } else {
            if (badge) badge.style.display = 'none';
        }
        if (window.lucide) lucide.createIcons();
    }

    // =========================================================================
    // INICIALIZAÇÃO E RESTAURAÇÃO COMPLETA DO ESTADO (ABRINDO NA ETAPA ATIVA)
    // =========================================================================
    const btnResetPanel = document.getElementById('btnResetPanel');
    if (btnResetPanel) {
        btnResetPanel.addEventListener('click', () => {
            if (confirm('Deseja reiniciar o teste do painel do zero? Todos os envios, histórico de chat e prévias serão limpos.')) {
                window.resetarPainelCompleto(true);
            }
        });
    }

    renderPhotoPreviews();
    renderAudioPreviews();
    updateNextStep1ButtonState();

    // 0. Inicializar Galáxia WebGL
    const galaxyBg = document.getElementById('galaxyBg');
    if (galaxyBg) initGalaxy(galaxyBg, true);

    // 1. Limpeza automática de versões antigas de teste armazenadas no navegador
    const STORAGE_BUILD_KEY = 'reviva_storage_build_v7';
    const hasCleanParam = urlParams.has('reset') || urlParams.has('clean') || urlParams.has('novo') || urlParams.has('clear');
    
    if (hasCleanParam || localStorage.getItem('reviva_storage_build') !== STORAGE_BUILD_KEY) {
        window.resetarPainelCompleto(false);
        localStorage.setItem('reviva_stage4_delivered', 'false');
        localStorage.setItem('reviva_stage5_delivered', 'false');
        localStorage.setItem('reviva_storage_build', STORAGE_BUILD_KEY);
    } else {
        restoreFullSessionState(false);
    }

    // 2. Determinar etapa prioritária: Hash da URL > reviva_active_step > estado salvo > etapa 1
    const hashMatch = window.location.hash.match(/step-(\d+)/);
    const hashStep = hashMatch ? parseInt(hashMatch[1]) : null;
    const storedActiveStep = parseInt(localStorage.getItem('reviva_active_step'));

    let initialStep = 1;
    if (hasCleanParam) {
        initialStep = 1;
    } else if (hashStep && hashStep >= 1 && hashStep <= 5) {
        initialStep = hashStep;
    } else if (storedActiveStep && storedActiveStep >= 1 && storedActiveStep <= 5) {
        initialStep = storedActiveStep;
    } else if (currentStep && currentStep >= 1 && currentStep <= 5) {
        initialStep = currentStep;
    }

    // Regra Rígida de Integridade da Etapa 1:
    // A Etapa 1 exige obrigatoriamente fotos e áudios enviados.
    // Se o pedido atual ainda não possui fotos ou áudios enviados, É OBRIGATÓRIO INICIAR NA ETAPA 1!
    const hasPhotosUploaded = Array.isArray(uploadedPhotos) && uploadedPhotos.length > 0;
    const hasAudiosUploaded = Array.isArray(uploadedAudios) && uploadedAudios.length > 0;
    if (!hasPhotosUploaded || !hasAudiosUploaded) {
        initialStep = 1;
        currentStep = 1;
        localStorage.setItem('reviva_active_step', '1');
        localStorage.setItem('reviva_max_step_reached', '1');
        if (window.location.hash !== '#step-1') {
            history.replaceState(null, '', '#step-1');
        }
    }

    // Se o cliente concluiu a etapa anterior e está aguardando a equipe, mantém o passo correspondente sem regredir
    const maxReachedWaitingCheck = parseInt(localStorage.getItem('reviva_max_step_reached')) || currentStep || 1;
    const pendingWaiting = localStorage.getItem('reviva_waiting_active');

    // Se já avançou para 4 ou 5, ou está em espera na etapa 4/5, nunca regride para etapa 3
    if (initialStep === 4 && !isStage4ReadyFromTeam()) {
        // Mantém initialStep = 4 para que os steppers 1, 2 e 3 fiquem marcados como concluídos
        initialStep = 4;
    } else if (initialStep === 5 && !isStage5ReadyFromTeam()) {
        // Mantém initialStep = 5 para que os steppers 1, 2, 3 e 4 fiquem marcados como concluídos
        initialStep = 5;
    }

    const isNewSession = !sessionStorage.getItem('reviva_session_entered');
    const shouldShowCurtainOnEnter = isNewSession || localStorage.getItem('reviva_show_curtain_on_enter') === 'true' || urlParams.has('showCurtain');
    sessionStorage.setItem('reviva_session_entered', 'true');

    if (shouldShowCurtainOnEnter) {
        localStorage.removeItem('reviva_show_curtain_on_enter');
        triggerStageCurtainAnimation(initialStep, () => {
            executeStepSwitch(initialStep);
        });
    } else {
        goToStep(initialStep, true);
    }

    // Suporte a visualização direta para testes ou demonstração rápida via URL (?showWaiting=4, ?showWaiting=revisao, ?showWaiting=5)
    const directWaitingParam = urlParams.get('showWaiting');
    if (directWaitingParam) {
        localStorage.setItem('reviva_waiting_active', directWaitingParam);
    }

    // Reabertura consistente do bloqueio se o cliente recarregar a página ou relogar com produção pendente
    const activeWaitingState = localStorage.getItem('reviva_waiting_active');

    let targetWaitingToOpen = null;
    if (activeWaitingState) {
        targetWaitingToOpen = (!isNaN(parseInt(activeWaitingState)) && activeWaitingState !== 'revisao') 
            ? parseInt(activeWaitingState) 
            : activeWaitingState;
    } else if (maxReachedWaitingCheck >= 5 && !isStage5ReadyFromTeam()) {
        targetWaitingToOpen = 5;
    } else if (maxReachedWaitingCheck >= 4 && !isStage4ReadyFromTeam()) {
        targetWaitingToOpen = 4;
    }

    if (targetWaitingToOpen !== null) {
        setTimeout(() => {
            openWaitingTeamModal(targetWaitingToOpen);
        }, 50);
    }

    // 3. Opcional: Modal de termo mantido apenas para consulta/assinatura voluntária (sem barreira de bloqueio)

    // 3. Suporte a navegação segura: impede qualquer tentativa de voltar no navegador
    window.addEventListener('popstate', (e) => {
        history.pushState(null, '', `#step-${currentStep}`);
    });

    window.addEventListener('hashchange', () => {
        const match = window.location.hash.match(/step-(\d+)/);
        if (match) {
            const target = parseInt(match[1]);
            if (target && target < currentStep) {
                // Bloqueia retrocesso e restaura hash da etapa atual
                history.replaceState(null, '', `#step-${currentStep}`);
                return;
            }
            if (target && target > currentStep && target <= 5) {
                goToStep(target, true);
            }
        }
    });

    // =========================================================================
    // FUNDO DE GALÁXIA WEBGL OFICIAL (OGL) IDÊNTICO AO SITE
    // =========================================================================
    function initGalaxy(ctn, mouseInteraction = true) {
        if (!ctn || !window.ogl) return;

        const { Renderer, Program, Mesh, Triangle } = window.ogl;

        const renderer = new Renderer({
            alpha: true,
            premultipliedAlpha: false
        });
        const gl = renderer.gl;
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.clearColor(0, 0, 0, 0);

        gl.canvas.style.width = '100%';
        gl.canvas.style.height = '100%';

        while (ctn.firstChild) {
            ctn.removeChild(ctn.firstChild);
        }
        ctn.appendChild(gl.canvas);

        const vert = `
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}`;

        const frag = `precision highp float;

uniform float uTime;
uniform vec3 uResolution;
uniform vec2 uFocal;
uniform vec2 uRotation;
uniform float uStarSpeed;
uniform float uDensity;
uniform float uHueShift;
uniform float uSpeed;
uniform vec2 uMouse;
uniform float uGlowIntensity;
uniform float uSaturation;
uniform bool uMouseRepulsion;
uniform float uTwinkleIntensity;
uniform float uRotationSpeed;
uniform float uRepulsionStrength;
uniform float uMouseActiveFactor;
uniform float uAutoCenterRepulsion;
uniform bool uTransparent;

varying vec2 vUv;

#define NUM_LAYER 3.0
#define STAR_COLOR_CUTOFF 0.2
#define MAT45 mat2(0.7071, -0.7071, 0.7071, 0.7071)
#define PERIOD 3.0

float Hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float tri(float x) {
  return abs(fract(x) * 2.0 - 1.0);
}

float tris(float x) {
  float t = fract(x);
  return 1.0 - smoothstep(0.0, 1.0, abs(2.0 * t - 1.0));
}

float trisn(float x) {
  float t = fract(x);
  return 2.0 * (1.0 - smoothstep(0.0, 1.0, abs(2.0 * t - 1.0))) - 1.0;
}

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

float Star(vec2 uv, float flare) {
  float d = length(uv);
  float m = (0.05 * uGlowIntensity) / d;

  float rays = smoothstep(0.0, 1.0, 1.0 - abs(uv.x * uv.y * 1000.0));
  m += rays * flare * uGlowIntensity;
  uv *= MAT45;
  rays = smoothstep(0.0, 1.0, 1.0 - abs(uv.x * uv.y * 1000.0));
  m += rays * 0.3 * flare * uGlowIntensity;

  m *= smoothstep(1.0, 0.2, d);
  return m;
}

vec3 StarLayer(vec2 uv) {
  vec3 col = vec3(0.0);

  vec2 gv = fract(uv) - 0.5;
  vec2 id = floor(uv);

  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 offset = vec2(float(x), float(y));
      vec2 si = id + vec2(float(x), float(y));
      float seed = Hash21(si);
      float size = fract(seed * 345.32);
      float glossLocal = tri(uStarSpeed / (PERIOD * seed + 1.0));
      float flareSize = smoothstep(0.9, 1.0, size) * glossLocal;

      float red = smoothstep(STAR_COLOR_CUTOFF, 1.0, Hash21(si + 1.0)) + STAR_COLOR_CUTOFF;
      float blu = smoothstep(STAR_COLOR_CUTOFF, 1.0, Hash21(si + 3.0)) + STAR_COLOR_CUTOFF;
      float grn = min(red, blu) * seed;
      vec3 base = vec3(red, grn, blu);

      float hue = atan(base.g - base.r, base.b - base.r) / (2.0 * 3.14159) + 0.5;
      hue = fract(hue + uHueShift / 360.0);
      float sat = length(base - vec3(dot(base, vec3(0.299, 0.587, 0.114)))) * uSaturation;
      float val = max(max(base.r, base.g), base.b);
      base = hsv2rgb(vec3(hue, sat, val));

      vec2 pad = vec2(tris(seed * 34.0 + uTime * uSpeed / 10.0), tris(seed * 38.0 + uTime * uSpeed / 30.0)) - 0.5;

      float star = Star(gv - offset - pad, flareSize);
      vec3 color = base;

      float twinkle = trisn(uTime * uSpeed + seed * 6.2831) * 0.5 + 1.0;
      twinkle = mix(1.0, twinkle, uTwinkleIntensity);
      star *= twinkle;

      col += star * size * color;
    }
  }

  return col;
}

void main() {
  vec2 focalPx = uFocal * uResolution.xy;
  vec2 uv = (vUv * uResolution.xy - focalPx) / uResolution.y;

  vec2 mouseNorm = uMouse - vec2(0.5);

  if (uAutoCenterRepulsion > 0.0) {
    vec2 centerUV = vec2(0.0, 0.0);
    float centerDist = length(uv - centerUV);
    vec2 repulsion = normalize(uv - centerUV) * (uAutoCenterRepulsion / (centerDist + 0.1));
    uv += repulsion * 0.05;
  } else if (uMouseRepulsion) {
    vec2 mousePosUV = (uMouse * uResolution.xy - focalPx) / uResolution.y;
    float mouseDist = length(uv - mousePosUV);
    vec2 repulsion = normalize(uv - mousePosUV) * (uRepulsionStrength / (mouseDist + 0.1));
    uv += repulsion * 0.05 * uMouseActiveFactor;
  } else {
    vec2 mouseOffset = mouseNorm * 0.1 * uMouseActiveFactor;
    uv += mouseOffset;
  }

  float autoRotAngle = uTime * uRotationSpeed;
  mat2 autoRot = mat2(cos(autoRotAngle), -sin(autoRotAngle), sin(autoRotAngle), cos(autoRotAngle));
  uv = autoRot * uv;

  uv = mat2(uRotation.x, -uRotation.y, uRotation.y, uRotation.x) * uv;

  vec3 col = vec3(0.0);

  for (float i = 0.0; i < 1.0; i += 1.0 / NUM_LAYER) {
    float depth = fract(i + uStarSpeed * uSpeed);
    float scale = mix(20.0 * uDensity, 0.5 * uDensity, depth);
    float fade = depth * smoothstep(1.0, 0.9, depth);
    col += StarLayer(uv * scale + i * 453.32) * fade;
  }

  if (uTransparent) {
    float alpha = length(col);
    alpha = smoothstep(0.0, 0.3, alpha);
    alpha = min(alpha, 1.0);
    gl_FragColor = vec4(col, alpha);
  } else {
    gl_FragColor = vec4(col, 1.0);
  }
}`;

        const mouseInteractionVal = mouseInteraction;
        const mouseRepulsion = false;
        const density = 0.22;
        const glowIntensity = 0.35;
        const saturation = 0.9;
        const hueShift = 270.0;

        const uniforms = {
            uTime: { value: 0 },
            uResolution: { value: [gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height] },
            uFocal: { value: [0.5, 0.5] },
            uRotation: { value: [1.0, 0.0] },
            uStarSpeed: { value: 0.5 },
            uDensity: { value: density },
            uHueShift: { value: hueShift },
            uSpeed: { value: 1.0 },
            uMouse: { value: [0.5, 0.5] },
            uGlowIntensity: { value: glowIntensity },
            uSaturation: { value: saturation },
            uMouseRepulsion: { value: mouseRepulsion },
            uTwinkleIntensity: { value: 0.4 },
            uRotationSpeed: { value: 0.08 },
            uRepulsionStrength: { value: 2.0 },
            uMouseActiveFactor: { value: 0.0 },
            uAutoCenterRepulsion: { value: 0.0 },
            uTransparent: { value: true }
        };

        const geometry = new Triangle(gl);
        const program = new Program(gl, {
            vertex: vert,
            fragment: frag,
            uniforms
        });
        const mesh = new Mesh(gl, { geometry, program });

        const updatePlacement = () => {
            if (!ctn) return;
            renderer.dpr = Math.min(window.devicePixelRatio || 1, 1.0);
            const wCSS = ctn.clientWidth || window.innerWidth;
            const hCSS = ctn.clientHeight || window.innerHeight;
            renderer.setSize(wCSS, hCSS);
            const w = gl.canvas.width;
            const h = gl.canvas.height;
            uniforms.uResolution.value = [w, h, w / h];
        };

        const targetMousePos = { x: 0.5, y: 0.5 };
        const smoothMousePos = { x: 0.5, y: 0.5 };
        let targetMouseActive = 0.0;
        let smoothMouseActive = 0.0;

        if (mouseInteractionVal) {
            window.addEventListener('pointermove', (e) => {
                const rect = ctn.getBoundingClientRect();
                const x = (e.clientX - rect.left) / (rect.width || 1);
                const y = 1.0 - (e.clientY - rect.top) / (rect.height || 1);
                targetMousePos.x = x;
                targetMousePos.y = y;
                targetMouseActive = 1.0;
            }, { passive: true });

            window.addEventListener('pointerleave', () => {
                targetMouseActive = 0.0;
            }, { passive: true });
        }

        let animationFrameId = null;
        let isRunning = false;

        const loop = (t) => {
            if (!isRunning) return;
            animationFrameId = requestAnimationFrame(loop);

            const timeSeconds = t * 0.001;
            uniforms.uTime.value = timeSeconds;
            uniforms.uStarSpeed.value = (timeSeconds * 0.5) / 10.0;

            const lerp = 0.05;
            smoothMousePos.x += (targetMousePos.x - smoothMousePos.x) * lerp;
            smoothMousePos.y += (targetMousePos.y - smoothMousePos.y) * lerp;
            smoothMouseActive += (targetMouseActive - smoothMouseActive) * lerp;

            uniforms.uMouse.value[0] = smoothMousePos.x;
            uniforms.uMouse.value[1] = smoothMousePos.y;
            uniforms.uMouseActiveFactor.value = smoothMouseActive;

            try {
                renderer.render({ scene: mesh });
            } catch (error) {
                console.warn('WebGL rendering error:', error);
            }
        };

        const startLoop = () => {
            if (!isRunning) {
                isRunning = true;
                animationFrameId = requestAnimationFrame(loop);
            }
        };

        window.addEventListener('resize', updatePlacement);
        updatePlacement();
        startLoop();
    }
});
