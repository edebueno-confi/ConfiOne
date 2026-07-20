# Operacao Autonoma do Agente

Este documento define como um agente deve trabalhar continuamente no novo projeto.

## Missao do agente

Construir o Genius Support OS MVP em ciclos pequenos, mantendo documentacao, codigo, testes e roadmap sincronizados.

## Entrada obrigatoria de cada ciclo

Antes de iniciar qualquer ciclo, o agente deve ler:

1. `AGENTS.md`
2. `docs/PROJECT_STATE.md`
3. `docs/ROADMAP.md` ou `09-roadmap-agentico.md`
4. `docs/BACKLOG.md` ou `10-backlog-executavel.md`
5. docs do modulo atual
6. estado Git

## Loop autonomo

1. Identificar o primeiro ciclo pendente.
2. Selecionar a menor tarefa executavel.
3. Auditar arquivos e contratos existentes.
4. Implementar somente o lote atual.
5. Rodar validacoes proporcionais.
6. Corrigir falhas encontradas.
7. Atualizar documentacao impactada.
8. Registrar status Git.
9. Avancar para a proxima tarefa segura.

## Como escolher tarefas

Prioridade:

1. Bugs e gates quebrados.
2. Tarefa P0 desbloqueadora do ciclo atual.
3. Teste faltante para contrato critico.
4. Implementacao minima.
5. UI conectada a contrato real.
6. Polimento visual.
7. Documentacao de fechamento.

Nunca escolher:

- modulo futuro antes do MVP;
- tela sem contrato;
- integracao externa sem autorizacao;
- refatoracao ampla sem necessidade;
- automacao que envie mensagem real.

## Padrao de entrega por tarefa

Cada tarefa concluida deve registrar:

- `Feito`: arquivos e comportamento.
- `Validado`: comandos e resultado.
- `Atencao`: riscos, bloqueios e proximos passos.
- `Git`: branch, status, commit se houver.

## Atualizacao documental obrigatoria

Atualizar quando aplicavel:

- `docs/PROJECT_STATE.md`
- `docs/ROADMAP.md`
- `docs/BACKLOG.md`
- documento do modulo
- `docs/DECISIONS.md`
- `docs/VALIDATION_LOG.md`

Se nao atualizar docs, registrar por que o lote nao alterou estado/documentacao.

## Condicoes de parada

Parar e pedir humano antes de:

- deploy;
- push para producao;
- migracao remota;
- reset destrutivo;
- apagar dados;
- usar ou alterar secrets;
- OAuth/Gmail real;
- envio externo;
- compra/custo;
- usar dados reais sensiveis;
- mudar escopo de produto;
- relaxar RLS ou permissoes.

## Uso de agendamentos

Agendamentos podem ser usados para continuidade, mas devem disparar apenas trabalho local seguro.

### Agendamento diario sugerido

Objetivo:

- verificar estado do projeto;
- rodar gates leves;
- escolher proxima tarefa pendente;
- executar um lote pequeno;
- registrar resultado.

Janela sugerida:

- uma vez por dia util;
- limite de tempo por execucao;
- sem deploy;
- sem integracao externa.

Prompt sugerido:

```text
Leia AGENTS.md, docs/PROJECT_STATE.md, docs/ROADMAP.md e docs/BACKLOG.md.
Identifique a primeira tarefa pendente segura do MVP.
Execute um lote pequeno de ponta a ponta.
Rode as validacoes proporcionais.
Atualize a documentacao impactada.
Reporte Feito, Validado, Atencao e Git.
Nao execute deploy, migracao remota, uso de secrets, envio externo ou operacao com custo.
```

### Agendamento semanal sugerido

Objetivo:

- revisar progresso;
- consolidar docs;
- detectar drift;
- atualizar roadmap.

Prompt sugerido:

```text
Faca uma auditoria semanal do MVP.
Compare docs, backlog, roadmap, estado Git, testes e implementacao.
Liste o que foi concluido, o que esta bloqueado, quais gates falham e qual deve ser o proximo ciclo.
Nao altere codigo antes de entregar o diagnostico.
Depois, se houver correcao local segura e pequena, implemente e valide.
```

## Politica de commits

Quando commits forem usados:

- um commit por lote coerente;
- mensagem objetiva em pt-BR;
- nao stagear alteracoes nao relacionadas;
- nao usar `git add .` em worktree sujo;
- nao reverter trabalho humano.

## Sinais de erro de rumo

O agente deve reduzir escopo quando notar:

- muitas tabelas novas no mesmo ciclo;
- UI antes de contrato;
- documento crescendo sem tarefa executavel;
- feature futura entrando no MVP;
- validacao ficando para depois;
- dados falsos para preencher tela;
- termos tecnicos vazando para cliente.

## Definicao de pronto

Uma tarefa so esta pronta quando:

- comportamento existe;
- contrato backend existe quando necessario;
- teste relevante passou;
- UI nao inventa dados;
- docs foram atualizadas;
- riscos restantes foram registrados;
- proxima tarefa esta clara.
