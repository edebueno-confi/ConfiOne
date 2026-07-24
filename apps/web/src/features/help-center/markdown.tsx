import type { ReactNode } from 'react';

interface InlinePart {
  text: string;
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
  href?: string;
  markTone?: 'blue' | 'green' | 'yellow' | 'pink' | 'purple' | 'gray';
  textTone?: 'blue' | 'green' | 'yellow' | 'red' | 'gray';
}

export interface MarkdownAsset {
  signed_url?: string | null;
  alt_text?: string | null;
  caption?: string | null;
  width?: number | null;
  height?: number | null;
}

export interface MarkdownRelatedArticle {
  id: string;
  slug: string;
  title: string;
  summary?: string | null;
}

interface Block {
  type:
    | 'heading'
    | 'paragraph'
    | 'list'
    | 'code'
    | 'quote'
    | 'rule'
    | 'image'
    | 'callout'
    | 'youtube'
    | 'divider'
    | 'related';
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  text?: string;
  items?: string[];
  lines?: string[];
  ordered?: boolean;
  assetId?: string;
  alt?: string;
  imageSize?: 'small' | 'medium' | 'large' | 'full';
  mediaSize?: 'small' | 'medium' | 'large' | 'full';
  tone?: 'info' | 'warning' | 'success' | 'danger';
  videoId?: string;
  dividerStyle?: 'solid' | 'dashed' | 'space';
  relatedArticleId?: string;
  relatedSlug?: string;
  relatedTitle?: string;
  relatedSummary?: string;
}

function parseImageAlt(value: string) {
  const sizeMatch = /\s*\|size=(small|medium|large|full)\s*$/i.exec(value);
  if (!sizeMatch) {
    return { alt: value.trim(), imageSize: 'large' as const };
  }

  return {
    alt: value.slice(0, sizeMatch.index).trim(),
    imageSize: sizeMatch[1].toLowerCase() as 'small' | 'medium' | 'large' | 'full',
  };
}

function imageSizeClass(size?: Block['imageSize']) {
  if (size === 'small') {
    return 'max-w-[360px]';
  }

  if (size === 'medium') {
    return 'max-w-[560px]';
  }

  if (size === 'full') {
    return 'max-w-[78ch]';
  }

  return 'max-w-[680px]';
}

function mediaSizeClass(size?: Block['mediaSize']) {
  if (size === 'small') {
    return 'max-w-[360px]';
  }

  if (size === 'medium') {
    return 'max-w-[560px]';
  }

  if (size === 'full') {
    return 'max-w-[78ch]';
  }

  return 'max-w-[680px]';
}

function parseMediaSize(value?: string) {
  return value && /^(small|medium|large|full)$/i.test(value)
    ? (value.toLowerCase() as NonNullable<Block['mediaSize']>)
    : 'large';
}

function isSafeHref(value: string) {
  return /^(https?:\/\/|mailto:)/i.test(value);
}

function isValidYouTubeId(value: string) {
  return /^[A-Za-z0-9_-]{6,20}$/.test(value);
}

