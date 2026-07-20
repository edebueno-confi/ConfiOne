import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { formatDateTime } from '../../app/format';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  ContractUnavailableState,
} from '../../components/states';
import {
  AppButton,
  Field,
  GhostButton,
  GovernedActionDrawer,
  InlineNotice,
  SelectInput,
  StatusPill,
  TextInput,
  cx,
} from '../../components/ui';
import {
  INTERNAL_AREA_MEMBERSHIP_ROLES,
  INTERNAL_AREA_MEMBERSHIP_STATUSES,
  type AdminInternalActionTargetArea,
  type AdminInternalAreaMembership,
  type AdminTenantsListItemRow,
  type AdminUserLookupRow,
  type InternalAreaMembershipRole,
  type InternalAreaMembershipStatus,
} from '../../contracts/admin-contracts';
import {
  addInternalAreaMembership,
  archiveInternalAreaMembership,
  listAdminInternalActionTargetAreas,
  listAdminInternalAreaMemberships,
  listAdminTenants,
  lookupAdminUsers,
  updateInternalAreaMembership,
} from './admin-api';
import { classifyAdminError } from './admin-errors';

type Phase = 'loading' | 'ready' | 'contract-unavailable' | 'error';
type Drawer = 'add' | 'edit' | null;

interface AddDraft {
  tenantId: string;
  areaKey: string;
  userQuery: string;
  selectedUserId: string;
  role: InternalAreaMembershipRole;
  status: InternalAreaMembershipStatus;
}

interface EditDraft {
  role: InternalAreaMembershipRole;
  status: InternalAreaMembershipStatus;
}

function humanizeRole(role: InternalAreaMembershipRole) {
  switch (role) {
    case 'manager':
      return 'Gestor';
    case 'member':
      return 'Membro';
    case 'viewer':
      return 'Leitor';
  }
}

function humanizeStatus(status: InternalAreaMembershipStatus | string) {
  switch (status) {
    case 'active':
      return 'Ativo';
    case 'inactive':
      return 'Inativo';
    case 'archived':
      return 'Arquivado';
    default:
      return status;
  }
}

function toneForMembershipStatus(status: InternalAreaMembershipStatus) {
  if (status === 'active') {
    return 'positive' as const;
  }

  if (status === 'archived') {
    return 'critical' as const;
  }

  return 'warning' as const;
}

function emptyAddDraft(
  tenants: AdminTenantsListItemRow[],
  areas: AdminInternalActionTargetArea[],
): AddDraft {
  return {
    areaKey: areas[0]?.areaKey ?? '',
    role: 'member',
    selectedUserId: '',
    status: 'active',
    tenantId: tenants[0]?.id ?? '',
    userQuery: '',
  };
}

function AreaCard({ area }: { area: AdminInternalActionTargetArea }) {
  return (
    <article className="rounded-[14px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)] px-3 py-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-[color:var(--color-ink)]">
            {area.displayName}
          </p>
          <p className="mt-0.5 text-[10.5px] text-[color:var(--color-muted)]">
            {area.areaKey}
          </p>
        </div>
        <StatusPill tone={area.status === 'active' ? 'positive' : 'warning'}>
          {area.status === 'active' ? 'Ativa' : area.status}
        </StatusPill>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-[color:var(--color-muted)]">
        <span>{area.activeMembershipCount} membro(s)</span>
        <span>{area.openActionCount} aberto(s)</span>
      </div>
    </article>
  );
}

