---
name: criador-roteiros-afetivos
description: Criação e aprimoramento de roteiros de homenagens afetivas em vídeo (1, 2 ou 3 minutos) com voz clonada e avatar de entes queridos para a Reviva Memories.
---

# 🕊️ Criador de Roteiros Afetivos - Reviva Memories

Esta habilidade orienta a coleta de informações (briefing com perguntas guiadas) e a escrita/lapidação de roteiros falados sob medida para os planos oficiais da **Reviva Memories**:

| Plano | Duração | Palavras Recomendadas (com pausas) | Foco Narrativo |
| :--- | :---: | :---: | :--- |
| **Affectus** | **1 minuto** (60s) | **105 a 125 palavras** | Mensagem direta de afeto, saudade, orgulho e bênção/alento. |
| **Legatum** | **2 minutos** (120s) | **210 a 245 palavras** | Trajetória, histórias marcantes, menções nominais a familiares e conselhos profundos. |
| **Tributum** | **3 minutos** (180s) | **315 a 360 palavras** | Experiência imersiva e completa: memórias ricas, legado, mensagens personalizadas a múltiplos familiares e despedida sublime. |

---

## 🎙️ Regras Gerais de Cadência e TTS (Síntese de Voz & Audio Prompting)

- **Fluxo de Aprovação em 2 Etapas (Mandatório):**
  - **Etapa 1 (Criação & Lapidação):** Apresentar **sempre o texto puro e limpo**, sem tags de áudio, facilitando a leitura, ajustes, contagem de palavras e aprovação humana.
  - **Etapa 2 (Vocalização ElevenLabs):** Somente **após o usuário aprovar o roteiro final**, gerar e entregar a versão técnica formatada com as tags de interpretação vocal (`[sighs]`, `[emotional voice]`, etc.).
- **Inovação e Variedade nas Aberturas:**
  - Nunca começar sempre do mesmo jeito (evitar o padrão repetitivo "Meu amor...", "Meu filho...", "Meu querido...").
  - Variar as aberturas com reações espontâneas, exclamações, perguntas reflexivas, quebras de silêncio ou frases diretas (ex: *"Doutor Jorge... Olha só onde você chegou!"*, *"Você achou que eu ia perder esse dia?"*, *"Olha pra você... que emoção ver tudo isso acontecer!"*, *"Se você pudesse me ver agora, saberia o tamanho do meu sorriso..."*).
- **Tags de Expressão no Meio e ao Final das Frases (Margem de Silêncio e Respiro):**
  - Além de tags no início de parágrafos, inserir tags de fechamento expressivo ao final das frases (ex: `[risos]`, `[chuckles]`, `[sighs]`, `[voice breaking slightly]`), permitindo que a risada, o suspiro de alívio ou o fôlego saiam exatamente ao terminar a ideia falada.
  - **Dica de Ouro de Edição (Final do Roteiro):** Inserir obrigatoriamente uma tag de respiro/suspiro como `[sighs]` ou `[exhales softly]` **ao final da última frase**. Isso faz a IA gerar um tempo extra de silêncio, respiração e olhar sereno no vídeo do avatar após a última fala, essencial para o editor aplicar o fade out suave sem cortar o áudio ou a boca do personagem abruptamente.
- **Ritmo Sereno:** A fala gerada por IA precisa de espaço para respiração. Nunca ultrapasse a contagem máxima de palavras por minuto (~110-120 palavras/minuto).
- **Pontuação Expressiva:**
  - `...` (reticências): Criam pausas dramáticas, de hesitação e de emoção contida.
  - Quebras de linha duplas: Dão ritmo compassado para a leitura do avatar e descanso do fôlego.
  - `—` (travessão): Introduz quebras de tom acolhedoras e intimistas.

---

## 🎭 Dicionário Oficial de Audio Prompts & Emoções (ElevenLabs / Turbo v2)

