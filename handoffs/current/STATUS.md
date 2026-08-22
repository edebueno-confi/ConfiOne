# STATUS

- Task: `IDLE`
- State: `IDLE`
- Owner: `Forge`
- Role: `EXECUTOR`
- Reviewer active: `Sentinel`
- Review mode: `SENTINEL_REQUIRED`
- Coordinator: `Codex`
- Notification protocol: evento direto entre agentes e aviso ao Codex; três
  heartbeats recorrentes de recuperação em 30 minutos.
- Agent coordination: `IDLE`
- Approval: `NONE`
- Base SHA: `24dce2e`
- Current SHA: `24dce2e`

O handoff corrente está livre. A próxima promoção deve respeitar a fila
canônica, as dependências satisfeitas, a allowlist e a preservação das
alterações preexistentes.

Push, merge, deploy, produção, secrets, migrations remotas e escritas externas
continuam proibidos.
