# Lista de Afazeres (Backlog Pendente) - Reviva Memories

Documento operacional com as tarefas pendentes a serem implementadas nas próximas iterações. Conforme uma demanda é concluída e validada, ela é removida da lista.

---

### 1. Telemetria, Analytics & Funil Completo de Conversão
- **Objetivo:** Implementar uma medição detalhada e visual da jornada dos visitantes no site, operando como um funil completo de comportamento e conversão.
- **Métricas e Comportamentos a Monitorar:**
  1. **Acessos Totais & Visitantes Únicos:** Volume de tráfego que entra na página inicial e nas páginas internas.
  2. **Duração da Sessão:** Tempo de permanência do usuário navegando na página.
  3. **Mapa de Calor por Seção (Engajamento):** Identificar em qual seção os visitantes passam mais tempo (Apresentação, Homenagens, Experiência, Ocasiões, Depoimentos, Propósito, Planos ou FAQ).
  4. **Taxa de Chegada aos Planos:** Quantos usuários rolam a página até a seção `#planos` e iniciam o processo de escolha.
  5. **Taxa de Conversão no Checkout:** Quantos usuários avançam para a seleção de formato, pagamento e conclusão do pedido.
- **Status:** [ ] PENDENTE (Em fila de planejamento e arquitetura).

---

### 2. Produção, Atualização e Regravação dos Vídeos (Site e Painel do Cliente)
- **Objetivo:** Centralizar e coordenar todas as frentes de áudio (ElevenLabs) e avatar/vídeo cinematográfico que necessitam de gravação oficial, substituição ou nova produção, cobrindo tanto as seções do site institucional quanto os tutoriais das etapas do painel.
- **Frente 1: Regravações e Atualizações Pendentes do Site (`roteiros.md`):**
  1. **Slide 2 (Hero Section / Homenagens):** Narração de ~32s calibrada com novo texto oficial e tags de emoção ElevenLabs.
  2. **Slide 3 (Experiência / As 5 Etapas):** Narração de ~32s enfatizando a jornada humanizada e o processo de co-criação afetiva.
  3. **Etapa 01 do Painel (O Resgate):** Instruções de captação sobre seleção e envio de fotos e áudios nítidos.
- **Frente 2: Vídeos Tutoriais e Explicativos do Painel do Cliente:**
  1. **Etapa 01 (O Resgate):** Tutorial interativo de envio seguro de fotos e áudios com recomendações de qualidade.
  2. **Etapa 02 (A Essência):** Como conversar com o IASIS no chat para extrair memórias e validar o roteiro afetivo.
  3. **Etapa 03 (A Harmonização):** Demonstração da escolha de trilha sonora e atmosfera/ambiente.
  4. **Etapa 04 (A Lapidação):** Como avaliar, dar zoom e aprovar/reprovar prévias de imagem e voz (formatos simples ou duplo).
  5. **Etapa 05 (O Reencontro):** Vídeo de celebração acolhedor para a entrega na Sala de Revelação e download final.
- **Status:** [ ] PENDENTE (Aguardando geração de áudios no ElevenLabs, animação de avatares e integração).

---

### 3. Mensagem de Boas-Vindas via WhatsApp (Texto ou Áudio com Voz do IASIS) na Coluna "Confirmados"
- **Objetivo:** Oferecer um contato imediato, acolhedor e humanizado logo após a confirmação do pagamento, com a opção de enviar mensagem de texto calorosa ou mensagem em áudio sintetizada com a voz oficial do IASIS via WhatsApp.
- **Localização na Interface:**
  - Inserir um botão de ação dedicado no painel de administração/cockpit (`admin.html`), especificamente para os pedidos presentes na **coluna 2 (Confirmados / `pagamento_confirmado`)**.
  - O botão deve ficar posicionado estrategicamente **ao lado do botão de ajuda já existente** (`#btn-wa-materials-help` / "Enviar ajuda no envio das fotos, áudios e roteiro").
- **Funcionalidades & Especificações:**
  1. **Texto de Boas-Vindas:** Mensagem empática, respeitosa e nobre parabenizando o cliente pelo início da homenagem, reforçando o compromisso da Reviva Memories e instruindo sobre o acesso ao painel para o envio dos materiais.
  2. **Disparo de Áudio (Voz do IASIS):** Integração para envio do áudio gravado/gerado com a persona vocal serena e acolhedora do IASIS acolhendo o cliente.
  3. **Abertura Direta no WhatsApp:** Disparo com link direto `wa.me` com o texto devidamente codificado e/ou anexo de mídia pronto para envio no número cadastrado do cliente.
- **Status:** [ ] PENDENTE (Em fila de desenvolvimento e calibração de roteiro/áudio).