Para garantir que a IA não leia o texto de forma fria ou linear, os roteiros devem conter **diretrizes de interpretação vocal** usando as tags de áudio reconhecidas e refinadas pelo ElevenLabs:

### 1. Respiração & Fôlego Orgânico (Humanização Máxima)
- `[sighs]` / `[deep sigh]`: Suspiro de alívio, saudade ou emoção antes de uma frase profunda.
- `[inhales deeply]` / `[takes a deep breath]`: Inspiração perceptível para criar solenidade e transição de pensamento.
- `[exhales softly]`: Expiração suave de relaxamento e acolhimento.

### 2. Afeto, Ternura & Comoção (Momentos de Alento)
- `[warmly]` / `[gentle whisper]`: Entonação doce, aveludada e materna/paterna.
- `[thoughtful]` / `[tenderly]`: Pausa reflexiva e fala calma de quem aconselha com amor.
- `[emotional voice]` / `[voice breaking slightly]`: Leve tremor na voz de emoção contida (ideal ao dizer "Eu te amo" ou "Você foi gigante").

### 3. Sorrisos, Risadas & Celebração
- `[chuckles]` / `[soft laugh]`: Risadinha de canto de boca lembrando de um momento engraçado ou ao chamar pelo apelido.
- `[giggles]` / `[risos]`: Risada afetuosa e descontraída em datas festivas (aniversários).
- `[happy]` / `[excited]` / `[triumphant]`: Energia vibrante de orgulho e celebração (formaturas e casamentos).

### 4. Bênção, Despedida & Paz Sublime
- `[peaceful]` / `[serene whisper]`: Tom de serenidade absoluta, bênção e alento espiritual.
- `[solemn]` / `[with conviction]`: Afirmações de fé e conselhos fundamentais (ex: "Deus decide todas as coisas").

---

## 📋 1. Questionário de Atendimento / Briefing ao Cliente

Quando o cliente não enviar um roteiro completo ou enviar um pré-roteiro para lapidação, faça as seguintes perguntas guiadas:

### ⏱️ Pergunta 0: Plano Contratado / Duração do Vídeo
> *"Qual plano você escolheu ou qual é a duração desejada para o vídeo?"*
> 1. **Plano Affectus (1 Minuto)** – Focado em uma mensagem direta, emocionante e inesquecível.
> 2. **Plano Legatum (2 Minutos)** – Espaço para narrar memórias específicas e citar familiares.
> 3. **Plano Tributum (3 Minutos)** – Narrativa rica e completa, com múltiplos recados e legado de vida.

---

### 💬 Perguntas Essenciais de Conteúdo:

1. **Quem é o Ente Querido e Quem é o Homenageado?**
   - Nome de quem está partindo a mensagem (ex: *Pai José, Vovó Nilza*) e grau de parentesco.
   - Nome de quem vai receber a homenagem e apelido carinhoso como era chamado em vida (ex: *Mariana -> "Maricota", Lucas -> "Meu Campeão"*).

2. **Qual é a Ocasião da Homenagem?**
   - Ex: Formatura, Casamento, Aniversário (15 anos, 18 anos, 50 anos, etc.), Nascimento de filho/neto, Dia das Mães/Pais, ou uma mensagem de puro conforto e saudade.

3. **Memórias Afetivas, Frases Marcantes e Valores:**
   - O que essa pessoa sempre dizia ou ensinava? (Ex: *"o valor de uma pessoa está no coração"*, *"nunca deixe de ser humilde"*).
   - Há alguma lembrança específica juntos? (Ex: *o café da manhã de domingo, as viagens de férias, um abraço apertado*).

4. **Menções a Outros Familiares (Regra de Ouro em Todos os Planos):**
   - Quais pessoas próximas ele(a) deve abraçar ou abençoar na despedida? (Ex: *"Dá um beijo no seu pai/sua mãe por mim"*, *"Cuida dos seus irmãos"*, *"Um abraço apertado no seu irmãozinho"*).
   - A menção aos entes queridos na reta final ancora a homenagem na realidade da família e potencializa a comoção.

