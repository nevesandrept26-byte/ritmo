# RITMO 4.1.1 — aplicação pessoal de fé, fitness e disciplina

O RITMO é uma aplicação web local, organizada por módulos. A versão 4.1.1 acrescenta explicações bíblicas versículo a versículo, sob pedido através do Qwen/Ollama local, grelhas anuais de consistência em todos os separadores, registo de capítulos lidos diretamente na Bíblia completa, consistência alimentar diária e uma organização mais simples sem formulários de leitura ou planos duplicados. Inclui ainda um assistente local com Ollama, pesquisa global, níveis separados por área, análise de força e volume, receitas, tendência nutricional, planeamento alimentar, temas, dashboard personalizável, lembretes e proteção adicional do armazenamento. Os dados pessoais continuam exclusivamente no localStorage do navegador; não foi introduzida uma base de dados SQL.

## Estrutura

```text
ritmo-project/
├── index.html
├── manifest.webmanifest
├── sw.js
├── start.bat
├── start.sh
├── install-qwen3.5-4b.bat
├── package.json
├── .env.example
├── server/
│   └── server.mjs
├── assets/
│   ├── css/
│   │   ├── variables.css
│   │   ├── base.css
│   │   ├── layout.css
│   │   ├── components.css
│   │   ├── responsive.css
│   │   ├── gym.css
│   │   ├── nutrition.css
│   │   ├── gamification.css
│   │   ├── planner-recovery.css
│   │   ├── suite.css
│   │   └── activity-heatmap.css
│   ├── js/
│   │   ├── core.js
│   │   ├── gamification.js
│   │   ├── navigation.js
│   │   ├── dashboard.js
│   │   ├── bible-reader.js
│   │   ├── faith.js
│   │   ├── gym.js
│   │   ├── discipline.js
│   │   ├── habits.js
│   │   ├── nutrition.js
│   │   ├── recovery.js
│   │   ├── planner.js
│   │   ├── journal.js
│   │   ├── insights.js
│   │   ├── records.js
│   │   ├── backup.js
│   │   ├── contributions.js
│   │   ├── suite.js
│   │   └── app.js
│   └── icons/ritmo.svg
└── README.pt-PT.md
```

## Como executar

**Requisito:** Node.js 20 ou superior.

**Windows:** duplo clique em `start.bat`.

**macOS/Linux:** no terminal, dentro da pasta, executa `chmod +x start.sh` (uma vez) e depois `./start.sh`.

O servidor local (frontend + API) abre em `http://127.0.0.1:8000`. Usa estes scripts em vez de `python -m http.server`, porque o servidor Node também faz a ponte segura para a pesquisa alimentar e para a análise de fotografias.

Para instalar como PWA e usar a cache offline, abre por `localhost` ou HTTPS. O ficheiro aberto diretamente por `file://` não permite o registo do service worker em muitos navegadores.

## Ginásio e patentes pessoais

