# Backlog de Correções Futuras - Reviva Memories

Documento destinado a registrar problemas identificados e melhorias a serem implementadas nas próximas iterações.

---

### 1. IASIS - Tom de Voz, Personalidade e Dinâmica de Perguntas
- **Problema de Tom/Personalidade:**
  - O avatar/entrevistador IASIS está se comunicando de forma excessivamente dócil e afeminada (ex.: usando expressões como *"que lindo..."*, *"que amor..."*, *"que delicadeza..."*).
  - **Ajuste necessário:** Adequar a persona para um tom masculino, formal, sóbrio, educado, empático e respeitoso, eliminando maneirismos emotivos exagerados ou feminizados.
- **Problema no Fluxo de Perguntas:**
  - O IASIS fez perguntas compostas/duplas na mesma intervenção (exemplo relatado: perguntou simultaneamente os nomes dos envolvidos e uma história marcante entre eles).
  - **Ajuste necessário:** Bloquear estritamente perguntas duplas no prompt/fluxo. O IASIS deve conduzir a entrevista **uma pergunta por vez**, de forma simples, direta e acessível para o usuário responder sem se sobrecarregar.

---

### 2. Fluxo Pós-Envio da Etapa 3 (Trilha e Ambiente), Redirecionamento e Design da Tela de Bloqueio
- **Problema de Navegação e Estado:**
  - Ao avançar na escolha de trilha e ambiente e receber o aviso para aguardar o término das prévias, fechar a tela faz o usuário retornar para a home/site principal em vez de mantê-lo na Etapa 3 ou na tela de espera.
- **Estética da Tela de Bloqueio/Espera:**
  - As telas de bloqueio atuais estão muito frias e carregadas de texto corrido parecendo um documento burocrático.
- **Ajustes necessários:**
  1. **Permanência e Travamento:** Ao fechar o modal/aviso ou recarregar, o usuário deve permanecer na área do cliente / Painel. As opções já selecionadas e enviadas da Etapa 3 devem ficar bloqueadas/congeladas para edição.
  2. **Destino Correto:** A visualização correta após a submissão da Etapa 3 é a **tela de espera para a Etapa 4** (ou estado bloqueado aguardando liberação das prévias pela Produção).
  3. **Identidade Visual Elegante (Semelhante às Telas de Transição):**
     - A tela de bloqueio/espera **deve herdar o mesmo acabamento nobre, sofisticado e acolhedor das telas de transição** da plataforma.
     - Substituir o bloco burocrático de texto por uma interface emocional e imersiva: card nobre com detalhes dourados, indicador sutil de status/andamento da Produção, tipografia refinada e mensagens acolhedoras e afetuosas, mantendo o padrão visual premium do Reviva Memories.
  4. **Padronização Cromática das Telas de Transição e Bloqueio:**
     - **Telas de Transição com Bloqueio (Pausa/Aguardando Produção):** Devem utilizar tonalidade/acento **vermelho** (tons nobres como rubi/carmesim escuro e bordô sofisticado com dourado), sinalizando de forma clara e elegante que a etapa está travada/em espera.
     - **Telas de Transição com Continuidade (Etapa Liberada/Avanço Permitido):** Devem utilizar tonalidade/acento **verde** (tons nobres como esmeralda/verde profundo com dourado), indicando avanço livre, aprovação e continuidade para a próxima etapa.

---

### 3. Persistência de Estado, Revalidação de Sessão e Termo de Responsabilidade
- **Problema de Redundância e Perda de Contexto:**
  - Mesmo após enviar os materiais e chegar até a Etapa 3, ao sair do sistema e logar novamente, o sistema solicita novamente o Termo de Responsabilidade e exige preencher todos os dados cadastrais/DSO.
  - Ao preencher novamente (inclusive permitindo preencher com dados/nomes diferentes), o cliente vai direto para a Etapa 3 desbloqueada, sobrescrevendo ou desregulando o fluxo.
  - **Ajuste necessário:**
    - Se o usuário/projeto já assinou o Termo de Responsabilidade e já enviou dados/materiais das etapas anteriores, o termo **não deve ser cobrado novamente**.
    - Ao fazer login, o sistema deve checar o status real do pedido/projeto no banco e direcionar o cliente diretamente para a **tela de espera para a Etapa 4** (com as etapas 1, 2 e 3 devidamente travadas/concluídas).
    - Impedir alteração de dados de identificação já validados após o início do processo.

---

