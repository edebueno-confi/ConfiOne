import {
  type ChangeEvent,
  type ClipboardEvent,
  type DragEvent,
  type FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AppButton,
  cx,
  Field,
  GhostButton,
  InlineNotice,
  SelectInput,
  TextInput,
  TextareaInput,
} from '../../components/ui';
import { ContractUnavailableState, ErrorState, LoadingState } from '../../components/states';
import {
  createKnowledgeArticleDraftV2,
  beginKnowledgeArticleEditorialRevisionV2,
  getAdminKnowledgeArticleDetailV2,
  listAdminKnowledgeArticleAssets,
  listAdminKnowledgeArticleReviewAdvisories,
  listAdminKnowledgeCategoriesV2,
  listAdminKnowledgeSpaces,
  prepareKnowledgeArticlePublicationEvidence,
  publishKnowledgeArticleEditorialRevisionV2,
  publishKnowledgeArticleV2,
  submitKnowledgeArticleForReviewV2,
  updateKnowledgeArticleEditorialRevisionV2,
  updateKnowledgeArticleDraftV2,
  uploadKnowledgeArticleAssetFile,
  type AdminKnowledgeArticleAssetRow,
  type AdminKnowledgeArticleDetailV2Row,
  type AdminKnowledgeArticleEditorialDraftRow,
  type AdminKnowledgeArticleReviewAdvisoryRow,
  type AdminKnowledgeCategoryV2Row,
  type AdminKnowledgeSpaceRow,
  type KnowledgeArticleStatus,
  type KnowledgeReviewHumanConfirmations,
  type KnowledgeVisibility,
} from '../admin/admin-api';
import { classifyAdminError } from '../admin/admin-errors';
import { type MarkdownAsset } from '../help-center/markdown';

type PagePhase = 'loading' | 'ready' | 'contract-unavailable' | 'error';
type SaveState = 'idle' | 'saving' | 'saved' | 'error';
type ArticleEditorStatus = Extract<
  KnowledgeArticleStatus,
  'draft' | 'review' | 'published' | 'archived'
>;

interface ArticleEditorForm {
  title: string;
  slug: string;
  summary: string;
  bodyMd: string;
  categoryId: string;
  visibility: KnowledgeVisibility;
  keywords: string[];
}

const EMPTY_FORM: ArticleEditorForm = {
  title: '',
  slug: '',
  summary: '',
  bodyMd: '',
  categoryId: '',
  visibility: 'internal',
  keywords: [],
};

const TITLE_LIMIT = 150;
const SLUG_LIMIT = 120;
const SUMMARY_LIMIT = 160;
const PUBLIC_PUBLISH_REVIEW_NOTES =
  'Revisão humana confirmada no Admin Knowledge antes de publicação pública.';

const PUBLIC_PUBLISH_CONFIRMATION_FIELDS: Array<{
  key: keyof KnowledgeReviewHumanConfirmations;
  label: string;
}> = [
  { key: 'title_reviewed', label: 'Título revisado' },
  { key: 'summary_reviewed', label: 'Resumo revisado' },
  { key: 'body_reviewed', label: 'Corpo revisado' },
  { key: 'category_reviewed', label: 'Categoria revisada' },
  { key: 'visibility_reviewed', label: 'Visibilidade pública revisada' },
  { key: 'no_sensitive_data_exposed', label: 'Sem dado sensível exposto' },
  { key: 'ready_for_review', label: 'Pronto para revisão' },
  { key: 'ready_for_publish', label: 'Pronto para publicação' },
];

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, SLUG_LIMIT);
}

function normalizeOptionalText(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function buildArticleFormFromDetail(article: AdminKnowledgeArticleDetailV2Row): ArticleEditorForm {
  return {
    title: article.title ?? '',
    slug: article.slug ?? '',
    summary: article.summary ?? '',
    bodyMd: article.body_md ?? '',
    categoryId: article.category_id ?? '',
    visibility: article.visibility,
    keywords: [],
  };
}

function buildArticleFormFromEditorialDraft(
  draft: AdminKnowledgeArticleEditorialDraftRow,
  fallback: AdminKnowledgeArticleDetailV2Row,
): ArticleEditorForm {
  return {
    title: draft.title ?? fallback.title ?? '',
    slug: draft.slug ?? fallback.slug ?? '',
    summary: draft.summary ?? fallback.summary ?? '',
    bodyMd: draft.body_md ?? fallback.body_md ?? '',
    categoryId: draft.category_id ?? fallback.category_id ?? '',
    visibility: draft.visibility ?? fallback.visibility,
    keywords: [],
  };
}

function formatFileSize(bytes: number) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  if (bytes >= 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${bytes} B`;
}

function visibilityLabel(visibility: KnowledgeVisibility) {
  if (visibility === 'public') {
    return 'Público';
  }

  if (visibility === 'restricted') {
    return 'Restrito';
  }

  return 'Interno';
}

function statusLabel(status: ArticleEditorStatus) {
  if (status === 'review') {
    return 'Em revisão';
  }

  if (status === 'published') {
    return 'Publicado';
  }

  if (status === 'archived') {
    return 'Arquivado';
  }

  return 'Rascunho';
}

function getBodyWithoutMarkdown(bodyMd: string) {
  return bodyMd
    .replace(/!\[[^\]]*]\(knowledge-asset:[^)]+\)/gi, ' ')
    .replace(/knowledge-asset:[a-f0-9-]+/gi, '')
    .replace(/[#*_>`[\]()-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasReviewedLink(bodyMd: string) {
  return /\[[^\]]+\]\([^)]+\)/.test(bodyMd);
}

function hasAssetReference(bodyMd: string, assets: AdminKnowledgeArticleAssetRow[]) {
  return /!\[[^\]]*]\(knowledge-asset:[^)]+\)/i.test(bodyMd) || assets.length > 0;
}

function buildAssetMarkdown(asset: AdminKnowledgeArticleAssetRow) {
  const altText =
    asset.alt_text?.trim() ||
    asset.source_path
      ?.split('/')
      .pop()
      ?.replace(/\.[^.]+$/, '') ||
    'Imagem do artigo';

  return `\n\n![${altText}|size=large](knowledge-asset:${asset.id})\n\n`;
}

function buildAssetMap(assets: AdminKnowledgeArticleAssetRow[]) {
  return Object.fromEntries(
    assets.map((asset) => [
      asset.id,
      {
        alt_text: asset.alt_text,
        caption: asset.caption,
        height: asset.height,
        signed_url: asset.signed_url,
        width: asset.width,
      } satisfies MarkdownAsset,
    ]),
  );
}

function normalizeHumanConfirmations(value: unknown): KnowledgeReviewHumanConfirmations {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  const record = value as Record<string, unknown>;
  const result: KnowledgeReviewHumanConfirmations = {};

  for (const field of PUBLIC_PUBLISH_CONFIRMATION_FIELDS) {
    if (typeof record[field.key] === 'boolean') {
      result[field.key] = record[field.key] as boolean;
    }
  }

  return result;
}

function buildCompleteHumanConfirmations(): KnowledgeReviewHumanConfirmations {
  return Object.fromEntries(
    PUBLIC_PUBLISH_CONFIRMATION_FIELDS.map((field) => [field.key, true]),
  ) as KnowledgeReviewHumanConfirmations;
}

function hasCompleteHumanConfirmations(value: unknown) {
  const confirmations = normalizeHumanConfirmations(value);
  return PUBLIC_PUBLISH_CONFIRMATION_FIELDS.every((field) => confirmations[field.key] === true);
}

function publicPublishBlocker(
  advisory: AdminKnowledgeArticleReviewAdvisoryRow | null,
  visibility: KnowledgeVisibility,
) {
  if (visibility !== 'public') {
    return null;
  }

  if (!advisory) {
    return 'Falta preparar a evidência pública deste artigo.';
  }

  if (
    advisory.suggested_visibility !== 'public' ||
    advisory.suggested_classification !== 'public'
  ) {
    return 'A evidência editorial ainda não está marcada como pública.';
  }

  if (
    advisory.review_status !== 'reviewed' ||
    !advisory.reviewed_by_user_id ||
    !advisory.reviewed_at
  ) {
    return 'Confirme a revisão editorial antes de publicar.';
  }

  if (!hasCompleteHumanConfirmations(advisory.human_confirmations)) {
    return 'Conclua o checklist de publicação.';
  }

  return null;
}

function FormFieldLabel({ children, required = false }: { children: string; required?: boolean }) {
  return (
    <span className="text-[0.72rem] font-semibold text-[color:var(--color-brand-navy)]">
      {children}
      {required ? <span className="ml-1 text-[color:var(--color-danger-ink)]">*</span> : null}
    </span>
  );
}

function CharacterCounter({ value, limit }: { value: string; limit: number }) {
  return (
    <span
      className={cx(
        'text-right text-[0.72rem] font-medium',
        value.length > limit
          ? 'text-[color:var(--color-danger-ink)]'
          : 'text-[color:var(--color-muted)]',
      )}
    >
      {value.length}/{limit}
    </span>
  );
}

function RailCard({
  title,
  badge,
  children,
}: {
  title: string;
  badge?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[20px] border border-[#DCE4F2] bg-white p-3 shadow-[0_18px_50px_rgba(22,36,67,0.06)]">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[0.82rem] font-extrabold tracking-[-0.015em] text-[#162443]">
          {title}
        </h2>
        {badge ? (
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[0.68rem] font-extrabold text-emerald-700">
            {badge}
          </span>
        ) : null}
      </div>
      <div className="mt-3 space-y-2.5">{children}</div>
    </section>
  );
}

function ToolbarButton({
  children,
  onClick,
  title,
  disabled = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  disabled?: boolean;
}) {
  return (
    <button
      className="inline-flex h-8 min-w-8 shrink-0 items-center justify-center rounded-xl border border-transparent px-2 text-[0.78rem] font-bold text-[#162443] transition hover:border-[#DCE4F2] hover:bg-[#F4F7FC] disabled:cursor-not-allowed disabled:opacity-40"
      disabled={disabled}
      onClick={onClick}
      title={title}
      type="button"
    >
      {children}
    </button>
  );
}

function ChecklistItem({
  actionLabel,
  disabled = false,
  done,
  label,
  onAction,
}: {
  actionLabel?: string;
  disabled?: boolean;
  done: boolean;
  label: string;
  onAction?: () => void;
}) {
  return (
    <li className="flex items-center gap-2 text-[0.78rem] leading-5 text-[color:var(--color-brand-navy)]">
      <span
        className={cx(
          'inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[0.56rem]',
          done
            ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
            : 'border-[#C8D4EA] bg-white text-[#98A3B8]',
        )}
      >
        {done ? '✓' : ''}
      </span>
      <span className="min-w-0 flex-1">{label}</span>
      {!done && onAction ? (
        <button
          className="shrink-0 rounded-full px-2 py-1 text-[0.66rem] font-extrabold text-[#2F6BFF] hover:bg-[#F4F7FC] disabled:cursor-not-allowed disabled:opacity-40"
          disabled={disabled}
          onClick={onAction}
          type="button"
        >
          {actionLabel ?? 'Resolver'}
        </button>
      ) : null}
    </li>
  );
}

type VisualImageSize = 'small' | 'medium' | 'large' | 'full';

type VisualEditorBlock =
  | { type: 'heading'; level: 1 | 2 | 3; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'quote'; text: string }
  | { type: 'code'; text: string }
  | { type: 'image'; assetId: string; alt: string; size: VisualImageSize }
  | { type: 'callout'; tone: 'info' | 'warning' | 'success'; text: string }
  | { type: 'youtube'; videoId: string; size: VisualImageSize };

function extractYouTubeVideoId(value: string) {
  const trimmed = value.trim();
  if (/^[A-Za-z0-9_-]{6,20}$/.test(trimmed)) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    const host = url.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') {
      const id = url.pathname.replace(/^\//, '').split('/')[0];
      return /^[A-Za-z0-9_-]{6,20}$/.test(id) ? id : null;
    }

    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
      const watchId = url.searchParams.get('v');
      const embedMatch = /\/embed\/([A-Za-z0-9_-]{6,20})/.exec(url.pathname);
      const shortMatch = /\/shorts\/([A-Za-z0-9_-]{6,20})/.exec(url.pathname);
      const id = watchId ?? embedMatch?.[1] ?? shortMatch?.[1] ?? '';
      return /^[A-Za-z0-9_-]{6,20}$/.test(id) ? id : null;
    }
  } catch {
    return null;
  }

  return null;
}

