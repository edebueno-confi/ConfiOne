import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  AdminCustomerInventoryObservationRow,
  AdminCustomerMigrationKanbanRow,
  AdminCustomerOperationsDirectoryRow,
} from '@genius-support-os/contracts';
import { formatDateTime } from '../../app/format';
import { EmptyState, ErrorState, LoadingState } from '../../components/states';
import {
  AppButton,
  GovernedActionDrawer,
  GhostButton,
  InlineNotice,
  StatusPill,
  TextInput,
  cx,
} from '../../components/ui';
import { sanitizeOperationalVisibleText } from '../../lib/operational-copy';
import { useAuthContext } from '../auth/auth-context';
import {
  listAdminCustomerInventoryObservations,
  listAdminCustomerMigrationKanban,
  listAdminCustomerOperationsDirectory,
} from '../admin/admin-api';
import { classifyAdminError } from '../admin/admin-errors';

type PanelPhase = 'loading' | 'ready' | 'error';

function projectStatusLabel(status: AdminCustomerMigrationKanbanRow['status']) {
  const labels: Record<AdminCustomerMigrationKanbanRow['status'], string> = {
    draft: 'Rascunho',
    inventory_pending: 'Inventário pendente',
    inventory_in_progress: 'Inventariando',
    inventory_ready: 'Inventário pronto',
    eligibility_pending: 'Elegibilidade pendente',
    eligible: 'Elegível',
    eligible_with_restrictions: 'Elegível com ressalvas',
    standby: 'Em espera',
    planned: 'Planejado',
    awaiting_approval: 'Aguardando aprovação',
    ready_to_execute: 'Pronto para executar',
    running: 'Executando',
    validating: 'Validando',
    completed: 'Concluído',
    blocked: 'Bloqueado',
    cancelled: 'Cancelado',
  };
  return labels[status];
}

function statusTone(status: AdminCustomerMigrationKanbanRow['status']) {
  if (['completed', 'eligible', 'ready_to_execute'].includes(status)) return 'positive' as const;
  if (['blocked', 'cancelled'].includes(status)) return 'critical' as const;
  if (['standby', 'awaiting_approval', 'eligibility_pending'].includes(status)) return 'warning' as const;
  return 'default' as const;
}

function sourceLabel(row: Pick<AdminCustomerMigrationKanbanRow, 'source_product' | 'source_version'>) {
  return `${row.source_product === 'genius' ? 'Genius' : 'After Sale'} ${row.source_version.toUpperCase()}`;
}

function observationLabel(row: AdminCustomerInventoryObservationRow) {
  if (row.observed_status === 'found' || row.observed_status === 'configured') return 'Encontrada';
  if (row.observed_status === 'not_found') return 'Não encontrada';
  if (row.observed_status === 'stale') return 'Desatualizada';
  return 'Não verificada';
}

