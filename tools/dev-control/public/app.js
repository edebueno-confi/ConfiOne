import {
  createQueueCardModel,
  formatWorktreeStatus,
  groupQueueItems,
  normalizeQueueItems,
} from './queue-state.js';

const refreshState = document.querySelector('#refresh-state');
const refreshButton = document.querySelector('#refresh-button');
const detailContainer = document.querySelector('#task-detail');
const loadState = document.querySelector('#load-state');

const columns = [
  ['BACKLOG', 'Backlog'],
  ['READY', 'Ready'],
  ['IMPLEMENTING', 'Implementando'],
  ['READY_FOR_REVIEW', 'Review Sentinel'],
  ['CHANGES_REQUESTED', 'Changes Requested'],
  ['APPROVED', 'Aprovado'],
  ['DONE', 'Concluído'],
  ['BLOCKED', 'Bloqueado'],
  ['OWNER_DECISION_REQUIRED', 'Decisão do owner'],
  ['UNRESOLVED', 'Estado indisponível'],
];

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function shortSha(value) {
  return value && value.length > 12 ? value.slice(0, 12) : value || '—';
}

function stateTone(state) {
  if (state === 'DONE' || state === 'APPROVED') return 'positive';
  if (state === 'CHANGES_REQUESTED' || state === 'BLOCKED') return 'critical';
  return 'default';
}

function stateLabel(state) {
  return {
    BACKLOG: 'BACKLOG',
    READY: 'READY',
    READY_FOR_IMPLEMENTATION: 'READY',
    IMPLEMENTING: 'IMPLEMENTANDO',
    READY_FOR_REVIEW: 'REVIEW SENTINEL',
    REVIEWING: 'REVIEWING',
    CHANGES_REQUESTED: 'CHANGES REQUESTED',
    APPROVED: 'APPROVED',
    DONE: 'DONE',
    BLOCKED: 'BLOCKED',
    OWNER_DECISION_REQUIRED: 'OWNER DECISION',
  }[state] || state || 'INDEFINIDO';
}

function renderOverview(snapshot) {
  const current = snapshot.current.status;
  const currentReview = snapshot.current.review.result;
  const worktree = formatWorktreeStatus(snapshot.project.gitAvailable, snapshot.project.dirtyCount);
  const cards = [
    ['Projeto', snapshot.project.name, snapshot.project.branch],
    ['Branch', snapshot.project.branch, `HEAD ${shortSha(snapshot.project.head)}`],
    ['Tarefa corrente', current.task, current.state],
    ['Owner', current.owner, `Review ${currentReview} · ${stateLabel(current.state)}`],
    ['Fila', snapshot.queue.length, `${snapshot.queue.filter((item) => item.state === 'DONE').length} concluídas`],
    ['Worktree', worktree.value, worktree.helper],
  ];

  document.querySelector('#overview').innerHTML = cards.map(([label, value, helper]) => `
    <article class="metric">
      <p class="metric-label">${escapeHtml(label)}</p>
      <p class="metric-value">${escapeHtml(value)}</p>
      <p class="metric-helper">${escapeHtml(helper)}</p>
    </article>
  `).join('');
}

function renderCurrent(snapshot) {
  const { status, task, review } = snapshot.current;
  const statePill = document.querySelector('#current-state');
  statePill.textContent = status.state;
  statePill.dataset.tone = stateTone(status.state);
  document.querySelector('#current-task').innerHTML = `
    <div>
      <p class="current-title">${escapeHtml(task.título || status.task)}</p>
      <div class="current-meta">
        <span><strong>Task:</strong> ${escapeHtml(status.task)}</span>
        <span><strong>Owner:</strong> ${escapeHtml(status.owner)}</span>
        <span><strong>Role:</strong> ${escapeHtml(status.role)}</span>
        <span><strong>Reviewer:</strong> ${escapeHtml(status.reviewer_active)}</span>
        <span><strong>Coordenação:</strong> ${escapeHtml(status.agent_coordination)}</span>
        <span><strong>Base:</strong> ${escapeHtml(shortSha(status['base_sha']))}</span>
        <span><strong>HEAD:</strong> ${escapeHtml(shortSha(snapshot.project.head))}</span>
      </div>
    </div>
    <div class="document-strip">
      ${['TASK', 'IMPLEMENTATION', 'REVIEW', 'STATUS'].map((documentName) => `
        <div class="document-chip">
          <strong>${documentName}</strong>
          <span>${documentName === 'REVIEW' ? escapeHtml(review.result) : 'disponível no handoff'}</span>
        </div>
      `).join('')}
    </div>
    <div class="current-meta">
      <span><strong>Findings abertos:</strong> ${escapeHtml(review.openFindings.length)}</span>
      <span><strong>Findings resolvidos:</strong> ${escapeHtml(review.resolvedFindings.length)}</span>
      <span><strong>Atualizado:</strong> ${escapeHtml(status['updated_at'])}</span>
    </div>
  `;

  renderTaskDetail(snapshot, snapshot.current.task?.['task_id'] || status.task);
}

