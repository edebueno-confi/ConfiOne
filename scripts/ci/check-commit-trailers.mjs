import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const DEFAULT_POLICY = '.github/commit-trailer-policy.json';

function git(args, options = {}) {
  try {
    return execFileSync('git', args, {
      cwd: options.cwd ?? process.cwd(),
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      input: options.input,
    }).trimEnd();
  } catch (error) {
    const detail = error.stderr?.toString().trim() || error.message;
    throw new Error(`git ${args.join(' ')} falhou: ${detail}`);
  }
}

function normalize(value) {
  return String(value ?? '').trim().toLowerCase();
}

function compact(value) {
  return normalize(value).replace(/[^a-z0-9]+/g, '');
}

function parseArgs(argv) {
  const args = { policy: DEFAULT_POLICY };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--base' || value === '--head' || value === '--policy') {
      const next = argv[index + 1];
      if (!next || next.startsWith('--')) throw new Error(`${value} exige um valor.`);
      args[value.slice(2)] = next;
      index += 1;
    } else if (value === '--help' || value === '-h') {
      args.help = true;
    } else {
      throw new Error(`Argumento desconhecido: ${value}`);
    }
  }
  return args;
}

function resolveRange(args, cwd = process.cwd()) {
  let base = args.base ?? process.env.GITHUB_BASE_SHA;
  let head = args.head ?? process.env.GITHUB_HEAD_SHA;

  if ((base && !head) || (!base && head)) {
    throw new Error('base e head devem ser informados juntos.');
  }

  if (!base && !head) {
    base = 'origin/main';
    head = 'HEAD';
  }

  if (/^0+$/.test(base)) {
    base = git(['rev-parse', `${head}^`], { cwd });
  }

  const mergeBase = git(['merge-base', base, head], { cwd });
  const commits = git(['rev-list', '--reverse', `${mergeBase}..${head}`], { cwd })
    .split(/\r?\n/)
    .filter(Boolean);

  return { base, head, mergeBase, commits };
}

function loadPolicy(policyPath, cwd = process.cwd()) {
  const absolutePath = resolve(cwd, policyPath);
  if (!existsSync(absolutePath)) throw new Error(`Política não encontrada: ${policyPath}`);
  const policy = JSON.parse(readFileSync(absolutePath, 'utf8'));
  return {
    allowedCoAuthors: Array.isArray(policy.allowedCoAuthors) ? policy.allowedCoAuthors : [],
    blockedEmails: Array.isArray(policy.blockedEmails) ? policy.blockedEmails.map(normalize) : [],
    blockedUsernames: Array.isArray(policy.blockedUsernames) ? policy.blockedUsernames.map(normalize) : [],
  };
}

function parseCoAuthorTrailerLines(message) {
  const parsed = git(['interpret-trailers', '--parse'], { input: message });
  return parsed
    .split(/\r?\n/)
    .filter((line) => /^co-authored-by\s*:/i.test(line))
    .map((line) => {
      const match = line.match(/^co-authored-by\s*:\s*(.*)$/i);
      const value = match?.[1]?.trim() ?? '';
      const identity = value.match(/^(.*?)\s*<([^<>\s]+)>\s*$/);
      return {
        raw: line.trim(),
        name: identity?.[1]?.trim() ?? value,
        email: identity?.[2]?.trim() ?? '',
        malformed: !identity,
      };
    });
}

function isAllowed(identity, allowedCoAuthors) {
  return allowedCoAuthors.some((entry) => {
    const value = typeof entry === 'string' ? { email: entry, username: entry, name: entry } : entry ?? {};
    return [value.email, value.username, value.name].some((candidate) => (
      normalize(candidate) === normalize(identity.email)
      || normalize(candidate) === normalize(identity.name)
      || compact(candidate) === compact(identity.name)
    ));
  });
}

function evaluateCommit(commitSha, policy, cwd = process.cwd()) {
  const message = git(['show', '-s', '--format=%B', commitSha], { cwd });
  const violations = [];
  for (const identity of parseCoAuthorTrailerLines(message)) {
    const email = normalize(identity.email);
    const username = compact(identity.name);
    if (identity.malformed) {
      violations.push({ ...identity, reason: 'trailer malformado' });
    } else if (policy.blockedEmails.includes(email)) {
      violations.push({ ...identity, reason: 'e-mail bloqueado' });
    } else if (policy.blockedUsernames.some((blocked) => compact(blocked) === username || normalize(blocked) === normalize(identity.name))) {
      violations.push({ ...identity, reason: 'usuário bloqueado' });
    } else if (!isAllowed(identity, policy.allowedCoAuthors)) {
      violations.push({ ...identity, reason: 'coautor não autorizado' });
    }
  }
  return violations;
}

function checkCommitRange({ base, head, policyPath = DEFAULT_POLICY, cwd = process.cwd() }) {
  const range = resolveRange({ base, head }, cwd);
  const policy = loadPolicy(policyPath, cwd);
  const violations = range.commits.flatMap((sha) => evaluateCommit(sha, policy, cwd).map((violation) => ({ sha, ...violation })));
  return { ...range, violations };
}

function printHelp() {
  console.log('Uso: node scripts/ci/check-commit-trailers.mjs [--base SHA] [--head SHA] [--policy CAMINHO]');
}

export { checkCommitRange, evaluateCommit, loadPolicy, parseArgs, resolveRange };

if (fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  try {
    const args = parseArgs(process.argv.slice(2));
    if (args.help) {
      printHelp();
      process.exit(0);
    }
    const result = checkCommitRange({ base: args.base, head: args.head, policyPath: args.policy });
    console.log(`Base usada: ${result.base}`);
    console.log(`Merge-base: ${result.mergeBase}`);
    console.log(`Head usado: ${result.head}`);
    console.log(`Commits analisados: ${result.commits.length}`);
    if (result.violations.length > 0) {
      console.log('Violação de política de trailers:');
      for (const violation of result.violations) {
        console.log(`- ${violation.sha}: ${violation.raw} (${violation.reason})`);
      }
      process.exit(1);
    }
    console.log('Nenhum trailer de coautoria não autorizado encontrado.');
  } catch (error) {
    console.error(`Erro: ${error.message}`);
    process.exit(2);
  }
}
