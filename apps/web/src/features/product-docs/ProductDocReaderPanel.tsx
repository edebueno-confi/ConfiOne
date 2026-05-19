import { Link } from 'react-router-dom';
import { EmptyState } from '../../components/states';
import { InlineNotice, StatusPill, cx } from '../../components/ui';
import { formatDateTime } from '../../app/format';
import type {
  AdminInternalDocumentDetailRow,
  InternalDocumentSensitivity,
  InternalDocumentStatus,
  InternalDocumentValidationStatus,
} from '../../contracts/admin-contracts';
import { ProductDocMarkdownPreview } from './ProductDocMarkdownPreview';

function statusTone(status: InternalDocumentStatus) {
  if (status === 'published') {
    return 'positive' as const;
  }

  if (status === 'draft') {
    return 'warning' as const;
  }

  return 'default' as const;
}

function sensitivityTone(sensitivity: InternalDocumentSensitivity) {
  if (sensitivity === 'restricted') {
    return 'warning' as const;
  }

  if (sensitivity === 'public_internal') {
    return 'accent' as const;
  }

  return 'default' as const;
}

function formatStatusLabel(status: InternalDocumentStatus) {
  if (status === 'published') {
    return 'Publicado';
  }

  if (status === 'draft') {
    return 'Rascunho';
  }

  if (status === 'archived') {
    return 'Arquivado';
  }

  if (status === 'blocked') {
    return 'Bloqueado';
  }

  return status;
}

function formatSensitivityLabel(sensitivity: InternalDocumentSensitivity) {
  if (sensitivity === 'internal') {
    return 'Interna';
  }

  if (sensitivity === 'restricted') {
    return 'Restrita';
  }

  if (sensitivity === 'public_internal') {
    return 'Pública interna';
  }

  return sensitivity;
}

function formatValidationLabel(status: InternalDocumentValidationStatus) {
  if (status === 'valid') {
    return 'Sanitização ok';
  }

  if (status === 'warning') {
    return 'Sanitização com alerta';
  }

  return 'Bloqueado';
}

function basename(path: string) {
  const segments = path.split(/[\\/]/);
  return segments[segments.length - 1] ?? path;
}

function getDocumentDescription(document: AdminInternalDocumentDetailRow) {
  return document.description ?? 'Documento interno oficial controlado.';
}

function getValidationWarnings(document: AdminInternalDocumentDetailRow) {
  if (!Array.isArray(document.validation_warnings)) {
    return 0;
  }

  return document.validation_warnings.length;
}

export function ProductDocReaderPanel({
  className,
  document,
  officialLinkLabel = 'Abrir no Documentos do Produto',
  showOfficialLink = false,
}: {
  className?: string;
  document?: AdminInternalDocumentDetailRow | null;
  officialLinkLabel?: string;
  showOfficialLink?: boolean;
}) {
  if (!document) {
    return (
      <div
        className={cx(
          'rounded-[28px] border border-[color:var(--color-border)] bg-white/94 px-5 py-5 shadow-[0_18px_38px_rgba(16,30,74,0.08)]',
          className,
        )}
      >
        <EmptyState
          title="Documento indisponível"
          description="Documento indisponível ou sem permissão."
        />
      </div>
    );
  }

  const sourcePath = document.source_path;
  const sourceLabel = basename(sourcePath);
  const validationWarningsCount = getValidationWarnings(document);

  return (
    <article
      className={cx(
        'rounded-[28px] border border-[color:var(--color-border)] bg-white/94 px-5 py-5 shadow-[0_18px_38px_rgba(16,30,74,0.08)]',
        className,
      )}
    >
      <header className="border-b border-[color:var(--color-border)] pb-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 max-w-4xl space-y-2">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-muted)]">
              {document.category}
            </p>
            <h2 className="text-2xl font-semibold tracking-[-0.045em] text-[color:var(--color-ink)]">
              {document.title}
            </h2>
            <p className="max-w-3xl text-sm leading-6 text-[color:var(--color-muted)]">
              {getDocumentDescription(document)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusPill tone={statusTone(document.status)}>
              {formatStatusLabel(document.status)}
            </StatusPill>
            <StatusPill tone={sensitivityTone(document.sensitivity)}>
              {formatSensitivityLabel(document.sensitivity)}
            </StatusPill>
            <StatusPill
              tone={
                document.current_validation_status === 'warning'
                  ? 'accent'
                  : document.current_validation_status === 'valid'
                    ? 'positive'
                    : 'warning'
              }
            >
              {formatValidationLabel(document.current_validation_status)}
            </StatusPill>
          </div>
        </div>

        <dl className="mt-4 grid gap-3 text-sm md:grid-cols-4">
          <div className="min-w-0 rounded-[18px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-3">
            <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
              Origem versionada
            </dt>
            <dd className="mt-1 truncate font-medium text-[color:var(--color-ink)]" title={sourcePath}>
              {sourceLabel}
            </dd>
          </div>
          <div className="min-w-0 rounded-[18px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-3">
            <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
              Acesso
            </dt>
            <dd className="mt-1 font-medium text-[color:var(--color-ink)]">Admin Console</dd>
          </div>
          <div className="min-w-0 rounded-[18px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-3">
            <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
              Fonte
            </dt>
            <dd className="mt-1 font-medium text-[color:var(--color-ink)]">Contrato backend</dd>
          </div>
          <div className="min-w-0 rounded-[18px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-3">
            <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
              Atualização
            </dt>
            <dd className="mt-1 font-medium text-[color:var(--color-ink)]">
              {formatDateTime(document.published_at ?? document.updated_at)}
            </dd>
          </div>
        </dl>

        <div className="mt-4 space-y-3">
          <InlineNotice>
            Leitura interna controlada por contrato real. O frontend apenas renderiza o
            markdown sanitizado retornado pelo backend e não lê arquivos arbitrários do
            repositório.
          </InlineNotice>
          {document.sensitivity === 'restricted' ? (
            <InlineNotice tone="warning">
              Documento marcado como leitura restrita. A versão exibida é sanitizada e pode
              omitir detalhes internos sensíveis.
            </InlineNotice>
          ) : null}
          {validationWarningsCount > 0 ? (
            <InlineNotice tone="warning">
              Este documento foi publicado com {validationWarningsCount}{' '}
              {validationWarningsCount === 1
                ? 'alerta de validação revisado'
                : 'alertas de validação revisados'}
              .
            </InlineNotice>
          ) : null}
        </div>

        {showOfficialLink ? (
          <div className="mt-4">
            <Link
              className="inline-flex min-h-10 items-center justify-center rounded-[10px] border border-[#CFE0FF] bg-white px-4 text-sm font-black text-[#1458E8] transition hover:border-[#1458E8]/40 hover:bg-[#F5F8FF]"
              to={`/admin/product-docs?doc=${document.slug}`}
            >
              {officialLinkLabel}
              <span aria-hidden="true" className="ml-2">
                →
              </span>
            </Link>
          </div>
        ) : null}
      </header>

      <div className="mt-6">
        <ProductDocMarkdownPreview source={document.body_md_sanitized} />
      </div>
    </article>
  );
}
