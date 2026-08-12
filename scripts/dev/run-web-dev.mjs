import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawn } from 'node:child_process';
import { createConnection } from 'node:net';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..', '..');
const webRoot = join(repoRoot, 'apps', 'web');
const localEnvPath = join(webRoot, '.env.local');
const developmentLocalEnvPath = join(webRoot, '.env.development.local');
const envPath = join(webRoot, '.env');
const developmentEnvPath = join(webRoot, '.env.development');
const requiredKeys = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
const webPort = 4173;
const webHost = '127.0.0.1';
const markerPath = join(tmpdir(), 'gso-old-access-control-web-4173.json');

function readListeningPid() {
  if (process.platform !== 'win32') return null;

  try {
    const output = execFileSync('netstat.exe', ['-ano', '-p', 'tcp'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    for (const line of output.split(/\r?\n/)) {
      const columns = line.trim().split(/\s+/);
      if (columns.length < 5 || columns[0] !== 'TCP' || columns[3] !== 'LISTENING') continue;
      const localAddress = columns[1] ?? '';
      if (!localAddress.endsWith(`:${webPort}`)) continue;
      const pid = Number(columns[4]);
      if (Number.isInteger(pid) && pid > 0) return pid;
    }
  } catch {
    return null;
  }

  return null;
}

function readMarker() {
  if (!existsSync(markerPath)) return null;
  try {
    return JSON.parse(readFileSync(markerPath, 'utf8'));
  } catch {
    return null;
  }
}

function describeProcess(pid) {
  if (!pid || process.platform !== 'win32') return `PID ${pid ?? 'desconhecido'}`;
  try {
    const command = `$p=Get-CimInstance Win32_Process -Filter 'ProcessId = ${pid}'; if ($p) { [pscustomobject]@{Name=$p.Name;CommandLine=$p.CommandLine} | ConvertTo-Json -Compress }`;
    const raw = execFileSync('powershell.exe', ['-NoProfile', '-Command', command], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    if (!raw) return `PID ${pid}`;
    const info = JSON.parse(raw);
    return `${info.Name ?? 'processo'} (${info.CommandLine ?? 'linha de comando indisponível'})`;
  } catch {
    return `PID ${pid}`;
  }
}

function isPortOccupied() {
  return new Promise((resolve) => {
    const socket = createConnection({ host: webHost, port: webPort });
    socket.once('connect', () => { socket.destroy(); resolve(true); });
    socket.once('error', () => resolve(false));
  });
}

function stopOwnedServer(marker) {
  if (process.platform === 'win32') {
    execFileSync('taskkill.exe', ['/pid', String(marker.managerPid), '/t', '/f'], { stdio: 'ignore' });
    return;
  }
  process.kill(Number(marker.managerPid), 'SIGTERM');
}

async function ensureWebPort() {
  if (!(await isPortOccupied())) return;

  const ownerPid = readListeningPid();
  const marker = readMarker();
  const ownsPort = marker
    && marker.repoRoot === repoRoot
    && Number(marker.ownerPid) === ownerPid
    && Number.isInteger(Number(marker.managerPid));

  if (!ownsPort) {
    throw new Error([
      `[web:dev] A porta ${webPort} ja esta em uso por um servico nao identificado como deste projeto.`,
      `[web:dev] Processo: ${describeProcess(ownerPid)}.`,
      `[web:dev] Nenhuma porta alternativa sera usada. Encerre o servico manualmente ou libere ${webPort} e tente novamente.`,
    ].join('\n'));
  }

  console.warn(`[web:dev] Reiniciando a instancia deste projeto na porta ${webPort} (PID ${ownerPid}).`);
  stopOwnedServer(marker);
  const deadline = Date.now() + 10_000;
  while (await isPortOccupied()) {
    if (Date.now() >= deadline) throw new Error(`[web:dev] A instancia anterior nao liberou a porta ${webPort}.`);
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
}

function parseEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return {};
  }

  const contents = readFileSync(filePath, 'utf8');
  const result = {};

  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    result[key] = value;
  }

  return result;
}

function readMergedPublicEnv() {
  const sources = [
    envPath,
    developmentEnvPath,
    localEnvPath,
    developmentLocalEnvPath,
  ];

  const merged = {};

  for (const source of sources) {
    Object.assign(merged, parseEnvFile(source));
  }

  for (const key of requiredKeys) {
    const shellValue = process.env[key]?.trim();
    if (shellValue) {
      merged[key] = shellValue;
    }
  }

  return merged;
}

function failMissingEnv(missingKeys) {
  console.error(
    [
      '[web:dev] Frontend Vite sem configuração pública mínima.',
      `[web:dev] Variáveis ausentes: ${missingKeys.join(', ')}`,
      `[web:dev] Crie ${localEnvPath} com VITE_APP_ENV, VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY antes de subir o frontend.`,
    ].join('\n'),
  );
  process.exit(1);
}

const mergedEnv = readMergedPublicEnv();
const missingKeys = requiredKeys.filter((key) => !mergedEnv[key]?.trim());

if (missingKeys.length > 0) {
  failMissingEnv(missingKeys);
}

const extraArgs = process.argv.slice(2);
const requestedPortIndex = extraArgs.findIndex((argument) => argument === '--port');
const requestedPort = requestedPortIndex >= 0 ? Number(extraArgs[requestedPortIndex + 1]) : webPort;
if (requestedPort !== webPort) {
  throw new Error(`[web:dev] Este projeto usa exclusivamente a porta ${webPort}; porta solicitada: ${requestedPort || 'invalida'}.`);
}

await ensureWebPort();

const child =
  process.platform === 'win32'
    ? spawn(
        process.env.ComSpec ?? 'cmd.exe',
        ['/d', '/s', '/c', `npm run dev${extraArgs.length > 0 ? ` -- ${extraArgs.join(' ')}` : ''}`],
        {
          cwd: webRoot,
          stdio: 'inherit',
          env: process.env,
        },
      )
    : spawn('npm', ['run', 'dev', ...(extraArgs.length > 0 ? ['--', ...extraArgs] : [])], {
        cwd: webRoot,
        stdio: 'inherit',
        env: process.env,
      });

const marker = {
  repoRoot,
  managerPid: process.pid,
  ownerPid: null,
  port: webPort,
  startedAt: new Date().toISOString(),
};

const markerTimer = setInterval(() => {
  const ownerPid = readListeningPid();
  if (!ownerPid) return;
  marker.ownerPid = ownerPid;
  try {
    writeFileSync(markerPath, JSON.stringify(marker), 'utf8');
  } catch {
    // O marcador e apenas uma protecao operacional; o servidor continua sem ele.
  }
}, 250);
markerTimer.unref();

function clearMarker() {
  clearInterval(markerTimer);
  const current = readMarker();
  if (current?.managerPid === process.pid) {
    try {
      unlinkSync(markerPath);
    } catch {
      // O arquivo temporario pode ja ter sido removido por outro encerramento.
    }
  }
}

process.once('exit', clearMarker);
process.once('SIGINT', () => { clearMarker(); child.kill(); });
process.once('SIGTERM', () => { clearMarker(); child.kill(); });

child.on('exit', (code, signal) => {
  clearMarker();
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
