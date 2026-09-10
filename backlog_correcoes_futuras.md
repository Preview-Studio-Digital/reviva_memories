# Backlog de Correções Futuras - Reviva Memories

Documento destinado a registrar problemas identificados e melhorias a serem implementadas nas próximas iterações.

---

### 1. IASIS - Tom de Voz, Personalidade e Dinâmica de Perguntas [✓ CONCLUÍDO]
- **Status:** Implementado no prompt oficial do Gemini (`getIasisSystemPrompt`) e na máquina semântica de fallback (`generateSmartInterviewResponse`) em `painel.js`.
- **Ajustes Realizados:**
  - **Persona e Tom de Voz:** Calibrado para um homem maduro, sereno, respeitoso, formal, empático e acolhedor.
  - **Vocabulário Blindado:** Foram expressamente proibidos termos melosos, excessivamente doces ou afeminados (*"que lindo..."*, *"que amor..."*, *"que delicadeza..."*, *"que doçura..."*), substituídos por respostas sóbrias e dignas (*"Compreendo"*, *"Uma bela e marcante lembrança"*, *"Um nome com grande força e significado"*).
  - **Regra de Uma Pergunta por Vez:** Proibição explícita e estrita de perguntas duplas ou compostas na mesma mensagem. Cada turno do IASIS agora formula exatamente uma única pergunta clara, direta e objetiva.

---

### 2. Fluxo Pós-Envio da Etapa 3 (Trilha e Ambiente), Redirecionamento e Design da Tela de Bloqueio [✓ CONCLUÍDO]
- **Status:** Implementado em `painel.html` e `painel.js`.
- **Ajustes Realizados:**
  1. **Tela de Bloqueio Cinematográfica Permanente:** O modal `#modal-aguardando-equipe` foi completamente redesenhado herdando 100% da linguagem nobre das telas de transição (`.fullscreen-stage-curtain`), com aura cósmica pulsante, tipografia majestosa em Cormorant Garamond e divisor refinado com losango dourado (`❖`).
  2. **Distinção Cromática Rigorosa (Vermelho vs. Verde):**
     - **Estado Bloqueado (Vermelho / Rubi / Bordô + Dourado):** Exibido quando a etapa está aguardando liberação da equipe (avanço da Etapa 3 para 4, reprovação de prévias para ajustes ou aprovação de prévias aguardando a finalização da Etapa 5). Apresenta aura rubi, badge e bordas em carmesim com dourado, status em vermelho e o botão nobre **"SAIR DO PAINEL"** com ícone `log-out`.
     - **Estado Liberado (Verde / Esmeralda + Dourado):** Exibido assim que a equipe técnica entrega os materiais (detectado dinamicamente via polling/tempo real ou ao entrar). Transforma o modal para esmeralda vivo com badge e bordas verdes, status de confirmação e botão de ação para avançar (**"AVANÇAR PARA AS PRÉVIAS"** na Etapa 4 ou **"ACESSAR SALA DE REVELAÇÃO"** na Etapa 5).
  3. **Comando de Saída e Persistência de Sessão:** O cliente não pode fechar o modal ou interagir com o painel por trás enquanto estiver bloqueado. A saída ocorre exclusivamente pelo botão **"SAIR DO PAINEL"**, que direciona para a página inicial oficial (`index.html`). O estado de bloqueio (`reviva_waiting_active`) permanece salvo, de modo que ao autenticar novamente no `login.html`, o cliente é recepcionado diretamente pela mesma tela de espera com o estado e a cor correspondente.

---

### 3. Persistência de Estado, Revalidação de Sessão e Termo de Responsabilidade [✓ CONCLUÍDO]
- **Status:** Implementado em `painel.js`, `termo.html`, `login.html` e `painel.html`.
- **Ajustes Realizados:**
  1. **Eliminação de Cobrança Redundante do Termo:**
     - Uma vez assinado pelo cliente (`reviva_legal_term`, chaves vinculadas ao ID do pedido ou `reviva_full_session_state`), o sistema não solicita novamente a assinatura.
     - Ao acessar `login.html`, o cliente é direcionado diretamente para o painel na etapa ativa/máxima alcançada, sem passar pelo `termo.html`.
     - Caso o cliente tente acessar a URL de `termo.html` diretamente enquanto o termo já estiver assinado, o sistema redireciona automaticamente para o `painel.html` no passo alcançado (ou exibe o comprovante de autenticidade estático se invocado com `?view=1`).
     - O botão de saída do painel (`painel.html`) foi ajustado para efetuar logout de sessão sem limpar o termo nem o progresso do pedido no navegador.
  2. **Blindagem e Bloqueio dos Dados de Identificação (DSO / Laços):**
     - No `painel.js`, a função `openTermoModal` agora detecta se o termo já foi assinado ou se o cliente iniciou o projeto.
     - Quando assinado, o modal opera compulsoriamente em modo somente-leitura (`isViewOnly = true`): todos os campos (Nome, CPF, laço com o narrador, laço com o homenageado e checkbox de aceite) são travados (`disabled`, `readOnly`, opacidade e cursor `not-allowed`), impedindo qualquer modificação cadastral ou adulteração de DSO.
     - Foi integrado na Topbar do `painel.html` o badge nobre com ícone de escudo verde **"✓ Termo Assinado"**, permitindo ao cliente conferir seus dados a qualquer momento em modo de visualização segura.
  3. **Direcionamento Direto para a Tela de Espera da Etapa 4 (com Etapas 1, 2 e 3 Travadas):**
     - Corrigida a lógica de resolução de etapas no `painel.js` que rebaixava o cliente da Etapa 4 para a Etapa 3 (`initialStep = 3`) ao relogar enquanto aguardava as prévias da equipe.
     - Agora, quando o cliente envia a Etapa 3 e passa para a espera da Etapa 4, o marco de progresso máximo (`reviva_max_step_reached: 4`) e o estado de espera (`reviva_waiting_active: 4`) são preservados.
     - Ao fazer login ou recarregar, o painel abre diretamente na **tela de espera da Etapa 4** (ou Etapa 5 conforme o status do projeto), com a barra de progresso e as etapas 1, 2 e 3 devidamente preenchidas e concluídas, com retrocesso rigidamente bloqueado e sem sobrescrever dados.

