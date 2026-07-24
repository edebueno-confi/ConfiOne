import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MinimalState } from '../../components/minimal-states';
import { cx } from '../../components/ui';
import { GeniusMascot } from '../../components/GeniusMascot';
import { useAuthContext } from '../auth/auth-context';
import { listInboxItems, type InboxItem } from '../inbox/inbox-api';

type LoadState = { phase: 'loading' } | { phase: 'ready'; items: InboxItem[] } | { phase: 'error' };

const OPEN_STATUSES = new Set(['new', 'triage', 'in_progress', 'waiting_customer', 'waiting_support', 'waiting_engineering']);

function greeting() {
  const hour = new Date().getHours();
  if (hour < 6) return 'Boa madrugada';
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

function firstName(fullName: string | null, email: string | null) {
  const base = (fullName ?? '').trim() || (email ?? '').split('@')[0] || '';
  return base.split(/\s+/)[0] ?? '';
}

function formatWhen(value: string | null) {
  if (!value) return '';
  const date = new Date(value);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(date);
  }
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(date);
}

function KpiCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: number;
  hint: string;
  tone: 'info' | 'warning' | 'danger' | 'neutral';
}) {
  const tones: Record<string, string> = {
    info: 'border-[color:var(--color-info-border)]',
    warning: 'border-[color:var(--color-warning-border)]',
    danger: 'border-[color:var(--color-danger-border)]',
    neutral: 'border-[color:var(--minimal-border)]',
  };
  const valueTones: Record<string, string> = {
    info: 'text-[color:var(--color-info-text)]',
    warning: 'text-[color:var(--color-warning-text)]',
    danger: 'text-[color:var(--color-danger-text)]',
    neutral: 'text-[color:var(--minimal-text)]',
  };
  return (
    <Link
      className={cx(
        'rounded-xl border bg-[color:var(--minimal-surface)] px-4 py-3.5 transition-colors hover:bg-[color:var(--minimal-surface-muted)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--minimal-focus)]',
        tones[tone],
      )}
      to="/support/inbox"
    >
      <p className={cx('text-2xl font-semibold tabular-nums leading-none', valueTones[tone])}>{value}</p>
      <p className="mt-2 text-sm font-medium text-[color:var(--minimal-text)]">{label}</p>
      <p className="mt-0.5 text-xs text-[color:var(--minimal-text-tertiary)]">{hint}</p>
    </Link>
  );
}

