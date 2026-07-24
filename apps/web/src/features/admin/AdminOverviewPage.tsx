import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MinimalState } from '../../components/minimal-states';
import { listCustomers, type CustomerAccount } from '../customers/customers-api';
import { listInboxItems, type InboxItem } from '../inbox/inbox-api';

type LoadState =
  | { phase: 'loading' }
  | { phase: 'ready'; customers: CustomerAccount[]; tickets: InboxItem[] }
  | { phase: 'error' };

const OPEN = new Set(['new', 'triage', 'in_progress', 'waiting_customer', 'waiting_support', 'waiting_engineering']);

function Kpi({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <div className="rounded-xl border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] px-4 py-3.5">
      <p className="text-2xl font-semibold tabular-nums leading-none text-[color:var(--minimal-text)]">{value}</p>
      <p className="mt-2 text-sm font-medium text-[color:var(--minimal-text)]">{label}</p>
      <p className="mt-0.5 text-xs text-[color:var(--minimal-text-tertiary)]">{hint}</p>
    </div>
  );
}

const ADMIN_LINKS: ReadonlyArray<{ to: string; label: string; hint: string }> = [
  { to: '/admin/tenants', label: 'Contas B2B', hint: 'Clientes, contatos e governança' },
  { to: '/admin/analytics', label: 'Dashboard gerencial', hint: 'Indicadores Comercial e Suporte (HubSpot)' },
  { to: '/admin/access', label: 'Acessos', hint: 'Usuários, papéis e permissões' },
  { to: '/admin/system', label: 'Sistema', hint: 'Observabilidade e auditoria' },
  { to: '/admin/knowledge', label: 'Conhecimento', hint: 'Base de ajuda e curadoria' },
  { to: '/admin/settings', label: 'Configurações', hint: 'Parâmetros do sistema' },
  { to: '/admin/customer-portal', label: 'Portal do cliente', hint: 'Acesso e entitlements' },
];

export function AdminOverviewPage() {
  const [state, setState] = useState<LoadState>({ phase: 'loading' });

  useEffect(() => {
    let cancelled = false;
    Promise.all([listCustomers(), listInboxItems()])
      .then(([customers, tickets]) => {
        if (!cancelled) setState({ phase: 'ready', customers, tickets });
      })
      .catch(() => {
        if (!cancelled) setState({ phase: 'error' });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    if (state.phase !== 'ready') {
      return { clients: 0, activeClients: 0, openTickets: 0, unassigned: 0 };
    }
    const open = state.tickets.filter((t: InboxItem) => OPEN.has(t.status));
    return {
      clients: state.customers.length,
      activeClients: state.customers.filter((c: CustomerAccount) => c.status === 'active').length,
      openTickets: open.length,
      unassigned: open.filter((t: InboxItem) => t.isUnassigned).length,
    };
  }, [state]);

  return (
    <div className="gso-screen-frame flex h-full min-h-0 flex-col overflow-y-auto bg-[color:var(--minimal-surface)]">
      <header className="gso-screen-header border-b border-[color:var(--minimal-border)] px-5 py-5 sm:px-6">
        <h1 className="text-lg font-semibold tracking-[-0.02em] text-[color:var(--minimal-text)]">Visão geral</h1>
        <p className="mt-1 text-xs text-[color:var(--minimal-text-secondary)]">
          Governança do GeniusOS num relance. Escolha uma área para administrar.
        </p>
      </header>

      <div className="gso-screen-body px-5 py-5 sm:px-6">
        {state.phase === 'loading' ? (
          <p className="text-sm text-[color:var(--minimal-text-secondary)]">Carregando visão geral…</p>
        ) : state.phase === 'error' ? (
          <MinimalState description="Não foi possível carregar os números agora. Atualize a página." title="Falha ao carregar" tone="critical" />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi hint="Contas B2B no seu escopo" label="Clientes" value={stats.clients} />
            <Kpi hint="Com status ativo" label="Clientes ativos" value={stats.activeClients} />
            <Kpi hint="Precisam de tratativa" label="Tickets abertos" value={stats.openTickets} />
            <Kpi hint="Sem responsável" label="Não atribuídas" value={stats.unassigned} />
          </div>
        )}

        <section className="mt-6">
          <h2 className="text-sm font-semibold text-[color:var(--minimal-text)]">Administração</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {ADMIN_LINKS.map((link) => (
              <Link
                className="rounded-xl border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] px-4 py-3.5 transition-colors hover:bg-[color:var(--minimal-surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--minimal-focus)]"
                key={link.to}
                to={link.to}
              >
                <p className="text-sm font-medium text-[color:var(--minimal-text)]">{link.label}</p>
                <p className="mt-0.5 text-xs text-[color:var(--minimal-text-tertiary)]">{link.hint}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
