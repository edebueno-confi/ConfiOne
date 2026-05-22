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

function parseMarkdown(source: string) {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
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
          className="font-medium text-[color:var(--help-link)] underline decoration-[rgba(20,31,71,0.18)] underline-offset-4 hover:text-[color:var(--help-link-hover)]"
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
          className="rounded-lg bg-[rgba(20,31,71,0.08)] px-1.5 py-0.5 font-mono text-[0.92em] text-[color:var(--help-ink-strong)]"
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
          ? 'text-blue-700'
          : part.textTone === 'green'
            ? 'text-emerald-700'
            : part.textTone === 'yellow'
              ? 'text-amber-700'
              : part.textTone === 'red'
                ? 'text-red-700'
                : 'text-slate-500';
      return (
        <span key={key} className={colorClass}>
          {part.text}
        </span>
      );
    }

    if (part.markTone) {
      const markClass =
        part.markTone === 'blue'
          ? 'bg-blue-50'
          : part.markTone === 'green'
            ? 'bg-emerald-50'
            : part.markTone === 'yellow'
              ? 'bg-amber-50'
              : part.markTone === 'pink'
                ? 'bg-pink-50'
                : part.markTone === 'purple'
                  ? 'bg-violet-50'
                  : 'bg-slate-100';
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
  relatedArticles = [],
  source,
}: {
  assets?: Record<string, MarkdownAsset>;
  relatedArticles?: MarkdownRelatedArticle[];
  source: string;
}) {
  const blocks = parseMarkdown(source);
  const headingUsage = new Map<string, number>();
  let levelTwoIndex = 0;
  const relatedById = new Map(relatedArticles.map((article) => [article.id, article]));
  const relatedBySlug = new Map(relatedArticles.map((article) => [article.slug, article]));

  return (
    <div className="space-y-6 text-[color:var(--help-ink)]">
      {blocks.map((block, index) => {
        const key = `${block.type}-${index}`;

        if (block.type === 'rule') {
          return <hr key={key} className="border-0 border-t border-[rgba(20,31,71,0.12)]" />;
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
              ? 'border-amber-300 bg-amber-50 text-amber-900'
              : tone === 'success'
                ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                : tone === 'danger'
                  ? 'border-red-300 bg-red-50 text-red-900'
                  : 'border-blue-300 bg-blue-50 text-blue-950';
          const iconClass =
            tone === 'warning'
              ? 'bg-amber-500 text-white'
              : tone === 'success'
                ? 'bg-emerald-500 text-white'
                : tone === 'danger'
                  ? 'bg-red-600 text-white'
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
              className={`my-8 max-w-[78ch] border-0 border-t-2 border-[#DCE4F2] ${
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
              className="grid max-w-[78ch] grid-cols-[minmax(0,1fr)_auto] gap-1 rounded-[18px] border border-violet-200 bg-violet-50 px-5 py-4 text-violet-950 no-underline shadow-[0_14px_34px_rgba(124,58,237,0.08)]"
              href={`/help/genius/articles/${related.slug}`}
            >
              <span className="col-span-2 text-sm font-extrabold text-violet-700">Leia também</span>
              <strong className="text-base font-extrabold">{related.title}</strong>
              <span className="text-xl text-violet-600">→</span>
              <span className="text-sm leading-6 text-slate-600">
                {related.summary || 'Abra este artigo relacionado na Central.'}
              </span>
            </a>
          );
        }

        if (block.type === 'youtube' && block.videoId) {
          return (
            <figure
              key={key}
              className={`${mediaSizeClass(block.mediaSize)} overflow-hidden rounded-[22px] border border-[rgba(20,31,71,0.12)] bg-[#090f2d] shadow-[0_18px_42px_rgba(20,31,71,0.12)]`}
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
                className="max-w-[78ch] rounded-[18px] border border-dashed border-[rgba(20,31,71,0.16)] bg-[#fbfcff] px-4 py-4 text-sm leading-6 text-[color:var(--help-muted)]"
              >
                Imagem indisponível para publicação. Revise o asset antes de liberar este conteúdo.
              </div>
            );
          }

          return (
            <figure
              key={key}
              className={`${imageSizeClass(block.imageSize)} overflow-hidden rounded-[24px] border border-[rgba(20,31,71,0.1)] bg-white shadow-[0_14px_34px_rgba(20,31,71,0.08)]`}
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
                <figcaption className="border-t border-[rgba(20,31,71,0.08)] bg-[#fbfcff] px-4 py-3 text-sm leading-6 text-[color:var(--help-muted)]">
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
              className="max-w-[72ch] rounded-[18px] border border-[rgba(48,127,226,0.18)] bg-[rgba(48,127,226,0.06)] px-5 py-4 text-base leading-8 text-[color:var(--help-ink)]"
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
