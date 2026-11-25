# RITMO 3.6.2

## Correção da análise de fotografias com Qwen3.5:4b

- Desativa o modo de raciocínio durante a extração nutricional (`think:false`).
- Usa JSON Schema no primeiro pedido.
- Faz uma segunda tentativa automática em JSON mode se a resposta inicial não for interpretável.
- O parser aceita JSON direto, blocos Markdown e JSON acompanhado de texto adicional.
- A interface já não abre a configuração do Ollama quando o problema é apenas o formato da resposta.
- A cache PWA passa para `ritmo-shell-v12` para disponibilizar os ficheiros corrigidos.

As fotografias continuam a ser enviadas apenas para o Ollama local em `127.0.0.1:11434`.