function MembershipRow({
  active,
  membership,
  onSelect,
}: {
  active: boolean;
  membership: AdminInternalAreaMembership;
  onSelect: () => void;
}) {
  return (
    <button
      className={cx(
        'flex min-h-[64px] w-full flex-col gap-2 border-b border-[color:var(--color-border)] px-3 py-3 text-left transition last:border-b-0 md:grid md:grid-cols-[minmax(220px,1.2fr)_minmax(190px,1fr)_minmax(210px,auto)] md:items-center',
        active
          ? 'rounded-[12px] border border-[rgba(48,127,226,0.55)] bg-[rgba(48,127,226,0.08)]'
          : 'hover:bg-[color:var(--color-surface)]',
      )}
      onClick={onSelect}
      type="button"
    >
      <div className="min-w-0">
        <p className="truncate text-[12.5px] font-semibold text-[color:var(--color-ink)]">
          {membership.userFullName ?? membership.userEmail ?? 'Usuário sem nome'}
        </p>
        <p className="mt-0.5 truncate text-[10.5px] text-[color:var(--color-muted)]">
          {membership.userEmail ?? membership.userId}
        </p>
      </div>
      <div className="min-w-0">
        <p className="truncate text-[12px] font-semibold text-[color:var(--color-ink)]">
          {membership.areaLabel}
        </p>
        <p className="mt-0.5 truncate text-[10.5px] text-[color:var(--color-muted)]">
          {membership.tenantDisplayName}
        </p>
      </div>
      <div className="flex min-w-0 flex-wrap items-center gap-2 md:justify-end">
        <StatusPill>{humanizeRole(membership.role)}</StatusPill>
        <StatusPill tone={toneForMembershipStatus(membership.status)}>
          {humanizeStatus(membership.status)}
        </StatusPill>
        <span className="text-[11px] text-[color:var(--color-muted)]">
          {formatDateTime(membership.updatedAt)}
        </span>
      </div>
    </button>
  );
}

