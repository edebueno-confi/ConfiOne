import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const DEFAULT_ROOT = 'raw_knowledge/octadesk_export/latest';
const LOCAL_URL = 'http://127.0.0.1:54321';
const LOCAL_ANON_KEY = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';

function parseArgs(argv) {
  const args = {
    root: DEFAULT_ROOT,
    local: false,
    apply: false,
    spaceSlug: null,
    title: null,
    allowlist: null,
    email: process.env.KNOWLEDGE_ADMIN_EMAIL ?? 'ede.oliveira@confi.com.vc',
    password: process.env.KNOWLEDGE_ADMIN_PASSWORD ?? 'Admin123!',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--local') args.local = true;
    else if (arg === '--apply') args.apply = true;
    else if (arg === '--root') args.root = argv[++index];
    else if (arg === '--space-slug') args.spaceSlug = argv[++index];
    else if (arg === '--title') args.title = argv[++index];
    else if (arg === '--allowlist') args.allowlist = argv[++index];
    else if (arg === '--email') args.email = argv[++index];
    else if (arg === '--password') args.password = argv[++index];
    else throw new Error(`Unknown argument: ${arg}`);
  }

  if (!args.local) {
    throw new Error('Only --local is supported for this controlled reprocess script.');
  }
  if (!args.spaceSlug) {
    throw new Error('--space-slug is required.');
  }
  if (!args.title && !args.allowlist) {
    throw new Error('Use --title or --allowlist to select explicit articles.');
  }

  return args;
}

function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFC')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugify(value) {
  return normalizeText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

function detectPngDimensions(buffer) {
  if (
    buffer.length >= 24 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return {
      mime: 'image/png',
      width: buffer.readUInt32BE(16),
      height: buffer.readUInt32BE(20),
    };
  }

  return { mime: 'application/octet-stream', width: null, height: null };
}

function stripTags(value) {
  return value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function normalizeLocalSrc(src) {
  return src
    .replace(/\\/g, '/')
    .replace(/^(\.\.\/)+/, '')
    .replace(/^assets\//, '');
}

function buildMarkdownFromHtml(html, assetBySrc, articleTitle) {
  let source = html;

  source = source.replace(/<img\b([^>]*?)>/gi, (_match, attrs) => {
    const src = /src="([^"]+)"/i.exec(attrs)?.[1] ?? '';
    const normalizedSrc = normalizeLocalSrc(src);
    const asset = assetBySrc.get(normalizedSrc);
    const alt = asset?.altText ?? `Imagem do artigo ${articleTitle}`;
    return asset
      ? `\n\n![${alt}](knowledge-asset:${asset.id})\n\n`
      : `\n\n> Imagem legado indisponivel para revisao: ${src}\n\n`;
  });

  source = source
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, (_m, text) => `\n\n# ${stripTags(text)}\n\n`)
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (_m, text) => `\n\n## ${stripTags(text)}\n\n`)
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, (_m, text) => `\n\n### ${stripTags(text)}\n\n`)
    .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**')
    .replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*')
    .replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, '*$1*')
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_m, text) => `\n- ${stripTags(text)}`)
    .replace(/<\/ul>|<\/ol>/gi, '\n\n')
    .replace(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_m, href, text) => {
      if (!/^https?:\/\//i.test(href) && !/^mailto:/i.test(href)) {
        return stripTags(text);
      }
      return `[${stripTags(text)}](${href})`;
    });

  const markdown = stripTags(source)
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return markdown.startsWith('# ') ? markdown : `# ${articleTitle}\n\n${markdown}`;
}

