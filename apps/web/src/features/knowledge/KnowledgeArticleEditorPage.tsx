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
  updateKnowledgeArticleAssetReview,
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
import { MarkdownDocument, type MarkdownAsset } from '../help-center/markdown';

type PagePhase = 'loading' | 'ready' | 'contract-unavailable' | 'error';
type SaveState = 'idle' | 'saving' | 'saved' | 'error';
type AssetActionState = 'idle' | 'saving' | 'error';
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
const KEYWORD_LIMIT = 10;
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

  return `\n\n![${altText}](knowledge-asset:${asset.id})\n\n`;
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
  eyebrow,
  children,
}: {
  title: string;
  eyebrow: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[22px] border border-[color:var(--color-border)] bg-white/95 p-4 shadow-[0_18px_42px_rgba(20,31,71,0.06)]">
      <h2 className="text-sm font-bold tracking-[-0.02em] text-[color:var(--color-brand-navy)]">
        <span className="mr-1 text-[color:var(--color-brand-navy)]">{eyebrow}.</span>
        {title}
      </h2>
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
      className="inline-flex h-9 min-w-9 items-center justify-center rounded-xl border border-transparent px-3 text-sm font-semibold text-[color:var(--color-brand-navy)] transition hover:border-[color:var(--color-border)] hover:bg-[color:var(--color-surface)] disabled:cursor-not-allowed disabled:opacity-40"
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

function QuickPreview({
  assets,
  form,
  categoryName,
}: {
  assets: Record<string, MarkdownAsset>;
  form: ArticleEditorForm;
  categoryName: string;
}) {
  return (
    <article className="rounded-[24px] border border-[rgba(47,107,255,0.2)] bg-white p-6 shadow-[0_18px_44px_rgba(15,35,85,0.08)]">
      <div className="max-w-4xl">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[color:var(--color-muted)]">
          <span className="inline-flex items-center gap-2 rounded-full bg-[color:var(--color-surface)] px-3 py-1">
            <span aria-hidden="true">□</span>
            {categoryName || 'Categoria pendente'}
          </span>
          <span className="rounded-full bg-[rgba(47,107,255,0.08)] px-3 py-1 text-[color:var(--color-brand-blue)]">
            {visibilityLabel(form.visibility)}
          </span>
        </div>
        <h3 className="mt-4 text-2xl font-black leading-tight text-[color:var(--color-brand-navy)]">
          {form.title.trim() || 'Título do artigo'}
        </h3>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[color:var(--color-muted)]">
          {form.summary.trim() || 'Resumo curto aparece aqui para orientar a leitura pública.'}
        </p>
      </div>
      {form.bodyMd.trim().length > 0 ? (
        <div className="mt-6 max-h-[720px] overflow-auto rounded-[22px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6">
          <MarkdownDocument assets={assets} source={form.bodyMd} />
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-5 py-6 text-sm leading-6 text-[color:var(--color-muted)]">
          A prévia do corpo aparece aqui depois que o conteúdo for preenchido.
        </div>
      )}
    </article>
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
  const [assetActionState, setAssetActionState] = useState<AssetActionState>('idle');
  const [assetActionId, setAssetActionId] = useState<string | null>(null);
  const [publishState, setPublishState] = useState<SaveState>('idle');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [keywordDraft, setKeywordDraft] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [editorTab, setEditorTab] = useState<'edit' | 'preview'>('edit');
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

  function addKeyword() {
    if (isReadOnly) {
      return;
    }

    const nextKeyword = keywordDraft.trim().toLowerCase();
    if (
      !nextKeyword ||
      form.keywords.includes(nextKeyword) ||
      form.keywords.length >= KEYWORD_LIMIT
    ) {
      return;
    }

    updateForm({ keywords: [...form.keywords, nextKeyword] });
    setKeywordDraft('');
  }

  function removeKeyword(keyword: string) {
    if (isReadOnly) {
      return;
    }

    updateForm({ keywords: form.keywords.filter((item) => item !== keyword) });
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

  function handleBodyPaste(event: ClipboardEvent<HTMLTextAreaElement>) {
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

  async function handleUpdateAssetReview(
    asset: AdminKnowledgeArticleAssetRow,
    nextStatus: 'approved' | 'blocked',
  ) {
    if (isReadOnly) {
      setFeedback('Artigo arquivado é somente leitura nesta tela.');
      return;
    }

    setAssetActionState('saving');
    setAssetActionId(asset.id);
    setFeedback(null);

    try {
      const updated = await updateKnowledgeArticleAssetReview({
        p_asset_id: asset.id,
        p_review_status: nextStatus,
        p_visibility: nextStatus === 'approved' ? form.visibility : 'restricted',
        p_is_blocked: nextStatus === 'blocked',
        p_alt_text: asset.alt_text,
        p_caption: asset.caption,
      });

      setAssets((current) =>
        current.map((item) =>
          item.id === asset.id
            ? {
                ...item,
                ...updated,
                signed_url: item.signed_url,
              }
            : item,
        ),
      );
      setAssetActionState('idle');
      setFeedback(
        nextStatus === 'approved'
          ? 'Imagem aprovada no contrato de assets. A exposição pública ainda depende do artigo publicado/público.'
          : 'Imagem bloqueada no contrato de assets e não será renderizada no público.',
      );
    } catch (error) {
      const classified = classifyAdminError(
        error,
        'Falha ao atualizar a revisão do asset.',
      );
      setAssetActionState('error');
      setFeedback(classified.message);
    } finally {
      setAssetActionId(null);
    }
  }

  function handleInsertAsset(assetId: string) {
    const asset = assets.find((item) => item.id === assetId);
    return insertSnippet(asset ? buildAssetMarkdown(asset) : `\n\n![Imagem do artigo](knowledge-asset:${assetId})\n\n`, '', '');
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
              <span className="text-[color:var(--color-brand-blue)]">
                {isEditMode ? 'Editar artigo' : 'Novo artigo'}
              </span>
            </nav>
            <div>
              <h1 className="text-2xl font-bold tracking-[-0.04em] text-[color:var(--color-brand-navy)]">
                {isEditMode ? 'Editar artigo' : 'Novo artigo'}
              </h1>
              <p className="mt-1 text-sm leading-6 text-[color:var(--color-muted)]">
                {isEditMode
                  ? 'Atualize conteúdo da base de conhecimento com clareza e impacto.'
                  : 'Crie conteúdo para a Central de Ajuda com clareza e impacto.'}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap justify-end gap-3">
            <GhostButton
              className="h-11 rounded-[12px] px-5 text-[0.82rem]"
              disabled={saveState === 'saving' || isReadOnly}
              type="submit"
            >
              ☁ {saveState === 'saving' ? 'Salvando...' : saveButtonLabel}
            </GhostButton>
            <AppButton
              className="h-11 rounded-[12px] px-5 text-[0.82rem]"
              disabled={
                submitState === 'saving' ||
                saveState === 'saving' ||
                status !== 'draft' ||
                isEditorialRevision ||
                isReadOnly
              }
              onClick={handleSubmitForReview}
            >
              ✈ Enviar para revisão
            </AppButton>
            <GhostButton
              className="h-11 border-transparent px-3 text-[color:var(--color-brand-blue)] shadow-none"
              onClick={() => {
                setEditorTab('preview');
              }}
            >
              ◉ Pré-visualizar
            </GhostButton>
            <GhostButton
              className="h-11 w-11 rounded-full px-0 text-[color:var(--color-brand-blue)]"
              title="A publicação não acontece nesta tela. Use o fluxo editorial depois da revisão."
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
          <main className="flex min-h-0 flex-col gap-4 overflow-hidden">
            <section className="grid shrink-0 gap-4 rounded-[22px] border border-[color:var(--color-border)] bg-white p-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)_minmax(0,1fr)]">
              <label className="grid min-w-0 gap-2">
                <FormFieldLabel required>Título do artigo</FormFieldLabel>
                <TextInput
                  maxLength={TITLE_LIMIT + 20}
                  disabled={isReadOnly}
                  onChange={handleTitleChange}
                  placeholder="Ex.: Como configurar sellers permitidos"
                  value={form.title}
                />
                <CharacterCounter limit={TITLE_LIMIT} value={form.title} />
              </label>

              <label className="grid min-w-0 gap-2">
                <FormFieldLabel required>Slug</FormFieldLabel>
                <TextInput
                  maxLength={SLUG_LIMIT + 20}
                  disabled={isReadOnly}
                  onChange={handleSlugChange}
                  placeholder="configurar-sellers-permitidos"
                  value={form.slug}
                />
                <CharacterCounter limit={SLUG_LIMIT} value={form.slug} />
              </label>

              <label className="grid min-w-0 gap-2">
                <FormFieldLabel required>Resumo curto</FormFieldLabel>
                <TextareaInput
                  className="min-h-[46px] rounded-2xl py-3"
                  disabled={isReadOnly}
                  maxLength={SUMMARY_LIMIT + 40}
                  onChange={(event) => updateForm({ summary: event.target.value })}
                  placeholder="Explique em uma frase o que o artigo resolve."
                  value={form.summary}
                />
                <CharacterCounter limit={SUMMARY_LIMIT} value={form.summary} />
              </label>
            </section>

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
              <div className="flex shrink-0 items-end justify-between border-b border-[color:var(--color-border)] px-4 pt-3">
                <div>
                  <FormFieldLabel required>Conteúdo do artigo</FormFieldLabel>
                  <div className="mt-3 flex gap-7">
                    <button
                      className={cx(
                        'border-b-2 px-1 pb-3 text-sm font-bold transition',
                        editorTab === 'edit'
                          ? 'border-[color:var(--color-brand-blue)] text-[color:var(--color-brand-blue)]'
                          : 'border-transparent text-[color:var(--color-muted)] hover:text-[color:var(--color-brand-navy)]',
                      )}
                      onClick={() => setEditorTab('edit')}
                      type="button"
                    >
                      Editar
                    </button>
                    <button
                      className={cx(
                        'border-b-2 px-1 pb-3 text-sm font-bold transition',
                        editorTab === 'preview'
                          ? 'border-[color:var(--color-brand-blue)] text-[color:var(--color-brand-blue)]'
                          : 'border-transparent text-[color:var(--color-muted)] hover:text-[color:var(--color-brand-navy)]',
                      )}
                      onClick={() => setEditorTab('preview')}
                      type="button"
                    >
                      Pré-visualização
                    </button>
                  </div>
                </div>
              </div>
              {editorTab === 'edit' ? (
              <div className="flex shrink-0 items-center gap-1 border-b border-[color:var(--color-border)] bg-white px-4 py-2">
                <button
                  className="mr-2 inline-flex h-9 items-center gap-2 rounded-xl border border-[color:var(--color-border)] px-3 text-sm font-semibold text-[color:var(--color-brand-navy)] hover:bg-[color:var(--color-surface)]"
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
                <span className="mx-2 h-7 w-px bg-[color:var(--color-border)]" />
                <ToolbarButton onClick={() => insertSnippet('**', '**')} title="Negrito">
                  B
                </ToolbarButton>
                <ToolbarButton onClick={() => insertSnippet('_', '_')} title="Itálico">
                  <span className="italic">I</span>
                </ToolbarButton>
                <ToolbarButton onClick={() => insertSnippet('<u>', '</u>')} title="Sublinhado">
                  <span className="underline">U</span>
                </ToolbarButton>
                <span className="mx-2 h-7 w-px bg-[color:var(--color-border)]" />
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
                <ToolbarButton onClick={() => insertSnippet('\n```text\n', '\n```\n', 'exemplo')} title="Código">
                  &lt;/&gt;
                </ToolbarButton>
                <span className="ml-auto text-[0.72rem] text-[color:var(--color-muted)]">
                  Cole ou arraste prints no ponto do texto
                </span>
              </div>
              ) : null}
              <div className="min-h-0 flex-1 overflow-auto">
                {editorTab === 'edit' ? (
                  <div
                    className={cx(
                      'min-h-full px-8 py-6 transition focus-within:bg-[rgba(234,242,255,0.14)]',
                      assetState === 'saving' && 'bg-[rgba(234,242,255,0.2)]',
                    )}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={handleAssetDrop}
                  >
                    <textarea
                      className="min-h-[520px] w-full resize-none border-0 bg-transparent font-[ui-sans-serif] text-[1rem] leading-8 text-[color:var(--color-ink)] outline-none shadow-none placeholder:text-[color:var(--color-muted)] focus:ring-0"
                      onChange={(event) => updateForm({ bodyMd: event.target.value })}
                      onPaste={handleBodyPaste}
                      placeholder={`Escreva o artigo na ordem em que o cliente deve executar:\n\n# Como configurar...\n\n1. Clique em Configurações.\n\nCole ou arraste o print aqui, exatamente depois da instrução.\n\n2. Clique no menu desejado.\n\n3. Salve a configuração.`}
                      readOnly={isReadOnly}
                      ref={bodyRef}
                      value={form.bodyMd}
                    />
                  </div>
                ) : (
                  <div className="min-h-full px-8 py-6">
                    {form.bodyMd.trim().length > 0 ? (
                      <article className="mx-auto max-w-4xl rounded-[18px] bg-white">
                        <MarkdownDocument assets={assetMap} source={form.bodyMd} />
                      </article>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-5 py-8 text-sm leading-6 text-[color:var(--color-muted)]">
                        A pré-visualização aparece aqui quando o artigo tiver conteúdo.
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="flex shrink-0 items-center justify-between border-t border-[color:var(--color-border)] px-5 py-3 text-[0.72rem] text-[color:var(--color-muted)]">
                <span>
                  {bodyPlain.split(' ').filter(Boolean).length} palavras ·{' '}
                  {saveState === 'saved' ? 'Rascunho salvo agora' : 'Edição local'}
                </span>
                <span>
                  {assets.length} mídia{assets.length === 1 ? '' : 's'} vinculada
                  {assets.length === 1 ? '' : 's'}
                </span>
              </div>
            </section>

            <section className="shrink-0 rounded-[22px] border border-[color:var(--color-border)] bg-white px-4 py-3">
              <div className="mb-2 text-[0.72rem] font-semibold text-[color:var(--color-brand-navy)]">
                SEO / busca
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-[color:var(--color-border)] bg-white px-2 py-2">
                {form.keywords.map((keyword) => (
                  <button
                    className="inline-flex items-center gap-2 rounded-xl bg-[color:var(--color-surface)] px-3 py-1 text-xs font-semibold text-[color:var(--color-brand-navy)]"
                    key={keyword}
                    onClick={() => removeKeyword(keyword)}
                    type="button"
                  >
                    {keyword} <span aria-hidden="true">×</span>
                  </button>
                ))}
                <input
                  className="h-8 min-w-[180px] flex-1 border-0 bg-transparent px-2 text-sm outline-none placeholder:text-[color:var(--color-muted)]"
                  disabled={isReadOnly || form.keywords.length >= KEYWORD_LIMIT}
                  onChange={(event) => setKeywordDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      addKeyword();
                    }
                  }}
                  placeholder="Adicionar palavra-chave"
                  value={keywordDraft}
                />
                <span className="px-2 text-xs text-[color:var(--color-muted)]">
                  {form.keywords.length}/{KEYWORD_LIMIT}
                </span>
              </div>
            </section>

          </main>

          <aside className="min-h-0 overflow-auto pr-1">
            <div className="space-y-3">
              <RailCard eyebrow="A" title="Configurações editoriais">
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
                    <option value="public">Publico</option>
                  </SelectInput>
                </Field>
                <Field label="Status editorial">
                  <SelectInput disabled value={status}>
                    <option value="draft">Rascunho</option>
                    <option value="review">Em revisão</option>
                    <option value="published">Publicado</option>
                    <option value="archived">Arquivado</option>
                  </SelectInput>
                  <p className="mt-1 text-[0.68rem] leading-4 text-[color:var(--color-muted)]">
                    O fluxo é controlado por ações governadas, não por edição livre.
                  </p>
                </Field>
                <Field label="Espaço público">
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
              </RailCard>

              <RailCard eyebrow="B" title="Fluxo editorial">
                <div className="rounded-[18px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-3">
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-[color:var(--color-muted)]">
                    Estado atual
                  </p>
                  <p className="mt-1 text-base font-bold text-[color:var(--color-brand-navy)]">
                    {statusLabel(status)}
                    {isEditorialRevision ? ' com revisão em andamento' : ''}
                  </p>
                  <p className="mt-2 text-[0.72rem] leading-5 text-[color:var(--color-muted)]">
                    Status não é editável por campo livre. Cada avanço passa pela RPC governada do
                    backend e pelo gate editorial.
                  </p>
                </div>

                {needsPublicEvidence ? (
                  <div className="rounded-[18px] border border-[rgba(47,107,255,0.18)] bg-[rgba(234,242,255,0.5)] px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-[color:var(--color-muted)]">
                          Gate público
                        </p>
                        <p className="mt-1 text-sm font-bold text-[color:var(--color-brand-navy)]">
                          {publicEvidenceComplete
                            ? 'Revisão humana confirmada'
                            : 'Evidência humana pendente'}
                        </p>
                      </div>
                      <span
                        className={cx(
                          'rounded-full px-2.5 py-1 text-[0.68rem] font-bold',
                          publicEvidenceComplete
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700',
                        )}
                      >
                        {advisory?.review_status ?? 'sem advisory'}
                      </span>
                    </div>

                    <div className="mt-3 space-y-1.5 text-[0.72rem] leading-5 text-[color:var(--color-muted)]">
                      <p>
                        Classificação: {advisory?.suggested_classification ?? 'indisponível'} ·
                        Visibilidade sugerida: {advisory?.suggested_visibility ?? 'indisponível'}
                      </p>
                      <ul className="grid gap-1">
                        {PUBLIC_PUBLISH_CONFIRMATION_FIELDS.map((field) => (
                          <li className="flex items-center gap-2" key={field.key}>
                            <span
                              className={cx(
                                'grid h-4 w-4 place-items-center rounded-full border text-[0.56rem]',
                                advisoryHumanConfirmations[field.key] === true
                                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                  : 'border-[color:var(--color-border)] text-transparent',
                              )}
                            >
                              ✓
                            </span>
                            {field.label}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {publishBlocker ? (
                      <p className="mt-3 rounded-2xl bg-white/72 px-3 py-2 text-[0.72rem] leading-5 text-[color:var(--color-muted)]">
                        {publishBlocker}
                      </p>
                    ) : null}

                    <GhostButton
                      className="mt-3 min-h-10 w-full justify-center rounded-[14px]"
                      disabled={
                        reviewEvidenceState === 'saving' ||
                        !advisory ||
                        advisory.suggested_visibility !== 'public' ||
                        advisory.suggested_classification !== 'public'
                      }
                      onClick={handleConfirmHumanReviewForPublicPublish}
                    >
                      {reviewEvidenceState === 'saving'
                        ? 'Confirmando...'
                        : 'Confirmar revisão humana'}
                    </GhostButton>
                  </div>
                ) : null}

                {status === 'draft' && !isEditorialRevision ? (
                  <AppButton
                    className="min-h-11 w-full justify-center"
                    disabled={submitState === 'saving' || saveState === 'saving'}
                    onClick={handleSubmitForReview}
                  >
                    Enviar para revisão
                  </AppButton>
                ) : null}

                {status === 'review' && !isEditorialRevision ? (
                  <AppButton
                    className="min-h-11 w-full justify-center"
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
                    className="min-h-11 w-full justify-center"
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

              <RailCard eyebrow="C" title="Checklist do artigo">
                <ul className="space-y-2">
                  <ChecklistItem done={checklist.title} label="Título claro e descritivo" />
                  <ChecklistItem done={checklist.summary} label="Resumo curto preenchido" />
                  <ChecklistItem done={checklist.body} label="Conteúdo completo" />
                  <ChecklistItem done={checklist.links} label="Links revisados" />
                  <ChecklistItem
                    done
                    label={
                      checklist.assets
                        ? 'Imagem(ns) incluída(s)'
                        : 'Imagem opcional para este artigo'
                    }
                  />
                  <ChecklistItem done={checklist.category} label="Categoria definida" />
                  <ChecklistItem done={checklist.ready} label="Pronto para revisão" />
                </ul>
                <p className="text-[0.7rem] leading-5 text-[color:var(--color-muted)]">
                  Indicador visual local. O gate final de publicação continua no backend.
                </p>
              </RailCard>

              <RailCard eyebrow="D" title="Mídia e anexos">
                <div className="flex items-center justify-between">
                  <span className="text-[0.72rem] text-[color:var(--color-muted)]">
                    {assets.length} item{assets.length === 1 ? '' : 's'}
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

              <div className="rounded-[18px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-3 text-[0.72rem] leading-5 text-[color:var(--color-muted)]">
                Estado atual: {statusLabel(status)} · {articleId ? `ID ${articleId}` : 'ainda não salvo'}.
              </div>
            </div>
          </aside>
        </div>
      </div>
    </form>
  );
}
