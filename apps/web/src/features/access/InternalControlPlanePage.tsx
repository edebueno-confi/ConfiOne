import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { formatDateTime } from '../../app/format';
import { EmptyState, ErrorState, LoadingState } from '../../components/states';
import {
  AppButton,
  GhostButton,
  InlineNotice,
  Panel,
  SelectInput,
  StatusPill,
  TextareaInput,
  TextInput,
} from '../../components/ui';
import {
  createAdminInternalAccessArea,
  createAdminInternalFunction,
  createAdminInternalInvitation,
  createAdminAccessProfile,
  getAdminInternalAccessUser,
  listAdminAccessCapabilities,
  listAdminAccessProfileCapabilities,
  listAdminAccessProfiles,
  listAdminInternalAccessAreas,
  listAdminInternalAccessUsers,
  listAdminInternalMembershipScreenGrants,
  listAdminInternalScreenCatalog,
  listAdminInternalAccessProfileScreenGrants,
  listAdminInternalFunctions,
  listAdminInternalInvites,
  listAdminInternalOverrides,
  removeAdminInternalOverride,
  revokeAdminInternalInvitation,
  setAdminInternalUserStatus,
  updateAdminInternalAccessArea,
  updateAdminInternalAccessAssignment,
  updateAdminInternalFunction,
  updateAdminAccessProfile,
  replaceAdminAccessProfileCapabilities,
  replaceInternalMembershipScreens,
  replaceAdminInternalAccessProfileScreens,
  upsertAdminInternalOverride,
} from '../admin/admin-api';
import type {
  AdminInternalAccessAreaRow,
  AdminInternalAccessUserRow,
  AdminInternalFunctionRow,
  AdminInternalInviteRow,
  AdminInternalOverrideRow,
  AdminInternalProfileRow,
  AdminInternalMembershipScreenGrantRow,
  AdminInternalScreenCatalogRow,
} from '../../contracts/admin-contracts';
import { classifyAdminError } from '../admin/admin-errors';
import { useAuthContext } from '../auth/auth-context';

type Tab = 'users' | 'invites' | 'structure' | 'permissions';
type LoadPhase = 'loading' | 'ready' | 'error' | 'denied';

const tabs: Array<{ key: Tab; label: string }> = [
  { key: 'users', label: 'Usuários' },
  { key: 'invites', label: 'Convites' },
  { key: 'structure', label: 'Estrutura' },
  { key: 'permissions', label: 'Perfis' },
];

function statusLabel(status: string) {
  return ({ active: 'Ativo', suspended: 'Suspenso', inactive: 'Inativo', pending: 'Pendente', sent: 'Enviado', accepted: 'Aceito', expired: 'Expirado', revoked: 'Revogado', failed: 'Falhou' } as Record<string, string>)[status] ?? status;
}

function statusTone(status: string) {
  if (status === 'active' || status === 'accepted') return 'positive' as const;
  if (status === 'pending' || status === 'sent') return 'warning' as const;
  if (status === 'suspended' || status === 'revoked' || status === 'failed') return 'critical' as const;
  return 'default' as const;
}

function fieldLabel(label: string, children: React.ReactNode) {
  return <label className="grid gap-1.5"><span className="text-xs font-medium text-[color:var(--minimal-text-secondary)]">{label}</span>{children}</label>;
}

function firstOrMatchingArea(user: AdminInternalAccessUserRow, areaKey?: string) {
  return user.areas.find((area) => !areaKey || String(area.area_key ?? '') === areaKey) ?? user.areas[0] ?? {};
}