function parseInline(text: string): InlinePart[] {
  const parts: InlinePart[] = [];
  const pattern =
    /(\[color:(blue|green|yellow|red|gray)]([\s\S]+?)\[\/color]|\[mark:(blue|green|yellow|pink|purple|gray)]([\s\S]+?)\[\/mark]|\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|`([^`]+)`|\*([^*]+)\*)/g;
  let lastIndex = 0;

  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, index) });
    }

    if (match[2] && match[3]) {
      parts.push({
        text: match[3],
        textTone: match[2] as InlinePart['textTone'],
      });
    } else if (match[4] && match[5]) {
      parts.push({
        markTone: match[4] as InlinePart['markTone'],
        text: match[5],
      });
    } else if (match[6] && match[7]) {
      parts.push({
        text: match[6],
        href: isSafeHref(match[7].trim()) ? match[7].trim() : undefined,
      });
    } else if (match[8]) {
      parts.push({ text: match[8], bold: true });
    } else if (match[9]) {
      parts.push({ text: match[9], code: true });
    } else if (match[10]) {
      parts.push({ text: match[10], italic: true });
    }

    lastIndex = index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex) });
  }

  return parts.length > 0 ? parts : [{ text }];
}

function normalizeConfigurationSource(source: string) {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const normalized: string[] = [];
  let meaningfulLine = true;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      normalized.push('');
      meaningfulLine = true;
      continue;
    }

    const combinedLead = /^([A-ZÀ-Ú0-9][A-ZÀ-Ú0-9\s:?!-]{8,100}?)\s+(Passo a passo\b.+)$/.exec(line);
    if (meaningfulLine && normalized.every((entry) => !entry.trim()) && combinedLead) {
      normalized.push(`# ${combinedLead[1].trim()}`);
      normalized.push(`## ${combinedLead[2].replace(/:$/, '')}`);
      meaningfulLine = false;
      continue;
    }

    if (meaningfulLine && normalized.every((entry) => !entry.trim()) && /^\p{Lu}[\p{Lu}\p{N}\s:?!-]{8,100}$/u.test(line)) {
      const sentenceCase = line.toLocaleLowerCase('pt-BR').replace(/^./u, (character) => character.toLocaleUpperCase('pt-BR'));
      normalized.push(`# ${sentenceCase}`);
      meaningfulLine = false;
      continue;
    }

    if (/^passo a passo\b/i.test(line)) {
      const sentenceCase = line.replace(/:$/, '').replace(/^./u, (character) => character.toLocaleUpperCase('pt-BR'));
      normalized.push(`### ${sentenceCase}`);
      meaningfulLine = false;
      continue;
    }

    if (/^(dica|nota|observa[cç][aã]o)\s*:/i.test(line)) {
      normalized.push(':::callout info');
      normalized.push(line.replace(/^(dica|nota|observa[cç][aã]o)\s*:\s*/i, ''));
      normalized.push(':::');
      normalized.push('');
      meaningfulLine = true;
      continue;
    }

    if (/^cálculo (padrão|proporcional)\s*:/i.test(line)) {
      while (normalized.at(-1) === '') {
        normalized.pop();
      }
      normalized.push(`- ${line}`);
      meaningfulLine = false;
      continue;
    }

    if (/^(acesse|abra|no menu|selecione|escolha|clique|caso precise|ao clicar|insira|inserir|escolher|configure|defina|informe|revise|procure|localize|marque|navegue)\b/i.test(line)) {
      while (normalized.at(-1) === '') {
        normalized.pop();
      }
      normalized.push(`1. ${line}`);
      meaningfulLine = false;
      continue;
    }

    normalized.push(rawLine);
    meaningfulLine = false;
  }

  return normalized.join('\n');
}

