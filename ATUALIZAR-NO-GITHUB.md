# Atualizar o teu repositório GitHub com o RITMO 4.1.1

Este pacote é uma atualização do projeto. Para manteres o histórico Git e o endereço remoto que já configuraste:

1. Faz primeiro um commit e push das alterações locais atuais, se existirem.
2. Fecha o servidor RITMO (`Ctrl+C` na janela preta).
3. Extrai o ZIP desta atualização.
4. Abre a pasta interna `ritmo-project`.
5. Copia o conteúdo dessa pasta para a pasta local do teu repositório GitHub `ritmo`.
6. Quando o Windows perguntar, escolhe substituir os ficheiros existentes.
7. **Não apagues nem substituas a pasta oculta `.git`** que existe na pasta local do teu repositório.
8. **Não substituas o teu ficheiro `.env`**, caso exista. Este contém configuração local e não deve ser publicado.
9. Abre a pasta do repositório no VS Code e executa `npm run check`.
10. Em Source Control, confirma os ficheiros alterados, escreve a mensagem `Improve Bible reader and add annual activity heatmaps`, faz Commit e depois Sync Changes.

Também podes publicar pelo terminal, dentro da pasta do repositório:

```powershell
git add .
git commit -m "Improve Bible reader and add annual activity heatmaps"
git push
```

## O que esta atualização altera

- Caminho com Deus: remove o formulário pessoal separado e os dois planos de leitura antigos.
- Bíblia completa: permite marcar cada capítulo como lido diretamente no leitor.
- Explicação bíblica: cada versículo tem uma ação para pedir explicação contextual ao Qwen/Ollama local. As explicações geradas são guardadas no `localStorage`.
- Grelhas anuais: cada um dos 13 separadores mostra uma grelha de contribuições de estilo GitHub.
- Ginásio, disciplina, nutrição, fé, hábitos, diário, recuperação e restantes áreas contam os seus próprios registos.

## Dados pessoais

Os dados pessoais continuam no `localStorage` do navegador. A atualização preserva a chave `ritmo_personal_dashboard_v2`. Não limpes os dados do navegador nem importes um backup antigo sem necessidade. Recomenda-se exportar um backup antes de atualizar.
