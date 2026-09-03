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
    let orderData = await window.revivaData.getCurrentOrder();
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

    // Atualiza cabeçalhos e badges com o plano ativo e formato contratado
    function updateAllStepPlanBadges() {
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

        let formatLabel = 'HORIZONTAL';
        if (rawFormat.includes('ambos') || rawFormat.includes('both') || rawFormat.includes('+') || rawFormat.includes('&')) {
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
    function triggerStageCurtainAnimation(step, callback) {
        if (!ENABLE_STEP_TRANSITIONS) {
            if (callback) callback();
            return;
        }

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

        // Se a cortina já foi ativada previamente (ex: no carregamento da página), mantemos a cobertura total
        const alreadyActive = curtain.classList.contains('active');
        if (!alreadyActive) {
            curtain.classList.add('active');
        }

        // 2. Troca de fase no auge da opacidade (1,5 segundos)
        setTimeout(() => {
            if (callback) callback();
        }, alreadyActive ? 500 : 1500);

        // 3. Após leitura da transição, inicia o Fade Out suave revelando a tela da etapa
        curtainTimer = setTimeout(() => {
            curtain.classList.remove('active');
        }, alreadyActive ? 2200 : 2500);
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
        
        // Persistir etapa ativa imediatamente para recarregamento em tempo real
        try {
            localStorage.setItem('reviva_active_step', step.toString());
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
            const producerImg = localStorage.getItem('reviva_producer_image');
            const photoSrc = producerImg || (uploadedPhotos && uploadedPhotos.length > 0 ? uploadedPhotos[0].dataUrl : '');
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

            const producerAudio = localStorage.getItem('reviva_producer_audio');
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
        return localStorage.getItem('reviva_stage4_delivered') === 'true';
    }

    function isStage5ReadyFromTeam() {
        // A Etapa 05 SÓ fica liberada se a equipe explicitamente liberou ou publicou o vídeo
        return localStorage.getItem('reviva_stage5_delivered') === 'true';
    }

    let currentWaitingStep = null;

    function openWaitingTeamModal(targetStep) {
        currentWaitingStep = targetStep;
        const modal = document.getElementById('modal-aguardando-equipe');
        if (!modal) return;

        const badge = document.getElementById('waiting-modal-badge');
        const title = document.getElementById('waiting-modal-title');
        const subtitle = document.getElementById('waiting-modal-subtitle');
        const body = document.getElementById('waiting-modal-body');
        const statusBox = document.getElementById('waiting-modal-status-box');
        const statusText = document.getElementById('waiting-modal-status-text');
        const dot = statusBox?.querySelector('.waiting-pulse-dot');
        const btnSimulate = document.getElementById('btn-simulate-team-delivery');

        // Resetar estilos de status para o estado pulsante dourado idêntico em ambas as etapas
        if (dot) {
            dot.style.background = '#e5c378';
            dot.style.boxShadow = '0 0 12px rgba(229, 195, 120, 0.85)';
        }
        if (statusBox) {
            statusBox.style.background = 'transparent';
            statusBox.style.border = 'none';
        }
        if (statusText) {
            statusText.style.color = 'var(--gold-bright)';
        }

        if (targetStep === 'revisao' || targetStep === 'revisao_etapa4') {
            if (badge) badge.style.display = 'none';
            if (title) title.textContent = 'Suas considerações foram recebidas pela equipe...';
            if (subtitle) subtitle.textContent = '';
            if (statusText) statusText.textContent = 'Status: ETAPA 4 EM PRODUÇÃO.';
            if (body) {
                body.innerHTML = `
                    <div style="background: transparent; border: none; padding: clamp(6px, 1.2vh, 12px) 0; text-align: left; display: flex; flex-direction: column; justify-content: center;">
                        <strong style="color: var(--gold-bright); font-size: clamp(0.78rem, 0.90vw, 0.88rem); margin-bottom: 4px; letter-spacing: 0.5px;">1. CONSIDERAÇÕES RECEBIDAS</strong>
                        <span style="color: var(--text-secondary); font-size: clamp(0.72rem, 0.80vw, 0.78rem); line-height: 1.55;">Seus apontamentos e direcionamentos de ajustes foram encaminhados com sucesso e já estão sob análise da nossa equipe de especialistas.</span>
                    </div>
                    
                    <div style="background: transparent; border: none; padding: clamp(6px, 1.2vh, 12px) 0; text-align: left; display: flex; flex-direction: column; justify-content: center;">
                        <strong style="color: var(--gold-bright); font-size: clamp(0.78rem, 0.90vw, 0.88rem); margin-bottom: 4px; letter-spacing: 0.5px;">2. LAPIDAÇÃO ARTESANAL DA NOVA VERSÃO</strong>
                        <span style="color: var(--text-secondary); font-size: clamp(0.72rem, 0.80vw, 0.78rem); line-height: 1.55;">Nossos especialistas estão trabalhando minuciosamente nos detalhes indicados para alcançar a máxima fidelidade, naturalidade e respeito à memória do ente querido.</span>
                    </div>

                    <div style="background: transparent; border: none; padding: clamp(6px, 1.2vh, 12px) 0; text-align: left; display: flex; flex-direction: column; justify-content: center;">
                        <strong style="color: var(--gold-bright); font-size: clamp(0.78rem, 0.90vw, 0.88rem); margin-bottom: 4px; letter-spacing: 0.5px;">3. AVISO POR E-MAIL E WHATSAPP</strong>
                        <span style="color: var(--text-secondary); font-size: clamp(0.72rem, 0.80vw, 0.78rem); line-height: 1.55;">Você não precisa aguardar nesta tela. Assim que a nova versão for concluída pela equipe, você receberá uma notificação direta por <strong>E-mail</strong> e <strong>WhatsApp</strong>.</span>
                    </div>

                    <div style="background: transparent; border: none; padding: clamp(6px, 1.2vh, 12px) 0; text-align: left; display: flex; flex-direction: column; justify-content: center;">
                        <strong style="color: var(--gold-bright); font-size: clamp(0.78rem, 0.90vw, 0.88rem); margin-bottom: 4px; letter-spacing: 0.5px;">4. LIBERAÇÃO AUTOMÁTICA DAS NOVAS PRÉVIAS</strong>
                        <span style="color: var(--text-secondary); font-size: clamp(0.72rem, 0.80vw, 0.78rem); line-height: 1.55;">Assim que os novos arquivos forem publicados pela equipe, esta tela será atualizada instantaneamente para você avaliar e aprovar o resultado com total tranquilidade.</span>
                    </div>
                `;
            }
        } else if (targetStep === 4) {
            if (badge) badge.style.display = 'none';
            if (title) title.textContent = 'Sua homenagem está sendo lapidada com todo o cuidado...';
            if (subtitle) subtitle.textContent = '';
            if (statusText) statusText.textContent = 'Status: ETAPA 4 EM PRODUÇÃO.';
            if (body) {
                body.innerHTML = `
                    <div style="background: transparent; border: none; padding: clamp(6px, 1.2vh, 12px) 0; text-align: left; display: flex; flex-direction: column; justify-content: center;">
                        <strong style="color: var(--gold-bright); font-size: clamp(0.78rem, 0.90vw, 0.88rem); margin-bottom: 4px; letter-spacing: 0.5px;">1. MATERIAIS & DIRETRIZES RECEBIDOS</strong>
                        <span style="color: var(--text-secondary); font-size: clamp(0.72rem, 0.80vw, 0.78rem); line-height: 1.55;">Suas fotos de memória, amostras de voz, o roteiro afetivo aprovado, a ambientação cênica e a trilha sonora foram encaminhados com sucesso à equipe de especialistas da <em>Reviva Memories</em>.</span>
                    </div>
                    
                    <div style="background: transparent; border: none; padding: clamp(6px, 1.2vh, 12px) 0; text-align: left; display: flex; flex-direction: column; justify-content: center;">
                        <strong style="color: var(--gold-bright); font-size: clamp(0.78rem, 0.90vw, 0.88rem); margin-bottom: 4px; letter-spacing: 0.5px;">2. PRODUÇÃO & LAPIDAÇÃO ARTESANAL EM ANDAMENTO</strong>
                        <span style="color: var(--text-secondary); font-size: clamp(0.72rem, 0.80vw, 0.78rem); line-height: 1.55;">Nossa equipe e sistemas de alta precisão estão realizando a restauração digital da fisionomia em alta definição e a clonagem vocal com a locução do roteiro aprovado, preservando todo o afeto e a naturalidade.</span>
                    </div>

                    <div style="background: transparent; border: none; padding: clamp(6px, 1.2vh, 12px) 0; text-align: left; display: flex; flex-direction: column; justify-content: center;">
                        <strong style="color: var(--gold-bright); font-size: clamp(0.78rem, 0.90vw, 0.88rem); margin-bottom: 4px; letter-spacing: 0.5px;">3. AVISO POR E-MAIL E WHATSAPP</strong>
                        <span style="color: var(--text-secondary); font-size: clamp(0.72rem, 0.80vw, 0.78rem); line-height: 1.55;">Você não precisa aguardar nesta tela. Assim que a curadoria concluir as prévias de imagem e voz, você receberá uma notificação direta por <strong>E-mail</strong> e <strong>WhatsApp</strong> para conferir o resultado.</span>
                    </div>

                    <div style="background: transparent; border: none; padding: clamp(6px, 1.2vh, 12px) 0; text-align: left; display: flex; flex-direction: column; justify-content: center;">
                        <strong style="color: var(--gold-bright); font-size: clamp(0.78rem, 0.90vw, 0.88rem); margin-bottom: 4px; letter-spacing: 0.5px;">4. LIBERAÇÃO AUTOMÁTICA DA ETAPA</strong>
                        <span style="color: var(--text-secondary); font-size: clamp(0.72rem, 0.80vw, 0.78rem); line-height: 1.55;">Assim que os arquivos forem publicados pela equipe, o acesso à <strong>Etapa 04 (A Lapidação)</strong> será liberado instantaneamente na sua tela com a transição cinematográfica.</span>
                    </div>
                `;
            }
        } else if (targetStep === 5) {
            if (badge) badge.style.display = 'none';
            if (title) title.textContent = 'A magia do reencontro está sendo finalizada...';
            if (subtitle) subtitle.textContent = '';
            if (statusText) statusText.textContent = 'Status: ETAPA 5 EM PRODUÇÃO.';
            if (body) {
                body.innerHTML = `
                    <div style="background: transparent; border: none; padding: clamp(6px, 1.2vh, 12px) 0; text-align: left; display: flex; flex-direction: column; justify-content: center;">
                        <strong style="color: var(--gold-bright); font-size: clamp(0.78rem, 0.90vw, 0.88rem); margin-bottom: 4px; letter-spacing: 0.5px;">1. VALIDAÇÃO DAS PRÉVIAS REGISTRADA</strong>
                        <span style="color: var(--text-secondary); font-size: clamp(0.72rem, 0.80vw, 0.78rem); line-height: 1.55;">Sua aprovação da nova imagem e da locução na voz clonada foi confirmada e encaminhada para a pós-produção cinematográfica final.</span>
                    </div>

                    <div style="background: transparent; border: none; padding: clamp(6px, 1.2vh, 12px) 0; text-align: left; display: flex; flex-direction: column; justify-content: center;">
                        <strong style="color: var(--gold-bright); font-size: clamp(0.78rem, 0.90vw, 0.88rem); margin-bottom: 4px; letter-spacing: 0.5px;">2. COMPUTAÇÃO GRÁFICA, SINCRONIZAÇÃO LABIAL & MASTERIZAÇÃO</strong>
                        <span style="color: var(--text-secondary); font-size: clamp(0.72rem, 0.80vw, 0.78rem); line-height: 1.55;">Nossa equipe está processando a sincronia labial ultra-realista, movimentos naturais dos olhos e expressões faciais, harmonização sonora e masterização em resolução cinematográfica.</span>
                    </div>

                    <div style="background: transparent; border: none; padding: clamp(6px, 1.2vh, 12px) 0; text-align: left; display: flex; flex-direction: column; justify-content: center;">
                        <strong style="color: var(--gold-bright); font-size: clamp(0.78rem, 0.90vw, 0.88rem); margin-bottom: 4px; letter-spacing: 0.5px;">3. AVISO POR E-MAIL E WHATSAPP</strong>
                        <span style="color: var(--text-secondary); font-size: clamp(0.72rem, 0.80vw, 0.78rem); line-height: 1.55;">Assim que a homenagem em vídeo for concluída e disponibilizada, você receberá um aviso imediato por <strong>E-mail</strong> e <strong>WhatsApp</strong> e poderá acessar a última etapa: o reencontro.</span>
                    </div>

                    <div style="background: transparent; border: none; padding: clamp(6px, 1.2vh, 12px) 0; text-align: left; display: flex; flex-direction: column; justify-content: center;">
                        <strong style="color: var(--gold-bright); font-size: clamp(0.78rem, 0.90vw, 0.88rem); margin-bottom: 4px; letter-spacing: 0.5px;">4. LIBERAÇÃO AUTOMÁTICA DA SALA DE REVELAÇÃO</strong>
                        <span style="color: var(--text-secondary); font-size: clamp(0.72rem, 0.80vw, 0.78rem); line-height: 1.55;">A etapa 05: O Reencontro será liberada instantaneamente com o player cinematográfico e as opções de download e encaminhamento para você vivenciar e guardar para sempre a homenagem.</span>
                    </div>
                `;
            }
        }

        // O botão dourado principal só permite fechar se for em ambiente de teste local (localhost).
        // Para o cliente real em produção, o botão exibe 'PRODUÇÃO EM ANDAMENTO' e permanece bloqueado até a equipe liberar.
        const btnClose = document.getElementById('btn-close-waiting-modal');
        if (btnClose) {
            if (isLocalhost) {
                btnClose.textContent = 'ENTENDI, AGUARDAR PRODUÇÃO (TESTE: FECHAR)';
                btnClose.style.cursor = 'pointer';
                btnClose.style.opacity = '1';
                btnClose.disabled = false;
            } else {
                btnClose.textContent = 'PRODUÇÃO EM ANDAMENTO';
                btnClose.style.cursor = 'not-allowed';
                btnClose.style.opacity = '0.85';
                btnClose.disabled = true;
            }
        }

        // Exibir botão de simulação apenas em ambiente local para testes
        if (btnSimulate) {
            btnSimulate.style.display = isLocalhost ? 'inline-block' : 'none';
        }

        // Salvar que o cliente está sob bloqueio
        localStorage.setItem('reviva_waiting_active', String(targetStep));

        modal.style.display = 'flex';
        if (window.lucide) lucide.createIcons();
    }

    function closeWaitingTeamModal() {
        if (!isLocalhost) {
            // Em produção/site real, o cliente NÃO pode fechar nem navegar para fora da tela de bloqueio
            return;
        }
        const modal = document.getElementById('modal-aguardando-equipe');
        if (modal) modal.style.display = 'none';
        currentWaitingStep = null;
        localStorage.removeItem('reviva_waiting_active');
    }

    window.closeWaitingTeamModal = closeWaitingTeamModal;

    function onTeamDeliveryDetected(targetStep) {
        const statusBox = document.getElementById('waiting-modal-status-box');
        const statusText = document.getElementById('waiting-modal-status-text');
        const dot = statusBox?.querySelector('.waiting-pulse-dot');
        
        if (dot) {
            dot.style.background = '#22c55e';
            dot.style.boxShadow = '0 0 14px #22c55e';
        }
        if (statusBox) {
            statusBox.style.background = 'rgba(34, 197, 94, 0.15)';
            statusBox.style.borderColor = 'rgba(34, 197, 94, 0.5)';
        }
        if (statusText) {
            statusText.style.color = '#4ade80';
            statusText.textContent = targetStep === 4 
                ? '✓ Prévias finalizadas pela equipe! Liberando Etapa 04...' 
                : '✓ Homenagem finalizada pela equipe! Liberando Sala de Revelação...';
        }

        setTimeout(() => {
            const modal = document.getElementById('modal-aguardando-equipe');
            if (modal) modal.style.display = 'none';
            currentWaitingStep = null;
            localStorage.removeItem('reviva_waiting_active');
            goToStep(targetStep);
        }, 1200);
    }

    function checkAndHandleTeamDelivery() {
        const modal = document.getElementById('modal-aguardando-equipe');
        const isModalOpen = modal && modal.style.display === 'flex';

        if (isModalOpen && currentWaitingStep) {
            if ((currentWaitingStep === 4 || currentWaitingStep === 'revisao') && isStage4ReadyFromTeam()) {
                onTeamDeliveryDetected(4);
            } else if (currentWaitingStep === 5 && isStage5ReadyFromTeam()) {
                onTeamDeliveryDetected(5);
            }
        }
    }

    function simulateTeamDelivery() {
        if (!currentWaitingStep) return;
        if (currentWaitingStep === 4 || currentWaitingStep === 'revisao') {
            localStorage.setItem('reviva_stage4_delivered', 'true');
            if (!localStorage.getItem('reviva_producer_image') && uploadedPhotos.length > 0) {
                localStorage.setItem('reviva_producer_image', uploadedPhotos[0].dataUrl);
            }
        } else if (currentWaitingStep === 5) {
            localStorage.setItem('reviva_stage5_delivered', 'true');
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

        // 1. Bloqueio da Etapa 04: depende dos envios da equipe (prévias de imagem e voz)
        if (step === 4 && !isStage4ReadyFromTeam()) {
            openWaitingTeamModal(4);
            return;
        }

        // 2. Bloqueio da Etapa 05: depende da conclusão e publicação do vídeo final pela equipe
        if (step === 5 && !isStage5ReadyFromTeam()) {
            openWaitingTeamModal(5);
            return;
        }

        if (!ENABLE_STEP_TRANSITIONS || immediate || step === currentStep) {
            executeStepSwitch(step);
        } else {
            triggerStageCurtainAnimation(step, () => {
                executeStepSwitch(step);
            });
        }
    }

    window.goToStep = goToStep;

    // Navegação interativa pelas bolinhas da linha do tempo:
    // Habilitada LIVREMENTE no localhost para seus testes rápidos.
    // BLOQUEADA no site publicado para que clientes e amigos sigam rigorosamente as etapas oficiais.
    document.querySelectorAll('.step-item').forEach(item => {
        if (!isLocalhost) {
            item.style.cursor = 'default';
        }
        item.addEventListener('click', (e) => {
            if (!isLocalhost) {
                // Em produção / site publicado, a linha do tempo é apenas indicativa
                return;
            }
            const targetStep = parseInt(item.dataset.step);
            if (targetStep && !isNaN(targetStep)) {
                goToStep(targetStep);
            }
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

    document.getElementById('btn-next-step-1')?.addEventListener('click', (e) => {
        if (e) e.preventDefault();
        const hasPhoto = uploadedPhotos && uploadedPhotos.length >= 1;
        const hasAudio = uploadedAudios && uploadedAudios.length >= 1;
        
        if (!hasPhoto || !hasAudio) {
            alert('Por favor, anexe pelo menos 1 foto e 1 áudio para avançar para a Etapa 2.');
            return;
        }

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
    const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-3.5-flash', 'gemini-flash-latest'];

    const interviewChatBox = document.getElementById('interview-chat-box');
    const chatInput = document.getElementById('chat-input');
    const btnSendChat = document.getElementById('btn-send-chat');
    const chatTypingIndicator = document.getElementById('chat-typing-indicator');

    let geminiChatHistory = [];
    let isWaitingGemini = false;

    function getIasisSystemPrompt() {
        resolveClientIdentity();
        return `
Você é o Iasis, o guia e roteirista afetivo da Reviva Memories.
Seu propósito é conversar com o cliente (${clientFirstName}) de forma genuinamente HUMANA, calorosa, empática e acolhedora, como um amigo atencioso e sensível que está ajudando a eternizar a memória e a voz de alguém muito querido.

DIRETRIZES DE LINGUAGEM E HUMANIZAÇÃO REAL:
- FALE DE FORMA NATURAL, FLUIDA E AFETIVA (como uma pessoa de verdade falando em bom português brasileiro).
- NUNCA use frases robóticas, burocráticas ou engessadas como:
  * PROIBIDO: "Compreendo perfeitamente"
  * PROIBIDO: "a pessoa que protagonizará a homenagem e que transmitirá a mensagem com sua imagem e voz"
  * PROIBIDO: "É uma honra iniciarmos essa jornada juntos"
  * PROIBIDO: "Registrado com todo o respeito e consideração"
- USE LINGUAGEM ACOLHEDORA E ESPONTÂNEA:
  * "Que alegria falar com você, ${clientFirstName}!"
  * "Que nome forte e especial..."
  * "Que lembrança linda..."
  * "Tenho certeza de que vamos criar uma homenagem inesquecível."
- IDENTIDADE: Você é o Iasis, um homem maduro, sereno, sábio e muito carinhoso. Sempre use concordância masculina ao falar de si ("estou aqui para te ajudar", "vamos juntos").
- ESCUTA ATIVA: Sempre reaja ao que o cliente acabou de dizer com sensibilidade antes de fazer a próxima pergunta. Por exemplo, se ele disser o nome do pai ou da mãe, valorize esse nome; se contar uma história, comova-se ou sorria com a lembrança.

PLANO CONTRATADO:
- Plano: ${currentPlan.name} (${currentPlan.durationMinutes} Minuto${currentPlan.durationMinutes > 1 ? 's' : ''})
- Meta de Palavras do Roteiro: ${currentPlan.targetWords} palavras (COMPROMISSO INEGOCIÁVEL: o roteiro final deve ter volume suficiente para preencher com folga a minutagem da locução, nunca menos de 120 palavras para 1 min, 240 palavras para 2 min, 360 palavras para 3 min).

ROTEIRO DA ENTREVISTA (FAÇA UMA PERGUNTA POR VEZ, REAGINDO SEMPRE COM AFETO):
1. NOME: Perguntar quem é a pessoa que vai falar no vídeo e trazer essa mensagem de afeto.
2. DESTINATÁRIO: Acolher o nome com carinho e perguntar se o vídeo é para o próprio cliente ou se ele vai presentear alguém especial.
3. LAÇO/PARENTESCO: Perguntar qual era a relação ou parentesco entre eles (Pai e Filho, Avó e Neto, Irmãos, Amigos, etc.).
4. APELIDO/TRATAMENTO: Perguntar como costumavam se chamar carinhosamente no dia a dia (por apelido ou pelo próprio nome).
5. OCASIÃO: Perguntar qual é a ocasião especial da homenagem (aniversário, formatura, casamento, ou um abraço de saudade e reencontro).
6. HISTÓRIA/LEMBRANÇA: Perguntar se há algum acontecimento marcante, história inesquecível ou momento especial vivido juntos para recordar.
7. CONSELHOS/VALORES: Perguntar quais os maiores conselhos, valores de vida ou palavras de força que a pessoa sempre dizia.
8. OUTROS FAMILIARES: Perguntar se há outros parentes ou amigos queridos que devem receber um abraço carinhoso no vídeo.
9. TOM DA VOZ: Perguntar se prefere um tom mais alegre e bem-humorado/descontraído, ou um tom profundamente emocionante e terno.
10. DETALHE EXTRA FINAL: Antes de redigir, perguntar se há mais algum detalhe, piada de família ou frase marcante para incluir.

FINALIZAÇÃO E ENTREGA DO ROTEIRO (SOMENTE APÓS A RESPOSTA DO ITEM 10):
Quando o cliente responder ao item 10, diga com carinho: "Por favor, aguarde um instante enquanto preparo o roteiro oficial com todo o amor e respeito..." e adicione:
[[ROTEIRO_FINAL]]
seguido do texto completo do roteiro em primeira pessoa (a voz da pessoa homenageada falando diretamente ao destinatário), com abertura alegre e calorosa, parágrafos bem espaçados, histórias reais, conselhos, recados e bênção de Deus no final.

REVISÃO E EDIÇÃO:
Se o cliente pedir ajustes, acolha com carinho, faça as correções com base no que ele pediu e entregue o roteiro revisado com a tag [[ROTEIRO_FINAL]].`;
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
        const storedTermo = localStorage.getItem('reviva_legal_term');
        if (storedTermo) {
            const parsed = JSON.parse(storedTermo);
            if (parsed && parsed.signed) legalTermSigned = parsed;
        }
    } catch(e) {}
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
                musicManuallyChosen,
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
                                
                                const wordCount = latestScriptText.trim().split(/\s+/).filter(w => w.length > 0).length;
                                if (window.revivaData?.saveApprovedScript) {
                                    await window.revivaData.saveApprovedScript(orderData?.id || 1, latestScriptText, wordCount);
                                }

                                if (typeof updateScriptApprovedUI === 'function') {
                                    updateScriptApprovedUI(true);
                                }

                                const thankMsg = `Muito obrigado por sua aprovação e confiança, ${clientFirstName || 'cliente'}! O roteiro oficial está confirmado com sucesso e a próxima etapa (<strong>Etapa 03: A Harmonização</strong>) já está liberada para você. Clique no botão <strong>AVANÇAR</strong> abaixo para continuarmos!`;
                                addAiChatMessage(thankMsg);

                                saveFullSessionState();
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
                if (k && (k.startsWith('reviva_order_state_') || k.startsWith('reviva_full_session_state') || k === 'reviva_active_step' || k === 'reviva_chat_session' || k.startsWith('reviva_producer_') || k.startsWith('reviva_stage') || k === 'reviva_media_revisions')) {
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
                
                if (window.revivaData?.saveApprovedScript) {
                    await window.revivaData.saveApprovedScript(orderData?.id || 1, scriptContent, wordCount);
                }

                // Ocultar input/enviar e exibir o botão AVANÇAR
                updateScriptApprovedUI(true);

                // Mensagem carinhosa do Iasis agradecendo e liberando a próxima etapa
                const thankMsg = `Muito obrigado por sua aprovação e confiança, ${clientFirstName || 'cliente'}! O roteiro oficial está confirmado com sucesso e a próxima etapa (<strong>Etapa 03: A Harmonização</strong>) já está liberada para você. Clique em <strong>AVANÇAR</strong> abaixo para continuarmos!`;
                addAiChatMessage(thankMsg);

                saveChatSession();
                saveFullSessionState();
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

            if (isScriptApproved) {
                updateScriptApprovedUI(true);
            } else {
                if (btnSendChat) btnSendChat.disabled = false;
                if (chatInput) {
                    chatInput.disabled = false;
                    chatInput.focus();
                }
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
                chat: `Que alegria falar com você, ${clientFirstName}! Estou aqui para te ajudar a criar uma homenagem linda, emocionante e cheia de carinho.<br><br>Para a gente começar: quem é a pessoa que vai falar no vídeo e trazer essa mensagem de afeto?`
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
                    chat: `O(A) <strong>${interviewData.protagonista}</strong>... Que nome forte e cheio de história! Tenho certeza de que faremos algo lindo com a voz e a presença dele(a).<br><br>E me conta, ${clientFirstName}: essa homenagem é um presente para você mesmo(a) ou você está preparando essa surpresa para alguém especial?`
                };

            case 'ask_destinatario':
                interviewData.destinatario = (lower.includes('mim') || lower.includes('mesma') || lower.includes('eu')) ? clientFirstName : text;
                currentQuestionStep = 'ask_parentesco';
                const destNome = interviewData.destinatario === clientFirstName ? 'você' : interviewData.destinatario;
                return {
                    chat: `Que gesto maravilhoso e cheio de significado!<br><br>E qual era o laço de carinho ou parentesco entre o(a) ${interviewData.protagonista} e ${destNome} (por exemplo: Pai e Filho, Avó e Neto, Irmãos, Amigos)?`
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
                interviewData.tom = text;
                currentQuestionStep = 'ask_personalizacao_extra';
                if (currentPlan.durationMinutes >= 2) {
                    return {
                        chat: `Excelente escolha de tom, ${clientFirstName}! Ficará sublime.<br><br>Como você contratou o <strong>Plano ${currentPlan.name} (${currentPlan.durationMinutes} Minutos)</strong>, temos um espaço generoso e muito especial na narrativa: <strong>há mais alguma lembrança, história marcante, hábitos, piadas de família, frases características ou conselhos que você gostaria que o(a) ${interviewData.protagonista || 'protagonista'} dissesse</strong> para deixar o roteiro ainda mais rico, único e personalizado?`
                    };
                } else {
                    return {
                        chat: `Excelente escolha de tom, ${clientFirstName}!<br><br>Antes de eu começar a estruturar o roteiro oficial com todo o carinho: <strong>há mais algum detalhe específico, frase marcante ou lembrança que você gostaria de acrescentar</strong> para que a homenagem fique ainda mais personalizada?`
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
                    script = `Olha só pra você, ${apelido}! Quem diria, hein?! Achou mesmo que eu ia perder essa festa e deixar você comemorar sem ouvir a minha voz? Jamais!\n\nEu dou risada só de lembrar de ${historia}.${extraFragmento} Bons tempos aqueles! Mas falando sério, meu coração se enche de orgulho de ver você brilhando. Meu único conselho: ${conselhos}. E trate de dar um abraço bem forte em ${familiares}, que eu tô de olho em vocês daqui!\n\nReceba o meu melhor abraço, cheio de energia boa e alegria. Um beijo estalado e vamos comemorar que a vida é pra ser vivida!`;
                } else if (currentPlan.durationMinutes === 1) {
                    script = `Olha só pra você, ${apelido}! Achou mesmo que eu deixaria de estar presente neste dia tão marcante? Que alegria imensa poder falar com você agora!\n\nEu guardo com tanto carinho no meu peito cada segundo que estivemos juntos... Lembro como se fosse hoje de ${historia}.${extraFragmento} Saiba que mesmo na distância, meu afeto por você permanece vivo e vibrante. Quero que você nunca esqueça: ${conselhos}. Tenha orgulho dos seus passos e cuide sempre de ${familiares}.\n\nReceba o meu abraço mais apertado, cheio de luz e boas lembranças. Fique em paz e continue brilhando!`;
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

    function handleAudioFiles(files) {
        const remainingSlots = 3 - uploadedAudios.length;
        if (remainingSlots <= 0) return;

        const filesToProcess = Array.from(files).slice(0, remainingSlots);
        filesToProcess.forEach(file => {
            const url = URL.createObjectURL(file);
            uploadedAudios.push({
                name: file.name,
                size: (file.size / 1024 / 1024).toFixed(1) + ' MB',
                url: url,
                file: file
            });
        });
        renderAudioPreviews();
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

        if (photoCard) {
            photoCard.classList.remove('card-approved', 'card-rejected', 'zone-filled', 'zone-empty');
        }

        if (status === 'approved' || status === true) {
            photoDecision = 'approved';
            isPhotoApprovedState = true;
            if (photoCard) photoCard.classList.add('card-approved', 'zone-filled');
            if (btnApprove) btnApprove.classList.add('is-selected');
            if (btnApproveText) btnApproveText.textContent = 'IMAGEM APROVADA ✓';
            
            if (btnReject) btnReject.classList.remove('is-selected');
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

        if (voiceCard) {
            voiceCard.classList.remove('card-approved', 'card-rejected', 'zone-filled', 'zone-empty');
        }

        if (status === 'approved' || status === true) {
            voiceDecision = 'approved';
            isVoiceApprovedState = true;
            if (voiceCard) voiceCard.classList.add('card-approved', 'zone-filled');
            if (btnApprove) btnApprove.classList.add('is-selected');
            if (btnApproveText) btnApproveText.textContent = 'VOZ APROVADA ✓';

            if (btnReject) btnReject.classList.remove('is-selected');
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

        // Se houver reprovação de imagem ou voz: marca etapa como aguardando nova entrega da equipe
        localStorage.setItem('reviva_stage4_delivered', 'false');
        saveFullSessionState();

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

    const btnGoToRevealRoom = document.getElementById('btnGoToRevealRoom');
    if (btnGoToRevealRoom) {
        btnGoToRevealRoom.addEventListener('click', () => {
            btnGoToRevealRoom.href = getRevealPageUrl();
        });
    }

    // Função global explícita de cópia para garantir acionamento direto e feedback instantâneo
    window.copiarLinkWhatsApp = function(event) {
        if (event) event.preventDefault();
        
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

        if (isViewOnly && legalTermSigned) {
            if (btnCloseView) btnCloseView.style.display = 'block';
            if (btnSubmit) btnSubmit.style.display = 'none';
            if (inputName) { inputName.value = legalTermSigned.name; inputName.disabled = true; }
            if (inputCpf) { inputCpf.value = legalTermSigned.cpf; inputCpf.disabled = true; }
            if (inputNarrator) { inputNarrator.value = legalTermSigned.relationNarrator || legalTermSigned.relation || 'Filho(a)'; inputNarrator.disabled = true; }
            if (inputRecipient) { inputRecipient.value = legalTermSigned.relationRecipient || 'Sou eu mesmo(a)'; inputRecipient.disabled = true; }
            if (chkAccept) { chkAccept.checked = true; chkAccept.disabled = true; }
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
        // Se ainda não assinou e não é modo visualização, não permite fechar
        if (!legalTermSigned || !legalTermSigned.signed) {
            return;
        }
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
    const STORAGE_BUILD_KEY = 'reviva_storage_build_v6';
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

    if (initialStep === 4 && !isStage4ReadyFromTeam()) {
        initialStep = 3;
    } else if (initialStep === 5 && !isStage5ReadyFromTeam()) {
        initialStep = 4;
    }

    const shouldShowCurtainOnEnter = localStorage.getItem('reviva_show_curtain_on_enter') === 'true' || urlParams.has('showCurtain');
    if (shouldShowCurtainOnEnter) {
        localStorage.removeItem('reviva_show_curtain_on_enter');
        goToStep(initialStep, false); // dispara a cortina cinematográfica da etapa!
    } else {
        goToStep(initialStep, true);
    }

    // Reabertura do bloqueio se o cliente recarregar a página com produção pendente
    const pendingWaiting = localStorage.getItem('reviva_waiting_active');
    if (pendingWaiting) {
        setTimeout(() => {
            const stepVal = (!isNaN(parseInt(pendingWaiting)) && pendingWaiting !== 'revisao') 
                ? parseInt(pendingWaiting) 
                : pendingWaiting;
            openWaitingTeamModal(stepVal);
        }, 100);
    }

    // 3. Se o termo de responsabilidade ainda não foi aceito, abre o modal imediatamente na entrada do painel
    if (!legalTermSigned || !legalTermSigned.signed) {
        setTimeout(() => {
            if (typeof openTermoModal === 'function') openTermoModal(false);
        }, 350);
    }

    // 3. Suporte a navegação por histórico/hash (voltar/avançar no navegador)
    window.addEventListener('hashchange', () => {
        const match = window.location.hash.match(/step-(\d+)/);
        if (match) {
            const target = parseInt(match[1]);
            if (target && target !== currentStep && target >= 1 && target <= 5) {
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
