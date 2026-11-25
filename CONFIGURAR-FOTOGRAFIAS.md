# Configurar análise de fotografias local no RITMO

A análise de fotografias utiliza Ollama + Qwen3.5:4b. Não é necessária uma chave API nem existe custo por cada fotografia analisada.

## Uma única instalação

1. Instala o Ollama para Windows: https://ollama.com/download/windows
2. Abre a aplicação Ollama e deixa-a em execução.
3. Executa `install-qwen3.5-4b.bat` na pasta principal do projeto. O modelo `qwen3.5:4b` tem cerca de 3,3–4,0 GB e só precisa de ser descarregado uma vez.
4. Executa `start.bat` para abrir o RITMO.
5. Em **Nutrição & peso → Fotografar refeição**, confirma que o estado indica **IA LOCAL · PRONTA**.

Também podes instalar o modelo pelo botão **Instalar modelo recomendado** dentro do RITMO, depois de o Ollama estar instalado e aberto.

## Requisitos e escolha do modelo

Ollama para Windows suporta NVIDIA. A documentação atual indica Windows 10 22H2 ou superior e driver NVIDIA 551.61 ou mais recente; o modelo Qwen3.5 requer Ollama 0.12.7 ou superior. O computador referido tem 32 GB de RAM e uma RTX, mas a VRAM ainda não foi especificada; por isso o RITMO começa com o modelo 4B. O modelo 9B ocupa aproximadamente 6,2 GB de download, mas pode exigir mais VRAM durante a execução. O tamanho do download não corresponde ao requisito total de memória.

Para mudar para 8B, executa `ollama pull qwen3.5:9b` e define `OLLAMA_MODEL=qwen3.5:9b` num ficheiro `.env` na raiz do projeto. Reinicia o RITMO.

## Privacidade

As fotografias passam pelo servidor local do RITMO e são enviadas apenas para o Ollama em `127.0.0.1:11434`. O backend não permite apontar a análise para um servidor remoto. O primeiro download exige Internet; a análise posterior é local.

As calorias e porções são estimativas visuais, não medições. Ajusta os pesos e os valores nutricionais antes de guardar a refeição.

## Resolução de problemas

- **Ollama offline:** abre a aplicação Ollama e carrega em `Verificar ligação`.
- **Modelo em falta:** executa `install-qwen3.5-4b.bat` ou `ollama pull qwen3.5:4b`.
- **Erro de GPU/memória:** fecha aplicações que usem muita VRAM; continua com 4B. Se a tua placa tiver VRAM suficiente, podes experimentar 8B.
- **Primeira análise lenta:** normal enquanto o modelo é carregado. As análises seguintes tendem a ser mais rápidas enquanto o modelo permanecer na memória.

Fontes oficiais:
- https://ollama.com/download/windows
- https://github.com/ollama/ollama/blob/main/docs/windows.mdx
- https://ollama.com/library/qwen3.5
- https://github.com/ollama/ollama/blob/main/docs/api.md


### Erro ao interpretar a resposta do Qwen

A versão 3.6.2 e as versões seguintes envia a análise com `think:false` para evitar que o texto de raciocínio seja confundido com os dados finais. Tenta primeiro com JSON Schema e repete automaticamente em modo JSON se a primeira resposta não for interpretável. Também aceita respostas com blocos Markdown ou texto em redor do objeto JSON.

Para instalar uma correção nova, fecha a janela de terminal do servidor RITMO com Ctrl+C, substitui os ficheiros pela versão mais recente e executa novamente `start.bat`. Não precisas de voltar a descarregar o modelo. Mantém o endereço `http://127.0.0.1:8000` para preservar os registos guardados no navegador.
