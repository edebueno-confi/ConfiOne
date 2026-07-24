@echo off
chcp 65001 >nul
title Genius Support OS - Criar usuarios e dados de teste
cd /d "%~dp0"

echo ==================================================
echo   Criando usuarios e dados de teste no banco local
echo ==================================================
echo.
echo (O Docker Desktop e o app precisam estar rodando.
echo  Se voce usou o INICIAR-GENIUS.bat, deixe aquela
echo  janela aberta e rode este aqui em paralelo.)
echo.

call npx supabase status >nul 2>nul
if errorlevel 1 (
  echo [ERRO] O banco local (Supabase) nao esta no ar.
  echo Rode primeiro o INICIAR-GENIUS.bat e deixe aberto.
  pause & exit /b 1
)

echo Passo 1 de 2: garantindo as tabelas do banco...
call npm run supabase:db:reset
echo.
echo Passo 2 de 2: criando usuarios e dados de teste...
call npm run supabase:qa:local-functional-fixture
set SEEDCODE=%errorlevel%
echo.

if "%SEEDCODE%"=="0" (
  echo ==================================================
  echo   [OK] Tudo pronto!
  echo   Volte ao navegador: http://localhost:4173
  echo   Entre com:
  echo     qa.local.platform-admin@genius.local
  echo     Local-QA-Admin-2026!
  echo ==================================================
) else (
  echo ==================================================
  echo   [ATENCAO] O seed completo nao terminou 100%%.
  echo   MESMO ASSIM, tente entrar no navegador com:
  echo     qa.local.platform-admin@genius.local
  echo     Local-QA-Admin-2026!
  echo   (o usuario admin costuma ser criado no inicio).
  echo.
  echo   Se ainda dizer "Credenciais invalidas",
  echo   copie as ULTIMAS ~15 linhas acima e me envie no chat.
  echo ==================================================
)
pause
