import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  AppButton,
  Field,
  GhostButton,
  GovernedActionDrawer,
  InlineNotice,
  SelectInput,
  StatusPill,
  TextInput,
  TextareaInput,
  cx,
} from '../../components/ui';
import { EmptyState, ErrorState, LoadingState } from '../../components/states';
import { sanitizeOperationalVisibleText } from '../../lib/operational-copy';
import {
  CUSTOMER_GROUP_MEMBER_KINDS,
  CUSTOMER_GROUP_MEMBER_RELATIONSHIPS,
  CUSTOMER_GROUP_TYPES,
  type AdminCustomerAccountGroupDetailRow,
  type AdminCustomerAccountGroupListRow,
  type AdminCustomerAccountGroupMemberRow,
  type AdminTenantsListItemRow,
  type CustomerGroupMemberKind,
  type CustomerGroupMemberRelationship,
  type CustomerGroupType,
  type CustomerGroupTypeRecord,
} from '../../contracts/admin-contracts';
import { useAuthContext } from '../auth/auth-context';
import {
  addCustomerAccountGroupMember,
  archiveCustomerAccountGroupMember,
  createCustomerAccountGroup,
  getAdminCustomerAccountGroupDetail,
  listAdminCustomerAccountGroups,
} from '../admin/admin-api';
import { classifyAdminError } from '../admin/admin-errors';

interface CustomerGroupsPanelProps {
  tenants: AdminTenantsListItemRow[];
  onClose: () => void;
  onChanged?: () => void | Promise<void>;
}

interface GroupFormState {
  slug: string;
  displayName: string;
  groupType: CustomerGroupType;
  description: string;
}

interface MemberFormState {
  memberKind: CustomerGroupMemberKind;
  tenantId: string;
  memberName: string;
  relationship: CustomerGroupMemberRelationship;
  sourceSystem: string;
  sourceExternalId: string;
  isPrimary: boolean;
  notes: string;
}

type PanelPhase = 'loading' | 'ready' | 'error';

const GROUP_TYPE_LABELS: Record<CustomerGroupTypeRecord, string> = {
  economic_group: 'Grupo econômico',
  service_umbrella: 'Guarda-chuva de serviço',
  portfolio: 'Classificação legada',
};

const MEMBER_KIND_LABELS: Record<CustomerGroupMemberKind, string> = {
  tenant: 'Conta operacional',
  brand: 'Marca atendida',
};

const RELATIONSHIP_LABELS: Record<CustomerGroupMemberRelationship, string> = {
  contract_holder: 'Contratante',
  served_brand: 'Marca atendida',
  operational_member: 'Membro operacional',
};

function emptyGroupForm(): GroupFormState {
  return {
    slug: '',
    displayName: '',
    groupType: 'service_umbrella',
    description: '',
  };
}

function emptyMemberForm(): MemberFormState {
  return {
    memberKind: 'tenant',
    tenantId: '',
    memberName: '',
    relationship: 'operational_member',
    sourceSystem: 'manual',
    sourceExternalId: '',
    isPrimary: false,
    notes: '',
  };
}

function groupStatusLabel(status: AdminCustomerAccountGroupListRow['status']) {
  return status === 'active' ? 'Ativo' : 'Arquivado';
}

function groupMemberName(member: AdminCustomerAccountGroupMemberRow) {
  return member.member_kind === 'tenant'
    ? member.tenant_display_name ?? member.tenant_slug ?? 'Conta sem nome'
    : member.member_name;
}

