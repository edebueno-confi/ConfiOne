import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [codexHome, outputDir] = process.argv.slice(2);
if (!codexHome || !outputDir) {
  throw new Error('Usage: node export-codex-context.mjs <codex-home> <output-dir>');
}

mkdirSync(outputDir, { recursive: true });

const open = (name) => new DatabaseSync(join(codexHome, name), { readOnly: true });
const state = open('state_5.sqlite');
const memories = open('memories_1.sqlite');
const goals = open('goals_1.sqlite');
const logs = open('logs_2.sqlite');

const threads = state.prepare(`
  SELECT id, title, first_user_message, preview, cwd, rollout_path, created_at,
         updated_at, archived, git_branch, git_sha, source, model, reasoning_effort,
         agent_nickname, agent_role, parent_thread_id
  FROM threads
  LEFT JOIN thread_spawn_edges ON threads.id = thread_spawn_edges.child_thread_id
  ORDER BY COALESCE(updated_at_ms, created_at_ms) DESC
`).all();

const memoryRows = memories.prepare(`
  SELECT thread_id, rollout_slug, raw_memory, rollout_summary, generated_at,
         usage_count, last_usage
  FROM stage1_outputs
  ORDER BY generated_at DESC
`).all();

const goalTables = goals.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
const goalData = {};
for (const { name } of goalTables) {
  if (name.startsWith('_') || name === 'sqlite_sequence') continue;
  goalData[name] = goals.prepare(`SELECT * FROM "${name.replaceAll('"', '""')}"`).all();
}

const incidentLogs = logs.prepare(`
  SELECT ts, level, target, module_path, file, line, thread_id, feedback_log_body
  FROM logs
  WHERE feedback_log_body LIKE '%archived_sessions%'
     OR feedback_log_body LIKE '%rollout%'
     OR feedback_log_body LIKE '%migration%'
     OR feedback_log_body LIKE '%backfill%'
     OR feedback_log_body LIKE '%delete%'
     OR feedback_log_body LIKE '%remove%'
  ORDER BY ts DESC
  LIMIT 2000
`).all();

const integrity = {
  state: state.prepare('PRAGMA integrity_check').all(),
  memories: memories.prepare('PRAGMA integrity_check').all(),
  goals: goals.prepare('PRAGMA integrity_check').all(),
  logs: logs.prepare('PRAGMA integrity_check').all(),
};

const json = (name, value) => writeFileSync(
  join(outputDir, name),
  JSON.stringify(value, (_key, item) => typeof item === 'bigint' ? item.toString() : item, 2),
  'utf8',
);

json('threads.json', threads);
json('memories.json', memoryRows);
json('goals.json', goalData);
json('incident-logs.json', incidentLogs);
json('integrity.json', integrity);

const byThread = new Map(memoryRows.map((item) => [item.thread_id, item]));
const md = [
  '# Contexto recuperado do Codex',
  '',
  `Exportado em ${new Date().toISOString()}.`,
  '',
  `- Tarefas catalogadas: ${threads.length}`,
  `- Tarefas com memória consolidada: ${memoryRows.length}`,
  `- Tarefas arquivadas: ${threads.filter((item) => item.archived).length}`,
  '',
];

for (const thread of threads) {
  const memory = byThread.get(thread.id);
  md.push(`## ${thread.title || thread.id}`, '');
  md.push(`- ID: \`${thread.id}\``);
  md.push(`- Diretório: \`${thread.cwd || ''}\``);
  md.push(`- Atualização: ${thread.updated_at || ''}`);
  md.push(`- Arquivada: ${thread.archived ? 'sim' : 'não'}`);
  if (thread.git_branch) md.push(`- Branch: \`${thread.git_branch}\``);
  if (thread.parent_thread_id) md.push(`- Tarefa-mãe: \`${thread.parent_thread_id}\``);
  md.push('');
  if (thread.first_user_message) {
    md.push('### Solicitação inicial', '', thread.first_user_message, '');
  }
  if (thread.preview && thread.preview !== thread.first_user_message) {
    md.push('### Prévia preservada', '', thread.preview, '');
  }
  if (memory?.rollout_summary) {
    md.push('### Resumo da execução', '', memory.rollout_summary, '');
  }
  if (memory?.raw_memory) {
    md.push('### Memória operacional', '', memory.raw_memory, '');
  }
}

writeFileSync(join(outputDir, 'CONTEXTO_RECUPERADO.md'), md.join('\n'), 'utf8');

const projects = new Map();
for (const thread of threads) {
  const key = thread.cwd || '(sem diretório registrado)';
  const items = projects.get(key) || [];
  items.push(thread);
  projects.set(key, items);
}

const projectIndex = ['# Índice de projetos e diretórios recuperados', ''];
for (const [cwd, items] of [...projects.entries()].sort(([a], [b]) => a.localeCompare(b))) {
  projectIndex.push(`## ${cwd}`, '', `Tarefas relacionadas: ${items.length}`, '');
  for (const item of items) {
    projectIndex.push(`- ${item.title || item.id} (\`${item.id}\`)`);
  }
  projectIndex.push('');
}
writeFileSync(join(outputDir, 'INDICE_DE_PROJETOS.md'), projectIndex.join('\n'), 'utf8');

for (const db of [state, memories, goals, logs]) db.close();

console.log(JSON.stringify({
  threads: threads.length,
  memories: memoryRows.length,
  archived: threads.filter((item) => item.archived).length,
  incidentLogs: incidentLogs.length,
  outputDir,
}));
