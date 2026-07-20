@echo off
chcp 65001 >nul
title Genius Support OS - Diagnostico
cd /d "%~dp0"
set "LOG=%~dp0diagnostico-log.txt"

echo Gerando diagnostico, isso pode levar alguns minutos...
echo NAO feche esta janela ate ver "PRONTO" no final.
echo.

> "%LOG%" echo ===== INICIO DIAGNOSTICO =====
>> "%LOG%" 2>&1 echo.
>> "%LOG%" 2>&1 echo ===== node -v =====
>> "%LOG%" 2>&1 call node -v
>> "%LOG%" 2>&1 echo ===== npm -v =====
>> "%LOG%" 2>&1 call npm -v
>> "%LOG%" 2>&1 echo ===== docker info (resumo) =====
>> "%LOG%" 2>&1 docker info --format "{{.ServerVersion}}"
>> "%LOG%" 2>&1 echo ===== supabase status =====
>> "%LOG%" 2>&1 call npx supabase status
>> "%LOG%" 2>&1 echo ===== conteudo apps\web\.env.local =====
>> "%LOG%" 2>&1 type "apps\web\.env.local"
>> "%LOG%" 2>&1 echo.
>> "%LOG%" 2>&1 echo ===== db reset =====
>> "%LOG%" 2>&1 call npm run supabase:db:reset
>> "%LOG%" 2>&1 echo.
>> "%LOG%" 2>&1 echo ===== functional fixture (seed) =====
>> "%LOG%" 2>&1 call npm run supabase:qa:local-functional-fixture
>> "%LOG%" 2>&1 echo.
>> "%LOG%" 2>&1 echo ===== FIM DIAGNOSTICO =====

echo.
echo ==================================================
echo   PRONTO!
echo   Foi criado o arquivo: diagnostico-log.txt
echo   na pasta do projeto.
echo   Volte ao chat do Claude e escreva "pronto".
echo   Ele vai ler o arquivo e resolver.
echo ==================================================
pause
