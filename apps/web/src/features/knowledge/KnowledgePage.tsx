import {
  type FormEvent,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from 'react';
import { Navigate, useNavigate } from 'react-router';
import { formatDateTime } from '../../app/format';
import {
  AppButton,
  cx,
  Field,
  GhostButton,
  InlineNotice,
  SelectInput,
  StatusPill,
  TextInput,
  TextareaInput,
} from '../../components/ui';
import {
  ContractUnavailableState,
  EmptyState,
  ErrorState,
  LoadingState,
} from '../../components/states';
import {
  archiveKnowledgeArticleV2,
  createKnowledgeArticleDraftV2,
  discardKnowledgeArticleEditorialRevisionV2,
  createKnowledgeCategoryV2,
  getAdminKnowledgeArticleDetailV2,
  listAdminKnowledgeArticleAssets,
  listAdminKnowledgeArticleReviewAdvisories,
  listAdminKnowledgeArticlesV2,
  listAdminKnowledgeCategoriesV2,
  listAdminKnowledgeSpaces,
  markKnowledgeArticleReviewed,
  publishKnowledgeArticleV2,
  publishKnowledgeArticleEditorialRevisionV2,
  submitKnowledgeArticleForReviewV2,
  updateKnowledgeArticleAssetReview,
  updateKnowledgeArticleReviewStatus,
  updateKnowledgeArticleDraftV2,
  updateKnowledgeArticleEditorialRevisionV2,
  type AdminKnowledgeArticleReviewAdvisoryRow,
  type AdminKnowledgeArticleDetailV2Row,
  type AdminKnowledgeArticleEditorialDraftRow,
  type AdminKnowledgeArticleAssetRow,
  type AdminKnowledgeArticleListItemV2Row,
  type AdminKnowledgeCategoryV2Row,
  type AdminKnowledgeSpaceRow,
  type KnowledgeAdvisoryClassification,
  type KnowledgeArticleStatus,
  type KnowledgeArticleReviewStatus,
  type KnowledgeReviewHumanConfirmations,
  type KnowledgeVisibility,
} from '../admin/admin-api';
import { classifyAdminError } from '../admin/admin-errors';
import {
  KNOWLEDGE_VISIBILITIES,
} from '../../contracts/admin-contracts';
import { useAuthContext } from '../auth/auth-context';

type PagePhase = 'loading' | 'ready' | 'contract-unavailable' | 'error';
type ContentPhase = 'idle' | 'loading' | 'ready' | 'contract-unavailable' | 'error';
type DetailPhase = 'idle' | 'loading' | 'ready' | 'contract-unavailable' | 'error';
type PanelMode = 'detail' | 'create-article' | 'edit-article' | 'create-category';
type ArticleStatusFilter = KnowledgeArticleStatus | 'all';
type ArticleVisibilityFilter = KnowledgeVisibility | 'all';
type ArticleOriginFilter = 'all' | 'legacy' | 'manual';
type ArticleDuplicateFilter = 'all' | 'duplicates' | 'unique';
type ArticleClassificationFilter = KnowledgeAdvisoryClassification | 'all' | 'without-advisory';
type EditorialChecklistTone = 'default' | 'positive' | 'warning' | 'critical' | 'accent';
type KnowledgeListSort = 'recent' | 'oldest' | 'title';
type KnowledgeDateFilter = 'all' | '90' | '30' | '7';
type DetailTab = 'preview' | 'review' | 'classification' | 'checklist' | 'advanced';

interface EditorialChecklistItem {
  label: string;
  tone: EditorialChecklistTone;
  description: string;
}

interface HumanConfirmationDefinition {
  key: keyof KnowledgeReviewHumanConfirmations;
  label: string;
  help: string;
}

interface ArticleFormState {
  title: string;
  slug: string;
  summary: string;
  bodyMd: string;
  categoryId: string;
  visibility: KnowledgeVisibility;
  sourcePath: string;
  sourceHash: string;
}

interface CategoryFormState {
  name: string;
  slug: string;
  description: string;
  visibility: KnowledgeVisibility;
  parentCategoryId: string;
}

interface ArticleActionFeedback {
  articleId: string;
  message: string;
}

const HUMAN_CONFIRMATION_FIELDS: HumanConfirmationDefinition[] = [
  {
    key: 'title_reviewed',
    label: 'Título revisado',
    help: 'Confirma que o título editorial foi validado por um revisor humano.',
  },
  {
    key: 'summary_reviewed',
    label: 'Resumo revisado',
    help: 'Confirma que o resumo já está claro para suporte e cliente B2B.',
  },
  {
    key: 'body_reviewed',
    label: 'Conteudo em Markdown revisado',
    help: 'Confirma que o corpo principal foi revisado em Markdown seguro.',
  },
  {
    key: 'category_reviewed',
    label: 'Categoria correta',
    help: 'Confirma que a categoria atual representa bem o artigo.',
  },
  {
    key: 'visibility_reviewed',
    label: 'Visibilidade correta',
    help: 'Confirma que a visibilidade do artigo foi validada manualmente.',
  },
  {
    key: 'no_sensitive_data_exposed',
    label: 'Nenhum dado sensível exposto',
    help: 'Confirma revisão humana de credenciais, integrações e dados internos.',
  },
  {
    key: 'ready_for_review',
    label: 'Pronto para revisão',
    help: 'Confirma que o artigo pode sair de rascunho e entrar em revisão editorial.',
  },
  {
    key: 'ready_for_publish',
    label: 'Pronto para publicação',
    help: 'Confirma que o artigo já está pronto para publicação humana quando o status permitir.',
  },
];

function emptyArticleForm(): ArticleFormState {
  return {
    title: '',
    slug: '',
    summary: '',
    bodyMd: '',
    categoryId: '',
    visibility: 'internal',
    sourcePath: '',
    sourceHash: '',
  };
}

function emptyCategoryForm(): CategoryFormState {
  return {
    name: '',
    slug: '',
    description: '',
    visibility: 'internal',
    parentCategoryId: '',
  };
}

function emptyHumanConfirmations(): KnowledgeReviewHumanConfirmations {
  return {};
}

function normalizeHumanConfirmations(
  value: unknown,
): KnowledgeReviewHumanConfirmations {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return emptyHumanConfirmations();
  }

  const record = value as Record<string, unknown>;
  const result: KnowledgeReviewHumanConfirmations = {};

  for (const field of HUMAN_CONFIRMATION_FIELDS) {
    if (typeof record[field.key] === 'boolean') {
      result[field.key] = record[field.key] as boolean;
    }
  }

  return result;
}

function buildArticleForm(detail: AdminKnowledgeArticleDetailV2Row): ArticleFormState {
  return {
    title: detail.title,
    slug: detail.slug,
    summary: detail.summary ?? '',
    bodyMd: detail.body_md,
    categoryId: detail.category_id ?? '',
    visibility: detail.visibility,
    sourcePath: detail.source_path ?? '',
    sourceHash: detail.source_hash ?? '',
  };
}

function buildArticleFormFromEditorialDraft(
  draft: AdminKnowledgeArticleEditorialDraftRow,
): ArticleFormState {
  return {
    title: draft.title,
    slug: draft.slug,
    summary: draft.summary ?? '',
    bodyMd: draft.body_md,
    categoryId: draft.category_id ?? '',
    visibility: draft.visibility,
    sourcePath: draft.source_path ?? '',
    sourceHash: draft.source_hash ?? '',
  };
}

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-+|-+$)/g, '')
    .replace(/-{2,}/g, '-');
}

