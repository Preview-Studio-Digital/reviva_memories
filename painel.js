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
    let selectedBackground = 'jardim';
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
    // NAVEGAÇÃO ENTRE AS 4 ETAPAS OFICIAIS
    // =========================================================================
    function goToStep(step) {
        currentStep = step;
        
        // Atualiza a barra de progresso (4 passos = 0%, 33%, 66%, 100%)
        document.querySelectorAll('.step-item').forEach(item => {
            const s = parseInt(item.dataset.step);
            item.classList.remove('active', 'completed');
            if (s === step) item.classList.add('active');
            if (s < step) item.classList.add('completed');
        });

        // Atualiza os fios conectores de ouro entre as etapas
        const fill1 = document.getElementById('stepper-fill-1');
        const fill2 = document.getElementById('stepper-fill-2');
        const fill3 = document.getElementById('stepper-fill-3');
        if (fill1) fill1.style.width = step >= 2 ? '100%' : '0%';
        if (fill2) fill2.style.width = step >= 3 ? '100%' : '0%';
        if (fill3) fill3.style.width = step >= 4 ? '100%' : '0%';

        // Oculta e exibe seções
        document.querySelectorAll('.step-section').forEach(sec => sec.style.display = 'none');
        const targetSec = document.getElementById(`step-${step}`);
        if (targetSec) targetSec.style.display = 'flex';

        // Oculta e exibe barras de ações externas
        document.querySelectorAll('.footer-step-actions').forEach(footer => footer.style.display = 'none');
        const targetFooter = document.getElementById(`footer-step-${step}`);
        if (targetFooter) targetFooter.style.display = 'flex';

        if (step === 2) {
            startInterviewChat();
        }

        if (window.lucide) window.lucide.createIcons();
    }

    window.goToStep = goToStep;

    // Permitir navegação ao clicar nos passos do stepper
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

    document.querySelectorAll('#background-list .scenario-card-full').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('#background-list .scenario-card-full').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedBackground = card.dataset.bg;

            // No Desktop: Mover o card selecionado para o topo da lista
            const container = document.getElementById('scenariosContainer');
            if (container && container.firstElementChild !== card) {
                container.prepend(card);
            }
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
        if (!uploadedPhotos || uploadedPhotos.length === 0) {
            openPhotoAlertModal();
            return;
        }

        goToStep(2);
    });

    // =========================================================================
    // ETAPA 02: A ESSÊNCIA (INTELIGÊNCIA REAL IASIS COM GEMINI API)
    // =========================================================================
    const GEMINI_API_KEY = window.ENV_GEMINI_API_KEY || localStorage.getItem('gemini_api_key') || (typeof atob !== 'undefined' ? atob('QVEuQWI4Uk42TFBBTFZRMmNXZ0dvVUFGVTBvaHpxRnlGaXJUMUxocWpIdVd0c3RTR0xTdw==') : '');
    const GEMINI_MODELS = ['gemini-flash-latest', 'gemini-3.5-flash', 'gemini-3-flash-preview', 'gemini-2.5-flash'];

    const interviewChatBox = document.getElementById('interview-chat-box');
    const chatInput = document.getElementById('chat-input');
    const btnSendChat = document.getElementById('btn-send-chat');
    const scriptEditor = document.getElementById('script-editor');
    const chatTypingIndicator = document.getElementById('chat-typing-indicator');

    let geminiChatHistory = [];
    let isWaitingGemini = false;

    const IASIS_SYSTEM_PROMPT = `
Você é o Iasis, o guia oficial e inteligência afetiva da Reviva Memories.
Seu propósito é conduzir uma conversa genuinamente humana, empática e acolhedora com o cliente (${clientFirstName}) para coletar memórias e desenvolver o roteiro do vídeo de homenagem (com imagem restaurada e voz clonada do ente querido).

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
- NUNCA faça perguntas frias, robóticas ou desconectadas da fala anterior (ex: NUNCA diga apenas "Obrigado. Próxima pergunta...").
- SEMPRE costure a resposta do cliente na sua próxima frase com afeto, empatia e sentido.
- Se o cliente responder de forma muito breve ou pouco clara, NUNCA dê desculpas técnicas. Pergunte com carinho e educação o que ele quis dizer para enriquecer o roteiro (ex: "Compreendo, Mariana! Para eu capturar esse laço com toda a riqueza, você poderia me contar um pouquinho mais sobre o que quis dizer?").
- Se o cliente contar uma lembrança emocionante, um momento especial ou um apelido carinhoso, reconheça e valorize esse detalhe com carinho genuíno antes de fazer a próxima pergunta.

REGRAS DE COMUNICAÇÃO:
1. RESPOSTAS CONCISAS E ENVOLVENTES: Mantenha entre 2 a 3 frases curtas por mensagem durante a entrevista. Seja caloroso, nunca prolixo.
2. UMA PERGUNTA POR VEZ: Nunca acumule perguntas.
3. FOCO ESTRITO NA HOMENAGEM: Nunca fale sobre programação, código, tecnologia interna ou assuntos alheios. Se houver desvios, retome o roteiro em 1 frase delicada.

ETAPAS DA COLETA AFETIVA (UMA PERGUNTA POR TURNO COM COSTURA AFETIVA):
1. NOME DO ENTE QUERIDO: Coletar o nome do ente querido que apresentará a mensagem com sua imagem e voz.
2. DESTINATÁRIO DA HOMENAGEM: Acolher o nome do ente querido e perguntar se a homenagem é para o próprio cliente ou se ele vai presentear alguém especial (ex: "Faremos uma bela homenagem com a imagem e a voz do José! E para quem será a homenagem? É para você mesma ou você vai presentear alguém com essa surpresa?").
3. LAÇO AFETIVO / PARENTESCO: Acolher o destinatário com afeto e perguntar APENAS qual era o laço afetivo / grau de parentesco entre eles (ex: "Que gesto maravilhoso presentear a Mariana! Qual era o laço afetivo entre o José e ela (ex: Pai e Filha, Avó e Neto)?").
4. FORMA DE TRATAMENTO / APELIDO: Acolher o laço com sensibilidade e perguntar APENAS como ele costumava chamá-la carinhosamente (ex: "E como ele costumava chamá-la carinhosamente? Pelo próprio nome ou por algum apelido carinhoso?").
5. OCASIÃO ESPECIAL (SOMENTE APÓS O LAÇO E APELIDO): Acolher e perguntar sobre a ocasião especial em que a homenagem será apresentada (ex: "Que carinho lindo! E qual é a ocasião especial dessa homenagem? É um aniversário, casamento, formatura, ou um momento de conforto e carinho?").
6. HISTÓRIA / ACONTECIMENTO MARCANTE: ${currentPlan.durationMinutes >= 2 ? 'Perguntar: "Para o Plano ' + currentPlan.name + ', temos espaço para relembrar histórias ricas: existe algum acontecimento inesquecível, história marcante ou momento de convivência que eles viveram juntos que vale a pena recordar com carinho?"' : 'Perguntar: "Existe algum acontecimento ou frase marcante que o(a) [Nome do Ente Querido] diria à [Nome/Apelido da homenageada] que seria profundamente impactante e especial para ela ouvir?"'}
7. CONSELHOS OU INCENTIVO: Perguntar de forma simples e direta: "Quais conselhos ou palavras de carinho e incentivo o(a) [Nome do Ente Querido] daria para a [Nome/Apelido da homenageada]?"
8. RECADOS PERSONALIZADOS PARA A FAMÍLIA: ${currentPlan.durationMinutes >= 2 ? 'Perguntar: "No Plano ' + currentPlan.name + ', temos espaço dedicado para mensagens para outros entes queridos: quais familiares próximos (mãe, pai, irmãos, filhos, cônjuge) devem receber recados personalizados e o que ele(a) diria especificamente a cada um antes da bênção final?"' : 'Perguntar: "Quais outros familiares ou pessoas queridas não podem deixar de receber um abraço apertado e uma bênção no final da mensagem?"'}

FINALIZAÇÃO E ENTREGA DO ROTEIRO:
Assim que todas as informações forem compartilhadas, avise em uma frase emocionante que o roteiro foi estruturado e adicione no final:
[[ROTEIRO_FINAL]]
seguido do texto completo do roteiro da homenagem, redigido em PRIMEIRA PESSOA (a voz do ente querido para a pessoa homenageada), aplicando a cadência de ABERTURA ALEGRE E EMPOLGADA -> DESENVOLVIMENTO COM MEMÓRIAS E RECADOS -> CLÍMAX DRAMÁTICO E SUBLIME, respeitando estritamente o PLANO ${currentPlan.name.toUpperCase()} (duração de ${currentPlan.durationMinutes} minuto(s), meta de ${currentPlan.targetWords}, limite absoluto de ${currentPlan.maxChars} caracteres).
`;

    function formatAiMessage(txt) {
        if (!txt) return '';
        return txt.replace(/\n\n+/g, '<br><br>').replace(/\n/g, '<br>');
    }

    function startInterviewChat() {
        if (interviewChatBox && interviewChatBox.children.length === 0) {
            const firstMessage = `Olá, ${clientFirstName}! Eu sou o Iasis, seu guia aqui na Reviva Memories.<br><br>Faremos agora uma breve conversa para capturar as memórias, o afeto e os detalhes necessários para o desenvolvimento do roteiro personalizado da homenagem.<br><br>Podemos começar?`;
            
            geminiChatHistory = [
                {
                    role: 'model',
                    parts: [{ text: `Olá, ${clientFirstName}! Eu sou o Iasis, seu guia aqui na Reviva Memories. Faremos agora uma breve conversa para capturar as memórias, o afeto e os detalhes necessários para o desenvolvimento do roteiro personalizado da homenagem. Podemos começar?` }]
                }
            ];

            addAiChatMessage(firstMessage);
            updateScriptStats('');
        }
    }

    function addAiChatMessage(text, callback) {
        if (btnSendChat) btnSendChat.disabled = true;
        if (chatInput) chatInput.disabled = true;
        if (chatTypingIndicator) chatTypingIndicator.style.display = 'flex';
        interviewChatBox.scrollTop = interviewChatBox.scrollHeight;

        setTimeout(() => {
            if (chatTypingIndicator) chatTypingIndicator.style.display = 'none';

            const row = document.createElement('div');
            row.className = 'chat-message-row chat-ai-row';
            row.innerHTML = `
                <img src="iasis_avatar.jpg" alt="Iasis" class="chat-avatar-circle">
                <div class="chat-bubble-compact chat-ai">
                    <strong style="color: #e5c378;">Iasis:</strong><br>
                    ${text}
                </div>
            `;
            interviewChatBox.appendChild(row);
            interviewChatBox.scrollTop = interviewChatBox.scrollHeight;

            if (btnSendChat) btnSendChat.disabled = false;
            if (chatInput) {
                chatInput.disabled = false;
                chatInput.focus();
            }
            if (callback) callback();
        }, 1100);
    }

    function addUserChatMessage(text) {
        const row = document.createElement('div');
        row.className = 'chat-message-row chat-user-row';
        row.innerHTML = `
            <div class="chat-bubble-compact chat-user">
                ${text}
            </div>
        `;
        interviewChatBox.appendChild(row);
        interviewChatBox.scrollTop = interviewChatBox.scrollHeight;
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

    async function handleChatSubmit() {
        const text = chatInput.value.trim();
        if (!text || isWaitingGemini) return;

        addUserChatMessage(text);
        chatInput.value = '';

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

            if (!rawAiText) {
                addAiChatMessage("Compreendo, Mariana. Poderia me explicar um pouco mais com suas palavras para que eu possa incluir no roteiro?");
                return;
            }

            geminiChatHistory.push({
                role: 'model',
                parts: [{ text: rawAiText }]
            });

            // Verificar se o roteiro final foi gerado
            if (rawAiText.includes('[[ROTEIRO_FINAL]]')) {
                const parts = rawAiText.split('[[ROTEIRO_FINAL]]');
                const chatPart = parts[0].trim();
                const scriptPart = parts[1].trim();

                addAiChatMessage(formatAiMessage(chatPart), () => {
                    startPoeticGeneration(scriptPart);
                });
            } else {
                addAiChatMessage(formatAiMessage(rawAiText));
            }
        } catch (error) {
            console.error("Erro no processamento do Iasis:", error);
            addAiChatMessage("Compreendo! Para eu registrar com todo o carinho no roteiro, você poderia me detalhar um pouquinho mais?");
        } finally {
            isWaitingGemini = false;
        }
    }

    btnSendChat?.addEventListener('click', handleChatSubmit);
    chatInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleChatSubmit();
    });

    document.getElementById('btn-back-step-2')?.addEventListener('click', () => goToStep(1));

    function startPoeticGeneration(finalScriptText) {
        const loadingState = document.getElementById('script-loading-state');
        const phraseEl = document.getElementById('poetic-phrase');
        
        if (loadingState) loadingState.style.display = 'flex';

        let phraseIndex = 0;
        const phraseInterval = setInterval(() => {
            phraseIndex = (phraseIndex + 1) % poeticPhrases.length;
            if (phraseEl) phraseEl.textContent = poeticPhrases[phraseIndex];
        }, 1400);

        // 4 segundos de espera simbólica para valorizar a lapidação artística
        setTimeout(() => {
            clearInterval(phraseInterval);
            if (loadingState) loadingState.style.display = 'none';
            if (scriptEditor) {
                scriptEditor.value = finalScriptText;
                updateScriptStats(finalScriptText);
            }
        }, 4200);
    }

    if (scriptEditor) {
        scriptEditor.setAttribute('maxlength', currentPlan.maxChars);
    }

    function updateScriptStats(text) {
        const rawText = text || '';
        const chars = rawText.length;
        const words = rawText.trim().split(/\s+/).filter(w => w.length > 0).length;
        const statsEl = document.getElementById('script-stats');
        if (statsEl) {
            const minutes = (words / 115).toFixed(1);
            const isNearLimit = chars >= currentPlan.maxChars * 0.95;
            statsEl.style.borderColor = isNearLimit ? '#e74c3c' : 'rgba(197, 160, 89, 0.35)';
            statsEl.style.color = isNearLimit ? '#e74c3c' : '#e5c378';
            statsEl.textContent = `${chars}/${currentPlan.maxChars} carac. • ${words} palavras • ~${minutes} min`;
        }
    }

    scriptEditor?.addEventListener('input', () => updateScriptStats(scriptEditor.value));

    document.getElementById('btn-approve-script')?.addEventListener('click', async () => {
        const scriptText = scriptEditor ? scriptEditor.value : '';
        const wordCount = scriptText.trim().split(/\s+/).filter(w => w.length > 0).length;

        if (window.revivaData?.saveApprovedScript) {
            await window.revivaData.saveApprovedScript(orderData?.id || 1, scriptText, wordCount);
        }
        goToStep(3);
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

    // Seletor de Trilha Sonora
    document.querySelectorAll('#music-grid .music-option-card').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('#music-grid .music-option-card').forEach(c => {
                c.classList.remove('selected');
                const check = c.querySelector('span:last-child');
                if (check) check.style.display = 'none';
            });
            card.classList.add('selected');
            const check = card.querySelector('span:last-child');
            if (check) check.style.display = 'inline';
            selectedMusic = card.dataset.music;
        });
    });

    // Player de Amostra de Voz Clonada Customizado (Etapa 3)
    const btnPlayVoiceSample = document.getElementById('btnPlayVoiceSample');
    const voiceSampleAudio = document.getElementById('voiceSampleAudio');
    const voiceSampleProgress = document.getElementById('voiceSampleProgress');
    const voiceSampleTime = document.getElementById('voiceSampleTime');

    if (btnPlayVoiceSample && voiceSampleAudio) {
        btnPlayVoiceSample.addEventListener('click', (e) => {
            e.stopPropagation();
            if (voiceSampleAudio.paused) {
                voiceSampleAudio.currentTime = 0;
                voiceSampleAudio.play().then(() => {
                    btnPlayVoiceSample.innerHTML = '<i data-lucide="pause" style="width: 12px; height: 12px;"></i>';
                    if (window.lucide) lucide.createIcons();
                }).catch(err => console.log("Sample play blocked:", err));
            } else {
                voiceSampleAudio.pause();
                btnPlayVoiceSample.innerHTML = '<i data-lucide="play" style="width: 12px; height: 12px;"></i>';
                if (window.lucide) lucide.createIcons();
            }
        });

        voiceSampleAudio.addEventListener('timeupdate', () => {
            if (!voiceSampleAudio.duration) return;
            const pct = (voiceSampleAudio.currentTime / voiceSampleAudio.duration) * 100;
            if (voiceSampleProgress) voiceSampleProgress.style.width = `${pct}%`;
            const rem = Math.max(0, Math.ceil(voiceSampleAudio.duration - voiceSampleAudio.currentTime));
            if (voiceSampleTime) voiceSampleTime.textContent = `00:0${rem}`;
        });

        voiceSampleAudio.addEventListener('ended', () => {
            btnPlayVoiceSample.innerHTML = '<i data-lucide="play" style="width: 12px; height: 12px;"></i>';
            if (voiceSampleProgress) voiceSampleProgress.style.width = '0%';
            if (voiceSampleTime) voiceSampleTime.textContent = '00:08';
            if (window.lucide) lucide.createIcons();
        });
    }

    document.getElementById('btn-back-step-3')?.addEventListener('click', () => goToStep(2));

    document.getElementById('btn-approve-lapidacao')?.addEventListener('click', async () => {
        if (window.revivaData?.saveMediaApproval) {
            await window.revivaData.saveMediaApproval(orderData?.id || 1, true, true);
        }
        goToStep(4);
    });

    // =========================================================================
    // ETAPA 04: O REENCONTRO (AÇÕES & COMPARTILHAMENTO)
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
});