function parseMarkdown(source: string, categoryName?: string) {
  const normalizedCategory = categoryName?.toLocaleLowerCase('pt-BR') ?? '';
  const normalizedSource = (normalizedCategory.startsWith('configura') || normalizedCategory.startsWith('sellers e loja'))
    ? normalizeConfigurationSource(source)
    : source;
  const lines = normalizedSource.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index] ?? '';
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    if (trimmed === '---' || trimmed === '***') {
      blocks.push({ type: 'rule' });
      index += 1;
      continue;
    }

    if (trimmed.startsWith('```')) {
      const codeLines: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith('```')) {
        codeLines.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) {
        index += 1;
      }
      blocks.push({ type: 'code', lines: codeLines });
      continue;
    }

    const headingMatch = /^(#{1,6})\s+(.+)$/.exec(trimmed);
    if (headingMatch) {
      blocks.push({
        type: 'heading',
        level: headingMatch[1].length as Block['level'],
        text: headingMatch[2].trim(),
      });
      index += 1;
      continue;
    }

    if (trimmed.startsWith('> ')) {
      const quoteLines: string[] = [];
      while (index < lines.length && lines[index].trim().startsWith('> ')) {
        quoteLines.push(lines[index].trim().slice(2));
        index += 1;
      }
      blocks.push({ type: 'quote', lines: quoteLines });
      continue;
    }

    const imageMatch = /^!\[([^\]]*)\]\((knowledge-asset:[^)]+)\)$/.exec(trimmed);
    if (imageMatch) {
      const imageAlt = parseImageAlt(imageMatch[1].trim());
      blocks.push({
        type: 'image',
        alt: imageAlt.alt,
        imageSize: imageAlt.imageSize,
        assetId: imageMatch[2].replace(/^knowledge-asset:/, '').trim(),
      });
      index += 1;
      continue;
    }

    const calloutMatch = /^:::callout\s+(info|warning|success|danger)\s*$/i.exec(trimmed);
    if (calloutMatch) {
      const calloutLines: string[] = [];
      index += 1;
      while (index < lines.length && lines[index].trim() !== ':::') {
        calloutLines.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) {
        index += 1;
      }
      blocks.push({
        type: 'callout',
        lines: calloutLines,
        tone: calloutMatch[1].toLowerCase() as Block['tone'],
      });
      continue;
    }

    const dividerMatch = /^::divider(?:\s+(solid|dashed|space))?\s*$/i.exec(trimmed);
    if (dividerMatch) {
      blocks.push({
        type: 'divider',
        dividerStyle: (dividerMatch[1]?.toLowerCase() as Block['dividerStyle']) ?? 'dashed',
      });
      index += 1;
      continue;
    }

    const relatedMatch = /^::related\s+([a-z0-9-]+|[a-f0-9-]{36})\s*$/i.exec(trimmed);
    if (relatedMatch) {
      const relatedLines: string[] = [];
      index += 1;
      while (index < lines.length && lines[index].trim() !== '::') {
        relatedLines.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) {
        index += 1;
      }
      blocks.push({
        relatedArticleId: /^[a-f0-9-]{36}$/i.test(relatedMatch[1]) ? relatedMatch[1] : undefined,
        relatedSlug: relatedMatch[1],
        relatedSummary: relatedLines[1]?.trim() || 'Abra este artigo relacionado na Central.',
        relatedTitle: relatedLines[0]?.trim() || 'Artigo relacionado',
        type: 'related',
      });
      continue;
    }

    const youtubeMatch =
      /^::youtube\s+([A-Za-z0-9_-]{6,20})(?:\s*\|size=(small|medium|large|full))?\s*$/i.exec(
        trimmed,
      );
    if (youtubeMatch && isValidYouTubeId(youtubeMatch[1])) {
      blocks.push({
        mediaSize: parseMediaSize(youtubeMatch[2]),
        type: 'youtube',
        videoId: youtubeMatch[1],
      });
      index += 1;
      continue;
    }

    if (/^[-*]\s+/.test(trimmed) || /^\d+[.)]\s+/.test(trimmed)) {
      const items: string[] = [];
      const ordered = /^\d+[.)]\s+/.test(trimmed);
      const pattern = ordered ? /^\d+[.)]\s+/ : /^[-*]\s+/;
      while (index < lines.length && pattern.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(pattern, ''));
        index += 1;
      }
      blocks.push({ type: 'list', items, ordered });
      continue;
    }

    const paragraphLines: string[] = [];
    while (index < lines.length) {
      const candidate = lines[index].trim();
      if (
        !candidate ||
        candidate.startsWith('```') ||
        /^:::callout\s+(info|warning|success|danger)\s*$/i.test(candidate) ||
        /^::divider(?:\s+(solid|dashed|space))?\s*$/i.test(candidate) ||
        /^::related\s+([a-z0-9-]+|[a-f0-9-]{36})\s*$/i.test(candidate) ||
        /^::youtube\s+([A-Za-z0-9_-]{6,20})(?:\s*\|size=(small|medium|large|full))?\s*$/i.test(
          candidate,
        ) ||
        /^(#{1,6})\s+/.test(candidate) ||
        /^!\[([^\]]*)\]\((knowledge-asset:[^)]+)\)$/.test(candidate) ||
        candidate.startsWith('> ') ||
        /^[-*]\s+/.test(candidate) ||
        /^\d+[.)]\s+/.test(candidate) ||
        candidate === '---' ||
        candidate === '***'
      ) {
        break;
      }

      paragraphLines.push(candidate);
      index += 1;
    }

    blocks.push({
      type: 'paragraph',
      text: paragraphLines.join(' '),
    });
  }

  return blocks;
}