### 4. Remetente de E-mail e Exposição de Conta Pessoal (EmailJS / Provedor)
- **Problema Identificado:**
  - O e-mail transacional de confirmação de pedido chegou exibindo o endereço pessoal do Gmail (`diegooaraujoo2307@gmail.com`) e a foto de perfil pessoal associada à conta Google, mesmo constando "Reviva Memories" como nome de exibição.
  - **Causa Raiz:** O serviço do EmailJS (`service_48cpts2` em `notifications.js`) está conectado diretamente a uma conta pessoal do Gmail via autenticação Google OAuth. Os servidores do Gmail inserem compulsoriamente os dados da conta dona do token nos cabeçalhos técnicos de remetente (`From:` / `Sender:`), fazendo os aplicativos de e-mail (Gmail, Apple Mail, Outlook) mostrarem o avatar pessoal e o e-mail pessoal para o comprador final.
  - **Ajustes necessários:**
    1. **Desvincular o Gmail Pessoal:** Remover a integração do Gmail particular do serviço de disparo voltado aos clientes finais.
    2. **Configurar Envio Profissional com Domínio Próprio:** Configurar o serviço de e-mail através do servidor SMTP próprio da Hospedagem do domínio `revivamemories.com.br` ou via serviço de API profissional dedicado (como Resend, SendGrid ou Amazon SES com autenticação DNS: SPF, DKIM e DMARC).
    3. **Blindagem de Identidade:** Garantir que o remetente seja 100% institucional (ex.: `contato@revivamemories.com.br` ou `nao-responda@revivamemories.com.br`) e que a imagem exibida seja exclusivamente o logotipo nobre da Reviva Memories, sem nenhum vínculo com perfis pessoais.

---

### 5. Motor de Prioridades Automáticas, Pontuação de Pedidos e Sistema de Lembretes/Alertas
- **Objetivo:** Estabelecer uma esteira de Produção inteligente com fila dinâmica, evitando gargalos quando pedidos ficam travados do lado do cliente (esperando envio de fotos/áudio ou aprovação) e dando vazão imediata a pedidos com materiais 100% prontos para produção.
- **Detalhamento da Fila & Pontuação Dinâmica:**
  1. **Status de Prontidão Operacional (Gatilho Ativo):**
     - Pedidos com materiais pendentes do cliente não consomem tempo/SLA da Produção (status: *No Ritmo do Cliente* / *Aguardando Materiais*).
     - Quando o cliente envia a Etapa 3 ou aprova uma prévia, o pedido ganha pontuação imediata na fila (*Pronto para Produção* / *Pronto para Finalização*).
  2. **Tempo Ativo de Produção (SLA Real):**
     - O relógio de SLA da equipe só conta enquanto o pedido estiver sob responsabilidade da equipe técnica, acumulando pontos de prioridade conforme se aproxima do prazo limite.
  3. **Ponderação por Valor / Plano:**
     - Planos superiores (ex.: Legatum / Eternum) possuem multiplicador de pontuação para priorização da fila.
  4. **Critério de Desempate:**
     - Data original de compra para pedidos em igualdade de condições de prontidão.
  5. **Régua de Comunicação e Alertas Anti-esquecimento:**
     - Lembretes automáticos amigáveis via WhatsApp e E-mail para clientes parados (+24h, +72h, +7 dias).
     - Semáforo visual no Painel de Produção (🔴 Crítico, 🟡 No Prazo, 🟢 Recém-Chegado).
- **Status do Item:** Aguardando avaliação e aprovação final de métricas/pesos antes da implementação.

---

### 6. Painel do Cliente: Layout Dividido (Desktop e Mobile) para Pedidos com 2 Formatos e Modal de Zoom nas Prévias
- **Regra Condicional Estrita de Formatos:**
  - Essa divisão vertical de recebimento e visualização **só ocorre se o pedido tiver sido contratado com os dois formatos simultâneos**. Caso o pedido seja de apenas um formato (apenas Horizontal ou apenas Vertical), a tela mantém a visualização única tradicional.
- **Layout Dividido ao Meio Verticalmente (Tanto no Desktop quanto no Mobile):**
  - Nos pedidos com 2 formatos, a área de exibição das prévias deve ser dividida ao meio verticalmente (duas colunas lado a lado) **tanto no desktop quanto no mobile**.
- **Zoom / Modal em Tela Cheia das Prévias:**
  - Como no mobile as duas colunas verticais lado a lado reduzem a área de detalhe de cada foto, é fundamental o recurso de expansão.
  - **Comportamento necessário:**
    - Ao tocar/clicar em qualquer uma das prévias (seja na coluna esquerda ou direita), abrir um modal/lightbox em tela cheia com a imagem ampliada em alta resolução.
    - O modal deve permitir fechar facilmente para retornar à visão comparativa e permitir os comandos de **Aprovar** ou **Reprovar** (com campo de observação em caso de reprovação).
