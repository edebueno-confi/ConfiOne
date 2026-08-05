# Audit de fricção UX — Configurações, Fontes e Histórico

## Resumo executivo

1. A antiga navegação concorrente obrigava o usuário a distinguir shell global,
   menu de Configurações e barra de Analytics; a rota canônica elimina essa
   decisão.
2. Credenciais, catálogo e histórico agora são tarefas distintas, reduzindo
   risco de alteração acidental e melhorando a recuperação após interrupções.
3. O maior risco remanescente é semântico, não visual: o denominador de Customer
   Success ainda precisa ser aprovado antes de uma decisão visual ou KPI nova.

## Árvore de decisão

```text
Usuário entra em Configurações
├─ Integrações (45%, fricção anterior 8/10)
│  ├─ Salvar estado (70%, 30s, baixa)
│  └─ Atualizar credencial (30%, 60s, média)
├─ Fontes do Dashboard (40%, fricção anterior 9/10)
│  ├─ Ver origem/status (45%, 20s, baixa)
│  ├─ Classificar pipeline (35%, 45s, média)
│  └─ Rodar atualização (20%, ação externa, alta)
└─ Histórico (15%, fricção anterior 7/10)
   └─ Encontrar ciclo/erro (100%, 30s, baixa)
```

Probabilidades são hipótese operacional para priorização, não telemetria
produtiva. O produto não deve tratá-las como dado.

## Simulações de jornada

### Administrador experiente

| Tempo | Ação | Estado | Fricção |
|---|---|---|---|
| 0:00 | Abre Integrações pela rota direta | Reconhece o menu | Baixa |
| 0:10 | Confere badge e ativa/desativa | Feedback imediato | Baixa |
| 0:30 | Atualiza APP_KEY/APP_SECRET se necessário | Campos separados | Média |
| 1:00 | Vai ao Histórico para conferir resultado | Contexto preservado | Baixa |

### Usuário novo

| Tempo | Ação | Estado | Fricção |
|---|---|---|---|
| 0:00 | Lê “Conexões oficiais” | Entende a finalidade | Baixa |
| 0:20 | Identifica credencial pendente | Reconhecimento visual/textual | Baixa |
| 0:45 | Abre Fontes do Dashboard | Encontra origem e escopo | Baixa |
| 1:20 | Vê “A classificar” | Não recebe KPI inventado | Média |

### Usuário interrompido

| Tempo | Ação | Estado | Fricção |
|---|---|---|---|
| 0:00 | Começa a configurar OMIE | Campos locais preservam entrada | Baixa |
| 0:15 | Sai e retorna pela rota canônica | Menu mantém orientação | Baixa |
| 0:30 | Finaliza ou abandona sem sobrescrever segredo | Blank mantém credencial | Baixa |

## Matriz de fricção

| Fricção | Afetados | Severidade | Dificuldade | Prioridade |
|---|---:|---:|---|---|
| Navegação duplicada | 100% | 8 | Média | Alta |
| Credencial OMIE em formato único | Admins OMIE | 8 | Baixa | Alta |
| Histórico misturado a ações | 100% | 7 | Média | Alta |
| Pipeline sem classificação | Admins de dados | 9 | Alta | Alta |
| Denominador de CS não aprovado | Gestores | 10 | Alta | Crítica de domínio |

## Impedância atual versus ideal

| Tarefa | Antes | Agora | Ideal futuro |
|---|---|---|---|
| Encontrar integrações | Alta, barra interna | Baixa, rota lateral | Mantido |
| Configurar OMIE | Média, campo técnico | Baixa, APP_KEY/APP_SECRET | Mantido |
| Classificar pipeline | Alta, cadastro manual | Média, catálogo vivo | Ações em massa confirmadas |
| Auditar ciclo | Alta, logs separados | Baixa, agrupamento por correlação | Filtros por período/resultado |
| Validar carteira CS | Ambígua | Indisponível até denominador | Contrato de carteira aprovado |

## Recomendações

### Imediatas adotadas

- uma rota por tarefa;
- estados de fonte com texto e motivo;
- alias e nome oficial juntos;
- ação de atualização manual explícita;
- mobile em coluna única e targets de toque amplos;
- copy sem nomes de infraestrutura.

### Médio prazo

- filtro por status e período no Histórico;
- confirmação e resumo antes de ações em massa;
- próximo ciclo conhecido quando o scheduler fornecer esse dado;
- reorientação ao retornar para um pipeline editado.

### Longo prazo

- contrato de carteira Customer Success;
- modo de complexidade progressiva para usuários novos e experientes;
- preferências de densidade e movimento reduzido persistidas.

## Checklist de implementação

- [x] Shell único e rota previsível.
- [x] Credenciais nunca retornam.
- [x] Sem diagnóstico em produção.
- [x] Sem overflow global no QA empacotado.
- [x] Estados loading, vazio e erro nas três páginas.
- [ ] Denominador de Customer Success aprovado.
- [ ] Sync real read-only autorizado.
