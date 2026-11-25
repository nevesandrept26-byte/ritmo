# Publicar o RITMO no GitHub

## Antes de publicar

- Não coloques o ficheiro `.env` no GitHub. O `.gitignore` já o exclui.
- Não publiques backups exportados do RITMO: podem conter dados pessoais.
- Não publiques fotografias de refeições ou outros ficheiros pessoais.
- O `.env.example` é seguro para publicar porque contém apenas configurações de exemplo.
- O GitHub guarda o código-fonte. Não executa automaticamente o servidor Node.js nem o Ollama do teu computador.

## Opção A — GitHub Desktop (mais simples)

1. Cria um repositório vazio em https://github.com/new. Sugestão de nome: `ritmo`.
2. Escolhe **Private** enquanto estás a desenvolver. Podes torná-lo público mais tarde.
3. Não seleciones a criação automática de README, `.gitignore` ou licença, porque estes ficheiros já existem.
4. Instala e abre GitHub Desktop: https://desktop.github.com/.
5. Escolhe **File → Add local repository** e seleciona esta pasta.
6. Se o GitHub Desktop disser que ainda não é um repositório Git, escolhe **Create a repository** e confirma a pasta atual.
7. Escreve a mensagem `Initial commit — RITMO 4.0.1` e escolhe **Commit to main**.
8. Seleciona **Publish repository** e confirma o nome e a visibilidade.

## Opção B — Terminal (Git)

Cria primeiro um repositório vazio em https://github.com/new e copia o URL HTTPS. Depois abre PowerShell ou Terminal nesta pasta e executa:

```bash
git init -b main
git add .
git status
git commit -m "Initial commit: RITMO 4.0.1"
git remote add origin https://github.com/TEU-UTILIZADOR/ritmo.git
git push -u origin main
```

Substitui `TEU-UTILIZADOR` pelo teu nome de utilizador GitHub. Confirma `git status` antes do commit para verificar que `.env`, backups e dados pessoais não aparecem na lista.

## Atualizar o GitHub no futuro

Depois de alterares o projeto:

```bash
git add .
git status
git commit -m "Descreve a alteração"
git push
```

## Verificação local

Requer Node.js 20 ou superior:

```bash
npm run check
```

O GitHub Actions também executa esta verificação automaticamente em cada push e pull request.