function parseVisualImageAlt(value: string) {
  const sizeMatch = /\s*\|size=(small|medium|large|full)\s*$/i.exec(value);
  if (!sizeMatch) {
    return {
      alt: value.trim() || 'Imagem do artigo',
      size: 'large' as VisualImageSize,
    };
  }

  return {
    alt: value.slice(0, sizeMatch.index).trim() || 'Imagem do artigo',
    size: sizeMatch[1].toLowerCase() as VisualImageSize,
  };
}

function parseVisualMediaSize(value?: string | null): VisualImageSize {
  return value && /^(small|medium|large|full)$/i.test(value)
    ? (value.toLowerCase() as VisualImageSize)
    : 'large';
}

function renderYoutubeFigure(videoId: string, size: VisualImageSize = 'large') {
  const safeVideoId = escapeHtml(videoId);
  return `<figure draggable="true" data-youtube-id="${safeVideoId}" data-size="${size}" contenteditable="false" tabindex="0"><div class="youtube-card"><span class="youtube-card__play">▶</span><strong>Vídeo YouTube</strong><small>youtube-nocookie.com/embed/${safeVideoId}</small></div></figure>`;
}

function parseVisualBlocks(source: string): VisualEditorBlock[] {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const blocks: VisualEditorBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const trimmed = (lines[index] ?? '').trim();
    if (!trimmed) {
      index += 1;
      continue;
    }

    const imageMatch = /^!\[([^\]]*)\]\(knowledge-asset:([^)]+)\)$/.exec(trimmed);
    if (imageMatch) {
      const imageAlt = parseVisualImageAlt(imageMatch[1]);
      blocks.push({
        type: 'image',
        assetId: imageMatch[2].trim(),
        alt: imageAlt.alt,
        size: imageAlt.size,
      });
      index += 1;
      continue;
    }

    const headingMatch = /^(#{1,3})\s+(.+)$/.exec(trimmed);
    if (headingMatch) {
      blocks.push({
        type: 'heading',
        level: headingMatch[1].length as 1 | 2 | 3,
        text: headingMatch[2].trim(),
      });
      index += 1;
      continue;
    }

    if (trimmed.startsWith('> ')) {
      const quoteLines: string[] = [];
      while (index < lines.length && (lines[index] ?? '').trim().startsWith('> ')) {
        quoteLines.push((lines[index] ?? '').trim().slice(2));
        index += 1;
      }
      blocks.push({ type: 'quote', text: quoteLines.join('\n') });
      continue;
    }

    if (trimmed.startsWith('```')) {
      const codeLines: string[] = [];
      index += 1;
      while (index < lines.length && !(lines[index] ?? '').trim().startsWith('```')) {
        codeLines.push(lines[index] ?? '');
        index += 1;
      }
      index += 1;
      blocks.push({ type: 'code', text: codeLines.join('\n') });
      continue;
    }

    const calloutMatch = /^:::callout\s+(info|warning|success)\s*$/i.exec(trimmed);
    if (calloutMatch) {
      const calloutLines: string[] = [];
      index += 1;
      while (index < lines.length && (lines[index] ?? '').trim() !== ':::') {
        calloutLines.push(lines[index] ?? '');
        index += 1;
      }
      if (index < lines.length) {
        index += 1;
      }
      blocks.push({
        type: 'callout',
        tone: calloutMatch[1].toLowerCase() as 'info' | 'warning' | 'success',
        text: calloutLines.join('\n'),
      });
      continue;
    }

    const youtubeMatch =
      /^::youtube\s+([A-Za-z0-9_-]{6,20})(?:\s*\|size=(small|medium|large|full))?\s*$/i.exec(
        trimmed,
      );
    if (youtubeMatch) {
      blocks.push({
        type: 'youtube',
        videoId: youtubeMatch[1],
        size: parseVisualMediaSize(youtubeMatch[2]),
      });
      index += 1;
      continue;
    }

    if (/^[-*]\s+/.test(trimmed) || /^\d+[.)]\s+/.test(trimmed)) {
      const ordered = /^\d+[.)]\s+/.test(trimmed);
      const pattern = ordered ? /^\d+[.)]\s+/ : /^[-*]\s+/;
      const items: string[] = [];
      while (index < lines.length && pattern.test((lines[index] ?? '').trim())) {
        items.push((lines[index] ?? '').trim().replace(pattern, ''));
        index += 1;
      }
      blocks.push({ type: 'list', ordered, items });
      continue;
    }

    const paragraphLines: string[] = [];
    while (index < lines.length) {
      const candidate = (lines[index] ?? '').trim();
      if (
        !candidate ||
        /^!\[([^\]]*)\]\(knowledge-asset:([^)]+)\)$/.test(candidate) ||
        /^(#{1,3})\s+/.test(candidate) ||
        candidate.startsWith('> ') ||
        candidate.startsWith('```') ||
        /^:::callout\s+(info|warning|success)\s*$/i.test(candidate) ||
        /^::youtube\s+([A-Za-z0-9_-]{6,20})(?:\s*\|size=(small|medium|large|full))?\s*$/i.test(
          candidate,
        ) ||
        /^[-*]\s+/.test(candidate) ||
        /^\d+[.)]\s+/.test(candidate)
      ) {
        break;
      }

      paragraphLines.push(candidate);
      index += 1;
    }

    blocks.push({ type: 'paragraph', text: paragraphLines.join(' ') });
  }

  return blocks.length > 0 ? blocks : [{ type: 'heading', level: 1, text: '' }];
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isSafeEditorHref(value: string) {
  return /^(https?:\/\/|mailto:)/i.test(value.trim());
}

function renderInlineMarkdown(value: string) {
  const escaped = escapeHtml(value);
  return escaped
    .replace(/\[([^\]]+)]\((https?:\/\/[^)]+|mailto:[^)]+)\)/gi, (_match, label, href) => {
      const safeHref = String(href).trim();
      return isSafeEditorHref(safeHref)
        ? `<a href="${escapeHtml(safeHref)}" target="_blank" rel="noreferrer">${label}</a>`
        : label;
    })
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/_([^_]+)_/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}

function renderEditorHtmlFromMarkdown(source: string, assets: Record<string, MarkdownAsset>) {
  if (!source.trim()) {
    return '';
  }

  return parseVisualBlocks(source)
    .map((block) => {
      if (block.type === 'heading') {
        return `<h${block.level}>${renderInlineMarkdown(block.text)}</h${block.level}>`;
      }

      if (block.type === 'paragraph') {
        return `<p>${renderInlineMarkdown(block.text)}</p>`;
      }

      if (block.type === 'list') {
        const tag = block.ordered ? 'ol' : 'ul';
        return `<${tag}>${block.items
          .map((item) => `<li>${renderInlineMarkdown(item)}</li>`)
          .join('')}</${tag}>`;
      }

      if (block.type === 'quote') {
        return `<blockquote>${renderInlineMarkdown(block.text)}</blockquote>`;
      }

      if (block.type === 'code') {
        return `<pre><code>${escapeHtml(block.text)}</code></pre>`;
      }

      if (block.type === 'callout') {
        return `<aside data-callout-tone="${block.tone}"><strong>${block.tone === 'warning' ? 'Atenção' : block.tone === 'success' ? 'Sucesso' : 'Importante'}</strong><p>${renderInlineMarkdown(block.text)}</p></aside>`;
      }

      if (block.type === 'youtube') {
        return renderYoutubeFigure(block.videoId, block.size);
      }

      const asset = assets[block.assetId];
      const src = asset?.signed_url ? escapeHtml(asset.signed_url) : '';
      const alt = escapeHtml(asset?.alt_text ?? block.alt ?? 'Imagem do artigo');
      const caption = escapeHtml(block.alt || asset?.caption || '');
      return `<figure draggable="true" data-asset-id="${block.assetId}" data-size="${block.size}" contenteditable="false">${src ? `<img src="${src}" alt="${alt}" loading="lazy" />` : '<div class="image-missing">Imagem indisponível no editor</div>'}<figcaption>${caption}</figcaption></figure>`;
    })
    .join('');
}

function inlineNodeToMarkdown(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent ?? '';
  }

  if (!(node instanceof HTMLElement)) {
    return '';
  }

  const content = Array.from(node.childNodes).map(inlineNodeToMarkdown).join('');
  const tag = node.tagName.toLowerCase();

  if (tag === 'strong' || tag === 'b') {
    return content.trim() ? `**${content}**` : '';
  }

  if (tag === 'em' || tag === 'i') {
    return content.trim() ? `_${content}_` : '';
  }

  if (tag === 'code') {
    return content.trim() ? `\`${content}\`` : '';
  }

  if (tag === 'br') {
    return '\n';
  }

  if (tag === 'a') {
    const href = node.getAttribute('href') ?? '';
    return href && isSafeEditorHref(href) ? `[${content}](${href})` : content;
  }

  return content;
}

