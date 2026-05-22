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
import {
  ContractUnavailableState,
  ErrorState,
  LoadingState,
} from '../../components/states';
import {
  createKnowledgeArticleDraftV2,
  beginKnowledgeArticleEditorialRevisionV2,
  getAdminKnowledgeArticleDetailV2,
  listAdminKnowledgeArticleAssets,
  listAdminKnowledgeArticleReviewAdvisories,
  listAdminKnowledgeCategoriesV2,
  listAdminKnowledgeSpaces,
  markKnowledgeArticleReviewed,
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
type ArticleEditorStatus = Extract<KnowledgeArticleStatus, 'draft' | 'review' | 'published' | 'archived'>;

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

function buildArticleFormFromDetail(
  article: AdminKnowledgeArticleDetailV2Row,
): ArticleEditorForm {
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
    asset.source_path?.split('/').pop()?.replace(/\.[^.]+$/, '') ||
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
  return PUBLIC_PUBLISH_CONFIRMATION_FIELDS.every(
    (field) => confirmations[field.key] === true,
  );
}

function publicPublishBlocker(
  advisory: AdminKnowledgeArticleReviewAdvisoryRow | null,
  visibility: KnowledgeVisibility,
) {
  if (visibility !== 'public') {
    return null;
  }

  if (!advisory) {
    return 'Este artigo não possui advisory persistido. O backend bloqueia publicação pública sem evidência humana revisada.';
  }

  if (
    advisory.suggested_visibility !== 'public' ||
    advisory.suggested_classification !== 'public'
  ) {
    return 'O advisory deste artigo não está classificado como público. Revise a curadoria antes de publicar.';
  }

  if (
    advisory.review_status !== 'reviewed' ||
    !advisory.reviewed_by_user_id ||
    !advisory.reviewed_at
  ) {
    return 'Confirme a revisão humana antes de publicar este artigo como público.';
  }

  if (!hasCompleteHumanConfirmations(advisory.human_confirmations)) {
    return 'O checklist humano do advisory ainda não está completo para publicação pública.';
  }

  return null;
}

function FormFieldLabel({
  children,
  required = false,
}: {
  children: string;
  required?: boolean;
}) {
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
    <section className="rounded-[22px] border border-[color:var(--color-border)] bg-white/95 p-4 shadow-[0_18px_42px_rgba(20,31,71,0.06)]">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[0.82rem] font-extrabold tracking-[-0.015em] text-[color:var(--color-brand-navy)]">
          {title}
        </h2>
        {badge ? (
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[0.68rem] font-extrabold text-emerald-700">
            {badge}
          </span>
        ) : null}
      </div>
      <div className="mt-4 space-y-3">{children}</div>
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
      className="inline-flex h-8 min-w-8 shrink-0 items-center justify-center rounded-xl border border-transparent px-2 text-[0.78rem] font-semibold text-[color:var(--color-brand-navy)] transition hover:border-[color:var(--color-border)] hover:bg-[color:var(--color-surface)] disabled:cursor-not-allowed disabled:opacity-40"
      disabled={disabled}
      onClick={onClick}
      title={title}
      type="button"
    >
      {children}
    </button>
  );
}