function renderTaskDetail(snapshot, selectedTaskId) {
  const current = snapshot.current.status;
  const task = (snapshot.taskDetails || []).find((item) => item.task_id === selectedTaskId)
    || (snapshot.taskDetails || []).find((item) => item.task_id === current.task);
  if (!detailContainer) return;

  const review = task?.review;
  const reviewSummary = review
    ? `${review.result} · ${review.openFindings.length} abertos · ${review.resolvedFindings.length} resolvidos`
    : 'Não disponível no handoff desta task';
  const observedState = task?.observedState || 'Não disponível no handoff desta task';
  const owner = task?.owner || 'Não disponível no handoff desta task';
  const findings = review
    ? [...review.openFindings.map((finding) => `Aberto: ${finding}`), ...review.resolvedFindings.map((finding) => `Resolvido: ${finding}`)]
    : [];

  detailContainer.innerHTML = `
    <div class="detail-heading">
      <div>
        <p class="eyebrow">Inspeção read-only</p>
        <h2>${escapeHtml(task?.título || task?.title || current.task || 'Task indisponível')}</h2>
      </div>
      <span class="state-pill" data-tone="${escapeHtml(stateTone(task?.observedState || task?.state))}">${escapeHtml(stateLabel(task?.observedState || task?.canonicalState || task?.state))}</span>
    </div>
    <dl class="detail-list">
      <div><dt>Task ID</dt><dd>${escapeHtml(task?.task_id || current.task)}</dd></div>
      <div><dt>Fila</dt><dd>${escapeHtml(task?.state || 'indisponível')} → ${escapeHtml(task?.canonicalState || stateLabel(task?.state))}</dd></div>
      <div><dt>Estado observado</dt><dd>${escapeHtml(observedState)}</dd></div>
      <div><dt>Owner</dt><dd>${escapeHtml(owner)}</dd></div>
      <div><dt>Prioridade</dt><dd>${escapeHtml(task?.priority || 'indisponível')}</dd></div>
      <div><dt>Dependências</dt><dd>${escapeHtml(task?.dependencies || 'indisponível')}</dd></div>
      <div><dt>Approval</dt><dd>${escapeHtml(task?.approval || 'indisponível')}</dd></div>
      <div><dt>Review</dt><dd>${escapeHtml(reviewSummary)}</dd></div>
      <div><dt>Gates</dt><dd>${escapeHtml(task?.gates?.results?.length ? task.gates.results.join(' · ') : 'Não disponível no handoff desta task')}</dd></div>
      <div><dt>Última evidência</dt><dd>${escapeHtml(task?.evidence || 'Não disponível no handoff desta task')} · ${escapeHtml(task?.source || 'fonte indisponível')}</dd></div>
    </dl>
    <div class="detail-findings">
      <strong>Findings observáveis</strong>
      ${findings.length
        ? `<ul>${findings.map((finding) => `<li>${escapeHtml(finding)}</li>`).join('')}</ul>`
        : `<p class="muted">${review ? 'Nenhum finding estruturado no handoff desta task.' : 'Não disponível no handoff desta task.'}</p>`}
    </div>
  `;
}

function renderDecisions(snapshot) {
  const container = document.querySelector('#decisions');
  container.innerHTML = snapshot.decisions.length
    ? snapshot.decisions.map((decision) => `<div class="decision-item">${escapeHtml(decision)}</div>`).join('')
    : '<p class="decision-empty">Nenhuma decisão humana pendente identificada.</p>';
}

function renderCard(item) {
  const card = createQueueCardModel(item);
  return `
    <article class="queue-card">
      <p class="id">${escapeHtml(card.id)}</p>
      <h3>${escapeHtml(card.title)}</h3>
      <p>${escapeHtml(card.project)} · ${escapeHtml(card.priority)}</p>
      <div class="card-tags">
        <span class="tag">Owner: ${escapeHtml(card.owner)}</span>
        <span class="tag">${escapeHtml(stateLabel(card.canonicalState))}</span>
        <span class="tag">${escapeHtml(card.approval)}</span>
      </div>
      <p>${escapeHtml(card.dependencies)}</p>
      <p>Origem: ${escapeHtml(card.origin)}</p>
      <button class="detail-button" type="button" data-task-id="${escapeHtml(card.id)}">Ver detalhes</button>
    </article>
  `;
}