export function InternalControlPlanePage() {
  const { markSessionExpired } = useAuthContext();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [phase, setPhase] = useState<LoadPhase>('loading');
  const [message, setMessage] = useState<{ text: string; tone?: 'positive' | 'warning' | 'critical' } | null>(null);
  const [tab, setTab] = useState<Tab>(() => {
    const candidate = searchParams.get('tab');
    return candidate === 'invites' || candidate === 'structure' || candidate === 'permissions' ? candidate : 'users';
  });

  useEffect(() => {
    const candidate = searchParams.get('tab');
    if (candidate === 'users' || candidate === 'invites' || candidate === 'structure' || candidate === 'permissions') setTab(candidate);
  }, [searchParams]);

  const selectTab = (next: Tab) => {
    setTab(next);
    const params = new URLSearchParams(searchParams);
    params.set('tab', next);
    setSearchParams(params, { replace: true });
  };
  const [users, setUsers] = useState<AdminInternalAccessUserRow[]>([]);
  const [invites, setInvites] = useState<AdminInternalInviteRow[]>([]);
  const [areas, setAreas] = useState<AdminInternalAccessAreaRow[]>([]);
  const [functions, setFunctions] = useState<AdminInternalFunctionRow[]>([]);
  const [profiles, setProfiles] = useState<AdminInternalProfileRow[]>([]);
  const [capabilities, setCapabilities] = useState<Array<{ capability_key: string; display_name: string; description: string | null; domain: string; is_active: boolean }>>([]);
  const [profileCapabilities, setProfileCapabilities] = useState<Array<{ access_profile_id: string; capability_key: string }>>([]);
  const [overrides, setOverrides] = useState<AdminInternalOverrideRow[]>([]);
  const [screenCatalog, setScreenCatalog] = useState<AdminInternalScreenCatalogRow[]>([]);
  const [screenGrants, setScreenGrants] = useState<AdminInternalMembershipScreenGrantRow[]>([]);
  const [profileScreenGrants, setProfileScreenGrants] = useState<Array<{ access_profile_id: string; screen_key: AdminInternalScreenCatalogRow['screen_key'] }>>([]);
  const [query, setQuery] = useState('');
  const [userAreaFilter, setUserAreaFilter] = useState('');
  const [userFunctionFilter, setUserFunctionFilter] = useState('');
  const [userProfileFilter, setUserProfileFilter] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminInternalAccessUserRow | null>(null);
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [busy, setBusy] = useState(false);
  const [inviteForm, setInviteForm] = useState({ fullName: '', email: '', areaKey: '', functionId: '', profileId: '', days: '7' });
  const [areaForm, setAreaForm] = useState({ areaKey: '', displayName: '', description: '' });
  const [functionForm, setFunctionForm] = useState({ areaKey: '', name: '', description: '', profileId: '' });
  const [assignment, setAssignment] = useState({ areaKey: '', functionId: '', profileId: '' });
  const [overrideForm, setOverrideForm] = useState({ capabilityKey: '', effect: 'allow' as 'allow' | 'deny', justification: '' });
  const [profileForm, setProfileForm] = useState({ name: '', description: '' });

  async function load() {
    setPhase('loading');
    try {
      const [nextUsers, nextInvites, nextAreas, nextFunctions, nextProfiles, nextCapabilities, nextProfileCapabilities, nextOverrides, nextScreens, nextGrants, nextProfileGrants] = await Promise.all([
        listAdminInternalAccessUsers(), listAdminInternalInvites(), listAdminInternalAccessAreas(), listAdminInternalFunctions(), listAdminAccessProfiles(), listAdminAccessCapabilities(), listAdminAccessProfileCapabilities(), listAdminInternalOverrides(), listAdminInternalScreenCatalog(), listAdminInternalMembershipScreenGrants(), listAdminInternalAccessProfileScreenGrants(),
      ]);
      setUsers(nextUsers); setInvites(nextInvites); setAreas(nextAreas); setFunctions(nextFunctions); setProfiles(nextProfiles); setCapabilities(nextCapabilities); setProfileCapabilities(nextProfileCapabilities); setOverrides(nextOverrides); setScreenCatalog(nextScreens); setScreenGrants(nextGrants); setProfileScreenGrants(nextProfileGrants);
      setInviteForm((current) => ({ ...current, areaKey: current.areaKey || nextAreas[0]?.area_key || '' }));
      setFunctionForm((current) => ({ ...current, areaKey: current.areaKey || nextAreas[0]?.area_key || '' }));
      setPhase('ready');
    } catch (error) {
      const classified = classifyAdminError(error, 'Não foi possível carregar a gestão de acessos.');
      if (classified.kind === 'session-expired') { markSessionExpired(); return; }
      setPhase(classified.kind === 'permission-denied' ? 'denied' : 'error');
      setMessage({ text: classified.message, tone: 'critical' });
    }
  }

  useEffect(() => { void load(); }, []);

  const filteredUsers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return users.filter((user) => {
      const textMatches = !normalized || `${user.full_name ?? ''} ${user.email ?? ''} ${user.platform_roles.join(' ')} ${user.access_status}`.toLowerCase().includes(normalized);
      const areaMatches = user.areas.some((area) =>
        (!userAreaFilter || String(area.area_key ?? '') === userAreaFilter) &&
        (!userFunctionFilter || String(area.function_id ?? '') === userFunctionFilter) &&
        (!userProfileFilter || String(area.access_profile_id ?? '') === userProfileFilter),
      );
      return textMatches && areaMatches && (!userStatusFilter || user.access_status === userStatusFilter);
    });
  }, [query, users, userAreaFilter, userFunctionFilter, userProfileFilter, userStatusFilter]);

  async function runAction(action: () => Promise<unknown>, success: string) {
    setBusy(true); setMessage(null);
    try { await action(); setMessage({ text: success, tone: 'positive' }); await load(); }
    catch (error) { const classified = classifyAdminError(error, 'Não foi possível concluir a ação.'); setMessage({ text: classified.message, tone: 'critical' }); }
    finally { setBusy(false); }
  }

  async function openUser(user: AdminInternalAccessUserRow) {
    setSelectedUser(user); setAssignment({ areaKey: String((user.areas[0]?.area_key as string | undefined) ?? ''), functionId: String((user.areas[0]?.function_id as string | undefined) ?? ''), profileId: String((user.areas[0]?.access_profile_id as string | undefined) ?? '') });
    try { setDetail(await getAdminInternalAccessUser(user.user_id)); } catch { setDetail(null); }
  }

  async function submitInvite(event: React.FormEvent) {
    event.preventDefault();
    const expiresAt = new Date(Date.now() + Number(inviteForm.days || 7) * 86400000).toISOString();
    await runAction(() => createAdminInternalInvitation({ email: inviteForm.email, fullName: inviteForm.fullName, areaKey: inviteForm.areaKey, functionId: inviteForm.functionId || null, accessProfileId: inviteForm.profileId || null, expiresAt }), 'Convite preparado para envio.');
    setInviteForm((current) => ({ ...current, fullName: '', email: '', functionId: '', profileId: '' }));
  }

  if (phase === 'loading') return <LoadingState title="Preparando acessos e áreas" description="Estamos organizando usuários, equipes e permissões." />;
  if (phase === 'denied') return <ErrorState title="Acesso não autorizado" description="Sua conta não pode administrar os acessos internos." />;
  if (phase === 'error') return <ErrorState description={message?.text ?? 'Não foi possível carregar esta área agora.'} action={<GhostButton onClick={() => void load()}>Tentar novamente</GhostButton>} />;

  const activeUsers = users.filter((user) => user.access_status === 'active').length;
  const suspendedUsers = users.filter((user) => user.access_status === 'suspended').length;
  const pendingInvites = invites.filter((invite) => invite.status === 'pending' || invite.status === 'sent').length;

  return (
    <div className="gso-screen-frame gso-access-hd flex h-full min-h-0 flex-col gap-4 overflow-y-auto bg-[color:var(--minimal-surface)] p-4 sm:p-6">
      <nav className="gso-access-breadcrumb flex items-center gap-2 text-sm" aria-label="Trilha de navegação">
        <button type="button" onClick={() => navigate('/admin/settings')} className="text-[color:var(--minimal-action)] hover:underline">Configurações</button>
        <span aria-hidden="true" className="text-[color:var(--minimal-text-tertiary)]">/</span>
        <span aria-current="page" className="font-medium text-[color:var(--minimal-text)]">Usuários e acesso</span>
      </nav>
      <header className="gso-access-page-header flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] px-5 py-5">
        <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--minimal-text-tertiary)]">Gestão interna</p><h1 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-[color:var(--minimal-text)]">Acessos e áreas</h1><p className="mt-1 max-w-2xl text-sm text-[color:var(--minimal-text-secondary)]">Administre colaboradores internos, convites, funções e permissões efetivas.</p></div>
        <AppButton onClick={() => selectTab('invites')}>Convidar usuário</AppButton>
      </header>
      <div className="grid gap-3 sm:grid-cols-3"><Metric label="Usuários ativos" value={activeUsers} hint="acesso liberado" /><Metric label="Convites pendentes" value={pendingInvites} hint="aguardando envio" /><Metric label="Usuários suspensos" value={suspendedUsers} hint="acesso pausado" /></div>
      {message ? <InlineNotice tone={message.tone}>{message.text}</InlineNotice> : null}
      <nav className="flex gap-1 overflow-x-auto rounded-xl border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface-muted)] p-1" aria-label="Seções de acessos">
        {tabs.map((item) => <button className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${tab === item.key ? 'bg-[color:var(--minimal-surface)] text-[color:var(--minimal-text)] shadow-sm' : 'text-[color:var(--minimal-text-secondary)]'}`} key={item.key} onClick={() => selectTab(item.key)} type="button">{item.label}</button>)}
      </nav>
      {tab === 'users' ? <UsersPanel users={filteredUsers} query={query} setQuery={setQuery} filters={{ area: userAreaFilter, functionId: userFunctionFilter, profile: userProfileFilter, status: userStatusFilter }} setFilters={{ setArea: setUserAreaFilter, setFunctionId: setUserFunctionFilter, setProfile: setUserProfileFilter, setStatus: setUserStatusFilter }} selectedUser={selectedUser} detail={detail} assignment={assignment} setAssignment={setAssignment} areas={areas} functions={functions} profiles={profiles} capabilities={capabilities} overrides={overrides.filter((item) => item.user_id === selectedUser?.user_id)} overrideForm={overrideForm} setOverrideForm={setOverrideForm} onSelect={openUser} onRefresh={() => void load()} onAction={runAction} busy={busy} /> : null}
      {tab === 'invites' ? <InvitesPanel invites={invites} areas={areas} functions={functions} profiles={profiles} form={inviteForm} setForm={setInviteForm} onSubmit={submitInvite} onRevoke={(id) => void runAction(() => revokeAdminInternalInvitation(id), 'Convite revogado.')} busy={busy} /> : null}
      {tab === 'structure' ? <StructurePanel areas={areas} functions={functions} profiles={profiles} areaForm={areaForm} setAreaForm={setAreaForm} functionForm={functionForm} setFunctionForm={setFunctionForm} onCreateArea={() => void runAction(() => createAdminInternalAccessArea(areaForm), 'Área criada.')} onToggleArea={(area) => void runAction(() => updateAdminInternalAccessArea({ areaKey: area.area_key, displayName: area.display_name, description: area.description ?? '', isActive: !area.is_active, managerUserId: area.manager_user_id }), 'Área atualizada.')} onCreateFunction={() => void runAction(() => createAdminInternalFunction({ areaKey: functionForm.areaKey, name: functionForm.name, description: functionForm.description, defaultAccessProfileId: functionForm.profileId || null }), 'Função criada.')} onToggleFunction={(item) => void runAction(() => updateAdminInternalFunction({ functionId: item.function_id, name: item.name, description: item.description ?? '', defaultAccessProfileId: item.default_access_profile_id, isActive: !item.is_active }), 'Função atualizada.')} busy={busy} /> : null}
      {tab === 'permissions' ? <><PermissionsCapabilityPanel profiles={profiles} capabilities={capabilities} profileCapabilities={profileCapabilities} profileForm={profileForm} setProfileForm={setProfileForm} onCreate={() => void runAction(() => createAdminAccessProfile(profileForm), 'Perfil criado.')} onToggle={(profile) => void runAction(() => updateAdminAccessProfile({ profileId: profile.access_profile_id, name: profile.name, description: profile.description ?? '', isActive: !profile.is_active }), 'Perfil atualizado.')} onSaveCapabilities={(profileId, keys) => void runAction(() => replaceAdminAccessProfileCapabilities(profileId, keys), 'Permissões do perfil atualizadas.')} busy={busy} /><ProfileScreenAccessPanel profiles={profiles} catalog={screenCatalog} grants={profileScreenGrants} onSave={(profileId, keys) => void runAction(async () => { await replaceAdminInternalAccessProfileScreens(profileId, keys); setProfileScreenGrants(await listAdminInternalAccessProfileScreenGrants()); }, 'Telas do perfil atualizadas.')} busy={busy} /><ScreenAccessPanel users={users} catalog={screenCatalog} grants={screenGrants} onSave={(membershipId, keys) => void runAction(async () => { await replaceInternalMembershipScreens({ membershipId, screenKeys: keys }); setScreenGrants(await listAdminInternalMembershipScreenGrants()); }, 'Telas da área atualizadas.')} busy={busy} /></> : null}
    </div>
  );
}

function Metric({ label, value, hint }: { label: string; value: number; hint: string }) { return <div className="rounded-xl border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] px-4 py-3"><p className="text-2xl font-semibold text-[color:var(--minimal-text)]">{value}</p><p className="mt-1 text-sm font-medium text-[color:var(--minimal-text)]">{label}</p><p className="text-xs text-[color:var(--minimal-text-tertiary)]">{hint}</p></div>; }

function UsersPanel(props: { users: AdminInternalAccessUserRow[]; query: string; setQuery: (value: string) => void; filters: { area: string; functionId: string; profile: string; status: string }; setFilters: { setArea: (value: string) => void; setFunctionId: (value: string) => void; setProfile: (value: string) => void; setStatus: (value: string) => void }; selectedUser: AdminInternalAccessUserRow | null; detail: Record<string, unknown> | null; assignment: { areaKey: string; functionId: string; profileId: string }; setAssignment: React.Dispatch<React.SetStateAction<{ areaKey: string; functionId: string; profileId: string }>>; areas: AdminInternalAccessAreaRow[]; functions: AdminInternalFunctionRow[]; profiles: AdminInternalProfileRow[]; capabilities: Array<{ capability_key: string; display_name: string; description: string | null; domain: string; is_active: boolean }>; overrides: AdminInternalOverrideRow[]; overrideForm: { capabilityKey: string; effect: 'allow' | 'deny'; justification: string }; setOverrideForm: React.Dispatch<React.SetStateAction<{ capabilityKey: string; effect: 'allow' | 'deny'; justification: string }>>; onSelect: (user: AdminInternalAccessUserRow) => void; onRefresh: () => void; onAction: (action: () => Promise<unknown>, success: string) => Promise<void>; busy: boolean }) {
  const { users, query, setQuery, filters, setFilters, selectedUser, detail, assignment, setAssignment, areas, functions, profiles, capabilities, overrides, overrideForm, setOverrideForm, onSelect, onRefresh, onAction, busy } = props;
  const visibleFunctions = functions.filter((item) => !assignment.areaKey || item.area_key === assignment.areaKey);
  return <Panel title="Usuários internos" description="Gerencie quem pode entrar na plataforma e quais áreas cada pessoa pode acessar." actions={<div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5"><TextInput aria-label="Buscar usuário" onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nome ou e-mail" value={query} /><SelectInput aria-label="Filtrar por área" value={filters.area} onChange={(event) => setFilters.setArea(event.target.value)}><option value="">Todas as áreas</option>{areas.map((area) => <option key={area.area_key} value={area.area_key}>{area.display_name}</option>)}</SelectInput><SelectInput aria-label="Filtrar por função" value={filters.functionId} onChange={(event) => setFilters.setFunctionId(event.target.value)}><option value="">Todas as funções</option>{functions.map((item) => <option key={item.function_id} value={item.function_id}>{item.name}</option>)}</SelectInput><SelectInput aria-label="Filtrar por perfil" value={filters.profile} onChange={(event) => setFilters.setProfile(event.target.value)}><option value="">Todos os perfis</option>{profiles.map((profile) => <option key={profile.access_profile_id} value={profile.access_profile_id}>{profile.name}</option>)}</SelectInput><SelectInput aria-label="Filtrar por status" value={filters.status} onChange={(event) => setFilters.setStatus(event.target.value)}><option value="">Todos os status</option><option value="active">Ativo</option><option value="suspended">Suspenso</option><option value="inactive">Inativo</option></SelectInput></div>}>
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(300px,360px)]">
      <div className="overflow-x-auto rounded-xl border border-[color:var(--minimal-border)]"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-[color:var(--minimal-surface-muted)] text-xs text-[color:var(--minimal-text-secondary)]"><tr><th className="px-3 py-2">Usuário</th><th className="px-3 py-2">Área</th><th className="px-3 py-2">Função</th><th className="px-3 py-2">Perfil</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Último acesso</th><th className="px-3 py-2">Ação</th></tr></thead><tbody>{users.map((user) => { const area = user.areas[0] ?? {}; return <tr className="border-t border-[color:var(--minimal-border)]" key={user.user_id}><td className="px-3 py-3"><button className="text-left font-medium text-[color:var(--minimal-action)]" onClick={() => onSelect(user)} type="button">{user.full_name || 'Sem nome'}</button><p className="text-xs text-[color:var(--minimal-text-tertiary)]">{user.email || 'E-mail indisponível'}</p></td><td className="px-3 py-3">{String(area.area_label ?? 'Sem área')}</td><td className="px-3 py-3">{String(area.function_name ?? 'Sem função')}</td><td className="px-3 py-3">{String(area.access_profile_name ?? 'Personalizado')}</td><td className="px-3 py-3"><StatusPill tone={statusTone(user.access_status)}>{statusLabel(user.access_status)}</StatusPill></td><td className="px-3 py-3 text-xs text-[color:var(--minimal-text-secondary)]">{user.last_access_at ? formatDateTime(user.last_access_at) : 'Nunca acessou'}</td><td className="px-3 py-3"><GhostButton disabled={busy} onClick={() => void onAction(() => setAdminInternalUserStatus(user.user_id, user.access_status !== 'active'), user.access_status === 'active' ? 'Usuário suspenso.' : 'Usuário reativado.')}>{user.access_status === 'active' ? 'Suspender' : 'Reativar'}</GhostButton></td></tr>; })}</tbody></table>{users.length === 0 ? <EmptyState title="Nenhum usuário interno" description="Somente identidades com contexto interno aparecem aqui. Quando um colaborador tiver esse contexto, ele aparecerá nesta lista." /> : null}</div>
      {selectedUser ? <div className="rounded-xl border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface-muted)] p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold text-[color:var(--minimal-text)]">{selectedUser.full_name || 'Usuário interno'}</h3><p className="text-xs text-[color:var(--minimal-text-secondary)]">{selectedUser.email}</p></div><StatusPill tone={statusTone(selectedUser.access_status)}>{statusLabel(selectedUser.access_status)}</StatusPill></div><div className="mt-4 grid gap-3">{fieldLabel('Área', <SelectInput value={assignment.areaKey} onChange={(event) => setAssignment((current) => ({ ...current, areaKey: event.target.value, functionId: '' }))}>{areas.filter((area) => area.is_active).map((area) => <option key={area.area_key} value={area.area_key}>{area.display_name}</option>)}</SelectInput>)}{fieldLabel('Função', <SelectInput value={assignment.functionId} onChange={(event) => setAssignment((current) => ({ ...current, functionId: event.target.value }))}><option value="">Sem função</option>{visibleFunctions.map((item) => <option key={item.function_id} value={item.function_id}>{item.name}</option>)}</SelectInput>)}{fieldLabel('Perfil', <SelectInput value={assignment.profileId} onChange={(event) => setAssignment((current) => ({ ...current, profileId: event.target.value }))}><option value="">Personalizado</option>{profiles.filter((profile) => profile.is_active).map((profile) => <option key={profile.access_profile_id} value={profile.access_profile_id}>{profile.name}</option>)}</SelectInput>)}<AppButton disabled={busy || !assignment.areaKey} onClick={() => void onAction(() => updateAdminInternalAccessAssignment({ userId: selectedUser.user_id, areaKey: assignment.areaKey, functionId: assignment.functionId || null, accessProfileId: assignment.profileId || null }), 'Atribuição atualizada.')}>Salvar atribuição</AppButton></div><div className="mt-5 border-t border-[color:var(--minimal-border)] pt-4"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--minimal-text-tertiary)]">Resultado efetivo</p><p className="mt-1 text-xs text-[color:var(--minimal-text-secondary)]">{Array.isArray(detail?.capabilities) ? `${detail?.capabilities.length} capacidades liberadas pelo backend.` : 'Carregando capacidades…'}</p><p className="mt-1 text-xs text-[color:var(--minimal-text-tertiary)]">{selectedUser.override_count} override(s) auditável(is).</p></div><div className="mt-5 border-t border-[color:var(--minimal-border)] pt-4"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--minimal-text-tertiary)]">Overrides atuais</p>{overrides.length === 0 ? <p className="mt-2 text-xs text-[color:var(--minimal-text-secondary)]">Nenhum override individual.</p> : <div className="mt-2 grid gap-2">{overrides.map((item) => <div className="flex items-center justify-between gap-2 rounded-lg border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] px-2 py-2 text-xs" key={item.override_id}><span>{item.capability_name} · {item.effect === 'allow' ? 'conceder' : 'bloquear'}</span><GhostButton onClick={() => void onAction(() => removeAdminInternalOverride(item.override_id), 'Override removido.')}>Remover</GhostButton></div>)}</div>}{fieldLabel('Capacidade', <SelectInput value={overrideForm.capabilityKey} onChange={(event) => setOverrideForm((current) => ({ ...current, capabilityKey: event.target.value }))}><option value="">Selecione uma capacidade</option>{capabilities.map((capability) => <option key={capability.capability_key} value={capability.capability_key}>{capability.display_name} · {capability.domain}</option>)}</SelectInput>)}{fieldLabel('Efeito', <SelectInput value={overrideForm.effect} onChange={(event) => setOverrideForm((current) => ({ ...current, effect: event.target.value as 'allow' | 'deny' }))}><option value="allow">Conceder</option><option value="deny">Bloquear</option></SelectInput>)}{fieldLabel('Justificativa', <TextareaInput onChange={(event) => setOverrideForm((current) => ({ ...current, justification: event.target.value }))} value={overrideForm.justification} />)}<GhostButton disabled={busy || !overrideForm.capabilityKey || !overrideForm.justification} onClick={() => void onAction(() => upsertAdminInternalOverride({ userId: selectedUser.user_id, capabilityKey: overrideForm.capabilityKey, effect: overrideForm.effect, justification: overrideForm.justification }), 'Override salvo.')}>Salvar override</GhostButton></div></div> : <EmptyState title="Selecione um usuário" description="Abra um registro para editar área, função, perfil e overrides auditáveis." />}
    </div>
  </Panel>;
}

function InvitesPanel(props: { invites: AdminInternalInviteRow[]; areas: AdminInternalAccessAreaRow[]; functions: AdminInternalFunctionRow[]; profiles: AdminInternalProfileRow[]; form: { fullName: string; email: string; areaKey: string; functionId: string; profileId: string; days: string }; setForm: React.Dispatch<React.SetStateAction<{ fullName: string; email: string; areaKey: string; functionId: string; profileId: string; days: string }>>; onSubmit: (event: React.FormEvent) => Promise<void>; onRevoke: (id: string) => void; busy: boolean }) {
  const { invites, areas, functions, profiles, form, setForm, onSubmit, onRevoke, busy } = props;
  return <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]"><Panel title="Convites" description="Tokens não são retornados nas listagens. O envio externo será conectado pelo provedor oficial quando autorizado."><div className="overflow-x-auto rounded-xl border border-[color:var(--minimal-border)]"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-[color:var(--minimal-surface-muted)] text-xs"><tr><th className="px-3 py-2">Pessoa</th><th className="px-3 py-2">Área</th><th className="px-3 py-2">Perfil</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Ação</th></tr></thead><tbody>{invites.map((invite) => <tr className="border-t border-[color:var(--minimal-border)]" key={invite.invite_id}><td className="px-3 py-3">{invite.full_name}<p className="text-xs text-[color:var(--minimal-text-tertiary)]">{invite.email}</p></td><td className="px-3 py-3">{invite.area_label}</td><td className="px-3 py-3">{invite.access_profile_name || 'Personalizado'}</td><td className="px-3 py-3"><StatusPill tone={statusTone(invite.status)}>{statusLabel(invite.status)}</StatusPill></td><td className="px-3 py-3">{invite.status === 'pending' || invite.status === 'sent' ? <GhostButton disabled={busy} onClick={() => onRevoke(invite.invite_id)}>Revogar</GhostButton> : null}</td></tr>)}</tbody></table>{invites.length === 0 ? <EmptyState title="Nenhum convite" description="Convites preparados aparecerão aqui sem expor tokens." /> : null}</div></Panel><Panel title="Preparar convite" description="A operação cria o registro auditável e aguarda o canal de entrega autorizado."><form className="grid gap-3" onSubmit={(event) => void onSubmit(event)}>{fieldLabel('Nome', <TextInput required value={form.fullName} onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))} />)}{fieldLabel('E-mail', <TextInput required type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />)}{fieldLabel('Área', <SelectInput required value={form.areaKey} onChange={(event) => setForm((current) => ({ ...current, areaKey: event.target.value, functionId: '' }))}>{areas.filter((area) => area.is_active).map((area) => <option key={area.area_key} value={area.area_key}>{area.display_name}</option>)}</SelectInput>)}{fieldLabel('Função', <SelectInput value={form.functionId} onChange={(event) => setForm((current) => ({ ...current, functionId: event.target.value }))}><option value="">Sem função</option>{functions.filter((item) => item.is_active && item.area_key === form.areaKey).map((item) => <option key={item.function_id} value={item.function_id}>{item.name}</option>)}</SelectInput>)}{fieldLabel('Perfil', <SelectInput value={form.profileId} onChange={(event) => setForm((current) => ({ ...current, profileId: event.target.value }))}><option value="">Personalizado</option>{profiles.filter((profile) => profile.is_active).map((profile) => <option key={profile.access_profile_id} value={profile.access_profile_id}>{profile.name}</option>)}</SelectInput>)}{fieldLabel('Validade (dias)', <TextInput min="1" max="30" type="number" value={form.days} onChange={(event) => setForm((current) => ({ ...current, days: event.target.value }))} />)}<AppButton disabled={busy} type="submit">Preparar convite</AppButton></form></Panel></div>;
}

function StructurePanel(props: { areas: AdminInternalAccessAreaRow[]; functions: AdminInternalFunctionRow[]; profiles: AdminInternalProfileRow[]; areaForm: { areaKey: string; displayName: string; description: string }; setAreaForm: React.Dispatch<React.SetStateAction<{ areaKey: string; displayName: string; description: string }>>; functionForm: { areaKey: string; name: string; description: string; profileId: string }; setFunctionForm: React.Dispatch<React.SetStateAction<{ areaKey: string; name: string; description: string; profileId: string }>>; onCreateArea: () => void; onToggleArea: (area: AdminInternalAccessAreaRow) => void; onCreateFunction: () => void; onToggleFunction: (item: AdminInternalFunctionRow) => void; busy: boolean }) {
  const { areas, functions, profiles, areaForm, setAreaForm, functionForm, setFunctionForm, onCreateArea, onToggleArea, onCreateFunction, onToggleFunction, busy } = props;
  return <div className="grid gap-4 xl:grid-cols-2"><Panel title="Áreas" description="Catálogo organizacional separado do catálogo legado de áreas-alvo dos acionamentos."><div className="grid gap-2">{areas.map((area) => <div className="flex items-center justify-between gap-3 rounded-lg border border-[color:var(--minimal-border)] px-3 py-2" key={area.area_key}><div><p className="text-sm font-medium">{area.display_name}</p><p className="text-xs text-[color:var(--minimal-text-tertiary)]">{area.active_user_count} usuários · {area.active_function_count} funções</p></div><GhostButton disabled={busy || area.active_user_count > 0} onClick={() => onToggleArea(area)}>{area.is_active ? 'Desativar' : 'Ativar'}</GhostButton></div>)}</div><form className="mt-4 grid gap-2 border-t border-[color:var(--minimal-border)] pt-4" onSubmit={(event) => { event.preventDefault(); onCreateArea(); }}>{fieldLabel('Chave', <TextInput pattern="[a-z0-9_]+" required value={areaForm.areaKey} onChange={(event) => setAreaForm((current) => ({ ...current, areaKey: event.target.value }))} />)}{fieldLabel('Nome', <TextInput required value={areaForm.displayName} onChange={(event) => setAreaForm((current) => ({ ...current, displayName: event.target.value }))} />)}{fieldLabel('Descrição', <TextareaInput value={areaForm.description} onChange={(event) => setAreaForm((current) => ({ ...current, description: event.target.value }))} />)}<AppButton disabled={busy} type="submit">Criar área</AppButton></form></Panel><Panel title="Funções" description="Funções organizam o trabalho e podem apontar para um perfil padrão."><div className="grid gap-2">{functions.map((item) => <div className="flex items-center justify-between gap-3 rounded-lg border border-[color:var(--minimal-border)] px-3 py-2" key={item.function_id}><div><p className="text-sm font-medium">{item.name}</p><p className="text-xs text-[color:var(--minimal-text-tertiary)]">{item.area_label} · {item.default_access_profile_name || 'sem perfil padrão'}</p></div><GhostButton disabled={busy} onClick={() => onToggleFunction(item)}>{item.is_active ? 'Desativar' : 'Ativar'}</GhostButton></div>)}</div><form className="mt-4 grid gap-2 border-t border-[color:var(--minimal-border)] pt-4" onSubmit={(event) => { event.preventDefault(); onCreateFunction(); }}>{fieldLabel('Área', <SelectInput required value={functionForm.areaKey} onChange={(event) => setFunctionForm((current) => ({ ...current, areaKey: event.target.value }))}>{areas.filter((area) => area.is_active).map((area) => <option key={area.area_key} value={area.area_key}>{area.display_name}</option>)}</SelectInput>)}{fieldLabel('Nome', <TextInput required value={functionForm.name} onChange={(event) => setFunctionForm((current) => ({ ...current, name: event.target.value }))} />)}{fieldLabel('Descrição', <TextareaInput value={functionForm.description} onChange={(event) => setFunctionForm((current) => ({ ...current, description: event.target.value }))} />)}{fieldLabel('Perfil padrão', <SelectInput value={functionForm.profileId} onChange={(event) => setFunctionForm((current) => ({ ...current, profileId: event.target.value }))}><option value="">Sem perfil padrão</option>{profiles.filter((profile) => profile.is_active).map((profile) => <option key={profile.access_profile_id} value={profile.access_profile_id}>{profile.name}</option>)}</SelectInput>)}<AppButton disabled={busy} type="submit">Criar função</AppButton></form></Panel></div>;
}

function PermissionsCapabilityPanel(props: { profiles: AdminInternalProfileRow[]; capabilities: Array<{ capability_key: string; display_name: string; description: string | null; domain: string; is_active: boolean }>; profileCapabilities: Array<{ access_profile_id: string; capability_key: string }>; profileForm: { name: string; description: string }; setProfileForm: React.Dispatch<React.SetStateAction<{ name: string; description: string }>>; onCreate: () => void; onToggle: (profile: AdminInternalProfileRow) => void; onSaveCapabilities: (profileId: string, keys: string[]) => void; busy: boolean }) {
  const { profiles, capabilities, profileCapabilities, profileForm, setProfileForm, onCreate, onToggle, onSaveCapabilities, busy } = props;
  const [selectedProfileId, setSelectedProfileId] = useState(profiles[0]?.access_profile_id ?? '');
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  useEffect(() => {
    if (!profiles.some((profile) => profile.access_profile_id === selectedProfileId)) setSelectedProfileId(profiles[0]?.access_profile_id ?? '');
  }, [profiles, selectedProfileId]);
  useEffect(() => {
    setSelectedKeys(profileCapabilities.filter((item) => item.access_profile_id === selectedProfileId).map((item) => item.capability_key));
  }, [profileCapabilities, selectedProfileId]);
  const toggleCapability = (key: string) => setSelectedKeys((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key]);
  const viewCapabilities = capabilities.filter((capability) => capability.capability_key.endsWith('.view'));
  const actionCapabilities = capabilities.filter((capability) => !capability.capability_key.endsWith('.view'));
  const capabilityOption = (capability: (typeof capabilities)[number]) => <label className="flex items-start gap-2 rounded-lg border border-[color:var(--minimal-border)] px-3 py-2" key={capability.capability_key}><input checked={selectedKeys.includes(capability.capability_key)} onChange={() => toggleCapability(capability.capability_key)} type="checkbox" /><span><span className="block text-sm font-medium">{capability.display_name}</span>{capability.description ? <span className="block text-xs text-[color:var(--minimal-text-tertiary)]">{capability.description}</span> : null}</span></label>;
  return <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]"><Panel title="Perfis e permissões" description="Monte perfis combinando telas de consulta e ações permitidas. As decisões efetivas continuam protegidas pela área e pelo perfil atribuído."><div className="grid gap-2">{profiles.map((profile) => <div className="rounded-xl border border-[color:var(--minimal-border)] px-4 py-3" key={profile.access_profile_id}><div className="flex items-start justify-between gap-3"><button className="text-left" onClick={() => setSelectedProfileId(profile.access_profile_id)} type="button"><p className="font-medium text-[color:var(--minimal-text)]">{profile.name}</p><p className="mt-1 text-xs text-[color:var(--minimal-text-secondary)]">{profile.user_count} usuários · {profile.capability_count} permissões · {profile.screen_count} telas</p></button><div className="flex items-center gap-2"><StatusPill tone={profile.is_active ? 'positive' : 'critical'}>{profile.is_active ? 'Ativo' : 'Inativo'}</StatusPill>{!profile.is_system ? <GhostButton disabled={busy} onClick={() => onToggle(profile)}>{profile.is_active ? 'Desativar' : 'Ativar'}</GhostButton> : null}</div></div></div>)}</div><form className="mt-4 grid gap-2 border-t border-[color:var(--minimal-border)] pt-4" onSubmit={(event) => { event.preventDefault(); onCreate(); }}>{fieldLabel('Nome do perfil', <TextInput required value={profileForm.name} onChange={(event) => setProfileForm((current) => ({ ...current, name: event.target.value }))} />)}{fieldLabel('Descrição', <TextareaInput value={profileForm.description} onChange={(event) => setProfileForm((current) => ({ ...current, description: event.target.value }))} />)}<AppButton disabled={busy} type="submit">Criar perfil personalizado</AppButton></form></Panel><Panel title="Permissões do perfil" description="Escolha primeiro as telas que a pessoa poderá consultar. Em seguida, libere somente as ações necessárias para cada área.">{fieldLabel('Perfil selecionado', <SelectInput value={selectedProfileId} onChange={(event) => setSelectedProfileId(event.target.value)}>{profiles.map((profile) => <option key={profile.access_profile_id} value={profile.access_profile_id}>{profile.name}</option>)}</SelectInput>)}<div className="mt-3 grid gap-4"><div><p className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-[color:var(--minimal-text-tertiary)]">Telas para consultar</p><div className="grid gap-2">{viewCapabilities.map(capabilityOption)}</div></div><div><p className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-[color:var(--minimal-text-tertiary)]">Ações permitidas</p><div className="grid gap-2">{actionCapabilities.map(capabilityOption)}</div></div></div><GhostButton className="mt-3" disabled={busy || !selectedProfileId} onClick={() => onSaveCapabilities(selectedProfileId, selectedKeys)}>Salvar permissões</GhostButton></Panel></div>;
}

function ScreenAccessPanel(props: { users: AdminInternalAccessUserRow[]; catalog: AdminInternalScreenCatalogRow[]; grants: AdminInternalMembershipScreenGrantRow[]; onSave: (membershipId: string, keys: AdminInternalScreenCatalogRow['screen_key'][]) => void; busy: boolean }) {
  const { users, catalog, grants, onSave, busy } = props;
  const [selectedUserId, setSelectedUserId] = useState(users[0]?.user_id ?? '');
  const selectedUser = users.find((user) => user.user_id === selectedUserId) ?? users[0] ?? null;
  const [selectedAreaKey, setSelectedAreaKey] = useState(String(users[0]?.areas[0]?.area_key ?? ''));
  const selectedArea: Record<string, unknown> = selectedUser ? firstOrMatchingArea(selectedUser, selectedAreaKey) : {};
  const membershipId = String(selectedArea.membership_id ?? '');
  const grantedKeys = grants.filter((grant) => grant.membership_id === membershipId).map((grant) => grant.screen_key);
  const [keys, setKeys] = useState<AdminInternalScreenCatalogRow['screen_key'][]>(grantedKeys);
  useEffect(() => setKeys(grantedKeys), [membershipId, grants]);
  useEffect(() => {
    if (!users.some((user) => user.user_id === selectedUserId)) setSelectedUserId(users[0]?.user_id ?? '');
  }, [selectedUserId, users]);
  useEffect(() => {
    const firstArea = selectedUser?.areas[0];
    if (!selectedUser?.areas.some((area) => String(area.area_key ?? '') === selectedAreaKey)) {
      setSelectedAreaKey(String(firstArea?.area_key ?? ''));
    }
  }, [selectedAreaKey, selectedUser]);
  const grouped = catalog.reduce<Record<string, AdminInternalScreenCatalogRow[]>>((groups, screen) => { (groups[screen.category] ??= []).push(screen); return groups; }, {});
  return <Panel title="Telas liberadas por colaborador" description="Escolha as telas que cada pessoa poderá consultar nesta área. Para permitir edição ou outras ações, ajuste as permissões do perfil atribuído.">
    <div className="grid gap-3 lg:grid-cols-[minmax(220px,0.35fr)_minmax(0,1fr)]">
      <div className="grid gap-3">{fieldLabel('Colaborador', <SelectInput value={selectedUser?.user_id ?? ''} onChange={(event) => setSelectedUserId(event.target.value)}>{users.map((user) => <option key={user.user_id} value={user.user_id}>{user.full_name || user.email || 'Colaborador'}</option>)}</SelectInput>)}{selectedUser && selectedUser.areas.length > 1 ? fieldLabel('Área', <SelectInput value={selectedAreaKey} onChange={(event) => setSelectedAreaKey(event.target.value)}>{selectedUser.areas.map((area) => <option key={String(area.membership_id)} value={String(area.area_key ?? '')}>{String(area.area_label ?? 'Área')}</option>)}</SelectInput>) : null}<span className="text-xs text-[color:var(--minimal-text-tertiary)]">{membershipId ? 'Selecione as telas desta área.' : 'Este colaborador ainda não possui uma área atribuída.'}</span></div>
      <div className="grid gap-3 sm:grid-cols-2">{Object.entries(grouped).map(([category, screens]) => <fieldset className="min-w-0 border-t border-[color:var(--minimal-border)] pt-2" key={category}><legend className="text-xs font-semibold uppercase tracking-[0.1em] text-[color:var(--minimal-text-tertiary)]">{category === 'workspace' ? 'Espaço de trabalho' : category === 'intelligence' ? 'Visão gerencial' : 'Administração'}</legend>{screens.map((screen) => <label className="mt-2 flex items-start gap-2 text-sm" key={screen.screen_key}><input checked={keys.includes(screen.screen_key)} disabled={!membershipId || busy} onChange={() => setKeys((current) => current.includes(screen.screen_key) ? current.filter((key) => key !== screen.screen_key) : [...current, screen.screen_key])} type="checkbox" /><span className="block font-medium">{screen.display_name}</span></label>)}</fieldset>)}</div>
    </div>
    <GhostButton className="mt-4" disabled={!membershipId || busy} onClick={() => onSave(membershipId, keys)}>Salvar telas deste colaborador</GhostButton>
  </Panel>;
}

function ProfileScreenAccessPanel(props: { profiles: AdminInternalProfileRow[]; catalog: AdminInternalScreenCatalogRow[]; grants: Array<{ access_profile_id: string; screen_key: AdminInternalScreenCatalogRow['screen_key'] }>; onSave: (profileId: string, keys: AdminInternalScreenCatalogRow['screen_key'][]) => void; busy: boolean }) {
  const { profiles, catalog, grants, onSave, busy } = props;
  const [selectedProfileId, setSelectedProfileId] = useState(profiles[0]?.access_profile_id ?? '');
  const [keys, setKeys] = useState<AdminInternalScreenCatalogRow['screen_key'][]>([]);
  useEffect(() => { setKeys(grants.filter((grant) => grant.access_profile_id === selectedProfileId).map((grant) => grant.screen_key)); }, [grants, selectedProfileId]);
  useEffect(() => { if (!profiles.some((profile) => profile.access_profile_id === selectedProfileId)) setSelectedProfileId(profiles[0]?.access_profile_id ?? ''); }, [profiles, selectedProfileId]);
  return <Panel title="Telas do perfil" description="Um perfil pode liberar cada aba individualmente; colaboradores recebem apenas as telas do vínculo e do perfil atribuído.">
    <div className="grid gap-3 lg:grid-cols-[minmax(220px,0.35fr)_minmax(0,1fr)]"><label className="grid gap-1.5"><span className="text-xs font-medium text-[color:var(--minimal-text-secondary)]">Perfil</span><SelectInput value={selectedProfileId} onChange={(event) => setSelectedProfileId(event.target.value)}>{profiles.map((profile) => <option key={profile.access_profile_id} value={profile.access_profile_id}>{profile.name}</option>)}</SelectInput></label><div className="grid gap-2 sm:grid-cols-2">{catalog.map((screen) => <label className="flex items-center gap-2 text-sm" key={screen.screen_key}><input checked={keys.includes(screen.screen_key)} disabled={busy || !selectedProfileId} onChange={() => setKeys((current) => current.includes(screen.screen_key) ? current.filter((key) => key !== screen.screen_key) : [...current, screen.screen_key])} type="checkbox" /><span>{screen.display_name}</span></label>)}</div></div>
    <GhostButton className="mt-4" disabled={busy || !selectedProfileId} onClick={() => onSave(selectedProfileId, keys)}>Salvar telas do perfil</GhostButton>
  </Panel>;
}

function PermissionsPanel(props: { profiles: AdminInternalProfileRow[]; capabilities: Array<{ capability_key: string; display_name: string; description: string | null; domain: string; is_active: boolean }>; profileForm: { name: string; description: string }; setProfileForm: React.Dispatch<React.SetStateAction<{ name: string; description: string }>>; onCreate: () => void; onToggle: (profile: AdminInternalProfileRow) => void; busy: boolean }) {
  const { profiles, capabilities, profileForm, setProfileForm, onCreate, onToggle, busy } = props;
  return <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]"><Panel title="Perfis e permissões" description="Os nomes são legíveis; a autorização efetiva continua sendo calculada no backend."><div className="grid gap-2">{profiles.map((profile) => <div className="rounded-xl border border-[color:var(--minimal-border)] px-4 py-3" key={profile.access_profile_id}><div className="flex items-start justify-between gap-3"><div><p className="font-medium text-[color:var(--minimal-text)]">{profile.name}</p><p className="mt-1 text-xs text-[color:var(--minimal-text-secondary)]">{profile.user_count} usuários · {profile.capability_count} capacidades · {profile.screen_count} superfícies</p></div><div className="flex items-center gap-2"><StatusPill tone={profile.is_active ? 'positive' : 'critical'}>{profile.is_active ? 'Ativo' : 'Inativo'}</StatusPill>{!profile.is_system ? <GhostButton disabled={busy} onClick={() => onToggle(profile)}>{profile.is_active ? 'Desativar' : 'Ativar'}</GhostButton> : null}</div></div></div>)}</div><form className="mt-4 grid gap-2 border-t border-[color:var(--minimal-border)] pt-4" onSubmit={(event) => { event.preventDefault(); onCreate(); }}>{fieldLabel('Nome do perfil', <TextInput required value={profileForm.name} onChange={(event) => setProfileForm((current) => ({ ...current, name: event.target.value }))} />)}{fieldLabel('Descrição', <TextareaInput value={profileForm.description} onChange={(event) => setProfileForm((current) => ({ ...current, description: event.target.value }))} />)}<AppButton disabled={busy} type="submit">Criar perfil personalizado</AppButton></form></Panel><Panel title="Catálogo de capacidades" description="Cada capacidade libera uma ação ou superfície específica."><div className="grid gap-2">{capabilities.map((capability) => <div className="rounded-lg border border-[color:var(--minimal-border)] px-3 py-2" key={capability.capability_key}><p className="text-sm font-medium">{capability.display_name}</p><p className="text-xs text-[color:var(--minimal-text-tertiary)]">{capability.domain} · {capability.capability_key}</p></div>)}</div></Panel></div>;
}
