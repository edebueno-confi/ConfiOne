@echo off
chcp 65001 >nul
title Genius Support OS - Ambiente de teste local
cd /d "%~dp0"

echo ==================================================
echo    GENIUS SUPPORT OS - iniciando ambiente local
echo ==================================================
echo.

where docker >nul 2>nul
if errorlevel 1 (
  echo [ERRO] Docker Desktop nao encontrado.
  echo Instale o Docker Desktop, abra ele e rode este atalho de novo.
  echo Download: https://www.docker.com/products/docker-desktop/
  pause & exit /b 1
)
docker info >nul 2>nul
if errorlevel 1 (
  echo [ERRO] O Docker Desktop esta instalado mas NAO esta aberto/rodando.
  echo Abra o Docker Desktop, espere o icone ficar verde e rode de novo.
  pause & exit /b 1
)

echo [1/6] Preparando dependencias (demora so na primeira vez)...
if not exist "node_modules" (
  call npm install
  if errorlevel 1 ( echo [ERRO] Falha ao instalar dependencias. & pause & exit /b 1 )
)

echo [2/6] Subindo o banco de dados local (Supabase)...
call npx supabase start
if errorlevel 1 ( echo [ERRO] Falha ao subir o Supabase. & pause & exit /b 1 )

echo [3/6] Garantindo o Edge Runtime (ele cai as vezes)...
docker start supabase_edge_runtime_genius-support-os >nul 2>nul
timeout /t 5 /nobreak >nul

echo [4/6] Conectando o aplicativo ao banco...
call node scripts/dev/write-local-env.mjs
if errorlevel 1 ( echo [ERRO] Falha ao configurar a conexao. & pause & exit /b 1 )

echo [5/6] Preparando tabelas e populando dados de teste (seed)...
call npm run supabase:db:reset
if errorlevel 1 ( echo [ERRO] Falha ao preparar o banco. & pause & exit /b 1 )
call npm run supabase:qa:local-functional-fixture
if errorlevel 1 (
  echo [AVISO] O seed completo nao terminou 100%%, mas o login de admin
  echo         normalmente ja funciona. Continuando...
)

echo [6/6] Abrindo o aplicativo no navegador...
start "" http://localhost:4173

echo.
echo ==================================================
echo   PRONTO! Acesse no navegador:
echo     http://localhost:4173
echo.
echo   Login de ADMIN:
echo     Usuario: qa.local.platform-admin@genius.local
echo     Senha:   Local-QA-Admin-2026!
echo.
echo   (Se abrir em branco, espere alguns segundos e F5.)
echo   MANTENHA ESTA JANELA ABERTA enquanto testa.
echo ==================================================
echo.

call npm run web:dev
pause