function renderKanban(snapshot) {
  const activeQueue = normalizeQueueItems(
    snapshot.queue,
    snapshot.current.status.task,
    snapshot.current.status.owner,
    snapshot.current.status.state,
  );
  const groupedQueue = groupQueueItems(activeQueue, columns);
  document.querySelector('#queue-count').textContent = `${activeQueue.length} tarefas na fila`;
  document.querySelector('#kanban').innerHTML = columns.map(([state, label]) => {
    const items = groupedQueue[state] ?? [];
    return `
      <section class="kanban-column">
        <div class="column-heading"><h3>${escapeHtml(label)}</h3><span class="column-count">${items.length}</span></div>
        ${items.length ? items.map(renderCard).join('') : '<p class="muted">Vazio</p>'}
      </section>
    `;
  }).join('');
}

function renderAgents(snapshot) {
  document.querySelector('#agents').innerHTML = (snapshot.agents || []).map((agent) => `
    <article class="agent-card" data-observed="${agent.observed}">
      <div class="agent-card-heading">
        <div><strong>${escapeHtml(agent.name)}</strong><span>${escapeHtml(agent.role)}</span></div>
        <span class="agent-state">${escapeHtml(agent.state)}</span>
      </div>
      <p>${escapeHtml(agent.evidence)}</p>
      <p>${escapeHtml(agent.heartbeat)} · ${escapeHtml(agent.observedAt || 'sem atualização observável')}</p>
    </article>
  `).join('');
  document.querySelector('#agent-coordination').textContent = snapshot.current.status.agent_coordination || 'indisponível';
}

function renderGates(snapshot) {
  const { source, results } = snapshot.current.gates;
  const gates = results.length ? results : ['Nenhuma validação declarada no IMPLEMENTATION.md.'];
  document.querySelector('#gates-source').textContent = source;
  document.querySelector('#gates').innerHTML = gates.map((gate) => {
    return `<li><span class="evidence-label">Declaração</span><span class="evidence-value">${escapeHtml(gate)}</span></li>`;
  }).join('');
}

function renderActivity(snapshot) {
  document.querySelector('#activity').innerHTML = snapshot.activity.length
    ? snapshot.activity.map((item) => `
      <div class="activity-item">
        <strong>${escapeHtml(item.subject)}</strong>
        <span>${escapeHtml(item.source || item.kind || 'evento')} · ${escapeHtml(item.sha || '—')} · ${escapeHtml(item.date || 'data indisponível')}</span>
      </div>
    `).join('')
    : '<p class="muted">Nenhum commit disponível.</p>';
}

async function refresh() {
  refreshState.textContent = 'Atualizando...';
  if (loadState) loadState.textContent = 'Lendo fontes canônicas locais...';
  try {
    const response = await fetch('/api/snapshot', { cache: 'no-store' });
    if (!response.ok) throw new Error(`snapshot HTTP ${response.status}`);
    const snapshot = await response.json();
    renderOverview(snapshot);
    renderCurrent(snapshot);
    renderDecisions(snapshot);
    renderKanban(snapshot);
    renderGates(snapshot);
    renderActivity(snapshot);
    renderAgents(snapshot);
    if (loadState) {
      loadState.textContent = '';
      delete loadState.dataset.tone;
    }
    refreshState.textContent = `Atualizado ${new Date(snapshot.generatedAt).toLocaleTimeString('pt-BR')}`;
  } catch (error) {
    if (loadState) loadState.textContent = 'Não foi possível ler o snapshot local. Nenhum comando foi executado.';
    if (loadState) loadState.dataset.tone = 'error';
    refreshState.innerHTML = `<span class="error">${escapeHtml(error.message)}</span>`;
  }
}

refreshButton.addEventListener('click', refresh);
document.querySelector('#kanban').addEventListener('click', (event) => {
  const button = event.target.closest('[data-task-id]');
  if (!button) return;
  fetch('/api/snapshot', { cache: 'no-store' })
    .then((response) => response.json())
    .then((snapshot) => renderTaskDetail(snapshot, button.dataset.taskId))
    .catch(() => {});
});
void refresh();
window.setInterval(refresh, 10_000);