function ChecklistItem({ label, done }: { label: string; done: boolean }) {
  return (
    <li className="flex items-center gap-2 text-[0.78rem] leading-5 text-[color:var(--color-brand-navy)]">
      <span
        className={cx(
          'inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[0.56rem]',
          done
            ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
            : 'border-[color:var(--color-border)] text-[color:var(--color-muted)]',
        )}
      >
        {done ? '✓' : ''}
      </span>
      {label}
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
  | { type: 'image'; assetId: string; alt: string; size: VisualImageSize };

function parseVisualImageAlt(value: string) {
  const sizeMatch = /\s*\|size=(small|medium|large|full)\s*$/i.exec(value);
  if (!sizeMatch) {
    return { alt: value.trim() || 'Imagem do artigo', size: 'large' as VisualImageSize };
  }

  return {
    alt: value.slice(0, sizeMatch.index).trim() || 'Imagem do artigo',
    size: sizeMatch[1].toLowerCase() as VisualImageSize,
  };
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

function serializeVisualBlocks(blocks: VisualEditorBlock[]) {
  return blocks
    .map((block) => {
      if (block.type === 'heading') {
        return `${'#'.repeat(block.level)} ${block.text.trim()}`.trim();
      }

      if (block.type === 'paragraph') {
        return block.text.trim();
      }

      if (block.type === 'quote') {
        return block.text
          .split('\n')
          .map((line) => `> ${line}`)
          .join('\n');
      }

      if (block.type === 'code') {
        return `\`\`\`text\n${block.text}\n\`\`\``;
      }

      if (block.type === 'list') {
        return block.items
          .filter((item) => item.trim().length > 0)
          .map((item, index) => (block.ordered ? `${index + 1}. ${item}` : `- ${item}`))
          .join('\n');
      }

      return `![${block.alt.trim() || 'Imagem do artigo'}|size=${block.size}](knowledge-asset:${block.assetId})`;
    })
    .filter((block) => block.trim().length > 0)
    .join('\n\n');
}

function visualImageSizeClass(size: VisualImageSize) {
  if (size === 'small') {
    return 'max-w-[360px]';
  }

  if (size === 'medium') {
    return 'max-w-[560px]';
  }

  if (size === 'full') {
    return 'max-w-full';
  }

  return 'max-w-[760px]';
}

function VisualArticleEditor({
  assets,
  assetState,
  bodyMd,
  isReadOnly,
  onChange,
  onDrop,
  onImageButton,
  onPaste,
}: {
  assets: Record<string, MarkdownAsset>;
  assetState: SaveState;
  bodyMd: string;
  isReadOnly: boolean;
  onChange: (nextBodyMd: string) => void;
  onDrop: (event: DragEvent<HTMLElement>) => void;
  onImageButton: () => void;
  onPaste: (event: ClipboardEvent<HTMLElement>) => void;
}) {
  const [selectedImageKey, setSelectedImageKey] = useState<string | null>(null);
  const blocks = useMemo(() => parseVisualBlocks(bodyMd), [bodyMd]);

  function updateBlock(index: number, nextBlock: VisualEditorBlock) {
    const nextBlocks = [...blocks];
    nextBlocks[index] = nextBlock;
    onChange(serializeVisualBlocks(nextBlocks));
  }

  return (
    <div
      className={cx(
        'min-h-full px-7 py-5 transition focus-within:bg-[rgba(234,242,255,0.05)]',
        assetState === 'saving' && 'bg-[rgba(234,242,255,0.2)]',
      )}
      onDragOver={(event) => event.preventDefault()}
      onDrop={onDrop}
      onPaste={onPaste}
    >
      <div className="max-w-[1120px] space-y-4">
        {blocks.map((block, index) => {
          const key = `${block.type}-${index}`;

          if (block.type === 'heading') {
            const headingClass =
              block.level === 1
                ? 'text-[1.75rem] font-extrabold leading-tight tracking-[-0.03em]'
                : block.level === 2
                  ? 'text-[1.22rem] font-extrabold leading-snug'
                  : 'text-[1.05rem] font-bold leading-snug';
            return (
              <input
                className={cx(
                  'w-full border-0 bg-transparent p-0 text-[color:var(--color-brand-navy)] outline-none placeholder:text-[color:var(--color-muted)] focus:ring-0',
                  headingClass,
                )}
                key={key}
                onChange={(event) =>
                  updateBlock(index, { ...block, text: event.target.value })
                }
                placeholder={block.level === 1 ? 'Título principal do artigo' : 'Título da seção'}
                readOnly={isReadOnly}
                value={block.text}
              />
            );
          }

          if (block.type === 'paragraph') {
            return (
              <textarea
                className="min-h-[46px] w-full resize-none border-0 bg-transparent p-0 text-[0.92rem] leading-7 text-[#24324F] outline-none placeholder:text-[color:var(--color-muted)] focus:ring-0"
                key={key}
                onChange={(event) =>
                  updateBlock(index, { ...block, text: event.target.value })
                }
                placeholder="Escreva o parágrafo do artigo..."
                readOnly={isReadOnly}
                value={block.text}
              />
            );
          }

          if (block.type === 'list') {
            return (
              <div className="space-y-2" key={key}>
                {block.items.map((item, itemIndex) => (
                  <div className="flex items-start gap-3" key={`${key}-${itemIndex}`}>
                    <span className="mt-1 text-sm font-bold text-[color:var(--color-brand-navy)]">
                      {block.ordered ? `${itemIndex + 1}.` : '•'}
                    </span>
                    <input
                      className="w-full border-0 bg-transparent p-0 text-[0.95rem] leading-7 text-[#24324F] outline-none focus:ring-0"
                      onChange={(event) => {
                        const nextItems = [...block.items];
                        nextItems[itemIndex] = event.target.value;
                        updateBlock(index, { ...block, items: nextItems });
                      }}
                      readOnly={isReadOnly}
                      value={item}
                    />
                  </div>
                ))}
              </div>
            );
          }

          if (block.type === 'quote') {
            return (
              <div
                className="grid grid-cols-[22px_minmax(0,1fr)] gap-3 rounded-2xl border border-[rgba(47,107,255,0.25)] bg-[rgba(47,107,255,0.055)] px-4 py-3"
                key={key}
              >
                <span className="grid h-5 w-5 place-items-center rounded-full bg-[color:var(--color-brand-blue)] text-[0.68rem] font-bold text-white">
                  i
                </span>
                <div>
                  <p className="text-[0.74rem] font-extrabold text-[color:var(--color-brand-navy)]">
                    Importante
                  </p>
                  <textarea
                    className="mt-1 min-h-[34px] w-full resize-none border-0 bg-transparent p-0 text-sm leading-6 text-[#24324F] outline-none focus:ring-0"
                    onChange={(event) =>
                      updateBlock(index, { ...block, text: event.target.value })
                    }
                    readOnly={isReadOnly}
                    value={block.text}
                  />
                </div>
              </div>
            );
          }

          if (block.type === 'image') {
            const asset = assets[block.assetId];
            const imageKey = `${block.assetId}-${index}`;
            const isSelected = selectedImageKey === imageKey;
            return (
              <figure
                className={cx(
                  'relative rounded-[20px] transition',
                  isSelected && 'ring-2 ring-[color:var(--color-brand-blue)]',
                  visualImageSizeClass(block.size),
                )}
                key={key}
                onClick={() => setSelectedImageKey(imageKey)}
              >
                {isSelected ? (
                  <div className="absolute left-1/2 top-0 z-10 flex -translate-x-1/2 -translate-y-[110%] items-center gap-2 rounded-2xl border border-[color:var(--color-border)] bg-white px-2 py-2 shadow-[0_18px_42px_rgba(20,31,71,0.14)]">
                    {[
                      ['small', 'Pequena'],
                      ['medium', 'Média'],
                      ['large', 'Grande'],
                      ['full', 'Largura total'],
                    ].map(([size, label]) => (
                      <button
                        className={cx(
                          'rounded-xl px-3 py-2 text-[0.72rem] font-bold',
                          block.size === size
                            ? 'bg-[color:var(--color-brand-blue)] text-white'
                            : 'text-[color:var(--color-brand-navy)] hover:bg-[color:var(--color-surface)]',
                        )}
                        key={size}
                        onClick={(event) => {
                          event.stopPropagation();
                          updateBlock(index, { ...block, size: size as VisualImageSize });
                        }}
                        type="button"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                ) : null}
                {asset?.signed_url ? (
                  <img
                    alt={asset.alt_text ?? block.alt}
                    className="h-auto max-h-[520px] w-full rounded-[18px] border border-[color:var(--color-border)] object-contain"
                    loading="lazy"
                    src={asset.signed_url}
                  />
                ) : (
                  <div className="rounded-[18px] border border-dashed border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-5 py-8 text-sm text-[color:var(--color-muted)]">
                    Imagem ainda indisponível no editor. Revise o asset antes de publicar.
                  </div>
                )}
                <input
                  className="mt-2 w-full border-0 bg-transparent px-1 text-center text-xs italic text-[color:var(--color-muted)] outline-none focus:ring-0"
                  onChange={(event) =>
                    updateBlock(index, { ...block, alt: event.target.value })
                  }
                  placeholder="Legenda da imagem"
                  readOnly={isReadOnly}
                  value={block.alt}
                />
              </figure>
            );
          }

          return (
            <textarea
              className="min-h-[86px] w-full resize-none rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-3 font-mono text-xs leading-6 text-[#24324F] outline-none focus:ring-0"
              key={key}
              onChange={(event) => updateBlock(index, { ...block, text: event.target.value })}
              readOnly={isReadOnly}
              value={block.text}
            />
          );
        })}
        {blocks.length === 0 ? (
          <button
            className="w-full rounded-2xl border border-dashed border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-5 py-10 text-sm font-semibold text-[color:var(--color-muted)] hover:bg-[rgba(47,107,255,0.05)]"
            disabled={isReadOnly}
            onClick={onImageButton}
            type="button"
          >
            Escreva o artigo ou cole um print aqui para começar.
          </button>
        ) : null}
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
  const [articleDetail, setArticleDetail] =
    useState<AdminKnowledgeArticleDetailV2Row | null>(null);
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
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isEditMode = Boolean(routeArticleId);

  const selectedSpace = spaces.find((space) => space.id === selectedSpaceId) ?? null;
  const selectedCategory =
    categories.find((category) => category.id === form.categoryId) ?? null;
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
  checklist.ready =
    checklist.title && checklist.summary && checklist.body && checklist.category;
  const publicationChecklist = [
    { done: checklist.title, label: 'Título revisado' },
    { done: checklist.summary, label: 'Resumo revisado' },
    { done: checklist.body, label: 'Corpo revisado' },
    { done: checklist.category, label: 'Categoria confirmada' },
    { done: Boolean(form.visibility), label: 'Visibilidade confirmada' },
    {
      done:
        form.visibility !== 'public' ||
        advisoryHumanConfirmations.no_sensitive_data_exposed === true,
      label: 'Sem dados sensíveis expostos',
    },
    {
      done:
        form.visibility !== 'public' ||
        advisoryHumanConfirmations.ready_for_publish === true,
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
            loadedSpaces.find((space) => space.id === detail?.knowledge_space_id) ??
            primarySpace;

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
            ? loadedAdvisories.find((item) => item.article_id === detail.id) ?? null
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
      const nextBody = insertSnippet(buildAssetMarkdown(uploadedAsset), '', '');
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
      const classified = classifyAdminError(
        error,
        'Falha ao anexar a imagem ao artigo.',
      );
      setAssetState('error');
      setFeedback(classified.message);
    }
  }

  async function handleAssetFiles(fileList: FileList | File[], sourceKind: 'upload' | 'paste') {
    const files = Array.from(fileList).filter((file) => file.type.startsWith('image/'));

    if (files.length === 0) {
      setAssetState('error');
      setFeedback('Use imagens PNG, JPG, WEBP ou GIF. PDFs ainda não têm contrato de asset nesta V1.');
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
      !options?.allowIncompleteBody && effectiveBodyPlain.length < 80
        ? 'conteudo completo'
        : null,
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

      const saved = isEditorialRevision && targetArticleId
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
      setFeedback(
        `Para enviar para revisão, complete primeiro: ${missingRequired.join(', ')}.`,
      );
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

  async function handleConfirmHumanReviewForPublicPublish() {
    if (!articleId || !selectedSpace) {
      setReviewEvidenceState('error');
      setFeedback('Salve o artigo antes de confirmar a revisão humana.');
      return;
    }

    if (!advisory) {
      setReviewEvidenceState('error');
      setFeedback(
        'Este artigo não possui advisory persistido. O backend não permite publicação pública sem essa evidência.',
      );
      return;
    }

    if (
      advisory.suggested_visibility !== 'public' ||
      advisory.suggested_classification !== 'public'
    ) {
      setReviewEvidenceState('error');
      setFeedback(
        'O advisory atual não classifica este artigo como público. Ajuste a curadoria antes de confirmar publicação.',
      );
      return;
    }

    setReviewEvidenceState('saving');
    setFeedback(null);

    try {
      await markKnowledgeArticleReviewed({
        p_article_id: articleId,
        p_human_confirmations: buildCompleteHumanConfirmations(),
        p_review_notes: advisory.review_notes || PUBLIC_PUBLISH_REVIEW_NOTES,
      });
      await refreshAdvisory(articleId, selectedSpace.id);
      setReviewEvidenceState('saved');
      setFeedback(
        'Revisão humana confirmada no advisory. O gate de publicação pública agora pode ser executado.',
      );
    } catch (error) {
      const classified = classifyAdminError(
        error,
        'Falha ao confirmar a revisão humana do artigo.',
      );
      setReviewEvidenceState('error');
      setFeedback(classified.message);
    }
  }

  async function handlePublishArticle() {
    if (!articleId || !selectedSpace) {
      setPublishState('error');
      setFeedback('Salve o artigo antes de tentar publicar.');
      return;
    }

    if (status !== 'review' && !isEditorialRevision) {
      setPublishState('error');
      setFeedback('A publicação só fica disponível para artigos em revisão ou revisão editorial.');
      return;
    }

    const currentPublishBlocker = publicPublishBlocker(advisory, form.visibility);
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
          p_article_id: articleId,
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
    return insertSnippet(asset ? buildAssetMarkdown(asset) : `\n\n![Imagem do artigo|size=large](knowledge-asset:${assetId})\n\n`, '', '');
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
      ((status === 'review' && !isEditorialRevision) || isEditorialRevision)
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
        action={
          <GhostButton onClick={() => window.location.reload()}>
            Recarregar
          </GhostButton>
        }
      />
    );
  }

  return (
    <form
      className="flex h-full min-h-0 flex-col overflow-hidden rounded-[30px] border border-[color:var(--color-border)] bg-white/88 shadow-[0_26px_80px_rgba(20,31,71,0.08)]"
      onSubmit={handleSaveDraft}
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-5 py-4 xl:px-7">
        <header className="flex shrink-0 items-start justify-between gap-5 pb-4">
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
                <h1 className="text-[1.75rem] font-extrabold leading-tight tracking-[-0.02em] text-[color:var(--color-brand-navy)]">
                  {isEditMode ? 'Editar artigo' : 'Novo artigo'}
                </h1>
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[0.72rem] font-bold text-emerald-700">
                  ✓ {saveState === 'saved' ? 'Rascunho salvo agora' : 'Alterações salvas automaticamente'}
                </span>
              </div>
              <p className="mt-0.5 text-[0.78rem] leading-5 text-[color:var(--color-muted)]">
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
              title="Transições editoriais ficam no card de status."
            >
              Ações ▾
            </GhostButton>
            <GhostButton
              className="h-11 w-11 rounded-full px-0 text-[color:var(--color-brand-blue)]"
              title="Mais opções"
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

        <div className="grid min-h-0 flex-1 gap-4 overflow-hidden xl:grid-cols-[minmax(0,1fr)_320px]">
          <main className="flex min-h-0 flex-col overflow-hidden">
            <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[22px] border border-[color:var(--color-border)] bg-white">
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
              <div className="grid shrink-0 gap-1 border-b border-[color:var(--color-border)] px-5 py-3">
                <div className="flex items-center justify-between gap-3">
                  <FormFieldLabel required>Título do artigo</FormFieldLabel>
                  <CharacterCounter limit={TITLE_LIMIT} value={form.title} />
                </div>
                <input
                  className="h-10 w-full border-0 bg-transparent p-0 text-[1.38rem] font-extrabold leading-tight tracking-[-0.025em] text-[color:var(--color-brand-navy)] outline-none placeholder:text-[color:var(--color-muted)] focus:ring-0"
                  disabled={isReadOnly}
                  maxLength={TITLE_LIMIT + 20}
                  onChange={handleTitleChange}
                  placeholder="Título claro do artigo"
                  value={form.title}
                />
              </div>
              <div className="flex h-11 shrink-0 items-center gap-1.5 overflow-hidden border-b border-[color:var(--color-border)] bg-white px-3">
                <button
                  className="mr-1 inline-flex h-8 items-center gap-1.5 rounded-xl border border-[color:var(--color-border)] px-3 text-[0.76rem] font-semibold text-[color:var(--color-brand-navy)] hover:bg-[color:var(--color-surface)]"
                  onClick={() => insertSnippet('\n\n', '', 'Parágrafo')}
                  type="button"
                >
                  Parágrafo <span className="text-[0.7rem]">⌄</span>
                </button>
                <ToolbarButton onClick={() => insertSnippet('\n# ', '', 'Título H1')} title="H1">
                  H1
                </ToolbarButton>
                <ToolbarButton onClick={() => insertSnippet('\n## ', '', 'Título H2')} title="H2">
                  H2
                </ToolbarButton>
                <ToolbarButton onClick={() => insertSnippet('\n### ', '', 'Título H3')} title="H3">
                  H3
                </ToolbarButton>
                <span className="mx-1 h-7 w-px bg-[color:var(--color-border)]" />
                <ToolbarButton onClick={() => insertSnippet('**', '**')} title="Negrito">
                  B
                </ToolbarButton>
                <ToolbarButton onClick={() => insertSnippet('_', '_')} title="Itálico">
                  <span className="italic">I</span>
                </ToolbarButton>
                <ToolbarButton onClick={() => insertSnippet('<u>', '</u>')} title="Sublinhado">
                  <span className="underline">U</span>
                </ToolbarButton>
                <span className="mx-1 h-7 w-px bg-[color:var(--color-border)]" />
                <ToolbarButton onClick={() => insertSnippet('\n- ', '', 'item')} title="Lista">
                  ≡
                </ToolbarButton>
                <ToolbarButton onClick={() => insertSnippet('\n1. ', '', 'passo')} title="Lista numerada">
                  1.
                </ToolbarButton>
                <ToolbarButton onClick={() => insertSnippet('\n> ', '', 'observação')} title="Citação">
                  ”
                </ToolbarButton>
                <ToolbarButton
                  onClick={() => insertSnippet('[', '](https://)', 'texto do link')}
                  title="Link"
                >
                  🔗
                </ToolbarButton>
                <ToolbarButton
                  disabled={assetState === 'saving'}
                  onClick={() => {
                    if (!isReadOnly) {
                      fileInputRef.current?.click();
                    }
                  }}
                  title="Inserir print/imagem no ponto atual do artigo"
                >
                  Imagem
                </ToolbarButton>
                <ToolbarButton
                  onClick={() => {
                    setFeedback('Vídeo YouTube ainda precisa de contrato governado de bloco seguro.');
                  }}
                  title="Vídeo YouTube"
                >
                  Vídeo
                </ToolbarButton>
                <ToolbarButton onClick={() => insertSnippet('\n```text\n', '\n```\n', 'exemplo')} title="Código">
                  &lt;/&gt;
                </ToolbarButton>
                <span className="ml-auto" />
                <ToolbarButton onClick={() => setFeedback('Desfazer ainda depende de histórico local dedicado.')} title="Desfazer">
                  ↶
                </ToolbarButton>
                <ToolbarButton onClick={() => setFeedback('Refazer ainda depende de histórico local dedicado.')} title="Refazer">
                  ↷
                </ToolbarButton>
              </div>
              <div className="min-h-0 flex-1 overflow-auto">
                <VisualArticleEditor
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
                />
              </div>
              <div className="flex shrink-0 items-center justify-between gap-4 border-t border-[color:var(--color-border)] px-5 py-3 text-[0.72rem] text-[color:var(--color-muted)]">
                <span className="min-w-[220px]">
                  {bodyPlain.split(' ').filter(Boolean).length} palavras ·{' '}
                  {saveState === 'saved' ? 'Rascunho salvo agora' : 'Edição local'}
                </span>
                <span className="hidden flex-1 justify-center text-center xl:block">
                  Atalhos: Ctrl+S salvar · Ctrl+K inserir link
                </span>
                <div className="flex shrink-0 items-center gap-2">
                  <GhostButton
                    className="min-h-9 rounded-[12px] px-4 text-[0.72rem]"
                    onClick={() => window.location.reload()}
                    type="button"
                  >
                    Descartar rascunho
                  </GhostButton>
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

          <aside className="min-h-0 overflow-auto pr-1">
            <div className="space-y-3">
              <RailCard title="Configurações editoriais">
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
                    className="min-h-[72px] rounded-2xl py-3"
                    disabled={isReadOnly}
                    maxLength={SUMMARY_LIMIT + 40}
                    onChange={(event) => updateForm({ summary: event.target.value })}
                    placeholder="Explique em uma frase o que o artigo resolve."
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
                      updateForm({ visibility: event.target.value as KnowledgeVisibility })
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
                    disabled={submitState === 'saving' || publishState === 'saving' || isReadOnly}
                    onChange={(event) =>
                      void handleStatusTransition(event.target.value as ArticleEditorStatus)
                    }
                    value={status}
                  >
                    <option value="draft">Rascunho</option>
                    <option value="review">Em revisão</option>
                    <option value="published">Publicado</option>
                    <option value="archived">Arquivado</option>
                  </SelectInput>
                  <p className="mt-1 text-[0.68rem] leading-4 text-[color:var(--color-muted)]">
                    O fluxo é controlado por ações governadas, não por edição livre.
                  </p>
                </Field>
              </RailCard>

              <RailCard
                badge={`${publicationChecklistDone}/${publicationChecklist.length}`}
                title="Checklist de publicação"
              >
                <ul className="space-y-2">
                  {publicationChecklist.map((item) => (
                    <ChecklistItem done={item.done} key={item.label} label={item.label} />
                  ))}
                </ul>
                {needsPublicEvidence && publishBlocker ? (
                  <p className="rounded-2xl bg-amber-50 px-3 py-2 text-[0.7rem] leading-5 text-amber-700">
                    {publishBlocker}
                  </p>
                ) : null}
                {needsPublicEvidence && advisory && !publicEvidenceComplete ? (
                  <GhostButton
                    className="min-h-9 w-full justify-center rounded-[12px] text-[0.72rem]"
                    disabled={
                      reviewEvidenceState === 'saving' ||
                      advisory.suggested_visibility !== 'public' ||
                      advisory.suggested_classification !== 'public'
                    }
                    onClick={handleConfirmHumanReviewForPublicPublish}
                  >
                    {reviewEvidenceState === 'saving'
                      ? 'Confirmando...'
                      : 'Confirmar revisão humana'}
                  </GhostButton>
                ) : null}
                {status === 'draft' && !isEditorialRevision ? (
                  <AppButton
                    className="min-h-9 w-full justify-center rounded-[12px] text-[0.72rem]"
                    disabled={submitState === 'saving' || saveState === 'saving'}
                    onClick={handleSubmitForReview}
                  >
                    Enviar para revisão
                  </AppButton>
                ) : null}

                {status === 'review' && !isEditorialRevision ? (
                  <AppButton
                    className="min-h-9 w-full justify-center rounded-[12px] text-[0.72rem]"
                    disabled={
                      publishState === 'saving' ||
                      saveState === 'saving' ||
                      reviewEvidenceState === 'saving' ||
                      Boolean(publishBlocker)
                    }
                    onClick={handlePublishArticle}
                  >
                    {publishState === 'saving' ? 'Publicando...' : 'Publicar via gate'}
                  </AppButton>
                ) : null}

                {isEditorialRevision ? (
                  <AppButton
                    className="min-h-9 w-full justify-center rounded-[12px] text-[0.72rem]"
                    disabled={
                      publishState === 'saving' ||
                      saveState === 'saving' ||
                      reviewEvidenceState === 'saving' ||
                      Boolean(publishBlocker)
                    }
                    onClick={handlePublishArticle}
                  >
                    {publishState === 'saving' ? 'Publicando revisão...' : 'Publicar revisão'}
                  </AppButton>
                ) : null}

                {status === 'published' && !isEditorialRevision ? (
                  <InlineNotice>
                    Artigo publicado. Ao editar, esta tela salva uma revisão editorial sem alterar
                    a versão pública até a publicação da revisão.
                  </InlineNotice>
                ) : null}

                {status === 'archived' ? (
                  <InlineNotice tone="warning">
                    Artigo arquivado. O contrato atual não expõe reativação nesta tela.
                  </InlineNotice>
                ) : null}
              </RailCard>

              <RailCard
                badge={`${assets.length} ${assets.length === 1 ? 'item' : 'itens'}`}
                title="Mídia e anexos"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[0.72rem] text-[color:var(--color-muted)]">
                    Imagens entram inline no ponto do texto.
                  </span>
                  <GhostButton
                    className="min-h-9 rounded-[12px] px-3 text-[0.72rem]"
                    disabled={isReadOnly || assetState === 'saving'}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Gerenciar mídia
                  </GhostButton>
                </div>
                {assets.length > 0 ? (
                  <ul className="space-y-2">
                    {assets.slice(0, 4).map((asset) => (
                      <li
                        className="flex items-center gap-3 rounded-2xl border border-[color:var(--color-border)] bg-white px-3 py-2"
                        key={asset.id}
                      >
                        <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)]">
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
                          <p className="truncate text-[0.74rem] font-semibold text-[color:var(--color-brand-navy)]">
                            {asset.source_path?.split('/').pop() ?? asset.detected_mime_type ?? 'Imagem'}
                          </p>
                          <p className="text-[0.68rem] text-[color:var(--color-muted)]">
                            {asset.detected_mime_type ?? 'imagem'} ·{' '}
                            {asset.file_size_bytes ? formatFileSize(asset.file_size_bytes) : 'tamanho indisponível'}
                          </p>
                        </div>
                        <button
                          className="grid h-8 w-8 shrink-0 place-items-center rounded-xl text-[color:var(--color-brand-blue)] hover:bg-[color:var(--color-surface)]"
                          onClick={() => handleInsertAsset(asset.id)}
                          title="Inserir no corpo"
                          type="button"
                        >
                          ⋮
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="rounded-2xl bg-[color:var(--color-surface)] px-3 py-3 text-[0.72rem] leading-5 text-[color:var(--color-muted)]">
                    Arraste, selecione ou cole uma imagem no editor quando o artigo precisar de
                    apoio visual.
                  </p>
                )}
              </RailCard>

              <RailCard title="Informações do artigo">
                <dl className="space-y-2 text-[0.72rem] leading-5">
                  <div>
                    <dt className="font-extrabold text-[color:var(--color-brand-navy)]">Criado por</dt>
                    <dd className="text-[color:var(--color-muted)]">
                      {articleDetail?.created_by_full_name ?? 'Indisponível'}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-extrabold text-[color:var(--color-brand-navy)]">Última edição</dt>
                    <dd className="text-[color:var(--color-muted)]">
                      {articleDetail?.updated_at
                        ? new Date(articleDetail.updated_at).toLocaleString('pt-BR')
                        : 'Ainda não salvo'}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-extrabold text-[color:var(--color-brand-navy)]">Revisão</dt>
                    <dd className="text-[color:var(--color-muted)]">
                      {articleDetail?.current_revision_number
                        ? `Rev. ${articleDetail.current_revision_number}`
                        : 'Rascunho inicial'}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-extrabold text-[color:var(--color-brand-navy)]">Categoria atual</dt>
                    <dd className="text-[color:var(--color-muted)]">
                      {selectedCategory?.name ?? 'Pendente'}
                    </dd>
                  </div>
                </dl>
              </RailCard>
            </div>
          </aside>
        </div>
      </div>
    </form>
  );
}
