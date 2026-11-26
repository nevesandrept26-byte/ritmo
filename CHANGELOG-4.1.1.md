# RITMO 4.1.1

## Caminho com Deus
- A marcação de capítulos continua concentrada na Bíblia completa.
- Cada versículo disponibiliza uma explicação contextual sob pedido, gerada pelo Qwen/Ollama local e guardada no localStorage.
- Removidos do código os componentes e constantes dos planos de leitura anteriores; os dados antigos desconhecidos são preservados durante a migração para evitar perda de compatibilidade.
- Históricos e estatísticas passam a privilegiar capítulos realmente marcados como lidos.

## Grelhas anuais
- As 13 páginas têm uma grelha anual de contribuições com 53 semanas e sete dias por semana.
- A visão geral agrega atividade; as restantes páginas mostram atividade específica de cada área.
- A legenda só mostra dias não concluídos na página Disciplina.
- A consistência alimentar não duplica o dia quando também existem refeições registadas.

## Limpeza e compatibilidade
- Removido o calendário mensal antigo da Disciplina, substituído pela grelha anual.
- Atualizado o histórico recente para incluir capítulos concluídos e orações, em vez do formulário manual antigo.
- Preservada a chave `ritmo_personal_dashboard_v2` e os registos antigos.
- Atualizado o cache PWA para `ritmo-shell-v16`.

## Grelhas anuais em todos os separadores

- Cada uma das 13 áreas recebe a sua própria grelha de 53 semanas, num período visual de 12 meses.
- O mapa geral também conta dias com oração, gratidão, leitura bíblica, treino, dieta, hábitos, diário e recuperação.
- O mapa Caminho com Deus inclui capítulos lidos, orações e registos de oração/gratidão.
- O mapa de disciplina distingue visualmente dias concluídos e dias registados como não concluídos.
- O mapa de nutrição depende da caixa explícita de cumprimento do objetivo alimentar; refeições por si só não contam como cumprimento da dieta.

## Leitor bíblico

- Removido o registo pessoal manual de leituras e os planos de leitura redundantes.
- A leitura e a marcação são feitas no leitor da Bíblia completa.
- Cada versículo pode receber uma explicação local contextual sob pedido. As explicações são geradas pelo Qwen/Ollama e armazenadas no localStorage.
