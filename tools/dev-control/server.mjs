import { createServer } from 'node:http';
import { execFileSync } from 'node:child_process';
import { readdir, readFile, stat } from 'node:fs/promises';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const CONTROL_PLANE_HOST = '127.0.0.1';
export const CONTROL_PLANE_PORT = 4178;

const SERVER_DIR = dirname(fileURLToPath(import.meta.url));
export const REPOSITORY_ROOT = resolve(SERVER_DIR, '../..');
const PUBLIC_ROOT = resolve(SERVER_DIR, 'public');
const HANDOFFS_ROOT = join(REPOSITORY_ROOT, 'handoffs');
const CURRENT_HANDOFF_ROOT = join(HANDOFFS_ROOT, 'current');
const ARCHIVE_ROOT = join(HANDOFFS_ROOT, 'archive');

const CURRENT_FILES = ['TASK.md', 'IMPLEMENTATION.md', 'REVIEW.md', 'STATUS.md'];

function runGit(args) {
  try {
    return execFileSync('git', args, {
      cwd: REPOSITORY_ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch {
    return null;
  }
}

function cleanCell(value) {
  return value.trim().replace(/^`|`$/g, '');
}

function splitMarkdownRow(line) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map(cleanCell);
}

export function parseQueueMarkdown(markdown) {
  const lines = markdown.split(/\r?\n/);
  const headerIndex = lines.findIndex((line) => line.includes('| Task ID |') && line.includes('| Approval |'));

  if (headerIndex < 0) {
    throw new Error('A fila canônica não possui a tabela estruturada esperada.');
  }

  const headers = splitMarkdownRow(lines[headerIndex]);
  const entries = [];

  for (const line of lines.slice(headerIndex + 2)) {
    if (!line.trim().startsWith('|')) {
      break;
    }

    const cells = splitMarkdownRow(line);
    if (cells.length !== headers.length || !/^\d+$/.test(cells[0])) {
      continue;
    }

    entries.push(Object.fromEntries(headers.map((header, index) => [
      header.toLowerCase().replaceAll(' ', '_'),
      cells[index] ?? '',
    ])));
  }

  return entries;
}

function parseFields(markdown, fields) {
  const lines = markdown.split(/\r?\n/);

  const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  return Object.fromEntries(fields.map((field) => {
    const inline = markdown.match(new RegExp(`^\\s*(?:[-*]\\s+)?${escapeRegExp(field)}:\\s*(.+)$`, 'mi'))?.[1]
      ?.trim()
      .replace(/^`|`$/g, '');
    if (inline) {
      return [field.toLowerCase().replaceAll(' ', '_'), inline];
    }

    const headingIndex = lines.findIndex((line) => line.trim() === `## ${field}`);
    const headingValue = headingIndex >= 0
      ? lines.slice(headingIndex + 1).find((line) => line.trim())?.trim()
      : undefined;

    return [field.toLowerCase().replaceAll(' ', '_'), headingValue ?? 'UNRESOLVED'];
  }));
}

export function parseReview(markdown) {
  const result = markdown.match(/^\s*(?:[-*]\s+)?(?:Veredito|Verdict|Result)?\s*:?\s*`?(APPROVED|CHANGES_REQUESTED|REQUEST_CHANGES|BLOCKED)\b`?/im)?.[1] ?? 'PENDING';
  const findingHeadings = [...markdown.matchAll(/^###\s+([^\n]+)$/gm)].map((match) => match[1].trim());
  const openFindings = findingHeadings.filter((heading) => !/RESOLVED|CLOSED/i.test(heading));
  const resolvedFindings = findingHeadings.filter((heading) => /RESOLVED|CLOSED/i.test(heading));

  return {
    result,
    findingCount: findingHeadings.length,
    openFindings,
    resolvedFindings,
  };
}

function parseImplementationResults(markdown) {
  const results = [];
  let inResults = false;

  for (const line of markdown.split(/\r?\n/)) {
    if (/^##+\s+Resultados/i.test(line)) {
      inResults = true;
      continue;
    }

    if (inResults && /^##+\s+/.test(line)) {
      break;
    }

    if (inResults && /^-\s+/.test(line)) {
      results.push(line.replace(/^-\s+/, '').trim());
    }
  }

  return results;
}

async function readText(path) {
  try {
    return await readFile(path, 'utf8');
  } catch {
    return '';
  }
}

async function readCurrentHandoff() {
  const documents = Object.fromEntries(await Promise.all(
    CURRENT_FILES.map(async (file) => [file.replace('.md', '').toLowerCase(), await readText(join(CURRENT_HANDOFF_ROOT, file))]),
  ));
  const parsedStatus = parseFields(documents.status, [
    'Task',
    'State',
    'Owner',
    'Role',
    'Reviewer active',
    'Review mode',
    'Coordinator',
    'Agent coordination',
    'Approval',
    'Base SHA',
    'Current SHA',
    'Last reviewer',
    'Last review',
    'Updated at',
  ]);
  const statusFields = [
    'task',
    'state',
    'owner',
    'role',
    'reviewer_active',
    'review_mode',
    'coordinator',
    'agent_coordination',
    'approval',
    'base_sha',
    'current_sha',
    'last_reviewer',
    'last_review',
    'updated_at',
  ];
  const status = Object.fromEntries(statusFields.map((field) => [field, parsedStatus[field] ?? 'UNRESOLVED']));
  const task = parseFields(documents.task, ['Task ID', 'Project', 'Título', 'Priority', 'Approval', 'Dependencies', 'Origin']);
  const review = parseReview(documents.review);

  return {
    status,
    task,
    review,
    gates: {
      source: 'handoffs/current/IMPLEMENTATION.md — declarado pelo Codex',
      results: parseImplementationResults(documents.implementation),
    },
    decisions: findDecisions(documents),
  };
}

async function readArchiveCards() {
  let names = [];

  try {
    names = await readdir(ARCHIVE_ROOT);
  } catch {
    return [];
  }

  const cards = [];
  for (const name of names) {
    const directory = join(ARCHIVE_ROOT, name);
    try {
      if (!(await stat(directory)).isDirectory()) continue;
    } catch {
      continue;
    }

    const task = await readText(join(directory, 'TASK.md'));
    const status = await readText(join(directory, 'STATUS.md'));
    const review = await readText(join(directory, 'REVIEW.md'));
    const taskFields = parseFields(task, ['Task ID', 'Project', 'Título', 'Priority', 'Approval', 'Dependencies', 'Origin']);
    const statusFields = parseFields(status, ['Task', 'State', 'Owner', 'Base SHA', 'Current SHA', 'Last review']);
    const reviewFields = parseReview(review);

    cards.push({
      id: taskFields.task_id !== 'UNRESOLVED' ? taskFields.task_id : name,
      ...taskFields,
      ...statusFields,
      review: reviewFields,
      archive: name,
    });
  }

  return cards.sort((left, right) => left.id.localeCompare(right.id));
}

function normalizeTimelineDate(value) {
  const match = String(value ?? '').match(/\b(\d{4}-\d{2}-\d{2})(?:T([^\s—]+))?/);
  if (!match) return null;

  return match[2]
    ? `${match[1]}T${match[2]}`
    : `${match[1]}T00:00:00.000Z`;
}

export function buildActivityTimeline(commits, archives, current) {
  const events = commits.map((commit) => ({
    kind: 'commit',
    source: 'Git',
    subject: commit.subject,
    sha: commit.sha,
    date: commit.date,
    sortDate: normalizeTimelineDate(commit.date),
  }));

  for (const archive of archives) {
    if (archive.last_review) {
      events.push({
        kind: 'review',
        source: 'Review arquivado',
        subject: `${archive.id}: ${archive.review?.result || 'PENDING'}`,
        sha: archive.current_sha || '—',
        date: archive.last_review,
        sortDate: normalizeTimelineDate(archive.last_review),
      });
    }

    if (archive.state) {
      events.push({
        kind: 'archive',
        source: 'Handoff arquivado',
        subject: `${archive.id}: ${archive.state}`,
        sha: archive.current_sha || '—',
        date: archive.last_review || 'data indisponível',
        sortDate: normalizeTimelineDate(archive.last_review),
      });
    }
  }

  const status = current?.status;
  if (status?.updated_at && status.task && status.state) {
    events.push({
      kind: 'handoff',
      source: 'Handoff corrente',
      subject: `${status.task}: ${status.state}`,
      sha: status.current_sha || '—',
      date: status.updated_at,
      sortDate: normalizeTimelineDate(status.updated_at),
    });
  }

  if (status?.last_review && status.task) {
    events.push({
      kind: 'review',
      source: 'Review corrente',
      subject: `${status.task}: ${current.review?.result || 'PENDING'}`,
      sha: status.current_sha || '—',
      date: status.last_review,
      sortDate: normalizeTimelineDate(status.last_review),
    });
  }

  return events
    .sort((left, right) => String(right.sortDate ?? '').localeCompare(String(left.sortDate ?? '')))
    .map(({ sortDate, ...event }) => event);
}

function buildTaskDetails(queue, current, archives) {
  const currentTaskId = current.status.task;

  return queue.map((item) => {
    const isCurrent = item.task_id === currentTaskId;
    const archive = archives.find((candidate) => candidate.id === item.task_id);

    if (isCurrent) {
      return {
        ...item,
        isCurrent: true,
        observedState: current.status.state,
        owner: current.status.owner,
        role: current.status.role,
        reviewer: current.status.reviewer_active,
        review: current.review,
        gates: current.gates,
        evidence: current.status.updated_at !== 'UNRESOLVED' ? current.status.updated_at : null,
        source: 'handoffs/current/',
      };
    }

    if (archive) {
      return {
        ...item,
        isCurrent: false,
        observedState: archive.state || null,
        owner: archive.owner || null,
        role: null,
        reviewer: null,
        review: archive.review,
        gates: null,
        evidence: archive.last_review || null,
        source: `handoffs/archive/${archive.archive}/`,
      };
    }

    return {
      ...item,
      isCurrent: false,
      observedState: null,
      owner: null,
      role: null,
      reviewer: null,
      review: null,
      gates: null,
      evidence: null,
      source: 'handoffs/README.md',
    };
  });
}

function buildAgentSnapshot(current) {
  const status = current?.status ?? {};
  const observedAt = status.updated_at !== 'UNRESOLVED' ? status.updated_at : null;
  const owner = status.owner;
  const state = status.state;
  const reviewer = status.reviewer_active;
  const coordination = status.agent_coordination;
  const reviewState = ['READY_FOR_REVIEW', 'REVIEWING'].includes(state);

  const makeAgent = (name, role, evidence, observed) => ({
    name,
    role,
    state: observed ? 'RESPONSÁVEL OBSERVADO' : 'AGUARDANDO TRANSFERÊNCIA',
    observed,
    evidence,
    observedAt,
    heartbeat: observedAt ? 'timestamp do handoff corrente' : 'sem timestamp observável',
  });

  return [
    makeAgent(
      'Forge',
      'EXECUTOR',
      'Owner do STATUS.md',
      owner === 'Forge' && !reviewState,
    ),
    makeAgent(
      'Sentinel',
      'REVIEWER',
      'Reviewer active e Owner do STATUS.md',
      reviewer === 'Sentinel' && (owner === 'Sentinel' || reviewState),
    ),
    makeAgent(
      'Codex',
      'COORDENADOR',
      'Coordinator do STATUS.md',
      status.coordinator === 'Codex',
    ),
  ].map((agent) => ({
    ...agent,
    coordination,
    task: status.task,
    currentState: state,
  }));
}

export function readGitSnapshot() {
  const gitAvailable = runGit(['--version']) !== null;
  const status = runGit(['status', '--short']);
  const log = runGit(['log', '-12', '--date=iso-strict', '--format=%h|%ad|%s']);
  const branch = runGit(['branch', '--show-current']);
  const head = runGit(['rev-parse', 'HEAD']);

  return {
    available: gitAvailable,
    branch: gitAvailable ? branch : null,
    head: gitAvailable ? head : null,
    status,
    dirtyCount: status === null ? null : status.split(/\r?\n/).filter(Boolean).length,
    commits: log
      ? log.split(/\r?\n/).filter(Boolean).map((line) => {
        const [sha, date, ...subject] = line.split('|');
        return { sha, date, subject: subject.join('|') };
      })
      : [],
  };
}

function findDecisions(documents) {
  const sources = [documents.status, documents.task, documents.implementation, documents.review];
  const decisions = [];

  for (const source of sources) {
    let inCodeFence = false;
    for (const line of source.split(/\r?\n/)) {
      if (/^\s*```/.test(line)) {
        inCodeFence = !inCodeFence;
        continue;
      }

      const structured = line.match(/^\s*(?:[-*]\s+)?(OWNER_DECISION_REQUIRED|BLOCKED|UNRESOLVED\s+—\s+requires\s+project\s+owner\s+decision)\b.*$/i);
      const blockedState = source === documents.status
        ? line.match(/^\s*State:\s+BLOCKED\b.*$/i)
        : null;
      if (!inCodeFence && (structured || blockedState)) {
        decisions.push((structured?.[0] ?? blockedState[0]).replace(/^\s*[-*]\s+/, '').trim());
      }
    }
  }

  return [...new Set(decisions)];
}

export async function readSnapshot() {
  const readme = await readText(join(HANDOFFS_ROOT, 'README.md'));
  const current = await readCurrentHandoff();
  const git = readGitSnapshot();
  const queue = parseQueueMarkdown(readme);
  const archives = await readArchiveCards();

  return {
    generatedAt: new Date().toISOString(),
    project: {
      name: 'ConfiOne',
      root: REPOSITORY_ROOT,
      branch: git.branch,
        head: git.head,
        dirtyCount: git.dirtyCount,
        gitAvailable: git.available,
    },
    current,
    queue,
    archives,
    decisions: current.decisions,
    taskDetails: buildTaskDetails(queue, current, archives),
    activity: buildActivityTimeline(git.commits, archives, current),
    agents: buildAgentSnapshot(current),
    source: {
      queue: 'handoffs/README.md',
      current: 'handoffs/current/',
      archive: 'handoffs/archive/',
      review: '.review/',
      gates: 'handoffs/current/IMPLEMENTATION.md (declaração do Codex)',
      git: 'local repository',
    },
  };
}

function contentType(path) {
  return {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.svg': 'image/svg+xml',
  }[extname(path)] ?? 'application/octet-stream';
}

async function serveStatic(response, pathname) {
  const relativePath = pathname === '/' ? 'index.html' : pathname.slice(1);
  const target = resolve(PUBLIC_ROOT, relativePath);
  const relativeTarget = relative(PUBLIC_ROOT, target);

  if (relativeTarget.startsWith('..') || relativeTarget.includes(`..${sep}`)) {
    response.writeHead(403, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Forbidden');
    return;
  }

  try {
    const body = await readFile(target);
    response.writeHead(200, {
      'content-type': contentType(target),
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    });
    response.end(body);
  } catch {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Not found');
  }
}

export function createControlPlaneServer() {
  return createServer(async (request, response) => {
    response.setHeader('x-content-type-options', 'nosniff');
    response.setHeader('cache-control', 'no-store');

    if (request.method !== 'GET') {
      response.writeHead(405, { 'content-type': 'application/json; charset=utf-8', allow: 'GET' });
      response.end(JSON.stringify({ error: 'read-only endpoint' }));
      return;
    }

    const url = new URL(request.url ?? '/', `http://${CONTROL_PLANE_HOST}:${CONTROL_PLANE_PORT}`);
    if (url.pathname === '/api/snapshot') {
      try {
        const snapshot = await readSnapshot();
        response.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
        response.end(JSON.stringify(snapshot));
      } catch (error) {
        response.writeHead(500, { 'content-type': 'application/json; charset=utf-8' });
        response.end(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }));
      }
      return;
    }

    await serveStatic(response, url.pathname);
  });
}

export function startControlPlane() {
  const server = createControlPlaneServer();
  server.once('error', (error) => {
    if (error?.code === 'EADDRINUSE') {
      console.error(`Development Control Plane não iniciou: a porta ${CONTROL_PLANE_PORT} já está ocupada.`);
    } else {
      console.error(`Development Control Plane não iniciou: ${error instanceof Error ? error.message : String(error)}`);
    }
    process.exit(1);
  });
  server.listen(CONTROL_PLANE_PORT, CONTROL_PLANE_HOST, () => {
    console.log(`Development Control Plane: http://${CONTROL_PLANE_HOST}:${CONTROL_PLANE_PORT}`);
  });
  return server;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  startControlPlane();
}