export function CustomerGroupsPanel({ tenants, onClose, onChanged }: CustomerGroupsPanelProps) {
  const { markSessionExpired } = useAuthContext();
  const [phase, setPhase] = useState<PanelPhase>('loading');
  const [groups, setGroups] = useState<AdminCustomerAccountGroupListRow[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<AdminCustomerAccountGroupDetailRow | null>(null);
  const [detailPhase, setDetailPhase] = useState<PanelPhase>('loading');
  const [query, setQuery] = useState('');
  const [groupForm, setGroupForm] = useState<GroupFormState>(emptyGroupForm);
  const [memberForm, setMemberForm] = useState<MemberFormState>(emptyMemberForm);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadGroups = useCallback(async (preferredGroupId?: string | null) => {
    setPhase('loading');
    try {
      const rows = await listAdminCustomerAccountGroups();
      setGroups(rows);
      setPhase('ready');
      setSelectedGroupId((current) => preferredGroupId ?? current ?? rows[0]?.id ?? null);
    } catch (error) {
      const classified = classifyAdminError(error, 'Não foi possível carregar os grupos de clientes.');
      if (classified.kind === 'session-expired') {
        markSessionExpired();
        return;
      }
      setPhase('error');
      setMessage(classified.message);
    }
  }, [markSessionExpired]);

  const loadGroupDetail = useCallback(async (groupId: string) => {
    setDetailPhase('loading');
    try {
      const detail = await getAdminCustomerAccountGroupDetail(groupId);
      setSelectedGroup(detail);
      setDetailPhase(detail ? 'ready' : 'error');
      if (!detail) setMessage('O grupo selecionado não está mais disponível.');
    } catch (error) {
      const classified = classifyAdminError(error, 'Não foi possível carregar o detalhe do grupo.');
      if (classified.kind === 'session-expired') {
        markSessionExpired();
        return;
      }
      setDetailPhase('error');
      setMessage(classified.message);
    }
  }, [markSessionExpired]);

  useEffect(() => {
    void loadGroups();
  }, [loadGroups]);

  useEffect(() => {
    if (selectedGroupId) {
      void loadGroupDetail(selectedGroupId);
    } else {
      setSelectedGroup(null);
      setDetailPhase('ready');
    }
  }, [loadGroupDetail, selectedGroupId]);

  const filteredGroups = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return groups;
    return groups.filter((group) =>
      [group.display_name, group.slug, group.description ?? '']
        .join(' ')
        .toLocaleLowerCase()
        .includes(normalized),
    );
  }, [groups, query]);

  async function refreshAfterChange(groupId?: string | null) {
    await loadGroups(groupId);
    if (groupId) await loadGroupDetail(groupId);
    await onChanged?.();
  }

  async function handleCreateGroup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!groupForm.slug.trim() || !groupForm.displayName.trim()) {
      setMessage('Informe o identificador e o nome do agrupamento.');
      return;
    }

    setSubmitting(true);
    setMessage(null);
    try {
      const created = await createCustomerAccountGroup({
        p_slug: groupForm.slug.trim().toLowerCase(),
        p_display_name: groupForm.displayName.trim(),
        p_group_type: groupForm.groupType,
        p_description: groupForm.description.trim() || null,
      });
      setGroupForm(emptyGroupForm());
      setMessage('Agrupamento criado com sucesso.');
      await refreshAfterChange(created.id);
    } catch (error) {
      const classified = classifyAdminError(error, 'Não foi possível criar o agrupamento.');
      if (classified.kind === 'session-expired') {
        markSessionExpired();
        return;
      }
      setMessage(classified.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedGroupId) return;
    if (memberForm.memberKind === 'tenant' && !memberForm.tenantId) {
      setMessage('Selecione a conta operacional que será vinculada.');
      return;
    }
    if (memberForm.memberKind === 'brand' && !memberForm.memberName.trim()) {
      setMessage('Informe o nome da marca atendida.');
      return;
    }

    setSubmitting(true);
    setMessage(null);
    try {
      await addCustomerAccountGroupMember({
        p_group_id: selectedGroupId,
        p_member_kind: memberForm.memberKind,
        p_tenant_id: memberForm.memberKind === 'tenant' ? memberForm.tenantId : null,
        p_member_name: memberForm.memberKind === 'brand' ? memberForm.memberName.trim() : null,
        p_relationship: memberForm.relationship,
        p_source_system: memberForm.sourceSystem.trim() || 'manual',
        p_source_external_id: memberForm.sourceExternalId.trim() || null,
        p_is_primary: memberForm.memberKind === 'tenant' && memberForm.isPrimary,
        p_notes: memberForm.notes.trim() || null,
      });
      setMemberForm(emptyMemberForm());
      setMessage('Membro adicionado ao agrupamento.');
      await refreshAfterChange(selectedGroupId);
    } catch (error) {
      const classified = classifyAdminError(error, 'Não foi possível adicionar o membro.');
      if (classified.kind === 'session-expired') {
        markSessionExpired();
        return;
      }
      setMessage(classified.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleArchiveMember(memberId: string) {
    if (!window.confirm('Arquivar este vínculo do agrupamento?')) return;

    setSubmitting(true);
    setMessage(null);
    try {
      await archiveCustomerAccountGroupMember({ p_member_id: memberId });
      setMessage('Vínculo arquivado com sucesso.');
      await refreshAfterChange(selectedGroupId);
    } catch (error) {
      const classified = classifyAdminError(error, 'Não foi possível arquivar o vínculo.');
      if (classified.kind === 'session-expired') {
        markSessionExpired();
        return;
      }
      setMessage(classified.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <GovernedActionDrawer
      description="Organize clientes e marcas por relacionamento operacional. O agrupamento não substitui contrato, entidade jurídica ou fonte financeira."
      onClose={onClose}
      title="Grupos e marcas"
    >
      <div className="space-y-5">
        {message ? <InlineNotice>{message}</InlineNotice> : null}

        <section className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-[18px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-3">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">Agrupamentos</p>
            <p className="mt-2 text-xl font-semibold text-[color:var(--color-ink)]">{groups.length}</p>
          </div>
          <div className="rounded-[18px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-3">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">Contas vinculadas</p>
            <p className="mt-2 text-xl font-semibold text-[color:var(--color-ink)]">{groups.reduce((sum, group) => sum + group.active_tenant_member_count, 0)}</p>
          </div>
          <div className="rounded-[18px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-3">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">Marcas representadas</p>
            <p className="mt-2 text-xl font-semibold text-[color:var(--color-ink)]">{groups.reduce((sum, group) => sum + group.active_brand_member_count, 0)}</p>
          </div>
        </section>

        {phase === 'loading' ? <LoadingState title="Carregando grupos" /> : null}
        {phase === 'error' ? <ErrorState description={message ?? 'Não foi possível carregar os grupos.'} /> : null}

        {phase === 'ready' ? (
          <div className="grid min-h-0 gap-4 lg:grid-cols-[minmax(240px,0.8fr)_minmax(0,1.2fr)]">
            <section className="space-y-3 rounded-[20px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-3.5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[0.92rem] font-semibold text-[color:var(--color-ink)]">Agrupamentos internos</p>
                  <p className="mt-1 text-[0.76rem] text-[color:var(--color-muted)]">Grupos econômicos e guarda-chuvas de serviço.</p>
                </div>
                <StatusPill>{filteredGroups.length}</StatusPill>
              </div>
              <TextInput onChange={(event) => setQuery(event.target.value)} placeholder="Buscar grupo" value={query} />

              <div className="space-y-2">
                {filteredGroups.length === 0 ? (
                  <EmptyState description="Crie o primeiro agrupamento para relacionar contas e marcas." title="Nenhum grupo encontrado" />
                ) : (
                  filteredGroups.map((group) => (
                    <button
                      className={cx(
                        'w-full rounded-[16px] border p-3 text-left transition',
                        selectedGroupId === group.id
                          ? 'border-[color:var(--color-brand-blue)] bg-[rgba(48,127,226,0.08)]'
                          : 'border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)] hover:border-[color:var(--color-brand-blue)]/40',
                      )}
                      key={group.id}
                      onClick={() => setSelectedGroupId(group.id)}
                      type="button"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-[color:var(--color-ink)]">{sanitizeOperationalVisibleText(group.display_name)}</p>
                        <StatusPill tone={group.status === 'active' ? 'positive' : 'default'}>{groupStatusLabel(group.status)}</StatusPill>
                      </div>
                      <p className="mt-1 text-xs text-[color:var(--color-muted)]">{GROUP_TYPE_LABELS[group.group_type]} · {group.slug}</p>
                      <p className="mt-2 text-xs text-[color:var(--color-muted)]">{group.active_tenant_member_count} conta(s) · {group.active_brand_member_count} marca(s)</p>
                    </button>
                  ))
                )}
              </div>

              <form className="space-y-3 border-t border-[color:var(--color-border)] pt-3" onSubmit={handleCreateGroup}>
                <p className="text-[0.92rem] font-semibold text-[color:var(--color-ink)]">Novo agrupamento</p>
                <Field label="Nome">
                  <TextInput onChange={(event) => setGroupForm((current) => ({ ...current, displayName: event.target.value }))} placeholder="Infracommerce" required value={groupForm.displayName} />
                </Field>
                <Field label="Identificador">
                  <TextInput onChange={(event) => setGroupForm((current) => ({ ...current, slug: event.target.value }))} placeholder="infracommerce" required value={groupForm.slug} />
                </Field>
                <Field label="Tipo">
                  <SelectInput onChange={(event) => setGroupForm((current) => ({ ...current, groupType: event.target.value as CustomerGroupType }))} value={groupForm.groupType}>
                    {CUSTOMER_GROUP_TYPES.map((type) => <option key={type} value={type}>{GROUP_TYPE_LABELS[type]}</option>)}
                  </SelectInput>
                </Field>
                <Field label="Descrição interna">
                  <TextareaInput onChange={(event) => setGroupForm((current) => ({ ...current, description: event.target.value }))} placeholder="Uso operacional do agrupamento" rows={2} value={groupForm.description} />
                </Field>
                <AppButton disabled={submitting} type="submit">{submitting ? 'Salvando...' : 'Criar agrupamento'}</AppButton>
              </form>
            </section>

            <section className="space-y-4 rounded-[20px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-3.5">
              {detailPhase === 'loading' ? <LoadingState title="Abrindo agrupamento" /> : null}
              {detailPhase === 'error' ? <ErrorState description={message ?? 'Detalhe indisponível.'} /> : null}
              {detailPhase === 'ready' && selectedGroup ? (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[color:var(--color-border)] pb-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-semibold text-[color:var(--color-ink)]">{sanitizeOperationalVisibleText(selectedGroup.display_name)}</h2>
                        <StatusPill tone={selectedGroup.status === 'active' ? 'positive' : 'default'}>{groupStatusLabel(selectedGroup.status)}</StatusPill>
                      </div>
                      <p className="mt-1 text-xs text-[color:var(--color-muted)]">{GROUP_TYPE_LABELS[selectedGroup.group_type]} · {selectedGroup.slug}</p>
                      {selectedGroup.description ? <p className="mt-2 text-sm text-[color:var(--color-muted)]">{sanitizeOperationalVisibleText(selectedGroup.description)}</p> : null}
                    </div>
                    <div className="text-right text-xs text-[color:var(--color-muted)]">
                      <p>{selectedGroup.active_tenant_member_count} conta(s)</p>
                      <p>{selectedGroup.active_brand_member_count} marca(s)</p>
                    </div>
                  </div>

                  <form className="space-y-3 rounded-[18px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)] p-3" onSubmit={handleAddMember}>
                    <div>
                      <p className="text-[0.92rem] font-semibold text-[color:var(--color-ink)]">Adicionar membro</p>
                      <p className="mt-1 text-xs text-[color:var(--color-muted)]">Uma marca pode ser representada sem criar uma conta contratual própria.</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Tipo de membro">
                        <SelectInput onChange={(event) => setMemberForm((current) => ({ ...current, memberKind: event.target.value as CustomerGroupMemberKind, tenantId: '', memberName: '' }))} value={memberForm.memberKind}>
                          {CUSTOMER_GROUP_MEMBER_KINDS.map((kind) => <option key={kind} value={kind}>{MEMBER_KIND_LABELS[kind]}</option>)}
                        </SelectInput>
                      </Field>
                      <Field label="Relacionamento">
                        <SelectInput onChange={(event) => setMemberForm((current) => ({ ...current, relationship: event.target.value as CustomerGroupMemberRelationship }))} value={memberForm.relationship}>
                          {CUSTOMER_GROUP_MEMBER_RELATIONSHIPS.map((relationship) => <option key={relationship} value={relationship}>{RELATIONSHIP_LABELS[relationship]}</option>)}
                        </SelectInput>
                      </Field>
                    </div>
                    {memberForm.memberKind === 'tenant' ? (
                      <Field label="Conta operacional">
                        <SelectInput onChange={(event) => setMemberForm((current) => ({ ...current, tenantId: event.target.value }))} value={memberForm.tenantId}>
                          <option value="">Selecione uma conta</option>
                          {tenants.map((tenant) => <option key={tenant.id} value={tenant.id}>{tenant.display_name} · {tenant.slug}</option>)}
                        </SelectInput>
                      </Field>
                    ) : (
                      <Field label="Nome da marca">
                        <TextInput onChange={(event) => setMemberForm((current) => ({ ...current, memberName: event.target.value }))} placeholder="Marca atendida" value={memberForm.memberName} />
                      </Field>
                    )}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Sistema de origem">
                        <TextInput onChange={(event) => setMemberForm((current) => ({ ...current, sourceSystem: event.target.value }))} placeholder="manual, hubspot ou omie" value={memberForm.sourceSystem} />
                      </Field>
                      <Field label="Identificador externo">
                        <TextInput onChange={(event) => setMemberForm((current) => ({ ...current, sourceExternalId: event.target.value }))} placeholder="Opcional" value={memberForm.sourceExternalId} />
                      </Field>
                    </div>
                    {memberForm.memberKind === 'tenant' ? (
                      <label className="flex items-center gap-2 text-sm text-[color:var(--color-ink)]">
                        <input checked={memberForm.isPrimary} onChange={(event) => setMemberForm((current) => ({ ...current, isPrimary: event.target.checked }))} type="checkbox" />
                        Usar como grupo principal desta conta
                      </label>
                    ) : null}
                    <Field label="Nota interna">
                      <TextareaInput onChange={(event) => setMemberForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Observação operacional segura" rows={2} value={memberForm.notes} />
                    </Field>
                    <AppButton disabled={submitting || selectedGroup.status !== 'active'} type="submit">{submitting ? 'Salvando...' : 'Adicionar membro'}</AppButton>
                  </form>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[0.92rem] font-semibold text-[color:var(--color-ink)]">Membros do agrupamento</p>
                      <StatusPill>{selectedGroup.members.filter((member) => member.status === 'active').length}</StatusPill>
                    </div>
                    {selectedGroup.members.length === 0 ? (
                      <EmptyState description="Adicione uma conta ou marca para construir o relacionamento." title="Nenhum membro" />
                    ) : (
                      selectedGroup.members.map((member) => (
                        <div className="rounded-[16px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)] p-3" key={member.id}>
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-semibold text-[color:var(--color-ink)]">{sanitizeOperationalVisibleText(groupMemberName(member))}</p>
                                {member.is_primary ? <StatusPill tone="accent">Principal</StatusPill> : null}
                                <StatusPill>{MEMBER_KIND_LABELS[member.member_kind]}</StatusPill>
                                <StatusPill tone={member.status === 'active' ? 'positive' : 'default'}>{groupStatusLabel(member.status)}</StatusPill>
                              </div>
                              <p className="mt-1 text-xs text-[color:var(--color-muted)]">{RELATIONSHIP_LABELS[member.relationship]} · Origem: {sanitizeOperationalVisibleText(member.source_system)}</p>
                              {member.notes ? <p className="mt-1 text-xs text-[color:var(--color-muted)]">{sanitizeOperationalVisibleText(member.notes)}</p> : null}
                            </div>
                            {member.status === 'active' ? <GhostButton className="min-h-8 px-3 text-xs" disabled={submitting} onClick={() => void handleArchiveMember(member.id)} type="button">Arquivar vínculo</GhostButton> : null}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <EmptyState description="Selecione um agrupamento ou crie o primeiro grupo." title="Nenhum grupo selecionado" />
              )}
            </section>
          </div>
        ) : null}
      </div>
    </GovernedActionDrawer>
  );
}