async function readAllowlist(filePath) {
  const raw = JSON.parse(await fs.readFile(filePath, 'utf8'));
  const items = Array.isArray(raw) ? raw : raw.articles ?? raw.items ?? [];
  return new Set(items.map((item) => normalizeText(item.title ?? item.articleTitle ?? item)));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const root = path.resolve(args.root);
  const index = JSON.parse(await fs.readFile(path.join(root, 'articles-index.json'), 'utf8'));
  const allowedTitles = args.allowlist ? await readAllowlist(args.allowlist) : null;
  const selected = index.filter((article) => {
    const title = normalizeText(article.title);
    return args.title ? title === normalizeText(args.title) : allowedTitles.has(title);
  });

  if (selected.length === 0) {
    throw new Error('No Octadesk articles matched the explicit selection.');
  }

  const supabase = createClient(LOCAL_URL, LOCAL_ANON_KEY);
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: args.email,
    password: args.password,
  });
  if (authError) throw authError;

  const { data: space, error: spaceError } = await supabase
    .from('vw_admin_knowledge_spaces')
    .select('*')
    .eq('slug', args.spaceSlug)
    .single();
  if (spaceError) throw spaceError;

  const results = [];

  for (const articleIndex of selected) {
    const articlePath = path.join(root, articleIndex.articleDirRelative);
    const article = JSON.parse(await fs.readFile(path.join(articlePath, 'article.json'), 'utf8'));
    const localHtml = await fs.readFile(path.join(articlePath, 'content.local.html'), 'utf8');
    const sourcePath = `${args.root.replace(/\\/g, '/')}/${articleIndex.articleDirRelative}`;

    const { data: runtimeArticle, error: articleError } = await supabase
      .from('vw_admin_knowledge_article_detail_v2')
      .select('*')
      .eq('knowledge_space_id', space.id)
      .eq('source_path', sourcePath)
      .maybeSingle();
    if (articleError) throw articleError;
    if (!runtimeArticle) {
      throw new Error(`Runtime article not found for ${sourcePath}`);
    }

    const assetBySrc = new Map();
    const upsertedAssets = [];

    for (const asset of article.assets ?? []) {
      const relativeAssetPath = String(asset.localPath ?? '').replace(/\\/g, '/');
      const absoluteAssetPath = path.join(root, relativeAssetPath);
      const buffer = await fs.readFile(absoluteAssetPath);
      const fileHash = sha256(buffer);
      const detected = detectPngDimensions(buffer);
      const storageObjectPath = `octadesk/${runtimeArticle.id}/${fileHash}.png`;
      const altText = `Imagem do artigo ${runtimeArticle.title}`;

      if (args.apply) {
        const upload = await supabase.storage
          .from('knowledge-assets')
          .upload(storageObjectPath, buffer, {
            contentType: detected.mime,
            upsert: true,
          });
        if (upload.error) throw upload.error;

        const { data: assetRow, error: assetError } = await supabase.rpc(
          'rpc_admin_upsert_knowledge_article_asset_v1',
          {
            p_article_id: runtimeArticle.id,
            p_knowledge_space_id: space.id,
            p_source_url: asset.sourceUrl ?? null,
            p_source_path: `${args.root.replace(/\\/g, '/')}/${relativeAssetPath}`,
            p_source_hash: fileHash,
            p_storage_object_path: storageObjectPath,
            p_detected_mime_type: detected.mime,
            p_file_size_bytes: buffer.length,
            p_width: detected.width,
            p_height: detected.height,
            p_alt_text: altText,
            p_caption: null,
            p_review_status: 'pending',
            p_visibility: 'internal',
            p_is_blocked: false,
          },
        );
        if (assetError) throw assetError;
        upsertedAssets.push(assetRow);
        assetBySrc.set(relativeAssetPath.replace(/^assets\//, ''), {
          id: assetRow.id,
          altText,
        });
      } else {
        assetBySrc.set(relativeAssetPath.replace(/^assets\//, ''), {
          id: `dry-run-${fileHash.slice(0, 12)}`,
          altText,
        });
      }
    }

    const markdown = buildMarkdownFromHtml(localHtml, assetBySrc, runtimeArticle.title);

    if (args.apply) {
      const { error: updateError } = await supabase.rpc(
        'rpc_admin_update_knowledge_article_draft_v2',
        {
          p_article_id: runtimeArticle.id,
          p_knowledge_space_id: space.id,
          p_title: runtimeArticle.title,
          p_slug: runtimeArticle.slug,
          p_summary: runtimeArticle.summary,
          p_body_md: markdown,
          p_category_id: runtimeArticle.category_id,
          p_visibility: runtimeArticle.visibility,
          p_source_path: runtimeArticle.source_path,
          p_source_hash: runtimeArticle.source_hash,
        },
      );
      if (updateError) throw updateError;
    }

    results.push({
      title: runtimeArticle.title,
      status: runtimeArticle.status,
      visibility: runtimeArticle.visibility,
      assets: article.assets?.length ?? 0,
      markdownBytes: Buffer.byteLength(markdown, 'utf8'),
      applied: args.apply,
      upsertedAssets: upsertedAssets.length,
    });
  }

  console.log(JSON.stringify({ results }, null, 2));
}

await main();