function renderInline(text: string): ReactNode[] {
  return parseInline(text).map((part, index) => {
    const key = `${part.text}-${index}`;

    if (part.href) {
      return (
        <a
          key={key}
          className="font-medium text-[color:var(--help-link)] underline decoration-[var(--help-content-rule)] underline-offset-4 hover:text-[color:var(--help-link-hover)]"
          href={part.href}
          rel="noreferrer"
          target="_blank"
        >
          {part.text}
        </a>
      );
    }

    if (part.code) {
      return (
        <code
          key={key}
          className="rounded-lg bg-[var(--help-content-code)] px-1.5 py-0.5 font-mono text-[0.92em] text-[color:var(--help-ink-strong)]"
        >
          {part.text}
        </code>
      );
    }

    if (part.bold) {
      return <strong key={key}>{part.text}</strong>;
    }

    if (part.italic) {
      return <em key={key}>{part.text}</em>;
    }

    if (part.textTone) {
      const colorClass =
        part.textTone === 'blue'
          ? 'text-[color:var(--color-info-text)]'
          : part.textTone === 'green'
            ? 'text-[color:var(--color-success-ink)]'
            : part.textTone === 'yellow'
              ? 'text-[color:var(--color-warning-ink)]'
              : part.textTone === 'red'
                ? 'text-[color:var(--color-danger-ink)]'
                : 'text-[color:var(--color-text-secondary)]';
      return (
        <span key={key} className={colorClass}>
          {part.text}
        </span>
      );
    }

    if (part.markTone) {
      const markClass =
        part.markTone === 'blue'
          ? 'bg-[color:var(--color-info-surface)]'
          : part.markTone === 'green'
            ? 'bg-[color:var(--color-success-surface)]'
            : part.markTone === 'yellow'
              ? 'bg-[color:var(--color-warning-surface)]'
              : part.markTone === 'pink'
                ? 'bg-pink-50'
                : part.markTone === 'purple'
                  ? 'bg-violet-50'
                  : 'bg-[color:var(--color-app-bg)]';
      return (
        <span key={key} className={`rounded-md px-1 ${markClass}`}>
          {part.text}
        </span>
      );
    }

    return <span key={key}>{part.text}</span>;
  });
}