function blockElementToMarkdown(element: HTMLElement): string {
  const tag = element.tagName.toLowerCase();

  if (/^h[1-3]$/.test(tag)) {
    return `${'#'.repeat(Number(tag.slice(1)))} ${inlineNodeToMarkdown(element).trim()}`;
  }

  if (tag === 'p' || tag === 'div') {
    return inlineNodeToMarkdown(element).trim();
  }

  if (tag === 'blockquote') {
    return inlineNodeToMarkdown(element)
      .split('\n')
      .map((line) => `> ${line.trim()}`)
      .join('\n');
  }

  if (tag === 'pre') {
    return `\`\`\`text\n${element.textContent ?? ''}\n\`\`\``;
  }

  if (tag === 'ul' || tag === 'ol') {
    return Array.from(element.querySelectorAll(':scope > li'))
      .map((item, index) => {
        const marker = tag === 'ol' ? `${index + 1}.` : '-';
        return `${marker} ${inlineNodeToMarkdown(item).trim()}`;
      })
      .join('\n');
  }

  if (tag === 'aside' && element.dataset.calloutTone) {
    const tone = element.dataset.calloutTone;
    const text = Array.from(element.querySelectorAll('p'))
      .map((item) => inlineNodeToMarkdown(item).trim())
      .filter(Boolean)
      .join('\n');
    return `:::callout ${tone}\n${text}\n:::`;
  }

  if (tag === 'figure' && element.dataset.youtubeId) {
    const size = parseVisualMediaSize(element.dataset.size);
    return `::youtube ${element.dataset.youtubeId}|size=${size}`;
  }

  if (tag === 'figure' && element.dataset.assetId) {
    const assetId = element.dataset.assetId;
    const size = (element.dataset.size ?? 'large') as VisualImageSize;
    const caption = element.querySelector('figcaption')?.textContent?.trim() || 'Imagem do artigo';
    return `![${caption}|size=${size}](knowledge-asset:${assetId})`;
  }

  return inlineNodeToMarkdown(element).trim();
}

function editorHtmlToMarkdown(root: HTMLElement) {
  return Array.from(root.children)
    .map((child) => (child instanceof HTMLElement ? blockElementToMarkdown(child) : ''))
    .filter((block) => block.trim().length > 0)
    .join('\n\n');
}

