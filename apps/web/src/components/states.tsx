import type { ReactNode } from 'react';
import { GeniusMascot, type GeniusMascotSurface } from './GeniusMascot';

interface StateFrameProps {
  title: string;
  description: string;
  eyebrow?: string;
  actions?: ReactNode;
  tone?: 'default' | 'critical' | 'positive';
  compact?: boolean;
  mascotSurface?: GeniusMascotSurface;
}

function toneClasses(tone: StateFrameProps['tone']) {
  if (tone === 'critical') {
    return 'border-[color:var(--color-danger-border)] bg-[color:var(--color-danger-surface)]';
  }

  if (tone === 'positive') {
    return 'border-[color:var(--color-success-border)] bg-[color:var(--color-success-surface)]';
  }

  return 'border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)]';
}

export function StateFrame({
  title,
  description,
  eyebrow,
  actions,
  tone = 'default',
  compact = false,
  mascotSurface,
}: StateFrameProps) {
  return (
    <section
      className={`w-full border p-6 sm:p-7 ${toneClasses(
        tone,
      )}`}
      role={tone === 'critical' ? 'alert' : 'status'}
    >
      <div className={`flex ${compact ? 'max-w-xl' : 'max-w-2xl'} flex-col gap-4 sm:flex-row sm:items-start`}>
        <GeniusMascot
          alt={tone === 'critical' ? 'Gênio indicando que há uma pendência' : 'Gênio acompanhando a operação'}
          size="lg"
          surface={mascotSurface ?? (tone === 'critical' ? 'empty' : 'default')}
        />
        <div className="min-w-0 flex-1 space-y-4">
          {eyebrow ? (
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-[color:var(--color-muted)]">
              {eyebrow}
            </p>
          ) : null}
          <div className="space-y-2">
            <h2 className="text-xl font-semibold tracking-[-0.02em] text-[color:var(--minimal-text)]">
              {title}
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-[color:var(--minimal-text-secondary)]">
              {description}
            </p>
          </div>
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </div>
      </div>
    </section>
  );
}

interface LoadingStateProps {
  title?: string;
  description?: string;
}

export function LoadingState({
  title = 'Carregando',
  description = 'Estamos preparando os dados desta área.',
}: LoadingStateProps) {
  return (
    <StateFrame
      title={title}
      description={description}
      eyebrow="Carregando"
      mascotSurface="loading"
      actions={
        <div className="inline-flex items-center gap-3 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)]/90 px-4 py-2 text-sm text-[color:var(--color-ink)]">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[color:var(--color-brand-blue)]" />
          Aguarde alguns instantes.
        </div>
      }
    />
  );
}

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <StateFrame
      title={title}
      description={description}
      eyebrow="Sem dados"
      mascotSurface="empty"
      compact
      actions={action}
    />
  );
}

interface ErrorStateProps {
  title?: string;
  description: string;
  action?: ReactNode;
}

export function ErrorState({
  title = 'Não foi possível carregar esta área',
  description,
  action,
}: ErrorStateProps) {
  return (
    <StateFrame
      title={title}
      description={description}
      eyebrow="Erro"
      tone="critical"
      mascotSurface="empty"
      actions={action}
    />
  );
}

interface AccessDeniedStateProps {
  title?: string;
  description: string;
  action?: ReactNode;
}

export function AccessDeniedState({
  title = 'Acesso não autorizado',
  description,
  action,
}: AccessDeniedStateProps) {
  return (
    <StateFrame
      title={title}
      description={description}
      eyebrow="Permissão"
      tone="critical"
      mascotSurface="empty"
      actions={action}
    />
  );
}

interface ContractUnavailableStateProps {
  contractName?: string;
  resourceName?: string;
  description?: string;
  action?: ReactNode;
}

function safeUnavailableResourceName(contractName?: string, resourceName?: string) {
  if (resourceName) {
    return resourceName;
  }

  if (!contractName) {
    return 'as informações desta área';
  }

  const internalTerms = /\b(rpc|view|backend|contrato|tenant|bucket|storage|supabase|rls|stack|payload)\b/i;

  if (internalTerms.test(contractName)) {
    return 'as informações desta área';
  }

  return contractName;
}

export function ContractUnavailableState({
  contractName,
  resourceName,
  description,
  action,
}: ContractUnavailableStateProps) {
  const safeResourceName = safeUnavailableResourceName(contractName, resourceName);

  return (
    <StateFrame
      title="Recurso indisponível"
      description={
        description ??
        `Não foi possível abrir ${safeResourceName} agora. Tente novamente ou revise suas permissões.`
      }
      eyebrow="Indisponível"
      mascotSurface="empty"
      actions={action}
    />
  );
}

interface SessionExpiredStateProps {
  action?: ReactNode;
}

export function SessionExpiredState({ action }: SessionExpiredStateProps) {
  return (
    <StateFrame
      title="Sessão expirada"
      description="Sua sessão expirou. Entre novamente para continuar."
      eyebrow="Sessão"
      tone="critical"
      mascotSurface="empty"
      actions={action}
    />
  );
}
