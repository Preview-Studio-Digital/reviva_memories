---
name: criador-roteiros-afetivos
description: Criação e aprimoramento de roteiros de homenagens afetivas em vídeo (1, 2 ou 3 minutos) com voz clonada e avatar de entes queridos para a Reviva Memories.
---

# 🕊️ Criador de Roteiros Afetivos - Reviva Memories

Esta habilidade orienta a coleta de informações (conversa guiada pelo Iasis) e a escrita/lapidação de roteiros falados sob medida para os planos oficiais da **Reviva Memories**:

| Plano | Duração Contratada | Palavras Mínimas Obrigatórias (Margem de Segurança) | Limite Máximo de Caracteres | Foco Narrativo |
| :--- | :---: | :---: | :---: | :--- |
| **Affectus** | **1 minuto** (60s) | **120 a 135 palavras** | **850 caracteres** | Abertura alegre, mensagem direta de orgulho, conselho central e bênção/despedida extremamente emocionante. |
| **Legatum** | **2 minutos** (120s) | **240 a 265 palavras** | **1.700 caracteres** | Abertura empolgada, histórias marcantes da convivência, conselhos profundos e recados personalizados para familiares. |
| **Tributum** | **3 minutos** (180s) | **360 a 395 palavras** | **2.550 caracteres** | Experiência imersiva: abertura vibrante, memórias ricas (hábitos/risadas), legado moral, recados individuais para parentes e encerramento sublime. |

---

## ⏱️ Regra de Ouro do Tempo e Extensão (Nunca Faltar Palavras)

> [!IMPORTANT]
> **COMPROMISSO INEGOCIÁVEL DE TEMPO:**
> - O cliente que contrata **1 minuto** nunca aceitará um vídeo de 55 segundos.
> - O cliente que contrata **2 minutos** nunca aceitará 1,9 minutos.
> - O cliente que contrata **3 minutos** nunca aceitará menos que o tempo integral.
>
> **Diretriz:** A quantidade de palavras **deve preencher e exceder ligeiramente o tempo**, garantindo que a locução com pausas afetivas, respirações e cadência atinja ou ultrapasse com folga a minutagem contratada. **Nunca economize palavras!**

---

## 🎭 Regra da Cadência Dramática e Emocional (Todos os Roteiros)

1. **Abertura (Empolgação, Surpresa & Alegria):**
   - **Sempre comece vibrante e comemorativo.** Sorriso na voz, entusiasmo por estar presente nessa data especial e quebra imediata da distância.
   - *Exemplos:* *"Olha só pra você!", "Quem diria, hein?!", "Você achou mesmo que eu ia perder esse dia?", "Olha que orgulho imenso ver você chegar até aqui!"*
2. **Desenvolvimento (Intimismo, Histórias & Conselhos):**
   - A energia festiva transiciona suavemente para o afeto profundo.
   - Recordação de lembranças inesquecíveis, histórias marcantes de convivência e conselhos que ficam como guia de vida.
3. **Recados Familiares Personalizados (Especialmente nos Planos Legatum e Tributum):**
   - **Nunca faça apenas saudações genéricas ou listas frias de nomes.**
   - Dedique frases afetuosas e mensagens específicas para cada familiar mencionado (mãe, pai, irmãos, filhos, cônjuge).
4. **Clímax & Despedida (Extremamente Emocionante e Sublime):**
   - **O final e a despedida devem ser profundamente comoventes, poéticos e tocantes.**
   - Transmita a certeza do amor eterno, o abraço espiritual que vence a distância, a presença que continua viva no coração e a bênção de paz e luz.

---

## 🎙️ Regras Gerais de Cadência e TTS (Síntese de Voz & Audio Prompting)

- **Fluxo de Aprovação em 2 Etapas (Mandatório):**
  - **Etapa 1 (Criação & Lapidação):** Apresentar **sempre o texto puro e limpo**, sem tags de áudio e sem palavras técnicas, facilitando a leitura, ajustes, contagem de palavras e aprovação humana.
  - **Etapa 2 (Vocalização ElevenLabs com Emoções):** Somente **após o usuário aprovar o roteiro final**, gerar a versão técnica formatada com as tags de interpretação vocal (`[sighs]`, `[emotional voice]`, etc.) e aplicar o **Protocolo de Margem de Edição (Gravando / Corta)**.