function RichTextArticleEditor({
  assets,
  assetState,
  bodyMd,
  isReadOnly,
  onChange,
  onRegisterMarkdownInserter,
  onDrop,
  onImageButton,
  onPaste,
}: {
  assets: Record<string, MarkdownAsset>;
  assetState: SaveState;
  bodyMd: string;
  isReadOnly: boolean;
  onChange: (nextBodyMd: string) => void;
  onRegisterMarkdownInserter: (inserter: ((markdown: string) => string | null) | null) => void;
  onDrop: (event: DragEvent<HTMLElement>) => void;
  onImageButton: () => void;
  onPaste: (event: ClipboardEvent<HTMLElement>) => void;
}) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const draggedFigureRef = useRef<HTMLElement | null>(null);
  const [selectedFigure, setSelectedFigure] = useState<HTMLElement | null>(null);
  const lastAppliedBodyRef = useRef<string | null>(null);
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);
  const isApplyingHistoryRef = useRef(false);

  function pushHistory(nextBodyMd: string) {
    if (isApplyingHistoryRef.current) {
      return;
    }

    const current = historyRef.current[historyIndexRef.current];
    if (current === nextBodyMd) {
      return;
    }

    const nextHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
    nextHistory.push(nextBodyMd);

    if (nextHistory.length > 80) {
      nextHistory.shift();
    }

    historyRef.current = nextHistory;
    historyIndexRef.current = nextHistory.length - 1;
  }

  function applyMarkdownSnapshot(nextBodyMd: string) {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    isApplyingHistoryRef.current = true;
    editor.innerHTML = renderEditorHtmlFromMarkdown(nextBodyMd, assets);
    lastAppliedBodyRef.current = nextBodyMd;
    onChange(nextBodyMd);
    isApplyingHistoryRef.current = false;
    setSelectedFigure(null);
  }

  function undoEditor() {
    if (historyIndexRef.current <= 0) {
      document.execCommand('undo');
      emitChange();
      return;
    }

    historyIndexRef.current -= 1;
    applyMarkdownSnapshot(historyRef.current[historyIndexRef.current] ?? '');
  }

  function redoEditor() {
    if (historyIndexRef.current >= historyRef.current.length - 1) {
      document.execCommand('redo');
      emitChange();
      return;
    }

    historyIndexRef.current += 1;
    applyMarkdownSnapshot(historyRef.current[historyIndexRef.current] ?? '');
  }

  function emitChange() {
    const editor = editorRef.current;
    if (!editor) {
      return null;
    }
    const nextBodyMd = editorHtmlToMarkdown(editor);
    lastAppliedBodyRef.current = nextBodyMd;
    pushHistory(nextBodyMd);
    onChange(nextBodyMd);
    return nextBodyMd;
  }

  function rememberSelection() {
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection || selection.rangeCount === 0) {
      return;
    }

    const range = selection.getRangeAt(0);
    if (editor.contains(range.commonAncestorContainer)) {
      savedRangeRef.current = range.cloneRange();
    }
  }

  function restoreSelection() {
    const selection = window.getSelection();
    if (!selection || !savedRangeRef.current) {
      editorRef.current?.focus();
      return;
    }

    selection.removeAllRanges();
    selection.addRange(savedRangeRef.current);
  }

  function insertHtmlAtCursor(html: string) {
    const editor = editorRef.current;
    if (!editor) {
      return null;
    }

    editor.focus();
    restoreSelection();
    const selection = window.getSelection();
    const range =
      selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : document.createRange();
    if (!selection?.rangeCount) {
      range.selectNodeContents(editor);
      range.collapse(false);
    }

    const template = document.createElement('template');
    template.innerHTML = html;
    const fragment = template.content;
    const lastNode = fragment.lastChild;
    range.deleteContents();
    range.insertNode(fragment);

    if (lastNode) {
      range.setStartAfter(lastNode);
      range.collapse(true);
      selection?.removeAllRanges();
      selection?.addRange(range);
      savedRangeRef.current = range.cloneRange();
    }

    return emitChange();
  }

  function insertMarkdownAtCursor(markdown: string) {
    return insertHtmlAtCursor(renderEditorHtmlFromMarkdown(markdown, assets));
  }

  function runCommand(command: string, value?: string) {
    if (isReadOnly) {
      return;
    }

    restoreSelection();
    const normalizedValue = command === 'formatBlock' && value ? `<${value.toLowerCase()}>` : value;
    document.execCommand(command, false, normalizedValue);
    rememberSelection();
    emitChange();
  }

  function setImageSize(size: VisualImageSize) {
    if (!selectedFigure) {
      return;
    }
    selectedFigure.dataset.size = size;
    selectedFigure.classList.remove('image-small', 'image-medium', 'image-large', 'image-full');
    selectedFigure.classList.add(`image-${size}`);
    emitChange();
  }

  const selectedFigureKind = selectedFigure?.dataset.youtubeId ? 'video' : 'image';

  function moveSelectedImage(direction: 'up' | 'down') {
    if (!selectedFigure) {
      return;
    }

    const sibling =
      direction === 'up'
        ? selectedFigure.previousElementSibling
        : selectedFigure.nextElementSibling;
    if (!sibling) {
      return;
    }

    if (direction === 'up') {
      sibling.before(selectedFigure);
    } else {
      sibling.after(selectedFigure);
    }
    emitChange();
  }

  function removeSelectedImage() {
    if (!selectedFigure) {
      return;
    }
    selectedFigure.remove();
    setSelectedFigure(null);
    emitChange();
  }

  function insertCallout(tone: 'info' | 'warning' | 'success') {
    insertHtmlAtCursor(
      `<aside data-callout-tone="${tone}"><strong>${tone === 'warning' ? 'Atenção' : tone === 'success' ? 'Sucesso' : 'Importante'}</strong><p>Escreva a observação do artigo.</p></aside>`,
    );
  }

  function insertYoutube() {
    const value = window.prompt('Cole uma URL do YouTube ou youtu.be');
    if (!value) {
      return;
    }
    const videoId = extractYouTubeVideoId(value);
    if (!videoId) {
      return;
    }
    insertHtmlAtCursor(renderYoutubeFigure(videoId, 'large'));
  }

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || lastAppliedBodyRef.current === bodyMd) {
      return;
    }

    const isFocused = document.activeElement === editor || editor.contains(document.activeElement);
    if (isFocused) {
      return;
    }

    editor.innerHTML = renderEditorHtmlFromMarkdown(bodyMd, assets);
    lastAppliedBodyRef.current = bodyMd;
    pushHistory(bodyMd);
  }, [assets, bodyMd]);

  useEffect(() => {
    onRegisterMarkdownInserter(insertMarkdownAtCursor);
    return () => onRegisterMarkdownInserter(null);
  });

  return (
    <div
      className={cx(
        'relative flex min-h-0 flex-1 flex-col transition focus-within:bg-[rgba(234,242,255,0.05)]',
        assetState === 'saving' && 'bg-[rgba(234,242,255,0.2)]',
      )}
    >
      <div className="flex h-11 shrink-0 items-center gap-1.5 overflow-x-auto border-b border-[#E8EEF7] bg-white px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <select
          className="mr-1 h-8 rounded-xl border border-[color:var(--color-border)] bg-white px-3 text-[0.76rem] font-semibold text-[color:var(--color-brand-navy)] outline-none"
          defaultValue="p"
          onChange={(event) => {
            runCommand('formatBlock', event.target.value);
            event.currentTarget.value = 'p';
          }}
          title="Estilo do bloco selecionado"
        >
          <option value="p">Parágrafo</option>
          <option value="h1">Título H1</option>
          <option value="h2">Título H2</option>
          <option value="h3">Título H3</option>
          <option value="blockquote">Citação</option>
          <option value="pre">Código</option>
        </select>
        <ToolbarButton onClick={() => runCommand('formatBlock', 'h1')} title="H1">
          H1
        </ToolbarButton>
        <ToolbarButton onClick={() => runCommand('formatBlock', 'h2')} title="H2">
          H2
        </ToolbarButton>
        <ToolbarButton onClick={() => runCommand('formatBlock', 'h3')} title="H3">
          H3
        </ToolbarButton>
        <span className="mx-1 h-7 w-px bg-[color:var(--color-border)]" />
        <ToolbarButton onClick={() => runCommand('bold')} title="Negrito">
          B
        </ToolbarButton>
        <ToolbarButton onClick={() => runCommand('italic')} title="Itálico">
          <span className="italic">I</span>
        </ToolbarButton>
        <ToolbarButton onClick={() => runCommand('underline')} title="Sublinhado">
          <span className="underline">U</span>
        </ToolbarButton>
        <span className="mx-1 h-7 w-px bg-[color:var(--color-border)]" />
        <ToolbarButton
          onClick={() => runCommand('insertUnorderedList')}
          title="Lista com marcadores"
        >
          •
        </ToolbarButton>
        <ToolbarButton onClick={() => runCommand('insertOrderedList')} title="Lista numerada">
          1.
        </ToolbarButton>
        <ToolbarButton onClick={() => runCommand('outdent')} title="Reduzir recuo">
          ←
        </ToolbarButton>
        <ToolbarButton onClick={() => runCommand('indent')} title="Aumentar recuo">
          →
        </ToolbarButton>
        <ToolbarButton onClick={() => runCommand('justifyLeft')} title="Alinhar à esquerda">
          ≡
        </ToolbarButton>
        <ToolbarButton onClick={() => runCommand('justifyCenter')} title="Centralizar">
          ≣
        </ToolbarButton>
        <ToolbarButton onClick={() => runCommand('formatBlock', 'blockquote')} title="Citação">
          ❝
        </ToolbarButton>
        <ToolbarButton
          onClick={() => {
            const href = window.prompt('Cole a URL do link');
            if (href && isSafeEditorHref(href)) {
              runCommand('createLink', href);
            }
          }}
          title="Link"
        >
          🔗
        </ToolbarButton>
        <ToolbarButton
          disabled={assetState === 'saving'}
          onClick={onImageButton}
          title="Inserir imagem no corpo"
        >
          Imagem
        </ToolbarButton>
        <ToolbarButton onClick={insertYoutube} title="Inserir vídeo YouTube">
          Vídeo
        </ToolbarButton>
        <ToolbarButton onClick={() => insertCallout('info')} title="Nota">
          Nota
        </ToolbarButton>
        <ToolbarButton onClick={() => runCommand('formatBlock', 'pre')} title="Código">
          &lt;/&gt;
        </ToolbarButton>
        <span className="ml-auto" />
        <ToolbarButton onClick={undoEditor} title="Desfazer">
          ↶
        </ToolbarButton>
        <ToolbarButton onClick={redoEditor} title="Refazer">
          ↷
        </ToolbarButton>
      </div>

      {selectedFigure ? (
        <div className="absolute left-1/2 top-[58px] z-20 flex -translate-x-1/2 items-center gap-2 rounded-2xl border border-[color:var(--color-border)] bg-white px-2 py-2 shadow-[0_18px_42px_rgba(20,31,71,0.14)]">
          {(['small', 'medium', 'large', 'full'] as const).map((size) => (
            <button
              className={cx(
                'rounded-xl px-3 py-2 text-[0.72rem] font-bold',
                selectedFigure.dataset.size === size
                  ? 'bg-[color:var(--color-brand-blue)] text-white'
                  : 'text-[color:var(--color-brand-navy)] hover:bg-[color:var(--color-surface)]',
              )}
              key={size}
              onClick={() => setImageSize(size)}
              type="button"
            >
              {size === 'small'
                ? 'Pequena'
                : size === 'medium'
                  ? 'Média'
                  : size === 'large'
                    ? 'Grande'
                    : 'Largura total'}
            </button>
          ))}
          <span className="mx-1 h-7 w-px bg-[color:var(--color-border)]" />
          <button
            className="rounded-xl px-3 py-2 text-[0.72rem] font-bold text-[color:var(--color-brand-navy)] hover:bg-[color:var(--color-surface)]"
            onClick={() => moveSelectedImage('up')}
            type="button"
          >
            Mover acima
          </button>
          <button
            className="rounded-xl px-3 py-2 text-[0.72rem] font-bold text-[color:var(--color-brand-navy)] hover:bg-[color:var(--color-surface)]"
            onClick={() => moveSelectedImage('down')}
            type="button"
          >
            Mover abaixo
          </button>
          <button
            className="rounded-xl px-3 py-2 text-[0.72rem] font-bold text-red-600 hover:bg-red-50"
            onClick={removeSelectedImage}
            type="button"
          >
            {selectedFigureKind === 'video' ? 'Remover vídeo' : 'Remover imagem'}
          </button>
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-auto bg-white">
        <style>
          {`
            .knowledge-rich-editor:empty::before {
              color: #98A3B8;
              content: 'Comece a escrever o artigo aqui. Cole prints no ponto exato da instrução.';
              font-size: 15px;
            }
            .knowledge-rich-editor h1 {
              color: #162443;
              font-size: 28px;
              font-weight: 800;
              letter-spacing: -0.03em;
              line-height: 1.18;
              margin: 0 0 18px;
            }
            .knowledge-rich-editor h2 {
              color: #162443;
              font-size: 21px;
              font-weight: 800;
              line-height: 1.25;
              margin: 28px 0 10px;
            }
            .knowledge-rich-editor h3 {
              color: #162443;
              font-size: 18px;
              font-weight: 750;
              line-height: 1.35;
              margin: 22px 0 8px;
            }
            .knowledge-rich-editor p {
              color: #24324F;
              font-size: 15px;
              line-height: 1.72;
              margin: 0 0 16px;
            }
            .knowledge-rich-editor ul,
            .knowledge-rich-editor ol {
              color: #24324F;
              font-size: 15px;
              line-height: 1.7;
              margin: 0 0 18px 0;
              padding-left: 24px;
            }
            .knowledge-rich-editor li {
              margin: 5px 0;
            }
            .knowledge-rich-editor blockquote,
            .knowledge-rich-editor aside[data-callout-tone] {
              border: 1px solid rgba(47, 107, 255, 0.25);
              border-radius: 18px;
              background: rgba(47, 107, 255, 0.06);
              color: #24324F;
              margin: 22px 0;
              padding: 14px 16px;
            }
            .knowledge-rich-editor aside[data-callout-tone='warning'] {
              border-color: #F5B83D;
              background: #FFF4D9;
            }
            .knowledge-rich-editor aside[data-callout-tone='success'] {
              border-color: #22C55E;
              background: #EAF9F0;
            }
            .knowledge-rich-editor aside[data-callout-tone] strong {
              color: #162443;
              display: block;
              font-size: 13px;
              margin-bottom: 6px;
            }
            .knowledge-rich-editor a {
              color: #2F6BFF;
              font-weight: 700;
              text-decoration: underline;
              text-underline-offset: 4px;
            }
            .knowledge-rich-editor pre {
              background: #0b153c;
              border-radius: 18px;
              color: #f8fafc;
              font-size: 13px;
              line-height: 1.65;
              margin: 22px 0;
              overflow: auto;
              padding: 16px;
            }
            .knowledge-rich-editor figure[data-asset-id],
            .knowledge-rich-editor figure[data-youtube-id] {
              margin: 24px 0;
              position: relative;
            }
            .knowledge-rich-editor figure[data-asset-id][data-size='small'],
            .knowledge-rich-editor figure[data-youtube-id][data-size='small'] {
              max-width: 360px;
            }
            .knowledge-rich-editor figure[data-asset-id][data-size='medium'],
            .knowledge-rich-editor figure[data-youtube-id][data-size='medium'] {
              max-width: 520px;
            }
            .knowledge-rich-editor figure[data-asset-id][data-size='large'],
            .knowledge-rich-editor figure[data-youtube-id][data-size='large'] {
              max-width: 720px;
            }
            .knowledge-rich-editor figure[data-asset-id][data-size='full'],
            .knowledge-rich-editor figure[data-youtube-id][data-size='full'] {
              max-width: 100%;
            }
            .knowledge-rich-editor figure[data-asset-id] img,
            .knowledge-rich-editor .image-missing {
              border: 1px solid #DCE4F2;
              border-radius: 16px;
              display: block;
              max-height: 560px;
              object-fit: contain;
              width: 100%;
            }
            .knowledge-rich-editor figure[data-asset-id].image-dragging,
            .knowledge-rich-editor figure[data-youtube-id].image-dragging {
              opacity: 0.55;
            }
            .knowledge-rich-editor figure[data-asset-id]:focus,
            .knowledge-rich-editor figure[data-asset-id]:has(img:hover),
            .knowledge-rich-editor figure[data-youtube-id]:focus,
            .knowledge-rich-editor figure[data-youtube-id]:has(.youtube-card:hover) {
              outline: 2px solid #2F6BFF;
              outline-offset: 3px;
            }
            .knowledge-rich-editor figcaption {
              color: #6B7892;
              font-size: 12px;
              font-style: italic;
              margin-top: 8px;
              text-align: center;
            }
            .knowledge-rich-editor figure[data-youtube-id] {
              cursor: grab;
            }
            .knowledge-rich-editor .youtube-card {
              align-items: center;
              aspect-ratio: 16 / 9;
              background:
                radial-gradient(circle at 50% 38%, rgba(47, 107, 255, 0.28), transparent 24%),
                linear-gradient(135deg, #07113f 0%, #090f2d 52%, #111944 100%);
              border: 1px solid rgba(255, 255, 255, 0.1);
              border-radius: 20px;
              box-shadow: inset 0 1px 0 rgba(255,255,255,0.08), 0 18px 42px rgba(20,31,71,0.12);
              color: white;
              display: grid;
              gap: 8px;
              padding: 24px;
              place-items: center;
              text-align: center;
              width: 100%;
            }
            .knowledge-rich-editor .youtube-card__play {
              align-items: center;
              background: #ff0033;
              border-radius: 999px;
              box-shadow: 0 16px 36px rgba(255, 0, 51, 0.28);
              display: inline-flex;
              font-size: 16px;
              height: 48px;
              justify-content: center;
              line-height: 1;
              width: 64px;
            }
            .knowledge-rich-editor .youtube-card strong {
              font-size: 15px;
              letter-spacing: -0.01em;
            }
            .knowledge-rich-editor .youtube-card small {
              color: rgba(255, 255, 255, 0.72);
              font-size: 12px;
              word-break: break-all;
            }
          `}
        </style>
        <div
          className="knowledge-rich-editor min-h-full max-w-[980px] px-10 py-8 text-[#24324F] outline-none xl:px-12"
          contentEditable={!isReadOnly}
          onBlur={rememberSelection}
          onClick={(event) => {
            const figure = (event.target as HTMLElement).closest(
              'figure[data-asset-id], figure[data-youtube-id]',
            );
            setSelectedFigure(figure as HTMLElement | null);
            rememberSelection();
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragStart={(event) => {
            const figure = (event.target as HTMLElement).closest(
              'figure[data-asset-id], figure[data-youtube-id]',
            );
            if (figure instanceof HTMLElement) {
              draggedFigureRef.current = figure;
              figure.classList.add('image-dragging');
              event.dataTransfer.effectAllowed = 'move';
              event.dataTransfer.setData('text/plain', 'knowledge-asset-move');
            }
          }}
          onDrop={(event) => {
            if (event.dataTransfer.files.length > 0) {
              onDrop(event);
              return;
            }

            const dragged = draggedFigureRef.current;
            if (!dragged) {
              return;
            }

            event.preventDefault();
            const range =
              document.caretRangeFromPoint?.(event.clientX, event.clientY) ?? savedRangeRef.current;
            if (range) {
              const clone = dragged.cloneNode(true);
              dragged.remove();
              (clone as HTMLElement).classList.remove('image-dragging');
              range.insertNode(clone);
              draggedFigureRef.current = null;
              emitChange();
            }
          }}
          onDragEnd={() => {
            draggedFigureRef.current?.classList.remove('image-dragging');
            draggedFigureRef.current = null;
          }}
          onInput={emitChange}
          onKeyDown={(event) => {
            const key = event.key.toLowerCase();
            const isModifier = event.ctrlKey || event.metaKey;

            if (isModifier && key === 'z') {
              event.preventDefault();
              if (event.shiftKey) {
                redoEditor();
              } else {
                undoEditor();
              }
              return;
            }

            if (isModifier && key === 'y') {
              event.preventDefault();
              redoEditor();
              return;
            }

            if (isModifier && key === 'k') {
              event.preventDefault();
              const href = window.prompt('Cole a URL do link');
              if (href && isSafeEditorHref(href)) {
                runCommand('createLink', href);
              }
              return;
            }

            if (isModifier && key === 's') {
              event.preventDefault();
              editorRef.current?.closest('form')?.requestSubmit();
              return;
            }

            if (event.key === 'Tab') {
              event.preventDefault();
              runCommand(event.shiftKey ? 'outdent' : 'indent');
            }
          }}
          onKeyUp={rememberSelection}
          onMouseUp={rememberSelection}
          onPaste={(event) => {
            const hasImage =
              Array.from(event.clipboardData.files).some((file) =>
                file.type.startsWith('image/'),
              ) ||
              Array.from(event.clipboardData.items).some(
                (item) => item.kind === 'file' && item.type.startsWith('image/'),
              );
            if (hasImage) {
              onPaste(event);
              return;
            }

            event.preventDefault();
            restoreSelection();
            const pastedText = event.clipboardData.getData('text/plain');
            const paragraphs = pastedText
              .split(/\n{2,}/)
              .map((paragraph) => paragraph.trim())
              .filter(Boolean);
            if (paragraphs.length > 1) {
              insertHtmlAtCursor(
                paragraphs
                  .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br />')}</p>`)
                  .join(''),
              );
              return;
            }

            document.execCommand('insertText', false, pastedText);
            emitChange();
          }}
          ref={editorRef}
          role="textbox"
          suppressContentEditableWarning
          tabIndex={0}
        />
      </div>
    </div>
  );
}

export function KnowledgeArticleEditorPage() {
  const { articleId: routeArticleId } = useParams<{ articleId?: string }>();
  const [phase, setPhase] = useState<PagePhase>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [spaces, setSpaces] = useState<AdminKnowledgeSpaceRow[]>([]);
  const [categories, setCategories] = useState<AdminKnowledgeCategoryV2Row[]>([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState('');
  const [articleId, setArticleId] = useState<string | null>(null);
  const [articleDetail, setArticleDetail] = useState<AdminKnowledgeArticleDetailV2Row | null>(null);
  const [sourcePath, setSourcePath] = useState<string | null>(null);
  const [sourceHash, setSourceHash] = useState<string | null>(null);
  const [isEditorialRevision, setIsEditorialRevision] = useState(false);
  const [advisory, setAdvisory] = useState<AdminKnowledgeArticleReviewAdvisoryRow | null>(null);
  const [assets, setAssets] = useState<AdminKnowledgeArticleAssetRow[]>([]);
  const [form, setForm] = useState<ArticleEditorForm>(EMPTY_FORM);
  const [status, setStatus] = useState<ArticleEditorStatus>('draft');
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [submitState, setSubmitState] = useState<SaveState>('idle');
  const [reviewEvidenceState, setReviewEvidenceState] = useState<SaveState>('idle');
  const [assetState, setAssetState] = useState<SaveState>('idle');
  const [publishState, setPublishState] = useState<SaveState>('idle');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [metadataCollapsed, setMetadataCollapsed] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const editorMarkdownInserterRef = useRef<((markdown: string) => string | null) | null>(null);
  const isEditMode = Boolean(routeArticleId);

  const selectedSpace = spaces.find((space) => space.id === selectedSpaceId) ?? null;
  const selectedCategory = categories.find((category) => category.id === form.categoryId) ?? null;
  const assetMap = useMemo(() => buildAssetMap(assets), [assets]);
  const isReadOnly = status === 'archived';
  const saveButtonLabel = isEditorialRevision
    ? 'Salvar revisão'
    : status === 'draft'
      ? 'Salvar rascunho'
      : 'Salvar alterações';
  const bodyPlain = getBodyWithoutMarkdown(form.bodyMd);
  const publishBlocker = publicPublishBlocker(advisory, form.visibility);
  const needsPublicEvidence = form.visibility === 'public';
  const publicEvidenceComplete = needsPublicEvidence && !publishBlocker;
  const advisoryHumanConfirmations = normalizeHumanConfirmations(advisory?.human_confirmations);
  const checklist = {
    title: form.title.trim().length >= 8 && form.title.length <= TITLE_LIMIT,
    summary: form.summary.trim().length >= 12 && form.summary.length <= SUMMARY_LIMIT,
    body: bodyPlain.length >= 80,
    links: hasReviewedLink(form.bodyMd),
    assets: hasAssetReference(form.bodyMd, assets),
    category: Boolean(form.categoryId),
    ready: false,
  };
  checklist.ready = checklist.title && checklist.summary && checklist.body && checklist.category;
  const publicationChecklist = [
    { action: 'title', done: checklist.title, label: 'Título revisado' },
    { action: 'summary', done: checklist.summary, label: 'Resumo revisado' },
    { action: 'body', done: checklist.body, label: 'Corpo revisado' },
    {
      action: 'category',
      done: checklist.category,
      label: 'Categoria confirmada',
    },
    {
      action: 'visibility',
      done: Boolean(form.visibility),
      label: 'Visibilidade confirmada',
    },
    {
      action: 'evidence',
      done:
        form.visibility !== 'public' ||
        advisoryHumanConfirmations.no_sensitive_data_exposed === true,
      label: 'Sem dados sensíveis expostos',
    },
    {
      action: 'publish-readiness',
      done: form.visibility !== 'public' || advisoryHumanConfirmations.ready_for_publish === true,
      label: 'Pronto para publicação',
    },
  ];
  const publicationChecklistDone = publicationChecklist.filter((item) => item.done).length;
  const missingRequired = [
    !checklist.title ? 'titulo claro' : null,
    !checklist.summary ? 'resumo curto' : null,
    !checklist.body ? 'conteudo completo' : null,
    !checklist.category ? 'categoria' : null,
  ].filter(Boolean);

  useEffect(() => {
    let cancelled = false;

    async function loadInitialData() {
      try {
        setPhase('loading');
        setErrorMessage(null);
        const loadedSpaces = await listAdminKnowledgeSpaces();

        if (cancelled) {
          return;
        }

        if (loadedSpaces.length === 0) {
          setSpaces([]);
          setPhase('contract-unavailable');
          return;
        }

        let primarySpace =
          loadedSpaces.find((space) => space.slug === 'genius') ??
          loadedSpaces.find((space) => space.is_primary) ??
          loadedSpaces[0];

        let detail: AdminKnowledgeArticleDetailV2Row | null = null;
        let nextForm: ArticleEditorForm | null = null;
        let nextStatus: ArticleEditorStatus = 'draft';
        let nextIsEditorialRevision = false;

        if (routeArticleId) {
          detail = await getAdminKnowledgeArticleDetailV2(routeArticleId);

          if (!detail) {
            throw new Error('Artigo não encontrado para edição.');
          }

          primarySpace =
            loadedSpaces.find((space) => space.id === detail?.knowledge_space_id) ?? primarySpace;

          if (detail.status === 'published') {
            if (!detail.editorial_draft) {
              await beginKnowledgeArticleEditorialRevisionV2({
                p_article_id: detail.id,
                p_knowledge_space_id: detail.knowledge_space_id,
              });
              detail = await getAdminKnowledgeArticleDetailV2(routeArticleId);
            }

            if (!detail) {
              throw new Error('Artigo não encontrado após iniciar revisão editorial.');
            }

            nextIsEditorialRevision = true;
            nextForm = detail?.editorial_draft
              ? buildArticleFormFromEditorialDraft(detail.editorial_draft, detail)
              : buildArticleFormFromDetail(detail);
          } else {
            nextForm = buildArticleFormFromDetail(detail);
          }

          nextStatus =
            detail?.status === 'published' ||
            detail?.status === 'archived' ||
            detail?.status === 'review'
              ? detail.status
              : 'draft';
        }

        const loadedCategories = await listAdminKnowledgeCategoriesV2(primarySpace.id);
        const loadedAssets =
          routeArticleId && detail ? await listAdminKnowledgeArticleAssets(detail.id) : [];
        const loadedAdvisories =
          routeArticleId && detail
            ? await listAdminKnowledgeArticleReviewAdvisories(primarySpace.id)
            : [];
        const loadedAdvisory =
          routeArticleId && detail
            ? (loadedAdvisories.find((item) => item.article_id === detail.id) ?? null)
            : null;

        if (cancelled) {
          return;
        }

        setSpaces(loadedSpaces);
        setSelectedSpaceId(primarySpace.id);
        setCategories(loadedCategories);
        setArticleId(detail?.id ?? null);
        setArticleDetail(detail);
        setSourcePath(detail?.source_path ?? null);
        setSourceHash(detail?.source_hash ?? null);
        setIsEditorialRevision(nextIsEditorialRevision);
        setAdvisory(loadedAdvisory);
        setStatus(nextStatus);
        setAssets(loadedAssets);
        setSlugTouched(Boolean(routeArticleId));
        setForm((current) =>
          nextForm
            ? nextForm
            : {
                ...current,
                categoryId: current.categoryId || loadedCategories[0]?.id || '',
              },
        );
        setPhase('ready');
      } catch (error) {
        if (cancelled) {
          return;
        }

        const classified = classifyAdminError(
          error,
          'Falha ao carregar contratos administrativos da base de conhecimento.',
        );
        setErrorMessage(classified.message);
        setPhase(classified.kind === 'contract-unavailable' ? 'contract-unavailable' : 'error');
      }
    }

    void loadInitialData();

    return () => {
      cancelled = true;
    };
  }, [routeArticleId]);

  async function handleSpaceChange(nextSpaceId: string) {
    setSelectedSpaceId(nextSpaceId);
    setFeedback(null);
    try {
      const loadedCategories = await listAdminKnowledgeCategoriesV2(nextSpaceId);
      setCategories(loadedCategories);
      setForm((current) => ({
        ...current,
        categoryId: loadedCategories.some((category) => category.id === current.categoryId)
          ? current.categoryId
          : loadedCategories[0]?.id || '',
      }));
      if (articleId) {
        await refreshAdvisory(articleId, nextSpaceId);
      } else {
        setAdvisory(null);
      }
    } catch (error) {
      const classified = classifyAdminError(
        error,
        'Falha ao trocar o espaço publico da base de conhecimento.',
      );
      setFeedback(classified.message);
    }
  }

  function updateForm(partial: Partial<ArticleEditorForm>) {
    setSaveState('idle');
    setSubmitState('idle');
    setPublishState('idle');
    setReviewEvidenceState('idle');
    setFeedback(null);
    setForm((current) => ({ ...current, ...partial }));
  }

  function handleTitleChange(event: ChangeEvent<HTMLInputElement>) {
    const nextTitle = event.target.value;
    setForm((current) => ({
      ...current,
      title: nextTitle,
      slug: slugTouched ? current.slug : slugify(nextTitle),
    }));
    setSaveState('idle');
    setReviewEvidenceState('idle');
    setFeedback(null);
  }

  function handleSlugChange(event: ChangeEvent<HTMLInputElement>) {
    setSlugTouched(true);
    updateForm({ slug: slugify(event.target.value) });
  }

  function insertSnippet(before: string, after = '', fallback = 'texto') {
    if (isReadOnly) {
      return form.bodyMd;
    }

    const textarea = bodyRef.current;
    const currentBody = form.bodyMd;

    if (!textarea) {
      const nextBody = `${currentBody}${before}${fallback}${after}`;
      updateForm({ bodyMd: nextBody });
      return nextBody;
    }

    const selectionStart = textarea.selectionStart;
    const selectionEnd = textarea.selectionEnd;
    const selected = currentBody.slice(selectionStart, selectionEnd) || fallback;
    const nextBody =
      currentBody.slice(0, selectionStart) +
      before +
      selected +
      after +
      currentBody.slice(selectionEnd);

    updateForm({ bodyMd: nextBody });

    window.requestAnimationFrame(() => {
      textarea.focus();
      const cursorPosition = selectionStart + before.length + selected.length + after.length;
      textarea.setSelectionRange(cursorPosition, cursorPosition);
    });

    return nextBody;
  }

  async function refreshAssets(nextArticleId: string) {
    try {
      const loadedAssets = await listAdminKnowledgeArticleAssets(nextArticleId);
      setAssets(loadedAssets);
    } catch (error) {
      const classified = classifyAdminError(
        error,
        'Falha ao carregar assets vinculados ao artigo.',
      );
      setFeedback(classified.message);
    }
  }

  async function refreshAdvisory(nextArticleId: string, nextSpaceId = selectedSpaceId) {
    if (!nextSpaceId) {
      setAdvisory(null);
      return null;
    }

    try {
      const loadedAdvisories = await listAdminKnowledgeArticleReviewAdvisories(nextSpaceId);
      const nextAdvisory =
        loadedAdvisories.find((item) => item.article_id === nextArticleId) ?? null;
      setAdvisory(nextAdvisory);
      return nextAdvisory;
    } catch (error) {
      const classified = classifyAdminError(
        error,
        'Falha ao carregar a evidência editorial do artigo.',
      );
      setFeedback(classified.message);
      return null;
    }
  }

  async function ensureArticleForAsset() {
    if (articleId && selectedSpace) {
      return articleId;
    }

    const savedArticleId = await saveDraft({ allowIncompleteBody: true });
    return savedArticleId;
  }

  async function uploadAndInsertAsset(file: File, sourceKind: 'upload' | 'paste') {
    if (isReadOnly) {
      setAssetState('error');
      setFeedback('Artigo arquivado é somente leitura nesta tela.');
      return;
    }

    if (!selectedSpace) {
      setAssetState('error');
      setFeedback('Selecione um espaço público antes de anexar imagens.');
      return;
    }

    const savedArticleId = await ensureArticleForAsset();
    if (!savedArticleId) {
      setAssetState('error');
      setFeedback(
        'Salve um rascunho válido antes de anexar imagens. O upload precisa de um artigo governado.',
      );
      return;
    }

    setAssetState('saving');
    setFeedback(null);

    try {
      const uploadedAsset = await uploadKnowledgeArticleAssetFile({
        articleId: savedArticleId,
        knowledgeSpaceId: selectedSpace.id,
        file,
        sourceKind,
      });
      await refreshAssets(savedArticleId);
      const assetMarkdown = buildAssetMarkdown(uploadedAsset);
      const nextBody =
        editorMarkdownInserterRef.current?.(assetMarkdown) ?? insertSnippet(assetMarkdown, '', '');
      await saveDraft({
        allowIncompleteBody: true,
        bodyMd: nextBody,
        articleId: savedArticleId,
      });
      setAssetState('saved');
      setFeedback(
        'Imagem enviada para o bucket governado e inserida no corpo como referência segura.',
      );
    } catch (error) {
      const classified = classifyAdminError(error, 'Falha ao anexar a imagem ao artigo.');
      setAssetState('error');
      setFeedback(classified.message);
    }
  }

  async function handleAssetFiles(fileList: FileList | File[], sourceKind: 'upload' | 'paste') {
    const files = Array.from(fileList).filter((file) => file.type.startsWith('image/'));

    if (files.length === 0) {
      setAssetState('error');
      setFeedback(
        'Use imagens PNG, JPG, WEBP ou GIF. PDFs ainda não têm contrato de asset nesta V1.',
      );
      return;
    }

    for (const file of files) {
      await uploadAndInsertAsset(file, sourceKind);
    }
  }

  function handleBodyPaste(event: ClipboardEvent<HTMLElement>) {
    if (isReadOnly) {
      return;
    }

    const imageFiles = [
      ...Array.from(event.clipboardData.files),
      ...Array.from(event.clipboardData.items)
        .filter((item) => item.kind === 'file' && item.type.startsWith('image/'))
        .map((item) => item.getAsFile())
        .filter((file): file is File => Boolean(file)),
    ].filter((file) => file.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      return;
    }

    event.preventDefault();
    void handleAssetFiles(imageFiles, 'paste');
  }

  function handleAssetDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    if (isReadOnly) {
      return;
    }
    void handleAssetFiles(event.dataTransfer.files, 'upload');
  }

  function handleRemoveAssetReference(assetId: string) {
    updateForm({
      bodyMd: form.bodyMd
        .replace(new RegExp(`\\n*!\\[[^\\]]*]\\(knowledge-asset:${assetId}\\)\\n*`, 'gi'), '\n')
        .replace(new RegExp(`\\n*knowledge-asset:${assetId}\\n*`, 'gi'), '\n'),
    });
  }

  function validateDraft(options?: { bodyMd?: string; allowIncompleteBody?: boolean }) {
    if (!selectedSpace) {
      return 'Selecione um espaço publico antes de salvar.';
    }

    const effectiveBodyPlain = getBodyWithoutMarkdown(options?.bodyMd ?? form.bodyMd);
    const requiredFields = [
      !checklist.title ? 'titulo claro' : null,
      !checklist.summary ? 'resumo curto' : null,
      !checklist.category ? 'categoria' : null,
      !options?.allowIncompleteBody && effectiveBodyPlain.length < 80 ? 'conteudo completo' : null,
    ].filter(Boolean);

    if (requiredFields.length > 0) {
      return `Complete os campos obrigatorios antes de salvar: ${requiredFields.join(', ')}.`;
    }

    if (form.slug.trim().length === 0 || form.slug.length > SLUG_LIMIT) {
      return 'Revise o slug do artigo antes de salvar.';
    }

    return null;
  }

  async function saveDraft(options?: {
    allowIncompleteBody?: boolean;
    bodyMd?: string;
    articleId?: string;
  }) {
    if (isReadOnly) {
      setSaveState('error');
      setFeedback('Artigo arquivado é somente leitura nesta tela.');
      return null;
    }

    const bodyMd = options?.bodyMd ?? form.bodyMd;
    const targetArticleId = options?.articleId ?? articleId;
    const validationError = validateDraft({
      allowIncompleteBody: options?.allowIncompleteBody,
      bodyMd,
    });

    if (validationError) {
      setSaveState('error');
      setFeedback(validationError);
      return null;
    }

    setSaveState('saving');
    setFeedback(null);

    try {
      const activeSpace = selectedSpace;
      if (!activeSpace) {
        throw new Error('Selecione um espaço publico antes de salvar.');
      }

      const articlePayload = {
        p_title: form.title.trim(),
        p_slug: slugify(form.slug || form.title),
        p_summary: normalizeOptionalText(form.summary),
        p_body_md: bodyMd.trim(),
        p_category_id: normalizeOptionalText(form.categoryId),
        p_visibility: form.visibility,
        p_knowledge_space_id: activeSpace.id,
        p_source_path: sourcePath,
        p_source_hash: sourceHash,
      };

      const saved =
        isEditorialRevision && targetArticleId
          ? await updateKnowledgeArticleEditorialRevisionV2({
              p_article_id: targetArticleId,
              p_knowledge_space_id: activeSpace.id,
              p_title: articlePayload.p_title,
              p_slug: articlePayload.p_slug,
              p_summary: articlePayload.p_summary,
              p_body_md: articlePayload.p_body_md,
              p_category_id: articlePayload.p_category_id,
              p_visibility: articlePayload.p_visibility,
              p_source_path: articlePayload.p_source_path,
              p_source_hash: articlePayload.p_source_hash,
            })
          : targetArticleId
            ? await updateKnowledgeArticleDraftV2({
                ...articlePayload,
                p_article_id: targetArticleId,
              })
            : await createKnowledgeArticleDraftV2({
                ...articlePayload,
                p_tenant_id: activeSpace.owner_tenant_id ?? null,
              });

      const savedArticleId = 'article_id' in saved ? saved.article_id : saved.id;
      setArticleId(savedArticleId);
      setStatus((current) =>
        current === 'published' || current === 'archived' || current === 'review'
          ? current
          : 'draft',
      );
      setSaveState('saved');
      setFeedback(
        isEditorialRevision
          ? 'Revisão editorial salva por contrato administrativo. Nada foi publicado.'
          : 'Rascunho salvo por contrato administrativo. Nada foi publicado.',
      );
      await refreshAssets(savedArticleId);
      await refreshAdvisory(savedArticleId, activeSpace.id);
      return savedArticleId;
    } catch (error) {
      const classified = classifyAdminError(error, 'Falha ao salvar o rascunho do artigo.');
      setSaveState('error');
      setFeedback(classified.message);
      return null;
    }
  }

  async function handleSaveDraft(event?: FormEvent) {
    event?.preventDefault();
    await saveDraft();
  }

  async function handleSubmitForReview() {
    if (isReadOnly) {
      setSubmitState('error');
      setFeedback('Artigo arquivado é somente leitura nesta tela.');
      return;
    }

    setSubmitState('saving');
    setFeedback(null);

    if (isEditorialRevision) {
      await saveDraft();
      setSubmitState('error');
      setFeedback(
        'A revisão de artigo publicado foi salva. Este contrato não possui submissão separada para review; a publicação segue pelo gate editorial existente.',
      );
      return;
    }

    if (status === 'review') {
      setSubmitState('saved');
      setFeedback('Este artigo já está em revisão interna. Nada foi publicado.');
      return;
    }

    if (!checklist.ready) {
      setSubmitState('error');
      setFeedback(`Para enviar para revisão, complete primeiro: ${missingRequired.join(', ')}.`);
      return;
    }

    const savedArticleId = articleId ?? (await saveDraft());
    if (!savedArticleId || !selectedSpace) {
      setSubmitState('error');
      return;
    }

    try {
      await submitKnowledgeArticleForReviewV2({
        p_article_id: savedArticleId,
        p_knowledge_space_id: selectedSpace.id,
      });
      setStatus('review');
      await refreshAdvisory(savedArticleId, selectedSpace.id);
      setSubmitState('saved');
      setFeedback(
        'Artigo enviado para revisão interna. Publicação continua bloqueada pelo gate editorial.',
      );
    } catch (error) {
      const classified = classifyAdminError(
        error,
        'Falha ao enviar o artigo para revisão editorial.',
      );
      setSubmitState('error');
      setFeedback(classified.message);
    }
  }

  async function preparePublicEvidenceForPublish(options?: { silent?: boolean }) {
    if (!selectedSpace) {
      setReviewEvidenceState('error');
      setFeedback('Selecione um espaço público antes de preparar a publicação.');
      return null;
    }

    if (form.visibility !== 'public') {
      setReviewEvidenceState('error');
      setFeedback('Altere a visibilidade para Público antes de preparar publicação pública.');
      return null;
    }

    setReviewEvidenceState('saving');
    setFeedback(null);

    try {
      const savedArticleId = articleId ?? (await saveDraft());
      if (!savedArticleId) {
        setReviewEvidenceState('error');
        return null;
      }

      await prepareKnowledgeArticlePublicationEvidence({
        p_article_id: savedArticleId,
        p_human_confirmations: buildCompleteHumanConfirmations(),
        p_review_notes: advisory?.review_notes || PUBLIC_PUBLISH_REVIEW_NOTES,
      });
      const nextAdvisory = await refreshAdvisory(savedArticleId, selectedSpace.id);
      setReviewEvidenceState('saved');
      if (!options?.silent) {
        setFeedback(
          'Checklist público confirmado. Agora selecione Publicado para executar o gate.',
        );
      }
      return nextAdvisory;
    } catch (error) {
      const classified = classifyAdminError(
        error,
        'Falha ao preparar a evidência pública do artigo.',
      );
      setReviewEvidenceState('error');
      setFeedback(classified.message);
      return null;
    }
  }

  async function handleConfirmHumanReviewForPublicPublish() {
    await preparePublicEvidenceForPublish();
  }

  async function handlePublishArticle() {
    if (!selectedSpace) {
      setPublishState('error');
      setFeedback('Selecione um espaço público antes de tentar publicar.');
      return;
    }

    if (isEditorialRevision && !articleId) {
      setPublishState('error');
      setFeedback('Não foi possível localizar a revisão editorial deste artigo.');
      return;
    }

    if (status === 'draft' && !isEditorialRevision) {
      const savedArticleId = await saveDraft();
      if (!savedArticleId || !selectedSpace) {
        setPublishState('error');
        return;
      }

      try {
        await submitKnowledgeArticleForReviewV2({
          p_article_id: savedArticleId,
          p_knowledge_space_id: selectedSpace.id,
        });
        setStatus('review');
        await refreshAdvisory(savedArticleId, selectedSpace.id);
      } catch (error) {
        const classified = classifyAdminError(
          error,
          'Falha ao enviar o artigo para revisão antes de publicar.',
        );
        setPublishState('error');
        setFeedback(classified.message);
        return;
      }
    } else if (status !== 'review' && !isEditorialRevision) {
      setPublishState('error');
      setFeedback('A publicação exige artigo em revisão ou revisão editorial.');
      return;
    }

    let effectiveAdvisory = advisory;
    let currentPublishBlocker = publicPublishBlocker(effectiveAdvisory, form.visibility);
    if (currentPublishBlocker && form.visibility === 'public') {
      effectiveAdvisory = await preparePublicEvidenceForPublish({
        silent: true,
      });
      currentPublishBlocker = publicPublishBlocker(effectiveAdvisory, form.visibility);
    }

    if (currentPublishBlocker) {
      setPublishState('error');
      setFeedback(currentPublishBlocker);
      return;
    }

    setPublishState('saving');
    setFeedback(null);

    try {
      if (isEditorialRevision) {
        const savedArticleId = await saveDraft();
        if (!savedArticleId) {
          setPublishState('error');
          return;
        }
        await publishKnowledgeArticleEditorialRevisionV2({
          p_article_id: savedArticleId,
          p_knowledge_space_id: selectedSpace.id,
        });
      } else {
        const savedArticleId = await saveDraft();
        if (!savedArticleId) {
          setPublishState('error');
          return;
        }
        await publishKnowledgeArticleV2({
          p_article_id: savedArticleId,
          p_knowledge_space_id: selectedSpace.id,
        });
      }

      setStatus('published');
      setIsEditorialRevision(false);
      setPublishState('saved');
      setFeedback('Artigo publicado pelo gate editorial existente.');
    } catch (error) {
      const classified = classifyAdminError(
        error,
        'Falha ao publicar pelo gate editorial existente.',
      );
      setPublishState('error');
      setFeedback(classified.message);
    }
  }

  function handleInsertAsset(assetId: string) {
    const asset = assets.find((item) => item.id === assetId);
    const markdown = asset
      ? buildAssetMarkdown(asset)
      : `\n\n![Imagem do artigo|size=large](knowledge-asset:${assetId})\n\n`;
    return editorMarkdownInserterRef.current?.(markdown) ?? insertSnippet(markdown, '', '');
  }

  async function handleStatusTransition(nextStatus: ArticleEditorStatus) {
    if (nextStatus === status) {
      return;
    }

    if (status === 'draft' && nextStatus === 'review' && !isEditorialRevision) {
      await handleSubmitForReview();
      return;
    }

    if (
      nextStatus === 'published' &&
      ((status === 'review' && !isEditorialRevision) ||
        (status === 'draft' && !isEditorialRevision) ||
        isEditorialRevision)
    ) {
      await handlePublishArticle();
      return;
    }

    setFeedback('Esta transição editorial não está disponível pelo contrato atual.');
  }

  if (phase === 'loading') {
    return (
      <LoadingState
        title="Carregando editor"
        description="Estamos preparando categorias, espaços e contratos do Knowledge."
      />
    );
  }

  if (phase === 'contract-unavailable') {
    return (
      <ContractUnavailableState
        contractName={errorMessage ?? 'views e RPCs administrativas de Knowledge'}
        action={
          <Link to="/admin/knowledge">
            <GhostButton>Voltar ao cockpit</GhostButton>
          </Link>
        }
      />
    );
  }

  if (phase === 'error') {
    return (
      <ErrorState
        description={errorMessage ?? 'Não foi possível abrir o editor de artigo.'}
        action={<GhostButton onClick={() => window.location.reload()}>Recarregar</GhostButton>}
      />
    );
  }

  return (
    <form
      className="flex h-full min-h-0 flex-col overflow-hidden bg-[#F4F7FC] font-[Inter,Geist,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe_UI',sans-serif]"
      onSubmit={handleSaveDraft}
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-5 py-4 xl:px-6">
        <header className="flex shrink-0 items-start justify-between gap-5 pb-3">
          <div className="min-w-0 space-y-2">
            <nav className="flex items-center gap-2 text-xs font-semibold text-[color:var(--color-muted)]">
              <Link className="hover:text-[color:var(--color-brand-blue)]" to="/admin/knowledge">
                Governança de conhecimento
              </Link>
              <span aria-hidden="true">›</span>
              <Link className="hover:text-[color:var(--color-brand-blue)]" to="/admin/knowledge">
                Artigos
              </Link>
              <span aria-hidden="true">›</span>
              <span className="text-[color:var(--color-brand-blue)]">
                {isEditMode ? 'Editar artigo' : 'Novo artigo'}
              </span>
            </nav>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-[1.75rem] font-extrabold leading-[1.1] tracking-[-0.02em] text-[#162443]">
                  {isEditMode ? 'Editar artigo' : 'Novo artigo'}
                </h1>
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[0.72rem] font-bold text-emerald-700">
                  ✓{' '}
                  {saveState === 'saved'
                    ? 'Rascunho salvo agora'
                    : 'Alterações salvas automaticamente'}
                </span>
              </div>
              <p className="mt-1 text-[0.82rem] leading-5 text-[#6B7892]">
                {isEditMode
                  ? 'Atualize conteúdo da base de conhecimento com clareza e impacto.'
                  : 'Crie conteúdo para a Central de Ajuda com clareza e impacto.'}
              </p>
            </div>
          </div>
          {articleId ? (
            <div className="hidden flex-1 justify-center pt-9 text-[0.72rem] font-semibold text-[color:var(--color-muted)] xl:flex">
              ID do artigo: {articleId}
            </div>
          ) : null}
          <div className="flex shrink-0 flex-wrap justify-end gap-3">
            <GhostButton
              className="h-11 rounded-[12px] px-5 text-[0.82rem] text-[color:var(--color-brand-navy)]"
              title="Use o status editorial para enviar, revisar e publicar."
              type="button"
            >
              Ações ▾
            </GhostButton>
            <GhostButton
              className="h-11 w-11 rounded-full px-0 text-[color:var(--color-brand-blue)]"
              title="Mais opções"
              type="button"
            >
              ⋮
            </GhostButton>
          </div>
        </header>

        {feedback ? (
          <div className="shrink-0 pb-3">
            <InlineNotice
              tone={
                saveState === 'error' ||
                submitState === 'error' ||
                publishState === 'error' ||
                reviewEvidenceState === 'error'
                  ? 'critical'
                  : submitState === 'saved' ||
                      saveState === 'saved' ||
                      publishState === 'saved' ||
                      reviewEvidenceState === 'saved'
                    ? 'positive'
                    : 'default'
              }
            >
              {feedback}
            </InlineNotice>
          </div>
        ) : null}

        <div
          className={cx(
            'grid min-h-0 flex-1 gap-4 overflow-hidden',
            metadataCollapsed
              ? 'xl:grid-cols-[64px_minmax(0,1fr)]'
              : 'xl:grid-cols-[360px_minmax(0,1fr)]',
          )}
        >
          <aside className="min-h-0 overflow-hidden">
            {metadataCollapsed ? (
              <div className="flex h-full flex-col items-center gap-3 rounded-[22px] border border-[color:var(--color-border)] bg-white px-2 py-3 shadow-[0_18px_42px_rgba(20,31,71,0.06)]">
                <button
                  className="grid h-10 w-10 place-items-center rounded-2xl bg-[color:var(--color-brand-blue)] text-white shadow-[0_12px_28px_rgba(47,107,255,0.24)]"
                  onClick={() => setMetadataCollapsed(false)}
                  title="Expandir metadados"
                  type="button"
                >
                  ›
                </button>
                {['✎', '✓', '🖼'].map((item) => (
                  <span
                    className="grid h-9 w-9 place-items-center rounded-2xl bg-[color:var(--color-surface)] text-[0.86rem] text-[color:var(--color-brand-navy)]"
                    key={item}
                  >
                    {item}
                  </span>
                ))}
              </div>
            ) : (
              <div className="h-full overflow-auto pr-1">
                <div className="space-y-3">
                  <RailCard title="Configurações editoriais">
                    <div className="-mt-1 flex justify-end">
                      <button
                        className="rounded-full px-2 py-1 text-[0.72rem] font-bold text-[#2F6BFF] hover:bg-[#F4F7FC]"
                        onClick={() => setMetadataCollapsed(true)}
                        type="button"
                      >
                        Recolher
                      </button>
                    </div>
                    <Field label="Título do artigo *">
                      <TextInput
                        disabled={isReadOnly}
                        maxLength={TITLE_LIMIT + 20}
                        onChange={handleTitleChange}
                        placeholder="Título claro do artigo"
                        value={form.title}
                      />
                      <CharacterCounter limit={TITLE_LIMIT} value={form.title} />
                    </Field>
                    <Field label="Slug *">
                      <TextInput
                        disabled={isReadOnly}
                        maxLength={SLUG_LIMIT + 20}
                        onChange={handleSlugChange}
                        placeholder="slug-do-artigo"
                        value={form.slug}
                      />
                      <CharacterCounter limit={SLUG_LIMIT} value={form.slug} />
                    </Field>
                    <Field label="Resumo curto *">
                      <TextareaInput
                        className="min-h-[104px] rounded-[14px] py-3 leading-[1.45]"
                        disabled={isReadOnly}
                        maxLength={SUMMARY_LIMIT + 40}
                        onChange={(event) => updateForm({ summary: event.target.value })}
                        placeholder="Explique em até 160 caracteres o que o artigo resolve."
                        value={form.summary}
                      />
                      <CharacterCounter limit={SUMMARY_LIMIT} value={form.summary} />
                    </Field>
                    <Field label="Categoria *">
                      <SelectInput
                        disabled={isReadOnly}
                        onChange={(event) => updateForm({ categoryId: event.target.value })}
                        value={form.categoryId}
                      >
                        <option value="">Selecione uma categoria</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </SelectInput>
                    </Field>
                    <Field label="Visibilidade *">
                      <SelectInput
                        disabled={isReadOnly}
                        onChange={(event) =>
                          updateForm({
                            visibility: event.target.value as KnowledgeVisibility,
                          })
                        }
                        value={form.visibility}
                      >
                        <option value="internal">Interno</option>
                        <option value="restricted">Restrito</option>
                        <option value="public">Público</option>
                      </SelectInput>
                    </Field>
                    <Field label="Espaço público *">
                      <SelectInput
                        disabled={isReadOnly}
                        onChange={(event) => void handleSpaceChange(event.target.value)}
                        value={selectedSpaceId}
                      >
                        {spaces.map((space) => (
                          <option key={space.id} value={space.id}>
                            {space.display_name}
                          </option>
                        ))}
                      </SelectInput>
                    </Field>
                    <Field label="Status editorial">
                      <SelectInput
                        disabled={
                          submitState === 'saving' || publishState === 'saving' || isReadOnly
                        }
                        onChange={(event) =>
                          void handleStatusTransition(event.target.value as ArticleEditorStatus)
                        }
                        value={status}
                      >
                        <option value="draft">Rascunho</option>
                        <option value="review">Em revisão</option>
                        <option value="published">Publicado</option>
                        <option disabled value="archived">
                          Arquivado
                        </option>
                      </SelectInput>
                      <p className="mt-1 text-[0.68rem] leading-4 text-[color:var(--color-muted)]">
                        Cada mudança chama RPC governada e respeita o gate editorial.
                      </p>
                    </Field>
                  </RailCard>

                  <RailCard
                    badge={`${publicationChecklistDone}/${publicationChecklist.length}`}
                    title="Checklist de publicação"
                  >
                    <ul className="space-y-2">
                      {publicationChecklist.map((item) => (
                        <ChecklistItem
                          actionLabel={
                            item.action === 'evidence' || item.action === 'publish-readiness'
                              ? 'Confirmar'
                              : 'Ajustar'
                          }
                          disabled={
                            reviewEvidenceState === 'saving' ||
                            (item.action !== 'evidence' &&
                              item.action !== 'publish-readiness' &&
                              isReadOnly)
                          }
                          done={item.done}
                          key={item.label}
                          label={item.label}
                          onAction={
                            item.action === 'evidence' || item.action === 'publish-readiness'
                              ? () => void handleConfirmHumanReviewForPublicPublish()
                              : () => {
                                  if (item.action === 'body') {
                                    document
                                      .querySelector<HTMLElement>('.knowledge-rich-editor')
                                      ?.focus();
                                  } else {
                                    setMetadataCollapsed(false);
                                  }
                                  setFeedback(
                                    item.action === 'title'
                                      ? 'Revise o título na coluna de configurações.'
                                      : item.action === 'summary'
                                        ? 'Revise o resumo curto na coluna de configurações.'
                                        : item.action === 'category'
                                          ? 'Selecione uma categoria na coluna de configurações.'
                                          : item.action === 'visibility'
                                            ? 'Confirme a visibilidade na coluna de configurações.'
                                            : 'Complete o corpo principal do artigo.',
                                  );
                                }
                          }
                        />
                      ))}
                    </ul>
                    {needsPublicEvidence && publishBlocker ? (
                      <p className="rounded-2xl bg-amber-50 px-3 py-2 text-[0.7rem] leading-5 text-amber-700">
                        {publishBlocker}
                      </p>
                    ) : null}
                    {needsPublicEvidence && !publicEvidenceComplete ? (
                      <GhostButton
                        className="min-h-9 w-full justify-center rounded-[12px] text-[0.72rem]"
                        disabled={reviewEvidenceState === 'saving'}
                        onClick={handleConfirmHumanReviewForPublicPublish}
                      >
                        {reviewEvidenceState === 'saving'
                          ? 'Confirmando...'
                          : 'Concluir checklist público'}
                      </GhostButton>
                    ) : null}
                  </RailCard>

                  <RailCard
                    badge={`${assets.length} ${assets.length === 1 ? 'item' : 'itens'}`}
                    title="Mídia e anexos"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[0.72rem] text-[color:var(--color-muted)]">
                        Imagens entram inline no texto.
                      </span>
                      <GhostButton
                        className="min-h-8 rounded-[12px] px-3 text-[0.7rem]"
                        disabled={isReadOnly || assetState === 'saving'}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        + Adicionar
                      </GhostButton>
                    </div>
                    {assets.length > 0 ? (
                      <ul className="space-y-2">
                        {assets.slice(0, 3).map((asset) => (
                          <li
                            className="flex items-center gap-2 rounded-2xl border border-[color:var(--color-border)] bg-white px-2 py-2"
                            key={asset.id}
                          >
                            <div className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)]">
                              {asset.signed_url ? (
                                <img
                                  alt={asset.alt_text ?? 'Imagem do artigo'}
                                  className="h-full w-full object-cover"
                                  loading="lazy"
                                  src={asset.signed_url}
                                />
                              ) : (
                                <span className="text-xs text-[color:var(--color-muted)]">IMG</span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[0.72rem] font-semibold text-[color:var(--color-brand-navy)]">
                                {asset.source_path?.split('/').pop() ??
                                  asset.detected_mime_type ??
                                  'Imagem'}
                              </p>
                              <p className="text-[0.66rem] text-[color:var(--color-muted)]">
                                {asset.file_size_bytes
                                  ? formatFileSize(asset.file_size_bytes)
                                  : 'tamanho indisponível'}
                              </p>
                            </div>
                            <button
                              className="grid h-8 w-8 shrink-0 place-items-center rounded-xl text-[#2F6BFF] hover:bg-[#F4F7FC]"
                              onClick={() => handleInsertAsset(asset.id)}
                              title="Inserir no corpo"
                              type="button"
                            >
                              +
                            </button>
                            {asset.signed_url ? (
                              <a
                                className="grid h-8 w-8 shrink-0 place-items-center rounded-xl text-[#6B7892] hover:bg-[#F4F7FC]"
                                href={asset.signed_url}
                                rel="noreferrer"
                                target="_blank"
                                title="Abrir imagem"
                              >
                                ↓
                              </a>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="rounded-2xl bg-[color:var(--color-surface)] px-3 py-3 text-[0.72rem] leading-5 text-[color:var(--color-muted)]">
                        Cole ou arraste uma imagem no editor quando o artigo precisar de apoio
                        visual.
                      </p>
                    )}
                  </RailCard>

                  <RailCard title="Informações do artigo">
                    <dl className="space-y-2 text-[0.72rem] leading-5">
                      <div>
                        <dt className="font-extrabold text-[color:var(--color-brand-navy)]">
                          Última edição
                        </dt>
                        <dd className="text-[color:var(--color-muted)]">
                          {articleDetail?.updated_at
                            ? new Date(articleDetail.updated_at).toLocaleString('pt-BR')
                            : 'Ainda não salvo'}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-extrabold text-[color:var(--color-brand-navy)]">
                          Revisão
                        </dt>
                        <dd className="text-[color:var(--color-muted)]">
                          {articleDetail?.current_revision_number
                            ? `Rev. ${articleDetail.current_revision_number}`
                            : 'Rascunho inicial'}
                        </dd>
                      </div>
                    </dl>
                  </RailCard>
                </div>
              </div>
            )}
          </aside>
          <main className="flex min-h-0 flex-col overflow-hidden">
            <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[22px] border border-[#DCE4F2] bg-white shadow-[0_18px_50px_rgba(22,36,67,0.06)]">
              <input
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                disabled={isReadOnly}
                multiple
                onChange={(event) => {
                  if (event.target.files) {
                    void handleAssetFiles(event.target.files, 'upload');
                  }
                  event.target.value = '';
                }}
                ref={fileInputRef}
                type="file"
              />
              <RichTextArticleEditor
                assets={assetMap}
                assetState={assetState}
                bodyMd={form.bodyMd}
                isReadOnly={isReadOnly}
                onChange={(nextBodyMd) => updateForm({ bodyMd: nextBodyMd })}
                onDrop={handleAssetDrop}
                onImageButton={() => {
                  if (!isReadOnly) {
                    fileInputRef.current?.click();
                  }
                }}
                onPaste={handleBodyPaste}
                onRegisterMarkdownInserter={(inserter) => {
                  editorMarkdownInserterRef.current = inserter;
                }}
              />
              <div className="flex h-12 shrink-0 items-center justify-between gap-4 border-t border-[#E8EEF7] px-5 text-[0.72rem] text-[#6B7892]">
                <span className="min-w-[220px]">
                  {bodyPlain.split(' ').filter(Boolean).length} palavras ·{' '}
                  {saveState === 'saved' ? 'Rascunho salvo agora' : 'Edição local'}
                </span>
                <span className="hidden flex-1 justify-center text-center xl:block">
                  Atalhos: Ctrl+S salvar · Ctrl+K inserir link
                </span>
                <div className="flex shrink-0 items-center gap-2">
                  <AppButton
                    className="min-h-9 rounded-[12px] px-4 text-[0.72rem]"
                    disabled={saveState === 'saving' || isReadOnly}
                    type="submit"
                  >
                    {saveState === 'saving' ? 'Salvando...' : saveButtonLabel}
                  </AppButton>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </form>
  );
}
