# RITMO 4.0

## Armazenamento local
- Mantida a chave de dados `ritmo_personal_dashboard_v2`; não foi introduzida SQLite nem outra base de dados SQL.
- Cópia local de recuperação da gravação anterior.
- Snapshot automático diário em `localStorage` quando há alterações e existe espaço suficiente (limite prudente de 900 KB para o JSON principal).
- Opção para restaurar a cópia diária ou a gravação anterior.
- Auditoria básica da integridade de datas, séries, alimentos, pesagens, sono e IDs de hábitos.
- Exportação e importação JSON continuam disponíveis.

## Novas funcionalidades
- Assistente RITMO AI local através de Ollama / Qwen3.5:4b, com contexto resumido e privado.
- Níveis de XP por Fé, Fitness, Nutrição e Disciplina.
- Painel de análise de força, volume semanal, grupos musculares e força relativa.
- Receitas guardadas e adição de porções.
- Médias nutricionais dos últimos sete dias.
- Planeamento alimentar semanal.
- Planos de leitura bíblica completa de 90, 180 ou 365 dias.
- Pesquisa global de treinos, alimentos, leituras, objetivos, diário e receitas.
- Temas escuro, claro e alto contraste; dashboard personalizável.
- Lembretes locais opcionais e instalação PWA.

## Privacidade / limites
- Os dados pessoais continuam no `localStorage` do navegador e não são sincronizados automaticamente entre dispositivos.
- O assistente envia apenas um resumo agregado para o Ollama no próprio computador.
- O texto bíblico é recurso estático e usa cache local IndexedDB para leitura offline; progresso, favoritos e notas permanecem no `localStorage`.
- As notificações só são verificadas enquanto a aplicação está aberta.
- Snapshots no `localStorage` estão sujeitos à quota do navegador; backups JSON externos continuam recomendados.

## Ajustes 4.0.1
- Mantida a chave de `localStorage` e corrigida a promoção automática de um snapshot válido quando o registo principal está corrompido.
- Snapshots automáticos limitados a dados até 350 KB para reduzir o risco de exceder a quota do navegador.
- Incluída medição do espaço usado pelos dados e snapshots.
- Adicionada verificação básica de integridade dos registos.
- Separados os melhores registos de carga absoluta da relação carga/peso corporal, evitando apresentar exercícios diferentes como equivalentes.
- Protegido o endpoint local de análise fotográfica contra pedidos de outras origens.
