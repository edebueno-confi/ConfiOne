import {
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Link } from 'react-router-dom';
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
  listAdminKnowledgeArticleAssets,
  listAdminKnowledgeCategoriesV2,
  listAdminKnowledgeSpaces,
  submitKnowledgeArticleForReviewV2,
  updateKnowledgeArticleDraftV2,
  type AdminKnowledgeArticleAssetRow,
  type AdminKnowledgeCategoryV2Row,
  type AdminKnowledgeSpaceRow,
  type KnowledgeVisibility,
} from '../admin/admin-api';
import { classifyAdminError } from '../admin/admin-errors';

type PagePhase = 'loading' | 'ready' | 'contract-unavailable' | 'error';
type SaveState = 'idle' | 'saving' | 'saved' | 'error';
type ArticleEditorStatus = 'draft' | 'review';

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

function visibilityLabel(visibility: KnowledgeVisibility) {
  if (visibility === 'public') {
    return 'Publico';
  }

  if (visibility === 'restricted') {
    return 'Restrito';
  }

  return 'Interno';
}

function statusLabel(status: ArticleEditorStatus) {
  return status === 'review' ? 'Em revisao' : 'Rascunho';
}

function getBodyWithoutMarkdown(bodyMd: string) {
  return bodyMd
    .replace(/knowledge-asset:[a-f0-9-]+/gi, '')
    .replace(/[#*_>`[\]()-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasReviewedLink(bodyMd: string) {
  return /\[[^\]]+\]\([^)]+\)/.test(bodyMd);
}

