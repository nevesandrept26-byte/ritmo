@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 20 ou superior nao foi encontrado.
  echo Instala Node.js e volta a executar este ficheiro.
  pause
  exit /b 1
)
echo A iniciar o RITMO 4.0 em http://127.0.0.1:8000
echo Mantem esta janela aberta enquanto utilizas a aplicacao.
echo Para analisar fotografias localmente, instala e abre o Ollama.
echo Se ja tens qwen3.5:4b instalado no Ollama, nao precisas de o descarregar novamente.
echo Caso contrario, executa install-qwen3.5-4b.bat uma vez.
start "RITMO Server" /D "%~dp0" cmd /k "node server\server.mjs"
timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:8000"