- **Protocolo de Margem de Edição (Gravando / Corta - Exclusivo da Etapa de Emoções):**
  - **Início:** Inserir a palavra isolada `Gravando...` antes da primeira fala/tag do roteiro (ex: `Gravando... [sighs] Minha princesinha...`). Isso força a IA a iniciar o áudio sem cortar a respiração ou o primeiro ataque vocal, dando margem perfeita para o editor de vídeo.
  - **Fim:** Inserir a palavra `corta.` logo após a tag de suspiro/respiro final da última frase (ex: `...O pai te ama pra sempre! [sighs] corta.`). Isso garante que a IA mantenha o olhar, respiração e silêncio final do personagem, permitindo fade out suave sem corte abrupto no vídeo ou no áudio.
- **Inovação e Variedade nas Aberturas:**
  - Nunca começar sempre do mesmo jeito (evitar o padrão repetitivo "Meu amor...", "Meu filho...", "Meu querido...").
  - Variar as aberturas com reações espontâneas, exclamações, perguntas reflexivas, quebras de silêncio ou frases diretas (ex: *"Doutor Jorge... Olha só onde você chegou!"*, *"Você achou que eu ia perder esse dia?"*, *"Olha pra você... que emoção ver tudo isso acontecer!"*, *"Se você pudesse me ver agora, saberia o tamanho do meu sorriso..."*).
- **Tags de Expressão no Meio e ao Final das Frases (Margem de Silêncio e Respiro):**
  - Além de tags no início de parágrafos, inserir tags de fechamento expressivo ao final das frases (ex: `[chuckles]`, `[giggles]`, `[sighs]`, `[voice breaking slightly]`), permitindo que a risada, o suspiro de alívio ou o fôlego saiam exatamente ao terminar a ideia falada.
  - **Fechamento Obrigatório:** Inserir sempre uma tag como `[sighs]` ou `[exhales softly]` seguida de `corta.` ao final.
- **Ritmo Sereno:** A fala gerada por IA precisa de espaço para respiração. Nunca ultrapasse a contagem máxima de palavras por minuto (~110-120 palavras/minuto).
- **Pontuação Expressiva:**
  - `...` (reticências): Criam pausas dramáticas, de hesitação e de emoção contida.
  - Quebras de linha duplas: Dão ritmo compassado para a leitura do avatar e descanso do fôlego.
  - `—` (travessão): Introduz quebras de tom acolhedoras e intimistas.

---

## 🎭 Dicionário Oficial de Audio Prompts & Emoções (ElevenLabs / Turbo v2 - 100% em Inglês)

Para garantir máxima fidelidade e interpretação vocal precisa no ElevenLabs, todas as diretrizes de áudio devem utilizar **exclusivamente tags em inglês**:

### 1. Respiração & Fôlego Orgânico (Humanização Máxima)
- `[sighs]` / `[deep sigh]`: Suspiro de alívio, saudade ou emoção antes de uma frase profunda.
- `[inhales deeply]` / `[takes a deep breath]`: Inspiração perceptível para criar solenidade e transição de pensamento.
- `[exhales softly]`: Expiração suave de relaxamento e acolhimento.
- `[breath]`: Respiração curta, fôlego de transição e humanização do ritmo vocal.
- `[short pause]`: Micro-pausa precisa para respiração e suspense emocional antes do encerramento.

### 2. Afeto, Ternura & Comoção (Momentos de Alento)
- `[warmly]` / `[gentle whisper]` / `[softly]`: Entonação doce, suave, aveludada e materna/paterna.
- `[thoughtful]` / `[tenderly]`: Pausa reflexiva e fala calma de quem aconselha com amor.
- `[emotional voice]` / `[voice breaking slightly]`: Leve tremor na voz de emoção contida (ideal ao dizer "Eu te amo" ou "Você foi gigante").

### 3. Sorrisos, Risadas, Gargalhadas & Celebração
- `[chuckles]` / `[soft laugh]`: Risadinha sutil de canto de boca ou nostalgia afetuosa.
- `[giggles]`: Risada leve, espontânea e sorridente no meio ou final da frase.
- `[laughing]` / `[speaks while laughing]`: Falar já dando risada, misturando as palavras com o riso.
- `[bursts out laughing]` / `[loud laughter]`: Gargalhada aberta e solta logo antes ou depois de uma frase engraçada.
- **Técnica Mista (Tags em Inglês + Onomatopeias Fonéticas):** 
  - Para risadas mais longas, sonoras e soltas no ElevenLabs, combinar a tag com onomatopeia escrita:
  - Ex: `[bursts out laughing] Hahaha… ai ai… olha só pra você!`
  - Ex: `[laughing] Quem diria, hein? Hahaha!`
  - Ex: `[chuckles] Ai, ai… que saudade dessa sua cara! [loud laughter] Hahaha!`
- `[happy]` / `[excited]` / `[triumphant]`: Energia vibrante de orgulho e celebração (formaturas e casamentos).

