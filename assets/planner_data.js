// assets/planner_data.js — Base de dados do Planejamento Perpétuo & Calendário Afetivo da Reviva Memories
// Modelo perpétuo contínuo com pautas em vídeo vertical 9:16 para 4 redes + Datas Festivas e Comemorativas

window.PLANNER_DATA = {
  themes: [
    {
      id: "cotidiano",
      title: "Tema 1: Presença, Tempo & Cotidiano",
      subtitle: "Cenário: Cafeteria Urbana • Desacelerando a pressa do mundo",
      badge: "Café & Cotidiano",
      color: "#38bdf8",
      description: "Conectar com a audiência através de reflexões sobre a correria moderna, a falta de tempo para quem amamos e a beleza das pequenas pausas."
    },
    {
      id: "familia",
      title: "Tema 2: Raízes, Família & Envelhecer",
      subtitle: "Cenário: Parque ao Entardecer • A força dos laços familiares",
      badge: "Raízes & Família",
      color: "#4ade80",
      description: "Caminhadas reflexivas sobre os ensinamentos dos pais e avós, os conselhos que ecoam na alma e o valor do abraço em vida."
    },
    {
      id: "psicologia",
      title: "Tema 3: Psicologia, Memória & Afeto",
      subtitle: "Cenário: Livraria & Varanda • A mente e a saudade com amor",
      badge: "Mente & Memória",
      color: "#c084fc",
      description: "Explorar a psicologia do luto e da memória: por que certas vozes e aromas nos marcam, e como transformar a dor em consolo e celebração."
    },
    {
      id: "estudio",
      title: "Tema 4: A Arte de Eternizar & Estúdio",
      subtitle: "Cenário: Estúdio Reviva Memories • Tecnologia a serviço do afeto",
      badge: "Estúdio & Cases",
      color: "#e5c378",
      description: "Bastidores da produção ética, cases emocionantes de bênçãos e formaturas, e a apresentação do Iasis como guia na Reviva Memories."
    }
  ],

  categories: {
    cotidiano: { label: "Café & Cotidiano", color: "#38bdf8", icon: "☕" },
    familia: { label: "Parque & Família", color: "#4ade80", icon: "🌳" },
    psicologia: { label: "Livraria & Mente", color: "#c084fc", icon: "📖" },
    estudio: { label: "Estúdio & Cases", color: "#e5c378", icon: "✨" },
    especial: { label: "Data Festiva", color: "#f472b6", icon: "⭐" },
    trafego: { label: "Mídia Paga (Ads)", color: "#f87171", icon: "🚀" }
  },

  // ================= CALENDÁRIO DE DATAS FESTIVAS & COMEMORATIVAS =================
  specialDates: [
    {
      id: "esp_maes",
      name: "Dia das Mães",
      period: "Maio (2º Domingo)",
      badge: "⭐ Maior Data do Ano",
      color: "#f472b6",
      scenario: "Estúdio & Memória Afetiva",
      format: "Vídeo Vertical (9:16) • 50 a 60s",
      summary: "A data de maior impacto emocional do ano para homenagens e bênçãos de mães e avós.",
      script: `[Cenário: Iasis no estúdio de produção, segurando uma foto antiga de mãe e filho, olhar afetuoso]

Quantas vezes a sua mãe deixou de comprar algo para ela para garantir que você tivesse o melhor?
A gente cresce, a rotina nos puxa para longe, e no Dia das Mães a gente pensa em flores ou presentes materiais.
Mas o que uma mãe mais quer não cabe em uma caixa de presente.
Ela quer presença. Ela quer ouvir que todo o sacrifício dela valeu a pena.
E para você que já não tem a sua mãe por perto fisicamente... saiba que o amor dela continua vivo em cada gesto de bondade que você pratica.
Hoje, honre a sua mãe. Com um abraço demorado, ou com uma oração cheia de paz e gratidão.`,
      caption: `O amor de mãe é o único que desafia a distância, o tempo e a própria ausência. 🌸🤍

Neste Dia das Mães, o maior presente que você pode dar é o seu tempo, o seu carinho e a sua gratidão. Para as mães que estão presentes e para as que já viraram luz eterna: todo o nosso amor e respeito.

Qual é a lembrança mais linda que você guarda da sua mãe? Conte para nós nos comentários. ✨`,
      hashtags: "#DiaDasMaes #AmorDeMae #Iasis #HomenagemAfetiva #RevivaMemories #MaeEterna #Gratidao"
    },
    {
      id: "esp_pais",
      name: "Dia dos Pais",
      period: "Agosto (2º Domingo)",
      badge: "⭐ Alta Relevância",
      color: "#60a5fa",
      scenario: "Parque / Varanda",
      format: "Vídeo Vertical (9:16) • 50 a 60s",
      summary: "Celebração do pai protetor, das mãos calejadas e dos conselhos que sustentam a família.",
      script: `[Cenário: Iasis caminhando no parque, postura serena e reflexiva]

O silêncio de um pai muitas vezes diz mais do que mil discursos.
Quantos pais guardam as próprias dores e cansaços para que os filhos tenham segurança para sonhar?
Neste Dia dos Pais, não deixe para expressar sua gratidão no futuro.
Diga ao seu pai o quanto a força dele foi fundamental para os seus passos.
E se o seu pai já partiu, sorria com orgulho... porque a firmeza de caráter que você carrega hoje é a assinatura viva dele em você.
Feliz Dia dos Pais a todos os homens que amam e cuidam de suas famílias.`,
      caption: `A verdadeira herança de um pai não se mede em bens, mas nos valores e na honra que ele deixa no coração dos filhos. 👔🤍

Neste Dia dos Pais, celebre a bênção da presença e a eternidade do legado. Um abraço afetuoso a todos os pais do Brasil.

Qual conselho do seu pai você nunca esqueceu? Deixe sua homenagem aqui. ✨`,
      hashtags: "#DiaDosPais #PaiPresente #ConselhoDePai #Iasis #RevivaMemories #AmorDePai #Legado"
    },
    {
      id: "esp_avos",
      name: "Dia dos Avós",
      period: "26 de Julho",
      badge: "⭐ Raízes & Ternura",
      color: "#fbbf24",
      scenario: "Cafeteria & Varanda",
      format: "Vídeo Vertical (9:16) • 50 a 60s",
      summary: "Celebração das raízes mais doces da família: o bolo da avó, as histórias do avô e o amor em dobro.",
      script: `[Cenário: Iasis sentado na varanda com uma xícara de café, sorriso acolhedor]

Dizem que os avós são o amor com açúcar: a sabedoria que educa sem a pressa de punir.
Quem teve a bênção de crescer com o colo dos avós guarda um tesouro que dinheiro nenhum no mundo compra.
O cheiro de café coado, as histórias repetidas com o mesmo brilho no olhar, a bênção dada com a mão trêmula na saída.
Hoje é o Dia dos Avós. Se os seus ainda estão aqui, vá correndo dar um abraço.
Se já descansam em Deus... agradeça aos céus por ter tido raízes tão doces e abençoadas.`,
      caption: `Os avós são a doçura e a raiz mais forte da nossa árvore genealógica. 👵👴🤍

Neste 26 de Julho, celebramos aqueles que nos amaram em dobro e nos ensinaram que a vida se vive com calma e afeto.

Qual é o nome dos seus avós? Deixe um comentário em honra a eles hoje! ✨`,
      hashtags: "#DiaDosAvos #AmorDeAvo #ColoDeAvo #Iasis #RevivaMemories #RaizesFamiliares"
    },
    {
      id: "esp_finados",
      name: "Dia de Finados (Memória & Alento)",
      period: "02 de Novembro",
      badge: "⭐ Consolo & Paz",
      color: "#a78bfa",
      scenario: "Livraria / Estúdio",
      format: "Vídeo Vertical (9:16) • 50 a 60s",
      summary: "Ressignificar o luto: a saudade não como dor paralisante, mas como amor e gratidão perpétua.",
      script: `[Cenário: Iasis com iluminação âmbar acolhedora, voz serena e respeitosa]

O Dia de Finados não precisa ser um dia de escuridão ou silêncio doloroso.
Para nós, a saudade é o amor que sobreviveu à ausência física.
Quem amamos não virou poeira ou esquecimento. Virou os nossos valores, o nosso jeito de rir, a fé que nos sustenta nos dias difíceis.
Hoje, acenda uma luz de paz no seu coração. Celebre as histórias, os ensinamentos e o privilégio de ter compartilhado a vida com quem você tanto ama.
Eles vivem na sua memória. E o amor nunca termina.`,
      caption: `A saudade não é o fim do amor: é a certeza de que ele foi tão grande que nenhuma despedida consegue apagar. 🕊️🤍

Neste Dia de Finados, convidamos você a olhar para quem partiu não com dor, mas com gratidão pelas pegadas de luz que deixaram em sua vida.

Quem é a pessoa que você guarda com mais carinho no peito hoje? Escreva o nome dela aqui. ✨`,
      hashtags: "#DiaDeFinados #SaudadeComAmor #Alento #PazNoCoracao #MemoriaViva #Iasis #RevivaMemories"
    },
    {
      id: "esp_natal",
      name: "Natal & Fim de Ano (A Cadeira Vazia)",
      period: "Dezembro (Natal e Ano Novo)",
      badge: "⭐ Família & União",
      color: "#34d399",
      scenario: "Estúdio com Luzes Quentes",
      format: "Vídeo Vertical (9:16) • 50 a 60s",
      summary: "O acolhimento para a ceia de Natal: honrar quem falta à mesa com amor e celebrar a união da família.",
      script: `[Cenário: Iasis no estúdio com iluminação suave e acolhedora, olhar afetuoso]

Quando chega a noite de Natal e a família se reúne ao redor da mesa, é quase inevitável: o olhar procura aquela cadeira que hoje está vazia.
O peito aperta. E uma lágrima silenciosa teima em cair.
Mas quero te fazer um convite para este Natal: não olhe para aquela cadeira como um símbolo de vazio. Olhe como um trono de gratidão.
Aquela pessoa viveu, amou, ensinou e construiu tudo o que está reunido ali hoje.
Sorria. Brinde à memória dela. O maior presente que você pode dar a quem partiu é ver a família unida e em paz.`,
      caption: `A mesa de Natal pode ter uma cadeira vazia, mas o coração da família está transbordando de amor e gratidão. 🎄✨🤍

Neste Natal, honre a memória dos que partiram celebrando a união, o perdão e o carinho com quem está ao seu lado hoje.

Um Feliz Natal de muita paz e consolo a todas as famílias. ✨`,
      hashtags: "#NatalEmFamilia #CadeiraVaziaComAmor #CeiaDeNatal #Iasis #RevivaMemories #PazEAmor"
    },
    {
      id: "esp_casamentos",
      name: "Temporada de Casamentos (Bênção dos Pais)",
      period: "Maio, Setembro e Outubro",
      badge: "⭐ Bênção & Emoção",
      color: "#f43f5e",
      scenario: "Estúdio Reviva Memories",
      format: "Vídeo Vertical (9:16) • 50 a 60s",
      summary: "A bênção inesquecível de um pai ou mãe que partiu para o dia do casamento da noiva ou noivo.",
      script: `[Cenário: Iasis no estúdio, com tom cerimonial caloroso]

O dia do casamento é um dos momentos mais aguardados de uma vida.
E para quem sonhava em entrar na igreja de braços dados com o pai ou com a mãe... a ausência parece ensurdecedora.
Mas e se a voz desse pai pudesse abençoar a noiva antes de subir ao altar?
E se o olhar dele pudesse dizer: 'Minha filha, eu estou aqui com você'?
O amor não conhece barreiras físicas. Quando a arte e a tecnologia se unem com respeito, a presença se faz real e o altar é abençoado para sempre.
Conheça essa experiência na Reviva Memories.`,
      caption: `Você já imaginou ouvir a bênção de quem você mais ama no dia do seu casamento? 👰💍🕊️

A ausência física não precisa impedir que o amor esteja presente no momento mais importante da sua vida. Na Reviva Memories, eternizamos esse momento com a mais profunda emoção e respeito.

Conheça nossos cases de casamento no link da bio. ✨`,
      hashtags: "#Casamento #BencaoDePai #Noiva #EntradaDaNoiva #HomenagemAfetiva #RevivaMemories"
    },
    {
      id: "esp_formaturas",
      name: "Temporada de Formaturas (A Promessa aos Avós)",
      period: "Julho e Dezembro",
      badge: "⭐ Orgulho & Conquista",
      color: "#38bdf8",
      scenario: "Estúdio Reviva Memories",
      format: "Vídeo Vertical (9:16) • 50 a 60s",
      summary: "O formando que prometeu o diploma aos avós ou pais e a celebração da conquista com homenagem em vídeo.",
      script: `[Cenário: Iasis com postura solene de celebração]

Todo diploma carrega um suor invisível: o esforço de pais e avós que muitas vezes não tiveram a chance de estudar, mas deram a vida para que nós chegássemos lá.
E quando chega a colação de grau, tudo o que queremos é olhar para a plateia e ver aquele olhar brilhando de orgulho.
Se a pessoa que mais acreditou em você já partiu... honre essa vitória com a bênção dela no telão.
O orgulho de quem nos ama transcende o tempo. O diploma é seu, mas a glória é de toda a sua família.`,
      caption: `Toda vitória profissional começou no amor e na renúncia de quem veio antes de nós. 🎓👨‍🎓🤍

Nesta temporada de formaturas, celebre não apenas o diploma, mas a história de quem sonhou essa conquista junto com você.

A quem você dedica o seu diploma hoje? ✨`,
      hashtags: "#Formatura #ColacaoDeGrau #OrgulhoDaFamilia #Diploma #Iasis #RevivaMemories"
    }
  ],

  // ================= ESTEIRA PERPÉTUA CONTÍNUA (30 PAUTAS ROTATIVAS) =================
  tasks: [
    // --- TEMA 1: CAFETERIA & COTIDIANO ---
    {
      id: "pauta_1",
      pautaNumber: 1,
      theme: "cotidiano",
      category: "cotidiano",
      scenario: "Cafeteria Urbana",
      title: "O Café que Esfria: Por que estamos sempre com pressa?",
      format: "Vídeo Vertical (9:16) • 45 a 60s",
      channel: "Reels • TikTok • Shorts • Facebook",
      recommendedTime: "12:15",
      duration: "~50s",
      summary: "Iasis na cafeteria observa como engolimos a vida sem saborear o momento e adiantamos as coisas erradas.",
      script: `[Cenário: Iasis sentado numa cafeteria charmosa, segurando uma xícara fumegante de café]

Repare ao seu redor. Quase todo mundo aqui está com o celular na mão, olhando para o relógio ou respondendo mensagens com pressa.
Engraçado como passamos a vida correndo para ganhar tempo... e no fim, não temos tempo para quem mais importa.
O café esfria, a tarde passa, e aquela conversa com seu pai ou com sua mãe fica para 'semana que vem'.
Mas e se você respirasse fundo agora? 
Ligue para quem você ama hoje. Não deixe para quando a saudade for a única companhia. 
Um café quente e um coração presente. É tudo o que precisamos.`,
      caption: `Quantas vezes você deixou o café esfriar porque a pressa engoliu o seu dia? ☕🤍

Vivemos correndo para ganhar tempo, mas esquecemos de viver os momentos que realmente deixam saudade. Se puder, desacelere cinco minutos hoje e mande uma mensagem de carinho para quem faz a sua vida valer a pena.

Quando foi a última vez que você ligou para os seus pais sem ter pressa? Compartilhe com a gente. ✨`,
      hashtags: "#Iasis #RevivaMemories #TempoDeQualidade #Desacelere #Cotidiano #Presenca #AmorDeFamilia",
      checklist: ["Gravar vídeo do Iasis na cafeteria (9:16)", "Inserir legenda dinâmica e trilha suave de piano", "Publicar simultaneamente nas 4 redes às 12h15", "Responder aos primeiros comentários"]
    },
    {
      id: "pauta_2",
      pautaNumber: 2,
      theme: "cotidiano",
      category: "cotidiano",
      scenario: "Cafeteria Urbana",
      title: "A Última Vez que Você Ligou sem Ter um Motivo",
      format: "Vídeo Vertical (9:16) • 45 a 60s",
      channel: "Reels • TikTok • Shorts • Facebook",
      recommendedTime: "19:30",
      duration: "~52s",
      summary: "Reflexão sobre só nos comunicarmos por obrigação prática e esquecermos de ligar apenas para ouvir a voz.",
      script: `[Cenário: Iasis olhando pela janela da cafeteria ao entardecer, com olhar acolhedor]

Você já reparou que a gente só telefona quando precisa de alguma coisa?
'Mãe, onde tá aquela certidão?' ou 'Pai, me ajuda com um conserto'.
Mas quando foi a última vez que você ligou só para perguntar: 'Como foi o seu dia? Só queria ouvir a sua voz'?
A gente acha que as pessoas que amamos estarão sempre ali, a um toque na tela. Mas a vida tem o seu próprio relógio.
Hoje à noite, antes de dormir, faça essa ligação despretensiosa. Apenas para ouvir o som da voz de quem te ensinou a dar os primeiros passos.`,
      caption: `Você já ligou para alguém hoje só para ouvir a voz, sem pressa e sem motivo prático? 📞🤍

No corre-corre da rotina, a gente se acostuma a falar só sobre boletos, trabalho e obrigações. Mas o que realmente constrói memórias inesquecíveis é o afeto do cotidiano.

Faça essa ligação hoje. A vida agradece. ✨`,
      hashtags: "#Iasis #Familia #OuvirAVoz #Saudade #Maternidade #Paternidade #RevivaMemories",
      checklist: ["Gravar interpretação com olhar sincero", "Adicionar legendas dinâmicas", "Distribuir nas 4 plataformas às 19h30", "Compartilhar nos Stories"]
    },
    {
      id: "pauta_3",
      pautaNumber: 3,
      theme: "cotidiano",
      category: "cotidiano",
      scenario: "Cafeteria Urbana",
      title: "Trabalhar 50 Horas e não Ter 15 Minutos para a Família",
      format: "Vídeo Vertical (9:16) • 45 a 60s",
      channel: "Reels • TikTok • Shorts • Facebook",
      recommendedTime: "12:30",
      duration: "~48s",
      summary: "Provocação sobre a economia moderna do tempo: para que serve o sucesso se perdemos quem amamos no caminho?",
      script: `[Cenário: Iasis fechando um caderno de couro na cafeteria, com sorriso reflexivo]

Muitas pessoas me dizem: 'Iasis, eu trabalho 10 horas por dia para dar o melhor para os meus filhos e honrar meus pais'.
Isso é nobre. Muito nobre.
Mas você já se perguntou o que é o 'melhor'?
Ninguém no final da vida diz: 'Ah, como eu queria ter passado mais duas horas na planilha de Excel'.
O que fica no peito são as risadas à mesa, o bolo que a sua avó fazia, o cheiro de café passado e o abraço demorado.
Não troque a presença pela correria. O maior legado que você deixa para os seus filhos é o seu tempo.`,
      caption: `O que é o verdadeiro 'melhor' que podemos dar a quem amamos? ⏳

Trabalhar e construir o futuro é fundamental, mas nenhuma carreira substitui a bênção de um jantar em família ou o abraço apertado de quem te viu crescer.

Qual memória da sua infância você mais guarda com carinho no coração? ✨`,
      hashtags: "#Iasis #EconomiaDoTempo #PresencaReal #TrabalhoEVida #PaiEFilho #MaeEFilha #RevivaMemories",
      checklist: ["Gravar vídeo com entonação firme e madura", "Revisar legenda com chamada à reflexão", "Agendar para as 12h30", "Monitorar compartilhamentos"]
    },
    {
      id: "pauta_4",
      pautaNumber: 4,
      theme: "cotidiano",
      category: "cotidiano",
      scenario: "Cafeteria Urbana",
      title: "O Olhar que Não se Desvia da Tela",
      format: "Vídeo Vertical (9:16) • 45 a 60s",
      channel: "Reels • TikTok • Shorts • Facebook",
      recommendedTime: "20:00",
      duration: "~55s",
      summary: "Iasis fala sobre o hábito moderno de estar no mesmo ambiente físico, mas com a atenção roubada pelo algoritmo.",
      script: `[Cenário: Cafeteria com iluminação âmbar aconchegante, Iasis gesticula calmamente]

Hoje observei um pai e um filho sentados aqui perto.
Dividiam a mesma mesa, mas não dividiam o mesmo momento. Cada um preso à sua própria tela.
A tecnologia tem o poder de aproximar quem está longe, mas se não tivermos cuidado, ela distancia quem está exatamente ao nosso lado.
Quando estiver com seus pais, seus filhos ou seus amigos... guarde o celular por alguns instantes.
Olhe nos olhos. Perceba os novos fios brancos, as marcas de expressão que contam uma vida inteira de luta.
Esses olhares são únicos. E nunca voltam.`,
      caption: `Você já sentiu que o mundo virtual às vezes rouba o que temos de mais precioso no mundo real? 📱👀

A tecnologia é maravilhosa quando serve para resgatar e eternizar o amor. Mas quando estamos juntos fisicamente, nada substitui o calor do olho no olho.

Experimente colocar o celular no bolso hoje no jantar. O momento presente é o maior presente. ✨`,
      hashtags: "#Iasis #PresencaDigital #OlhoNoOlho #RelacoesHumanas #Maturidade #RevivaMemories",
      checklist: ["Gravar clipe com iluminação suave", "Legendar com fonte legível e dinâmica", "Postar às 20h00", "Fixar comentário provocador"]
    },
    {
      id: "pauta_5",
      pautaNumber: 5,
      theme: "cotidiano",
      category: "cotidiano",
      scenario: "Cafeteria Urbana",
      title: "A Saudade Não Avisa o Dia que Vai Chegar",
      format: "Vídeo Vertical (9:16) • 45 a 60s",
      channel: "Reels • TikTok • Shorts • Facebook",
      recommendedTime: "19:00",
      duration: "~54s",
      summary: "Uma reflexão sensível sobre a impermanência e como valorizar cada conversa antes que vire recordação.",
      script: `[Cenário: Iasis toma um gole de café, olha para a câmera com serenidade e respeito]

A gente vive como se o tempo fosse infinito.
Adiamos aquele café, aquele almoço de sábado, aquele pedido de desculpas sincero.
Pensamos: 'No próximo mês eu vou lá visitar'.
Mas a saudade não manda aviso prévio. Ela chega sem bater na porta, e quando nos damos conta, o que era cotidiano vira lembrança eterna.
Por que esperar a ausência para valorizar a presença?
Se você tem a bênção de ter quem você ama por perto hoje... honre esse milagre. Diga o que sente enquanto as palavras podem ser ouvidas com um sorriso.`,
      caption: `A gente nunca sabe qual é o último café, a última piada ou o último conselho. 🤍

A vida não nos dá garantias de amanhã, mas nos presenteia com o hoje. Honre a presença de quem você ama enquanto há tempo de abraçar forte.

A quem você diria um 'eu te amo' sincero agora mesmo? Marque ou mande esse vídeo para essa pessoa. ✨`,
      hashtags: "#Iasis #SaudadeComAmor #Gratidao #AmorIncondicional #Lembrancas #RevivaMemories",
      checklist: ["Gravar take com expressão acolhedora", "Ajustar trilha sonora tocante", "Publicar às 19h00", "Repassar para grupos de WhatsApp"]
    },
    {
      id: "pauta_6",
      pautaNumber: 6,
      theme: "cotidiano",
      category: "cotidiano",
      scenario: "Cafeteria Urbana",
      title: "O que Aprendi Observando uma Mesa de Família",
      format: "Vídeo Vertical (9:16) • 45 a 60s",
      channel: "Reels • TikTok • Shorts • Facebook",
      recommendedTime: "11:45",
      duration: "~50s",
      summary: "Iasis compartilha uma crônica do cotidiano sobre uma avó contando histórias para os netos.",
      script: `[Cenário: Iasis sorri com ternura, xícara na mão na varanda da cafeteria]

Ontem vi uma senhora aqui na cafeteria com seus dois netos.
Ela tirou da bolsa uma foto amarelada e começou a contar como conheceu o avô deles, 50 anos atrás.
O brilho nos olhos daqueles jovens ouvindo a história... foi algo mágico.
As histórias da nossa família são o nosso maior tesouro. Quando os mais velhos contam o passado, eles estão nos entregando as nossas próprias raízes.
Você conhece a história de amor dos seus avós? Já parou para perguntar como eles superaram os momentos difíceis?
Pergunte. Grave. Guarde no peito.`,
      caption: `Nossas raízes familiares são a bússola que nos guia pela vida. 📖👵👴

Quantas histórias lindas estão guardadas na memória dos seus pais e avós esperando apenas uma pergunta sua para virem à tona?

Você sabe como seus pais ou avós se conheceram? Conte nos comentários! ✨`,
      hashtags: "#Iasis #Avos #HistoriasDeFamilia #Raizes #Ancestralidade #MemoriaViva #RevivaMemories",
      checklist: ["Gravar vídeo com tom afetuoso de crônica", "Legendar falas principais", "Publicar às 11h45", "Incentivar histórias nos comentários"]
    },
    {
      id: "pauta_7",
      pautaNumber: 7,
      theme: "cotidiano",
      category: "trafego",
      scenario: "Estratégia & Anúncios",
      title: "Impulsionamento Perpétuo: O Café que Esfria (Meta Ads)",
      format: "Configuração de Anúncios no Gerenciador",
      channel: "Meta Ads (Instagram & Facebook)",
      recommendedTime: "10:00",
      duration: "Ajuste Técnico",
      summary: "Impulsionar o vídeo reflexivo mais assistido da semana com orçamento contínuo (R$ 20/dia) para público aberto de 35 a 65+ anos.",
      script: `[Ação Operacional do Gestor de Tráfego]:
1. Acessar o Gerenciador de Anúncios do Meta Ads.
2. Selecionar o vídeo com maior retenção orgânica (ex: Pauta 1 'O Café que Esfria' ou Pauta 5 'A Saudade').
3. Criar Campanha Perpétua de Engajamento & Visualização de Vídeo (ThruPlay):
   - Orçamento: R$ 20 a R$ 30 por dia contínuo (Always-On).
   - Público: Brasil, Homens e Mulheres de 35 a 65+ anos.
   - Interesses: Família, Psicologia, Espiritualidade, Homenagens.
4. Manter a campanha rodando perenemente para atrair seguidores qualificados.`,
      caption: `Configuração da máquina perpétua de distribuição paga dos melhores conteúdos reflexivos do Iasis.`,
      hashtags: "#MetaAds #TrafegoPerpetuo #EstrategiaDigital #RevivaMemories",
      checklist: ["Verificar métricas orgânicas da semana", "Subir campanha de visualização ThruPlay", "Inserir link da bio trackeado (UTM)", "Monitorar custo por clique"]
    },

    // --- TEMA 2: PARQUE & FAMÍLIA ---
    {
      id: "pauta_8",
      pautaNumber: 8,
      theme: "familia",
      category: "familia",
      scenario: "Parque ao Entardecer",
      title: "A Árvore que Seus Avós Plantaram",
      format: "Vídeo Vertical (9:16) • 45 a 60s",
      channel: "Reels • TikTok • Shorts • Facebook",
      recommendedTime: "17:45",
      duration: "~52s",
      summary: "Iasis caminha pelo parque ao pôr do sol e fala sobre raízes profundas que nos sustentam nas tempestades.",
      script: `[Cenário: Iasis caminhando por uma alameda de árvores frondosas no parque, luz dourada do entardecer]

Olhe para esta árvore centenária.
Ela enfrentou vendavais, tempestades e secas rigorosas. E continua firme.
Sabe por quê? Porque as raízes dela são profundas e invisíveis aos olhos de quem passa com pressa.
Na nossa vida, a nossa família é essa raiz.
Os valores que seu pai te ensinou, a fé da sua mãe, o abraço silencioso dos seus avós... são essas raízes que não te deixam cair quando o vento da vida sopra forte.
Nunca esqueça de onde você veio. Honrar as suas raízes é o maior segredo para crescer com sabedoria.`,
      caption: `Quem tem raízes fortes não teme as tempestades da vida. 🌳✨

Tudo o que somos hoje começou nos passos, nas lutas e no amor de quem veio antes de nós. Honrar a história dos nossos pais e avós é manter acesa a nossa própria essência.

Qual é o maior ensinamento que você herdou da sua família? 🤍`,
      hashtags: "#Iasis #RaizesFortes #Ancestrais #Familia #Sabedoria #Maturidade #RevivaMemories",
      checklist: ["Gravar caminhada suave no parque", "Capturar a luz dourada do entardecer", "Adicionar legenda dinâmica", "Publicar às 17h45 em todas as redes"]
    },
    {
      id: "pauta_9",
      pautaNumber: 9,
      theme: "familia",
      category: "familia",
      scenario: "Parque ao Entardecer",
      title: "O Conselho do Seu Pai que Você só Entendeu Adulto",
      format: "Vídeo Vertical (9:16) • 45 a 60s",
      channel: "Reels • TikTok • Shorts • Facebook",
      recommendedTime: "19:30",
      duration: "~55s",
      summary: "Reflexão sobre a maturidade que nos faz reconhecer a sabedoria dos pais quando antes achávamos exagero.",
      script: `[Cenário: Iasis encostado num banco de madeira no parque, olhar sereno]

Quando somos jovens, achamos que sabemos tudo.
Quantas vezes ouvimos um conselho do nosso pai ou da nossa mãe e pensamos: 'Que exagero... eles não entendem nada do mundo moderno'.
Aí os anos passam. A vida nos cobra, as responsabilidades chegam, os filhos nascem.
E de repente, em um momento difícil, aquela frase dita há vinte anos ecoa na nossa mente com uma clareza impressionante.
A sabedoria dos nossos pais não vinha de livros; vinha da vida gasta com amor por nós.
Se seu pai ainda está por aqui, agradeça a ele hoje. Se ele já partiu... sorria, porque o conselho dele ainda vive em você.`,
      caption: `Você já se pegou repetindo exatamente a mesma frase que o seu pai ou a sua mãe dizia? 💭🤍

A maturidade tem esse dom: ela nos faz enxergar o amor e a sabedoria que existiam por trás de cada 'não' e de cada conselho dos nossos pais.

Qual conselho do seu pai ou da sua mãe você carrega para sempre? ✨`,
      hashtags: "#Iasis #ConselhosDePai #AmorDeMae #Maturidade #Gratidao #Legado #RevivaMemories",
      checklist: ["Gravar com expressão emotiva", "Ajustar áudio límpido da voz do Iasis", "Publicar às 19h30", "Interagir com histórias de pais e mães"]
    },
    {
      id: "pauta_10",
      pautaNumber: 10,
      theme: "familia",
      category: "familia",
      scenario: "Parque ao Entardecer",
      title: "A Voz da Sua Mãe: Quando Foi a Última Vez que Você Gravou?",
      format: "Vídeo Vertical (9:16) • 45 a 60s",
      channel: "Reels • TikTok • Shorts • Facebook",
      recommendedTime: "12:15",
      duration: "~49s",
      summary: "Um alerta afetuoso sobre o perigo de guardarmos milhares de fotos de paisagens e nenhuma gravação da voz de quem amamos.",
      script: `[Cenário: Iasis segurando um gravador antigo ou celular no parque]

Faça um teste rápido no seu celular.
Role a sua galeria. Você vai achar centenas de fotos de comida, viagens, recibos, selfies e paisagens.
Agora me responda com sinceridade: quantas gravações de áudio da voz da sua mãe ou do seu pai você tem salvas?
A voz é a primeira coisa que a mente humana começa a esquecer com o passar dos anos.
E é o som que mais traz conforto e consolo para o peito quando a saudade aperta.
Grave a risada da sua mãe. Grave uma história boba que seu pai conta à mesa.
Esse áudio vai ser o seu bem mais valioso no futuro.`,
      caption: `Temos milhares de fotos no celular, mas quando foi a última vez que guardamos o som da voz de quem amamos? 🎙️🤍

A voz carrega a alma, o sotaque e o carinho inconfundível dos nossos pais e avós. Nunca deixe de registrar as risadas e histórias enquanto elas acontecem ao vivo.

Guarde esse lembrete no coração. ✨`,
      hashtags: "#Iasis #VozDeMae #LembrancaViva #Eternizar #AmorEterno #RevivaMemories",
      checklist: ["Gravar take intimista", "Legendar destacando a importância da voz", "Publicar às 12h15", "Estimular envio de áudios de família"]
    },
    {
      id: "pauta_11",
      pautaNumber: 11,
      theme: "familia",
      category: "familia",
      scenario: "Parque ao Entardecer",
      title: "Envelhecer é uma Arte que a Juventude Ignora",
      format: "Vídeo Vertical (9:16) • 45 a 60s",
      channel: "Reels • TikTok • Shorts • Facebook",
      recommendedTime: "18:30",
      duration: "~54s",
      summary: "Reflexão sobre valorizar a terceira idade e aprender a ter paciência com o ritmo mais calmo dos mais velhos.",
      script: `[Cenário: Iasis caminhando no parque ao lado de bancos onde idosos conversam calmamente]

O mundo moderno tem uma pressa cruel.
Queremos tudo em cinco segundos: a entrega rápida, a resposta imediata, o vídeo acelerado em 2x.
E quando estamos com uma pessoa idosa, às vezes nos falta a paciência para ouvir aquele mesmo relato pela terceira vez.
Mas envelhecer não é perder o vigor; é acumular vida.
Quem tem passos lentos já correu muito para que você pudesse chegar onde está hoje.
Abaixe o seu ritmo. Dê a mão. Escute com carinho.
Um dia, se Deus quiser, os passos lentos serão os nossos. E tudo o que vamos querer é alguém que segure a nossa mão sem pressa.`,
      caption: `Você já parou para agradecer a quem desacelerou os passos para te ensinar a andar? 👵👴🤍

A paciência com os mais velhos é a forma mais pura de amor e gratidão. Respeite o tempo, as rugas e a história de quem construiu o caminho por onde você passa hoje.

Compartilhe com quem tem um amor imenso pelos avós ou pais idosos. ✨`,
      hashtags: "#Iasis #TerceiraIdade #Respeito #AmorAosIdosos #Paciencia #RevivaMemories",
      checklist: ["Gravar clipe com iluminação suave", "Adicionar trilha de cordas serena", "Postar às 18h30", "Responder comentários carinhosos"]
    },
    {
      id: "pauta_12",
      pautaNumber: 12,
      theme: "familia",
      category: "familia",
      scenario: "Parque ao Entardecer",
      title: "O Abraço que Não Demos Antes da Partida",
      format: "Vídeo Vertical (9:16) • 45 a 60s",
      channel: "Reels • TikTok • Shorts • Facebook",
      recommendedTime: "20:15",
      duration: "~53s",
      summary: "Uma mensagem de perdão e alívio para quem carrega a culpa de não ter se despedido como gostaria.",
      script: `[Cenário: Iasis sentado na grama do parque, sob a copa de uma árvore acolhedora]

Eu sei que algumas pessoas me assistem agora carregando um peso silencioso no peito.
A culpa de não ter dado aquele último abraço, de ter brigado por uma bobagem, ou de não ter chegado a tempo da despedida.
Se esse for o seu caso, escute com atenção o que vou te dizer:
O amor não se mede pelos últimos cinco minutos de uma vida.
Ele se mede pelos anos de convivência, pelos risos sinceros, pela dedicação e pelo afeto verdadeiro que vocês construíram.
Perdoe a si mesmo. Quem partiu levou o seu amor inteiro, e não a imperfeição daquele último momento.
Fique em paz.`,
      caption: `Uma mensagem de carinho para você que carrega o peso de uma despedida imperfeita. 🕊️🤍

Não deixe que a dor do fim apague a beleza de toda a caminhada que vocês construíram juntos. O amor transcende qualquer ausência física e continua vivo no seu coração.

Respire fundo e sinta essa paz hoje. ✨`,
      hashtags: "#Iasis #Consolo #Alento #PazNoCoracao #Superacao #SaudadeComAmor #RevivaMemories",
      checklist: ["Gravar com tom de acolhimento profundo", "Legenda limpa e elegante", "Publicar às 20h15", "Acolher mensagens com carinho"]
    },
    {
      id: "pauta_13",
      pautaNumber: 13,
      theme: "familia",
      category: "familia",
      scenario: "Parque ao Entardecer",
      title: "Histórias que Somem se Ninguém Contar",
      format: "Vídeo Vertical (9:16) • 45 a 60s",
      channel: "Reels • TikTok • Shorts • Facebook",
      recommendedTime: "15:00",
      duration: "~48s",
      summary: "Incentivo a registrar e documentar o legado familiar antes que as lembranças se percam no tempo.",
      script: `[Cenário: Iasis caminhando pelo parque com um livro antigo na mão]

Você sabia que a maioria das famílias esquece o nome dos seus bisavós em menos de três gerações?
Parece duro, mas é a verdade.
Se ninguém registrar, as histórias de coragem, os sacrifícios e as superações que permitiram a sua família existir simplesmente desaparecem no ar.
A memória é um patrimônio sagrado.
Faça perguntas hoje. Anote num caderno. Grave vídeos.
Não deixe que o amor dos seus ancestrais vire apenas poeira esquecida em um porta-retrato velho.
Eles merecem ser lembrados para sempre.`,
      caption: `O que você sabe sobre a história de luta dos seus bisavós? 📜✨

Uma família que não preserva sua memória perde sua bússola. Nós somos feitos das histórias que contamos e do amor que escolhemos eternizar.

Vamos começar a registrar essas lembranças hoje? Comente um nome importante da sua família! 🤍`,
      hashtags: "#Iasis #LegadoFamiliar #Ancestralidade #MemoriaViva #HistoriaDeFamilia #RevivaMemories",
      checklist: ["Gravar fala reflexiva", "Legendar palavras principais", "Publicar às 15h00", "Fixar comentário engajador"]
    },
    {
      id: "pauta_14",
      pautaNumber: 14,
      theme: "familia",
      category: "trafego",
      scenario: "Estratégia & Anúncios",
      title: "Remarketing Perpétuo: Públicos de Família no Meta Ads",
      format: "Gestão de Tráfego Contínuo",
      channel: "Meta Ads & TikTok Ads",
      recommendedTime: "11:00",
      duration: "Ajuste Técnico",
      summary: "Criar público personalizado de quem assistiu aos vídeos de família e direcionar suavemente para o site.",
      script: `[Ação Operacional do Gestor de Tráfego]:
1. Criar Público Personalizado de Vídeo (Engajamento 50%+ e 75%+) nos vídeos de família.
2. Ativar Conjunto de Remarketing Suave:
   - Criativo: Vídeo do Iasis apresentando a missão da Reviva Memories com link direto para o site.
   - Orçamento: R$ 15/dia contínuo.
   - Meta: Visitas qualificadas à Galeria de Homenagens (Cases de Casamento e Formatura).
3. Analisar custo por visitante e mensagens no WhatsApp.`,
      caption: `Otimização técnica do funil contínuo: transformando espectadores reflexivos em admiradores da Reviva Memories.`,
      hashtags: "#MetaAds #Remarketing #TrafegoAfetivo #RevivaMemories",
      checklist: ["Criar público de quem assistiu 50% dos vídeos", "Ligar anúncio suave convidando para a Galeria", "Verificar pixel de conversão"]
    },

    // --- TEMA 3: LIVRARIA & MENTE ---
    {
      id: "pauta_15",
      pautaNumber: 15,
      theme: "psicologia",
      category: "psicologia",
      scenario: "Livraria & Varanda",
      title: "Por que a Mente Guarda o Cheiro de Quem Partiu?",
      format: "Vídeo Vertical (9:16) • 45 a 60s",
      channel: "Reels • TikTok • Shorts • Facebook",
      recommendedTime: "19:30",
      duration: "~53s",
      summary: "Explicação neurocientífica e sensível sobre a memória olfativa e por que certos aromas nos transportam no tempo.",
      script: `[Cenário: Iasis folheando um livro clássico em uma livraria aconchegante com estantes de madeira]

Você já sentiu um aroma qualquer na rua e, em um segundo, sentiu como se estivesse na cozinha da sua infância?
A neurociência explica isso. O nosso olfato é o único sentido com ligação direta ao sistema límbico, a área do cérebro que comanda as emoções e as memórias mais primitivas.
Por isso o perfume da sua mãe ou o cheiro do café da sua avó não são apenas sensações físicas; são portais no tempo.
A mente humana foi feita para amar e para lembrar.
A saudade que você sente é a prova viva de que o amor que você recebeu nunca se perdeu. Ele continua gravado em cada célula da sua história.`,
      caption: `Qual é o aroma que te transporta instantaneamente para os melhores dias da sua infância? ☕🌸

A ciência e o coração concordam: nada do que vivemos com amor genuíno desaparece. Nossas memórias são guardadas com fidelidade na alma.

Conte aqui qual cheirinho te faz lembrar de alguém especial. ✨`,
      hashtags: "#Iasis #PsicologiaDoAfeto #Neurociencia #MemoriaOlfativa #SaudadeBoa #RevivaMemories",
      checklist: ["Gravar em livraria com luz quente", "Inserir legendas claras", "Publicar às 19h30", "Responder com curiosidades e carinho"]
    },
    {
      id: "pauta_16",
      pautaNumber: 16,
      theme: "psicologia",
      category: "psicologia",
      scenario: "Livraria & Varanda",
      title: "O Luto não é Esquecimento: É o Amor sem Lugar para Morar",
      format: "Vídeo Vertical (9:16) • 45 a 60s",
      channel: "Reels • TikTok • Shorts • Facebook",
      recommendedTime: "20:00",
      duration: "~55s",
      summary: "Frase célebre da psicologia ressignificada: o luto é a continuação do amor quando a presença física cessa.",
      script: `[Cenário: Iasis sentado numa poltrona de leitura, fechando um livro devagar]

Há uma frase muito verdadeira na psicologia que diz:
'O luto é todo o amor que você queria entregar e não tem mais onde colocar'.
Muitas pessoas acham que superar uma perda significa esquecer, virar a página, fingir que nada aconteceu.
Não é verdade. Você não precisa esquecer quem te ensinou a amar.
Superar não é apagar; é dar um novo lar para esse amor.
É transformá-lo em carinho com quem ficou, em valores passados adiante e em gratidão por ter tido a honra de caminhar junto.
A sua dor merece respeito. Mas o seu amor merece a eternidade.`,
      caption: `O luto não é fraqueza e não é silêncio forçado: é a medida exata do amor que existiu. 🤍🕊️

Não se cobre para esquecer. Dê um novo significado à saudade, celebrando a vida, os conselhos e o privilégio de ter compartilhado a jornada com quem você ama.

Deixe seu coração em paz hoje. ✨`,
      hashtags: "#Iasis #PsicologiaDoLuto #AmorQueFica #Consolo #SuperacaoComPaz #RevivaMemories",
      checklist: ["Gravar take intimista com voz aveludada", "Legenda dinâmica impecável", "Postar às 20h00", "Monitorar mensagens de consolo"]
    },
    {
      id: "pauta_17",
      pautaNumber: 17,
      theme: "psicologia",
      category: "psicologia",
      scenario: "Livraria & Varanda",
      title: "Cartas e Bilhetes na Gaveta: O Valor do Palpável",
      format: "Vídeo Vertical (9:16) • 45 a 60s",
      channel: "Reels • TikTok • Shorts • Facebook",
      recommendedTime: "12:15",
      duration: "~50s",
      summary: "Reflexão sobre a perda de registros físicos na era digital e o valor de uma letra escrita à mão.",
      script: `[Cenário: Iasis segura um bilhete antigo escrito à mão na varanda ensolarada]

Quando foi a última vez que você viu a caligrafia da sua mãe ou do seu pai?
Antes do WhatsApp, a gente escrevia bilhetes, cartões de aniversário, receitas em cadernos pautados.
A caligrafia de alguém é quase como uma impressão digital da alma: o jeito de fazer o 'T', a força da caneta no papel, o recado carinhoso deixado na porta da geladeira.
Na era das mensagens descartáveis de 24 horas, guardar esses registros físicos é um ato de resistência do afeto.
Se você tem um bilhete guardado em uma gaveta... tire-o de lá hoje. Releia. Sinta a presença que continua ali.`,
      caption: `Você ainda guarda algum bilhete ou carta escrita à mão por alguém que ama? ✍️💌

Na velocidade das mensagens automáticas, a letra de quem amamos carrega um calor que nenhuma tela de vidro consegue imitar.

Guarde esses papéis como ouro. Eles são fragmentos da alma. ✨`,
      hashtags: "#Iasis #CartasDeAmor #Caligrafia #LembrancaPalpavel #AfetoVerdadeiro #RevivaMemories",
      checklist: ["Gravar clipe com foco no papel", "Adicionar legendas destacando as palavras", "Publicar às 12h15", "Pedir fotos de bilhetes nos Stories"]
    },
    {
      id: "pauta_18",
      pautaNumber: 18,
      theme: "psicologia",
      category: "psicologia",
      scenario: "Livraria & Varanda",
      title: "Perdoar quem já Partiu para Encontrar a Paz Interior",
      format: "Vídeo Vertical (9:16) • 45 a 60s",
      channel: "Reels • TikTok • Shorts • Facebook",
      recommendedTime: "19:00",
      duration: "~54s",
      summary: "Uma reflexão profunda sobre perdoar falhas de pais e avós que já se foram para curar o próprio coração.",
      script: `[Cenário: Iasis contemplando o céu no fim de tarde na varanda, voz serena]

Nem toda relação familiar é um comercial de margarina.
Muitos de nós carregam feridas, mágoas e desentendimentos com pessoas queridas que já partiram.
E às vezes pensamos: 'Agora é tarde demais para acertar as coisas'.
Não é. O perdão não precisa de um encontro físico; ele precisa de um movimento sincero dentro do seu próprio peito.
Compreenda que seus pais ou avós fizeram o melhor que sabiam com as ferramentas emocionais que eles tinham na época deles.
Liberte o passado. Solte a mágoa.
Quando você perdoa quem já partiu, a ferida finalmente vira cicatriz de sabedoria e paz.`,
      caption: `O perdão não muda o passado, mas liberta o seu futuro. 🕊️🤍

Ninguém é perfeito na caminhada da vida. Quando compreendemos as limitações de quem nos criou, encontramos a paz que cura qualquer mágoa antiga.

Respire fundo e liberte esse peso do peito. ✨`,
      hashtags: "#Iasis #Perdao #PazInterior #CuraEmocional #Familia #RevivaMemories",
      checklist: ["Gravar com expressão de profunda empatia", "Trilha suave e reconfortante", "Publicar às 19h00", "Acolher relatos nos comentários"]
    },
    {
      id: "pauta_19",
      pautaNumber: 19,
      theme: "psicologia",
      category: "psicologia",
      scenario: "Livraria & Varanda",
      title: "A Música que Traz Alguém de Volta em Três Segundos",
      format: "Vídeo Vertical (9:16) • 45 a 60s",
      channel: "Reels • TikTok • Shorts • Facebook",
      recommendedTime: "18:00",
      duration: "~48s",
      summary: "A relação íntima entre música, afeto e memória emotiva que nunca se apaga.",
      script: `[Cenário: Iasis ao lado de uma vitrola ou rádio antigo na livraria]

Três notas no violão ou o acorde inicial de uma canção antiga.
É só disso que o cérebro precisa para te fazer chorar de saudade ou sorrir sozinho no trânsito.
A música tem a chave mestra das nossas memórias mais secretas.
Qual é a canção que, quando toca no rádio, imediatamente te faz ver o rosto do seu pai dirigindo na estrada, ou a sua mãe cantando enquanto arrumava a casa no domingo?
Essas canções são o patrimônio afetivo da sua vida.
Escute essa música hoje. Feche os olhos. E permita-se reencontrar com esse momento.`,
      caption: `Qual é a música que é praticamente um abraço de alguém que você ama? 🎵🤍

A música atravessa o tempo e revive sentimentos que pareciam adormecidos. Nunca deixe de cantar as canções que marcaram a sua história.

Diga nos comentários: qual música tem o nome de quem você ama? ✨`,
      hashtags: "#Iasis #MusicaEMemoria #TrilhaSonoraDaVida #NostalgiaBoa #RevivaMemories",
      checklist: ["Gravar vídeo com tom nostálgico", "Adicionar efeito sutil de vinil", "Publicar às 18h00", "Montar playlist de músicas sugeridas"]
    },
    {
      id: "pauta_20",
      pautaNumber: 20,
      theme: "psicologia",
      category: "psicologia",
      scenario: "Livraria & Varanda",
      title: "O Medo de Esquecer o Tom da Voz de Quem Amamos",
      format: "Vídeo Vertical (9:16) • 45 a 60s",
      channel: "Reels • TikTok • Shorts • Facebook",
      recommendedTime: "19:30",
      duration: "~55s",
      summary: "A ponte sutil entre a dor do esquecimento da voz e o propósito da Reviva Memories.",
      script: `[Cenário: Iasis olha diretamente para a câmera, com sinceridade e serenidade]

Muitas pessoas me procuram com uma mesma angústia guardada no olhar:
'Iasis... faz cinco anos que perdi meu pai. Eu lembro do rosto dele nas fotos, mas tenho tanto medo de esquecer o timbre exato da voz dele dizendo o meu nome'.
Essa dor é real. A voz humana é a assinatura viva do afeto.
E foi exatamente para responder a essa angústia que a tecnologia deu um passo adiante com a arte.
Hoje é possível resgatar timbres, reconstruir palavras não ditas e permitir que essa voz abençoe momentos fundamentais da família.
A memória viva não precisa se apagar. Ela pode continuar falando ao coração.`,
      caption: `O som da voz de quem amamos é uma das lembranças mais sagradas que guardamos na alma. 🕊️✨

Quando o medo de esquecer aperta, a união entre afeto, arte e tecnologia surge para construir uma ponte de alento e consolo.

A voz de quem partiu ainda ecoa forte no seu coração? Comente aqui. 🤍`,
      hashtags: "#Iasis #VozViva #Eternizar #AmorEterno #RevivaMemories #Consolo",
      checklist: ["Gravar interpretação solene", "Legenda destacando 'A memória viva não precisa se apagar'", "Publicar às 19h30", "Responder às famílias"]
    },
    {
      id: "pauta_21",
      pautaNumber: 21,
      theme: "psicologia",
      category: "trafego",
      scenario: "Estratégia & Anúncios",
      title: "Distribuição Contínua de Vídeos com Maior Compartilhamento",
      format: "Painel de Métricas Meta & TikTok",
      channel: "Instagram Insights, TikTok Analytics & Meta Ads",
      recommendedTime: "10:30",
      duration: "Ajuste Técnico",
      summary: "Identificar os vídeos do tema psicologia com maior taxa de salvamento e compartilhamento para impulsionamento perene.",
      script: `[Ação Operacional do Gestor de Tráfego]:
1. Acessar métricas orgânicas dos temas de psicologia e memória.
2. Medir a taxa de compartilhamentos e salvamentos.
3. Selecionar o melhor criativo (ex: Pauta 16 'O Luto é o Amor sem Lugar' ou Pauta 20 'O Tom da Voz').
4. Alocar R$ 25/dia na campanha contínua de tráfego direcionado para a página institucional da Reviva Memories.`,
      caption: `Monitoramento contínuo da tração emocional e ampliação perpétua dos conteúdos de maior alcance.`,
      hashtags: "#Analytics #TrafegoPerpetuo #EstrategiaDigital #RevivaMemories",
      checklist: ["Verificar métricas de salvamentos", "Inserir melhor vídeo na campanha", "Ajustar segmentação"]
    },

    // --- TEMA 4: ESTÚDIO & REVIVA MEMORIES ---
    {
      id: "pauta_22",
      pautaNumber: 22,
      theme: "estudio",
      category: "estudio",
      scenario: "Estúdio Reviva Memories",
      title: "Quando a Tecnologia tem Alma: Como Recriamos um Olhar",
      format: "Vídeo Vertical (9:16) • 45 a 60s",
      channel: "Reels • TikTok • Shorts • Facebook",
      recommendedTime: "19:30",
      duration: "~52s",
      summary: "Iasis no estúdio de produção mostrando que inteligência artificial sem sensibilidade humana é apenas código frio.",
      script: `[Cenário: Estúdio de Produção da Reviva Memories, telas ao fundo com restauração de fotos antigas e ondas sonoras]

Muita gente me pergunta se a inteligência artificial não é fria demais para lidar com sentimentos tão sagrados.
E eu sempre respondo: a tecnologia é apenas um instrumento. Quem dá alma ao processo é a sensibilidade humana.
Aqui no nosso estúdio, cada foto que recebemos de uma família é tratada com reverência.
Analisamos a microexpressão do olhar, o jeito único de sorrir, a cadência da respiração na voz.
Não estamos criando um robô; estamos reconstruindo uma ponte de amor para que uma família sinta a presença de quem partiu no dia mais importante de suas vidas.
Isso não é sobre tecnologia. É sobre cura.`,
      caption: `Tecnologia sem afeto é apenas código. Mas quando guiada pelo amor, ela vira um instrumento de consolo e bênção. ✨🕊️

Conheça os bastidores do nosso estúdio de criação na Reviva Memories, onde cada detalhe é recriado com respeito absoluto à memória de quem você ama.

Acesse o link na nossa bio e veja como essa arte acontece. 🤍`,
      hashtags: "#Iasis #EstudioReviva #TecnologiaEAfeito #Bastidores #ProducaoHumanizada #RevivaMemories",
      checklist: ["Gravar no ambiente do estúdio de produção", "Inserir takes b-roll sutis das telas de edição", "Publicar às 19h30 nas 4 redes", "Fixar link da bio"]
    },
    {
      id: "pauta_23",
      pautaNumber: 23,
      theme: "estudio",
      category: "estudio",
      scenario: "Estúdio Reviva Memories",
      title: "Case Real: A Bênção do Pai para a Noiva no Altar",
      format: "Vídeo Vertical (9:16) • 45 a 60s",
      channel: "Reels • TikTok • Shorts • Facebook",
      recommendedTime: "20:00",
      duration: "~56s",
      summary: "Narrativa emocionante de um dos cases mais marcantes: a noiva que ouviu a bênção do pai falecido antes de entrar na igreja.",
      script: `[Cenário: Iasis no estúdio, segurando um tablet mostrando brevemente a foto de um casamento com lágrimas de emoção]

Imagine a cena: uma jovem noiva no camarim, minutos antes de subir ao altar.
O coração dela aperta porque a pessoa mais importante da sua vida não está ali fisicamente para conduzi-la: o seu pai, que partiu há quatro anos.
De repente, a mãe entrega um fone de ouvido.
Na tela, com o olhar límpido e o mesmo sorriso terno de sempre, a imagem e a voz do pai surgem dizendo:
'Minha filha, você está linda. Eu estou aqui abençoando cada passo seu'.
As lágrimas que caíram ali não foram de tristeza; foram de alívio e plenitude.
Eternizar momentos como esse é a razão pela qual existimos.`,
      caption: `Você consegue imaginar a emoção de ouvir a bênção de quem você mais ama no dia do seu casamento? 👰💍🕊️

A ausência física não precisa impedir que o amor se faça presente nos momentos mais importantes da nossa vida. A Reviva Memories nasceu para tornar esses reencontros possíveis.

Veja o case completo no link da nossa bio. ✨`,
      hashtags: "#Iasis #CasamentoDosSonhos #BencaoDePai #NoivaEmocionada #HomenagemAfetiva #RevivaMemories",
      checklist: ["Gravar narrativa com ritmo emocionante", "Inserir música de piano clássico", "Publicar às 20h00", "Monitorar directs"]
    },
    {
      id: "pauta_24",
      pautaNumber: 24,
      theme: "estudio",
      category: "estudio",
      scenario: "Estúdio Reviva Memories",
      title: "Case Real: O Avô que Assistiu à Formatura em Medicina",
      format: "Vídeo Vertical (9:16) • 45 a 60s",
      channel: "Reels • TikTok • Shorts • Facebook",
      recommendedTime: "12:30",
      duration: "~54s",
      summary: "Case do avô agricultor que sonhava em ver o neto médico e cuja homenagem em vídeo marcou a colação de grau.",
      script: `[Cenário: Iasis no estúdio, com postura respeitosa e calorosa]

O Seu Antônio era um agricultor simples do interior. As mãos calejadas trabalharam a vida toda com um único grande sonho: ver o neto se formar em Medicina.
Infelizmente, ele faleceu seis meses antes da colação de grau.
No dia do baile, a família preparou uma surpresa no telão principal.
O Seu Antônio apareceu, com a camisa xadrez que ele adorava e aquele jeitinho manso de falar:
'Meu neto doutor... o vovô tá aqui te aplaudindo de pé'.
O salão inteiro parou. A dor da perda deu lugar ao orgulho e à certeza de que a promessa foi cumprida.
Honrar quem acreditou em nós é a coisa mais linda que podemos fazer.`,
      caption: `Honrar a promessa feita aos nossos avós é um dos maiores privilégios da vida. 🎓👨‍⚕️🤍

O Seu Antônio não pôde estar de corpo presente na formatura do neto, mas a sua voz e o seu olhar abençoaram aquele momento para sempre.

A quem você dedicaria a sua maior conquista hoje? ✨`,
      hashtags: "#Iasis #Formatura #Medicina #OrgulhoDoAvo #PromessaCumprida #RevivaMemories",
      checklist: ["Gravar take expressivo", "Legenda com palavras de destaque", "Postar às 12h30", "Estimular comentários"]
    },
    {
      id: "pauta_25",
      pautaNumber: 25,
      theme: "estudio",
      category: "estudio",
      scenario: "Estúdio Reviva Memories",
      title: "A Ética Inegociável de Trazer uma Voz de Volta",
      format: "Vídeo Vertical (9:16) • 45 a 60s",
      channel: "Reels • TikTok • Shorts • Facebook",
      recommendedTime: "19:00",
      duration: "~52s",
      summary: "Transparência total sobre respeito ético, consentimento e integridade da imagem e mensagem.",
      script: `[Cenário: Iasis sentado na mesa de reuniões do estúdio de produção, olhar firme e sério]

Muitas pessoas me perguntam sobre os limites éticos do nosso trabalho.
E essa é a pergunta mais importante de todas.
Na Reviva Memories, nós temos um código inegociável:
Nunca recriamos mensagens que a pessoa em vida não diria. Jamais usamos o nome de alguém para piadas, desavenças ou manipulações.
Todo roteiro é construído lado a lado com a família, resgatando apenas palavras de bênção, afeto, consolo e reconciliação.
A tecnologia tem que servir à dignidade humana, nunca ao desrespeito.
É com esse compromisso sagrado que acolhemos cada história que chega até nós.`,
      caption: `O respeito e a dignidade humana são a nossa primeira e mais importante diretriz. 🛡️🕊️

Na Reviva Memories, cada recriação de voz e imagem passa por um rigoroso compromisso ético: resgatar apenas a verdade do amor, da paz e do afeto que aquela pessoa sempre representou.

Conheça os nossos princípios no site oficial. Link na bio. ✨`,
      hashtags: "#Iasis #EticaEIA #RespeitoSempre #Dignidade #Seguranca #RevivaMemories",
      checklist: ["Gravar com postura de autoridade", "Legendar destacando o compromisso ético", "Publicar às 19h00", "Responder dúvidas técnicas"]
    },
    {
      id: "pauta_26",
      pautaNumber: 26,
      theme: "estudio",
      category: "estudio",
      scenario: "Estúdio Reviva Memories",
      title: "Depoimento de Família: O Choro que Virou Alívio",
      format: "Vídeo Vertical (9:16) • 45 a 60s",
      channel: "Reels • TikTok • Shorts • Facebook",
      recommendedTime: "20:00",
      duration: "~50s",
      summary: "Iasis lê trecho de uma mensagem de WhatsApp enviada por uma cliente emocionada após receber a homenagem.",
      script: `[Cenário: Iasis segurando o celular no estúdio, com um sorriso de gratidão sincera]

Hoje de manhã recebi uma mensagem que iluminou o meu dia.
Uma cliente de Belo Horizonte nos escreveu dizendo:
'Iasis, quando o vídeo chegou, eu tive medo de dar o play e sentir aquela dor aguda de novo.
Mas quando a voz da minha mãe soou, chamando o meu apelido de infância e me abençoando... todo o peso do meu peito se desfez. Eu chorei, mas foi um choro de alívio e paz'.
Ouvir isso confirma a nossa missão.
A saudade não precisa ser um fardo escuro. Ela pode ser uma luz suave que te acompanha para sempre.`,
      caption: `Quando a saudade se transforma em paz e consolo no peito. 🤍🕊️

Nosso maior presente é receber relatos como este, onde o medo da ausência dá lugar à certeza de que o amor nunca nos abandona.

Veja mais depoimentos e conheça a nossa galeria no link da bio. ✨`,
      hashtags: "#Iasis #ProvaSocial #DepoimentoReal #Alento #Consolo #Paz #RevivaMemories",
      checklist: ["Gravar com sentimento genuíno de gratidão", "Inserir print sutil da mensagem", "Publicar às 20h00", "Fixar depoimento nos comentários"]
    },
    {
      id: "pauta_27",
      pautaNumber: 27,
      theme: "estudio",
      category: "estudio",
      scenario: "Estúdio Reviva Memories",
      title: "Como Funciona o Processo de Criação na Reviva Memories",
      format: "Vídeo Vertical (9:16) • 45 a 60s",
      channel: "Reels • TikTok • Shorts • Facebook",
      recommendedTime: "18:30",
      duration: "~54s",
      summary: "Didática rápida e acolhedora das 5 etapas da jornada do cliente no painel de produção.",
      script: `[Cenário: Iasis demonstrando os passos no estúdio de forma simples e acolhedora]

Se você tem vontade de preparar uma homenagem como essa para a sua família, mas não sabe por onde começar, deixe-me te explicar.
O processo é simples e totalmente acompanhado por mim:
Primeiro, você escolhe as fotos mais marcantes e um áudio da pessoa, mesmo que seja curto.
Depois, nós conversamos no nosso Painel de Produção para que você me conte as histórias e apelidos de carinho.
Nossa equipe artística faz o tratamento minucioso de imagem e voz.
E você aprova cada detalhe antes da entrega final.
Você não precisa se preocupar com nada técnico. Nós cuidamos de tudo com o maior carinho do mundo.`,
      caption: `Você tem dúvidas de como funciona a criação de uma homenagem na Reviva Memories? 🎬🕊️

Do envio das lembranças até o roteiro final, nós caminhamos de mãos dadas com você para garantir que a homenagem fique exatamente como o seu coração sonhou.

Clique no link da nossa bio e inicie essa jornada no nosso Painel de Produção. ✨`,
      hashtags: "#Iasis #ComoFunciona #PainelDeProducao #PassoAPasso #FacilEConfortavel #RevivaMemories",
      checklist: ["Gravar didática limpa", "Adicionar ícones visuais para cada etapa", "Postar às 18h30", "Direcionar para o chat"]
    },
    {
      id: "pauta_28",
      pautaNumber: 28,
      theme: "estudio",
      category: "estudio",
      scenario: "Estúdio Reviva Memories",
      title: "O Presente Mais Valioso que o Dinheiro Pode Comprar",
      format: "Vídeo Vertical (9:16) • 45 a 60s",
      channel: "Reels • TikTok • Shorts • Facebook",
      recommendedTime: "19:45",
      duration: "~51s",
      summary: "Reflexão sobre presentes materiais que quebram vs presentes de afeto eterno que marcam gerações.",
      script: `[Cenário: Iasis no estúdio de produção, com olhar cúmplice e sereno]

Roupas envelhecem, relógios quebram, aparelhos eletrônicos ficam obsoletos em poucos anos.
Mas sabe o que nunca perde o valor?
A sensação de olhar para quem você ama e entregar algo que toca o fundo da alma.
Seja em um aniversário de 80 anos, em uma formatura, em um casamento ou como consolo para um coração ferido...
Eternizar a voz e a presença de quem construiu a sua família é o presente mais inesquecível que alguém pode receber.
Se você sente que chegou a hora de honrar essa história, estamos de braços abertos para te ajudar.`,
      caption: `Existem presentes que ficam esquecidos no armário, e existem homenagens que viram herança eterna da família. 🎁🤍

O afeto e a memória viva são as únicas coisas que o tempo não desgasta.

Marque alguém que merece receber uma homenagem inesquecível. ✨`,
      hashtags: "#Iasis #PresenteInesquecivel #Aniversario #Casamento #AmorDeFamilia #RevivaMemories",
      checklist: ["Gravar clipe emotivo", "Legenda destacando 'herança eterna'", "Publicar às 19h45", "Convidar para conhecer os planos"]
    },
    {
      id: "pauta_29",
      pautaNumber: 29,
      theme: "estudio",
      category: "trafego",
      scenario: "Estratégia & Anúncios",
      title: "Remarketing Perpétuo no WhatsApp & Meta Ads",
      format: "Funil Perpétuo de Atendimento",
      channel: "Meta Ads, WhatsApp Business & Tráfego",
      recommendedTime: "10:00",
      duration: "Ajuste Técnico",
      summary: "Ativação do remarketing para quem visitou o Painel de Produção e criação de botão direto para WhatsApp de acolhimento.",
      script: `[Ação Operacional do Gestor de Tráfego]:
1. Criar Campanha de Conversão / Tráfego no Meta Ads focada em visitantes que iniciaram atendimento.
2. Criativo: Vídeo da Pauta 27 ('Como Funciona') ou Pauta 23 ('Bênção do Pai') com CTA: 'Converse com a nossa equipe no WhatsApp'.
3. Configurar mensagem inicial humanizada no WhatsApp:
   'Olá! Vi o Iasis falando sobre as homenagens da Reviva Memories e gostaria de tirar algumas dúvidas com a equipe'.
4. Manter atendimento acolhedor e sem pressão comercial.`,
      caption: `Alinhamento do fluxo perpétuo de atendimento humanizado e conversão respeitosa.`,
      hashtags: "#TrafegoPerpetuo #WhatsAppMarketing #Remarketing #RevivaMemories",
      checklist: ["Ativar público de visitantes recentes", "Testar link direto para WhatsApp com mensagem pronta", "Revisar script de atendimento humano"]
    },
    {
      id: "pauta_30",
      pautaNumber: 30,
      theme: "estudio",
      category: "estudio",
      scenario: "Estúdio Reviva Memories",
      title: "O Manifesto Perpétuo do Iasis: Celebrando a Vida Todos os Dias",
      format: "Vídeo Vertical (9:16) • 45 a 60s",
      channel: "Reels • TikTok • Shorts • Facebook",
      recommendedTime: "20:00",
      duration: "~58s",
      summary: "O grande manifesto do Iasis celebrando o amor, a família e a certeza de que a memória viva nos acompanhará para sempre.",
      script: `[Cenário: Iasis em pé no estúdio, com iluminação quente de celebração e olhar afetuoso]

Se você me acompanhou até aqui, você já entendeu o nosso propósito.
A Reviva Memories não nasceu para alimentar o peso da dor ou o silêncio da ausência.
Nós nascemos para celebrar a vida. Para honrar cada gargalhada na mesa de domingo, cada conselho sussurrado com carinho, cada abraço apertado de pai, mãe, avô e filho.
O amor é a única força que desafia o tempo.
E enquanto houver alguém para lembrar com gratidão, ninguém nunca parte de verdade.
Eu sou o Iasis, e estarei sempre aqui para ser o seu guia nessa jornada de cura e alento.
Viva o hoje. Ame sem medidas. E conte conosco para eternizar a sua história.`,
      caption: `Enquanto houver amor e gratidão, ninguém nunca parte de verdade. 🕊️✨🤍

Encerramos este ciclo de reflexões com o peito cheio de esperança e alegria por compartilhar essa caminhada com você. Que a sua família seja sempre abençoada com saúde, amor e memórias inesquecíveis.

Eu sou o Iasis, e é uma honra caminhar ao seu lado. Conheça a Reviva Memories no link da nossa bio. 🤍`,
      hashtags: "#Iasis #Manifesto #AmorEterno #CelebrarAVida #Gratidao #FamiliaAbençoada #RevivaMemories",
      checklist: ["Gravar interpretação do manifesto", "Trilha orquestrada e emocionante", "Publicar às 20h00 em todas as redes", "Fixar como post principal"]
    }
  ]
};