---

### 4. Remetente de E-mail e Exposição de Conta Pessoal (EmailJS / Provedor) [✓ CONCLUÍDO]
- **Problema Solucionado:**
  - O e-mail transacional e o código OTP agora são enviados oficialmente através da API do **Resend** com o domínio autenticado no Registro.br (`revivamemories.com.br`).
  - **Blindagem Completa de Identidade:** O remetente é estritamente institucional:
    - **Nome de Exibição:** `Reviva Memories`
    - **Endereço de E-mail:** `contato@revivamemories.com.br`
    - **Reply-To:** `contato@revivamemories.com.br`
  - Assinaturas criptográficas **DKIM (`resend._domainkey`)**, **SPF (`rsend` e `send`)** e **DMARC** verificadas com sucesso no Registro.br, eliminando qualquer exibição de conta pessoal, foto de perfil do Gmail ou risco de spam.
  - Mantido fallback automático transparente para o EmailJS caso haja qualquer oscilação de conectividade.
- **Status do Item:** [✓ CONCLUÍDO] - Implementado e validado em `notifications.js`.

---

### 5. Motor de Prioridades Automáticas, Pontuação de Pedidos e Sistema de Lembretes/Alertas [✓ CONCLUÍDO]
- **Objetivo:** Estabelecer uma esteira de Produção inteligente com fila dinâmica, evitando gargalos quando pedidos ficam travados do lado do cliente (esperando envio de fotos/áudio ou aprovação) e dando vazão imediata a pedidos com materiais 100% prontos para produção.
- **Detalhamento da Fila & Pontuação Dinâmica Implementada:**
  1. **Status de Prontidão Operacional (Gatilho Ativo):**
     - Pedidos com materiais pendentes do cliente não consomem tempo/SLA da Produção (status: *⚪ No Ritmo do Cliente*).
     - Quando o cliente conclui o envio dos materiais ou aprova uma prévia, o pedido ganha pontuação imediata na fila (*Pronto para Produção* / *Pronto para Finalização*).
  2. **Tempo Ativo de Produção (SLA Real):**
     - O relógio de SLA da equipe só conta enquanto o pedido estiver sob responsabilidade técnica da equipe (SLAs dinâmicos por plano: Tributum 48h, Legatum 72h, Affectus 96h).
  3. **Preservação Total das Cores do Plano (Sem Sobreposição):**
     - As cores contratadas do plano (Verde Affectus, Dourado Legatum e Vermelho Tributum) são mantidas 100% intactas.
     - A prioridade e o status do SLA são comunicados através de uma **bolinha indicadora (LED dot)** elegante e discreta ao lado do ID do pedido, presente tanto nos cards normais quanto compactos.
     - **Semáforo do Indicador LED:**
       - 🔴 **Urgente / SLA Crítico:** Retrabalho de prévia reprovada ou decorrido > 75% do SLA.
       - 🟡 **Atenção:** 40% a 75% do tempo de SLA decorrido (meia-vida).
       - 🟢 **No Prazo:** Pedido confortável no cronograma (< 40% do SLA).
       - ⚪ **No Ritmo do Cliente:** Aguardando ações do cliente (pagamento ou envio de fotos/áudios).
     - Tooltip dinâmico e explicativo ao passar o mouse sobre a bolinha exibindo SLA em horas e pontuação de prioridade.
- **Status do Item:** [✓ CONCLUÍDO] - Implementado e validado em `admin.html`.

---

### 6. Painel do Cliente: Layout Dividido (Desktop e Mobile) para Pedidos com 2 Formatos e Modal de Zoom nas Prévias [✓ CONCLUÍDO]
- **Regra Condicional Estrita de Formatos:**
  - Essa divisão vertical de recebimento e visualização **só ocorre se o pedido tiver sido contratado com os dois formatos simultâneos** (`isOrderBothFormats()`). Caso o pedido seja de apenas um formato (apenas Horizontal ou apenas Vertical), a tela mantém a visualização única tradicional `#preview-single-container`.
- **Layout Dividido ao Meio Verticalmente (Tanto no Desktop quanto no Mobile):**
  - Nos pedidos com 2 formatos, a área de exibição das prévias é dividida ao meio verticalmente (`#preview-dual-container` com `.preview-dual-grid` e `.preview-dual-col`) mantendo duas colunas lado a lado **tanto no desktop quanto no mobile** (Horizontal à esquerda, Vertical à direita).
- **Zoom / Modal em Tela Cheia das Prévias:**
  - Lightbox fullscreen `#modal-zoom-previa` ativado ao clicar/tocar em qualquer prévia com badge contextual de orientação.
  - Permite fechar (botão fechar, tecla ESC ou clique externo) e acionar diretamente os comandos de **Aprovar** e **Reprovar** (abrindo o campo de feedback com foco automático).
- **Status do Item:** [✓ CONCLUÍDO] - Implementado em `painel.html` e `painel.js`.