export function HomePage() {
  const { user } = useAuthContext();
  const [state, setState] = useState<LoadState>({ phase: 'loading' });

  useEffect(() => {
    let cancelled = false;
    listInboxItems()
      .then((items) => {
        if (!cancelled) setState({ phase: 'ready', items });
      })
      .catch(() => {
        if (!cancelled) setState({ phase: 'error' });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const items = state.phase === 'ready' ? state.items : [];
  const fullName = String(user?.user_metadata?.full_name ?? '').trim() || null;

  const stats = useMemo(() => {
    const open = items.filter((item: InboxItem) => OPEN_STATUSES.has(item.status));
    return {
      waitingSupport: open.filter((item: InboxItem) => item.isWaitingSupport).length,
      unassigned: open.filter((item: InboxItem) => item.isUnassigned).length,
      urgent: open.filter((item: InboxItem) => item.priority === 'urgent' || item.severity === 'critical').length,
      waitingCustomer: open.filter((item: InboxItem) => item.isWaitingCustomer).length,
      mine: user?.id
        ? open.filter(
            (item: InboxItem) =>
              !item.isUnassigned && item.assignedToFullName !== null && item.assignedToFullName === fullName,
          )
        : [],
      openTotal: open,
    };
  }, [items, user?.id, fullName]);

  const attention = useMemo(() => {
    const open = stats.openTotal;
    const urgentFirst = [...open].sort((a: InboxItem, b: InboxItem) => {
      const rank = (item: InboxItem) =>
        (item.priority === 'urgent' ? 0 : item.priority === 'high' ? 1 : 2) + (item.isWaitingSupport ? 0 : 0.5);
      return rank(a) - rank(b);
    });
    return urgentFirst.slice(0, 6);
  }, [stats.openTotal]);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto bg-[color:var(--minimal-surface)]">
      <header className="border-b border-[color:var(--minimal-border)] px-5 py-5 sm:px-6">
        <div className="flex items-center gap-3">
          <GeniusMascot size="lg" />
          <div>
            <h1 className="text-lg font-semibold tracking-[-0.02em] text-[color:var(--minimal-text)]">
              {greeting()}{firstName(fullName, user?.email ?? null) ? `, ${firstName(fullName, user?.email ?? null)}` : ''}!
            </h1>
            <p className="mt-0.5 text-xs text-[color:var(--minimal-text-secondary)]">
              Este é o seu dia no GeniusOS. Comece pelo que espera por você.
            </p>
          </div>
        </div>
      </header>

      <div className="px-5 py-5 sm:px-6">
        {state.phase === 'loading' ? (
          <p className="text-sm text-[color:var(--minimal-text-secondary)]">Carregando o seu dia…</p>
        ) : state.phase === 'error' ? (
          <MinimalState description="Não foi possível carregar os números agora. Atualize a página." title="Falha ao carregar" tone="critical" />
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard hint="Conversas em que a próxima ação é sua equipe" label="Aguardando suporte" tone="warning" value={stats.waitingSupport} />
              <KpiCard hint="Ninguém assumiu ainda — priorize estas" label="Não atribuídas" tone="info" value={stats.unassigned} />
              <KpiCard hint="Prioridade urgente ou impacto crítico" label="Urgentes" tone="danger" value={stats.urgent} />
              <KpiCard hint="Bola com o cliente; acompanhe o retorno" label="Aguardando cliente" tone="neutral" value={stats.waitingCustomer} />
            </div>

            {stats.mine.length > 0 ? (
              <section className="mt-6">
                <h2 className="text-sm font-semibold text-[color:var(--minimal-text)]">Minhas conversas ({stats.mine.length})</h2>
                <div className="mt-3 overflow-hidden rounded-xl border border-[color:var(--minimal-border)]">
                  {stats.mine.slice(0, 5).map((item: InboxItem) => (
                    <Link
                      className="flex items-center justify-between gap-3 border-b border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] px-4 py-3 transition-colors last:border-b-0 hover:bg-[color:var(--minimal-surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[color:var(--minimal-focus)]"
                      key={item.id}
                      to="/support/inbox"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[color:var(--minimal-text)]">{item.title}</p>
                        <p className="mt-0.5 truncate text-xs text-[color:var(--minimal-text-secondary)]">{item.tenantDisplayName ?? 'Cliente indisponível'}</p>
                      </div>
                      <span className="shrink-0 text-[11px] tabular-nums text-[color:var(--minimal-text-tertiary)]">{formatWhen(item.lastMessageAt ?? item.updatedAt)}</span>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="mt-6">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-sm font-semibold text-[color:var(--minimal-text)]">Merecem sua atenção agora</h2>
                <Link
                  className="text-xs font-medium text-[color:var(--color-info-text)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--minimal-focus)]"
                  to="/support/inbox"
                >
                  Abrir o Atendimento
                </Link>
              </div>
              {attention.length === 0 ? (
                <p className="mt-3 text-sm text-[color:var(--minimal-text-secondary)]">
                  Nenhuma conversa aberta. Bom trabalho!
                </p>
              ) : (
                <div className="mt-3 overflow-hidden rounded-xl border border-[color:var(--minimal-border)]">
                  {attention.map((item: InboxItem) => (
                    <Link
                      className="flex items-center justify-between gap-3 border-b border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] px-4 py-3 transition-colors last:border-b-0 hover:bg-[color:var(--minimal-surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[color:var(--minimal-focus)]"
                      key={item.id}
                      to="/support/inbox"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[color:var(--minimal-text)]">{item.title}</p>
                        <p className="mt-0.5 truncate text-xs text-[color:var(--minimal-text-secondary)]">
                          {item.tenantDisplayName ?? 'Cliente indisponível'}
                          {item.assignedToFullName ? ` · ${item.assignedToFullName}` : ' · sem responsável'}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {item.priority === 'urgent' || item.priority === 'high' ? (
                          <span className="rounded-full border border-[color:var(--color-danger-border)] bg-[color:var(--color-danger-surface)] px-2 py-0.5 text-[11px] font-medium text-[color:var(--color-danger-text)]">
                            {item.priority === 'urgent' ? 'Urgente' : 'Alta'}
                          </span>
                        ) : null}
                        <span className="text-[11px] tabular-nums text-[color:var(--minimal-text-tertiary)]">
                          {formatWhen(item.lastMessageAt ?? item.updatedAt)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section className="mt-6">
              <h2 className="text-sm font-semibold text-[color:var(--minimal-text)]">Atalhos</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link className="rounded-lg border border-[color:var(--minimal-border)] px-3 py-2 text-sm font-medium text-[color:var(--minimal-text-secondary)] hover:text-[color:var(--minimal-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--minimal-focus)]" to="/support/inbox">Atendimento</Link>
                <Link className="rounded-lg border border-[color:var(--minimal-border)] px-3 py-2 text-sm font-medium text-[color:var(--minimal-text-secondary)] hover:text-[color:var(--minimal-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--minimal-focus)]" to="/support/customers">Clientes B2B</Link>
                <Link className="rounded-lg border border-[color:var(--minimal-border)] px-3 py-2 text-sm font-medium text-[color:var(--minimal-text-secondary)] hover:text-[color:var(--minimal-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--minimal-focus)]" to="/internal-actions">Acionamentos</Link>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
