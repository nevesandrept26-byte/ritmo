@echo off
setlocal
cd /d "%~dp0"
echo ============================================
echo   RITMO - Instalar modelo local de imagem
echo ============================================
echo.
where ollama >nul 2>nul
if errorlevel 1 (
  echo Ollama nao foi encontrado neste computador.
  echo A abrir a pagina oficial de instalacao...
  start "" "https://ollama.com/download/windows"
  echo Instala o Ollama, abre-o uma vez e volta a executar este ficheiro.
  pause
  exit /b 1
)
echo Modelo recomendado: qwen3.5:4b
echo Tamanho aproximado do download: 3.3–4.0 GB.
echo O download e feito diretamente dos servidores Ollama.
echo.
ollama pull qwen3.5:4b
if errorlevel 1 (
  echo.
  echo O download falhou. Confirma a ligacao, o espaco em disco e se o Ollama esta aberto.
  pause
  exit /b 1
)
echo.
echo Modelo instalado com sucesso!
echo Podes abrir o RITMO com start.bat e usar Fotografar refeicao.
echo.
ollama list
pause
