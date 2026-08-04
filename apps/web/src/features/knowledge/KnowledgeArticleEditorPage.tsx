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
import { Link, useParams } from 'react-router';
import { Mark, Node as TiptapNode, mergeAttributes } from '@tiptap/core';
import {
  EditorContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
  useEditor,
} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import LinkExtension from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
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
  listAdminKnowledgeArticlesV2,
  listAdminKnowledgeArticleAssets,
  listAdminKnowledgeArticleReviewAdvisories,
  listAdminKnowledgeCategoriesV2,
  listAdminKnowledgeSpaces,
  prepareKnowledgeArticlePublicationEvidence,
  publishKnowledgeArticleEditorialRevisionV2,
  publishKnowledgeArticleV2,
  replaceKnowledgeArticleTagsV1,
  submitKnowledgeArticleForReviewV2,
  updateKnowledgeArticleEditorialRevisionV2,
  updateKnowledgeArticleDraftV2,
  uploadKnowledgeArticleAssetFile,
  type AdminKnowledgeArticleAssetRow,
  type AdminKnowledgeArticleDetailV2Row,
  type AdminKnowledgeArticleEditorialDraftRow,
  type AdminKnowledgeArticleListItemV2Row,
  type AdminKnowledgeArticleReviewAdvisoryRow,
  type AdminKnowledgeCategoryV2Row,
  type AdminKnowledgeSpaceRow,
  type KnowledgeArticleStatus,
  type KnowledgeReviewHumanConfirmations,
  type KnowledgeVisibility,
} from '../admin/admin-api';
import { classifyAdminError } from '../admin/admin-errors';
import { type MarkdownAsset } from '../help-center/markdown';
import {
  KNOWLEDGE_SUMMARY_LIMIT,
  resolveKnowledgeSaveMode,
} from './knowledge-editorial-rules';

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
const SUMMARY_LIMIT = KNOWLEDGE_SUMMARY_LIMIT;
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
    keywords: article.tags ?? [],
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
    keywords: fallback.tags ?? [],
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

function hasCompleteHumanConfirmations(value: unknown) {
  const confirmations = normalizeHumanConfirmations(value);
  return PUBLIC_PUBLISH_CONFIRMATION_FIELDS.every((field) => confirmations[field.key] === true);
}

