import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

import { readLocalSupabaseConfig } from './local-supabase-config.mjs';
import {
  repairMojibake as safeRepairMojibake,
  stripLegacySupportContacts,
} from './legacy-normalization.mjs';

const DEFAULT_ROOT = 'raw_knowledge/octadesk_export/latest';

function parseArgs(argv) {
  const args = {
    root: DEFAULT_ROOT,
    local: false,
    apply: false,
    spaceSlug: null,
    title: null,
    allowlist: null,
    all: false,
    email: process.env.KNOWLEDGE_ADMIN_EMAIL,
    password: process.env.KNOWLEDGE_ADMIN_PASSWORD,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--local') args.local = true;
    else if (arg === '--apply') args.apply = true;
    else if (arg === '--root') args.root = argv[++index];
    else if (arg === '--space-slug') args.spaceSlug = argv[++index];
    else if (arg === '--title') args.title = argv[++index];
    else if (arg === '--allowlist') args.allowlist = argv[++index];
    else if (arg === '--all') args.all = true;
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
  if (!args.title && !args.allowlist && !args.all) {
    throw new Error('Use --title, --allowlist or --all to select articles explicitly.');
  }
  if (Number(Boolean(args.title)) + Number(Boolean(args.allowlist)) + Number(args.all) > 1) {
    throw new Error('Use only one article selector: --title, --allowlist or --all.');
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

function detectImageDimensions(buffer) {
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

  if (buffer.length >= 24 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    let offset = 2;
    while (offset + 9 < buffer.length) {
      if (buffer[offset] !== 0xff) {
        offset += 1;
        continue;
      }

      const marker = buffer[offset + 1];
      const segmentLength = buffer.readUInt16BE(offset + 2);
      const isSofMarker =
        marker >= 0xc0 &&
        marker <= 0xc3 ||
        marker >= 0xc5 &&
        marker <= 0xc7 ||
        marker >= 0xc9 &&
        marker <= 0xcb ||
        marker >= 0xcd &&
        marker <= 0xcf;

      if (isSofMarker && offset + 8 < buffer.length) {
        return {
          mime: 'image/jpeg',
          width: buffer.readUInt16BE(offset + 7),
          height: buffer.readUInt16BE(offset + 5),
        };
      }

      offset += Math.max(segmentLength + 2, 2);
    }

    return { mime: 'image/jpeg', width: null, height: null };
  }

  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return { mime: 'image/webp', width: null, height: null };
  }

  if (
    buffer.length >= 6 &&
    ['GIF87a', 'GIF89a'].includes(buffer.toString('ascii', 0, 6))
  ) {
    return {
      mime: 'image/gif',
      width: buffer.readUInt16LE(6),
      height: buffer.readUInt16LE(8),
    };
  }

  return { mime: 'application/octet-stream', width: null, height: null };
}

function repairMojibake(value) {
  const source = String(value ?? '');
  const markerCount = (source.match(/[ÃÂâð]/g) ?? []).length;
  if (markerCount === 0) return source;

  try {
    const repaired = Buffer.from(source, 'latin1').toString('utf8');
    const repairedMarkerCount = (repaired.match(/[ÃÂâð]/g) ?? []).length;
    return repairedMarkerCount < markerCount ? repaired : source;
  } catch {
    return source;
  }
}

function stripEmbeddedSupportContacts(value) {
  return String(value ?? '')
    .replace(/(^|\n)[ \t]*em caso de d(?:ú|u)vidas[^\n]*(?:\n[ \t]*(?:whatsapp|e-?mail)\s*:\s*[^\n]*){0,2}/gim, '$1')
    .replace(/(^|\n)[ \t]*\*{0,2}[ \t]*(?:whatsapp|e-?mail)\s*:\s*\*{0,2}[^\n]*/gim, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
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
  let source = safeRepairMojibake(html);

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
      if (/^https?:\/\/o205658-f7a\.octadesk\.com\//i.test(href)) {
        return stripTags(text);
      }
      return `[${stripTags(text)}](${href})`;
    });

  const markdown = stripLegacySupportContacts(safeRepairMojibake(stripTags(source)))
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const normalizedTitle = safeRepairMojibake(articleTitle);
  return markdown.startsWith('# ') ? markdown : `# ${normalizedTitle}\n\n${markdown}`;
}

async function readAllowlist(filePath) {
  const raw = JSON.parse(await fs.readFile(filePath, 'utf8'));
  const items = Array.isArray(raw) ? raw : raw.articles ?? raw.items ?? [];
  return new Set(items.map((item) => normalizeText(item.title ?? item.articleTitle ?? item)));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const localSupabase = readLocalSupabaseConfig({
    ...process.env,
    KNOWLEDGE_ADMIN_EMAIL: args.email,
    KNOWLEDGE_ADMIN_PASSWORD: args.password,
  });
  const root = path.resolve(args.root);
  const index = JSON.parse(await fs.readFile(path.join(root, 'articles-index.json'), 'utf8'));
  const allowedTitles = args.allowlist ? await readAllowlist(args.allowlist) : null;
  const selected = index.filter((article) => {
    const title = normalizeText(article.title);
    return args.all || (args.title ? title === normalizeText(args.title) : allowedTitles.has(title));
  });

  if (selected.length === 0) {
    throw new Error('No Octadesk articles matched the explicit selection.');
  }

  const supabase = createClient(localSupabase.url, localSupabase.anonKey);
  // O service role fica restrito ao processo local de carga de binários no
  // bucket público. RPCs e dados editoriais continuam passando pela sessão
  // autenticada do administrador, preservando os gates e a auditoria.
  const storageClient = localSupabase.serviceRoleKey
    ? createClient(localSupabase.url, localSupabase.serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : supabase;
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: localSupabase.email,
    password: localSupabase.password,
  });
  if (authError) throw authError;

  const { data: space, error: spaceError } = await supabase
    .from('vw_admin_knowledge_spaces')
    .select('*')
    .eq('slug', args.spaceSlug)
    .single();
  if (spaceError) throw spaceError;

  const results = [];
  const processedRuntimeArticleIds = new Set();

  for (const articleIndex of selected) {
    const articlePath = path.join(root, articleIndex.articleDirRelative);
    const article = JSON.parse(await fs.readFile(path.join(articlePath, 'article.json'), 'utf8'));
    const localHtml = await fs.readFile(path.join(articlePath, 'content.local.html'), 'utf8');
    const localText = await fs.readFile(path.join(articlePath, 'content.txt'), 'utf8');
    const sourcePath = `${args.root.replace(/\\/g, '/')}/${articleIndex.articleDirRelative}`;
    const sourceHash = sha256(Buffer.from(localText.trim(), 'utf8'));

    let { data: runtimeArticle, error: articleError } = await supabase
      .from('vw_admin_knowledge_article_detail_v2')
      .select('*')
      .eq('knowledge_space_id', space.id)
      .eq('source_path', sourcePath)
      .maybeSingle();
    if (articleError) throw articleError;
    if (!runtimeArticle) {
      const fallback = await supabase
        .from('vw_admin_knowledge_article_detail_v2')
        .select('*')
        .eq('knowledge_space_id', space.id)
        .eq('source_hash', sourceHash)
        .maybeSingle();
      if (fallback.error) throw fallback.error;
      runtimeArticle = fallback.data;
    }
    if (!runtimeArticle) {
      throw new Error(`Runtime article not found for ${sourcePath}`);
    }
    if (processedRuntimeArticleIds.has(runtimeArticle.id)) {
      results.push({
        title: repairMojibake(article.title),
        status: runtimeArticle.status,
        visibility: runtimeArticle.visibility,
        assets: article.assets?.length ?? 0,
        markdownBytes: 0,
        applied: args.apply,
        upsertedAssets: 0,
        articleUpdate: 'duplicate_source_skipped',
        publicAssets: runtimeArticle.status === 'published' && runtimeArticle.visibility === 'public',
      });
      continue;
    }
    processedRuntimeArticleIds.add(runtimeArticle.id);

    const assetBySrc = new Map();
    const upsertedAssets = [];
    const isPublished = runtimeArticle.status === 'published';
    const isPublic = runtimeArticle.visibility === 'public';
    const assetReviewStatus = isPublished && isPublic ? 'approved' : 'pending';
    const assetVisibility = isPublished ? runtimeArticle.visibility : 'internal';
    const storageBucket = isPublished && isPublic ? 'knowledge-public-assets' : 'knowledge-assets';
    const articleTitle = repairMojibake(runtimeArticle.title);
    const articleSummary = repairMojibake(runtimeArticle.summary ?? '');

    for (const asset of article.assets ?? []) {
      const relativeAssetPath = String(asset.localPath ?? '').replace(/\\/g, '/');
      const absoluteAssetPath = path.join(root, relativeAssetPath);
      const buffer = await fs.readFile(absoluteAssetPath);
      const fileHash = sha256(buffer);
      const detected = detectImageDimensions(buffer);
      if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(detected.mime)) {
        throw new Error(`Unsupported or invalid image asset: ${relativeAssetPath}`);
      }
      const storageExtension = detected.mime === 'image/jpeg'
        ? 'jpg'
        : detected.mime === 'image/webp'
          ? 'webp'
          : detected.mime === 'image/gif'
            ? 'gif'
            : 'png';
      const storageObjectPath = `octadesk/${runtimeArticle.id}/${fileHash}.${storageExtension}`;
      const altText = `Imagem do artigo ${articleTitle}`;

      if (args.apply) {
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
            p_review_status: assetReviewStatus,
            p_visibility: assetVisibility,
            p_is_blocked: false,
          },
        );
        if (assetError) throw assetError;

        const upload = await storageClient.storage
          .from(storageBucket)
          .upload(storageObjectPath, buffer, {
            contentType: detected.mime,
            upsert: true,
          });
        if (upload.error) throw upload.error;

        const { error: storageError } = await supabase.rpc(
          'rpc_admin_set_knowledge_article_asset_storage_v1',
          {
            p_asset_id: assetRow.id,
            p_storage_bucket: storageBucket,
            p_storage_object_path: storageObjectPath,
          },
        );
        if (storageError) throw storageError;
        upsertedAssets.push(assetRow);
        if (isPublished && isPublic) {
          const { error: reviewError } = await supabase.rpc(
            'rpc_admin_update_knowledge_article_asset_review_v1',
            {
              p_asset_id: assetRow.id,
              p_review_status: assetReviewStatus,
              p_visibility: assetVisibility,
              p_is_blocked: false,
              p_alt_text: altText,
              p_caption: null,
            },
          );
          if (reviewError) throw reviewError;
        }
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

    const markdown = buildMarkdownFromHtml(localHtml, assetBySrc, articleTitle);

    if (args.apply) {
      if (isPublished) {
        const { error: beginError } = await supabase.rpc(
          'rpc_admin_begin_knowledge_article_editorial_revision_v2',
          {
            p_article_id: runtimeArticle.id,
            p_knowledge_space_id: space.id,
          },
        );
        if (beginError) throw beginError;

        const { error: revisionError } = await supabase.rpc(
          'rpc_admin_update_knowledge_article_editorial_revision_v2',
          {
            p_article_id: runtimeArticle.id,
            p_knowledge_space_id: space.id,
            p_title: articleTitle,
            p_slug: runtimeArticle.slug,
            p_summary: articleSummary,
            p_body_md: markdown,
            p_category_id: runtimeArticle.category_id,
            p_visibility: runtimeArticle.visibility,
            p_source_path: runtimeArticle.source_path,
            p_source_hash: runtimeArticle.source_hash,
          },
        );
        if (revisionError) throw revisionError;

        const { error: publishError } = await supabase.rpc(
          'rpc_admin_publish_knowledge_article_editorial_revision_v2',
          {
            p_article_id: runtimeArticle.id,
            p_knowledge_space_id: space.id,
          },
        );
        if (publishError) throw publishError;
      } else {
        const { error: updateError } = await supabase.rpc(
          'rpc_admin_update_knowledge_article_draft_v2',
          {
            p_article_id: runtimeArticle.id,
            p_knowledge_space_id: space.id,
            p_title: articleTitle,
            p_slug: runtimeArticle.slug,
            p_summary: articleSummary,
            p_body_md: markdown,
            p_category_id: runtimeArticle.category_id,
            p_visibility: runtimeArticle.visibility,
            p_source_path: runtimeArticle.source_path,
            p_source_hash: runtimeArticle.source_hash,
          },
        );
        if (updateError) throw updateError;
      }
    }

    results.push({
      title: runtimeArticle.title,
      status: runtimeArticle.status,
      visibility: runtimeArticle.visibility,
      assets: article.assets?.length ?? 0,
      markdownBytes: Buffer.byteLength(markdown, 'utf8'),
      applied: args.apply,
      upsertedAssets: upsertedAssets.length,
      articleUpdate: args.apply ? (isPublished ? 'editorial_revision_published' : 'draft_updated') : 'dry_run',
      publicAssets: isPublished && isPublic,
    });
  }

  console.log(JSON.stringify({ results }, null, 2));
}

await main();