export function InternalAreasAdminPage() {
  const [phase, setPhase] = useState<Phase>('loading');
  const [message, setMessage] = useState<string | null>(null);
  const [areas, setAreas] = useState<AdminInternalActionTargetArea[]>([]);
  const [memberships, setMemberships] = useState<AdminInternalAreaMembership[]>([]);
  const [tenants, setTenants] = useState<AdminTenantsListItemRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawer, setDrawer] = useState<Drawer>(null);
  const [addDraft, setAddDraft] = useState<AddDraft>(() => emptyAddDraft([], []));
  const [editDraft, setEditDraft] = useState<EditDraft>({
    role: 'member',
    status: 'active',
  });
  const [userResults, setUserResults] = useState<AdminUserLookupRow[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const selectedMembership = useMemo(
    () => memberships.find((membership) => membership.membershipId === selectedId) ?? null,
    [memberships, selectedId],
  );

  const loadPage = useCallback(async () => {
    setPhase('loading');
    setMessage(null);
    try {
      const [nextAreas, nextMemberships, nextTenants] = await Promise.all([
        listAdminInternalActionTargetAreas(),
        listAdminInternalAreaMemberships(),
        listAdminTenants(),
      ]);
      setAreas(nextAreas);
      setMemberships(nextMemberships);
      setTenants(nextTenants);
      setSelectedId((current) => current ?? nextMemberships[0]?.membershipId ?? null);
      setAddDraft((current) => ({
        ...emptyAddDraft(nextTenants, nextAreas),
        userQuery: current.userQuery,
      }));
      setPhase('ready');
    } catch (error) {
      const classified = classifyAdminError(
        error,
        'Falha ao carregar governança de áreas internas.',
      );
      setPhase(classified.kind === 'contract-unavailable' ? 'contract-unavailable' : 'error');
      setMessage(classified.message);
    }
  }, []);

  useEffect(() => {
    void loadPage();
  }, [loadPage]);

  useEffect(() => {
    if (!addDraft.userQuery.trim()) {
      setUserResults([]);
      return;
    }

    let cancelled = false;
    const timeout = window.setTimeout(() => {
      lookupAdminUsers(addDraft.userQuery)
        .then((users) => {
          if (!cancelled) {
            setUserResults(users);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setUserResults([]);
          }
        });
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [addDraft.userQuery]);

  function openAddDrawer() {
    setAddDraft(emptyAddDraft(tenants, areas));
    setUserResults([]);
    setDrawer('add');
  }

  function openEditDrawer() {
    if (!selectedMembership) {
      return;
    }

    setEditDraft({
      role: selectedMembership.role,
      status: selectedMembership.status,
    });
    setDrawer('edit');
  }

  async function runAction(action: () => Promise<unknown>, successMessage: string) {
    setSubmitting(true);
    setActionMessage(null);
    try {
      await action();
      setDrawer(null);
      setActionMessage(successMessage);
      await loadPage();
    } catch (error) {
      const classified = classifyAdminError(error, 'Falha ao atualizar áreas internas.');
      setActionMessage(classified.message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleAddSubmit(event: FormEvent) {
    event.preventDefault();
    if (!addDraft.tenantId || !addDraft.areaKey || !addDraft.selectedUserId) {
      setActionMessage('Selecione cliente, área e usuário antes de adicionar.');
      return;
    }

    void runAction(
      () =>
        addInternalAreaMembership({
          areaKey: addDraft.areaKey,
          role: addDraft.role,
          status: addDraft.status,
          tenantId: addDraft.tenantId,
          userId: addDraft.selectedUserId,
        }),
      'Vínculo de área interna adicionado.',
    );
  }

  function handleEditSubmit(event: FormEvent) {
    event.preventDefault();
    if (!selectedMembership) {
      return;
    }

    void runAction(
      () =>
        updateInternalAreaMembership({
          membershipId: selectedMembership.membershipId,
          role: editDraft.role,
          status: editDraft.status,
        }),
      'Vínculo de área interna atualizado.',
    );
  }

  function handleArchive() {
    if (!selectedMembership) {
      return;
    }

    void runAction(
      () => archiveInternalAreaMembership({ membershipId: selectedMembership.membershipId }),
      'Vínculo de área interna arquivado.',
    );
  }

  if (phase === 'loading') {
    return (
      <LoadingState
        title="Carregando áreas internas"
        description="Estamos carregando áreas acionáveis e vínculos operacionais."
      />
    );
  }

  if (phase === 'contract-unavailable') {
    return (
      <ContractUnavailableState
        contractName={message ?? 'governança de áreas internas'}
        action={<GhostButton onClick={() => void loadPage()}>Tentar novamente</GhostButton>}
      />
    );
  }

  if (phase === 'error') {
    return (
      <ErrorState
        description={message ?? 'Não foi possível carregar áreas internas.'}
        action={<GhostButton onClick={() => void loadPage()}>Tentar novamente</GhostButton>}
      />
    );
  }

  return (
    <>
      <div className="flex h-full min-h-0 flex-col gap-[var(--workspace-panel-gap)] overflow-hidden">
        <header className="shrink-0 rounded-[18px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)]/95 px-4 py-[var(--workspace-header-y)] shadow-[0_10px_22px_rgba(19,33,79,0.05)]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-[1.55rem] font-semibold leading-tight tracking-[-0.045em] text-[color:var(--color-ink)]">
                Áreas internas
              </h1>
              <p className="mt-1 text-[13px] text-[color:var(--color-muted)]">
                Governança de quem pode receber e operar acionamentos internos por cliente.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <GhostButton onClick={() => void loadPage()} type="button">
                Recarregar
              </GhostButton>
              <AppButton onClick={openAddDrawer} type="button">
                Adicionar membro
              </AppButton>
            </div>
          </div>
        </header>

        {actionMessage ? <InlineNotice>{actionMessage}</InlineNotice> : null}

        <div className="grid min-h-0 flex-1 gap-[var(--workspace-panel-gap)] overflow-y-auto lg:grid-cols-[minmax(250px,300px)_minmax(0,1fr)] lg:overflow-hidden">
          <aside className="min-h-0 rounded-[18px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)]/93 p-3 lg:overflow-y-auto">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
              Áreas acionáveis
            </p>
            <div className="mt-3 grid gap-2">
              {areas.map((area) => (
                <AreaCard area={area} key={area.areaKey} />
              ))}
            </div>
          </aside>

          <main className="flex min-h-[560px] min-w-0 flex-col overflow-hidden rounded-[18px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)]/95 lg:min-h-0">
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[color:var(--color-border)] px-4 py-2.5">
              <div>
                <h2 className="text-[1rem] font-semibold tracking-[-0.03em] text-[color:var(--color-ink)]">
                  Vínculos
                </h2>
                <p className="mt-0.5 text-[12px] text-[color:var(--color-muted)]">
                  {memberships.length} vínculo(s) ativos na governança.
                </p>
              </div>
              <StatusPill>{memberships.filter((item) => item.status === 'active').length} ativos</StatusPill>
            </div>
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--color-muted)]">
              <span>Usuário, área e cliente</span>
              <span>Papel, status e atualização</span>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
              {memberships.length === 0 ? (
                <EmptyState
                  title="Nenhum vínculo criado"
                  description="Adicione membros ativos para que áreas internas vejam a fila operacional."
                />
              ) : (
                <div className="overflow-hidden rounded-[14px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)]">
                  {memberships.map((membership) => (
                    <MembershipRow
                      active={membership.membershipId === selectedId}
                      key={membership.membershipId}
                      membership={membership}
                      onSelect={() => setSelectedId(membership.membershipId)}
                    />
                  ))}
                </div>
              )}
            </div>
            <section className="shrink-0 border-t border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-3">
              {selectedMembership ? (
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
                      Vínculo selecionado
                    </p>
                    <h2 className="mt-1 truncate text-[1rem] font-semibold tracking-[-0.03em] text-[color:var(--color-ink)]">
                      {selectedMembership.userFullName ?? selectedMembership.userEmail}
                    </h2>
                    <p className="mt-1 truncate text-[12px] text-[color:var(--color-muted)]">
                      {selectedMembership.areaLabel} · {selectedMembership.tenantDisplayName}
                    </p>
                  </div>
                  <div className="flex min-w-0 flex-col gap-2 lg:max-w-[360px]">
                    <p className="line-clamp-2 text-[12px] leading-5 text-[color:var(--color-muted)]">
                      Usuários ativos neste vínculo podem ver acionamentos da área no cliente correspondente.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <AppButton disabled={submitting} onClick={openEditDrawer} type="button">
                        Alterar papel/status
                      </AppButton>
                      <GhostButton
                        disabled={submitting || !selectedMembership.canArchive}
                        onClick={handleArchive}
                        type="button"
                      >
                        Arquivar vínculo
                      </GhostButton>
                    </div>
                  </div>
                </div>
              ) : (
                <EmptyState
                  title="Nenhum vínculo selecionado"
                  description="Selecione um vínculo para revisar permissões e ações administrativas."
                />
              )}
            </section>
          </main>
        </div>
      </div>

      {drawer === 'add' ? (
        <GovernedActionDrawer
          description="Adicione um usuário existente a uma área acionável para um cliente."
          footer={
            <>
              <GhostButton onClick={() => setDrawer(null)} type="button">
                Cancelar
              </GhostButton>
              <AppButton disabled={submitting} form="internal-area-add-form" type="submit">
                Adicionar membro
              </AppButton>
            </>
          }
          onClose={() => setDrawer(null)}
          title="Adicionar vínculo"
        >
          <form className="space-y-5" id="internal-area-add-form" onSubmit={handleAddSubmit}>
            <Field label="Cliente">
              <SelectInput
                onChange={(event) =>
                  setAddDraft((current) => ({ ...current, tenantId: event.target.value }))
                }
                required
                value={addDraft.tenantId}
              >
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.display_name}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Área">
              <SelectInput
                onChange={(event) =>
                  setAddDraft((current) => ({ ...current, areaKey: event.target.value }))
                }
                required
                value={addDraft.areaKey}
              >
                {areas.map((area) => (
                  <option key={area.areaKey} value={area.areaKey}>
                    {area.displayName}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Buscar usuário">
              <TextInput
                onChange={(event) =>
                  setAddDraft((current) => ({
                    ...current,
                    selectedUserId: '',
                    userQuery: event.target.value,
                  }))
                }
                placeholder="nome ou email"
                required
                value={addDraft.userQuery}
              />
            </Field>
            {userResults.length > 0 ? (
              <div className="grid gap-2">
                {userResults.map((user) => (
                  <button
                    className={cx(
                      'rounded-[12px] border px-3 py-2 text-left text-sm',
                      addDraft.selectedUserId === user.user_id
                        ? 'border-[rgba(48,127,226,0.42)] bg-[rgba(48,127,226,0.08)]'
                        : 'border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)]',
                    )}
                    key={user.user_id}
                    onClick={() =>
                      setAddDraft((current) => ({ ...current, selectedUserId: user.user_id }))
                    }
                    type="button"
                  >
                    <span className="block font-semibold text-[color:var(--color-ink)]">
                      {user.full_name ?? user.email}
                    </span>
                    <span className="text-[12px] text-[color:var(--color-muted)]">
                      {user.email ?? user.user_id}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Papel">
                <SelectInput
                  onChange={(event) =>
                    setAddDraft((current) => ({
                      ...current,
                      role: event.target.value as InternalAreaMembershipRole,
                    }))
                  }
                  value={addDraft.role}
                >
                  {INTERNAL_AREA_MEMBERSHIP_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {humanizeRole(role)}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Status">
                <SelectInput
                  onChange={(event) =>
                    setAddDraft((current) => ({
                      ...current,
                      status: event.target.value as InternalAreaMembershipStatus,
                    }))
                  }
                  value={addDraft.status}
                >
                  {INTERNAL_AREA_MEMBERSHIP_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {humanizeStatus(status)}
                    </option>
                  ))}
                </SelectInput>
              </Field>
            </div>
          </form>
        </GovernedActionDrawer>
      ) : null}

      {drawer === 'edit' && selectedMembership ? (
        <GovernedActionDrawer
          description="Atualize papel e status do vínculo. Arquivamento remove acesso operacional da área."
          footer={
            <>
              <GhostButton onClick={() => setDrawer(null)} type="button">
                Cancelar
              </GhostButton>
              <AppButton disabled={submitting} form="internal-area-edit-form" type="submit">
                Atualizar vínculo
              </AppButton>
            </>
          }
          onClose={() => setDrawer(null)}
          title="Alterar vínculo"
        >
          <form className="space-y-5" id="internal-area-edit-form" onSubmit={handleEditSubmit}>
            <section className="rounded-[16px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-3">
              <p className="text-sm font-semibold text-[color:var(--color-ink)]">
                {selectedMembership.userFullName ?? selectedMembership.userEmail}
              </p>
              <p className="mt-1 text-xs text-[color:var(--color-muted)]">
                {selectedMembership.areaLabel} · {selectedMembership.tenantDisplayName}
              </p>
            </section>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Papel">
                <SelectInput
                  onChange={(event) =>
                    setEditDraft((current) => ({
                      ...current,
                      role: event.target.value as InternalAreaMembershipRole,
                    }))
                  }
                  value={editDraft.role}
                >
                  {INTERNAL_AREA_MEMBERSHIP_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {humanizeRole(role)}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Status">
                <SelectInput
                  onChange={(event) =>
                    setEditDraft((current) => ({
                      ...current,
                      status: event.target.value as InternalAreaMembershipStatus,
                    }))
                  }
                  value={editDraft.status}
                >
                  {INTERNAL_AREA_MEMBERSHIP_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {humanizeStatus(status)}
                    </option>
                  ))}
                </SelectInput>
              </Field>
            </div>
          </form>
        </GovernedActionDrawer>
      ) : null}
    </>
  );
}