function publicConfirmationComplete(confirmations: KnowledgeReviewHumanConfirmations) {
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

/**
 * Estado editorial do artigo, sempre visível no header.
 * Publicar é a ação de maior consequência: o estado precisa ser explícito.
 */
function EditorStatusBadge({
  status,
  isEditorialRevision,
}: {
  status: ArticleEditorStatus;
  isEditorialRevision: boolean;
}) {
  const tone =
    status === 'published'
      ? isEditorialRevision
        ? 'border-[color:var(--color-warning-border)] bg-[color:var(--color-warning-surface)] text-[color:var(--color-warning-text)]'
        : 'border-[color:var(--color-success-border)] bg-[color:var(--color-success-surface)] text-[color:var(--color-success-text)]'
      : status === 'review'
        ? 'border-[color:var(--color-info-border)] bg-[color:var(--color-info-surface)] text-[color:var(--color-info-text)]'
        : 'border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface-muted)] text-[color:var(--minimal-text-secondary)]';

  const label =
    status === 'published'
      ? isEditorialRevision
        ? 'Alterações não publicadas'
        : 'Publicado'
      : status === 'review'
        ? 'Em revisão'
        : status === 'archived'
          ? 'Arquivado'
          : 'Rascunho';

  return (
    <span className={cx('inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[0.72rem] font-medium', tone)}>
      {label}
    </span>
  );
}

/**
 * Estado real de salvamento. Antes o texto era fixo e afirmava salvamento
 * automático que não existe, o que induzia o redator a acreditar que já havia
 * salvo.
 */
function EditorSaveIndicator({ saveState, isEditMode }: { saveState: SaveState; isEditMode: boolean }) {
  if (saveState === 'saving') {
    return <span className="shrink-0 text-xs text-[color:var(--minimal-text-tertiary)]">Salvando…</span>;
  }
  if (saveState === 'saved') {
    return <span className="shrink-0 text-xs text-[color:var(--color-success-text)]">Alterações salvas</span>;
  }
  if (saveState === 'error') {
    return <span className="shrink-0 text-xs font-medium text-[color:var(--danger)]">Falha ao salvar</span>;
  }

  return (
    <span className="shrink-0 text-xs text-[color:var(--minimal-text-tertiary)]">
      {isEditMode ? 'Alterações não salvas' : 'Rascunho não salvo'}
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
    <section className="border-b border-[color:var(--minimal-border)] bg-[color:var(--minimal-sidebar)] px-1 py-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[0.82rem] font-extrabold tracking-[-0.015em] text-[#162443]">
          {title}
        </h2>
        {badge ? (
          <span className="rounded-full bg-[color:var(--color-success-surface)] px-2.5 py-1 text-[0.68rem] font-extrabold text-[color:var(--color-success-ink)]">
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

function ToolbarMenu({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cx(
        'absolute z-30 rounded-2xl border border-[#DCE4F2] bg-[color:var(--color-surface-strong)] p-2 shadow-[0_18px_50px_rgba(22,36,67,0.16)]',
        className,
      )}
    >
      {children}
    </div>
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
            ? 'border-[color:var(--color-success-border)] bg-[color:var(--color-success-surface)] text-[color:var(--color-success-ink)]'
            : 'border-[#C8D4EA] bg-[color:var(--color-surface-strong)] text-[#98A3B8]',
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
type CalloutTone = 'info' | 'warning' | 'success' | 'danger';
type TextTone = 'default' | 'blue' | 'green' | 'yellow' | 'red' | 'gray';
type MarkTone = 'none' | 'blue' | 'green' | 'yellow' | 'pink' | 'purple' | 'gray';

const TEXT_TONE_LABELS: Record<TextTone, string> = {
  default: 'Padrão',
  blue: 'Azul',
  green: 'Verde',
  yellow: 'Amarelo',
  red: 'Vermelho',
  gray: 'Cinza',
};

const MARK_TONE_LABELS: Record<MarkTone, string> = {
  none: 'Sem destaque',
  blue: 'Azul',
  green: 'Verde',
  yellow: 'Amarelo',
  pink: 'Rosa',
  purple: 'Lilás',
  gray: 'Cinza',
};

type VisualEditorBlock =
  | { type: 'heading'; level: 1 | 2 | 3; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'quote'; text: string }
  | { type: 'code'; text: string }
  | { type: 'image'; assetId: string; alt: string; size: VisualImageSize }
  | { type: 'callout'; tone: CalloutTone; text: string }
  | { type: 'youtube'; videoId: string; size: VisualImageSize }
  | { type: 'divider'; style: 'solid' | 'dashed' | 'space' }
  | { type: 'related'; articleId?: string; title: string; summary: string; slug: string };

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

function calloutLabel(tone: CalloutTone) {
  if (tone === 'warning') {
    return 'Atenção';
  }
  if (tone === 'success') {
    return 'Importante';
  }
  if (tone === 'danger') {
    return 'Cuidado';
  }
  return 'Nota';
}

function normalizeLegacyVisualTokens(source: string) {
  return source
    .replace(
      /(?:▶\s*)?(?:\*\*)?Vídeo YouTube(?:\*\*)?\s*youtube-nocookie\.com\/embed\/([A-Za-z0-9_-]{6,20})/gi,
      '\n\n::youtube $1|size=large\n\n',
    )
    .replace(
      /(^|\s)youtube-nocookie\.com\/embed\/([A-Za-z0-9_-]{6,20})(?=\s|$)/gi,
      '\n\n::youtube $2|size=large\n\n',
    );
}

function parseVisualBlocks(source: string): VisualEditorBlock[] {
  const lines = normalizeLegacyVisualTokens(source).replace(/\r\n/g, '\n').split('\n');
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

    const calloutMatch = /^:::callout\s+(info|warning|success|danger)\s*$/i.exec(trimmed);
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
        tone: calloutMatch[1].toLowerCase() as CalloutTone,
        text: calloutLines.join('\n'),
      });
      continue;
    }

    const dividerMatch = /^::divider(?:\s+(solid|dashed|space))?\s*$/i.exec(trimmed);
    if (dividerMatch) {
      blocks.push({
        type: 'divider',
        style: (dividerMatch[1]?.toLowerCase() as 'solid' | 'dashed' | 'space') ?? 'dashed',
      });
      index += 1;
      continue;
    }

    const relatedMatch = /^::related\s+([a-z0-9-]+|[a-f0-9-]{36})\s*$/i.exec(trimmed);
    if (relatedMatch) {
      const relatedLines: string[] = [];
      index += 1;
      while (index < lines.length && (lines[index] ?? '').trim() !== '::') {
        relatedLines.push(lines[index] ?? '');
        index += 1;
      }
      if (index < lines.length) {
        index += 1;
      }
      const [title = 'Artigo relacionado', summary = 'Abra este artigo relacionado na Central.'] =
        relatedLines;
      blocks.push({
        type: 'related',
        articleId: /^[a-f0-9-]{36}$/i.test(relatedMatch[1]) ? relatedMatch[1] : undefined,
        slug: relatedMatch[1],
        title: title.trim() || 'Artigo relacionado',
        summary: summary.trim() || 'Abra este artigo relacionado na Central.',
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
        /^:::callout\s+(info|warning|success|danger)\s*$/i.test(candidate) ||
        /^::divider(?:\s+(solid|dashed|space))?\s*$/i.test(candidate) ||
        /^::related\s+([a-z0-9-]+|[a-f0-9-]{36})\s*$/i.test(candidate) ||
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
    .replace(
      /\[color:(default|blue|green|yellow|red|gray)]([\s\S]+?)\[\/color]/gi,
      (_match, tone, content) =>
        tone === 'default'
          ? content
          : `<span data-text-tone="${String(tone).toLowerCase()}">${content}</span>`,
    )
    .replace(
      /\[mark:(blue|green|yellow|pink|purple|gray)]([\s\S]+?)\[\/mark]/gi,
      (_match, tone, content) =>
        `<span data-mark-tone="${String(tone).toLowerCase()}">${content}</span>`,
    )
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
        // O rotulo do callout e cromo, nao conteudo: vem do CSS via
        // data-callout-tone. Emiti-lo aqui fazia o TipTap reparsear o rotulo
        // como texto e o renderHTML somar outro, triplicando "Atencao".
        return `<aside data-callout-tone="${block.tone}"><p>${renderInlineMarkdown(block.text)}</p></aside>`;
      }

      if (block.type === 'youtube') {
        return renderYoutubeFigure(block.videoId, block.size);
      }

      if (block.type === 'divider') {
        return `<hr data-divider-style="${block.style}" />`;
      }

      if (block.type === 'related') {
        return `<section ${block.articleId ? `data-related-article-id="${escapeHtml(block.articleId)}"` : ''} data-related-slug="${escapeHtml(block.slug)}" contenteditable="false" class="related-card"><strong>Leia também</strong><p data-related-title>${renderInlineMarkdown(block.title)}</p><small data-related-summary>${renderInlineMarkdown(block.summary)}</small><span>→</span></section>`;
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

  if (tag === 'span') {
    const textTone = node.dataset.textTone as TextTone | undefined;
    const markTone = node.dataset.markTone as MarkTone | undefined;
    if (textTone && textTone !== 'default') {
      return `[color:${textTone}]${content}[/color]`;
    }
    if (markTone && markTone !== 'none') {
      return `[mark:${markTone}]${content}[/mark]`;
    }
    return content;
  }

  return content;
}

function isVisualBlockElement(node: Node): node is HTMLElement {
  if (!(node instanceof HTMLElement)) {
    return false;
  }

  const tag = node.tagName.toLowerCase();
  return (
    /^h[1-3]$/.test(tag) ||
    tag === 'blockquote' ||
    tag === 'pre' ||
    tag === 'hr' ||
    tag === 'ul' ||
    tag === 'ol' ||
    (tag === 'section' && Boolean(node.dataset.relatedSlug)) ||
    (tag === 'aside' && Boolean(node.dataset.calloutTone)) ||
    (tag === 'figure' && (Boolean(node.dataset.youtubeId) || Boolean(node.dataset.assetId)))
  );
}

function mixedChildrenToMarkdown(element: HTMLElement) {
  const chunks: string[] = [];
  let inlineParts: string[] = [];

  function flushInlineParts() {
    const inline = inlineParts.join('').trim();
    if (inline) {
      chunks.push(inline);
    }
    inlineParts = [];
  }

  for (const child of Array.from(element.childNodes)) {
    if (isVisualBlockElement(child)) {
      flushInlineParts();
      chunks.push(blockElementToMarkdown(child));
      continue;
    }

    inlineParts.push(inlineNodeToMarkdown(child));
  }

  flushInlineParts();
  return chunks.filter((chunk) => chunk.trim().length > 0).join('\n\n');
}

function blockElementToMarkdown(element: HTMLElement): string {
  const tag = element.tagName.toLowerCase();

  if (/^h[1-3]$/.test(tag)) {
    return `${'#'.repeat(Number(tag.slice(1)))} ${inlineNodeToMarkdown(element).trim()}`;
  }

  if (tag === 'p' || tag === 'div') {
    if (Array.from(element.childNodes).some(isVisualBlockElement)) {
      return mixedChildrenToMarkdown(element);
    }

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

  if (tag === 'hr') {
    return `::divider ${element.dataset.dividerStyle ?? 'dashed'}`;
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

  if (tag === 'section' && element.dataset.relatedSlug) {
    const reference = element.dataset.relatedArticleId || element.dataset.relatedSlug;
    const title = element.querySelector('[data-related-title]')?.textContent?.trim();
    const summary = element.querySelector('[data-related-summary]')?.textContent?.trim();
    return `::related ${reference}\n${title || 'Artigo relacionado'}\n${summary || 'Abra este artigo relacionado na Central.'}\n::`;
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
  const markdown = Array.from(root.children)
    .map((child) => (child instanceof HTMLElement ? blockElementToMarkdown(child) : ''))
    .filter((block) => block.trim().length > 0)
    .join('\n\n');

  return normalizeLegacyVisualTokens(markdown);
}

const TextToneMark = Mark.create({
  name: 'textTone',
  addAttributes() {
    return {
      tone: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-text-tone'),
        renderHTML: (attributes) =>
          attributes.tone ? { 'data-text-tone': attributes.tone } : {},
      },
    };
  },
  parseHTML() {
    return [{ tag: 'span[data-text-tone]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes), 0];
  },
});

const MarkToneMark = Mark.create({
  name: 'markTone',
  addAttributes() {
    return {
      tone: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-mark-tone'),
        renderHTML: (attributes) =>
          attributes.tone ? { 'data-mark-tone': attributes.tone } : {},
      },
    };
  },
  parseHTML() {
    return [{ tag: 'span[data-mark-tone]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes), 0];
  },
});

function VisualMediaNodeView({ deleteNode, editor, getPos, node, updateAttributes }: NodeViewProps) {
  const isYoutube = node.type.name === 'knowledgeYoutube';
  const size = (node.attrs.size ?? 'large') as VisualImageSize;
  const src = String(node.attrs.src ?? '');
  const caption = String(node.attrs.caption ?? node.attrs.alt ?? '');
  const videoId = String(node.attrs.videoId ?? '');

  function setSize(nextSize: VisualImageSize) {
    updateAttributes({ size: nextSize });
  }

  function move(direction: 'up' | 'down') {
    if (typeof getPos !== 'function') {
      return;
    }
    const pos = getPos();
    if (typeof pos !== 'number') {
      return;
    }
    const json = node.toJSON();
    const targetPos = direction === 'up' ? Math.max(0, pos - 1) : pos + node.nodeSize + 1;
    editor
      .chain()
      .focus()
      .deleteRange({ from: pos, to: pos + node.nodeSize })
      .insertContentAt(targetPos, json)
      .run();
  }

  return (
    <NodeViewWrapper
      as="figure"
      className={`knowledge-media-node knowledge-media-node-${size}`}
      data-asset-id={node.attrs.assetId ?? undefined}
      data-size={size}
      data-youtube-id={isYoutube ? videoId : undefined}
    >
      <div className="knowledge-media-toolbar" contentEditable={false}>
        {(['small', 'medium', 'large', 'full'] as const).map((option) => (
          <button
            className={option === size ? 'is-active' : ''}
            key={option}
            onClick={() => setSize(option)}
            type="button"
          >
            {option === 'small'
              ? 'Pequena'
              : option === 'medium'
                ? 'Média'
                : option === 'large'
                  ? 'Grande'
                  : 'Largura total'}
          </button>
        ))}
        <button onClick={() => move('up')} type="button">
          Mover acima
        </button>
        <button onClick={() => move('down')} type="button">
          Mover abaixo
        </button>
        <button className="is-danger" onClick={() => deleteNode()} type="button">
          {isYoutube ? 'Remover vídeo' : 'Remover imagem'}
        </button>
      </div>
      {isYoutube ? (
        <div className="youtube-card" contentEditable={false}>
          <span className="youtube-card__play">▶</span>
          <strong>Vídeo YouTube</strong>
          <small>youtube-nocookie.com/embed/{videoId}</small>
        </div>
      ) : src ? (
        <img alt={String(node.attrs.alt ?? caption ?? 'Imagem do artigo')} src={src} />
      ) : (
        <div className="image-missing">Imagem indisponível no editor</div>
      )}
      {!isYoutube ? <figcaption>{caption}</figcaption> : null}
    </NodeViewWrapper>
  );
}

const KnowledgeImageNode = TiptapNode.create({
  name: 'knowledgeImage',
  group: 'block',
  atom: true,
  draggable: true,
  selectable: true,
  addAttributes() {
    return {
      assetId: { default: null, parseHTML: (element) => element.getAttribute('data-asset-id') },
      alt: { default: 'Imagem do artigo' },
      caption: {
        default: 'Imagem do artigo',
        parseHTML: (element) => element.querySelector('figcaption')?.textContent ?? '',
      },
      size: { default: 'large', parseHTML: (element) => element.getAttribute('data-size') },
      src: {
        default: null,
        parseHTML: (element) => element.querySelector('img')?.getAttribute('src'),
      },
    };
  },
  parseHTML() {
    return [{ tag: 'figure[data-asset-id]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'figure',
      mergeAttributes(HTMLAttributes, {
        'data-asset-id': HTMLAttributes.assetId,
        'data-size': HTMLAttributes.size,
      }),
      ['img', { alt: HTMLAttributes.alt, src: HTMLAttributes.src }],
      ['figcaption', {}, HTMLAttributes.caption],
    ];
  },
  addNodeView() {
    return ReactNodeViewRenderer(VisualMediaNodeView);
  },
});

const KnowledgeYoutubeNode = TiptapNode.create({
  name: 'knowledgeYoutube',
  group: 'block',
  atom: true,
  draggable: true,
  selectable: true,
  addAttributes() {
    return {
      size: { default: 'large', parseHTML: (element) => element.getAttribute('data-size') },
      videoId: { default: null, parseHTML: (element) => element.getAttribute('data-youtube-id') },
    };
  },
  parseHTML() {
    return [{ tag: 'figure[data-youtube-id]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'figure',
      mergeAttributes(HTMLAttributes, {
        'data-size': HTMLAttributes.size,
        'data-youtube-id': HTMLAttributes.videoId,
      }),
      [
        'div',
        { class: 'youtube-card' },
        ['span', { class: 'youtube-card__play' }, '▶'],
        ['strong', {}, 'Vídeo YouTube'],
        ['small', {}, `youtube-nocookie.com/embed/${HTMLAttributes.videoId}`],
      ],
    ];
  },
  addNodeView() {
    return ReactNodeViewRenderer(VisualMediaNodeView);
  },
});

const CalloutNode = TiptapNode.create({
  name: 'callout',
  group: 'block',
  content: 'paragraph+',
  addAttributes() {
    return {
      tone: { default: 'info', parseHTML: (element) => element.getAttribute('data-callout-tone') },
    };
  },
  parseHTML() {
    return [{ tag: 'aside[data-callout-tone]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'aside',
      mergeAttributes(HTMLAttributes, { 'data-callout-tone': HTMLAttributes.tone }),
      ['div', 0],
    ];
  },
});

const RelatedArticleNode = TiptapNode.create({
  name: 'relatedArticle',
  group: 'block',
  atom: true,
  selectable: true,
  addAttributes() {
    return {
      slug: { default: null, parseHTML: (element) => element.getAttribute('data-related-slug') },
      articleId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-related-article-id'),
      },
      summary: {
        default: 'Artigo relacionado da base de conhecimento.',
        parseHTML: (element) =>
          element.querySelector('[data-related-summary]')?.textContent ??
          'Artigo relacionado da base de conhecimento.',
      },
      title: {
        default: 'Artigo relacionado',
        parseHTML: (element) =>
          element.querySelector('[data-related-title]')?.textContent ?? 'Artigo relacionado',
      },
    };
  },
  parseHTML() {
    return [{ tag: 'section[data-related-slug]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'section',
      mergeAttributes(HTMLAttributes, {
        class: 'related-card',
        'data-related-article-id': HTMLAttributes.articleId,
        'data-related-slug': HTMLAttributes.slug,
      }),
      ['strong', {}, 'Leia também'],
      ['p', { 'data-related-title': '' }, HTMLAttributes.title],
      ['small', { 'data-related-summary': '' }, HTMLAttributes.summary],
      ['span', {}, '→'],
    ];
  },
});

function editorHtmlStringToMarkdown(html: string) {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = html;
  return editorHtmlToMarkdown(wrapper);
}

function RichTextArticleEditor({
  assets,
  assetState,
  bodyMd,
  isReadOnly,
  onChange,
  relatedArticles,
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
  relatedArticles: AdminKnowledgeArticleListItemV2Row[];
  onRegisterMarkdownInserter: (inserter: ((markdown: string) => string | null) | null) => void;
  onDrop: (event: DragEvent<HTMLElement>) => void;
  onImageButton: () => void;
  onPaste: (event: ClipboardEvent<HTMLElement>) => void;
}) {
  type ValueDialogKind = 'link' | 'video';

  const [openToolbarMenu, setOpenToolbarMenu] = useState<
    'block' | 'text-color' | 'mark-color' | 'insert' | null
  >(null);
  const [relatedDraftOpen, setRelatedDraftOpen] = useState(false);
  const [relatedQuery, setRelatedQuery] = useState('');
  const [valueDialog, setValueDialog] = useState<ValueDialogKind | null>(null);
  const [valueDraft, setValueDraft] = useState('');
  const [valueDialogError, setValueDialogError] = useState<string | null>(null);
  const valueInputRef = useRef<HTMLInputElement | null>(null);

  const htmlContent = useMemo(
    () => renderEditorHtmlFromMarkdown(bodyMd, assets),
    [assets, bodyMd],
  );

  const editor = useEditor({
    editable: !isReadOnly,
    extensions: [
      StarterKit.configure({
        horizontalRule: {
          HTMLAttributes: {
            'data-divider-style': 'dashed',
          },
        },
      }),
      Underline,
      LinkExtension.configure({
        autolink: false,
        openOnClick: false,
        linkOnPaste: true,
        validate: (href) => isSafeEditorHref(href),
        HTMLAttributes: {
          rel: 'noreferrer',
          target: '_blank',
        },
      }),
      TextToneMark,
      MarkToneMark,
      KnowledgeImageNode,
      KnowledgeYoutubeNode,
      CalloutNode,
      RelatedArticleNode,
    ],
    content: htmlContent,
    immediatelyRender: false,
    onUpdate: ({ editor: activeEditor }) => {
      onChange(editorHtmlStringToMarkdown(activeEditor.getHTML()));
    },
  });

  useEffect(() => {
    editor?.setEditable(!isReadOnly);
  }, [editor, isReadOnly]);

  useEffect(() => {
    if (!editor || editor.isFocused) {
      return;
    }

    const currentMarkdown = editorHtmlStringToMarkdown(editor.getHTML());
    if (currentMarkdown !== normalizeLegacyVisualTokens(bodyMd)) {
      editor.commands.setContent(htmlContent, { emitUpdate: false });
    }
  }, [bodyMd, editor, htmlContent]);

  useEffect(() => {
    if (!editor) {
      onRegisterMarkdownInserter(null);
      return;
    }

    onRegisterMarkdownInserter((markdown) => {
      const nextHtml = renderEditorHtmlFromMarkdown(markdown, assets);
      editor.chain().focus().insertContent(nextHtml).run();
      return editorHtmlStringToMarkdown(editor.getHTML());
    });

    return () => onRegisterMarkdownInserter(null);
  }, [assets, editor, onRegisterMarkdownInserter]);

  useEffect(() => {
    if (!valueDialog) {
      return;
    }
    valueInputRef.current?.focus();
    valueInputRef.current?.select();
  }, [valueDialog]);

  const wordCount = useMemo(() => {
    const text = editor?.getText() ?? bodyMd;
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  }, [bodyMd, editor]);

  function getBlockLabel() {
    if (!editor) {
      return 'Parágrafo';
    }
    if (editor.isActive('heading', { level: 1 })) {
      return 'Título 1';
    }
    if (editor.isActive('heading', { level: 2 })) {
      return 'Título 2';
    }
    if (editor.isActive('heading', { level: 3 })) {
      return 'Título 3';
    }
    if (editor.isActive('blockquote')) {
      return 'Citação';
    }
    if (editor.isActive('callout', { tone: 'info' })) {
      return 'Nota';
    }
    if (editor.isActive('callout', { tone: 'success' })) {
      return 'Importante';
    }
    if (editor.isActive('callout', { tone: 'warning' })) {
      return 'Alerta';
    }
    if (editor.isActive('callout', { tone: 'danger' })) {
      return 'Cuidado';
    }
    return 'Parágrafo';
  }

  function insertCallout(tone: CalloutTone) {
    editor
      ?.chain()
      .focus()
      .insertContent({
        type: 'callout',
        attrs: { tone },
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Escreva a orientação deste bloco.' }],
          },
        ],
      })
      .run();
  }

  function setTextTone(tone: TextTone) {
    if (!editor) {
      return;
    }
    if (tone === 'default') {
      editor.chain().focus().unsetMark('textTone').run();
      return;
    }
    editor.chain().focus().setMark('textTone', { tone }).run();
  }

  function setMarkTone(tone: MarkTone) {
    if (!editor) {
      return;
    }
    if (tone === 'none') {
      editor.chain().focus().unsetMark('markTone').run();
      return;
    }
    editor.chain().focus().setMark('markTone', { tone }).run();
  }

  function openValueDialog(kind: ValueDialogKind, initialValue = '') {
    setValueDraft(initialValue);
    setValueDialogError(null);
    setValueDialog(kind);
    setOpenToolbarMenu(null);
    setRelatedDraftOpen(false);
  }

  function closeValueDialog() {
    setValueDialog(null);
    setValueDraft('');
    setValueDialogError(null);
  }

  function submitValueDialog(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editor || !valueDialog) {
      return;
    }

    const value = valueDraft.trim();
    if (valueDialog === 'link') {
      if (!value) {
        editor.chain().focus().unsetLink().run();
        closeValueDialog();
        return;
      }
      if (!isSafeEditorHref(value)) {
        setValueDialogError('Use apenas links http, https ou mailto.');
        return;
      }
      editor.chain().focus().extendMarkRange('link').setLink({ href: value }).run();
      closeValueDialog();
      return;
    }

    const videoId = extractYouTubeVideoId(value);
    if (!videoId) {
      setValueDialogError(
        'Use apenas URLs youtube.com, youtu.be ou youtube-nocookie.com.',
      );
      return;
    }
    editor
      .chain()
      .focus()
      .insertContent({ type: 'knowledgeYoutube', attrs: { videoId, size: 'medium' } })
      .run();
    closeValueDialog();
  }

  function insertLink() {
    if (!editor) {
      return;
    }
    const previousHref = editor.getAttributes('link').href as string | undefined;
    openValueDialog('link', previousHref ?? 'https://');
  }

  function insertVideo() {
    openValueDialog('video');
  }

  const relatedArticleOptions = useMemo(() => {
    const normalizedQuery = relatedQuery.trim().toLowerCase();
    return relatedArticles
      .filter((article) => {
        if (!normalizedQuery) {
          return true;
        }
        return `${article.title} ${article.slug} ${article.summary ?? ''} ${article.category_name ?? ''}`
          .toLowerCase()
          .includes(normalizedQuery);
      })
      .slice(0, 8);
  }, [relatedArticles, relatedQuery]);

  function insertRelatedArticle(article: AdminKnowledgeArticleListItemV2Row) {
    editor
      ?.chain()
      .focus()
      .insertContent({
        type: 'relatedArticle',
        attrs: {
          articleId: article.id,
          slug: article.slug,
          title: article.title,
          summary: article.summary || 'Abra este artigo relacionado na Central de Ajuda.',
        },
      })
      .run();
    setRelatedQuery('');
    setRelatedDraftOpen(false);
    setOpenToolbarMenu(null);
  }

  function insertIconMarker() {
    editor?.chain().focus().insertContent('✓ ').run();
  }

  const toolbarButton = (
    label: ReactNode,
    onClick: () => void,
    active = false,
    title?: string,
  ) => (
    <button
      className={cx('knowledge-toolbar-button', active && 'is-active')}
      disabled={!editor || isReadOnly}
      onClick={onClick}
      title={title}
      type="button"
    >
      {label}
    </button>
  );

  return (
    <div
      className="knowledge-editor-card"
      onDrop={onDrop}
      onPaste={(event) => {
        const hasImage =
          Array.from(event.clipboardData.files).some((file) => file.type.startsWith('image/')) ||
          Array.from(event.clipboardData.items).some(
            (item) => item.kind === 'file' && item.type.startsWith('image/'),
          );
        if (hasImage) {
          onPaste(event);
        }
      }}
    >
      <div className="knowledge-editor-toolbar">
        <div className="knowledge-toolbar-group">
          <div className="knowledge-toolbar-menu">
            <button
              className="knowledge-block-select"
              disabled={!editor || isReadOnly}
              onClick={() => setOpenToolbarMenu(openToolbarMenu === 'block' ? null : 'block')}
              type="button"
            >
              {getBlockLabel()}
              <span>⌄</span>
            </button>
            {openToolbarMenu === 'block' ? (
              <div className="knowledge-toolbar-popover knowledge-block-menu">
                {[
                  ['Parágrafo', () => editor?.chain().focus().setParagraph().run(), '¶'],
                  [
                    'Título 1',
                    () => editor?.chain().focus().toggleHeading({ level: 1 }).run(),
                    'H1',
                  ],
                  [
                    'Título 2',
                    () => editor?.chain().focus().toggleHeading({ level: 2 }).run(),
                    'H2',
                  ],
                  [
                    'Título 3',
                    () => editor?.chain().focus().toggleHeading({ level: 3 }).run(),
                    'H3',
                  ],
                  ['Citação', () => editor?.chain().focus().toggleBlockquote().run(), '❝'],
                  ['Nota', () => insertCallout('info'), 'ⓘ'],
                  ['Importante', () => insertCallout('success'), '☆'],
                  ['Alerta', () => insertCallout('warning'), '△'],
                  ['Cuidado', () => insertCallout('danger'), '!'],
                ].map(([label, action, icon]) => (
                  <button
                    key={String(label)}
                    onClick={() => {
                      (action as () => void)();
                      setOpenToolbarMenu(null);
                    }}
                    type="button"
                  >
                    <span>{icon as ReactNode}</span>
                    {label as ReactNode}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="knowledge-toolbar-divider" />
        <div className="knowledge-toolbar-group">
          {toolbarButton('B', () => editor?.chain().focus().toggleBold().run(), Boolean(editor?.isActive('bold')), 'Negrito')}
          {toolbarButton('I', () => editor?.chain().focus().toggleItalic().run(), Boolean(editor?.isActive('italic')), 'Itálico')}
          {toolbarButton('U', () => editor?.chain().focus().toggleUnderline().run(), Boolean(editor?.isActive('underline')), 'Sublinhado')}
          {toolbarButton('S', () => editor?.chain().focus().toggleStrike().run(), Boolean(editor?.isActive('strike')), 'Tachado')}
        </div>

        <div className="knowledge-toolbar-divider" />
        <div className="knowledge-toolbar-group">
          {toolbarButton('•', () => editor?.chain().focus().toggleBulletList().run(), Boolean(editor?.isActive('bulletList')), 'Lista com bullets')}
          {toolbarButton('1.', () => editor?.chain().focus().toggleOrderedList().run(), Boolean(editor?.isActive('orderedList')), 'Lista numerada')}
          {toolbarButton('❝', () => editor?.chain().focus().toggleBlockquote().run(), Boolean(editor?.isActive('blockquote')), 'Citação')}
          {toolbarButton('🔗', insertLink, Boolean(editor?.isActive('link')), 'Link')}
        </div>

        <div className="knowledge-toolbar-divider" />
        <div className="knowledge-toolbar-group">
          <div className="knowledge-toolbar-menu">
            {toolbarButton('A', () => setOpenToolbarMenu(openToolbarMenu === 'text-color' ? null : 'text-color'), false, 'Cor do texto')}
            {openToolbarMenu === 'text-color' ? (
              <div className="knowledge-toolbar-popover knowledge-color-menu">
                <strong>Cor do texto</strong>
                {(Object.keys(TEXT_TONE_LABELS) as TextTone[]).map((tone) => (
                  <button key={tone} onClick={() => setTextTone(tone)} type="button">
                    <span className={`knowledge-tone-dot tone-${tone}`} />
                    {TEXT_TONE_LABELS[tone]}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <div className="knowledge-toolbar-menu">
            {toolbarButton('▧', () => setOpenToolbarMenu(openToolbarMenu === 'mark-color' ? null : 'mark-color'), false, 'Marca-texto')}
            {openToolbarMenu === 'mark-color' ? (
              <div className="knowledge-toolbar-popover knowledge-color-menu">
                <strong>Marcador texto</strong>
                {(Object.keys(MARK_TONE_LABELS) as MarkTone[]).map((tone) => (
                  <button key={tone} onClick={() => setMarkTone(tone)} type="button">
                    <span className={`knowledge-mark-swatch mark-${tone}`} />
                    {MARK_TONE_LABELS[tone]}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="knowledge-toolbar-divider" />
        <div className="knowledge-toolbar-group">
          {toolbarButton('Imagem', onImageButton, false, 'Inserir imagem')}
          {toolbarButton('Vídeo', insertVideo, false, 'Inserir vídeo YouTube')}
          <div className="knowledge-toolbar-menu">
            {toolbarButton('Leia também', () => {
              setRelatedDraftOpen(!relatedDraftOpen);
              setOpenToolbarMenu('insert');
            }, false, 'Inserir Leia também')}
            {relatedDraftOpen ? (
              <div className="knowledge-toolbar-popover knowledge-related-popover">
                <strong>Leia também</strong>
                <p>
                  Selecione um artigo público publicado. O card mantém referência governada por
                  slug.
                </p>
                <input
                  onChange={(event) => setRelatedQuery(event.target.value)}
                  placeholder="Buscar por título, slug ou categoria"
                  value={relatedQuery}
                />
                <div className="knowledge-related-list">
                  {relatedArticleOptions.length > 0 ? (
                    relatedArticleOptions.map((article) => (
                      <button
                        key={article.id}
                        onClick={() => insertRelatedArticle(article)}
                        type="button"
                      >
                        <span>{article.title}</span>
                        <small>
                          {article.category_name ?? 'Sem categoria'} · {article.slug}
                        </small>
                      </button>
                    ))
                  ) : (
                    <span className="knowledge-related-empty">
                      Nenhum artigo público publicado elegível encontrado.
                    </span>
                  )}
                </div>
              </div>
            ) : null}
          </div>
          {toolbarButton('Divisor', () => editor?.chain().focus().setHorizontalRule().run(), false, 'Inserir divisor')}
          {toolbarButton('✓', insertIconMarker, false, 'Ícone ou marcador visual')}
          {toolbarButton('</>', () => editor?.chain().focus().toggleCodeBlock().run(), Boolean(editor?.isActive('codeBlock')), 'Código')}
        </div>

        <div className="knowledge-toolbar-spacer" />
        <div className="knowledge-toolbar-group">
          {toolbarButton('↶', () => editor?.chain().focus().undo().run(), false, 'Desfazer')}
          {toolbarButton('↷', () => editor?.chain().focus().redo().run(), false, 'Refazer')}
        </div>
      </div>

      <EditorContent className="knowledge-rich-editor" editor={editor} />

      {valueDialog ? (
        <div
          aria-labelledby="knowledge-editor-value-dialog-title"
          aria-modal="true"
          className="fixed inset-0 z-[70] flex items-center justify-center bg-[rgba(12,18,32,0.5)] p-4 backdrop-blur-sm"
          role="dialog"
        >
          <form
            className="w-full max-w-md rounded-2xl border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] p-5 shadow-2xl"
            onSubmit={submitValueDialog}
          >
            <h2
              className="text-base font-semibold text-[color:var(--minimal-text)]"
              id="knowledge-editor-value-dialog-title"
            >
              {valueDialog === 'link' ? 'Inserir link' : 'Inserir vídeo do YouTube'}
            </h2>
            <p className="mt-1 text-sm leading-5 text-[color:var(--minimal-text-secondary)]">
              {valueDialog === 'link'
                ? 'Informe uma URL segura. Deixe vazio para remover o link da seleção.'
                : 'Informe a URL do vídeo; o conteúdo será incorporado somente se o domínio for aceito.'}
            </p>
            <label className="mt-4 grid gap-2" htmlFor="knowledge-editor-value-input">
              <span className="text-sm font-medium text-[color:var(--minimal-text)]">URL</span>
              <input
                aria-describedby={valueDialogError ? 'knowledge-editor-value-error' : undefined}
                aria-invalid={Boolean(valueDialogError)}
                className="h-10 rounded-lg border border-[color:var(--minimal-border-strong)] bg-[color:var(--minimal-surface)] px-3.5 text-sm text-[color:var(--minimal-text)] outline-none transition-colors placeholder:text-[color:var(--minimal-text-tertiary)] focus:border-[color:var(--minimal-action)] focus:ring-2 focus:ring-[color:var(--minimal-focus)]"
                id="knowledge-editor-value-input"
                onChange={(event) => {
                  setValueDraft(event.target.value);
                  setValueDialogError(null);
                }}
                ref={valueInputRef}
                type="text"
                value={valueDraft}
              />
            </label>
            {valueDialogError ? (
              <p
                className="mt-2 text-sm text-[color:var(--color-danger-ink)]"
                id="knowledge-editor-value-error"
                role="alert"
              >
                {valueDialogError}
              </p>
            ) : null}
            <div className="mt-5 flex justify-end gap-2">
              <GhostButton onClick={closeValueDialog} type="button">
                Cancelar
              </GhostButton>
              <AppButton type="submit">Confirmar</AppButton>
            </div>
          </form>
        </div>
      ) : null}

      <div className="knowledge-editor-statusbar">
        <span>{wordCount} palavras · Edição local</span>
        <span>Atalhos: Ctrl+S salvar · Ctrl+K inserir link</span>
        <span>
          {assetState === 'saving'
            ? 'Enviando mídia'
            : assetState === 'error'
              ? 'Falha ao enviar mídia'
              : 'Último salvamento: agora'}
        </span>
      </div>

      <style>{`
        .knowledge-editor-card {
          display: grid;
          grid-template-rows: 44px minmax(0, 1fr) 52px;
          height: 100%;
          min-height: 0;
          min-width: 0;
          overflow: hidden;
          padding-top: 0;
          border: 1px solid var(--minimal-border);
          border-radius: 12px;
          background: #FFFFFF;
          box-shadow: 0 18px 50px rgba(22, 36, 67, 0.06);
        }

        .knowledge-editor-meta-grid {
          display: grid;
          grid-template-columns: 1.15fr .95fr .95fr;
          gap: 12px;
          height: 116px;
          min-height: 0;
          margin-bottom: 0;
          padding: 12px 16px 8px;
          border: 1px solid var(--minimal-border);
          border-radius: 12px;
          background: #FFFFFF;
        }

        .knowledge-editor-content-grid {
          display: grid;
          grid-template-rows: 116px minmax(0, 1fr);
          gap: 12px;
          height: 100%;
        }

        .knowledge-editor-meta-grid > label {
          min-width: 0;
        }

        .knowledge-editor-toolbar {
          position: relative;
          top: auto;
          z-index: 50;
          display: flex;
          /* A toolbar precisa caber no canvas. Sem wrap e sem limite de largura,
             os botoes finais (desfazer/refazer) vazavam para fora do card. */
          flex-wrap: nowrap;
          max-width: 100%;
          min-width: 0;
          height: 44px;
          min-height: 44px;
          align-items: center;
          gap: 8px;
          border-bottom: 1px solid #E8EEF7;
          background: rgba(255, 255, 255, 0.96);
          padding: 6px 10px;
        }

         .knowledge-editor-card { overflow: hidden; }

         .knowledge-rich-editor {
           min-height: 0;
           overflow-y: auto;
           overflow-x: hidden;
         }

         .knowledge-rich-editor .ProseMirror {
           min-height: 100%;
         }

        /* O espacador so empurra o grupo final quando ha folga real na linha. */
        .knowledge-toolbar-spacer {
          flex: 1 1 0%;
          min-width: 0;
        }

        .knowledge-toolbar-group {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .knowledge-toolbar-spacer {
          flex: 1 1 auto;
        }

        .knowledge-toolbar-divider {
          height: 24px;
          width: 1px;
          background: #E8EEF7;
        }

        .knowledge-toolbar-button,
        .knowledge-block-select {
          display: inline-flex;
          height: 32px;
          align-items: center;
          justify-content: center;
          gap: 7px;
          border: 1px solid transparent;
          border-radius: 10px;
          background: transparent;
          color: #162443;
          cursor: pointer;
          font-size: 0.8rem;
          font-weight: 600;
          min-width: 32px;
          padding: 0 9px;
        }

        .knowledge-block-select {
          min-width: 112px;
          justify-content: space-between;
          border-color: #DCE4F2;
          background: #FFFFFF;
        }

        .knowledge-toolbar-button:hover,
        .knowledge-block-select:hover,
        .knowledge-toolbar-button.is-active {
          border-color: #DCE4F2;
          background: #F4F7FC;
        }

        .knowledge-toolbar-button:disabled,
        .knowledge-block-select:disabled {
          cursor: not-allowed;
          opacity: 0.45;
        }

        .knowledge-toolbar-menu {
          position: relative;
          display: inline-flex;
        }

        .knowledge-toolbar-popover {
          position: absolute;
          left: 0;
          top: calc(100% + 10px);
          z-index: 40;
          min-width: 190px;
          border: 1px solid #DCE4F2;
          border-radius: 18px;
          background: #FFFFFF;
          box-shadow: 0 18px 46px rgba(22, 36, 67, 0.14);
          padding: 8px;
        }

        .knowledge-block-menu button,
        .knowledge-color-menu button {
          display: flex;
          width: 100%;
          align-items: center;
          gap: 10px;
          border: 0;
          border-radius: 12px;
          background: transparent;
          color: #162443;
          cursor: pointer;
          font-size: 0.78rem;
          font-weight: 500;
          padding: 10px 12px;
          text-align: left;
        }

        .knowledge-block-menu button:hover,
        .knowledge-color-menu button:hover {
          background: #F4F7FC;
        }

        .knowledge-color-menu {
          display: grid;
          gap: 4px;
        }

        .knowledge-color-menu strong,
        .knowledge-related-popover strong {
          color: #162443;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 8px 10px 4px;
        }

        .knowledge-tone-dot,
        .knowledge-mark-swatch {
          display: inline-block;
          height: 14px;
          width: 14px;
          border: 1px solid #C8D4EA;
          border-radius: 999px;
        }

        .knowledge-mark-swatch {
          border-radius: 4px;
        }

        .tone-default { background: #162443; }
        .tone-blue { background: #2F6BFF; }
        .tone-green { background: #16A34A; }
        .tone-yellow { background: #D97706; }
        .tone-red { background: #DC2626; }
        .tone-gray { background: #6B7892; }
        .mark-none { background: #FFFFFF; }
        .mark-blue { background: #DCEBFF; }
        .mark-green { background: #DDF8E8; }
        .mark-yellow { background: #FFF1B8; }
        .mark-pink { background: #FFE0F0; }
        .mark-purple { background: #F3E8FF; }
        .mark-gray { background: #E8EEF7; }

        .knowledge-related-popover {
          display: grid;
          gap: 8px;
          min-width: 360px;
          max-width: 420px;
        }

        .knowledge-related-popover p {
          color: #6B7892;
          font-size: 0.72rem;
          line-height: 1.4;
          margin: 0;
          padding: 0 10px;
        }

        .knowledge-related-popover input,
        .knowledge-related-popover textarea {
          border: 1px solid #DCE4F2;
          border-radius: 12px;
          color: #162443;
          font-size: 0.78rem;
          font-weight: 500;
          padding: 9px 11px;
        }

        .knowledge-related-list {
          display: grid;
          gap: 6px;
          max-height: 280px;
          overflow: auto;
        }

        .knowledge-related-list button {
          display: grid;
          gap: 3px;
          border: 1px solid #E8EEF7;
          border-radius: 12px;
          background: #FFFFFF;
          color: #162443;
          cursor: pointer;
          font-weight: 600;
          justify-items: start;
          padding: 10px 11px;
          text-align: left;
        }

        .knowledge-related-list button:hover {
          border-color: #C8D4EA;
          background: #F4F7FC;
        }

        .knowledge-related-list small {
          color: #6B7892;
          font-size: 0.68rem;
          font-weight: 500;
        }

        .knowledge-related-empty {
          border: 1px dashed #C8D4EA;
          border-radius: 12px;
          color: #6B7892;
          font-size: 0.75rem;
          padding: 12px;
        }

        .knowledge-rich-editor .ProseMirror {
          min-height: 660px;
          max-width: 980px;
          outline: none;
          padding: 34px 48px 56px;
          color: #162443;
        }

        .knowledge-rich-editor .ProseMirror h1 {
          color: #162443;
          font-size: clamp(1.72rem, 1.4vw, 2rem);
          font-weight: 900;
          letter-spacing: -0.03em;
          line-height: 1.18;
          margin: 0 0 1rem;
        }

        .knowledge-rich-editor .ProseMirror h2 {
          color: #162443;
          font-size: 1.32rem;
          font-weight: 900;
          letter-spacing: -0.02em;
          line-height: 1.22;
          margin: 2rem 0 0.7rem;
        }

        .knowledge-rich-editor .ProseMirror h3 {
          color: #162443;
          font-size: 1.08rem;
          font-weight: 850;
          margin: 1.5rem 0 0.6rem;
        }

        .knowledge-rich-editor .ProseMirror p,
        .knowledge-rich-editor .ProseMirror li {
          color: #24324F;
          font-size: 0.95rem;
          line-height: 1.72;
        }

        .knowledge-rich-editor .ProseMirror ul,
        .knowledge-rich-editor .ProseMirror ol {
          margin: 0.4rem 0 1rem 1.25rem;
          padding-left: 1rem;
        }

        .knowledge-rich-editor .ProseMirror blockquote {
          border-radius: 14px;
          background: #F4F7FC;
          color: #162443;
          margin: 1.2rem 0;
          padding: 14px 18px;
        }

        .knowledge-rich-editor .ProseMirror code {
          border-radius: 7px;
          background: #F4F7FC;
          color: #162443;
          font-size: 0.86em;
          padding: 0.16rem 0.36rem;
        }

        .knowledge-rich-editor .ProseMirror pre {
          border-radius: 16px;
          background: #061B54;
          color: #F4F7FC;
          padding: 16px;
        }

        .knowledge-rich-editor .ProseMirror a {
          color: #2F6BFF;
          font-weight: 800;
          text-decoration: underline;
          text-underline-offset: 3px;
        }

        .knowledge-rich-editor [data-text-tone="blue"] { color: #2F6BFF; }
        .knowledge-rich-editor [data-text-tone="green"] { color: #16A34A; }
        .knowledge-rich-editor [data-text-tone="yellow"] { color: #D97706; }
        .knowledge-rich-editor [data-text-tone="red"] { color: #DC2626; }
        .knowledge-rich-editor [data-text-tone="gray"] { color: #6B7892; }
        .knowledge-rich-editor [data-mark-tone="blue"] { background: #DCEBFF; }
        .knowledge-rich-editor [data-mark-tone="green"] { background: #DDF8E8; }
        .knowledge-rich-editor [data-mark-tone="yellow"] { background: #FFF1B8; }
        .knowledge-rich-editor [data-mark-tone="pink"] { background: #FFE0F0; }
        .knowledge-rich-editor [data-mark-tone="purple"] { background: #F3E8FF; }
        .knowledge-rich-editor [data-mark-tone="gray"] { background: #E8EEF7; }

        .knowledge-rich-editor .ProseMirror aside[data-callout-tone] {
          align-items: flex-start;
          border: 1px solid #B9D2FF;
          border-radius: 16px;
          display: grid;
          gap: 6px;
          grid-template-columns: auto 1fr;
          margin: 1.35rem 0;
          padding: 15px 18px;
        }

        /* Rotulo do callout: cromo gerado pelo tom, nao editavel. */
        .knowledge-rich-editor .ProseMirror aside[data-callout-tone]::before {
          display: block;
          margin-bottom: 4px;
          font-weight: 700;
          font-size: 0.82rem;
        }

        .knowledge-rich-editor .ProseMirror aside[data-callout-tone="info"]::before { content: 'Nota'; }
        .knowledge-rich-editor .ProseMirror aside[data-callout-tone="success"]::before { content: 'Importante'; }
        .knowledge-rich-editor .ProseMirror aside[data-callout-tone="warning"]::before { content: 'Atenção'; }
        .knowledge-rich-editor .ProseMirror aside[data-callout-tone="danger"]::before { content: 'Cuidado'; }

        .knowledge-rich-editor .ProseMirror aside[data-callout-tone] strong {
          grid-column: 1 / -1;
          font-size: 0.9rem;
          font-weight: 900;
        }

        .knowledge-rich-editor .ProseMirror aside[data-callout-tone] p {
          grid-column: 1 / -1;
          margin: 0;
        }

        .knowledge-rich-editor .ProseMirror aside[data-callout-tone="info"] {
          background: #EAF2FF;
          color: #1F58E7;
        }

        .knowledge-rich-editor .ProseMirror aside[data-callout-tone="success"] {
          border-color: #A7F3D0;
          background: #EAF9F0;
          color: #15803D;
        }

        .knowledge-rich-editor .ProseMirror aside[data-callout-tone="warning"] {
          border-color: #FAD38C;
          background: #FFF4D9;
          color: #B45309;
        }

        .knowledge-rich-editor .ProseMirror aside[data-callout-tone="danger"] {
          border-color: #FCA5A5;
          background: #FDEBEC;
          color: #B91C1C;
        }

        .knowledge-rich-editor .ProseMirror hr {
          border: 0;
          border-top: 2px dashed #DCE4F2;
          margin: 2rem 0;
        }

        .knowledge-rich-editor .related-card {
          align-items: center;
          border: 1px solid #DDD6FE;
          border-radius: 16px;
          background: #F3E8FF;
          color: #4C1D95;
          display: grid;
          gap: 3px 14px;
          grid-template-columns: 1fr auto;
          margin: 1.35rem 0;
          padding: 16px 18px;
        }

        .knowledge-rich-editor .related-card strong {
          font-size: 0.9rem;
          font-weight: 900;
        }

        .knowledge-rich-editor .related-card p {
          color: #4C1D95;
          font-weight: 850;
          margin: 0;
        }

        .knowledge-rich-editor .related-card small {
          color: #6D28D9;
        }

        .knowledge-media-node {
          position: relative;
          border: 1px solid #DCE4F2;
          border-radius: 18px;
          background: #FFFFFF;
          margin: 1.45rem 0;
          max-width: 100%;
          padding: 0;
        }

        .knowledge-media-node img {
          display: block;
          width: 100%;
          border-radius: 16px 16px 0 0;
        }

        .knowledge-media-node figcaption {
          color: #6B7892;
          font-size: 0.78rem;
          padding: 9px 12px 12px;
        }

        .knowledge-media-node-small { width: min(320px, 100%); }
        .knowledge-media-node-medium { width: min(560px, 100%); }
        .knowledge-media-node-large { width: min(760px, 100%); }
        .knowledge-media-node-full { width: 100%; }

        .knowledge-media-toolbar {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          justify-content: center;
          margin: -17px auto 8px;
          max-width: max-content;
          border: 1px solid #DCE4F2;
          border-radius: 14px;
          background: #FFFFFF;
          box-shadow: 0 12px 26px rgba(22, 36, 67, 0.12);
          padding: 6px;
        }

        .knowledge-media-toolbar button {
          border: 0;
          border-radius: 9px;
          background: transparent;
          color: #162443;
          cursor: pointer;
          font-size: 0.72rem;
          font-weight: 850;
          padding: 7px 9px;
        }

        .knowledge-media-toolbar button.is-active {
          background: #2F6BFF;
          color: #FFFFFF;
        }

        .knowledge-media-toolbar button.is-danger {
          color: #DC2626;
        }

        .youtube-card {
          align-items: center;
          background: radial-gradient(circle at 50% 30%, #132653, #070F2E);
          border-radius: 16px;
          color: #FFFFFF;
          display: grid;
          gap: 10px;
          justify-items: center;
          min-height: 240px;
          padding: 28px;
          text-align: center;
        }

        .youtube-card__play {
          align-items: center;
          background: #EF4444;
          border-radius: 999px;
          display: inline-flex;
          height: 44px;
          justify-content: center;
          width: 44px;
        }

        .image-missing {
          border-radius: 16px;
          background: #F4F7FC;
          color: #6B7892;
          padding: 24px;
          text-align: center;
        }

        .knowledge-editor-statusbar {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 12px;
          border-top: 1px solid #E8EEF7;
          color: #6B7892;
          font-size: 0.75rem;
          height: 52px;
          align-items: center;
          padding: 8px 12px;
        }

        .knowledge-editor-statusbar span:last-child {
          justify-self: end;
        }

        @media (max-width: 1280px) {
          .knowledge-editor-meta-grid {
            grid-template-columns: 1fr 1fr;
          }

          .knowledge-editor-meta-grid > label:last-child {
            grid-column: 1 / -1;
          }

          .knowledge-editor-toolbar {
            align-items: flex-start;
            flex-wrap: wrap;
            top: var(--knowledge-editor-toolbar-offset-compact, 6.75rem);
          }

          .knowledge-rich-editor .ProseMirror {
            padding: 28px 32px 48px;
          }
        }

        @media (max-width: 767px) {
          .knowledge-editor-meta-grid {
            grid-template-columns: 1fr;
            gap: 10px;
            padding: 12px;
          }

          .knowledge-editor-meta-grid > label:last-child {
            grid-column: auto;
          }
        }

        /* Tema escuro: o canvas e a toolbar usavam cores fixas claras, o que
           deixava o editor como uma ilha branca dentro do shell escuro e
           tornava os rótulos da toolbar praticamente ilegíveis. */
        [data-theme='dark'] .knowledge-editor-card {
          border-color: var(--minimal-border);
          background: var(--minimal-surface);
          box-shadow: none;
        }

        [data-theme='dark'] .knowledge-editor-meta-grid {
          border-color: var(--minimal-border);
          background: var(--minimal-surface-muted);
        }

        [data-theme='dark'] .knowledge-editor-toolbar {
          border-bottom-color: var(--minimal-border);
          background: var(--minimal-sidebar);
        }

        [data-theme='dark'] .knowledge-toolbar-divider {
          background: var(--minimal-border);
        }

        [data-theme='dark'] .knowledge-toolbar-button,
        [data-theme='dark'] .knowledge-block-select {
          border-color: var(--minimal-border);
          background: var(--minimal-surface);
          color: var(--minimal-text);
        }

        [data-theme='dark'] .knowledge-toolbar-button:hover,
        [data-theme='dark'] .knowledge-block-select:hover {
          background: var(--minimal-surface-muted);
        }

        [data-theme='dark'] .knowledge-toolbar-button[aria-pressed='true'],
        [data-theme='dark'] .knowledge-toolbar-button.is-active {
          background: var(--minimal-selection);
          color: var(--minimal-selection-text);
        }

        [data-theme='dark'] .knowledge-rich-editor,
        [data-theme='dark'] .knowledge-rich-editor .ProseMirror {
          background: var(--minimal-surface);
          color: var(--minimal-text);
        }

        [data-theme='dark'] .knowledge-rich-editor .ProseMirror h1,
        [data-theme='dark'] .knowledge-rich-editor .ProseMirror h2,
        [data-theme='dark'] .knowledge-rich-editor .ProseMirror h3,
        [data-theme='dark'] .knowledge-rich-editor .ProseMirror strong {
          color: var(--minimal-text);
        }

        [data-theme='dark'] .knowledge-rich-editor .ProseMirror p,
        [data-theme='dark'] .knowledge-rich-editor .ProseMirror li {
          color: var(--minimal-text-secondary);
        }

        [data-theme='dark'] .knowledge-rich-editor .ProseMirror blockquote {
          border-left-color: var(--minimal-border-strong);
          color: var(--minimal-text-secondary);
        }

        [data-theme='dark'] .knowledge-rich-editor .ProseMirror a {
          color: var(--minimal-action);
        }

        [data-theme='dark'] .knowledge-rich-editor .ProseMirror code {
          background: var(--minimal-surface-muted);
          color: var(--minimal-text);
        }

        [data-theme='dark'] .knowledge-rich-editor .ProseMirror pre {
          border-color: var(--minimal-border);
          background: var(--minimal-sidebar);
          color: var(--minimal-text-secondary);
        }

        [data-theme='dark'] .knowledge-rich-editor .ProseMirror hr {
          border-color: var(--minimal-border);
        }

        [data-theme='dark'] .knowledge-rich-editor .ProseMirror mark {
          background: var(--minimal-warning-surface);
          color: var(--minimal-warning-text);
        }

        [data-theme='dark'] .knowledge-rich-editor .ProseMirror aside[data-callout-tone],
        [data-theme='dark'] .knowledge-rich-editor .related-card {
          border-color: var(--minimal-border-strong);
          background: var(--minimal-surface-muted);
          color: var(--minimal-text-secondary);
        }

        [data-theme='dark'] .knowledge-rich-editor .ProseMirror aside[data-callout-tone] p,
        [data-theme='dark'] .knowledge-rich-editor .related-card p,
        [data-theme='dark'] .knowledge-rich-editor .related-card small {
          color: var(--minimal-text-secondary);
        }

        [data-theme='dark'] .knowledge-toolbar-popover {
          border-color: var(--minimal-border-strong);
          background: var(--minimal-sidebar);
          color: var(--minimal-text);
          box-shadow: 0 16px 36px rgb(0 0 0 / 24%);
        }

        [data-theme='dark'] .knowledge-toolbar-popover input,
        [data-theme='dark'] .knowledge-toolbar-popover textarea {
          border-color: var(--minimal-border);
          background: var(--minimal-surface);
          color: var(--minimal-text);
        }

        [data-theme='dark'] .knowledge-editor-statusbar {
          border-top-color: var(--minimal-border);
          color: var(--minimal-text-tertiary);
        }
      `}</style>
    </div>
  );
}

function LegacyRichTextArticleEditor({
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
  const [openToolbarMenu, setOpenToolbarMenu] = useState<
    'block' | 'text-color' | 'mark-color' | 'insert' | null
  >(null);
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

  function insertBlockHtmlAtCursor(html: string) {
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
    const nodes = Array.from(template.content.childNodes);
    const firstElement = nodes.find((node): node is HTMLElement => node instanceof HTMLElement);
    const shouldSplitBlock =
      firstElement &&
      (firstElement.matches('figure[data-asset-id], figure[data-youtube-id], aside[data-callout-tone]') ||
        firstElement.querySelector('figure[data-asset-id], figure[data-youtube-id], aside[data-callout-tone]'));

    if (!shouldSplitBlock) {
      return insertHtmlAtCursor(html);
    }

    const startElement =
      range.startContainer instanceof HTMLElement
        ? range.startContainer
        : range.startContainer.parentElement;
    const closestTextBlock = startElement?.closest('p,h1,h2,h3,li,blockquote');

    if (!closestTextBlock || !editor.contains(closestTextBlock)) {
      return insertHtmlAtCursor(html);
    }

    const afterRange = range.cloneRange();
    afterRange.selectNodeContents(closestTextBlock);
    afterRange.setStart(range.endContainer, range.endOffset);
    const afterFragment = afterRange.extractContents();
    range.deleteContents();

    const afterText = afterFragment.textContent?.trim() ?? '';
    const afterBlock = afterText ? document.createElement('p') : null;
    if (afterBlock) {
      afterBlock.append(afterFragment);
    }

    const insertedNodes = Array.from(template.content.childNodes);
    closestTextBlock.after(...insertedNodes, ...(afterBlock ? [afterBlock] : []));

    if (!closestTextBlock.textContent?.trim()) {
      closestTextBlock.remove();
    }

    const lastInserted = afterBlock ?? insertedNodes[insertedNodes.length - 1];
    if (lastInserted) {
      const nextRange = document.createRange();
      nextRange.setStartAfter(lastInserted);
      nextRange.collapse(true);
      selection?.removeAllRanges();
      selection?.addRange(nextRange);
      savedRangeRef.current = nextRange.cloneRange();
    }

    return emitChange();
  }

  function insertMarkdownAtCursor(markdown: string) {
    return insertBlockHtmlAtCursor(renderEditorHtmlFromMarkdown(markdown, assets));
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

  function wrapSelectionWithSpan(kind: 'text' | 'mark', tone: TextTone | MarkTone) {
    if (isReadOnly) {
      return;
    }

    restoreSelection();
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      return;
    }

    const range = selection.getRangeAt(0);
    const span = document.createElement('span');
    if (kind === 'text') {
      const textTone = tone as TextTone;
      if (textTone === 'default') {
        const content = range.extractContents();
        range.insertNode(content);
        emitChange();
        return;
      }
      span.dataset.textTone = textTone;
    } else {
      const markTone = tone as MarkTone;
      if (markTone === 'none') {
        const content = range.extractContents();
        range.insertNode(content);
        emitChange();
        return;
      }
      span.dataset.markTone = markTone;
    }
    span.append(range.extractContents());
    range.insertNode(span);
    selection.removeAllRanges();
    const nextRange = document.createRange();
    nextRange.selectNodeContents(span);
    nextRange.collapse(false);
    selection.addRange(nextRange);
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

  function insertCallout(tone: CalloutTone) {
    insertBlockHtmlAtCursor(
      `<aside data-callout-tone="${tone}"><p>Escreva a observação do artigo.</p></aside>`,
    );
  }

  function insertDivider(style: 'solid' | 'dashed' | 'space' = 'dashed') {
    insertBlockHtmlAtCursor(`<hr data-divider-style="${style}" />`);
  }

  function insertRelatedArticle() {
    const slug = window.prompt('Informe o slug de um artigo público relacionado');
    if (!slug) {
      return;
    }
    const normalizedSlug = slugify(slug);
    if (!normalizedSlug) {
      return;
    }
    const title = window.prompt('Título do artigo relacionado') ?? 'Artigo relacionado';
    insertBlockHtmlAtCursor(
      `<section data-related-slug="${normalizedSlug}" contenteditable="false" class="related-card"><strong>Leia também</strong><p data-related-title>${escapeHtml(title)}</p><small data-related-summary>Artigo relacionado da base de conhecimento.</small><span>→</span></section>`,
    );
  }

  function insertMarker(label: string) {
    insertHtmlAtCursor(`<span data-mark-tone="blue"> ${escapeHtml(label)} </span>`);
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
    insertBlockHtmlAtCursor(renderYoutubeFigure(videoId, 'large'));
  }

  const blockOptions: Array<{
    label: string;
    onClick: () => void;
    icon: string;
  }> = [
    { label: 'Parágrafo', icon: '¶', onClick: () => runCommand('formatBlock', 'p') },
    { label: 'Título 1', icon: 'H1', onClick: () => runCommand('formatBlock', 'h1') },
    { label: 'Título 2', icon: 'H2', onClick: () => runCommand('formatBlock', 'h2') },
    { label: 'Título 3', icon: 'H3', onClick: () => runCommand('formatBlock', 'h3') },
    { label: 'Citação', icon: '“', onClick: () => runCommand('formatBlock', 'blockquote') },
    { label: 'Nota', icon: 'ⓘ', onClick: () => insertCallout('info') },
    { label: 'Importante', icon: '★', onClick: () => insertCallout('success') },
    { label: 'Alerta', icon: '⚠', onClick: () => insertCallout('warning') },
    { label: 'Cuidado', icon: '!', onClick: () => insertCallout('danger') },
  ];

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
        'relative flex flex-col transition focus-within:bg-[rgba(234,242,255,0.05)]',
        assetState === 'saving' && 'bg-[rgba(234,242,255,0.2)]',
      )}
    >
      <div className="sticky top-0 z-10 flex h-12 shrink-0 items-center gap-1.5 overflow-x-auto border-b border-[#E8EEF7] bg-[color:var(--color-surface-strong)] px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="relative">
          <button
            className="mr-1 inline-flex h-8 min-w-[112px] items-center justify-between gap-2 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)] px-3 text-[0.76rem] font-bold text-[color:var(--color-brand-navy)] shadow-sm"
            onClick={() => setOpenToolbarMenu(openToolbarMenu === 'block' ? null : 'block')}
            type="button"
          >
            Parágrafo <span className="text-[#6B7892]">⌄</span>
          </button>
          {openToolbarMenu === 'block' ? (
            <ToolbarMenu className="left-0 top-10 w-40">
              {blockOptions.map((option) => (
                <button
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-[0.76rem] font-bold text-[#162443] hover:bg-[#F4F7FC]"
                  key={option.label}
                  onClick={() => {
                    option.onClick();
                    setOpenToolbarMenu(null);
                  }}
                  type="button"
                >
                  <span className="grid h-5 w-6 place-items-center text-[#2F6BFF]">
                    {option.icon}
                  </span>
                  {option.label}
                </button>
              ))}
            </ToolbarMenu>
          ) : null}
        </div>
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
        <ToolbarButton onClick={() => runCommand('strikeThrough')} title="Tachado">
          <span className="line-through">S</span>
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
        <div className="relative">
          <ToolbarButton
            onClick={() =>
              setOpenToolbarMenu(openToolbarMenu === 'text-color' ? null : 'text-color')
            }
            title="Cor do texto"
          >
            A
          </ToolbarButton>
          {openToolbarMenu === 'text-color' ? (
            <ToolbarMenu className="left-0 top-10 w-36">
              {(Object.keys(TEXT_TONE_LABELS) as TextTone[]).map((tone) => (
                <button
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[0.76rem] font-bold text-[#162443] hover:bg-[#F4F7FC]"
                  key={tone}
                  onClick={() => {
                    wrapSelectionWithSpan('text', tone);
                    setOpenToolbarMenu(null);
                  }}
                  type="button"
                >
                  <span className={`toolbar-swatch text-${tone}`} />
                  {TEXT_TONE_LABELS[tone]}
                </button>
              ))}
            </ToolbarMenu>
          ) : null}
        </div>
        <div className="relative">
          <ToolbarButton
            onClick={() => setOpenToolbarMenu(openToolbarMenu === 'mark-color' ? null : 'mark-color')}
            title="Marca-texto"
          >
            ✎
          </ToolbarButton>
          {openToolbarMenu === 'mark-color' ? (
            <ToolbarMenu className="left-0 top-10 w-40">
              {(Object.keys(MARK_TONE_LABELS) as MarkTone[]).map((tone) => (
                <button
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[0.76rem] font-bold text-[#162443] hover:bg-[#F4F7FC]"
                  key={tone}
                  onClick={() => {
                    wrapSelectionWithSpan('mark', tone);
                    setOpenToolbarMenu(null);
                  }}
                  type="button"
                >
                  <span className={`toolbar-swatch mark-${tone}`} />
                  {MARK_TONE_LABELS[tone]}
                </button>
              ))}
            </ToolbarMenu>
          ) : null}
        </div>
        <span className="mx-1 h-7 w-px bg-[color:var(--color-border)]" />
        <ToolbarButton
          disabled={assetState === 'saving'}
          onClick={onImageButton}
          title="Inserir imagem no corpo"
        >
          ▣
        </ToolbarButton>
        <ToolbarButton onClick={insertYoutube} title="Inserir vídeo YouTube">
          ▶
        </ToolbarButton>
        <div className="relative">
          <ToolbarButton
            onClick={() => setOpenToolbarMenu(openToolbarMenu === 'insert' ? null : 'insert')}
            title="Inserir bloco"
          >
            ⊞
          </ToolbarButton>
          {openToolbarMenu === 'insert' ? (
            <ToolbarMenu className="right-0 top-10 w-44">
              {[
                ['Nota', () => insertCallout('info')],
                ['Importante', () => insertCallout('success')],
                ['Alerta', () => insertCallout('warning')],
                ['Cuidado', () => insertCallout('danger')],
                ['Leia também', insertRelatedArticle],
                ['Divisor', () => insertDivider('dashed')],
                ['Marcador check', () => insertMarker('✓')],
              ].map(([label, action]) => (
                <button
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-[0.76rem] font-bold text-[#162443] hover:bg-[#F4F7FC]"
                  key={String(label)}
                  onClick={() => {
                    (action as () => void)();
                    setOpenToolbarMenu(null);
                  }}
                  type="button"
                >
                  {String(label)}
                  <span className="text-[#2F6BFF]">+</span>
                </button>
              ))}
            </ToolbarMenu>
          ) : null}
        </div>
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
        <div className="absolute left-1/2 top-[58px] z-20 flex -translate-x-1/2 items-center gap-2 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)] px-2 py-2 shadow-[0_18px_42px_rgba(20,31,71,0.14)]">
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
            className="rounded-xl px-3 py-2 text-[0.72rem] font-bold text-[color:var(--color-danger-ink)] hover:bg-[color:var(--color-danger-surface)]"
            onClick={removeSelectedImage}
            type="button"
          >
            {selectedFigureKind === 'video' ? 'Remover vídeo' : 'Remover imagem'}
          </button>
        </div>
      ) : null}

      <div className="bg-[color:var(--color-surface-strong)]">
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
            .knowledge-rich-editor aside[data-callout-tone='danger'] {
              border-color: #DC2626;
              background: #FDEBEC;
            }
            .knowledge-rich-editor aside[data-callout-tone] strong {
              color: #162443;
              display: block;
              font-size: 13px;
              margin-bottom: 6px;
            }
            .knowledge-rich-editor span[data-text-tone='blue'] { color: #2F6BFF; }
            .knowledge-rich-editor span[data-text-tone='green'] { color: #16A34A; }
            .knowledge-rich-editor span[data-text-tone='yellow'] { color: #D97706; }
            .knowledge-rich-editor span[data-text-tone='red'] { color: #DC2626; }
            .knowledge-rich-editor span[data-text-tone='gray'] { color: #6B7892; }
            .knowledge-rich-editor span[data-mark-tone='blue'] { background: #EAF2FF; border-radius: 6px; padding: 0 4px; }
            .knowledge-rich-editor span[data-mark-tone='green'] { background: #EAF9F0; border-radius: 6px; padding: 0 4px; }
            .knowledge-rich-editor span[data-mark-tone='yellow'] { background: #FFF4D9; border-radius: 6px; padding: 0 4px; }
            .knowledge-rich-editor span[data-mark-tone='pink'] { background: #FCE7F3; border-radius: 6px; padding: 0 4px; }
            .knowledge-rich-editor span[data-mark-tone='purple'] { background: #F3E8FF; border-radius: 6px; padding: 0 4px; }
            .knowledge-rich-editor span[data-mark-tone='gray'] { background: #EEF2F7; border-radius: 6px; padding: 0 4px; }
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
            .knowledge-rich-editor hr {
              border: 0;
              border-top: 2px dashed #DCE4F2;
              margin: 28px 0;
            }
            .knowledge-rich-editor hr[data-divider-style='solid'] {
              border-top-style: solid;
            }
            .knowledge-rich-editor hr[data-divider-style='space'] {
              border-top: 0;
              height: 28px;
            }
            .knowledge-rich-editor .related-card {
              align-items: center;
              background: #F3E8FF;
              border: 1px solid rgba(124, 58, 237, 0.22);
              border-radius: 18px;
              color: #162443;
              display: grid;
              grid-template-columns: 1fr auto;
              gap: 4px 16px;
              margin: 24px 0;
              padding: 16px 18px;
            }
            .knowledge-rich-editor .related-card strong {
              color: #7C3AED;
              font-size: 13px;
              grid-column: 1 / -1;
            }
            .knowledge-rich-editor .related-card p {
              color: #4C1D95;
              font-weight: 800;
              margin: 0;
            }
            .knowledge-rich-editor .related-card small {
              color: #6B7892;
              font-size: 12px;
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
            .toolbar-swatch {
              border: 1px solid #DCE4F2;
              border-radius: 999px;
              display: inline-block;
              height: 14px;
              width: 14px;
            }
            .toolbar-swatch.text-default { background: #162443; }
            .toolbar-swatch.text-blue { background: #2F6BFF; }
            .toolbar-swatch.text-green { background: #16A34A; }
            .toolbar-swatch.text-yellow { background: #F5B83D; }
            .toolbar-swatch.text-red { background: #EF4444; }
            .toolbar-swatch.text-gray { background: #98A3B8; }
            .toolbar-swatch.mark-none { background: #FFFFFF; }
            .toolbar-swatch.mark-blue { background: #EAF2FF; }
            .toolbar-swatch.mark-green { background: #EAF9F0; }
            .toolbar-swatch.mark-yellow { background: #FFF4D9; }
            .toolbar-swatch.mark-pink { background: #FCE7F3; }
            .toolbar-swatch.mark-purple { background: #F3E8FF; }
            .toolbar-swatch.mark-gray { background: #EEF2F7; }

            /* O editor foi originalmente desenhado apenas para o tema claro.
               Estes tokens mantêm a leitura e os controles consistentes no dark,
               sem alterar as cores semânticas das mídias incorporadas. */
            :root[data-theme='dark'] .knowledge-editor-card {
              border-color: var(--minimal-border);
              background: var(--minimal-surface);
              box-shadow: var(--minimal-shadow);
            }
            :root[data-theme='dark'] .knowledge-editor-toolbar {
              border-bottom-color: var(--minimal-border);
              background: color-mix(in srgb, var(--minimal-sidebar) 94%, transparent);
            }
            :root[data-theme='dark'] .knowledge-toolbar-divider,
            :root[data-theme='dark'] .knowledge-rich-editor hr {
              background: var(--minimal-border);
            }
            :root[data-theme='dark'] .knowledge-toolbar-button,
            :root[data-theme='dark'] .knowledge-block-select,
            :root[data-theme='dark'] .knowledge-block-menu button,
            :root[data-theme='dark'] .knowledge-color-menu button,
            :root[data-theme='dark'] .knowledge-color-menu strong,
            :root[data-theme='dark'] .knowledge-related-popover strong,
            :root[data-theme='dark'] .knowledge-related-popover input,
            :root[data-theme='dark'] .knowledge-related-popover textarea,
            :root[data-theme='dark'] .knowledge-related-list button {
              color: var(--minimal-text);
            }
            :root[data-theme='dark'] .knowledge-block-select,
            :root[data-theme='dark'] .knowledge-toolbar-popover,
            :root[data-theme='dark'] .knowledge-related-popover input,
            :root[data-theme='dark'] .knowledge-related-popover textarea,
            :root[data-theme='dark'] .knowledge-related-list button,
            :root[data-theme='dark'] .knowledge-media-node,
            :root[data-theme='dark'] .knowledge-media-toolbar {
              border-color: var(--minimal-border);
              background: var(--minimal-surface-muted);
            }
            :root[data-theme='dark'] .knowledge-toolbar-popover,
            :root[data-theme='dark'] .knowledge-related-list button {
              box-shadow: var(--minimal-shadow);
            }
            :root[data-theme='dark'] .knowledge-toolbar-button:hover,
            :root[data-theme='dark'] .knowledge-block-select:hover,
            :root[data-theme='dark'] .knowledge-toolbar-button.is-active,
            :root[data-theme='dark'] .knowledge-block-menu button:hover,
            :root[data-theme='dark'] .knowledge-color-menu button:hover,
            :root[data-theme='dark'] .knowledge-related-list button:hover {
              border-color: var(--minimal-border-hover);
              background: var(--minimal-surface);
            }
            :root[data-theme='dark'] .knowledge-related-popover p,
            :root[data-theme='dark'] .knowledge-related-list small,
            :root[data-theme='dark'] .knowledge-related-empty,
            :root[data-theme='dark'] .knowledge-rich-editor figcaption {
              color: var(--minimal-text-secondary);
            }
            :root[data-theme='dark'] .knowledge-rich-editor,
            :root[data-theme='dark'] .knowledge-rich-editor .ProseMirror,
            :root[data-theme='dark'] .knowledge-rich-editor .ProseMirror p,
            :root[data-theme='dark'] .knowledge-rich-editor .ProseMirror li {
              color: var(--minimal-text);
            }
            :root[data-theme='dark'] .knowledge-rich-editor .ProseMirror h1,
            :root[data-theme='dark'] .knowledge-rich-editor .ProseMirror h2,
            :root[data-theme='dark'] .knowledge-rich-editor .ProseMirror h3,
            :root[data-theme='dark'] .knowledge-rich-editor .ProseMirror blockquote,
            :root[data-theme='dark'] .knowledge-rich-editor .ProseMirror code {
              color: var(--minimal-text);
            }
            :root[data-theme='dark'] .knowledge-rich-editor .ProseMirror blockquote,
            :root[data-theme='dark'] .knowledge-rich-editor .ProseMirror code,
            :root[data-theme='dark'] .knowledge-rich-editor .knowledge-media-node {
              background: var(--minimal-surface-muted);
              border-color: var(--minimal-border);
            }
            :root[data-theme='dark'] .knowledge-rich-editor .ProseMirror a,
            :root[data-theme='dark'] .knowledge-rich-editor [data-text-tone='blue'] {
              color: var(--minimal-action);
            }
            :root[data-theme='dark'] .knowledge-rich-editor [data-mark-tone='blue'] {
              background: color-mix(in srgb, var(--minimal-action) 22%, transparent);
            }
            :root[data-theme='dark'] .toolbar-swatch,
            :root[data-theme='dark'] .knowledge-tone-dot,
            :root[data-theme='dark'] .knowledge-mark-swatch {
              border-color: var(--minimal-border-strong);
            }
          `}
        </style>
        <div
          className="knowledge-rich-editor min-h-[680px] max-w-[980px] px-10 py-8 text-[color:var(--minimal-text)] outline-none xl:px-12"
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
  const [relatedArticles, setRelatedArticles] = useState<AdminKnowledgeArticleListItemV2Row[]>([]);
  const [form, setForm] = useState<ArticleEditorForm>(EMPTY_FORM);
  const [status, setStatus] = useState<ArticleEditorStatus>('draft');
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [submitState, setSubmitState] = useState<SaveState>('idle');
  const [reviewEvidenceState, setReviewEvidenceState] = useState<SaveState>('idle');
  const [assetState, setAssetState] = useState<SaveState>('idle');
  const [publishState, setPublishState] = useState<SaveState>('idle');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackActionHref, setFeedbackActionHref] = useState<string | null>(null);
  const [publicConfirmationOpen, setPublicConfirmationOpen] = useState(false);
  const [publicConfirmation, setPublicConfirmation] =
    useState<KnowledgeReviewHumanConfirmations>({});
  const [tagDraft, setTagDraft] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  // As propriedades fazem parte do fluxo editorial: entram abertas para que
  // categoria, visibilidade e publicação fiquem visíveis desde o primeiro
  // contato. Em telas menores, o painel pode ser recolhido pelo fundo do
  // diálogo, sem adicionar um botão extra ao cabeçalho.
  const [propertiesOpen, setPropertiesOpen] = useState(true);

  // Esc fecha o slide-over de propriedades, como em qualquer dialogo.
  useEffect(() => {
    if (!propertiesOpen) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPropertiesOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [propertiesOpen]);
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const editorMarkdownInserterRef = useRef<((markdown: string) => string | null) | null>(null);
  const isEditMode = Boolean(routeArticleId);

  const selectedSpace = spaces.find((space) => space.id === selectedSpaceId) ?? null;
  const assetMap = useMemo(() => buildAssetMap(assets), [assets]);
  const isReadOnly = status === 'archived';
  const saveButtonLabel = 'Salvar alterações';
  const publishButtonLabel = 'Publicar agora';
  // Ver o resultado público sem sair do editor. Só existe quando o artigo já
  // está publicado como público e tem espaço e slug resolvidos.
  const publicArticleHref =
    status === 'published' && form.visibility === 'public' && selectedSpace?.slug && form.slug
      ? `/help/${selectedSpace.slug}/articles/${form.slug}`
      : null;
  const bodyPlain = getBodyWithoutMarkdown(form.bodyMd);
  const publishBlocker = publicPublishBlocker(advisory, form.visibility);
  const needsPublicEvidence = form.visibility === 'public';
  const advisoryHumanConfirmations = normalizeHumanConfirmations(advisory?.human_confirmations);
  const publicConfirmationReady = publicConfirmationComplete(publicConfirmation);
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
  /**
   * Pre-voo: apenas o que o sistema consegue verificar sozinho.
   *
   * Os antigos itens 'evidence' e 'publish-readiness' saíram daqui: eles não
   * eram verificáveis nem marcáveis, só abriam um segundo checklist pedindo a
   * mesma coisa. A confirmação humana agora existe num lugar só, dentro do
   * fluxo de publicação.
   */
  const preflightChecklist = publicationChecklist.filter(
    (item) => item.action !== 'evidence' && item.action !== 'publish-readiness',
  );
  const preflightDone = preflightChecklist.filter((item) => item.done).length;
  const missingRequired = [
    !checklist.title ? 'titulo claro' : null,
    !checklist.summary ? 'resumo curto' : null,
    !checklist.body ? 'conteudo completo' : null,
    !checklist.category ? 'categoria' : null,
  ].filter(Boolean);

  useEffect(() => {
    const persisted = normalizeHumanConfirmations(advisory?.human_confirmations);
    setPublicConfirmation((current) => ({
      ...current,
      ...Object.fromEntries(
        PUBLIC_PUBLISH_CONFIRMATION_FIELDS.filter((field) => persisted[field.key] === true).map(
          (field) => [field.key, true],
        ),
      ),
    }));
  }, [advisory]);

  useEffect(() => {
    let cancelled = false;

    async function loadInitialData() {
      try {
        setArticleId(null);
        setArticleDetail(null);
        setSourcePath(null);
        setSourceHash(null);
        setIsEditorialRevision(false);
        setAdvisory(null);
        setAssets([]);
        setStatus('draft');
        setSaveState('idle');
        setSubmitState('idle');
        setReviewEvidenceState('idle');
        setAssetState('idle');
        setPublishState('idle');
        setFeedback(null);
        setFeedbackActionHref(null);
        setPublicConfirmationOpen(false);
        setPublicConfirmation({});
        setTagDraft('');
        setSlugTouched(false);
        // O editor deve iniciar com o contexto editorial disponivel. O painel
        // pode ser recolhido pelo fundo do dialogo ou pela tecla Escape.
        setPropertiesOpen(true);
        setForm(EMPTY_FORM);
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
        const loadedRelatedArticles = await listAdminKnowledgeArticlesV2({
          knowledgeSpaceId: primarySpace.id,
          status: 'published',
          visibility: 'public',
        });
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
        setRelatedArticles(
          loadedRelatedArticles.filter((article) => article.id !== (detail?.id ?? '')),
        );
        setArticleId(detail?.id ?? null);
        setArticleDetail(detail);
        setSourcePath(detail?.source_path ?? null);
        setSourceHash(detail?.source_hash ?? null);
        setIsEditorialRevision(nextIsEditorialRevision);
        setAdvisory(loadedAdvisory);
        setStatus(nextStatus);
        setAssets(loadedAssets);
        setSlugTouched(Boolean(routeArticleId));
        setForm(
          nextForm ?? {
            ...EMPTY_FORM,
            categoryId: loadedCategories[0]?.id || '',
          },
        );
        setPhase('ready');
      } catch (error) {
        if (cancelled) {
          return;
        }

        const classified = classifyAdminError(
          error,
          'Falha ao carregar as configurações da base de conhecimento.',
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
      const loadedRelatedArticles = await listAdminKnowledgeArticlesV2({
        knowledgeSpaceId: nextSpaceId,
        status: 'published',
        visibility: 'public',
      });
      setCategories(loadedCategories);
      setRelatedArticles(
        loadedRelatedArticles.filter((article) => article.id !== (articleId ?? '')),
      );
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
        'Falha ao trocar o espaço público da base de conhecimento.',
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
    setFeedbackActionHref(null);
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
    setFeedbackActionHref(null);
  }

  function handleSlugChange(event: ChangeEvent<HTMLInputElement>) {
    setSlugTouched(true);
    updateForm({ slug: slugify(event.target.value) });
  }

  function normalizeTag(value: string) {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9- ]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 32);
  }

  function addTag() {
    const normalized = normalizeTag(tagDraft);
    if (!normalized || form.keywords.includes(normalized) || form.keywords.length >= 10) {
      return;
    }
    updateForm({ keywords: [...form.keywords, normalized] });
    setTagDraft('');
  }

  function removeTag(tag: string) {
    updateForm({ keywords: form.keywords.filter((item) => item !== tag) });
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
        'Falha ao carregar anexos vinculados ao artigo.',
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
        'Imagem enviada para o repositório seguro e inserida no corpo do artigo.',
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
        'Use imagens PNG, JPG, WEBP ou GIF. PDFs ainda não estão disponíveis como anexo nesta versão.',
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

      const saveMode = resolveKnowledgeSaveMode({
        articleId: targetArticleId,
        articleStatus: articleDetail?.status ?? status,
        isEditorialRevision,
      });

      const saved =
        saveMode === 'editorial-revision' && targetArticleId
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
          : saveMode === 'draft' && targetArticleId
            ? await updateKnowledgeArticleDraftV2({
                ...articlePayload,
                p_article_id: targetArticleId,
              })
            : await createKnowledgeArticleDraftV2({
                ...articlePayload,
                p_tenant_id: activeSpace.owner_tenant_id ?? null,
              });

      const savedArticleId = 'article_id' in saved ? saved.article_id : saved.id;
      const persistedTags = await replaceKnowledgeArticleTagsV1({
        p_article_id: savedArticleId,
        p_knowledge_space_id: activeSpace.id,
        p_tags: form.keywords,
      });
      setArticleId(savedArticleId);
      updateForm({ keywords: persistedTags });
      setStatus((current) =>
        current === 'published' || current === 'archived' || current === 'review'
          ? current
          : 'draft',
      );
      setSaveState('saved');
      setFeedback('Alterações salvas. Ainda não publicadas.');
      setFeedbackActionHref(null);
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
      // Caso de sucesso: usar `saved`, nao `error`. O banner vermelho anterior
      // fazia uma operacao bem-sucedida parecer falha.
      await saveDraft();
      setSubmitState('saved');
      setFeedback(
        'A revisão de artigo publicado foi salva. A publicação seguirá pelo fluxo editorial existente.',
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

    // Sempre salvar antes de enviar: antes, um artigo ja existente ia para
    // revisao com o conteudo antigo, porque o `??` pulava o saveDraft.
    const savedArticleId = await saveDraft();
    if (!savedArticleId || !selectedSpace) {
      setSubmitState('error');
      setFeedback(
        !selectedSpace
          ? 'Selecione um espaço público antes de enviar para revisão.'
          : 'Não foi possível salvar o artigo antes de enviar para revisão.',
      );
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

  function openPublicConfirmation() {
    const persisted = normalizeHumanConfirmations(advisory?.human_confirmations);
    setPublicConfirmation((current) => ({ ...current, ...persisted }));
    // O painel de confirmacao vive dentro de Propriedades. Sem abrir os dois, o
    // clique em Publicar parecia nao fazer nada.
    setPropertiesOpen(true);
    setPublicConfirmationOpen(true);
    setReviewEvidenceState('idle');
    setFeedback(
      'Confirme explicitamente o checklist humano para tentar publicar este artigo público.',
    );
    setFeedbackActionHref(null);
  }

  async function preparePublicEvidenceForPublish(options: {
    articleId?: string;
    confirmations: KnowledgeReviewHumanConfirmations;
    /** `handlePublishArticle` ja salvou; nao repetir o save no mesmo fluxo. */
    alreadySaved?: boolean;
  }) {
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

    if (!publicConfirmationComplete(options.confirmations)) {
      setReviewEvidenceState('error');
      setPublicConfirmationOpen(true);
      setFeedback('Marque todos os itens da confirmação editorial pública antes de publicar.');
      return null;
    }

    setReviewEvidenceState('saving');
    setFeedback(null);
    setFeedbackActionHref(null);

    try {
      // A evidencia publica so pode ser preparada depois que a visibilidade
      // "Publico" estiver PERSISTIDA. Antes, o `??` pulava o saveDraft quando o
      // artigo ja existia: a mudanca ficava so no estado local e o backend
      // respondia "knowledge article must be public before preparing public
      // evidence", criando um impasse sem saida na interface.
      const savedArticleId = options.alreadySaved
        ? (options.articleId ?? articleId)
        : await saveDraft();
      if (!savedArticleId) {
        setReviewEvidenceState('error');
        setFeedback('Não foi possível salvar o artigo antes de preparar a evidência pública.');
        return null;
      }

      await prepareKnowledgeArticlePublicationEvidence({
        p_article_id: savedArticleId,
        p_human_confirmations: options.confirmations,
        p_review_notes: advisory?.review_notes || PUBLIC_PUBLISH_REVIEW_NOTES,
      });
      const nextAdvisory = await refreshAdvisory(savedArticleId, selectedSpace.id);
      setReviewEvidenceState('saved');
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
    await handlePublishArticle({ confirmedPublicEvidence: true });
  }

  async function handlePublishArticle(options?: { confirmedPublicEvidence?: boolean }) {
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

    setFeedbackActionHref(null);

    if (!checklist.ready) {
      setPublishState('error');
      setFeedback(`Antes de publicar, complete: ${missingRequired.join(', ')}.`);
      return;
    }

    const savedArticleId = await saveDraft();
    if (!savedArticleId || !selectedSpace) {
      setPublishState('error');
      return;
    }

    let effectiveAdvisory = advisory;

    if (status === 'draft' && !isEditorialRevision) {
      try {
        await submitKnowledgeArticleForReviewV2({
          p_article_id: savedArticleId,
          p_knowledge_space_id: selectedSpace.id,
        });
        setStatus('review');
        effectiveAdvisory = await refreshAdvisory(savedArticleId, selectedSpace.id);
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

    let currentPublishBlocker = publicPublishBlocker(effectiveAdvisory, form.visibility);
    if (currentPublishBlocker && form.visibility === 'public') {
      if (!options?.confirmedPublicEvidence) {
        // Nao e falha: e a etapa de governanca. Abrir a confirmacao e dizer
        // exatamente o que falta, em vez de sinalizar erro sem explicacao.
        setPublishState('idle');
        openPublicConfirmation();
        setFeedback(
          'Último passo antes de publicar: confirme a revisão editorial abaixo e use "Confirmar e publicar".',
        );
        return;
      }

      effectiveAdvisory = await preparePublicEvidenceForPublish({
        articleId: savedArticleId,
        confirmations: publicConfirmation,
        alreadySaved: true,
      });
      if (!effectiveAdvisory) {
        setPublishState('error');
        return;
      }
      currentPublishBlocker = publicPublishBlocker(effectiveAdvisory, form.visibility);
    }

    if (currentPublishBlocker) {
      setPublishState('error');
      setFeedback(`${currentPublishBlocker}`);
      setPublicConfirmationOpen(form.visibility === 'public');
      return;
    }

    setPublishState('saving');
    setFeedback(null);

    try {
      if (isEditorialRevision) {
        await publishKnowledgeArticleEditorialRevisionV2({
          p_article_id: savedArticleId,
          p_knowledge_space_id: selectedSpace.id,
        });
      } else {
        await publishKnowledgeArticleV2({
          p_article_id: savedArticleId,
          p_knowledge_space_id: selectedSpace.id,
        });
      }

      setStatus('published');
      setIsEditorialRevision(false);
      setPublishState('saved');
      setPublicConfirmationOpen(false);
      const nextHref = `/help/${selectedSpace.slug}/articles/${slugify(form.slug || form.title)}`;
      setFeedback('Artigo publicado.');
      setFeedbackActionHref(nextHref);
    } catch (error) {
      const classified = classifyAdminError(
        error,
        'Falha ao publicar pelo gate editorial existente.',
      );
      setPublishState('error');
      setFeedback(`${classified.message} Próxima ação: verifique o checklist editorial e o gate público.`);
    }
  }

  function handleInsertAsset(assetId: string) {
    const asset = assets.find((item) => item.id === assetId);
    const markdown = asset
      ? buildAssetMarkdown(asset)
      : `\n\n![Imagem do artigo|size=large](knowledge-asset:${assetId})\n\n`;
    return editorMarkdownInserterRef.current?.(markdown) ?? insertSnippet(markdown, '', '');
  }

  if (phase === 'loading') {
    return (
      <LoadingState
        title="Carregando editor"
        description="Estamos preparando categorias, espaços e configurações da base de conhecimento."
      />
    );
  }

  if (phase === 'contract-unavailable') {
    return (
      <ContractUnavailableState
        contractName={errorMessage ?? undefined}
        resourceName="as configurações da base de conhecimento"
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
      className="knowledge-editor-page h-full min-h-0 overflow-hidden bg-[color:var(--minimal-surface)]"
      onSubmit={handleSaveDraft}
    >
      <div className="flex h-full min-h-0 flex-col">
        <header className="knowledge-editor-header z-20 flex h-[52px] shrink-0 items-center justify-between gap-5 border-b border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] px-5 py-2">
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
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="truncate text-lg font-semibold leading-tight tracking-[-0.02em] text-[color:var(--minimal-text)]">
                  {form.title.trim() || (isEditMode ? 'Editar artigo' : 'Novo artigo')}
                </h1>
                <EditorStatusBadge status={status} isEditorialRevision={isEditorialRevision} />
                <EditorSaveIndicator saveState={saveState} isEditMode={isEditMode} />
              </div>
            </div>
          </div>
          {/* Ações separadas por consequência: ler, guardar, publicar. */}
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            {publicArticleHref ? (
              <a
                className="inline-flex h-9 items-center rounded-md border border-[color:var(--minimal-border)] px-3 text-sm font-medium text-[color:var(--minimal-text-secondary)] transition hover:bg-[color:var(--minimal-surface-muted)] hover:text-[color:var(--minimal-text)]"
                href={publicArticleHref}
                rel="noreferrer"
                target="_blank"
              >
                Visualizar
              </a>
            ) : null}
            <GhostButton
              className="h-9 rounded-md px-3 text-sm"
              disabled={saveState === 'saving' || isReadOnly}
              onClick={() => void handleSaveDraft()}
              type="button"
            >
              {saveState === 'saving' ? 'Salvando...' : 'Salvar rascunho'}
            </GhostButton>
            {status === 'draft' ? (
              <AppButton
                className="h-9 rounded-md px-4 text-sm"
                disabled={submitState === 'saving' || isReadOnly}
                onClick={() => void handleSubmitForReview()}
                type="button"
              >
                {submitState === 'saving' ? 'Enviando...' : 'Enviar para revisão'}
              </AppButton>
            ) : (
              <AppButton
                className="h-9 rounded-md px-4 text-sm"
                // Nao desabilitar por blocker: o usuario precisa receber o
                // motivo. `handlePublishArticle` valida e explica o que falta.
                disabled={publishState === 'saving' || isReadOnly}
                onClick={() => {
                  if (publishBlocker) {
                    // Publicacao publica exige evidencia editorial: abre o
                    // painel onde o checklist vive e diz o que falta.
                    setPropertiesOpen(true);
                    openPublicConfirmation();
                    setFeedback(`Para publicar: ${publishBlocker}`);
                    return;
                  }
                  void handlePublishArticle();
                }}
                type="button"
              >
                {publishState === 'saving' ? 'Publicando...' : publishButtonLabel}
              </AppButton>
            )}
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
              <span>{feedback}</span>
              {feedbackActionHref ? (
                <Link
                  className="ml-3 inline-flex rounded-full bg-[color:var(--minimal-surface-muted)] px-3 py-1 text-[0.72rem] font-extrabold text-[color:var(--minimal-action)] underline-offset-2 hover:underline"
                  to={feedbackActionHref}
                >
                  Ver na Central de Ajuda
                </Link>
              ) : null}
            </InlineNotice>
          </div>
        ) : null}

        {/* Em desktop, escrita e propriedades compartilham a mesma superfície. */}
        <div className={cx('gso-knowledge-editor-shell grid min-h-0 w-full flex-1 px-5 xl:grid-cols-[minmax(0,1fr)_320px] xl:gap-4', propertiesOpen ? '' : 'xl:grid-cols-1')}>
        <main className="min-h-0 min-w-0 pb-4 pt-3 xl:grid xl:grid-rows-[minmax(0,1fr)]">
          <div className="contents">
              <section className="knowledge-editor-content-grid min-h-0 min-w-0">
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
                <section aria-label="Identidade do artigo" className="knowledge-editor-meta-grid">
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
                      className="knowledge-editor-summary-input min-h-[64px] rounded-[10px] py-2.5 leading-[1.35]"
                      disabled={isReadOnly}
                      maxLength={SUMMARY_LIMIT + 40}
                      onChange={(event) => updateForm({ summary: event.target.value })}
                      placeholder="Explique em até 320 caracteres o que o artigo resolve."
                      value={form.summary}
                    />
                    <CharacterCounter limit={SUMMARY_LIMIT} value={form.summary} />
                  </Field>
                </section>
                <RichTextArticleEditor
                  key={`article-editor-${routeArticleId ?? 'new'}`}
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
                  relatedArticles={relatedArticles}
                  onRegisterMarkdownInserter={(inserter) => {
                    editorMarkdownInserterRef.current = inserter;
                  }}
                />
              </section>
          </div>
        </main>

        {/* Propriedades ficam persistentes no desktop; em telas menores viram
            slide-over para manter o editor utilizável sem esconder campos. */}
        <div
          aria-labelledby="gso-article-properties-title"
          aria-modal={propertiesOpen ? true : undefined}
           className={propertiesOpen ? 'fixed inset-0 z-[60] flex justify-end xl:static xl:block xl:inset-auto xl:z-auto' : 'hidden'}
          role={propertiesOpen ? 'dialog' : undefined}
        >
            {propertiesOpen ? <button aria-label="Fechar propriedades" className="absolute inset-0 cursor-default bg-[rgba(12,18,32,0.5)] backdrop-blur-sm xl:hidden" onClick={() => setPropertiesOpen(false)} tabIndex={-1} type="button" /> : null}
            <aside className="gso-knowledge-editor-properties relative flex h-full w-full flex-col border-l border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] shadow-2xl sm:w-[92vw] lg:w-1/2 lg:min-w-[440px] lg:max-w-[620px] xl:sticky xl:top-0 xl:h-full xl:w-full xl:min-w-0 xl:max-w-none xl:shadow-none">
              <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[color:var(--minimal-border)] px-5 py-3.5">
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-[color:var(--minimal-text)]" id="gso-article-properties-title">Configurações editoriais</h2>
                  <p className="mt-0.5 text-xs text-[color:var(--minimal-text-secondary)]">Classificação, publicação e revisão.</p>
                </div>
              </header>
              <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2 xl:overflow-hidden">
                <div className="space-y-2.5">
                      <RailCard title="">
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
                        <Field label="Tags">
                          <div className="rounded-[16px] border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] p-2">
                            {form.keywords.length > 0 ? (
                              <div className="mb-2 flex flex-wrap gap-1.5">
                                {form.keywords.map((tag) => (
                                  <span
                                    className="inline-flex items-center gap-1 rounded-full bg-[color:var(--minimal-surface-muted)] px-2 py-1 text-[0.68rem] font-medium text-[color:var(--minimal-text)]"
                                    key={tag}
                                  >
                                    {tag}
                                    <button
                                      className="text-[color:var(--minimal-text-tertiary)] hover:text-[color:var(--color-danger-ink)]"
                                      onClick={() => removeTag(tag)}
                                      type="button"
                                    >
                                      ×
                                    </button>
                                  </span>
                                ))}
                              </div>
                            ) : null}
                            <div className="flex gap-2">
                              <input
                                className="min-h-9 min-w-0 flex-1 rounded-xl border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] px-3 text-[0.78rem] font-semibold text-[color:var(--minimal-text)] outline-none focus:border-[color:var(--minimal-action)]"
                                disabled={isReadOnly || form.keywords.length >= 10}
                                onChange={(event) => setTagDraft(event.target.value)}
                                onKeyDown={(event) => {
                                  if (event.key === 'Enter') {
                                    event.preventDefault();
                                    addTag();
                                  }
                                }}
                                placeholder="Adicionar tag"
                                value={tagDraft}
                              />
                              <button
                                className="rounded-xl bg-[color:var(--minimal-surface-muted)] px-3 text-[0.72rem] font-extrabold text-[color:var(--minimal-action)] disabled:opacity-40"
                                disabled={!tagDraft.trim() || form.keywords.length >= 10}
                                onClick={addTag}
                                type="button"
                              >
                                +
                              </button>
                            </div>
                            <div className="mt-1 flex justify-between text-[0.65rem] text-[color:var(--minimal-text-tertiary)]">
                              <span>As tags serão salvas junto com o artigo.</span>
                              <span>{form.keywords.length}/10</span>
                            </div>
                          </div>
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
                          <div className="rounded-[16px] border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface-muted)] p-3">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.12em] text-[color:var(--minimal-text-tertiary)]">
                                  Estado atual
                                </p>
                                <p className="mt-1 text-[0.9rem] font-extrabold text-[color:var(--minimal-text)]">
                                  {statusLabel(status)}
                                </p>
                              </div>
                              <span
                                className={cx(
                                  'rounded-full px-2.5 py-1 text-[0.66rem] font-extrabold',
                                  status === 'published'
                                    ? 'bg-[color:var(--color-success-surface)] text-[color:var(--color-success-ink)]'
                                    : status === 'review'
                                      ? 'bg-[color:var(--color-info-surface)] text-[color:var(--minimal-action)]'
                                      : status === 'archived'
                                        ? 'bg-[color:var(--color-app-bg)] text-[color:var(--color-text-secondary)]'
                                        : 'bg-[color:var(--color-warning-surface)] text-[color:var(--color-warning-ink)]',
                                )}
                              >
                                Governado
                              </span>
                            </div>
                            <p className="mt-2 text-[0.68rem] leading-4 text-[color:var(--color-muted)]">
                              Status não é editado livremente. Cada avanço respeita a governança
                              editorial.
                            </p>
                            <div className="mt-3 grid gap-2">
                              {/* As acoes de avanco vivem no header do editor.
                                  Duplica-las aqui criava dois pontos de decisao
                                  para a mesma operacao. */}
                              {status !== 'archived' ? (
                                <p className="rounded-xl bg-[color:var(--color-app-bg)] px-3 py-2 text-[0.68rem] leading-4 text-[color:var(--color-text-secondary)]">
                                  Use as ações no topo do editor para salvar, enviar para revisão ou
                                  publicar.
                                </p>
                              ) : (
                                <p className="rounded-xl bg-[color:var(--color-app-bg)] px-3 py-2 text-[0.68rem] leading-4 text-[color:var(--color-text-secondary)]">
                                  Artigo arquivado fica somente leitura até que a reativação esteja
                                  disponível.
                                </p>
                              )}
                            </div>
                          </div>
                        </Field>
                      </RailCard>

                      <RailCard
                        badge={`${preflightDone}/${preflightChecklist.length}`}
                        title="Pré-voo do artigo"
                      >
                        <ul className="space-y-2">
                          {preflightChecklist.map((item) => (
                            <ChecklistItem
                              actionLabel="Ajustar"
                              disabled={isReadOnly}
                              done={item.done}
                              key={item.label}
                              label={item.label}
                              onAction={
                                () => {
                                      if (item.action === 'body') {
                                        document
                                          .querySelector<HTMLElement>('.knowledge-rich-editor')
                                          ?.focus();
                                      } else {
                                        setPropertiesOpen(true);
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
                          <p className="rounded-2xl bg-[color:var(--color-warning-surface)] px-3 py-2 text-[0.7rem] leading-5 text-[color:var(--color-warning-ink)]">
                            {publishBlocker}
                          </p>
                        ) : null}
                        {needsPublicEvidence && publicConfirmationOpen ? (
                          <div className="rounded-2xl border border-[color:var(--color-warning-border)] bg-[color:var(--color-warning-surface)] p-3">
                            <h3 className="text-[0.76rem] font-extrabold text-[color:var(--minimal-text)]">
                              Confirmação editorial para publicação pública
                            </h3>
                            <p className="mt-1 text-[0.68rem] leading-4 text-[color:var(--color-warning-ink)]">
                              Marque apenas após revisão humana real. Isso será registrado com
                              segurança antes da tentativa de publicação.
                            </p>
                            <div className="mt-3 space-y-2">
                              {PUBLIC_PUBLISH_CONFIRMATION_FIELDS.map((field) => (
                                <label
                                  className="flex items-start gap-2 text-[0.72rem] leading-4 text-[color:var(--minimal-text)]"
                                  key={field.key}
                                >
                                  <input
                                    checked={publicConfirmation[field.key] === true}
                                    className="mt-0.5 h-4 w-4 rounded border-[color:var(--minimal-border-strong)]"
                                    onChange={(event) =>
                                      setPublicConfirmation((current) => ({
                                        ...current,
                                        [field.key]: event.target.checked,
                                      }))
                                    }
                                    type="checkbox"
                                  />
                                  <span>{field.label}</span>
                                </label>
                              ))}
                            </div>
                            <div className="mt-3 flex gap-2">
                              <AppButton
                                className="min-h-9 flex-1 justify-center rounded-[12px] text-[0.72rem]"
                                disabled={
                                  reviewEvidenceState === 'saving' ||
                                  publishState === 'saving' ||
                                  !publicConfirmationReady
                                }
                                onClick={() => void handleConfirmHumanReviewForPublicPublish()}
                              >
                                {reviewEvidenceState === 'saving' || publishState === 'saving'
                                  ? 'Publicando...'
                                  : 'Confirmar e publicar'}
                              </AppButton>
                              <GhostButton
                                className="min-h-9 rounded-[12px] px-3 text-[0.72rem]"
                                disabled={reviewEvidenceState === 'saving' || publishState === 'saving'}
                                onClick={() => setPublicConfirmationOpen(false)}
                              >
                                Cancelar
                              </GhostButton>
                            </div>
                          </div>
                        ) : needsPublicEvidence && publishBlocker ? (
                          <GhostButton
                            className="min-h-9 w-full justify-center rounded-[12px] text-[0.72rem]"
                            disabled={reviewEvidenceState === 'saving'}
                            onClick={openPublicConfirmation}
                          >
                            Abrir confirmação pública
                          </GhostButton>
                        ) : null}
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
            </aside>
        </div>
        </div>
      </div>
    </form>
  );
}