function hasAssetReference(bodyMd: string, assets: AdminKnowledgeArticleAssetRow[]) {
  return /knowledge-asset:[a-f0-9-]+/i.test(bodyMd) || assets.length > 0;
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

function AssetList({
  assets,
  onInsertAsset,
}: {
  assets: AdminKnowledgeArticleAssetRow[];
  onInsertAsset: (assetId: string) => void;
}) {
  if (assets.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-3 text-xs leading-5 text-[color:var(--color-muted)]">
        Nenhum asset vinculado a este artigo ainda. Salve o rascunho e use o fluxo governado de
        assets quando houver upload/seleção disponível.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {assets.map((asset) => (
        <div
          className="flex items-center justify-between gap-3 rounded-2xl border border-[color:var(--color-border)] bg-white px-3 py-2"
          key={asset.id}
        >
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-[color:var(--color-brand-navy)]">
              {asset.source_path ?? asset.storage_object_path}
            </p>
            <p className="text-[0.68rem] text-[color:var(--color-muted)]">
              {asset.detected_mime_type ?? 'mime pendente'} · {asset.review_status}
            </p>
          </div>
          <button
            className="rounded-full border border-[color:var(--color-border)] px-3 py-1 text-[0.68rem] font-semibold text-[color:var(--color-brand-blue)]"
            onClick={() => onInsertAsset(asset.id)}
            type="button"
          >
            Inserir
          </button>
        </div>
      ))}
    </div>
  );
}

function QuickPreview({
  form,
  categoryName,
}: {
  form: ArticleEditorForm;
  categoryName: string;
}) {
  return (
    <article className="rounded-[18px] border border-[color:var(--color-border)] bg-white p-4">
      <h3 className="text-base font-bold leading-6 text-[color:var(--color-brand-blue)]">
        {form.title.trim() || 'Titulo do artigo'}
      </h3>
      <p className="mt-2 line-clamp-3 text-xs leading-5 text-[color:var(--color-muted)]">
        {form.summary.trim() || 'Resumo curto aparece aqui para orientar a leitura publica.'}
      </p>
      <div className="mt-5 flex items-center justify-between gap-3 text-[0.72rem]">
        <span className="inline-flex min-w-0 items-center gap-2 text-[color:var(--color-muted)]">
          <span aria-hidden="true">□</span>
          <span className="truncate">{categoryName || 'Categoria pendente'}</span>
        </span>
        <span className="rounded-full bg-[color:var(--color-surface)] px-3 py-1 font-semibold text-[color:var(--color-brand-blue)]">
          {visibilityLabel(form.visibility)}
        </span>
      </div>
    </article>
  );
}

export function KnowledgeArticleEditorPage() {
  const [phase, setPhase] = useState<PagePhase>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [spaces, setSpaces] = useState<AdminKnowledgeSpaceRow[]>([]);
  const [categories, setCategories] = useState<AdminKnowledgeCategoryV2Row[]>([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState('');
  const [articleId, setArticleId] = useState<string | null>(null);
  const [assets, setAssets] = useState<AdminKnowledgeArticleAssetRow[]>([]);
  const [form, setForm] = useState<ArticleEditorForm>(EMPTY_FORM);
  const [status, setStatus] = useState<ArticleEditorStatus>('draft');
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [submitState, setSubmitState] = useState<SaveState>('idle');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [keywordDraft, setKeywordDraft] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [previewFocus, setPreviewFocus] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);

  const selectedSpace = spaces.find((space) => space.id === selectedSpaceId) ?? null;
  const selectedCategory =
    categories.find((category) => category.id === form.categoryId) ?? null;
  const bodyPlain = getBodyWithoutMarkdown(form.bodyMd);
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

        const primarySpace =
          loadedSpaces.find((space) => space.slug === 'genius') ??
          loadedSpaces.find((space) => space.is_primary) ??
          loadedSpaces[0];
        const loadedCategories = await listAdminKnowledgeCategoriesV2(primarySpace.id);

        if (cancelled) {
          return;
        }

        setSpaces(loadedSpaces);
        setSelectedSpaceId(primarySpace.id);
        setCategories(loadedCategories);
        setForm((current) => ({
          ...current,
          categoryId: current.categoryId || loadedCategories[0]?.id || '',
        }));
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
  }, []);

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
    setFeedback(null);
  }

  function handleSlugChange(event: ChangeEvent<HTMLInputElement>) {
    setSlugTouched(true);
    updateForm({ slug: slugify(event.target.value) });
  }

  function insertSnippet(before: string, after = '', fallback = 'texto') {
    const textarea = bodyRef.current;
    const currentBody = form.bodyMd;

    if (!textarea) {
      updateForm({ bodyMd: `${currentBody}${before}${fallback}${after}` });
      return;
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
  }

  function addKeyword() {
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

  function validateDraft() {
    if (!selectedSpace) {
      return 'Selecione um espaço publico antes de salvar.';
    }

    if (!checklist.ready) {
      return `Complete os campos obrigatorios antes de salvar: ${missingRequired.join(', ')}.`;
    }

    if (form.slug.trim().length === 0 || form.slug.length > SLUG_LIMIT) {
      return 'Revise o slug do artigo antes de salvar.';
    }

    return null;
  }

  async function saveDraft() {
    const validationError = validateDraft();

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

      const payload = {
        p_title: form.title.trim(),
        p_slug: slugify(form.slug || form.title),
        p_summary: normalizeOptionalText(form.summary),
        p_body_md: form.bodyMd.trim(),
        p_category_id: normalizeOptionalText(form.categoryId),
        p_visibility: form.visibility,
        p_knowledge_space_id: activeSpace.id,
        p_tenant_id: activeSpace.owner_tenant_id ?? null,
        p_source_path: null,
        p_source_hash: null,
      };

      const saved = articleId
        ? await updateKnowledgeArticleDraftV2({
            ...payload,
            p_article_id: articleId,
          })
        : await createKnowledgeArticleDraftV2(payload);

      setArticleId(saved.id);
      setStatus('draft');
      setSaveState('saved');
      setFeedback('Rascunho salvo por contrato administrativo. Nada foi publicado.');
      await refreshAssets(saved.id);
      return saved.id;
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
    setSubmitState('saving');
    setFeedback(null);

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

  function handleInsertAsset(assetId: string) {
    insertSnippet(`\n\nknowledge-asset:${assetId}\n\n`, '', '');
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
              <span className="text-[color:var(--color-brand-blue)]">Novo artigo</span>
            </nav>
            <div>
              <h1 className="text-2xl font-bold tracking-[-0.04em] text-[color:var(--color-brand-navy)]">
                Novo artigo
              </h1>
              <p className="mt-1 text-sm leading-6 text-[color:var(--color-muted)]">
                Crie conteúdo para a Central de Ajuda com estrutura clara, imagens e links.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap justify-end gap-3">
            <GhostButton
              className="h-11 rounded-[12px] px-5 text-[0.82rem]"
              disabled={saveState === 'saving'}
              type="submit"
            >
              ☁ Salvar rascunho
            </GhostButton>
            <AppButton
              className="h-11 rounded-[12px] px-5 text-[0.82rem]"
              disabled={submitState === 'saving' || saveState === 'saving'}
              onClick={handleSubmitForReview}
            >
              ✈ Enviar para revisão
            </AppButton>
            <GhostButton
              className="h-11 border-transparent px-3 text-[color:var(--color-brand-blue)] shadow-none"
              onClick={() => setPreviewFocus((current) => !current)}
            >
              ◉ Pré-visualizar
            </GhostButton>
            <GhostButton
              className="h-11 w-11 rounded-full px-0 text-[color:var(--color-brand-blue)]"
              title="A publicação não acontece nesta tela. Use o fluxo editorial depois da revisão."
            >
              ?
            </GhostButton>
          </div>
        </header>

        {feedback ? (
          <div className="shrink-0 pb-3">
            <InlineNotice
              tone={
                saveState === 'error' || submitState === 'error'
                  ? 'critical'
                  : submitState === 'saved' || saveState === 'saved'
                    ? 'positive'
                    : 'default'
              }
            >
              {feedback}
            </InlineNotice>
          </div>
        ) : null}

        <div className="grid min-h-0 flex-1 gap-4 overflow-hidden xl:grid-cols-[minmax(0,1fr)_350px]">
          <main className="flex min-h-0 flex-col overflow-hidden rounded-[22px] border border-[color:var(--color-border)] bg-white">
            <section className="grid shrink-0 gap-4 border-b border-[color:var(--color-border)] p-4 xl:grid-cols-[minmax(0,1fr)_300px_360px]">
              <label className="grid gap-2">
                <FormFieldLabel required>Título do artigo</FormFieldLabel>
                <TextInput
                  maxLength={TITLE_LIMIT + 20}
                  onChange={handleTitleChange}
                  placeholder="Ex.: Como configurar sellers permitidos"
                  value={form.title}
                />
                <CharacterCounter limit={TITLE_LIMIT} value={form.title} />
              </label>

              <label className="grid gap-2">
                <FormFieldLabel required>Slug</FormFieldLabel>
                <TextInput
                  maxLength={SLUG_LIMIT + 20}
                  onChange={handleSlugChange}
                  placeholder="configurar-sellers-permitidos"
                  value={form.slug}
                />
                <CharacterCounter limit={SLUG_LIMIT} value={form.slug} />
              </label>

              <label className="grid gap-2">
                <FormFieldLabel required>Resumo curto</FormFieldLabel>
                <TextareaInput
                  className="min-h-[46px] rounded-2xl py-3"
                  maxLength={SUMMARY_LIMIT + 40}
                  onChange={(event) => updateForm({ summary: event.target.value })}
                  placeholder="Explique em uma frase o que o artigo resolve."
                  value={form.summary}
                />
                <CharacterCounter limit={SUMMARY_LIMIT} value={form.summary} />
              </label>
            </section>

            <section className="flex min-h-0 flex-1 flex-col">
              <div className="shrink-0 px-4 pt-3">
                <FormFieldLabel required>Conteúdo do artigo</FormFieldLabel>
              </div>
              <div className="mt-2 flex shrink-0 items-center gap-1 border-y border-[color:var(--color-border)] bg-white px-4 py-2">
                <button
                  className="mr-2 inline-flex h-9 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-[color:var(--color-brand-navy)] hover:bg-[color:var(--color-surface)]"
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
                  disabled={assets.length === 0}
                  onClick={() => assets[0] && handleInsertAsset(assets[0].id)}
                  title="Imagem governada"
                >
                  ▧
                </ToolbarButton>
                <ToolbarButton onClick={() => insertSnippet('\n\n| Coluna | Valor |\n| --- | --- |\n| ', ' | |\n')} title="Tabela">
                  ▦
                </ToolbarButton>
                <ToolbarButton onClick={() => insertSnippet('\n```text\n', '\n```\n', 'exemplo')} title="Código">
                  &lt;/&gt;
                </ToolbarButton>
                <span className="ml-auto text-[0.72rem] text-[color:var(--color-muted)]">
                  Markdown seguro
                </span>
              </div>
              <div className="min-h-0 flex-1 overflow-auto p-4">
                <textarea
                  className="min-h-[520px] w-full resize-none rounded-[16px] border-0 bg-white px-1 py-1 font-[ui-sans-serif] text-[0.96rem] leading-7 text-[color:var(--color-ink)] outline-none shadow-none placeholder:text-[color:var(--color-muted)] focus:ring-0"
                  onChange={(event) => updateForm({ bodyMd: event.target.value })}
                  placeholder={`Comece com uma estrutura clara:\n\n# Título do artigo\n\nExplique quando usar.\n\n## Antes de começar\n\n- Liste pré-requisitos.\n\n## Passo a passo\n\n1. Descreva a primeira ação.\n2. Descreva a próxima ação.\n\n> Importante: use observações para riscos ou limites.`}
                  ref={bodyRef}
                  value={form.bodyMd}
                />
              </div>
            </section>

            <section className="shrink-0 border-t border-[color:var(--color-border)] px-4 py-3">
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
                  disabled={form.keywords.length >= KEYWORD_LIMIT}
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
                <Field label="Status editorial *">
                  <SelectInput disabled value={status}>
                    <option value="draft">Rascunho</option>
                    <option value="review">Em revisão</option>
                  </SelectInput>
                </Field>
                <Field label="Espaço público">
                  <SelectInput
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

              <RailCard eyebrow="B" title="Mídia e anexos">
                <div className="rounded-[18px] border border-dashed border-[rgba(47,107,255,0.45)] bg-[rgba(47,107,255,0.03)] px-4 py-5 text-center">
                  <div className="text-2xl text-[color:var(--color-brand-blue)]">☁</div>
                  <p className="mt-2 text-xs font-bold text-[color:var(--color-brand-navy)]">
                    Upload governado indisponível nesta V1
                  </p>
                  <p className="mt-1 text-[0.7rem] leading-5 text-[color:var(--color-muted)]">
                    Use assets já vinculados ao artigo. O upload direto precisa de contrato de
                    seleção/binário antes de liberar no browser.
                  </p>
                  <p className="mt-2 text-[0.68rem] text-[color:var(--color-muted)]">
                    PNG, JPG, GIF, WEBP, PDF (máx. 10 MB)
                  </p>
                </div>
                <div>
                  <p className="mb-2 text-[0.72rem] font-medium text-[color:var(--color-muted)]">
                    Arquivos vinculados ({assets.length})
                  </p>
                  <AssetList assets={assets} onInsertAsset={handleInsertAsset} />
                </div>
              </RailCard>

              <RailCard eyebrow="C" title="Checklist do artigo">
                <ul className="space-y-2">
                  <ChecklistItem done={checklist.title} label="Título claro e descritivo" />
                  <ChecklistItem done={checklist.summary} label="Resumo curto preenchido" />
                  <ChecklistItem done={checklist.body} label="Conteúdo completo" />
                  <ChecklistItem done={checklist.links} label="Links revisados" />
                  <ChecklistItem done={checklist.assets} label="Imagens ou anexos adicionados" />
                  <ChecklistItem done={checklist.category} label="Categoria definida" />
                  <ChecklistItem done={checklist.ready} label="Pronto para revisão" />
                </ul>
                <p className="text-[0.7rem] leading-5 text-[color:var(--color-muted)]">
                  Indicador visual local. O gate final de publicação continua no backend.
                </p>
              </RailCard>

              <RailCard eyebrow="D" title="Prévia rápida (como aparecerá na Central de Ajuda)">
                <div className={cx(previewFocus && 'rounded-[20px] ring-2 ring-[rgba(47,107,255,0.28)]')}>
                  <QuickPreview
                    categoryName={selectedCategory?.name ?? ''}
                    form={form}
                  />
                </div>
                <p className="text-[0.7rem] leading-5 text-[color:var(--color-muted)]">
                  A prévia é textual e segura. Imagens públicas dependem de assets aprovados pelo
                  backend.
                </p>
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