### 4. Bênção, Despedida & Paz Sublime
- `[peaceful]` / `[serene whisper]`: Tom de serenidade absoluta, bênção e alento espiritual.
- `[solemn]` / `[with conviction]`: Afirmações de fé e conselhos fundamentais (ex: "Deus decide todas as coisas").

---

## 📋 1. Questionário de Atendimento / Briefing ao Cliente (Conduzido pelo Iasis)

Quando o cliente interage com o Iasis no Painel do Cliente, as perguntas são conduzidas uma a uma com escuta ativa e acolhimento:

1. **Boas-Vindas & Abertura:** Acolhimento afetuoso e convite para iniciar.
2. **Nome do Ente Querido:** Nome de quem apresentará a mensagem com imagem e voz clonada.
3. **Destinatário da Homenagem:** Se a surpresa é para o próprio cliente ou se ele vai presentear alguém.
4. **Laço Afetivo / Parentesco:** *(Pergunta individual)* Grau de parentesco ou laço (ex: Pai e Filha, Avó e Neto).
5. **Forma de Tratamento / Apelido Carinhoso:** *(Pergunta individual)* Como ele(a) costumava chamá-la(o) carinhosamente.
6. **Ocasião Especial:** *(Sempre após o laço e apelido)* Aniversário, formatura, casamento, homenagem de conforto/saudade, etc.
7. **Acontecimento Marcante / Histórias:**
   - *1 Minuto (Affectus):* Frase de impacto ou acontecimento marcante.
   - *2 ou 3 Minutos (Legatum / Tributum):* Histórias inesquecíveis, momentos marcantes de convivência, hábitos ou viagens.
8. **Conselhos, Valores & Ensinamentos:** Palavras de incentivo, coragem e sabedoria que ele(a) daria para a vida.
9. **Recados Familiares & Bênçãos:**
   - *1 Minuto (Affectus):* Bênção afetuosa e abraço à família no fechamento.
   - *2 ou 3 Minutos (Legatum / Tributum):* **Recados personalizados e carinhosos dedicados a cada familiar próximo** (mãe, pai, irmãos, filhos, cônjuge).

---

## 🏛️ 2. Estrutura Padrão dos Roteiros por Duração

### A. Estrutura 1 Minuto (Plano Affectus ~ 120 a 135 palavras • Máx 850 carac)
1. **Abertura Vibrante com Apelido (0-15s):** Saudação calorosa, empolgada, surpresa e reconhecimento alegre da data.
2. **Orgulho & Celebração (15-30s):** Vibração pelo momento e sentimento de presença.
3. **Conselho do Coração & Memória (30-45s):** O maior conselho ou lembrança marcante.
4. **Alento, Recado Familiar & Despedida Sublime (45-60s+):** Mensagem de amor eterno, abraço espiritual à família e fechamento extremamente emocionante.

---

### B. Estrutura 2 Minutos (Plano Legatum ~ 240 a 265 palavras • Máx 1.700 carac)
1. **Abertura Empolgada e Festiva (0-25s):** Saudação íntima cheia de energia, quebra da barreira do tempo e alegria contagiante.
2. **Trajetória & Recordações Marcantes (25-65s):** Lembrança de momentos vividos juntos e orgulho pelo caminho percorrido.
3. **Legado & Conselhos de Vida (65-95s):** Valores fundamentais e palavras de incentivo.
4. **Recados Personalizados aos Familiares (95-125s):** Mensagens carinhosas dedicadas a entes queridos próximos (mãe, pai, irmãos, etc.).
5. **Clímax & Despedida Sublime (125-140s+):** Certeza da presença espiritual, abraço que vence o tempo e bênção de paz eterna.

---

### C. Estrutura 3 Minutos (Plano Tributum ~ 360 a 395 palavras • Máx 2.550 carac)
1. **Abertura Triunfal & Vibrante (0-30s):** Saudação expansiva, emoção viva e comemoração exuberante da ocasião.
2. **Capítulo 1: As Lembranças e Histórias Inesquecíveis (30-85s):** Histórias detalhadas, hábitos, risadas e momentos de ouro da convivência.
3. **Capítulo 2: Os Ensinamentos & Legado Moral (85-135s):** O grande testamento afetivo e ético.
4. **Capítulo 3: Múltiplos Recados Personalizados para a Família (135-180s):** Mensagens individuais e detalhadas para cada membro familiar.
5. **Encerramento Celestial & Bênção Eterna (180-200s+):** O abraço que transcende a ausência, o pedido para sorrirem e a despedida sublime e inesquecível.

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