function normalizeOptionalText(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toneForSpaceStatus(status: AdminKnowledgeSpaceRow['status']) {
  if (status === 'active') {
    return 'positive' as const;
  }

  if (status === 'archived') {
    return 'critical' as const;
  }

  return 'warning' as const;
}

function toneForArticleStatus(status: KnowledgeArticleStatus) {
  if (status === 'published') {
    return 'positive' as const;
  }

  if (status === 'review') {
    return 'warning' as const;
  }

  if (status === 'archived') {
    return 'critical' as const;
  }

  return 'default' as const;
}

function toneForReviewStatus(status: KnowledgeArticleReviewStatus) {
  if (status === 'reviewed') {
    return 'positive' as const;
  }

  if (status === 'ready_for_publish' || status === 'ready_for_review') {
    return 'accent' as const;
  }

  if (status === 'needs_changes') {
    return 'critical' as const;
  }

  if (status === 'in_review') {
    return 'warning' as const;
  }

  return 'default' as const;
}

function displayReviewStatus(status: KnowledgeArticleReviewStatus) {
  if (status === 'reviewed') {
    return 'Revisado';
  }

  if (status === 'ready_for_publish') {
    return 'Pronto para publicar';
  }

  if (status === 'ready_for_review') {
    return 'Pronto para revisão';
  }

  if (status === 'needs_changes') {
    return 'Precisa de ajustes';
  }

  if (status === 'in_review') {
    return 'Em revisão humana';
  }

  return 'Pendente';
}

function toneForAdvisoryClassification(
  classification: KnowledgeAdvisoryClassification,
) {
  if (classification === 'public') {
    return 'positive' as const;
  }

  if (classification === 'internal') {
    return 'accent' as const;
  }

  if (classification === 'obsolete' || classification === 'duplicate') {
    return 'warning' as const;
  }

  return 'critical' as const;
}

function displayAdvisoryClassification(
  classification: KnowledgeAdvisoryClassification,
) {
  if (classification === 'public') {
    return 'Público';
  }

  if (classification === 'internal') {
    return 'Interno';
  }

  if (classification === 'restricted') {
    return 'Restrito';
  }

  if (classification === 'obsolete') {
    return 'Obsoleto';
  }

  return 'Duplicado';
}

function toneForVisibility(visibility: KnowledgeVisibility) {
  if (visibility === 'public') {
    return 'positive' as const;
  }

  if (visibility === 'restricted') {
    return 'critical' as const;
  }

  return 'accent' as const;
}

function compactStatusBadgeClass(
  tone: 'default' | 'positive' | 'warning' | 'critical' | 'accent',
) {
  if (tone === 'positive') {
    return 'border-[color:var(--color-success-border)] bg-[color:var(--color-success-surface)] text-[color:var(--color-success-ink)]';
  }

  if (tone === 'warning') {
    return 'border-[color:var(--color-warning-border)] bg-[color:var(--color-warning-surface)] text-[color:var(--color-warning-ink)]';
  }

  if (tone === 'critical') {
    return 'border-[color:var(--color-danger-border)] bg-[color:var(--color-danger-surface)] text-[color:var(--color-danger-ink)]';
  }

  if (tone === 'accent') {
    return 'border-[color:color-mix(in_srgb,var(--color-brand-magenta)_34%,transparent)] bg-[color:color-mix(in_srgb,var(--color-brand-magenta)_14%,var(--color-surface))] text-[color:var(--color-brand-magenta)]';
  }

  return 'border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[color:var(--color-ink)]';
}

function compactStatusBadgeLabel(status: KnowledgeArticleStatus) {
  if (status === 'published') {
    return 'Publicado';
  }

  if (status === 'review') {
    return 'Em revisão';
  }

  if (status === 'archived') {
    return 'Arquivado';
  }

  return 'Rascunho';
}

function displayArticleStatus(status: KnowledgeArticleStatus) {
  if (status === 'published') {
    return 'Publicado';
  }

  if (status === 'review') {
    return 'Em revisão';
  }

  if (status === 'archived') {
    return 'Arquivado';
  }

  return 'Rascunho';
}

function displayVisibility(visibility: KnowledgeVisibility) {
  if (visibility === 'public') {
    return 'Público na central de ajuda';
  }

  if (visibility === 'restricted') {
    return 'Restrito';
  }

  return 'Interno';
}

function humanizeRiskFlag(flag: string) {
  const normalized = flag.replace(/[_-]+/g, ' ').trim();

  if (!normalized) {
    return 'Risco editorial';
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function shortVisibilityLabel(visibility: KnowledgeVisibility) {
  if (visibility === 'public') {
    return 'Público';
  }

  if (visibility === 'restricted') {
    return 'Restrito';
  }

  return 'Interno';
}

function articleContributorName(article: AdminKnowledgeArticleListItemV2Row) {
  return (
    article.updated_by_full_name ??
    article.created_by_full_name ??
    'Indisponível'
  );
}

function articleContributorNameFromDetail(article: AdminKnowledgeArticleDetailV2Row) {
  return (
    article.updated_by_full_name ??
    article.created_by_full_name ??
    'Indisponível'
  );
}

function formatOptionalDate(value: string | null) {
  return value ? formatDateTime(value) : 'Indisponível';
}

function categoryDisplayName(category: AdminKnowledgeCategoryV2Row) {
  return category.parent_name
    ? `${category.parent_name} / ${category.name}`
    : category.name;
}

function noticeTone(message: string) {
  return /sucesso|concluida/i.test(message) ? 'positive' : 'critical';
}

function categoryBadgeClass(name: string | null | undefined) {
  const normalized = (name ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

  if (normalized.includes('integr')) {
    return 'border-[color:color-mix(in_srgb,var(--color-brand-magenta)_34%,transparent)] bg-[color:color-mix(in_srgb,var(--color-brand-magenta)_14%,var(--color-surface))] text-[color:var(--color-brand-magenta)]';
  }

  if (normalized.includes('operac') || normalized.includes('reversa')) {
    return 'border-[color:var(--color-warning-border)] bg-[color:var(--color-warning-surface)] text-[color:var(--color-warning-ink)]';
  }

  if (normalized.includes('primeir')) {
    return 'border-[color:color-mix(in_srgb,var(--color-brand-blue)_34%,transparent)] bg-[color:color-mix(in_srgb,var(--color-brand-blue)_14%,var(--color-surface))] text-[color:var(--color-brand-blue)]';
  }

  if (normalized.includes('verifica')) {
    return 'border-[color:var(--color-success-border)] bg-[color:var(--color-success-surface)] text-[color:var(--color-success-ink)]';
  }

  return 'border-[color:color-mix(in_srgb,var(--color-brand-blue)_28%,transparent)] bg-[color:color-mix(in_srgb,var(--color-brand-blue)_12%,var(--color-surface))] text-[color:var(--color-brand-blue)]';
}

function compactCategoryLabel(name: string | null | undefined) {
  const normalized = (name ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

  if (normalized.includes('fixture') || normalized.includes('space aware')) {
    return 'Verificação';
  }

  if (normalized.includes('operacao') || normalized.includes('reversa')) {
    return 'Operação';
  }

  if (normalized.includes('suporte tecnico')) {
    return 'Suporte técnico';
  }

  if (normalized.includes('primeiros')) {
    return 'Primeiros passos';
  }

  if (normalized.includes('verificacao')) {
    return 'Verificação';
  }

  return name ?? 'Indisponível';
}

function displayFilterCategoryLabel(name: string | null | undefined) {
  const normalized = (name ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

  if (normalized.includes('space aware') || normalized.includes('verificacao') || normalized.includes('fixture')) {
    return 'Verificação';
  }

  return name ?? 'Indisponível';
}

function estimateReadingTime(body: string | null | undefined) {
  const words = (body ?? '').trim().split(/\s+/).filter(Boolean).length;

  if (words === 0) {
    return 'Indisponível';
  }

  return `${Math.max(1, Math.ceil(words / 180))} min de leitura`;
}

function buildSourceHashCounts(articles: AdminKnowledgeArticleListItemV2Row[]) {
  const counts = new Map<string, number>();

  for (const article of articles) {
    if (!article.source_hash) {
      continue;
    }

    counts.set(article.source_hash, (counts.get(article.source_hash) ?? 0) + 1);
  }

  return counts;
}

function containsLegacyHtml(value: string) {
  return /<[^>]+>/.test(value);
}

function normalizeRiskFlags(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as string[];
  }

  return value.filter((item): item is string => typeof item === 'string');
}

function buildPersistedHumanChecklist(
  confirmations: KnowledgeReviewHumanConfirmations,
): EditorialChecklistItem[] {
  return HUMAN_CONFIRMATION_FIELDS.map((field) => {
    const checked = confirmations[field.key] === true;

    return {
      label: field.label,
      tone: checked ? 'positive' : 'warning',
      description: checked
        ? 'Confirmação humana registrada para este item.'
        : field.help,
    } satisfies EditorialChecklistItem;
  });
}

function hasCompleteHumanPublishEvidence(
  confirmations: KnowledgeReviewHumanConfirmations,
) {
  return HUMAN_CONFIRMATION_FIELDS.every((field) => confirmations[field.key] === true);
}

function buildEditorialChecklist(
  article: AdminKnowledgeArticleDetailV2Row,
  duplicateCount: number,
) {
  const titleReady = article.title.trim().length >= 8;
  const summaryLength = article.summary?.trim().length ?? 0;
  const summaryReady = summaryLength >= 24;
  const bodyLength = article.body_md.trim().length;
  const bodyHasLegacyHtml = containsLegacyHtml(article.body_md);
  const bodyReady = bodyLength >= 80 && !bodyHasLegacyHtml;
  const categoryReady = Boolean(article.category_id);
  const automatedReady = titleReady && summaryReady && bodyReady && categoryReady;

  const automated: EditorialChecklistItem[] = [
    {
      label: 'Título revisado',
      tone: titleReady ? 'positive' : 'critical',
      description: titleReady
        ? 'Título com comprimento suficiente para revisão editorial.'
        : 'Título ainda curto ou vazio para uma triagem segura.',
    },
    {
      label: 'Resumo revisado',
      tone: summaryReady ? 'positive' : 'warning',
      description: summaryReady
        ? 'Resumo presente e com densidade mínima para orientar a leitura.'
        : 'Resumo ausente ou curto; vale revisar antes de promover o artigo.',
    },
    {
      label: 'Markdown revisado',
      tone: bodyReady ? 'positive' : bodyHasLegacyHtml ? 'critical' : 'warning',
      description: bodyReady
        ? 'Corpo principal em Markdown e sem sinal de HTML legado.'
        : bodyHasLegacyHtml
          ? 'Corpo ainda contém marca de HTML legado; revise antes de avançar.'
          : 'Corpo principal ainda curto para uma leitura editorial segura.',
    },
    {
      label: 'Categoria correta',
      tone: categoryReady ? 'positive' : 'critical',
      description: categoryReady
        ? 'Artigo já está vinculado a uma categoria editorial.'
        : 'Categoria ainda não definida; classifique antes da revisão.',
    },
  ];

  const manual: EditorialChecklistItem[] = [
    {
      label: 'Visibilidade correta',
      tone:
        article.visibility === 'restricted'
          ? 'critical'
          : article.visibility === 'internal'
            ? 'warning'
            : 'accent',
      description:
        article.visibility === 'restricted'
          ? 'Conteúdo restrito exige leitura cautelosa antes de qualquer promoção.'
          : article.visibility === 'internal'
        ? 'Confirmar se o artigo deve permanecer interno ou evoluir para público.'
            : 'Confirmar se o recorte público está coerente com o risco real do artigo.',
    },
    {
      label: 'Nenhum segredo ou API sensivel exposto',
      tone: 'warning',
      description:
        'Confirmação humana obrigatória para garantir que nenhum dado sensível apareça no artigo.',
    },
    {
      label: 'Pronto para revisão',
      tone:
        automatedReady && article.status === 'draft'
          ? 'positive'
          : article.status === 'draft'
            ? 'warning'
            : 'default',
      description:
        automatedReady && article.status === 'draft'
          ? 'Sinais objetivos mínimos completos para envio à revisão humana.'
          : article.status === 'draft'
            ? 'Ainda faltam ajustes objetivos antes do envio para revisão.'
            : 'O artigo já saiu de rascunho; confirme o contexto editorial antes de repetir a ação.',
    },
    {
      label: 'Pronto para publicação',
      tone:
        automatedReady && article.status === 'review'
          ? 'positive'
          : article.status === 'review'
            ? 'warning'
            : 'default',
      description:
        automatedReady && article.status === 'review'
          ? 'Sinais objetivos completos; falta apenas a aprovação humana final.'
          : article.status === 'review'
            ? 'O artigo está em revisão, mas ainda precisa de ajuste antes da publicação.'
            : 'A publicação continua bloqueada até o artigo chegar à revisão com revisão humana concluída.',
    },
  ];

  if (duplicateCount > 1) {
    manual.unshift({
      label: 'Possivel duplicidade de origem',
      tone: 'warning',
      description: `Existe mais ${duplicateCount - 1} artigo nesta central com a mesma origem rastreada. Consolidar antes de promover.`,
    });
  }

  return {
    automated,
    manual,
    automatedReady,
    backlogClassificationAvailable: false,
  };
}

export function KnowledgePage() {
  const navigate = useNavigate();
  const { markSessionExpired } = useAuthContext();
  const didBootstrapRef = useRef(false);
  const [backendDenied, setBackendDenied] = useState(false);
  const [pagePhase, setPagePhase] = useState<PagePhase>('loading');
  const [pageMessage, setPageMessage] = useState<string | null>(null);
  const [spaces, setSpaces] = useState<AdminKnowledgeSpaceRow[]>([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);
  const [contentPhase, setContentPhase] = useState<ContentPhase>('idle');
  const [contentMessage, setContentMessage] = useState<string | null>(null);
  const [advisoryMessage, setAdvisoryMessage] = useState<string | null>(null);
  const [categories, setCategories] = useState<AdminKnowledgeCategoryV2Row[]>([]);
  const [articles, setArticles] = useState<AdminKnowledgeArticleListItemV2Row[]>([]);
  const [advisories, setAdvisories] = useState<AdminKnowledgeArticleReviewAdvisoryRow[]>([]);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [listStatusFilter, setListStatusFilter] = useState<ArticleStatusFilter>('all');
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [selectedAuthor, setSelectedAuthor] = useState('all');
  const [selectedDateWindow, setSelectedDateWindow] =
    useState<KnowledgeDateFilter>('90');
  const [listSort, setListSort] = useState<KnowledgeListSort>('recent');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [detailPhase, setDetailPhase] = useState<DetailPhase>('idle');
  const [detailMessage, setDetailMessage] = useState<string | null>(null);
  const [articleDetail, setArticleDetail] = useState<AdminKnowledgeArticleDetailV2Row | null>(null);
  const [articleAssets, setArticleAssets] = useState<AdminKnowledgeArticleAssetRow[]>([]);
  const [assetActionSubmitting, setAssetActionSubmitting] = useState<string | null>(null);
  const [panelMode, setPanelMode] = useState<PanelMode>('detail');
  const [detailTab, setDetailTab] = useState<DetailTab>('preview');
  const [statusFilter, setStatusFilter] = useState<ArticleStatusFilter>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<ArticleVisibilityFilter>('all');
  const [originFilter, setOriginFilter] = useState<ArticleOriginFilter>('all');
  const [duplicateFilter, setDuplicateFilter] = useState<ArticleDuplicateFilter>('all');
  const [classificationFilter, setClassificationFilter] =
    useState<ArticleClassificationFilter>('all');
  const [articleForm, setArticleForm] = useState<ArticleFormState>(emptyArticleForm);
  const [articleFormSubmitting, setArticleFormSubmitting] = useState(false);
  const [articleFormMessage, setArticleFormMessage] = useState<string | null>(null);
  const [categoryForm, setCategoryForm] = useState<CategoryFormState>(emptyCategoryForm);
  const [categoryEditingId, setCategoryEditingId] = useState<string | null>(null);
  const [categoryFormSubmitting, setCategoryFormSubmitting] = useState(false);
  const [categoryFormMessage, setCategoryFormMessage] = useState<string | null>(null);
  const [articleActionSubmitting, setArticleActionSubmitting] = useState(false);
  const [articleActionFeedback, setArticleActionFeedback] =
    useState<ArticleActionFeedback | null>(null);
  const [reviewStatusDraft, setReviewStatusDraft] =
    useState<KnowledgeArticleReviewStatus>('pending');
  const [reviewNotesDraft, setReviewNotesDraft] = useState('');
  const [humanConfirmationsDraft, setHumanConfirmationsDraft] =
    useState<KnowledgeReviewHumanConfirmations>(emptyHumanConfirmations);
  const [reviewAdvisorySubmitting, setReviewAdvisorySubmitting] = useState(false);
  const [reviewAdvisoryMessage, setReviewAdvisoryMessage] = useState<string | null>(null);

  const selectedSpace =
    spaces.find((space) => space.id === selectedSpaceId) ?? null;
  const selectedArticleSummary =
    articles.find((article) => article.id === selectedArticleId) ?? null;
  const articleCategoryMap = new Map(categories.map((category) => [category.id, category]));
  const advisoryMap = new Map(advisories.map((advisory) => [advisory.article_id, advisory]));
  const selectedAdvisory =
    selectedArticleId ? advisoryMap.get(selectedArticleId) ?? null : null;
  const sourceHashCounts = buildSourceHashCounts(articles);
  const legacyArticlesCount = articles.filter(
    (article) => Boolean(article.source_path || article.source_hash),
  ).length;
  const manualArticlesCount = articles.length - legacyArticlesCount;
  const duplicateArticlesCount = articles.filter((article) => {
    const advisoryDuplicateCount =
      advisoryMap.get(article.id)?.duplicate_group_article_count ?? 0;
    const sourceDuplicateCount = article.source_hash
      ? sourceHashCounts.get(article.source_hash) ?? 0
      : 0;

    return Math.max(advisoryDuplicateCount, sourceDuplicateCount) > 1;
  }).length;
  const reviewedArticlesCount = advisories.filter(
    (advisory) => advisory.review_status === 'reviewed',
  ).length;
  const withoutAdvisoryCount = articles.filter(
    (article) => !advisoryMap.has(article.id),
  ).length;
  const filteredArticles = articles.filter((article) => {
    const articleAdvisory = advisoryMap.get(article.id);

    if (originFilter === 'legacy') {
      if (!article.source_path && !article.source_hash) {
        return false;
      }
    }

    if (originFilter === 'manual') {
      if (article.source_path || article.source_hash) {
        return false;
      }
    }

    if (classificationFilter === 'without-advisory') {
      if (articleAdvisory) {
        return false;
      }
    } else if (classificationFilter !== 'all') {
      if (articleAdvisory?.suggested_classification !== classificationFilter) {
        return false;
      }
    }

    const duplicateCount =
      articleAdvisory?.duplicate_group_article_count ??
      (article.source_hash ? sourceHashCounts.get(article.source_hash) ?? 0 : 0);

    if (duplicateFilter === 'duplicates' && duplicateCount <= 1) {
      return false;
    }

    if (duplicateFilter === 'unique' && duplicateCount > 1) {
      return false;
    }

    return true;
  });
  const articleActionMessage =
    articleActionFeedback &&
    selectedArticleId &&
    articleActionFeedback.articleId === selectedArticleId
      ? articleActionFeedback.message
      : null;
  const selectedArticleDuplicateCount =
    selectedAdvisory?.duplicate_group_article_count ??
    (articleDetail?.source_hash
      ? sourceHashCounts.get(articleDetail.source_hash) ?? 0
      : 0);
  const selectedArticleCategory =
    articleDetail?.category_id
      ? articleCategoryMap.get(articleDetail.category_id) ?? null
      : null;
  const editorialDraftCategory =
    articleDetail?.editorial_draft?.category_id
      ? articleCategoryMap.get(articleDetail.editorial_draft.category_id) ?? null
      : null;
  const articleFormCategory =
    articleForm.categoryId
      ? articleCategoryMap.get(articleForm.categoryId) ?? null
      : null;
  const publishedEditorialDraft = articleDetail?.editorial_draft ?? null;
  const articleHasPublicCategoryMismatch =
    articleDetail?.visibility === 'public' &&
    articleDetail.category_id !== null &&
    selectedArticleCategory?.visibility !== 'public';
  const editorialDraftHasPublicCategoryMismatch =
    publishedEditorialDraft?.visibility === 'public' &&
    publishedEditorialDraft.category_id !== null &&
    editorialDraftCategory?.visibility !== 'public';
  const articleFormHasPublicCategoryMismatch =
    articleForm.visibility === 'public' &&
    articleForm.categoryId !== '' &&
    articleFormCategory?.visibility !== 'public';
  const publicPreviewHref =
    articleDetail && !articleHasPublicCategoryMismatch
      ? articleDetail.public_article_path
      : null;
  const publicPreviewMessage =
    articleHasPublicCategoryMismatch
      ? 'Indisponível enquanto a categoria do artigo não estiver pública.'
      : articleDetail?.visibility !== 'public'
        ? 'Indisponível enquanto o artigo permanecer interno.'
        : articleDetail?.status !== 'published'
          ? 'Indisponível enquanto o artigo não estiver publicado.'
          : 'Indisponível neste ambiente.';
  const editorialPreviewTitle =
    articleDetail?.status === 'published' && publishedEditorialDraft
      ? 'Preview da revisão'
      : 'Preview editorial';
  const editorialPreviewBody =
    articleDetail?.status === 'published' && publishedEditorialDraft
      ? publishedEditorialDraft.body_md
      : articleDetail?.body_md ?? '';
  const editorialChecklist = articleDetail
    ? buildEditorialChecklist(articleDetail, selectedArticleDuplicateCount)
    : null;
  const canSubmitForReview =
    articleDetail?.status === 'draft' &&
    (editorialChecklist?.automatedReady ?? false);
  const hasHumanPublishEvidence =
    !!selectedAdvisory &&
    selectedAdvisory.suggested_visibility === 'public' &&
    selectedAdvisory.suggested_classification === 'public' &&
    selectedAdvisory.review_status === 'reviewed' &&
    hasCompleteHumanPublishEvidence(humanConfirmationsDraft);
  const canPublishArticle =
    articleDetail?.status === 'review' &&
    !advisoryMessage &&
    (articleDetail.visibility !== 'public' || hasHumanPublishEvidence) &&
    !articleHasPublicCategoryMismatch;
  const canPublishEditorialRevision =
    articleDetail?.status === 'published' &&
    !!publishedEditorialDraft &&
    publishedEditorialDraft.title.trim().length > 0 &&
    publishedEditorialDraft.body_md.trim().length > 0 &&
    publishedEditorialDraft.category_id !== null &&
    (publishedEditorialDraft.visibility !== 'public' || hasHumanPublishEvidence) &&
    !editorialDraftHasPublicCategoryMismatch;
  const persistedHumanChecklist = buildPersistedHumanChecklist(humanConfirmationsDraft);
  const advisoryRiskFlags = normalizeRiskFlags(selectedAdvisory?.risk_flags);
  const selectedHumanConfirmationsCount = HUMAN_CONFIRMATION_FIELDS.filter(
    (field) => humanConfirmationsDraft[field.key] === true,
  ).length;
  const statusCounts = {
    all: filteredArticles.length,
    published: filteredArticles.filter((article) => article.status === 'published').length,
    draft: filteredArticles.filter((article) => article.status === 'draft').length,
    review: filteredArticles.filter((article) => article.status === 'review').length,
    archived: filteredArticles.filter((article) => article.status === 'archived').length,
  };
  const visibilityCounts = {
    public: filteredArticles.filter((article) => article.visibility === 'public').length,
    internal: filteredArticles.filter((article) => article.visibility === 'internal').length,
    restricted: filteredArticles.filter((article) => article.visibility === 'restricted').length,
  };
  const sortedCategories = [...categories].sort((left, right) => {
    if (right.article_count !== left.article_count) {
      return right.article_count - left.article_count;
    }

    return left.name.localeCompare(right.name, 'pt-BR');
  });
  const visibleCategories = showAllCategories
    ? sortedCategories
    : sortedCategories.slice(0, 5);
  const availableAuthors = Array.from(
    new Set(filteredArticles.map((article) => articleContributorName(article))),
  ).sort((left, right) => left.localeCompare(right, 'pt-BR'));
  const searchedArticles = filteredArticles.filter((article) => {
    if (listStatusFilter !== 'all' && article.status !== listStatusFilter) {
      return false;
    }

    if (visibilityFilter !== 'all' && article.visibility !== visibilityFilter) {
      return false;
    }

    if (selectedCategoryId !== 'all' && article.category_id !== selectedCategoryId) {
      return false;
    }

    if (
      selectedAuthor !== 'all' &&
      articleContributorName(article) !== selectedAuthor
    ) {
      return false;
    }

    if (selectedDateWindow !== 'all') {
      const days = Number(selectedDateWindow);
      const updatedAtMs = Date.parse(article.updated_at);

      if (Number.isFinite(updatedAtMs)) {
        const ageInDays = (Date.now() - updatedAtMs) / (1000 * 60 * 60 * 24);

        if (ageInDays > days) {
          return false;
        }
      }
    }

    if (!searchQuery.trim()) {
      return true;
    }

    const haystack = [
      article.title,
      article.slug,
      article.summary ?? '',
      article.category_name ?? '',
      article.source_path ?? '',
      article.source_hash ?? '',
      articleContributorName(article),
    ]
      .join(' ')
      .toLowerCase();

    return haystack.includes(searchQuery.trim().toLowerCase());
  });
  const displayArticles = [...searchedArticles].sort((left, right) => {
    if (listSort === 'title') {
      return left.title.localeCompare(right.title, 'pt-BR');
    }

    const leftTime = Date.parse(left.updated_at);
    const rightTime = Date.parse(right.updated_at);

    if (listSort === 'oldest') {
      return leftTime - rightTime;
    }

    return rightTime - leftTime;
  });
  const articlesPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(displayArticles.length / articlesPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStartIndex = (safeCurrentPage - 1) * articlesPerPage;
  const pageEndIndex = Math.min(pageStartIndex + articlesPerPage, displayArticles.length);
  const paginatedArticles = displayArticles.slice(pageStartIndex, pageEndIndex);
  const publishedArticlesCount = articles.filter(
    (article) => article.status === 'published',
  ).length;
  const pendingReviewCount = advisories.filter(
    (advisory) => advisory.review_status === 'pending',
  ).length;
  const needsUpdateCount = advisories.filter(
    (advisory) =>
      advisory.review_status === 'needs_changes' ||
      advisory.suggested_classification === 'internal' ||
      advisory.suggested_classification === 'restricted',
  ).length;
  const archiveSuggestedCount = advisories.filter(
    (advisory) =>
      advisory.suggested_classification === 'obsolete' ||
      advisory.suggested_classification === 'duplicate',
  ).length;
  const restrictedArticlesCount = articles.filter(
    (article) => article.visibility === 'restricted',
  ).length;
  const internalArticlesCount = articles.filter(
    (article) => article.visibility === 'internal',
  ).length;
  const publicArticlesCount = articles.filter(
    (article) => article.visibility === 'public',
  ).length;
  const publicCoverageLabel =
    articles.length > 0
      ? `${Math.round((publishedArticlesCount / articles.length) * 100)}% do total`
      : 'Sem artigos';
  const needsUpdateCoverageLabel =
    articles.length > 0
      ? `${Math.round((needsUpdateCount / articles.length) * 100)}% do total`
      : 'Sem artigos';
  const archiveCoverageLabel =
    articles.length > 0
      ? `${Math.round((archiveSuggestedCount / articles.length) * 100)}% do total`
      : 'Sem artigos';
  const categoryRailItems = sortedCategories.slice(0, 8);
  const operationsSummaryItems = [
    {
      label: 'Revisões pendentes',
      value: pendingReviewCount,
      tone: 'accent' as const,
    },
    {
      label: 'Artigos internos',
      value: internalArticlesCount,
      tone: 'default' as const,
    },
    {
      label: 'Artigos restritos',
      value: restrictedArticlesCount,
      tone: 'critical' as const,
    },
    {
      label: 'Possíveis duplicados',
      value: duplicateArticlesCount,
      tone: 'warning' as const,
    },
  ];
  const editorialAlertItems = [
    advisoryMessage
      ? {
          label: 'Sinais editoriais indisponíveis',
          description: advisoryMessage,
          tone: 'warning' as const,
        }
      : null,
    withoutAdvisoryCount > 0
      ? {
          label: 'Sem análise editorial',
          description: `${withoutAdvisoryCount} artigo(s) ainda não possuem sinal editorial registrado.`,
          tone: 'accent' as const,
        }
      : null,
    restrictedArticlesCount > 0
      ? {
          label: 'Conteúdo restrito bloqueado',
          description: `${restrictedArticlesCount} artigo(s) permanecem fora da Central Pública por visibilidade restrita.`,
          tone: 'critical' as const,
        }
      : null,
    archiveSuggestedCount > 0
      ? {
          label: 'Arquivamento sugerido',
          description: `${archiveSuggestedCount} artigo(s) foram classificados como duplicados ou obsoletos.`,
          tone: 'warning' as const,
        }
      : null,
  ].filter((item): item is NonNullable<typeof item> => Boolean(item));

  const loadKnowledgeSpaces = useEffectEvent(
    async (preferredSpaceId?: string | null) => {
      try {
        const data = await listAdminKnowledgeSpaces();
        setSpaces(data);
        setPagePhase('ready');
        setPageMessage(null);
        setBackendDenied(false);

        const preservedSpaceId =
          preferredSpaceId ??
          (data.some((space) => space.id === selectedSpaceId)
            ? selectedSpaceId
            : null);

        setSelectedSpaceId(preservedSpaceId ?? data[0]?.id ?? null);
      } catch (error) {
        const classified = classifyAdminError(
          error,
        'Falha ao carregar a superfície das centrais editoriais.',
        );

        if (classified.kind === 'session-expired') {
          markSessionExpired();
          return;
        }

        if (classified.kind === 'permission-denied') {
          setBackendDenied(true);
          return;
        }

        setSpaces([]);
        setSelectedSpaceId(null);
        setPageMessage(classified.message);
        setPagePhase(
          classified.kind === 'contract-unavailable'
            ? 'contract-unavailable'
            : 'error',
        );
      }
    },
  );

  const loadKnowledgeContent = useEffectEvent(
    async (knowledgeSpaceId: string, preferredArticleId?: string | null) => {
      setContentPhase('loading');
      setContentMessage(null);
      setAdvisoryMessage(null);

      try {
        const [categoriesResult, articlesResult, advisoriesResult] = await Promise.allSettled([
          listAdminKnowledgeCategoriesV2(knowledgeSpaceId),
          listAdminKnowledgeArticlesV2({
            knowledgeSpaceId,
            status: statusFilter,
            visibility: visibilityFilter,
          }),
          listAdminKnowledgeArticleReviewAdvisories(knowledgeSpaceId),
        ]);

        if (categoriesResult.status === 'rejected') {
          throw categoriesResult.reason;
        }

        if (articlesResult.status === 'rejected') {
          throw articlesResult.reason;
        }

        const categoriesData = categoriesResult.value;
        const articlesData = articlesResult.value;

        setCategories(categoriesData);
        setArticles(articlesData);
        setContentPhase('ready');
        setContentMessage(null);
        setBackendDenied(false);

        if (advisoriesResult.status === 'fulfilled') {
          setAdvisories(advisoriesResult.value);
          setAdvisoryMessage(null);
        } else {
          const advisoryError = classifyAdminError(
            advisoriesResult.reason,
        'Os sinais de revisão editorial não ficaram disponíveis neste ambiente.',
          );

          if (advisoryError.kind === 'session-expired') {
            markSessionExpired();
            return;
          }

          setAdvisories([]);
          setAdvisoryMessage(advisoryError.message);
        }

        const preservedArticleId =
          preferredArticleId ??
          (articlesData.some((article) => article.id === selectedArticleId)
            ? selectedArticleId
            : null);

        setSelectedArticleId(preservedArticleId ?? articlesData[0]?.id ?? null);
      } catch (error) {
        const classified = classifyAdminError(
          error,
          'Falha ao carregar a camada editorial da central de ajuda.',
        );

        if (classified.kind === 'session-expired') {
          markSessionExpired();
          return;
        }

        if (classified.kind === 'permission-denied') {
          setBackendDenied(true);
          return;
        }

        setCategories([]);
        setArticles([]);
        setAdvisories([]);
        setSelectedArticleId(null);
        setContentMessage(classified.message);
        setContentPhase(
          classified.kind === 'contract-unavailable'
            ? 'contract-unavailable'
            : 'error',
        );
      }
    },
  );

  const loadArticleDetail = useEffectEvent(async (articleId: string) => {
    setDetailPhase('loading');
    setDetailMessage(null);

    try {
      const detail = await getAdminKnowledgeArticleDetailV2(articleId);
      const assets = await listAdminKnowledgeArticleAssets(articleId);
      setBackendDenied(false);

      if (!detail) {
        setArticleDetail(null);
        setArticleAssets([]);
        setDetailPhase('error');
        setDetailMessage(
        'O detalhe do artigo selecionado não ficou disponível.',
        );
        return;
      }

      setArticleDetail(detail);
      setArticleAssets(assets);
      setDetailPhase('ready');
    } catch (error) {
      const classified = classifyAdminError(
        error,
        'Falha ao carregar o detalhe editorial do artigo.',
      );

      if (classified.kind === 'session-expired') {
        markSessionExpired();
        return;
      }

      if (classified.kind === 'permission-denied') {
        setBackendDenied(true);
        return;
      }

      setArticleDetail(null);
      setArticleAssets([]);
      setDetailMessage(classified.message);
      setDetailPhase(
        classified.kind === 'contract-unavailable'
          ? 'contract-unavailable'
          : 'error',
      );
    }
  });

  useEffect(() => {
    if (didBootstrapRef.current) {
      return;
    }

    didBootstrapRef.current = true;
    void loadKnowledgeSpaces();
  }, []);

  useEffect(() => {
    setPanelMode('detail');
    setDetailTab('preview');
    setArticleForm(emptyArticleForm());
    setCategoryForm(emptyCategoryForm());
    setArticleFormMessage(null);
    setCategoryFormMessage(null);
    setArticleActionFeedback(null);
    setReviewAdvisoryMessage(null);
    setReviewStatusDraft('pending');
    setReviewNotesDraft('');
    setHumanConfirmationsDraft(emptyHumanConfirmations());
  }, [selectedSpaceId]);

  useEffect(() => {
    if (!selectedSpaceId) {
      setCategories([]);
      setArticles([]);
      setAdvisories([]);
      setSelectedArticleId(null);
      setContentPhase('idle');
      setContentMessage(null);
      setAdvisoryMessage(null);
      return;
    }

    void loadKnowledgeContent(selectedSpaceId);
  }, [selectedSpaceId, statusFilter, visibilityFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    listStatusFilter,
    selectedCategoryId,
    selectedAuthor,
    selectedDateWindow,
    listSort,
    visibilityFilter,
    originFilter,
    duplicateFilter,
    classificationFilter,
  ]);

  useEffect(() => {
    if (!selectedArticleId) {
      setArticleDetail(null);
      setArticleAssets([]);
      setDetailPhase('idle');
      setDetailMessage(null);
      return;
    }

    setDetailTab('preview');
    void loadArticleDetail(selectedArticleId);
  }, [selectedArticleId]);

  useEffect(() => {
    setReviewAdvisoryMessage(null);
    setReviewStatusDraft(selectedAdvisory?.review_status ?? 'pending');
    setReviewNotesDraft(selectedAdvisory?.review_notes ?? '');
    setHumanConfirmationsDraft(
      normalizeHumanConfirmations(selectedAdvisory?.human_confirmations),
    );
  }, [selectedAdvisory?.id]);

  function openCreateArticle() {
    navigate('/admin/knowledge/new');
  }

  function closeArticleEditor() {
    setPanelMode('detail');
    setArticleForm(emptyArticleForm());
    setArticleFormMessage(null);
  }

  function openCreateCategory() {
    setPanelMode('create-category');
    setCategoryEditingId(null);
    setCategoryForm(emptyCategoryForm());
    setCategoryFormMessage(null);
    setArticleActionFeedback(null);
  }

  function openEditCategory(category: AdminKnowledgeCategoryV2Row) {
    setPanelMode('create-category');
    setCategoryEditingId(category.id);
    setCategoryForm({
      name: category.name,
      slug: category.slug,
      description: category.description ?? '',
      visibility: category.visibility,
      parentCategoryId: category.parent_category_id ?? '',
    });
    setCategoryFormMessage(null);
    setArticleActionFeedback(null);
  }

  function openEditArticle() {
    if (!articleDetail) {
      return;
    }

    navigate(`/admin/knowledge/${articleDetail.id}/edit`);
  }

  function openArticleEditorFromCockpit(articleId: string) {
    navigate(`/admin/knowledge/${articleId}/edit`);
  }

  async function refreshSelectedSpace(preferredArticleId?: string | null) {
    if (!selectedSpaceId) {
      return;
    }

    await loadKnowledgeContent(selectedSpaceId, preferredArticleId ?? selectedArticleId);
  }

  async function refreshArticleDetail(articleId?: string | null) {
    const targetArticleId = articleId ?? selectedArticleId;
    if (!targetArticleId) {
      return;
    }

    await loadArticleDetail(targetArticleId);
  }

  function updateHumanConfirmation(
    key: keyof KnowledgeReviewHumanConfirmations,
    checked: boolean,
  ) {
    setHumanConfirmationsDraft((current) => ({
      ...current,
      [key]: checked,
    }));
  }

  async function handleSaveReviewAdvisoryStatus() {
    if (!selectedArticleId) {
      return;
    }

    setReviewAdvisorySubmitting(true);
    setReviewAdvisoryMessage(null);

    try {
      await updateKnowledgeArticleReviewStatus({
        p_article_id: selectedArticleId,
        p_review_status: reviewStatusDraft,
        p_human_confirmations: humanConfirmationsDraft,
        p_review_notes: reviewNotesDraft,
      });

      await refreshSelectedSpace(selectedArticleId);
      setReviewAdvisoryMessage('Status editorial salvo com sucesso.');
    } catch (error) {
      const classified = classifyAdminError(
        error,
        'Falha ao persistir a revisão editorial.',
      );

      if (classified.kind === 'session-expired') {
        markSessionExpired();
        return;
      }

      if (classified.kind === 'permission-denied') {
        setBackendDenied(true);
        return;
      }

      setReviewAdvisoryMessage(classified.message);
    } finally {
      setReviewAdvisorySubmitting(false);
    }
  }

  async function handleMarkReviewAdvisoryReviewed() {
    if (!selectedArticleId) {
      return;
    }

    setReviewAdvisorySubmitting(true);
    setReviewAdvisoryMessage(null);

    try {
      await markKnowledgeArticleReviewed({
        p_article_id: selectedArticleId,
        p_human_confirmations: humanConfirmationsDraft,
        p_review_notes: reviewNotesDraft,
      });

      await refreshSelectedSpace(selectedArticleId);
      setReviewAdvisoryMessage('Revisão editorial marcada como concluída.');
    } catch (error) {
      const classified = classifyAdminError(
        error,
        'Falha ao concluir a revisão editorial.',
      );

      if (classified.kind === 'session-expired') {
        markSessionExpired();
        return;
      }

      if (classified.kind === 'permission-denied') {
        setBackendDenied(true);
        return;
      }

      setReviewAdvisoryMessage(classified.message);
    } finally {
      setReviewAdvisorySubmitting(false);
    }
  }

  async function handleCreateCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedSpace) {
      return;
    }

    setCategoryFormSubmitting(true);
    setCategoryFormMessage(null);

    try {
      await createKnowledgeCategoryV2({
        p_name: categoryForm.name.trim(),
        p_slug: slugify(categoryForm.slug || categoryForm.name),
        p_description: normalizeOptionalText(categoryForm.description),
        p_visibility: categoryForm.visibility,
        p_parent_category_id:
          normalizeOptionalText(categoryForm.parentCategoryId) ?? null,
        p_knowledge_space_id: selectedSpace.id,
        p_tenant_id: selectedSpace.owner_tenant_id ?? null,
      });

      await refreshSelectedSpace();
      setCategoryEditingId(null);
      setCategoryForm(emptyCategoryForm());
      setCategoryFormMessage(categoryEditingId ? 'Categoria atualizada com sucesso.' : 'Categoria criada com sucesso.');
    } catch (error) {
      const classified = classifyAdminError(
        error,
        'Falha ao criar a categoria da central de ajuda.',
      );

      if (classified.kind === 'session-expired') {
        markSessionExpired();
        return;
      }

      if (classified.kind === 'permission-denied') {
        setBackendDenied(true);
        return;
      }

      setCategoryFormMessage(classified.message);
    } finally {
      setCategoryFormSubmitting(false);
    }
  }

  async function handleSaveArticle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedSpace) {
      return;
    }

    setArticleFormSubmitting(true);
    setArticleFormMessage(null);

    try {
      let recordId: string;

      if (panelMode === 'edit-article' && articleDetail) {
        if (articleDetail.status === 'published') {
          const updated = await updateKnowledgeArticleEditorialRevisionV2({
            p_article_id: articleDetail.id,
            p_knowledge_space_id: selectedSpace.id,
            p_title: articleForm.title.trim(),
            p_slug: slugify(articleForm.slug || articleForm.title),
            p_summary: normalizeOptionalText(articleForm.summary),
            p_body_md: articleForm.bodyMd.trim(),
            p_category_id: normalizeOptionalText(articleForm.categoryId),
            p_visibility: articleForm.visibility,
            p_source_path: normalizeOptionalText(articleForm.sourcePath),
            p_source_hash: normalizeOptionalText(articleForm.sourceHash),
          });

          recordId = updated.article_id;
        } else {
          const updated = await updateKnowledgeArticleDraftV2({
            p_article_id: articleDetail.id,
            p_knowledge_space_id: selectedSpace.id,
            p_title: articleForm.title.trim(),
            p_slug: slugify(articleForm.slug || articleForm.title),
            p_summary: normalizeOptionalText(articleForm.summary),
            p_body_md: articleForm.bodyMd.trim(),
            p_category_id: normalizeOptionalText(articleForm.categoryId),
            p_visibility: articleForm.visibility,
            p_source_path: normalizeOptionalText(articleForm.sourcePath),
            p_source_hash: normalizeOptionalText(articleForm.sourceHash),
          });

          recordId = updated.id;
        }
      } else {
        const created = await createKnowledgeArticleDraftV2({
          p_title: articleForm.title.trim(),
          p_slug: slugify(articleForm.slug || articleForm.title),
          p_summary: normalizeOptionalText(articleForm.summary),
          p_body_md: articleForm.bodyMd.trim(),
          p_category_id: normalizeOptionalText(articleForm.categoryId),
          p_visibility: articleForm.visibility,
          p_knowledge_space_id: selectedSpace.id,
          p_tenant_id: selectedSpace.owner_tenant_id ?? null,
          p_source_path: normalizeOptionalText(articleForm.sourcePath),
          p_source_hash: normalizeOptionalText(articleForm.sourceHash),
        });

        recordId = created.id;
      }

      await refreshSelectedSpace(recordId);
      await refreshArticleDetail(recordId);
      setSelectedArticleId(recordId);
      setPanelMode('detail');
      setArticleForm(emptyArticleForm());
      setArticleActionFeedback({
        articleId: recordId,
        message:
          articleDetail?.status === 'published'
          ? 'Revisão editorial salva com sucesso.'
            : 'Rascunho sincronizado com sucesso.',
      });
    } catch (error) {
      const classified = classifyAdminError(
        error,
        'Falha ao sincronizar o rascunho da central de ajuda.',
      );

      if (classified.kind === 'session-expired') {
        markSessionExpired();
        return;
      }

      if (classified.kind === 'permission-denied') {
        setBackendDenied(true);
        return;
      }

      setArticleFormMessage(classified.message);
    } finally {
      setArticleFormSubmitting(false);
    }
  }

  async function handleSubmitForReview() {
    if (!selectedSpaceId || !selectedArticleId) {
      return;
    }

    setArticleActionSubmitting(true);
    setArticleActionFeedback(null);

    try {
      await submitKnowledgeArticleForReviewV2({
        p_article_id: selectedArticleId,
        p_knowledge_space_id: selectedSpaceId,
      });

      await refreshSelectedSpace(selectedArticleId);
      await refreshArticleDetail(selectedArticleId);
      setArticleActionFeedback({
        articleId: selectedArticleId,
      message: 'Artigo enviado para revisão com sucesso.',
      });
    } catch (error) {
      const classified = classifyAdminError(
        error,
        'Falha ao enviar o artigo para revisão.',
      );

      if (classified.kind === 'session-expired') {
        markSessionExpired();
        return;
      }

      if (classified.kind === 'permission-denied') {
        setBackendDenied(true);
        return;
      }

      setArticleActionFeedback({
        articleId: selectedArticleId,
        message: classified.message,
      });
    } finally {
      setArticleActionSubmitting(false);
    }
  }

  async function handlePublish() {
    if (!selectedSpaceId || !selectedArticleId) {
      return;
    }

    setArticleActionSubmitting(true);
    setArticleActionFeedback(null);

    try {
      await publishKnowledgeArticleV2({
        p_article_id: selectedArticleId,
        p_knowledge_space_id: selectedSpaceId,
      });

      await refreshSelectedSpace(selectedArticleId);
      await refreshArticleDetail(selectedArticleId);
      setArticleActionFeedback({
        articleId: selectedArticleId,
        message: 'Artigo publicado com sucesso.',
      });
    } catch (error) {
      const classified = classifyAdminError(
        error,
        'Falha ao publicar o artigo da central de ajuda.',
      );

      if (classified.kind === 'session-expired') {
        markSessionExpired();
        return;
      }

      if (classified.kind === 'permission-denied') {
        setBackendDenied(true);
        return;
      }

      setArticleActionFeedback({
        articleId: selectedArticleId,
        message: classified.message,
      });
    } finally {
      setArticleActionSubmitting(false);
    }
  }

  async function handleArchive() {
    if (!selectedSpaceId || !selectedArticleId) {
      return;
    }

    const shouldArchive = window.confirm(
      'Arquivar este artigo remove o item da operação editorial ativa. Confirma o arquivamento?',
    );

    if (!shouldArchive) {
      return;
    }

    setArticleActionSubmitting(true);
    setArticleActionFeedback(null);

    try {
      await archiveKnowledgeArticleV2({
        p_article_id: selectedArticleId,
        p_knowledge_space_id: selectedSpaceId,
      });

      await refreshSelectedSpace(selectedArticleId);
      await refreshArticleDetail(selectedArticleId);
      setArticleActionFeedback({
        articleId: selectedArticleId,
        message: 'Artigo arquivado com sucesso.',
      });
    } catch (error) {
      const classified = classifyAdminError(
        error,
        'Falha ao arquivar o artigo da Knowledge Base.',
      );

      if (classified.kind === 'session-expired') {
        markSessionExpired();
        return;
      }

      if (classified.kind === 'permission-denied') {
        setBackendDenied(true);
        return;
      }

      setArticleActionFeedback({
        articleId: selectedArticleId,
        message: classified.message,
      });
    } finally {
      setArticleActionSubmitting(false);
    }
  }

  async function handlePublishEditorialRevision() {
    if (!selectedSpaceId || !selectedArticleId) {
      return;
    }

    setArticleActionSubmitting(true);
    setArticleActionFeedback(null);

    try {
      await publishKnowledgeArticleEditorialRevisionV2({
        p_article_id: selectedArticleId,
        p_knowledge_space_id: selectedSpaceId,
      });

      await refreshSelectedSpace(selectedArticleId);
      await refreshArticleDetail(selectedArticleId);
      setArticleActionFeedback({
        articleId: selectedArticleId,
        message: 'Atualização publicada com sucesso.',
      });
    } catch (error) {
      const classified = classifyAdminError(
        error,
        'Falha ao publicar a atualizacao do artigo.',
      );

      if (classified.kind === 'session-expired') {
        markSessionExpired();
        return;
      }

      if (classified.kind === 'permission-denied') {
        setBackendDenied(true);
        return;
      }

      setArticleActionFeedback({
        articleId: selectedArticleId,
        message: classified.message,
      });
    } finally {
      setArticleActionSubmitting(false);
    }
  }

  async function handleDiscardEditorialRevision() {
    if (!selectedSpaceId || !selectedArticleId) {
      return;
    }

    setArticleActionSubmitting(true);
    setArticleActionFeedback(null);

    try {
      await discardKnowledgeArticleEditorialRevisionV2({
        p_article_id: selectedArticleId,
        p_knowledge_space_id: selectedSpaceId,
      });

      await refreshSelectedSpace(selectedArticleId);
      await refreshArticleDetail(selectedArticleId);
      setPanelMode('detail');
      setArticleForm(emptyArticleForm());
      setArticleActionFeedback({
        articleId: selectedArticleId,
      message: 'Revisão editorial descartada com sucesso.',
      });
    } catch (error) {
      const classified = classifyAdminError(
        error,
        'Falha ao descartar a revisão editorial do artigo.',
      );

      if (classified.kind === 'session-expired') {
        markSessionExpired();
        return;
      }

      if (classified.kind === 'permission-denied') {
        setBackendDenied(true);
        return;
      }

      setArticleActionFeedback({
        articleId: selectedArticleId,
        message: classified.message,
      });
    } finally {
      setArticleActionSubmitting(false);
    }
  }

  async function handleUpdateAssetReview(
    asset: AdminKnowledgeArticleAssetRow,
    mode: 'approve' | 'block',
  ) {
    if (!selectedArticleId) {
      return;
    }

    setAssetActionSubmitting(asset.id);
    setArticleActionFeedback(null);

    try {
      await updateKnowledgeArticleAssetReview({
        p_alt_text: asset.alt_text,
        p_asset_id: asset.id,
        p_caption: asset.caption,
        p_is_blocked: mode === 'block',
        p_review_status: mode === 'approve' ? 'approved' : 'blocked',
        p_visibility: mode === 'approve' ? 'public' : 'restricted',
      });

      await refreshArticleDetail(selectedArticleId);
      setArticleActionFeedback({
        articleId: selectedArticleId,
        message:
          mode === 'approve'
            ? 'Asset aprovado para uso governado.'
            : 'Asset bloqueado para uso público.',
      });
    } catch (error) {
      const classified = classifyAdminError(
        error,
        'Falha ao atualizar o anexo do artigo.',
      );

      if (classified.kind === 'session-expired') {
        markSessionExpired();
        return;
      }

      if (classified.kind === 'permission-denied') {
        setBackendDenied(true);
        return;
      }

      setArticleActionFeedback({
        articleId: selectedArticleId,
        message: classified.message,
      });
    } finally {
      setAssetActionSubmitting(null);
    }
  }

  const isArticleEditorMode =
    panelMode === 'create-article' || panelMode === 'edit-article';

  function renderArticleEditorSurface() {
    const isPublishedRevision =
      panelMode === 'edit-article' && articleDetail?.status === 'published';
    const editorTitle =
      panelMode === 'create-article'
        ? 'Novo artigo'
        : isPublishedRevision
          ? 'Revisão editorial'
          : 'Editar artigo';
    const editorDescription =
      panelMode === 'create-article'
        ? 'Crie um novo artigo com espaço suficiente para escrita, revisão e futura formatação editorial.'
        : isPublishedRevision
          ? 'A revisão acontece em uma superfície dedicada. A versão pública atual permanece estável até a nova publicação.'
          : 'Edite o conteúdo com uma área ampla de trabalho, sem comprimir a escrita no rail lateral.';
    const saveLabel =
      articleFormSubmitting
        ? 'Salvando...'
        : panelMode === 'edit-article'
          ? isPublishedRevision
            ? 'Salvar revisão'
            : 'Salvar artigo'
          : 'Criar artigo';

    return (
      <div className="space-y-3 xl:flex xl:h-full xl:min-h-0 xl:flex-col xl:overflow-hidden">
        <section className="rounded-[24px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)]/95 px-6 py-4 shadow-[var(--shadow-panel)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1.5">
              <h1 className="text-[1.9rem] font-semibold tracking-[-0.05em] text-[color:var(--color-ink)]">
                {editorTitle}
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-[color:var(--color-muted)]">
                {editorDescription}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <GhostButton
                className="min-h-11 px-5 text-[13px] font-semibold"
                disabled={articleFormSubmitting}
                onClick={closeArticleEditor}
              >
                Voltar para artigos
              </GhostButton>
              <AppButton
                className="min-h-11 px-5 text-[13px] font-semibold"
                disabled={articleFormSubmitting}
                form="knowledge-article-editor-form"
                type="submit"
              >
                {saveLabel}
              </AppButton>
            </div>
          </div>
        </section>

        {articleFormMessage ? (
          <InlineNotice tone="critical">{articleFormMessage}</InlineNotice>
        ) : null}

        {articleFormHasPublicCategoryMismatch ? (
          <InlineNotice tone="warning">
            Artigos públicos só aparecem na central quando a categoria selecionada também estiver pública. Ajuste a categoria ou a visibilidade antes de publicar.
          </InlineNotice>
        ) : null}

        <form
          className="grid gap-4 xl:min-h-0 xl:flex-1 xl:grid-cols-[minmax(0,1fr)_368px]"
          id="knowledge-article-editor-form"
          onSubmit={handleSaveArticle}
        >
          <section className="rounded-[22px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)]/95 px-6 py-5 shadow-[var(--shadow-panel)] xl:flex xl:min-h-0 xl:flex-col xl:overflow-hidden">
            <div className="space-y-5 xl:min-h-0 xl:flex-1 xl:overflow-y-auto xl:pr-1">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                <Field label="Título">
                  <TextInput
                    className="h-12 rounded-[18px] px-4 text-[1rem]"
                    onChange={(event) =>
                      setArticleForm((current) => ({
                        ...current,
                        title: event.target.value,
                        slug:
                          current.slug === '' ||
                          current.slug === slugify(current.title)
                            ? slugify(event.target.value)
                            : current.slug,
                      }))
                    }
                    placeholder="Como tratar devolução com reembolso parcial"
                    required
                    value={articleForm.title}
                  />
                </Field>

                <Field label="Slug">
                  <TextInput
                    className="h-12 rounded-[18px] px-4 text-[0.98rem]"
                    disabled={articleDetail?.status === 'published'}
                    onChange={(event) =>
                      setArticleForm((current) => ({
                        ...current,
                        slug: slugify(event.target.value),
                      }))
                    }
                    placeholder="como-tratar-devolucao-com-reembolso-parcial"
                    required
                    value={articleForm.slug}
                  />
                </Field>
              </div>

              {articleDetail?.status === 'published' ? (
                <p className="text-sm leading-6 text-[color:var(--color-muted)]">
                  O slug do artigo publicado permanece travado para preservar o mesmo link público.
                </p>
              ) : null}

              <Field label="Resumo">
                <TextareaInput
                  className="min-h-[136px] rounded-[22px] px-5 py-4 text-[0.98rem] leading-7"
                  onChange={(event) =>
                    setArticleForm((current) => ({
                      ...current,
                      summary: event.target.value,
                    }))
                  }
                  placeholder="Resumo curto para orientar a leitura do artigo."
                  value={articleForm.summary}
                />
              </Field>

              <Field label="Conteúdo principal">
                <TextareaInput
                  className="min-h-[560px] rounded-[24px] px-5 py-4 text-[1rem] leading-8"
                  onChange={(event) =>
                    setArticleForm((current) => ({
                      ...current,
                      bodyMd: event.target.value,
                    }))
                  }
                  placeholder="Escreva ou revise o corpo principal do artigo."
                  required
                  value={articleForm.bodyMd}
                />
              </Field>
            </div>
          </section>

          <aside className="space-y-4 xl:flex xl:min-h-0 xl:flex-col xl:overflow-hidden">
            <section className="rounded-[22px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)]/95 px-5 py-5 shadow-[var(--shadow-panel)] xl:min-h-0 xl:flex-1 xl:overflow-y-auto">
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-muted)]">
                    Configuração editorial
                  </p>
                  <p className="text-sm leading-6 text-[color:var(--color-muted)]">
                    Ajuste categoria, visibilidade e dados complementares sem disputar espaço com a escrita.
                  </p>
                </div>

                <Field label="Categoria">
                  <SelectInput
                    className="h-12 rounded-[18px] px-4"
                    onChange={(event) =>
                      setArticleForm((current) => ({
                        ...current,
                        categoryId: event.target.value,
                      }))
                    }
                    value={articleForm.categoryId}
                  >
                    <option value="">Sem categoria</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {categoryDisplayName(category)}
                      </option>
                    ))}
                  </SelectInput>
                </Field>

                <Field label="Visibilidade">
                  <SelectInput
                    className="h-12 rounded-[18px] px-4"
                    onChange={(event) =>
                      setArticleForm((current) => ({
                        ...current,
                        visibility: event.target.value as KnowledgeVisibility,
                      }))
                    }
                    value={articleForm.visibility}
                  >
                    {KNOWLEDGE_VISIBILITIES.map((visibility) => (
                      <option key={visibility} value={visibility}>
                        {visibility}
                      </option>
                    ))}
                  </SelectInput>
                </Field>

                <details className="rounded-[18px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-4">
                  <summary className="cursor-pointer text-sm font-semibold text-[color:var(--color-ink)]">
                    Informações avançadas
                  </summary>
                  <div className="mt-4 space-y-4">
                    <Field label="Caminho de origem">
                      <TextInput
                        onChange={(event) =>
                          setArticleForm((current) => ({
                            ...current,
                            sourcePath: event.target.value,
                          }))
                        }
                        placeholder="raw_knowledge/.../articles"
                        value={articleForm.sourcePath}
                      />
                    </Field>

                    <Field label="Hash de origem">
                      <TextInput
                        onChange={(event) =>
                          setArticleForm((current) => ({
                            ...current,
                            sourceHash: event.target.value,
                          }))
                        }
                        placeholder="sha256..."
                        value={articleForm.sourceHash}
                      />
                    </Field>
                  </div>
                </details>
              </div>
            </section>

            <section className="rounded-[22px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)]/95 px-5 py-5 shadow-[var(--shadow-panel)]">
              <div className="space-y-3">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-muted)]">
                  Ações
                </p>
                <AppButton
                  className="min-h-11 w-full justify-center"
                  disabled={articleFormSubmitting}
                  type="submit"
                >
                  {saveLabel}
                </AppButton>
                <GhostButton
                  className="min-h-11 w-full justify-center"
                  disabled={articleFormSubmitting}
                  onClick={closeArticleEditor}
                >
                  Cancelar
                </GhostButton>
              </div>
            </section>
          </aside>
        </form>
      </div>
    );
  }

  function renderCategoryManagerSurface() {
    return (
      <div className="gso-knowledge-category-manager gso-knowledge-manager-page flex min-h-0 flex-1 flex-col overflow-auto bg-[color:var(--minimal-surface)]">
        <section className="gso-knowledge-manager-header flex shrink-0 flex-wrap items-start justify-between gap-4 border-b border-[color:var(--minimal-border)] px-5 py-4">
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[color:var(--color-brand-blue)]">Organização da central</p>
            <h1 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-[color:var(--minimal-text)]">Gerenciar categorias</h1>
            <p className="mt-1 max-w-2xl text-sm text-[color:var(--minimal-text-secondary)]">Crie e organize as categorias usadas pelos artigos desta central.</p>
          </div>
          <GhostButton className="h-9 rounded-md px-3 text-xs" onClick={() => setPanelMode('detail')}>Voltar para artigos</GhostButton>
        </section>
        <div className="gso-knowledge-manager-content grid min-h-0 flex-1 gap-4 overflow-auto p-5">
          <form className="gso-knowledge-category-form grid gap-3 rounded-xl border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] p-4" onSubmit={handleCreateCategory}>
            <h2 className="text-sm font-semibold text-[color:var(--minimal-text)]">{categoryEditingId ? 'Editar categoria' : 'Nova categoria'}</h2>
            <div className="mt-3 grid gap-3">
              <Field label="Nome">
                <TextInput required value={categoryForm.name} onChange={(event) => setCategoryForm((current) => ({ ...current, name: event.target.value }))} />
              </Field>
              <Field label="Slug">
                <TextInput disabled={Boolean(categoryEditingId)} value={categoryForm.slug} onChange={(event) => setCategoryForm((current) => ({ ...current, slug: slugify(event.target.value) }))} placeholder="geral" />
              </Field>
              <Field label="Categoria pai">
                <SelectInput disabled={Boolean(categoryEditingId)} value={categoryForm.parentCategoryId} onChange={(event) => setCategoryForm((current) => ({ ...current, parentCategoryId: event.target.value }))}>
                  <option value="">Sem categoria pai</option>
                  {sortedCategories.filter((category) => category.id !== categoryEditingId).map((category) => <option key={category.id} value={category.id}>{categoryDisplayName(category)}</option>)}
                </SelectInput>
              </Field>
              {categoryEditingId ? <p className="-mt-1 text-xs leading-5 text-[color:var(--minimal-text-tertiary)]">A categoria pai permanece fixa durante a edição para manter o vínculo dos artigos.</p> : null}
              <Field label="Visibilidade">
                <SelectInput value={categoryForm.visibility} onChange={(event) => setCategoryForm((current) => ({ ...current, visibility: event.target.value as KnowledgeVisibility }))}>
                  {KNOWLEDGE_VISIBILITIES.map((visibility) => <option key={visibility} value={visibility}>{visibility}</option>)}
                </SelectInput>
              </Field>
              <Field label="Descrição">
                <TextareaInput value={categoryForm.description} onChange={(event) => setCategoryForm((current) => ({ ...current, description: event.target.value }))} />
              </Field>
              {categoryFormMessage ? (
                <InlineNotice tone={categoryFormMessage.includes('sucesso') ? 'positive' : 'critical'}>
                  {categoryFormMessage}
                </InlineNotice>
              ) : null}
              <div className="flex flex-wrap items-center gap-2">
                <AppButton disabled={categoryFormSubmitting || !selectedSpace} type="submit">{categoryFormSubmitting ? 'Salvando...' : categoryEditingId ? 'Salvar alterações' : 'Criar categoria'}</AppButton>
                {categoryEditingId ? <GhostButton onClick={openCreateCategory} type="button">Cancelar edição</GhostButton> : null}
              </div>
            </div>
          </form>
          <section className="gso-knowledge-category-list rounded-xl border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] p-4">
            <div className="flex items-center justify-between gap-3">
              <div><h2 className="text-sm font-semibold text-[color:var(--minimal-text)]">Categorias cadastradas</h2><p className="mt-1 text-xs text-[color:var(--minimal-text-secondary)]">{sortedCategories.length} categoria(s) nesta central.</p></div>
              <GhostButton className="h-8 rounded-md px-2.5 text-xs" onClick={() => setPanelMode('detail')}>Concluir</GhostButton>
            </div>
            <ul className="mt-3 divide-y divide-[color:var(--minimal-border)]">
              {sortedCategories.map((category) => <li className="flex items-center justify-between gap-3 py-2.5" key={category.id}><div className="min-w-0"><strong className="block truncate text-sm text-[color:var(--minimal-text)]">{categoryDisplayName(category)}</strong><span className="text-xs text-[color:var(--minimal-text-secondary)]">{category.article_count} artigo(s) · {category.visibility}</span></div><div className="flex shrink-0 items-center gap-2"><span className="hidden text-xs text-[color:var(--minimal-text-tertiary)] sm:inline">{category.slug}</span><GhostButton className="h-8 rounded-md px-2.5 text-xs" onClick={() => openEditCategory(category)} type="button">Editar</GhostButton></div></li>)}
            </ul>
          </section>
        </div>
      </div>
    );
  }

  if (backendDenied) {
    return <Navigate replace state={{ reason: 'missing-authorized-workspace' }} to="/access-denied" />;
  }

  if (pagePhase === 'loading') {
    return <LoadingState title="Carregando Knowledge Base" />;
  }

  if (pagePhase === 'contract-unavailable') {
    return <ContractUnavailableState contractName="lista de centrais editoriais" />;
  }

  if (pagePhase === 'error') {
    return (
        <ErrorState
          description={
            pageMessage ??
            'Não foi possível carregar as centrais editoriais neste ambiente.'
          }
        action={<AppButton onClick={() => void loadKnowledgeSpaces()}>Tentar novamente</AppButton>}
      />
    );
  }

  if (spaces.length === 0) {
    return (
      <div className="space-y-5">
        <section className="rounded-[28px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)]/94 px-6 py-6 shadow-[var(--shadow-panel)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-[2rem] font-semibold tracking-[-0.05em] text-[color:var(--color-ink)]">
                Conhecimento
              </h1>
              <p className="text-sm leading-6 text-[color:var(--color-muted)]">
                Gerencie artigos, categorias e publicação na central de ajuda.
              </p>
            </div>
            <AppButton disabled>Novo artigo</AppButton>
          </div>
        </section>
        <EmptyState
          title="Nenhuma central editorial disponível"
          description="Ainda não existe uma central pronta para curadoria neste ambiente."
        />
      </div>
    );
  }

  if (isArticleEditorMode) {
    return renderArticleEditorSurface();
  }

  if (panelMode === 'create-category') {
    return renderCategoryManagerSurface();
  }

  return (
    <div className="gso-knowledge-cockpit flex h-full min-h-0 flex-col overflow-hidden bg-[color:var(--minimal-surface)]">
      <section className="gso-knowledge-cockpit-header shrink-0 border-b border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-lg font-semibold tracking-[-0.02em] text-[color:var(--minimal-text)]">
              Conhecimento
            </h1>
            <p className="text-sm text-[color:var(--minimal-text-secondary)]">
              Artigos, revisão e publicação.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <AppButton
              className="min-h-9 gap-2 rounded-md px-4 text-sm"
              disabled={!selectedSpace}
              onClick={openCreateArticle}
            >
              <span aria-hidden="true">+</span>
              Novo artigo
            </AppButton>
          </div>
        </div>
      </section>

      <div className="min-h-0 flex-1 overflow-hidden">
        <div className="gso-knowledge-cockpit-grid grid h-full min-h-0 min-w-0 xl:grid-cols-[minmax(0,1fr)_290px]">
          <main className="gso-knowledge-articles-pane flex min-h-0 min-w-0 flex-col overflow-hidden">
            <section className="gso-knowledge-filter-deck grid shrink-0 gap-3 border-b border-[color:var(--minimal-border)] bg-[color:var(--minimal-sidebar)] px-4 py-3 md:grid-cols-3 xl:grid-cols-[minmax(0,1fr)_168px_168px_168px]">
              <div className="md:col-span-3 xl:col-span-1">
                <Field label="Busca global de conhecimento">
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--color-brand-blue)]">
                      ⌕
                    </span>
                    <TextInput
                      className="h-10 w-full rounded-md border-[color:var(--minimal-border-strong)] bg-[color:var(--minimal-surface)] pl-10 pr-4 text-sm"
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Buscar por artigo, dúvida, processo, categoria ou palavra-chave..."
                      value={searchQuery}
                    />
                  </div>
                </Field>
              </div>

              <Field label="Status de governança">
                <SelectInput
                  className="h-10 rounded-[14px] px-3.5 text-[0.86rem]"
                  onChange={(event) =>
                    setListStatusFilter(event.target.value as ArticleStatusFilter)
                  }
                  value={listStatusFilter}
                >
                  <option value="all">Todos</option>
                  <option value="published">Publicado</option>
                  <option value="review">Em revisão</option>
                  <option value="draft">Rascunho</option>
                  <option value="archived">Arquivado</option>
                </SelectInput>
              </Field>

              <Field label="Categoria">
                <SelectInput
                  className="h-10 rounded-[14px] px-3.5 text-[0.86rem]"
                  onChange={(event) => setSelectedCategoryId(event.target.value)}
                  value={selectedCategoryId}
                >
                  <option value="all">Todas</option>
                  {sortedCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {categoryDisplayName(category)}
                    </option>
                  ))}
                </SelectInput>
              </Field>

              <Field label="Visibilidade">
                <SelectInput
                  className="h-10 rounded-[14px] px-3.5 text-[0.86rem]"
                  onChange={(event) =>
                    setVisibilityFilter(event.target.value as ArticleVisibilityFilter)
                  }
                  value={visibilityFilter}
                >
                  <option value="all">Todas</option>
                  <option value="public">Público</option>
                  <option value="internal">Interno</option>
                  <option value="restricted">Restrito</option>
                </SelectInput>
              </Field>
            </section>

            <section className="hidden">
              <article className="rounded-[18px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)]/96 px-5 py-3.5 shadow-[0_18px_44px_rgba(19,33,79,0.06)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[0.76rem] font-semibold text-[color:var(--color-ink)]">
                      Publicados
                    </p>
                    <p className="mt-2 text-[1.85rem] font-semibold leading-none tracking-[-0.05em] text-[color:var(--color-ink)]">
                      {publishedArticlesCount}
                    </p>
                    <p className="mt-2 text-[0.8rem] text-[color:var(--color-muted)]">
                      {publicCoverageLabel}
                    </p>
                  </div>
                  <span className="grid h-10 w-10 place-items-center rounded-[14px] bg-[rgba(47,107,255,0.1)] text-[1.25rem] text-[color:var(--color-brand-blue)]">
                    ▥
                  </span>
                </div>
                <div className="mt-3 h-1 rounded-full bg-[rgba(47,107,255,0.16)]">
                  <div
                    className="h-full rounded-full bg-[color:var(--color-brand-blue)]"
                    style={{
                      width: `${articles.length > 0 ? Math.min(100, (publishedArticlesCount / articles.length) * 100) : 0}%`,
                    }}
                  />
                </div>
              </article>

              <article className="rounded-[18px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)]/96 px-5 py-3.5 shadow-[0_18px_44px_rgba(19,33,79,0.06)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[0.76rem] font-semibold text-[color:var(--color-ink)]">
                      Precisam atualização
                    </p>
                    <p className="mt-2 text-[1.85rem] font-semibold leading-none tracking-[-0.05em] text-[color:var(--color-ink)]">
                      {needsUpdateCount}
                    </p>
                    <p className="mt-2 text-[0.8rem] text-[color:var(--color-muted)]">
                      {needsUpdateCoverageLabel}
                    </p>
                  </div>
                  <span className="grid h-10 w-10 place-items-center rounded-[14px] bg-[rgba(255,122,32,0.12)] text-[1.25rem] text-[color:var(--color-warning-ink)]">
                    △
                  </span>
                </div>
                <div className="mt-3 h-1 rounded-full bg-[rgba(255,122,32,0.14)]">
                  <div
                    className="h-full rounded-full bg-[color:var(--color-warning-ink)]"
                    style={{
                      width: `${articles.length > 0 ? Math.min(100, (needsUpdateCount / articles.length) * 100) : 0}%`,
                    }}
                  />
                </div>
              </article>

              <article className="rounded-[18px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)]/96 px-5 py-3.5 shadow-[0_18px_44px_rgba(19,33,79,0.06)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[0.76rem] font-semibold text-[color:var(--color-ink)]">
                      Arquivamento sugerido
                    </p>
                    <p className="mt-2 text-[1.85rem] font-semibold leading-none tracking-[-0.05em] text-[color:var(--color-ink)]">
                      {archiveSuggestedCount}
                    </p>
                    <p className="mt-2 text-[0.8rem] text-[color:var(--color-muted)]">
                      {archiveCoverageLabel}
                    </p>
                  </div>
                  <span className="grid h-10 w-10 place-items-center rounded-[14px] bg-[rgba(129,83,255,0.12)] text-[1.25rem] text-[color:var(--color-brand-blue)]">
                    ▣
                  </span>
                </div>
                <div className="mt-3 h-1 rounded-full bg-[rgba(129,83,255,0.14)]">
                  <div
                    className="h-full rounded-full bg-[color:var(--color-brand-blue)]"
                    style={{
                      width: `${articles.length > 0 ? Math.min(100, (archiveSuggestedCount / articles.length) * 100) : 0}%`,
                    }}
                  />
                </div>
              </article>

              <article className="rounded-[18px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)]/96 px-5 py-3.5 shadow-[0_18px_44px_rgba(19,33,79,0.06)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[0.76rem] font-semibold text-[color:var(--color-ink)]">
                      Visualizações (30 dias)
                    </p>
                    <p className="mt-2 text-[1.35rem] font-semibold leading-none tracking-[-0.04em] text-[color:var(--color-ink)]">
                      Indisponível
                    </p>
                    <p className="mt-2 text-[0.8rem] text-[color:var(--color-muted)]">
                      Métrica indisponível
                    </p>
                  </div>
                  <span className="grid h-10 w-10 place-items-center rounded-[14px] bg-[rgba(16,185,129,0.12)] text-[1.15rem] text-[color:var(--color-success-ink)]">
                    ↗
                  </span>
                </div>
                <div className="mt-3 h-1 rounded-full bg-[rgba(16,185,129,0.12)]" />
              </article>
            </section>

            <section className="gso-knowledge-table-panel min-h-0 flex-1 overflow-hidden bg-[color:var(--minimal-surface)]">
              <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[color:var(--color-border)] px-4 py-3">
                <div>
                  <h2 className="text-[1.05rem] font-semibold tracking-[-0.04em] text-[color:var(--color-ink)]">
                    Artigos ({displayArticles.length})
                  </h2>
                  <p className="mt-0.5 text-[0.74rem] text-[color:var(--color-muted)]">
                    Tabela operacional para triagem, busca, edição e revisão governada.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <SelectInput
                    className="h-9 min-w-[150px] rounded-[14px] px-3.5 text-[0.82rem]"
                    onChange={(event) => setListSort(event.target.value as KnowledgeListSort)}
                    value={listSort}
                  >
                    <option value="recent">Mais recentes</option>
                    <option value="oldest">Mais antigos</option>
                    <option value="title">Título A-Z</option>
                  </SelectInput>
                </div>
              </header>

              {contentPhase === 'idle' ? (
                <div className="px-5 py-8">
                  <EmptyState
                    title="Selecione uma central"
                    description="Escolha a central para abrir a lista de artigos."
                  />
                </div>
              ) : contentPhase === 'loading' ? (
                <div className="px-5 py-8">
                  <LoadingState
                    title="Carregando artigos"
                    description="Estamos preparando a lista operacional desta central."
                  />
                </div>
              ) : contentPhase === 'contract-unavailable' ? (
                <div className="px-5 py-8">
                  <ContractUnavailableState contractName="lista editorial de artigos e categorias" />
                </div>
              ) : contentPhase === 'error' ? (
                <div className="px-5 py-8">
                  <ErrorState
                    description={
                      contentMessage ?? 'Não foi possível carregar os artigos desta central.'
                    }
                    action={
                      <AppButton onClick={() => selectedSpaceId && void refreshSelectedSpace()}>
                        Tentar novamente
                      </AppButton>
                    }
                  />
                </div>
              ) : displayArticles.length === 0 ? (
                <div className="px-5 py-8">
                  <EmptyState
                    title="Nenhum artigo encontrado"
                    description="Ajuste a busca global ou os filtros operacionais."
                    action={<AppButton onClick={openCreateArticle}>Criar artigo</AppButton>}
                  />
                </div>
              ) : (
                <div className="flex min-h-0 flex-1 flex-col">
                  <div className="gso-knowledge-table-scroll min-h-0 flex-1 overflow-auto">
                    <table className="gso-knowledge-article-table w-full table-fixed border-separate border-spacing-0">
                      <colgroup>
                        <col />
                        <col className="hidden w-[19%] md:table-column" />
                        <col className="hidden w-[19%] lg:table-column" />
                        <col className="hidden w-[12%] xl:table-column" />
                        <col className="hidden w-[8%] xl:table-column" />
                        <col className="w-[7rem]" />
                      </colgroup>
                      <thead className="sticky top-0 z-10 bg-[color:var(--color-surface)]">
                        <tr className="text-left text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
                          <th className="border-b border-[color:var(--color-border)] px-4 py-2.5">Título</th>
                          <th className="hidden border-b border-[color:var(--color-border)] px-3 py-2.5 md:table-cell">Categoria</th>
                          <th className="hidden border-b border-[color:var(--color-border)] px-3 py-2.5 lg:table-cell">Status de governança</th>
                          <th className="hidden border-b border-[color:var(--color-border)] px-3 py-2.5 xl:table-cell">Visibilidade</th>
                          <th className="hidden border-b border-[color:var(--color-border)] px-3 py-2.5 xl:table-cell">Consumo</th>
                          <th className="border-b border-[color:var(--color-border)] px-4 py-2.5 text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedArticles.map((article) => {
                          const articleAdvisory = advisoryMap.get(article.id);
                          const duplicateCount =
                            articleAdvisory?.duplicate_group_article_count ??
                            (article.source_hash
                              ? sourceHashCounts.get(article.source_hash) ?? 0
                              : 0);

                          return (
                            <tr
                              className="group border-b border-[color:var(--color-border)] transition hover:bg-[rgba(234,242,255,0.52)]"
                              key={article.id}
                            >
                              <td className="border-b border-[color:var(--color-border)] px-4 py-2.5 align-top">
                                <div className="flex min-w-0 items-start gap-2.5">
                                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-[7px] bg-[rgba(47,107,255,0.09)] text-[0.78rem] text-[color:var(--color-brand-blue)]">
                                    ⎘
                                  </span>
                                  <div className="min-w-0">
                                    <p className="line-clamp-1 text-[0.86rem] font-semibold leading-4 text-[color:var(--color-ink)]">
                                      {article.title || 'Indisponível'}
                                    </p>
                                    <p className="mt-0.5 line-clamp-1 text-[0.72rem] leading-4 text-[color:var(--color-muted)]">
                                      {article.summary?.trim() || 'Resumo indisponível'}
                                    </p>
                                    <p className="mt-1 truncate text-[0.68rem] text-[color:var(--minimal-text-tertiary)] md:hidden">
                                      {compactStatusBadgeLabel(article.status)} · {shortVisibilityLabel(article.visibility)}
                                    </p>
                                    {duplicateCount > 1 ? (
                                      <p className="mt-0.5 text-[0.68rem] font-medium text-[color:var(--color-warning-ink)]">
                                        Possível duplicidade
                                      </p>
                                    ) : null}
                                  </div>
                                </div>
                              </td>
                              <td className="hidden border-b border-[color:var(--color-border)] px-3 py-2.5 align-top md:table-cell">
                                <span
                                  className={cx(
                                    'inline-flex max-w-[190px] items-center rounded-[9px] border px-2.5 py-0.5 text-[0.7rem] font-semibold',
                                    categoryBadgeClass(article.category_name),
                                  )}
                                >
                                  <span className="truncate">
                                    {compactCategoryLabel(article.category_name)}
                                  </span>
                                </span>
                              </td>
                              <td className="hidden border-b border-[color:var(--color-border)] px-3 py-2.5 align-top lg:table-cell">
                                <div className="space-y-0.5">
                                  <span
                                    className={cx(
                                      'inline-flex items-center rounded-[9px] border px-2.5 py-0.5 text-[0.7rem] font-semibold',
                                      compactStatusBadgeClass(toneForArticleStatus(article.status)),
                                    )}
                                  >
                                    {compactStatusBadgeLabel(article.status)}
                                  </span>
                                  {articleAdvisory ? (
                                    <p className="text-[0.68rem] leading-4 text-[color:var(--color-muted)]">
                                      {displayReviewStatus(articleAdvisory.review_status)}
                                    </p>
                                  ) : (
                                    <p className="text-[0.68rem] leading-4 text-[color:var(--color-muted)]">
                                      Sem análise
                                    </p>
                                  )}
                                </div>
                              </td>
                              <td className="hidden border-b border-[color:var(--color-border)] px-3 py-2.5 align-top xl:table-cell">
                                <StatusPill tone={toneForVisibility(article.visibility)}>
                                  {shortVisibilityLabel(article.visibility)}
                                </StatusPill>
                              </td>
                              <td className="hidden border-b border-[color:var(--color-border)] px-3 py-2.5 align-top xl:table-cell">
                                <span className="text-[0.72rem] text-[color:var(--color-muted)]">
                                  Sem métrica
                                </span>
                              </td>
                              <td className="border-b border-[color:var(--color-border)] px-4 py-2.5 text-right align-top">
                                <GhostButton
                                  className="h-8 rounded-md px-2.5 text-xs font-medium"
                                  disabled={articleActionSubmitting}
                                  onClick={() => void openArticleEditorFromCockpit(article.id)}
                                  aria-label={`Editar artigo ${article.title || 'sem título'}`}
                                >
                                  Editar
                                </GhostButton>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-[color:var(--color-border)] px-4 py-2.5 text-[0.8rem] text-[color:var(--color-muted)]">
                    <div>
                      Mostrando {displayArticles.length === 0 ? 0 : pageStartIndex + 1}-{pageEndIndex} de {displayArticles.length} artigos
                    </div>
                    <div className="flex items-center gap-2">
                      <GhostButton
                        className="h-9 rounded-[12px] px-3"
                        disabled={safeCurrentPage <= 1}
                        onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                      >
                        ‹
                      </GhostButton>
                      <span className="rounded-[12px] bg-[rgba(47,107,255,0.1)] px-3 py-2 font-semibold text-[color:var(--color-brand-blue)]">
                        {safeCurrentPage}
                      </span>
                      <span>de {totalPages}</span>
                      <GhostButton
                        className="h-9 rounded-[12px] px-3"
                        disabled={safeCurrentPage >= totalPages}
                        onClick={() =>
                          setCurrentPage((page) => Math.min(totalPages, page + 1))
                        }
                      >
                        ›
                      </GhostButton>
                    </div>
                  </footer>
                </div>
              )}
            </section>
          </main>

          <aside className="gso-knowledge-category-rail hidden min-h-0 min-w-0 flex-col overflow-y-auto overflow-x-hidden border-l border-[color:var(--minimal-border)] bg-[color:var(--minimal-sidebar)] xl:flex">
            <section className="border-b border-[color:var(--minimal-border)] px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[0.9rem] font-semibold text-[color:var(--color-ink)]">
                  Categorias
                </h2>
                <button
                  aria-expanded={showAllCategories}
                  aria-controls="knowledge-category-rail-list"
                  className="text-[0.75rem] font-semibold text-[color:var(--color-brand-blue)]"
                  onClick={() => setShowAllCategories((current) => !current)}
                  type="button"
                >
                  {showAllCategories ? 'Ver menos' : 'Ver todas'}
                </button>
              </div>
              <div className="mt-4 space-y-2" id="knowledge-category-rail-list">
                {(showAllCategories ? sortedCategories : categoryRailItems).map((category, index) => (
                  <button
                    className={cx(
                      'flex w-full items-center justify-between gap-3 rounded-md px-2.5 py-2 text-left transition',
                      selectedCategoryId === category.id
                        ? 'bg-[color:var(--minimal-selection)] text-[color:var(--minimal-text)]'
                        : 'hover:bg-[color:var(--minimal-surface-muted)]',
                    )}
                    key={category.id}
                    onClick={() => setSelectedCategoryId(category.id)}
                    type="button"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-[6px] bg-[rgba(47,107,255,0.1)] text-[0.68rem] font-semibold">
                        {index + 1}
                      </span>
                      <span
                        className="gso-knowledge-category-label truncate text-[0.8rem] font-medium"
                        title={displayFilterCategoryLabel(category.name)}
                      >
                        {displayFilterCategoryLabel(category.name)}
                      </span>
                    </span>
                    <span className="text-[0.78rem] font-semibold text-[color:var(--color-ink)]">
                      {category.article_count}
                    </span>
                  </button>
                ))}
              </div>
              {showAllCategories ? (
                <p className="mt-3 text-[0.72rem] leading-5 text-[color:var(--minimal-text-tertiary)]">
                  Todas as categorias desta central estão visíveis.
                </p>
              ) : null}
              <GhostButton
                className="mt-4 h-10 w-full justify-center rounded-[12px] text-[0.8rem] font-semibold"
                onClick={openCreateCategory}
              >
                Gerenciar categorias
              </GhostButton>
            </section>

            <section className="hidden">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[0.9rem] font-semibold text-[color:var(--color-ink)]">
                  Conteúdos com maior consumo
                </h2>
              </div>
              <div className="mt-4 rounded-[14px] border border-dashed border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-4">
                <p className="text-[0.82rem] font-semibold text-[color:var(--color-ink)]">
                  Métrica ainda indisponível
                </p>
                <p className="mt-1 text-[0.76rem] leading-5 text-[color:var(--color-muted)]">
                  A medição de visualizações por artigo ainda não está disponível nesta área.
                </p>
              </div>
            </section>

            <section className="hidden">
              <h2 className="text-[0.9rem] font-semibold text-[color:var(--color-ink)]">
                Resumo operacional
              </h2>
              <div className="mt-3 divide-y divide-[color:var(--color-border)]">
                {operationsSummaryItems.map((item) => (
                  <div className="flex items-center justify-between gap-3 py-3" key={item.label}>
                    <div className="flex min-w-0 items-center gap-2">
                      <StatusPill tone={item.tone}>{item.label}</StatusPill>
                    </div>
                    <span className="text-[0.9rem] font-semibold text-[color:var(--color-ink)]">
                      {item.value}
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between gap-3 py-3">
                  <StatusPill tone="positive">Públicos</StatusPill>
                  <span className="text-[0.9rem] font-semibold text-[color:var(--color-ink)]">
                    {publicArticlesCount}
                  </span>
                </div>
              </div>
            </section>

            <section className="min-h-0 flex-1 overflow-hidden px-4 py-4">
              <h2 className="text-[0.9rem] font-semibold text-[color:var(--color-ink)]">
                Alertas editoriais
              </h2>
              <div className="mt-3 max-h-full space-y-3 overflow-y-auto pr-1">
                {editorialAlertItems.length > 0 ? (
                  editorialAlertItems.map((item) => (
                    <div
                      className="rounded-[14px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-3"
                      key={item.label}
                    >
                      <StatusPill tone={item.tone}>{item.label}</StatusPill>
                      <p className="mt-2 text-[0.76rem] leading-5 text-[color:var(--color-muted)]">
                        {item.description}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[14px] border border-dashed border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-4">
                    <p className="text-[0.82rem] font-semibold text-[color:var(--color-ink)]">
                      Sem alertas ativos
                    </p>
                    <p className="mt-1 text-[0.76rem] leading-5 text-[color:var(--color-muted)]">
                      O backlog não trouxe sinal editorial crítico para os filtros atuais.
                    </p>
                  </div>
                )}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );

}