- Cada exercício tem séries próprias, com peso, repetições, RPE, aquecimento e estado concluído.
- Existem modelos Push, Pull, Legs, Upper, Lower e Full Body, bem como modelos personalizados.
- O histórico mostra cargas e repetições por série, e existe um temporizador de descanso.
- A biblioteca ilustrada carrega mais de 100 exercícios a partir do Free Exercise DB; permite pesquisar pelo nome, filtrar por grupo muscular (os grupos escolhidos no início do treino são usados automaticamente) e filtrar por equipamento.
- As imagens e os dados de exercícios vêm de [yuhonas/free-exercise-db](https://github.com/yuhonas/free-exercise-db), um catálogo público com mais de 800 exercícios e publicado sob Unlicense. As imagens são carregadas quando necessário e guardadas em cache pelo navegador/service worker. O RITMO inclui uma camada de nomes em português para os exercícios mais comuns; os restantes mantêm o nome da fonte.
- Cada exercício recebe uma patente independente: Recruta, Bronze, Prata, Ouro, Platina, Diamante ou Elite. Para movimentos com carga externa, a patente sobe de acordo com a maior carga concluída (kg) registada nesse exercício; em movimentos de peso corporal sem carga adicional, usa o melhor número de repetições. Séries de aquecimento e séries não concluídas não contam.
- Cada exercício tem limites de patente próprios, definidos por grupo muscular e equipamento. Podes personalizar os seis limites de carga através do botão “Patentes” no exercício ou “Ajustar” no ranking. São bandas de referência configuráveis, não uma classificação universal nem uma comparação com outras pessoas. Mantém a mesma convenção de carga (por exemplo, peso por haltere) para que o histórico seja coerente.

## Nutrição, pesquisa e fotografia

- A análise por fotografia usa Ollama + Qwen3.5 local; não precisa de chave API paga.
- A análise por fotografia envia o pedido em modo sem raciocínio (`think:false`) e com JSON Schema. Se o modelo devolver texto fora do JSON, o servidor tenta automaticamente uma segunda chamada em modo JSON. O parser também aceita JSON dentro de blocos Markdown ou texto adicional.

- A pesquisa por nome e código de barras é feita pelo backend local Node e consulta a Open Food Facts. O servidor define um User-Agent, mantém uma cache curta e evita expor o pedido diretamente ao browser.
- Os resultados mostram sempre o termo pesquisado. Se a base externa falhar ou não tiver um alimento genérico, o RITMO apresenta uma pequena lista local de alimentos comuns com valores médios indicativos (por exemplo, banana). Estes resultados locais aparecem identificados como referência genérica, não como rótulo de uma marca.
- Depois de escolheres um produto, defines a quantidade em gramas e o RITMO calcula calorias, proteína, hidratos, gordura e fibra proporcionalmente aos valores por 100 g.
- Podes selecionar uma fotografia da refeição ou tirar uma fotografia no telemóvel. A imagem é reduzida no browser e enviada para `POST /api/food/analyze-image`. O Qwen3.5 local devolve alimentos identificados, porções estimadas e nutrientes. Podes corrigir as gramas, retirar alimentos e adicionar os selecionados ao diário.
- **A fotografia fornece uma estimativa, não uma medição exata.** O modelo não consegue determinar com segurança o peso real, ingredientes escondidos, óleo, molhos ou açúcar. Confirma os alimentos e ajusta as porções antes de os guardar.
- A análise por fotografia exige que o Ollama esteja instalado e o modelo `qwen3.5:4b` descarregado. Não exige chave API.
- Podes guardar favoritos e modelos de refeição, registar água, definir metas e acompanhar peso e medidas corporais.
- A pesquisa Open Food Facts e o download inicial do modelo necessitam de Internet. Depois de instalado o modelo, a análise por fotografia funciona localmente sem Internet. O restante diário continua disponível offline.

A Open Food Facts documenta o endpoint legado `/cgi/search.pl` como a opção disponível para pesquisa textual; a API v2 estruturada não suporta texto livre e a base impõe limites de pedidos. Referência: [documentação oficial da API Open Food Facts](https://openfoodfacts.github.io/openfoodfacts-server/api/).


## Bíblia completa e leitura diária

- O leitor integra os 66 livros da edição Almeida 1911, com 1.189 capítulos e 31.101 versículos. A edição é indicada como completa e de domínio público no catálogo da fonte.
- O texto de cada livro é carregado a partir do repositório aberto [biblia.publica](https://github.com/Projeto-Euaggelion/biblia.publica) apenas quando o selecionas; depois fica guardado em IndexedDB. Usa o botão “Descarregar os 66 livros para ler offline” para guardar toda a Bíblia de uma vez e poder ler sem Internet nesse dispositivo.
- Podes escolher livro/capítulo, avançar/retroceder, abrir a próxima leitura ainda não concluída, pesquisar uma referência (por exemplo, João 3:16), pesquisar palavras no livro aberto, guardar versículos favoritos e marcar capítulos lidos. A progressão acompanha os 1.189 capítulos e o ponto de leitura fica guardado.
- Almeida 1911 conserva grafia e construções antigas; o índice da fonte identifica a linguagem como pt-BR. O RITMO identifica a edição no leitor, em vez de a apresentar como uma tradução portuguesa contemporânea.
- Fonte/contagem/licença: [índice de versões biblia.publica](https://github.com/Projeto-Euaggelion/biblia.publica/blob/main/docs/index.json), [estrutura JSON](https://github.com/Projeto-Euaggelion/biblia.publica/blob/main/docs/estrutura-arquivos/estrutura-json.md) e [licença Almeida 1911](https://github.com/Projeto-Euaggelion/biblia.publica/blob/main/versoes/alm1911/LICENSE.md).


## Leitor bíblico e explicações versículo a versículo

- A leitura e a marcação de capítulos estão concentradas na secção **Bíblia completa**; já não existe um formulário separado para registar leituras nem planos duplicados.
- Cada capítulo pode ser marcado como lido diretamente no leitor. A seleção de capítulos assinala os que já foram concluídos e o progresso é calculado sobre os 1.189 capítulos.
- Cada versículo tem uma ação **Explicar versículo**. Ao pedir uma explicação, o Qwen/Ollama local recebe o versículo e os versículos imediatamente anterior e seguinte, para o situar no contexto. A resposta distingue contexto, sentido, aspetos difíceis, interpretações relevantes e um resumo simples.
- As explicações são geradas quando as pedes e ficam guardadas no localStorage para consulta posterior. É necessário ter o servidor RITMO e Ollama em execução. A IA pode cometer erros e não substitui comentário bíblico especializado; compara sempre a explicação com o contexto do capítulo e com a tua tradução/tradição de referência.

## Grelhas anuais de atividade

- Cada um dos 13 separadores apresenta uma grelha de atividade de estilo GitHub Contributions, com 53 semanas e dias individuais.
- Ginásio: assinala os dias com treinos guardados. Disciplina: verde para dias sem lust concluídos e vermelho para dias registados como não concluídos. Nutrição: assinala explicitamente os dias em que cumpriste o objetivo alimentar. Caminho com Deus: capítulos bíblicos marcados como lidos, orações e gratidão. As restantes áreas mostram os respetivos registos.
- A grelha é atualizada depois de guardares ou alterares um registo. Em ecrãs pequenos, podes deslocar a grelha horizontalmente.

## XP, missões e conquistas

- Ganhas XP por registares ações consistentes: treino, leitura, oração, hábitos, nutrição, sono, objetivos e planeamento.
- As missões diárias são flexíveis. Um dia de recuperação pode completar a missão de cuidado físico.
- Não perdes XP por falhar um dia, interromper uma sequência, alterar um objetivo ou recomeçar.
- Os pontos na área espiritual recompensam a consistência dos registos, não medem a fé nem a relação com Deus.
- Os objetivos nutricionais são referências que configuras; não há prémios por comer menos nem penalizações por ultrapassar uma meta.

## Dados, migração e privacidade

- A aplicação mantém a chave local `ritmo_personal_dashboard_v2`, para preservar os registos da versão modular anterior.
- Os dados pessoais ficam no `localStorage` do navegador. Não existe conta nem sincronização entre dispositivos. O servidor Node é local e serve apenas de ponte para a pesquisa alimentar e para o Ollama.
- A pesquisa alimentar envia o termo pesquisado à Open Food Facts. Quando pedes análise por fotografia, a imagem é processada localmente pelo Ollama em `127.0.0.1:11434`; não é enviada para OpenAI, Google ou outro serviço de IA na cloud. O diário e os restantes registos não são enviados automaticamente para estes serviços.
- Exporta backups regularmente em **Dados & privacidade**. Importar um backup substitui os dados atuais, por isso exporta uma cópia antes.
- Ao apagar os dados do navegador, podes perder os registos que não estejam num backup.


## RITMO 4.1.1 — melhorias incluídas

- **Armazenamento:** mantém a chave `ritmo_personal_dashboard_v2` no `localStorage`; os registos das versões anteriores são carregados no mesmo perfil e endereço do navegador. O RITMO cria uma cópia de recuperação da gravação anterior e tenta guardar um snapshot local por dia quando o JSON principal tem até 350 KB e existe espaço suficiente. Os snapshots também ficam no `localStorage` e estão sujeitos aos limites do navegador. Exporta um ficheiro JSON regularmente para ter uma cópia fora do navegador.
- **Assistente RITMO AI:** conversa com o modelo Ollama local `qwen3.5:4b`. Recebe apenas um resumo agregado das áreas relevantes, não o conteúdo integral do diário, orações privadas ou fotografias. Requer que Ollama e o servidor RITMO estejam abertos.
- **Progressão por áreas:** XP e níveis independentes para Fé, Fitness, Nutrição e Disciplina. As missões recompensam consistência, sem retirar XP por falhar dias.
- **Ginásio:** painel de volume dos últimos sete dias, comparação por grupo muscular, registos de força, recordes e força relativa baseada no último peso corporal registado.
- **Nutrição:** receitas guardadas, adição de porções, média de calorias e proteína dos últimos sete dias e planeamento alimentar semanal e marcação diária do cumprimento do objetivo alimentar. A média exclui dias sem registos.
- **Caminho com Deus:** leitor com os 66 livros da Bíblia, marcação de capítulos lidos, favoritos e explicações contextuais por versículo, geradas quando pedidas pelo Qwen/Ollama local. O texto bíblico é colocado em cache local (IndexedDB) para leitura offline; progresso, favoritos, explicações, orações e restantes registos continuam no `localStorage`.
- **Pesquisa global:** pesquisa treinos, alimentos, leituras, objetivos, diário e receitas no navegador.
- **Personalização:** temas escuro, claro e alto contraste; controlos para mostrar/ocultar widgets da página inicial.
- **Lembretes:** notificações opcionais enquanto o RITMO está aberto e o navegador permite notificações. Não são notificações push garantidas quando a aplicação está fechada.
- **Integridade:** verificação básica de datas, séries, alimentos, pesagens, sono e identificadores de hábitos, mais opção para restaurar a cópia diária ou a gravação anterior.

### Limites importantes do localStorage

O `localStorage` é local a um perfil de navegador e origem. Não sincroniza automaticamente entre dispositivos e pode ser apagado ao limpar os dados do navegador. O RITMO mantém snapshots locais, mas estes também ocupam espaço no mesmo armazenamento. Se o volume de dados crescer, o painel avisa para exportares backups; fotografias de refeições não são guardadas como imagens no histórico. A Bíblia usa cache local próprio porque guardar o texto integral no `localStorage` poderia ultrapassar o limite disponível.

## Análise de fotografias totalmente local (sem API paga)

A análise visual usa **Ollama + Qwen3.5:4b** no próprio computador. Não precisa de chave OpenAI API, conta cloud nem créditos por utilização. Depois de descarregares o modelo uma vez, a análise de fotografias funciona localmente e pode continuar a funcionar sem Internet.

### Requisitos

- Windows 10 22H2 ou mais recente; Qwen3.5 requer Ollama 0.12.7 ou superior.
- Node.js 20 ou superior (para executar o servidor RITMO).
- Ollama para Windows instalado e aberto.
- Driver NVIDIA 551.61 ou mais recente (requisito indicado na documentação Windows atual do Ollama).
- O modelo `qwen3.5:4b` ocupa cerca de 3,3–4,0 GB no catálogo Ollama. O espaço de memória necessário durante a inferência é superior ao tamanho do ficheiro e depende da resolução/contexto da imagem e da GPU disponível.

### Modelo visual recomendado

A configuração desta versão usa `qwen3.5:4b`, um modelo local multimodal com entrada de imagem publicado na biblioteca Ollama. Não é necessário abrir o Qwen Code: o RITMO comunica diretamente com o serviço Ollama em `http://127.0.0.1:11434`. A janela Qwen Code é uma interface de programação/terminal e pode ser fechada.

Confirma o modelo com `ollama list`. Se já tiveres `qwen3.5:4b`, não voltes a descarregá-lo. Se necessário, executa `ollama pull qwen3.5:4b`. Depois inicia `start.bat` e confirma em Nutrição que o estado da IA local aparece como pronto.

## Instalação inicial

1. Instala o Ollama através de [ollama.com/download/windows](https://ollama.com/download/windows).
2. Abre a aplicação Ollama e deixa-a a funcionar em segundo plano. A API local deverá ficar disponível em `http://127.0.0.1:11434`.
3. Com o RITMO extraído, executa `install-qwen3.5-4b.bat` (duplo clique). O script verifica se o comando Ollama existe e descarrega `qwen3.5:4b` (aprox. 3,3–4,0 GB). Em alternativa, abre um terminal e executa `ollama pull qwen3.5:4b`.
4. Inicia o RITMO com `start.bat`.
5. Abre **Nutrição & peso → Fotografar refeição** e carrega em **Verificar ligação**. O estado deverá mostrar **IA LOCAL · PRONTA**.
6. Escolhe uma fotografia e carrega em **Analisar fotografia**. Confirma os alimentos e ajusta as porções antes de os adicionar ao diário.

Também podes instalar o modelo a partir do painel de configuração do RITMO, desde que o Ollama já esteja instalado e aberto.

### Escolher outro tamanho de modelo

O padrão é `qwen3.5:4b`, uma opção inicial conservadora quando se sabe que o computador tem 32 GB de RAM mas ainda não se sabe a VRAM exata da placa RTX. O catálogo lista também `qwen3.5:9b` com cerca de 6,2 GB de download. O tamanho do download **não** é igual à memória de GPU necessária. Só experimenta 9B se a tua VRAM for suficiente e se o desempenho/memória do sistema o permitir. Para veres a VRAM no Windows, abre CMD e executa `nvidia-smi --query-gpu=name,memory.total --format=csv`. Como orientação conservadora, considera 12 GB ou mais antes de testar 9B; não é uma garantia de que todo o modelo caiba na VRAM.

Para experimentar 8B:

1. Executa `ollama pull qwen3.5:9b`.
2. Cria um ficheiro `.env` na pasta principal do projeto (podes copiar `.env.example`).
3. Define `OLLAMA_MODEL=qwen3.5:9b`.
4. Fecha e volta a abrir `start.bat`.

### Privacidade e limitações

- O RITMO envia a imagem do browser para o servidor local Node e este reencaminha-a apenas para `127.0.0.1:11434`. O servidor rejeita uma configuração de Ollama que aponte para uma máquina remota.
- As imagens não são enviadas para OpenAI, Google ou outro serviço cloud pela funcionalidade de análise de fotografia.
- A transferência inicial do Ollama/modelo precisa de Internet. Depois do download, a inferência local não precisa de Internet.
- A qualidade da estimativa depende do modelo, da imagem, da iluminação e do ângulo. Uma fotografia não revela com rigor o peso real, ingredientes escondidos, óleo, molhos ou açúcar. Confirma e corrige as porções.
- O catálogo de modelos e os requisitos podem mudar. Consulta [documentação oficial do Ollama para Windows](https://github.com/ollama/ollama/blob/main/docs/windows.mdx), [Qwen3.5 no Ollama](https://ollama.com/library/qwen3.5) e [API de chat com imagens e respostas estruturadas](https://github.com/ollama/ollama/blob/main/docs/api.md).


## Tecnologias

HTML5, CSS3, JavaScript, Node.js (API local), JSON, localStorage, Service Worker, PWA, Open Food Facts API e Ollama API local (Qwen3.5 para análise de imagem).

## Resolver erro “resposta que não consegui interpretar”

Esta versão corrige a interpretação da resposta do `qwen3.5:4b`: desativa o modo de raciocínio para esta tarefa estruturada, tenta JSON Schema e, se necessário, repete em modo JSON. Atualiza o projeto e reinicia o servidor para receber esta correção.

No Windows: fecha a janela preta “RITMO Server” da versão anterior (Ctrl+C), extrai esta versão e executa o novo `start.bat`. Mantém o endereço `http://127.0.0.1:8000` para continuares a usar os mesmos dados locais do navegador. Não é necessário voltar a descarregar `qwen3.5:4b`.

Se continuar a falhar, abre o CMD e executa `ollama --version`; confirma também `ollama list`. O RITMO escreve no terminal do servidor uma mensagem técnica resumida da primeira tentativa e da repetição, sem registar o conteúdo da fotografia.


## RITMO 4.1.1 — Bíblia contextual e mapas de consistência

- A leitura bíblica é concluída diretamente no leitor da Bíblia completa; removidos os dois planos de leitura e o formulário duplicado de registo manual de leituras.
- Cada versículo tem uma ação para pedir uma explicação contextual através do Qwen/Ollama local. As explicações ficam guardadas no `localStorage` e podem ser geradas novamente.
- Cada separador tem uma grelha anual de atividade, inspirada no GitHub Contributions, com cores de intensidade e tooltips por data. As grelhas refletem o respetivo tema: treino, leitura/or ação, disciplina, hábitos, nutrição, diário, sono, etc.
- Na nutrição, é possível assinalar os dias em que se cumpriu o objetivo alimentar definido.
- A grelha de disciplina distingue dias concluídos de dias assinalados como não concluídos.
