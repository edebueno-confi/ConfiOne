import { appendFileSync, mkdirSync } from 'node:fs';
import { execFileSync, spawn } from 'node:child_process';
import { join } from 'node:path';

import { assertLocalSupabaseEnvironment, loadQaEnv, readLocalSupabaseStatus } from './assert-local-supabase.mjs';

const root = process.cwd();
const webRoot = join(root, 'apps', 'web');
const logDir = join(root, 'output', 'local-qa');
const baseUrl = process.env.LOCAL_QA_SUPPORT_WRITE_WEB_URL ?? 'http://127.0.0.1:4175';
const port = Number(new URL(baseUrl).port || 4175);
const previewScript = join(root, 'supabase', 'qa', 'local-release-preview.mjs');
const writeScript = join(root, 'scripts', 'local-qa', 'ui-writes.mjs');

if (port !== 4175) throw new Error('LOCAL_QA_SUPPORT_WRITE_WEB_PORT_MUST_BE_4175');

const qa = loadQaEnv();
const status = readLocalSupabaseStatus({ ...process.env, ...qa });
assertLocalSupabaseEnvironment({ ...process.env, ...qa }, { status });
mkdirSync(logDir, { recursive: true });

const serverLog = join(logDir, 'support-operational-write-web-server.log');
const writeLog = join(logDir, 'support-operational-write-smoke.log');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const server = spawn(npmCommand, ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port)], {
  cwd: webRoot,
  env: { ...process.env, VITE_RELEASE_SURFACE: 'full' },
  stdio: ['ignore', 'pipe', 'pipe'],
  windowsHide: true,
  shell: process.platform === 'win32',
});
server.stdout.on('data', (chunk) => appendFileSync(serverLog, chunk));
server.stderr.on('data', (chunk) => appendFileSync(serverLog, chunk));

async function waitForWebServer() {
  const deadline = Date.now() + 45_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/login`);
      if (response.ok) return;
    } catch {
      // Vite ainda pode estar inicializando.
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error('LOCAL_QA_SUPPORT_WRITE_WEB_HEALTHCHECK_FAILED');
}

async function stopServer() {
  if (server.exitCode !== null) return;
  if (process.platform === 'win32') {
    spawn('taskkill.exe', ['/pid', String(server.pid), '/t', '/f'], { windowsHide: true, stdio: 'ignore' });
  } else {
    server.kill('SIGTERM');
  }
  await new Promise((resolve) => setTimeout(resolve, 500));
}

let previewEnabled = false;
let writeResult = '';
let writeError = null;
try {
  execFileSync(process.execPath, [previewScript, '--enable', '--screens=support_queue,support_tickets'], { cwd: root, stdio: 'inherit' });
  previewEnabled = true;
  await waitForWebServer();

  const writeProcess = spawn(process.execPath, [writeScript], {
    cwd: root,
    env: { ...process.env, LOCAL_QA_WEB_URL: baseUrl },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });
  writeProcess.stdout.on('data', (chunk) => {
    const text = String(chunk);
    writeResult += text;
    appendFileSync(writeLog, text);
  });
  writeProcess.stderr.on('data', (chunk) => appendFileSync(writeLog, chunk));
  const exitCode = await new Promise((resolve) => writeProcess.once('exit', resolve));
  if (exitCode !== 0) writeError = `LOCAL_QA_UI_WRITES_FAILED_EXIT_${exitCode}`;
} catch (error) {
  writeError = error instanceof Error ? error.message : String(error);
} finally {
  await stopServer();
  if (previewEnabled) {
    execFileSync(process.execPath, [previewScript, '--disable'], { cwd: root, stdio: 'inherit' });
  }
}

if (writeError) throw new Error(writeError);

console.log(JSON.stringify({
  environment: 'local',
  releaseSurface: 'full',
  writesViaExistingUiHarness: true,
  output: writeLog,
  result: writeResult.trim(),
}));