function slugifyHeading(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function MarkdownDocument({
  assets = {},
  categoryName,
  relatedArticles = [],
  source,
}: {
  assets?: Record<string, MarkdownAsset>;
  categoryName?: string;
  relatedArticles?: MarkdownRelatedArticle[];
  source: string;
}) {
  const blocks = parseMarkdown(source, categoryName);
  const headingUsage = new Map<string, number>();
  let levelTwoIndex = 0;
  const relatedById = new Map(relatedArticles.map((article) => [article.id, article]));
  const relatedBySlug = new Map(relatedArticles.map((article) => [article.slug, article]));

  return (
    <div className="space-y-6 text-[color:var(--help-ink)]">
      {blocks.map((block, index) => {
        const key = `${block.type}-${index}`;

        if (block.type === 'rule') {
          return <hr key={key} className="border-0 border-t border-[var(--help-content-rule)]" />;
        }

        if (block.type === 'heading') {
          const Tag = `h${block.level ?? 2}` as const;
          const baseHeadingId = slugifyHeading(block.text ?? '') || `secao-${index + 1}`;
          const headingCount = headingUsage.get(baseHeadingId) ?? 0;
          headingUsage.set(baseHeadingId, headingCount + 1);
          const headingId =
            headingCount === 0 ? baseHeadingId : `${baseHeadingId}-${headingCount + 1}`;
          const className =
            block.level === 1
              ? 'scroll-mt-24 text-3xl font-semibold tracking-[-0.05em] text-[color:var(--help-ink-strong)] sm:text-[2.1rem]'
              : block.level === 2
                ? 'scroll-mt-24 text-[1.75rem] font-semibold tracking-[-0.04em] text-[color:var(--help-ink-strong)] sm:text-[1.95rem]'
                : 'scroll-mt-24 text-xl font-semibold tracking-[-0.03em] text-[color:var(--help-ink-strong)] sm:text-[1.3rem]';

          if (block.level === 2) {
            levelTwoIndex += 1;
          }

          return (
            <Tag key={key} className={className} id={headingId}>
              {block.level === 2 ? (
                <span className="flex items-start gap-3">
                  <span className="text-[var(--help-link)]">{`${levelTwoIndex}.`}</span>
                  <span>{renderInline(block.text ?? '')}</span>
                </span>
              ) : (
                renderInline(block.text ?? '')
              )}
            </Tag>
          );
        }

        if (block.type === 'paragraph') {
          return (
            <p
              key={key}
              className="max-w-[78ch] text-[1.02rem] leading-8 text-[color:var(--help-ink)] sm:text-[1.06rem] sm:leading-9"
            >
              {renderInline(block.text ?? '')}
            </p>
          );
        }

        if (block.type === 'callout') {
          const tone = block.tone ?? 'info';
          const toneClass =
            tone === 'warning'
              ? 'border-[color:var(--color-warning-border)] bg-[color:var(--color-warning-surface)] text-[color:var(--color-warning-ink)]'
              : tone === 'success'
                ? 'border-[color:var(--color-success-border)] bg-[color:var(--color-success-surface)] text-[color:var(--color-success-ink)]'
                : tone === 'danger'
                  ? 'border-[color:var(--color-danger-border)] bg-[color:var(--color-danger-surface)] text-[color:var(--color-danger-ink)]'
                  : 'border-[color:var(--color-info-border)] bg-[color:var(--color-info-surface)] text-[color:var(--color-info-text)]';
          const iconClass =
            tone === 'warning'
              ? 'bg-[color:var(--color-warning-text)] text-white'
              : tone === 'success'
                ? 'bg-[color:var(--color-success-text)] text-white'
                : tone === 'danger'
                  ? 'bg-[color:var(--color-danger-text)] text-white'
                  : 'bg-[color:var(--help-link)] text-white';
          const title =
            tone === 'warning'
              ? 'Atenção'
              : tone === 'success'
                ? 'Importante'
                : tone === 'danger'
                  ? 'Cuidado'
                  : 'Nota';

          return (
            <aside
              key={key}
              className={`grid max-w-[78ch] grid-cols-[24px_minmax(0,1fr)] gap-3 rounded-[18px] border px-4 py-3 ${toneClass}`}
            >
              <span
                className={`grid h-6 w-6 place-items-center rounded-full text-xs font-bold ${iconClass}`}
              >
                {tone === 'warning' ? '!' : tone === 'success' ? '★' : tone === 'danger' ? '!' : 'i'}
              </span>
              <div className="space-y-1">
                <p className="text-sm font-extrabold">{title}</p>
                {(block.lines?.length ? block.lines : ['']).map((line, lineIndex) => (
                  <p key={`${key}-${lineIndex}`} className="text-sm leading-6">
                    {renderInline(line)}
                  </p>
                ))}
              </div>
            </aside>
          );
        }

        if (block.type === 'divider') {
          if (block.dividerStyle === 'space') {
            return <div key={key} className="h-8 max-w-[78ch]" />;
          }

          return (
            <hr
              key={key}
              className={`my-8 max-w-[78ch] border-0 border-t-2 border-[var(--help-border)] ${
                block.dividerStyle === 'solid' ? 'border-solid' : 'border-dashed'
              }`}
            />
          );
        }

        if (block.type === 'related') {
          const related =
            (block.relatedArticleId ? relatedById.get(block.relatedArticleId) : null) ??
            (block.relatedSlug ? relatedBySlug.get(block.relatedSlug) : null);

          if (!related) {
            return null;
          }

          return (
            <a
              key={key}
              className="grid max-w-[78ch] grid-cols-[minmax(0,1fr)_auto] gap-1 rounded-[18px] border border-[var(--help-content-callout-border)] bg-[var(--help-content-callout)] px-5 py-4 text-[color:var(--help-ink-strong)] no-underline shadow-[var(--help-content-shadow)]"
              href={`/help/genius/articles/${related.slug}`}
            >
              <span className="col-span-2 text-sm font-extrabold text-violet-700">Leia também</span>
              <strong className="text-base font-extrabold">{related.title}</strong>
              <span className="text-xl text-violet-600">→</span>
              <span className="text-sm leading-6 text-[color:var(--color-text-secondary)]">
                {related.summary || 'Abra este artigo relacionado na Central.'}
              </span>
            </a>
          );
        }

        if (block.type === 'youtube' && block.videoId) {
          return (
            <figure
              key={key}
              className={`${mediaSizeClass(block.mediaSize)} overflow-hidden rounded-[22px] border border-[var(--help-content-rule)] bg-[var(--help-content-media)] shadow-[var(--help-content-shadow)]`}
            >
              <div className="aspect-video w-full">
                <iframe
                  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="h-full w-full"
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                  sandbox="allow-scripts allow-same-origin allow-presentation"
                  src={`https://www.youtube-nocookie.com/embed/${block.videoId}`}
                  title="Vídeo incorporado do YouTube"
                />
              </div>
            </figure>
          );
        }

        if (block.type === 'image') {
          const asset = block.assetId ? assets[block.assetId] : null;

          if (!asset?.signed_url) {
            return (
              <div
                key={key}
              className="max-w-[78ch] rounded-[18px] border border-dashed border-[var(--help-content-note-border)] bg-[var(--help-content-note)] px-4 py-4 text-sm leading-6 text-[color:var(--help-muted)]"
              >
                Imagem indisponível para publicação. Revise o asset antes de liberar este conteúdo.
              </div>
            );
          }

          return (
            <figure
              key={key}
              className={`${imageSizeClass(block.imageSize)} overflow-hidden rounded-[24px] border border-[var(--help-content-rule)] bg-[color:var(--help-surface-strong)] shadow-[var(--help-content-shadow)]`}
            >
              <img
                alt={asset.alt_text ?? block.alt ?? ''}
                className="h-auto max-h-[620px] w-full object-contain"
                height={asset.height ?? undefined}
                loading="lazy"
                src={asset.signed_url}
                width={asset.width ?? undefined}
              />
              {asset.caption ? (
                <figcaption className="border-t border-[var(--help-content-rule)] bg-[var(--help-content-note)] px-4 py-3 text-sm leading-6 text-[color:var(--help-muted)]">
                  {asset.caption}
                </figcaption>
              ) : null}
            </figure>
          );
        }

        if (block.type === 'quote') {
          return (
            <blockquote
              key={key}
              className="max-w-[72ch] rounded-[18px] border border-[var(--help-content-callout-border)] bg-[var(--help-content-callout)] px-5 py-4 text-base leading-8 text-[color:var(--help-ink)]"
            >
              {block.lines?.map((line, lineIndex) => (
                <p key={`${key}-${lineIndex}`}>{renderInline(line)}</p>
              ))}
            </blockquote>
          );
        }

        if (block.type === 'code') {
          return (
            <pre
              key={key}
              className="max-w-full overflow-x-auto rounded-[24px] bg-[color:var(--help-code-surface)] px-5 py-4 text-sm leading-7 text-[color:var(--help-code-ink)]"
            >
              <code>{block.lines?.join('\n') ?? ''}</code>
            </pre>
          );
        }

        if (block.type === 'list') {
          const ListTag = block.ordered ? 'ol' : 'ul';
          return (
            <ListTag
              key={key}
              className="grid max-w-[72ch] gap-3 pl-6 text-[1.02rem] leading-8 text-[color:var(--help-ink)]"
            >
              {block.items?.map((item, itemIndex) => (
                <li
                  key={`${key}-${itemIndex}`}
                  className={block.ordered ? 'list-decimal' : 'list-disc'}
                >
                  {renderInline(item)}
                </li>
              ))}
            </ListTag>
          );
        }

        return null;
      })}
    </div>
  );
}