5. **Tom Emocional Desejado:**
   - Mais alegre e comemorativo (orgulho, festa, risos) ou mais sereno e reconfortante (alento, paz, carinho e bênção)?

---

## 🏛️ 2. Estrutura Padrão dos Roteiros por Duração

### A. Estrutura 1 Minuto (Plano Affectus ~ 110-125 palavras)
1. **Saudação Afetuosa com Apelido (0-10s):** Cumprimento caloroso e imediato reconhecimento da data.
2. **Orgulho e Reconhecimento (10-25s):** Celebração da conquista ou do dia especial.
3. **Conselho Central & Memória (25-40s):** A maior lição de vida ou lembrança afetiva.
4. **Alento e Abraço Simbólico (40-48s):** Transmissão do abraço e presença sentida.
5. **Menção Familiar & Despedida Sublime (48-60s):** Recado afetuoso para a família (pai/mãe/irmãos), amor eterno e bênção final.

---

### B. Estrutura 2 Minutos (Plano Legatum ~ 210-245 palavras)
1. **Abertura Emocionante (0-20s):** Saudação íntima, reação à data e sentimento de presença.
2. **Recordação Afetiva & Trajetória (20-50s):** Lembrança de um momento específico da infância/vida juntos e o caminho percorrido até aqui.
3. **Legado & Conselhos de Vida (50-80s):** Valores essenciais, ética, persistência e carinho.
4. **Recado aos Familiares & Alento (80-105s):** Mensagem de carinho citando mãe/pai/irmãos/cônjuge e o abraço espiritual.
5. **Menção Familiar Específica & Despedida Sublime (105-120s):** Fechamento reconfortante, celebração do futuro e certeza do reencontro.

---

### C. Estrutura 3 Minutos (Plano Tributum ~ 315-360 palavras)
1. **Abertura & Conexão Sublime (0-30s):** Saudação profunda, comoção pela data e quebra da barreira do tempo.
2. **Capítulo 1: As Lembranças Inesquecíveis (30-75s):** Narrativa detalhada de memórias, hábitos, risadas e momentos marcantes do convívio.
3. **Capítulo 2: Os Ensinamentos & Valores (75-120s):** O grande testamento moral e afetivo para a vida do homenageado.
4. **Capítulo 3: Mensagens Individuais aos Parentes (120-155s):** Recados direcionados e personalizados para pai, mãe, irmãos, filhos e cônjuge.
5. **Encerramento Triunfal & Bênção Eterna (155-180s):** O abraço que transcende a ausência, o pedido para sorrirem e a bênção final cheia de luz.

---

## 🌟 3. Exemplos de Referência

### Exemplo 1 Minuto (Plano Affectus - Formatura)
> "É, Maricota…
>
> Quem diria, hein?
> Você formada...
> Você realizou um sonho seu… e realizou um sonho meu também.
> Agora vai.
> Constrói a sua história.
> Cuida das pessoas do jeito que eu sempre te ensinei.
> Nunca deixe de estudar.
> Nunca deixe de ser humilde.
> E nunca esqueça que o valor de uma pessoa não está no dinheiro que ela tem, nem no diploma que ela carrega, mas no coração que ela leva.
> Eu queria muito poder te dar um abraço hoje.
> Mas, como não posso, imagina que esse abraço está chegando aí agora.
> Eu te amo, minha filha.
> Muito obrigado por ter sido a melhor filha que eu poderia ter.
> Agora eu vou deixar você viver esse momento.
> Vai receber o seu diploma.
> Vai sorrir.
> E quando olhar para o céu, não fique triste por mim.
> Eu estarei orgulhoso de você… hoje e para sempre.
> Fica com Deus, Maricota.
> O pai te ama.
> Até a gente se encontrar de novo."
