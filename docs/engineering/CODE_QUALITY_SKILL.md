# Skill de qualidade de código

## Objetivo

`genius-code-quality` é o workflow reutilizável de auditoria técnica do Genius Support OS. Ele prepara commits, handoffs, revisões humanas e decisões de release sem tratar lint ou typecheck como prova suficiente de qualidade.

## Localização e invocação

A skill vive no repositório em `.agents/skills/genius-code-quality/`; não é uma skill global. Use:

```text
$genius-code-quality fast
$genius-code-quality changed
$genius-code-quality module apps/web/src/features/analytics
$genius-code-quality full
```

O comportamento padrão é read-only. Correções só entram em um lote separado e explicitamente autorizado.

## Modos e comandos

`fast` executa o gate curto: estado Git, `git diff --check`, padrões estáticos e typechecks configurados. `changed` considera staged, unstaged e untracked relevantes, sem presumir `main`. `module` restringe a análise ao caminho/domínio informado e seus contratos. `full` amplia a análise ao repositório, incluindo higiene e documentação quando os scripts existem.

Os scripts de apoio são:

- `scripts/run-quality-gate.mjs`: executa gates seguros e gera Markdown; `--json` gera o contrato estruturado.
- `scripts/check-project-patterns.mjs`: encontra candidatos estáticos sem abrir arquivos de ambiente ou credenciais.
- `scripts/validate-skill.mjs`: valida estrutura e frontmatter da própria skill.

Banco, navegador, migration, sync externo, deploy, push e comandos destrutivos não são executados por padrão. Testes, build gerador e dependências novas precisam de decisão e validação próprias.

## Severidade e evidência

CRÍTICO e ALTO podem bloquear merge/release; MÉDIO, BAIXO e INFORMATIVO exigem contexto proporcional. Todo achado precisa de arquivo/linha, evidência, impacto, recomendação, confiança, proveniência, bloqueio e falso positivo possível. Consulte `references/severity-model.md`.

## Limitações

Padrões automatizados são candidatos, não conclusões. A análise precisa ser comparada com views/read models/RPCs, RLS, permissões, consumidores, testes e documentação reais. Ausência de credencial ou ambiente é limitação a registrar, nunca motivo para abrir `.env` ou simular dados. Métricas orientam investigação e não definem qualidade sozinhas.

## Evolução segura

Antes de adicionar regra, demonstre um caso real do repositório, o risco evitado e a evidência esperada. Prefira melhorar o script existente a instalar pacote. Para nova dependência, documente problema, alternativa existente, custo, manutenção, falso positivo, licença e impacto em build/CI; qualquer alteração de manifesto/lockfile requer autorização específica.

Evite falsos positivos reduzindo a severidade de padrões heurísticos, exigindo revisão de contrato/consumidor e marcando hipóteses como `possível` ou `provável`. Não transforme preferência estilística em erro.

## Lint, quality gate e auditoria profunda

Lint verifica padrões sintáticos. Quality gate combina gates rápidos, estado Git e candidatos estáticos para uma decisão limitada. Auditoria profunda revisa semântica, arquitetura, segurança, dados, integrações, testes e documentação. Um gate verde não substitui a auditoria nem autoriza dizer que o release está aprovado sem evidência.