export function CustomerOperationsPanel({ onClose }: { onClose: () => void }) {
  const { markSessionExpired } = useAuthContext();
  const [phase, setPhase] = useState<PanelPhase>('loading');
  const [message, setMessage] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [directory, setDirectory] = useState<AdminCustomerOperationsDirectoryRow[]>([]);
  const [projects, setProjects] = useState<AdminCustomerMigrationKanbanRow[]>([]);
  const [observations, setObservations] = useState<AdminCustomerInventoryObservationRow[]>([]);

  const load = useCallback(async () => {
    setPhase('loading');
    setMessage(null);
    try {
      const [directoryRows, projectRows, observationRows] = await Promise.all([
        listAdminCustomerOperationsDirectory(),
        listAdminCustomerMigrationKanban(),
        listAdminCustomerInventoryObservations(),
      ]);
      setDirectory(directoryRows);
      setProjects(projectRows);
      setObservations(observationRows);
      setPhase('ready');
    } catch (error) {
      const classified = classifyAdminError(error, 'Não foi possível carregar o cockpit operacional de clientes.');
      if (classified.kind === 'session-expired') {
        markSessionExpired();
        return;
      }
      setMessage(classified.message);
      setPhase('error');
    }
  }, [markSessionExpired]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredDirectory = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return directory;
    return directory.filter((row) =>
      [row.display_name, row.legal_name, row.slug, row.group_display_name ?? '', row.csm_portfolio_name ?? '']
        .join(' ')
        .toLocaleLowerCase()
        .includes(normalized),
    );
  }, [directory, query]);

  const activeProjects = projects.filter((project) => !['completed', 'cancelled'].includes(project.status));
  const restrictedProjects = projects.filter((project) => project.status === 'blocked' || project.risk_level === 'critical');
  const observedWithAttention = observations.filter((row) => ['not_found', 'stale', 'unavailable'].includes(row.observed_status));

  return (
    <GovernedActionDrawer
      description="Visão operacional baseada em fontes, lojas, inventário e projetos. Grupos comerciais e econômicos aparecem apenas como contexto e não definem carteira de CS."
      onClose={onClose}
      title="Operações de clientes"
    >
      <div className="space-y-5">
        {message ? <InlineNotice>{message}</InlineNotice> : null}
        {phase === 'loading' ? <LoadingState title="Carregando operações de clientes" /> : null}
        {phase === 'error' ? <ErrorState action={<AppButton onClick={() => void load()}>Tentar novamente</AppButton>} description={message ?? 'Não foi possível carregar o cockpit operacional.'} /> : null}
        {phase === 'ready' ? (
          <>
            <section className="grid gap-3 sm:grid-cols-4">
              {[
                ['Clientes no diretório', directory.length],
                ['Projetos ativos', activeProjects.length],
                ['Com risco ou bloqueio', restrictedProjects.length],
                ['Observações com atenção', observedWithAttention.length],
              ].map(([label, value]) => (
                <div className="rounded-[16px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-3" key={String(label)}>
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[color:var(--color-muted)]">{label}</p>
                  <p className="mt-2 text-xl font-semibold text-[color:var(--color-ink)]">{value}</p>
                </div>
              ))}
            </section>

            <InlineNotice>
              Atribuição de CSM é exibida como vínculo operacional próprio. O agrupamento de marcas ou grupo econômico não cria carteira.
            </InlineNotice>

            <section className="space-y-3 rounded-[18px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[0.92rem] font-semibold text-[color:var(--color-ink)]">Diretório operacional</p>
                  <p className="mt-1 text-xs text-[color:var(--color-muted)]">Cliente, fontes, lojas, projetos e vínculo de CS em uma leitura única.</p>
                </div>
                <GhostButton className="min-h-8 px-3 text-xs" onClick={() => void load()}>Atualizar</GhostButton>
              </div>
              <TextInput onChange={(event) => setQuery(event.target.value)} placeholder="Buscar cliente, grupo ou responsável de CS" value={query} />
              {filteredDirectory.length === 0 ? (
                <EmptyState description="Nenhum cliente corresponde ao filtro atual." title="Diretório vazio" />
              ) : (
                <div className="overflow-x-auto rounded-[14px] border border-[color:var(--color-border)]">
                  <table className="min-w-[760px] w-full text-left text-xs">
                    <thead className="bg-[color:var(--color-surface-strong)] text-[color:var(--color-muted)]">
                      <tr>
                        <th className="px-3 py-2 font-semibold">Cliente</th>
                        <th className="px-3 py-2 font-semibold">Fontes / lojas</th>
                        <th className="px-3 py-2 font-semibold">Projetos</th>
                        <th className="px-3 py-2 font-semibold">CS</th>
                        <th className="px-3 py-2 font-semibold">Contexto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDirectory.map((row) => (
                        <tr className="border-t border-[color:var(--color-border)]" key={row.tenant_id}>
                          <td className="px-3 py-3">
                            <p className="font-semibold text-[color:var(--color-ink)]">{sanitizeOperationalVisibleText(row.display_name)}</p>
                            <p className="mt-1 text-[0.7rem] text-[color:var(--color-muted)]">{sanitizeOperationalVisibleText(row.slug)}</p>
                          </td>
                          <td className="px-3 py-3 text-[color:var(--color-muted)]">{row.confirmed_source_count}/{row.source_count} fontes confirmadas · {row.active_store_count}/{row.store_count} lojas ativas</td>
                          <td className="px-3 py-3 text-[color:var(--color-muted)]">{row.active_project_count}/{row.project_count} ativos</td>
                          <td className="px-3 py-3">{row.csm_portfolio_name ? <span className="text-[color:var(--color-ink)]">{sanitizeOperationalVisibleText(row.csm_portfolio_name)}</span> : <StatusPill>Sem vínculo</StatusPill>}</td>
                          <td className="px-3 py-3">{row.group_display_name ? <StatusPill tone="accent">{sanitizeOperationalVisibleText(row.group_display_name)}</StatusPill> : <span className="text-[color:var(--color-muted)]">Sem grupo</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-3 rounded-[18px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-3.5">
                <div>
                  <p className="text-[0.92rem] font-semibold text-[color:var(--color-ink)]">Projetos de migração</p>
                  <p className="mt-1 text-xs text-[color:var(--color-muted)]">Somente projetos com escopo explícito e aprovação podem avançar para execução.</p>
                </div>
                {projects.length === 0 ? <EmptyState description="Ainda não há projetos de migração registrados." title="Nenhum projeto" /> : (
                  <div className="space-y-2">
                    {projects.slice(0, 8).map((project) => (
                      <div className={cx('rounded-[14px] border p-3', project.status === 'blocked' ? 'border-[color:var(--color-danger-border)]' : 'border-[color:var(--color-border)]')} key={project.project_id}>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-[color:var(--color-ink)]">{sanitizeOperationalVisibleText(project.name)}</p>
                            <p className="mt-1 text-xs text-[color:var(--color-muted)]">{sanitizeOperationalVisibleText(project.tenant_display_name)} · {sourceLabel(project)}</p>
                          </div>
                          <StatusPill tone={statusTone(project.status)}>{projectStatusLabel(project.status)}</StatusPill>
                        </div>
                        <p className="mt-2 text-xs text-[color:var(--color-muted)]">{project.store_count} loja(s) · elegibilidade {project.eligibility_status} · aprovação {project.approval_status}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3 rounded-[18px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-3.5">
                <div>
                  <p className="text-[0.92rem] font-semibold text-[color:var(--color-ink)]">Inventário recente</p>
                  <p className="mt-1 text-xs text-[color:var(--color-muted)]">Estado observado por loja e fonte, sem presumir equivalência entre produtos.</p>
                </div>
                {observations.length === 0 ? <EmptyState description="Nenhuma observação de inventário disponível." title="Inventário vazio" /> : (
                  <div className="space-y-2">
                    {observations.slice(0, 8).map((observation) => (
                      <div className="flex items-start justify-between gap-3 rounded-[14px] border border-[color:var(--color-border)] p-3" key={observation.id}>
                        <div>
                          <p className="font-semibold text-[color:var(--color-ink)]">{sanitizeOperationalVisibleText(observation.feature_name)}</p>
                          <p className="mt-1 text-xs text-[color:var(--color-muted)]">{sanitizeOperationalVisibleText(observation.store_display_name)} · {observation.source_product} · {formatDateTime(observation.observed_at)}</p>
                        </div>
                        <StatusPill tone={['not_found', 'stale', 'unavailable'].includes(observation.observed_status) ? 'warning' : 'positive'}>{observationLabel(observation)}</StatusPill>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </>
        ) : null}
      </div>
    </GovernedActionDrawer>
  );
}
