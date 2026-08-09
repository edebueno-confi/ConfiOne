import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { formatDateTime } from '../../app/format';
import { ErrorState, LoadingState } from '../../components/states';
import { UiBadge } from '../settings/ui/UiBadge';
import { UiButton } from '../settings/ui/UiButton';
import { UiCard } from '../settings/ui/UiCard';
import { UiCardHeader } from '../settings/ui/UiCardHeader';
import { UiDetailList } from '../settings/ui/UiDetailList';
import { UiEmptyState } from '../settings/ui/UiEmptyState';
import { UiField } from '../settings/ui/UiField';
import { UiHintBand } from '../settings/ui/UiHintBand';
import { UiMetric } from '../settings/ui/UiMetric';
import { UiMetricRow } from '../settings/ui/UiMetricRow';
import { UiPage } from '../settings/ui/UiPage';
import { UiPageHeader } from '../settings/ui/UiPageHeader';
import { UiSearchField } from '../settings/ui/UiSearchField';
import { UiTable } from '../settings/ui/UiTable';
import { UiToolbar } from '../settings/ui/UiToolbar';
import '../settings/settings-ui.css';
import {
  createAdminInternalAccessArea,
  createAdminInternalFunction,
  createAdminInternalUser,
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
  resetAdminInternalUserPassword,
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
type Tone = 'positive' | 'warning' | 'critical';

/**
 * A aba de convites permanece apenas como histórico auditável. A liberação de
 * acesso interno passou a ser feita por "Criar usuário", que provisiona a conta
 * e o vínculo no servidor sem usar `internal_invites`.
 */
const tabs: Array<{ key: Tab; label: string }> = [
  { key: 'users', label: 'Usuários' },
  { key: 'structure', label: 'Estrutura' },
  { key: 'permissions', label: 'Perfis' },
  { key: 'invites', label: 'Convites (histórico)' },
];

const STATUS_LABELS: Record<string, string> = {
  active: 'Ativo',
  suspended: 'Suspenso',
  inactive: 'Inativo',
  pending: 'Pendente',
  sent: 'Enviado',
  accepted: 'Aceito',
  expired: 'Expirado',
  revoked: 'Revogado',
  failed: 'Falhou',
};

function statusLabel(status: string) {
  return STATUS_LABELS[status] ?? status;
}

function statusTone(status: string) {
  if (status === 'active' || status === 'accepted') return 'success' as const;
  if (status === 'pending' || status === 'sent') return 'warning' as const;
  if (status === 'suspended' || status === 'revoked' || status === 'failed') return 'danger' as const;
  return 'neutral' as const;
}

function isTab(value: string | null): value is Tab {
  return value === 'users' || value === 'invites' || value === 'structure' || value === 'permissions';
}

function firstOrMatchingArea(user: AdminInternalAccessUserRow, areaKey?: string) {
  return user.areas.find((area) => !areaKey || String(area.area_key ?? '') === areaKey) ?? user.areas[0] ?? {};
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

export function InternalControlPlanePage() {
  const { markSessionExpired } = useAuthContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const [phase, setPhase] = useState<LoadPhase>('loading');
  const [message, setMessage] = useState<{ text: string; tone?: Tone } | null>(null);
  const [tab, setTab] = useState<Tab>(() => {
    const candidate = searchParams.get('tab');
    return isTab(candidate) ? candidate : 'users';
  });

  useEffect(() => {
    const candidate = searchParams.get('tab');
    if (isTab(candidate)) setTab(candidate);
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
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({ fullName: '', email: '', areaKey: '', functionId: '', profileId: '' });
  const [createErrors, setCreateErrors] = useState<{ fullName?: string; email?: string; areaKey?: string }>({});
  const [areaForm, setAreaForm] = useState({ areaKey: '', displayName: '', description: '' });
  const [functionForm, setFunctionForm] = useState({ areaKey: '', name: '', description: '', profileId: '' });
  const [assignment, setAssignment] = useState({ areaKey: '', functionId: '', profileId: '' });
  const [overrideForm, setOverrideForm] = useState({ capabilityKey: '', effect: 'allow' as 'allow' | 'deny', justification: '' });
  const [profileForm, setProfileForm] = useState({ name: '', description: '' });
  // Credencial de exibição única. Vive só na memória desta tela, sai da memória
  // quando o administrador fecha o aviso e nunca é gravada em lugar nenhum.
  const [issuedCredential, setIssuedCredential] = useState<{ label: string; password: string } | null>(null);

  async function load() {
    setPhase('loading');
    try {
      const [nextUsers, nextInvites, nextAreas, nextFunctions, nextProfiles, nextCapabilities, nextProfileCapabilities, nextOverrides, nextScreens, nextGrants, nextProfileGrants] = await Promise.all([
        listAdminInternalAccessUsers(), listAdminInternalInvites(), listAdminInternalAccessAreas(), listAdminInternalFunctions(), listAdminAccessProfiles(), listAdminAccessCapabilities(), listAdminAccessProfileCapabilities(), listAdminInternalOverrides(), listAdminInternalScreenCatalog(), listAdminInternalMembershipScreenGrants(), listAdminInternalAccessProfileScreenGrants(),
      ]);
      setUsers(nextUsers); setInvites(nextInvites); setAreas(nextAreas); setFunctions(nextFunctions); setProfiles(nextProfiles); setCapabilities(nextCapabilities); setProfileCapabilities(nextProfileCapabilities); setOverrides(nextOverrides); setScreenCatalog(nextScreens); setScreenGrants(nextGrants); setProfileScreenGrants(nextProfileGrants);
      setCreateForm((current) => ({ ...current, areaKey: current.areaKey || nextAreas.find((area) => area.is_active)?.area_key || '' }));
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
      // Sem filtro de estrutura a lista mostra o read model inteiro. Antes o
      // `some()` exigia pelo menos um vínculo, então quem ainda não tinha área
      // sumia da tela mesmo constando no read model e nos indicadores.
      const hasStructureFilter = Boolean(userAreaFilter || userFunctionFilter || userProfileFilter);
      const areaMatches = !hasStructureFilter || user.areas.some((area) =>
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

  /**
   * Redefinição administrativa: a senha é gerada no servidor e volta uma única
   * vez. A tela apenas mostra o valor recebido — não gera, não guarda e não
   * repete a consulta.
   */
  async function resetPassword(user: AdminInternalAccessUserRow) {
    setBusy(true); setMessage(null); setIssuedCredential(null);
    try {
      const result = await resetAdminInternalUserPassword(user.user_id);
      if (result?.temporaryPassword) {
        setIssuedCredential({ label: user.email || user.full_name || user.user_id, password: result.temporaryPassword });
      }
      setMessage({ text: 'Senha redefinida. O valor aparece uma única vez abaixo e a troca será exigida no próximo acesso.', tone: 'positive' });
    } catch (error) {
      const classified = classifyAdminError(error, 'Não foi possível redefinir a senha.');
      setMessage({ text: classified.message, tone: 'critical' });
    } finally {
      setBusy(false);
    }
  }

  async function openUser(user: AdminInternalAccessUserRow) {
    setSelectedUser(user); setAssignment({ areaKey: String((user.areas[0]?.area_key as string | undefined) ?? ''), functionId: String((user.areas[0]?.function_id as string | undefined) ?? ''), profileId: String((user.areas[0]?.access_profile_id as string | undefined) ?? '') });
    try { setDetail(await getAdminInternalAccessUser(user.user_id)); } catch { setDetail(null); }
  }

  function startCreate() {
    setCreateErrors({});
    setCreating(true);
    selectTab('users');
  }

  /**
   * Criação direta: valida no cliente apenas o que é formato, e deixa a regra de
   * autorização, unicidade e provisionamento para o comando do servidor.
   */
  async function submitCreate(event: React.FormEvent) {
    event.preventDefault();
    const nextErrors: { fullName?: string; email?: string; areaKey?: string } = {};
    if (!createForm.fullName.trim()) nextErrors.fullName = 'Informe o nome completo da pessoa.';
    if (!isValidEmail(createForm.email)) nextErrors.email = 'Informe um e-mail válido, no formato nome@dominio.com.';
    if (!createForm.areaKey) nextErrors.areaKey = 'Escolha a área que dará contexto ao acesso.';
    setCreateErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setBusy(true); setMessage(null);
    try {
      const result = await createAdminInternalUser({
        fullName: createForm.fullName.trim(),
        email: createForm.email.trim().toLowerCase(),
        areaKey: createForm.areaKey,
        functionId: createForm.functionId || null,
        accessProfileId: createForm.profileId || null,
      });
      if (result?.temporaryPassword) {
        setIssuedCredential({
          label: createForm.email.trim().toLowerCase(),
          password: result.temporaryPassword,
        });
      }
      setMessage({
        text: result?.alreadyExisted
          ? 'Este e-mail já tinha conta na plataforma. O acesso interno foi atualizado com a área, a função e o perfil informados. A senha atual não foi alterada.'
          : 'Usuário criado. A senha temporária aparece uma única vez abaixo: copie e repasse pelo seu canal.',
        tone: result?.alreadyExisted ? 'warning' : 'positive',
      });
      setCreating(false);
      setCreateForm((current) => ({ ...current, fullName: '', email: '', functionId: '', profileId: '' }));
      await load();
    } catch (error) {
      const classified = classifyAdminError(error, 'Não foi possível criar o usuário interno.');
      setMessage({ text: classified.message, tone: 'critical' });
    } finally {
      setBusy(false);
    }
  }

  if (phase === 'loading') return <LoadingState title="Preparando acessos e áreas" description="Estamos organizando usuários, equipes e permissões." />;
  if (phase === 'denied') return <ErrorState title="Acesso não autorizado" description="Sua conta não pode administrar os acessos internos." />;
  if (phase === 'error') {
    return (
      <div className="gso-ui">
        <ErrorState
          description={message?.text ?? 'Não foi possível carregar esta área agora.'}
          action={<UiButton icon="refresh" onClick={() => void load()}>Tentar novamente</UiButton>}
        />
      </div>
    );
  }

  const activeUsers = users.filter((user) => user.access_status === 'active').length;
  const suspendedUsers = users.filter((user) => user.access_status === 'suspended').length;
  // O read model não expõe último login real (`last_access_at` é o carimbo de
  // atualização do contexto/perfil), então a tela não afirma "primeiro acesso".
  // O indicador abaixo usa um dado que o backend realmente entrega: quantas
  // identidades internas ainda estão sem vínculo de área.
  const withoutArea = users.filter((user) => user.areas.length === 0).length;

  return (
    <div className="gso-ui gso-ui-shell">
      {/* Cromo fixo: identidade da tela, indicadores e navegação nunca entram no
          container de rolagem, então nenhuma aba consegue escondê-los. */}
      <div className="gso-ui-shell-chrome">
        <UiPageHeader
          actions={<UiButton icon="plus" onClick={startCreate} variant="primary">Criar usuário</UiButton>}
          description="Crie contas internas, defina área, função e perfil, e acompanhe as permissões efetivas calculadas pelo backend."
          parentHref="/admin/settings/integrations"
          title="Usuários e acesso"
          titleId="access-title"
        />
        <UiMetricRow label="Resumo de acessos internos">
          <UiMetric icon="users" label="Usuários ativos" sub="acesso liberado" tone="success" value={activeUsers} valueTone="success" />
          <UiMetric icon="layers" label="Sem área atribuída" sub="ainda sem vínculo organizacional" tone="warning" value={withoutArea} valueTone={withoutArea ? 'warning' : undefined} />
          <UiMetric icon="shield" label="Usuários suspensos" sub="acesso pausado" tone="danger" value={suspendedUsers} valueTone={suspendedUsers ? 'danger' : undefined} />
        </UiMetricRow>
        <nav aria-label="Seções de acessos" className="gso-ui-tabs">
          {tabs.map((item) => (
            <button
              aria-current={tab === item.key ? 'page' : undefined}
              className="gso-ui-tab"
              key={item.key}
              onClick={() => selectTab(item.key)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="gso-ui-shell-body">
        <UiPage className="gso-ui-page--fill">
          {message ? (
            <p
              className={message.tone === 'critical' ? 'gso-ui-alert gso-ui-alert--error' : 'gso-ui-alert gso-ui-alert--success'}
              role={message.tone === 'critical' ? 'alert' : 'status'}
            >
              {message.text}
            </p>
          ) : null}

          {tab === 'users' ? (
            <>
              {issuedCredential ? (
                <OneTimeCredentialCard
                  credential={issuedCredential}
                  onDismiss={() => setIssuedCredential(null)}
                />
              ) : null}
              {creating ? (
                <CreateUserCard
                  areas={areas}
                  busy={busy}
                  errors={createErrors}
                  form={createForm}
                  functions={functions}
                  onCancel={() => { setCreating(false); setCreateErrors({}); }}
                  onSubmit={submitCreate}
                  profiles={profiles}
                  setForm={setCreateForm}
                />
              ) : null}
              <UsersPanel
                areas={areas}
                assignment={assignment}
                busy={busy}
                capabilities={capabilities}
                detail={detail}
                filters={{ area: userAreaFilter, functionId: userFunctionFilter, profile: userProfileFilter, status: userStatusFilter }}
                functions={functions}
                onAction={runAction}
                onCreate={startCreate}
                onResetPassword={resetPassword}
                onSelect={openUser}
                overrideForm={overrideForm}
                overrides={overrides.filter((item) => item.user_id === selectedUser?.user_id)}
                profiles={profiles}
                query={query}
                selectedUser={selectedUser}
                setAssignment={setAssignment}
                setFilters={{ setArea: setUserAreaFilter, setFunctionId: setUserFunctionFilter, setProfile: setUserProfileFilter, setStatus: setUserStatusFilter }}
                setOverrideForm={setOverrideForm}
                setQuery={setQuery}
                users={filteredUsers}
              />
            </>
          ) : null}

          {tab === 'invites' ? (
            <InviteHistoryPanel
              busy={busy}
              invites={invites}
              onCreateUser={startCreate}
              onRevoke={(id) => void runAction(() => revokeAdminInternalInvitation(id), 'Convite revogado.')}
            />
          ) : null}

          {tab === 'structure' ? (
            <StructurePanel
              areaForm={areaForm}
              areas={areas}
              busy={busy}
              functionForm={functionForm}
              functions={functions}
              onCreateArea={() => void runAction(() => createAdminInternalAccessArea(areaForm), 'Área criada.')}
              onCreateFunction={() => void runAction(() => createAdminInternalFunction({ areaKey: functionForm.areaKey, name: functionForm.name, description: functionForm.description, defaultAccessProfileId: functionForm.profileId || null }), 'Função criada.')}
              onToggleArea={(area) => void runAction(() => updateAdminInternalAccessArea({ areaKey: area.area_key, displayName: area.display_name, description: area.description ?? '', isActive: !area.is_active, managerUserId: area.manager_user_id }), 'Área atualizada.')}
              onToggleFunction={(item) => void runAction(() => updateAdminInternalFunction({ functionId: item.function_id, name: item.name, description: item.description ?? '', defaultAccessProfileId: item.default_access_profile_id, isActive: !item.is_active }), 'Função atualizada.')}
              profiles={profiles}
              setAreaForm={setAreaForm}
              setFunctionForm={setFunctionForm}
            />
          ) : null}

          {tab === 'permissions' ? (
            <>
              <PermissionsCapabilityPanel
                busy={busy}
                capabilities={capabilities}
                onCreate={() => void runAction(() => createAdminAccessProfile(profileForm), 'Perfil criado.')}
                onSaveCapabilities={(profileId, keys) => void runAction(() => replaceAdminAccessProfileCapabilities(profileId, keys), 'Permissões do perfil atualizadas.')}
                onToggle={(profile) => void runAction(() => updateAdminAccessProfile({ profileId: profile.access_profile_id, name: profile.name, description: profile.description ?? '', isActive: !profile.is_active }), 'Perfil atualizado.')}
                profileCapabilities={profileCapabilities}
                profileForm={profileForm}
                profiles={profiles}
                setProfileForm={setProfileForm}
              />
              <ProfileScreenAccessPanel
                busy={busy}
                catalog={screenCatalog}
                grants={profileScreenGrants}
                onSave={(profileId, keys) => void runAction(async () => { await replaceAdminInternalAccessProfileScreens(profileId, keys); setProfileScreenGrants(await listAdminInternalAccessProfileScreenGrants()); }, 'Telas do perfil atualizadas.')}
                profiles={profiles}
              />
              <ScreenAccessPanel
                busy={busy}
                catalog={screenCatalog}
                grants={screenGrants}
                onSave={(membershipId, keys) => void runAction(async () => { await replaceInternalMembershipScreens({ membershipId, screenKeys: keys }); setScreenGrants(await listAdminInternalMembershipScreenGrants()); }, 'Telas da área atualizadas.')}
                users={users}
              />
            </>
          ) : null}
        </UiPage>
      </div>
    </div>
  );
}

/**
 * Exibição única da senha temporária emitida pelo servidor.
 *
 * A senha chega pela resposta da operação e vive apenas no estado desta tela.
 * Não é gravada em `localStorage`, não vai para a URL, não é reconsultável e
 * some da memória quando o administrador fecha o aviso. Se ele perder o valor,
 * o caminho é redefinir de novo — não existe recuperação.
 */
function OneTimeCredentialCard({
  credential,
  onDismiss,
}: {
  credential: { label: string; password: string };
  onDismiss: () => void;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <UiCard labelledBy="one-time-credential-title">
      <UiCardHeader
        actions={<UiButton compact icon="x" onClick={onDismiss} variant="ghost">Fechar</UiButton>}
        description={`Credencial de ${credential.label}. Este valor aparece uma única vez e não pode ser consultado depois. Copie e repasse pelo seu canal.`}
        icon="key"
        title="Senha temporária — exibição única"
        titleId="one-time-credential-title"
        tone="warning"
      />
      <div className="gso-ui-card-body">
        <p className="gso-ui-code" data-testid="one-time-credential-value">{credential.password}</p>
        <div className="gso-ui-actions">
          <UiButton
            icon="check"
            onClick={() => {
              void navigator.clipboard?.writeText(credential.password).then(() => setCopied(true)).catch(() => setCopied(false));
            }}
            variant="primary"
          >
            {copied ? 'Copiado' : 'Copiar senha'}
          </UiButton>
        </div>
        <p className="gso-ui-note">
          A pessoa é obrigada a trocar esta senha no primeiro acesso, antes de usar qualquer tela.
        </p>
      </div>
    </UiCard>
  );
}

/**
 * Formulário de criação direta. O administrador não digita senha: quem gera é o
 * servidor, e o valor volta uma única vez na resposta da criação.
 */
function CreateUserCard(props: {
  areas: AdminInternalAccessAreaRow[];
  busy: boolean;
  errors: { fullName?: string; email?: string; areaKey?: string };
  form: { fullName: string; email: string; areaKey: string; functionId: string; profileId: string };
  functions: AdminInternalFunctionRow[];
  onCancel: () => void;
  onSubmit: (event: React.FormEvent) => Promise<void>;
  profiles: AdminInternalProfileRow[];
  setForm: React.Dispatch<React.SetStateAction<{ fullName: string; email: string; areaKey: string; functionId: string; profileId: string }>>;
}) {
  const { areas, busy, errors, form, functions, onCancel, onSubmit, profiles, setForm } = props;
  const areaFunctions = functions.filter((item) => item.is_active && item.area_key === form.areaKey);

  return (
    <UiCard labelledBy="create-user-title">
      <UiCardHeader
        description="A conta, a senha inicial e o vínculo interno são provisionados no servidor. A senha aparece uma única vez depois de criar."
        icon="plus"
        title="Criar usuário"
        titleId="create-user-title"
        tone="primary"
      />
      <form className="gso-ui-card-body" onSubmit={(event) => void onSubmit(event)}>
        <div className="gso-ui-grid">
          <UiField error={errors.fullName} errorId="create-user-name-error" label="Nome completo">
            <input
              aria-describedby={errors.fullName ? 'create-user-name-error' : undefined}
              aria-invalid={errors.fullName ? true : undefined}
              autoComplete="off"
              className="gso-ui-control"
              disabled={busy}
              onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
              placeholder="Maria Souza"
              value={form.fullName}
            />
          </UiField>
          <UiField error={errors.email} errorId="create-user-email-error" label="E-mail corporativo">
            <input
              aria-describedby={errors.email ? 'create-user-email-error' : undefined}
              aria-invalid={errors.email ? true : undefined}
              autoComplete="off"
              className="gso-ui-control"
              disabled={busy}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              placeholder="maria.souza@empresa.com"
              type="email"
              value={form.email}
            />
          </UiField>
          <UiField error={errors.areaKey} errorId="create-user-area-error" label="Área">
            <select
              aria-describedby={errors.areaKey ? 'create-user-area-error' : undefined}
              aria-invalid={errors.areaKey ? true : undefined}
              className="gso-ui-control gso-ui-select"
              disabled={busy}
              onChange={(event) => setForm((current) => ({ ...current, areaKey: event.target.value, functionId: '' }))}
              value={form.areaKey}
            >
              <option value="">Selecione uma área</option>
              {areas.filter((area) => area.is_active).map((area) => (
                <option key={area.area_key} value={area.area_key}>{area.display_name}</option>
              ))}
            </select>
          </UiField>
          <UiField hint="Opcional. A função pode sugerir o perfil padrão da área." label="Função">
            <select
              className="gso-ui-control gso-ui-select"
              disabled={busy || !form.areaKey}
              onChange={(event) => setForm((current) => ({ ...current, functionId: event.target.value }))}
              value={form.functionId}
            >
              <option value="">Sem função</option>
              {areaFunctions.map((item) => <option key={item.function_id} value={item.function_id}>{item.name}</option>)}
            </select>
          </UiField>
          <UiField hint="As permissões efetivas são calculadas pelo backend a partir do perfil e da área." label="Perfil de acesso" wide>
            <select
              className="gso-ui-control gso-ui-select"
              disabled={busy}
              onChange={(event) => setForm((current) => ({ ...current, profileId: event.target.value }))}
              value={form.profileId}
            >
              <option value="">Personalizado (sem perfil)</option>
              {profiles.filter((profile) => profile.is_active).map((profile) => (
                <option key={profile.access_profile_id} value={profile.access_profile_id}>{profile.name}</option>
              ))}
            </select>
          </UiField>
        </div>
        <p className="gso-ui-note">
          O servidor gera uma senha temporária forte e a exibe uma única vez após a criação. Repasse pelo seu canal: a pessoa
          será obrigada a trocá-la no primeiro acesso.
        </p>
        <div className="gso-ui-actions">
          <UiButton disabled={busy} icon="check" type="submit" variant="primary">
            {busy ? 'Criando…' : 'Criar usuário'}
          </UiButton>
          <UiButton disabled={busy} onClick={onCancel} variant="ghost">Cancelar</UiButton>
        </div>
      </form>
    </UiCard>
  );
}

function UsersPanel(props: {
  areas: AdminInternalAccessAreaRow[];
  assignment: { areaKey: string; functionId: string; profileId: string };
  busy: boolean;
  capabilities: Array<{ capability_key: string; display_name: string; description: string | null; domain: string; is_active: boolean }>;
  detail: Record<string, unknown> | null;
  filters: { area: string; functionId: string; profile: string; status: string };
  functions: AdminInternalFunctionRow[];
  onAction: (action: () => Promise<unknown>, success: string) => Promise<void>;
  onCreate: () => void;
  onResetPassword: (user: AdminInternalAccessUserRow) => Promise<void>;
  onSelect: (user: AdminInternalAccessUserRow) => void;
  overrideForm: { capabilityKey: string; effect: 'allow' | 'deny'; justification: string };
  overrides: AdminInternalOverrideRow[];
  profiles: AdminInternalProfileRow[];
  query: string;
  selectedUser: AdminInternalAccessUserRow | null;
  setAssignment: React.Dispatch<React.SetStateAction<{ areaKey: string; functionId: string; profileId: string }>>;
  setFilters: { setArea: (value: string) => void; setFunctionId: (value: string) => void; setProfile: (value: string) => void; setStatus: (value: string) => void };
  setOverrideForm: React.Dispatch<React.SetStateAction<{ capabilityKey: string; effect: 'allow' | 'deny'; justification: string }>>;
  setQuery: (value: string) => void;
  users: AdminInternalAccessUserRow[];
}) {
  const { areas, assignment, busy, capabilities, detail, filters, functions, onAction, onCreate, onResetPassword, onSelect, overrideForm, overrides, profiles, query, selectedUser, setAssignment, setFilters, setOverrideForm, setQuery, users } = props;
  const visibleFunctions = functions.filter((item) => !assignment.areaKey || item.area_key === assignment.areaKey);
  const effectiveCapabilities = Array.isArray(detail?.capabilities) ? (detail?.capabilities as unknown[]).length : null;
  const [detailOpen, setDetailOpen] = useState(false);
  const drawerRef = useRef<HTMLElement | null>(null);
  const drawerTriggerRef = useRef<HTMLButtonElement | null>(null);

  function closeDetail() {
    setDetailOpen(false);
    window.requestAnimationFrame(() => drawerTriggerRef.current?.focus());
  }

  useEffect(() => {
    if (!detailOpen) return;

    const focusable = () => Array.from(
      drawerRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ) ?? [],
    );
    const focusFirst = () => focusable()[0]?.focus();
    const frame = window.requestAnimationFrame(focusFirst);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeDetail();
        return;
      }
      if (event.key !== 'Tab') return;
      const nodes = focusable();
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [detailOpen]);

  return (
    <>
      <div className="gso-ui-split gso-ui-grow">
        <UiCard flush label="Usuários internos">
        <UiToolbar label="Filtros da lista de usuários">
          <div className="gso-ui-toolbar-field gso-ui-toolbar-field--wide">
            <UiSearchField aria-label="Buscar usuário" onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nome, e-mail ou papel" value={query} />
          </div>
          <div className="gso-ui-toolbar-field">
            <select aria-label="Filtrar por área" className="gso-ui-control gso-ui-select" onChange={(event) => setFilters.setArea(event.target.value)} value={filters.area}>
              <option value="">Todas as áreas</option>
              {areas.map((area) => <option key={area.area_key} value={area.area_key}>{area.display_name}</option>)}
            </select>
          </div>
          <div className="gso-ui-toolbar-field">
            <select aria-label="Filtrar por função" className="gso-ui-control gso-ui-select" onChange={(event) => setFilters.setFunctionId(event.target.value)} value={filters.functionId}>
              <option value="">Todas as funções</option>
              {functions.map((item) => <option key={item.function_id} value={item.function_id}>{item.name}</option>)}
            </select>
          </div>
          <div className="gso-ui-toolbar-field">
            <select aria-label="Filtrar por perfil" className="gso-ui-control gso-ui-select" onChange={(event) => setFilters.setProfile(event.target.value)} value={filters.profile}>
              <option value="">Todos os perfis</option>
              {profiles.map((profile) => <option key={profile.access_profile_id} value={profile.access_profile_id}>{profile.name}</option>)}
            </select>
          </div>
          <div className="gso-ui-toolbar-field">
            <select aria-label="Filtrar por status" className="gso-ui-control gso-ui-select" onChange={(event) => setFilters.setStatus(event.target.value)} value={filters.status}>
              <option value="">Todos os status</option>
              <option value="active">Ativo</option>
              <option value="suspended">Suspenso</option>
              <option value="inactive">Inativo</option>
            </select>
          </div>
        </UiToolbar>
          <UiTable label="Usuários internos">
            <thead>
              <tr>
                <th scope="col">Usuário</th>
                <th scope="col">Área</th>
                <th scope="col">Função</th>
                <th scope="col">Perfil</th>
                <th scope="col">Status</th>
                {/* O backend entrega o carimbo de atualização do contexto, não o
                    último login. O rótulo diz exatamente isso. */}
                <th scope="col">Contexto atualizado</th>
                <th className="gso-ui-table-actions--head" scope="col">Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const area = user.areas[0] ?? {};
                const selected = selectedUser?.user_id === user.user_id;
                return (
                  <tr className={selected ? 'is-selected' : undefined} key={user.user_id}>
                    <td>
                      <button className="gso-ui-rowselect" onClick={(event) => { drawerTriggerRef.current = event.currentTarget; onSelect(user); setDetailOpen(true); }} type="button">
                        {user.full_name || 'Sem nome'}
                      </button>
                      <small>{user.email || 'Indisponível'}</small>
                    </td>
                    <td>{String(area.area_label ?? 'Sem área')}</td>
                    <td>{String(area.function_name ?? 'Sem função')}</td>
                    <td>{String(area.access_profile_name ?? 'Personalizado')}</td>
                    <td><UiBadge dot tone={statusTone(user.access_status)}>{statusLabel(user.access_status)}</UiBadge></td>
                    <td className="gso-ui-table-numeric">{user.last_access_at ? formatDateTime(user.last_access_at) : 'Indisponível'}</td>
                    <td>
                      <div className="gso-ui-table-actions">
                        <UiButton
                          compact
                          disabled={busy}
                          icon="key"
                          onClick={() => void onResetPassword(user)}
                        >
                          Redefinir senha
                        </UiButton>
                        <UiButton
                          compact
                          disabled={busy}
                          onClick={() => void onAction(() => setAdminInternalUserStatus(user.user_id, user.access_status !== 'active'), user.access_status === 'active' ? 'Usuário suspenso.' : 'Usuário reativado.')}
                          variant={user.access_status === 'active' ? 'danger' : 'secondary'}
                        >
                          {user.access_status === 'active' ? 'Suspender' : 'Reativar'}
                        </UiButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </UiTable>
          {users.length === 0 ? (
            <UiEmptyState
              action={<UiButton icon="plus" onClick={onCreate} variant="primary">Criar usuário</UiButton>}
              description="Somente identidades com contexto interno aparecem aqui. Quando um colaborador tiver esse contexto, ele aparecerá nesta lista."
              icon="users"
              title="Nenhum usuário interno"
            />
          ) : null}
        </UiCard>

        {detailOpen ? <button aria-label="Fechar detalhe do usuário" className="gso-ui-access-drawer-scrim" onClick={closeDetail} type="button" /> : null}
        <aside aria-label="Detalhe do usuário" aria-modal={detailOpen} className="gso-ui-aside gso-ui-access-drawer" data-open={detailOpen} ref={drawerRef} role={detailOpen ? 'dialog' : undefined}>
          {selectedUser ? (
            <UiCard labelledBy="access-detail-title">
              <UiCardHeader
                actions={
                  <>
                    <UiBadge dot tone={statusTone(selectedUser.access_status)}>{statusLabel(selectedUser.access_status)}</UiBadge>
                    <UiButton aria-label="Fechar detalhe" compact onClick={closeDetail} variant="ghost">Fechar</UiButton>
                  </>
                }
                description={selectedUser.email || 'E-mail indisponível'}
                icon="users"
                title={selectedUser.full_name || 'Usuário interno'}
                titleId="access-detail-title"
              />
              <div className="gso-ui-aside-body">
                <div className="gso-ui-card-body">
                  <UiDetailList
                    items={[
                      { icon: 'shield', label: 'Capacidades efetivas', value: effectiveCapabilities === null ? 'Indisponível' : `${effectiveCapabilities} liberadas pelo backend` },
                      { icon: 'key', label: 'Overrides auditáveis', value: `${selectedUser.override_count}` },
                      { icon: 'clock', label: 'Contexto atualizado', value: selectedUser.last_access_at ? formatDateTime(selectedUser.last_access_at) : 'Indisponível' },
                    ]}
                  />
                </div>
                <div className="gso-ui-card-body">
                  <UiField label="Área">
                    <select className="gso-ui-control gso-ui-select" onChange={(event) => setAssignment((current) => ({ ...current, areaKey: event.target.value, functionId: '' }))} value={assignment.areaKey}>
                      {areas.filter((area) => area.is_active).map((area) => <option key={area.area_key} value={area.area_key}>{area.display_name}</option>)}
                    </select>
                  </UiField>
                  <UiField label="Função">
                    <select className="gso-ui-control gso-ui-select" onChange={(event) => setAssignment((current) => ({ ...current, functionId: event.target.value }))} value={assignment.functionId}>
                      <option value="">Sem função</option>
                      {visibleFunctions.map((item) => <option key={item.function_id} value={item.function_id}>{item.name}</option>)}
                    </select>
                  </UiField>
                  <UiField label="Perfil">
                    <select className="gso-ui-control gso-ui-select" onChange={(event) => setAssignment((current) => ({ ...current, profileId: event.target.value }))} value={assignment.profileId}>
                      <option value="">Personalizado</option>
                      {profiles.filter((profile) => profile.is_active).map((profile) => <option key={profile.access_profile_id} value={profile.access_profile_id}>{profile.name}</option>)}
                    </select>
                  </UiField>
                  <div className="gso-ui-actions">
                    <UiButton
                      disabled={busy || !assignment.areaKey}
                      icon="check"
                      onClick={() => void onAction(() => updateAdminInternalAccessAssignment({ userId: selectedUser.user_id, areaKey: assignment.areaKey, functionId: assignment.functionId || null, accessProfileId: assignment.profileId || null }), 'Atribuição atualizada.')}
                      variant="primary"
                    >
                      Salvar atribuição
                    </UiButton>
                  </div>
                </div>
                <div className="gso-ui-card-body">
                  <UiCardHeader
                    description="Exceções individuais exigem justificativa e ficam auditadas."
                    icon="key"
                    title="Overrides"
                    tone="warning"
                  />
                  {overrides.length === 0 ? (
                    <p className="gso-ui-note">Nenhum override individual.</p>
                  ) : (
                    <ul className="gso-ui-facts">
                      {overrides.map((item) => (
                        <li key={item.override_id}>
                          {item.capability_name} · {item.effect === 'allow' ? 'conceder' : 'bloquear'}
                          {' '}
                          <UiButton compact onClick={() => void onAction(() => removeAdminInternalOverride(item.override_id), 'Override removido.')} variant="ghost">
                            Remover
                          </UiButton>
                        </li>
                      ))}
                    </ul>
                  )}
                  <UiField label="Capacidade">
                    <select className="gso-ui-control gso-ui-select" onChange={(event) => setOverrideForm((current) => ({ ...current, capabilityKey: event.target.value }))} value={overrideForm.capabilityKey}>
                      <option value="">Selecione uma capacidade</option>
                      {capabilities.map((capability) => <option key={capability.capability_key} value={capability.capability_key}>{capability.display_name} · {capability.domain}</option>)}
                    </select>
                  </UiField>
                  <UiField label="Efeito">
                    <select className="gso-ui-control gso-ui-select" onChange={(event) => setOverrideForm((current) => ({ ...current, effect: event.target.value as 'allow' | 'deny' }))} value={overrideForm.effect}>
                      <option value="allow">Conceder</option>
                      <option value="deny">Bloquear</option>
                    </select>
                  </UiField>
                  <UiField label="Justificativa">
                    <textarea className="gso-ui-control" onChange={(event) => setOverrideForm((current) => ({ ...current, justification: event.target.value }))} rows={3} value={overrideForm.justification} />
                  </UiField>
                  <div className="gso-ui-actions">
                    <UiButton
                      disabled={busy || !overrideForm.capabilityKey || !overrideForm.justification}
                      onClick={() => void onAction(() => upsertAdminInternalOverride({ userId: selectedUser.user_id, capabilityKey: overrideForm.capabilityKey, effect: overrideForm.effect, justification: overrideForm.justification }), 'Override salvo.')}
                    >
                      Salvar override
                    </UiButton>
                  </div>
                </div>
              </div>
            </UiCard>
          ) : (
            <UiCard label="Detalhe do usuário">
              <UiEmptyState
                description="Abra um registro na lista para editar área, função, perfil e overrides auditáveis."
                icon="list"
                title="Selecione um usuário"
              />
            </UiCard>
          )}
        </aside>
      </div>
    </>
  );
}

/**
 * Histórico somente leitura dos convites. O fluxo foi aposentado como caminho de
 * liberação de acesso; os registros permanecem para auditoria e a única ação
 * disponível é revogar um convite que ainda esteja aberto.
 */
function InviteHistoryPanel(props: {
  busy: boolean;
  invites: AdminInternalInviteRow[];
  onCreateUser: () => void;
  onRevoke: (id: string) => void;
}) {
  const { busy, invites, onCreateUser, onRevoke } = props;
  const open = invites.filter((invite) => invite.status === 'pending' || invite.status === 'sent');

  return (
    <>
      <UiHintBand
        description="O convite deixou de ser o caminho de liberação de acesso interno. Novos acessos são criados diretamente em “Criar usuário”, com a conta provisionada no servidor. Este histórico continua aqui apenas para auditoria e para encerrar convites que ficaram abertos."
        title="Convites: histórico auditável"
      />
      <UiCard flush labelledBy="invite-history-title">
        <div className="gso-ui-card-body">
          <UiCardHeader
            actions={<UiButton icon="plus" onClick={onCreateUser} variant="primary">Criar usuário</UiButton>}
            description={`${invites.length} registro(s) preservado(s) · ${open.length} ainda em aberto. Tokens nunca são retornados nas listagens.`}
            icon="archive"
            title="Convites (histórico)"
            titleId="invite-history-title"
            tone="neutral"
          />
        </div>
        <UiTable labelledBy="invite-history-title">
          <thead>
            <tr>
              <th scope="col">Pessoa</th>
              <th scope="col">Área</th>
              <th scope="col">Perfil</th>
              <th scope="col">Status</th>
              <th className="gso-ui-table-actions--head" scope="col">Ações</th>
            </tr>
          </thead>
          <tbody>
            {invites.map((invite) => (
              <tr key={invite.invite_id}>
                <td>
                  <strong>{invite.full_name}</strong>
                  <small>{invite.email}</small>
                </td>
                <td>{invite.area_label}</td>
                <td>{invite.access_profile_name || 'Personalizado'}</td>
                <td><UiBadge dot tone={statusTone(invite.status)}>{statusLabel(invite.status)}</UiBadge></td>
                <td>
                  <div className="gso-ui-table-actions">
                    {invite.status === 'pending' || invite.status === 'sent' ? (
                      <UiButton compact disabled={busy} onClick={() => onRevoke(invite.invite_id)} variant="danger">Revogar</UiButton>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </UiTable>
        {invites.length === 0 ? (
          <UiEmptyState
            description="Nenhum convite foi preparado neste ambiente. O caminho oficial de liberação é a criação direta de usuário."
            icon="archive"
            title="Sem histórico de convites"
          />
        ) : null}
      </UiCard>
    </>
  );
}

function StructurePanel(props: {
  areaForm: { areaKey: string; displayName: string; description: string };
  areas: AdminInternalAccessAreaRow[];
  busy: boolean;
  functionForm: { areaKey: string; name: string; description: string; profileId: string };
  functions: AdminInternalFunctionRow[];
  onCreateArea: () => void;
  onCreateFunction: () => void;
  onToggleArea: (area: AdminInternalAccessAreaRow) => void;
  onToggleFunction: (item: AdminInternalFunctionRow) => void;
  profiles: AdminInternalProfileRow[];
  setAreaForm: React.Dispatch<React.SetStateAction<{ areaKey: string; displayName: string; description: string }>>;
  setFunctionForm: React.Dispatch<React.SetStateAction<{ areaKey: string; name: string; description: string; profileId: string }>>;
}) {
  const { areaForm, areas, busy, functionForm, functions, onCreateArea, onCreateFunction, onToggleArea, onToggleFunction, profiles, setAreaForm, setFunctionForm } = props;

  return (
    <div className="gso-ui-cards">
      <UiCard labelledBy="structure-areas-title">
        <UiCardHeader
          description="Catálogo organizacional, separado do catálogo legado de áreas-alvo dos acionamentos."
          icon="layers"
          title="Áreas"
          titleId="structure-areas-title"
        />
        <div className="gso-ui-card-body">
          <ul className="gso-ui-rowlist">
            {areas.map((area) => (
              <li className="gso-ui-rowcard" key={area.area_key}>
                <div className="gso-ui-rowcard-main">
                  <div>
                    <strong>{area.display_name}</strong>
                    <p>{area.active_user_count} usuários · {area.active_function_count} funções</p>
                  </div>
                  <div className="gso-ui-table-actions">
                    <UiBadge dot tone={area.is_active ? 'success' : 'neutral'}>{area.is_active ? 'Ativa' : 'Inativa'}</UiBadge>
                    <UiButton compact disabled={busy || area.active_user_count > 0} onClick={() => onToggleArea(area)}>
                      {area.is_active ? 'Desativar' : 'Ativar'}
                    </UiButton>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <form className="gso-ui-card-body" onSubmit={(event) => { event.preventDefault(); onCreateArea(); }}>
          <div className="gso-ui-grid">
            <UiField hint="Somente letras minúsculas, números e underline." label="Chave">
              <input className="gso-ui-control" onChange={(event) => setAreaForm((current) => ({ ...current, areaKey: event.target.value }))} pattern="[a-z0-9_]+" required value={areaForm.areaKey} />
            </UiField>
            <UiField label="Nome">
              <input className="gso-ui-control" onChange={(event) => setAreaForm((current) => ({ ...current, displayName: event.target.value }))} required value={areaForm.displayName} />
            </UiField>
            <UiField label="Descrição" wide>
              <textarea className="gso-ui-control" onChange={(event) => setAreaForm((current) => ({ ...current, description: event.target.value }))} rows={2} value={areaForm.description} />
            </UiField>
          </div>
          <div className="gso-ui-actions">
            <UiButton disabled={busy} icon="plus" type="submit" variant="primary">Criar área</UiButton>
          </div>
        </form>
      </UiCard>

      <UiCard labelledBy="structure-functions-title">
        <UiCardHeader
          description="Funções organizam o trabalho e podem apontar para um perfil padrão."
          icon="list"
          title="Funções"
          titleId="structure-functions-title"
        />
        <div className="gso-ui-card-body">
          <ul className="gso-ui-rowlist">
            {functions.map((item) => (
              <li className="gso-ui-rowcard" key={item.function_id}>
                <div className="gso-ui-rowcard-main">
                  <div>
                    <strong>{item.name}</strong>
                    <p>{item.area_label} · {item.default_access_profile_name || 'sem perfil padrão'}</p>
                  </div>
                  <div className="gso-ui-table-actions">
                    <UiBadge dot tone={item.is_active ? 'success' : 'neutral'}>{item.is_active ? 'Ativa' : 'Inativa'}</UiBadge>
                    <UiButton compact disabled={busy} onClick={() => onToggleFunction(item)}>
                      {item.is_active ? 'Desativar' : 'Ativar'}
                    </UiButton>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <form className="gso-ui-card-body" onSubmit={(event) => { event.preventDefault(); onCreateFunction(); }}>
          <div className="gso-ui-grid">
            <UiField label="Área">
              <select className="gso-ui-control gso-ui-select" onChange={(event) => setFunctionForm((current) => ({ ...current, areaKey: event.target.value }))} required value={functionForm.areaKey}>
                {areas.filter((area) => area.is_active).map((area) => <option key={area.area_key} value={area.area_key}>{area.display_name}</option>)}
              </select>
            </UiField>
            <UiField label="Nome">
              <input className="gso-ui-control" onChange={(event) => setFunctionForm((current) => ({ ...current, name: event.target.value }))} required value={functionForm.name} />
            </UiField>
            <UiField label="Perfil padrão" wide>
              <select className="gso-ui-control gso-ui-select" onChange={(event) => setFunctionForm((current) => ({ ...current, profileId: event.target.value }))} value={functionForm.profileId}>
                <option value="">Sem perfil padrão</option>
                {profiles.filter((profile) => profile.is_active).map((profile) => <option key={profile.access_profile_id} value={profile.access_profile_id}>{profile.name}</option>)}
              </select>
            </UiField>
            <UiField label="Descrição" wide>
              <textarea className="gso-ui-control" onChange={(event) => setFunctionForm((current) => ({ ...current, description: event.target.value }))} rows={2} value={functionForm.description} />
            </UiField>
          </div>
          <div className="gso-ui-actions">
            <UiButton disabled={busy} icon="plus" type="submit" variant="primary">Criar função</UiButton>
          </div>
        </form>
      </UiCard>
    </div>
  );
}

function PermissionsCapabilityPanel(props: {
  busy: boolean;
  capabilities: Array<{ capability_key: string; display_name: string; description: string | null; domain: string; is_active: boolean }>;
  onCreate: () => void;
  onSaveCapabilities: (profileId: string, keys: string[]) => void;
  onToggle: (profile: AdminInternalProfileRow) => void;
  profileCapabilities: Array<{ access_profile_id: string; capability_key: string }>;
  profileForm: { name: string; description: string };
  profiles: AdminInternalProfileRow[];
  setProfileForm: React.Dispatch<React.SetStateAction<{ name: string; description: string }>>;
}) {
  const { busy, capabilities, onCreate, onSaveCapabilities, onToggle, profileCapabilities, profileForm, profiles, setProfileForm } = props;
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
  const capabilityOption = (capability: (typeof capabilities)[number]) => (
    <label className="gso-ui-toggle" key={capability.capability_key}>
      <span>
        {capability.display_name}
        {capability.description ? <small className="gso-ui-metric-sub">{capability.description}</small> : null}
      </span>
      <input checked={selectedKeys.includes(capability.capability_key)} onChange={() => toggleCapability(capability.capability_key)} type="checkbox" />
    </label>
  );

  return (
    <div className="gso-ui-split">
      <UiCard labelledBy="profiles-title">
        <UiCardHeader
          description="Monte perfis combinando telas de consulta e ações permitidas. As decisões efetivas continuam protegidas pela área e pelo perfil atribuído."
          icon="shield"
          title="Perfis e permissões"
          titleId="profiles-title"
        />
        <div className="gso-ui-card-body">
          <ul className="gso-ui-rowlist">
            {profiles.map((profile) => (
              <li className="gso-ui-rowcard" key={profile.access_profile_id}>
                <div className="gso-ui-rowcard-main">
                  <div>
                    <button className="gso-ui-rowselect" onClick={() => setSelectedProfileId(profile.access_profile_id)} type="button">{profile.name}</button>
                    <p>{profile.user_count} usuários · {profile.capability_count} permissões · {profile.screen_count} telas</p>
                  </div>
                  <div className="gso-ui-table-actions">
                    <UiBadge dot tone={profile.is_active ? 'success' : 'danger'}>{profile.is_active ? 'Ativo' : 'Inativo'}</UiBadge>
                    {!profile.is_system ? <UiButton compact disabled={busy} onClick={() => onToggle(profile)}>{profile.is_active ? 'Desativar' : 'Ativar'}</UiButton> : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <form className="gso-ui-card-body" onSubmit={(event) => { event.preventDefault(); onCreate(); }}>
          <div className="gso-ui-grid">
            <UiField label="Nome do perfil">
              <input className="gso-ui-control" onChange={(event) => setProfileForm((current) => ({ ...current, name: event.target.value }))} required value={profileForm.name} />
            </UiField>
            <UiField label="Descrição" wide>
              <textarea className="gso-ui-control" onChange={(event) => setProfileForm((current) => ({ ...current, description: event.target.value }))} rows={2} value={profileForm.description} />
            </UiField>
          </div>
          <div className="gso-ui-actions">
            <UiButton disabled={busy} icon="plus" type="submit" variant="primary">Criar perfil personalizado</UiButton>
          </div>
        </form>
      </UiCard>

      <aside>
        <UiCard labelledBy="profile-capabilities-title">
          <UiCardHeader
            description="Escolha primeiro as telas que a pessoa poderá consultar. Em seguida, libere somente as ações necessárias."
            icon="key"
            title="Permissões do perfil"
            titleId="profile-capabilities-title"
            tone="accent"
          />
          <div className="gso-ui-card-body">
            <UiField label="Perfil selecionado">
              <select className="gso-ui-control gso-ui-select" onChange={(event) => setSelectedProfileId(event.target.value)} value={selectedProfileId}>
                {profiles.map((profile) => <option key={profile.access_profile_id} value={profile.access_profile_id}>{profile.name}</option>)}
              </select>
            </UiField>
          </div>
          <fieldset className="gso-ui-card-body">
            <legend className="gso-ui-field-label">Telas para consultar</legend>
            <div className="gso-ui-groups">{viewCapabilities.map(capabilityOption)}</div>
          </fieldset>
          <fieldset className="gso-ui-card-body">
            <legend className="gso-ui-field-label">Ações permitidas</legend>
            <div className="gso-ui-groups">{actionCapabilities.map(capabilityOption)}</div>
          </fieldset>
          <div className="gso-ui-card-body">
            <div className="gso-ui-actions">
              <UiButton disabled={busy || !selectedProfileId} icon="check" onClick={() => onSaveCapabilities(selectedProfileId, selectedKeys)} variant="primary">
                Salvar permissões
              </UiButton>
            </div>
          </div>
        </UiCard>
      </aside>
    </div>
  );
}

function ProfileScreenAccessPanel(props: {
  busy: boolean;
  catalog: AdminInternalScreenCatalogRow[];
  grants: Array<{ access_profile_id: string; screen_key: AdminInternalScreenCatalogRow['screen_key'] }>;
  onSave: (profileId: string, keys: AdminInternalScreenCatalogRow['screen_key'][]) => void;
  profiles: AdminInternalProfileRow[];
}) {
  const { busy, catalog, grants, onSave, profiles } = props;
  const [selectedProfileId, setSelectedProfileId] = useState(profiles[0]?.access_profile_id ?? '');
  const [keys, setKeys] = useState<AdminInternalScreenCatalogRow['screen_key'][]>([]);

  useEffect(() => { setKeys(grants.filter((grant) => grant.access_profile_id === selectedProfileId).map((grant) => grant.screen_key)); }, [grants, selectedProfileId]);
  useEffect(() => { if (!profiles.some((profile) => profile.access_profile_id === selectedProfileId)) setSelectedProfileId(profiles[0]?.access_profile_id ?? ''); }, [profiles, selectedProfileId]);

  return (
    <UiCard labelledBy="profile-screens-title">
      <UiCardHeader
        description="Um perfil pode liberar cada aba individualmente; colaboradores recebem apenas as telas do vínculo e do perfil atribuído."
        icon="layers"
        title="Telas do perfil"
        titleId="profile-screens-title"
      />
      <div className="gso-ui-card-body">
        <UiField label="Perfil">
          <select className="gso-ui-control gso-ui-select" onChange={(event) => setSelectedProfileId(event.target.value)} value={selectedProfileId}>
            {profiles.map((profile) => <option key={profile.access_profile_id} value={profile.access_profile_id}>{profile.name}</option>)}
          </select>
        </UiField>
      </div>
      <div className="gso-ui-card-body">
        <div className="gso-ui-groups">
          {catalog.map((screen) => (
            <label className="gso-ui-toggle" key={screen.screen_key}>
              <span>{screen.display_name}</span>
              <input
                checked={keys.includes(screen.screen_key)}
                disabled={busy || !selectedProfileId}
                onChange={() => setKeys((current) => current.includes(screen.screen_key) ? current.filter((key) => key !== screen.screen_key) : [...current, screen.screen_key])}
                type="checkbox"
              />
            </label>
          ))}
        </div>
        <div className="gso-ui-actions">
          <UiButton disabled={busy || !selectedProfileId} icon="check" onClick={() => onSave(selectedProfileId, keys)} variant="primary">Salvar telas do perfil</UiButton>
        </div>
      </div>
    </UiCard>
  );
}

function ScreenAccessPanel(props: {
  busy: boolean;
  catalog: AdminInternalScreenCatalogRow[];
  grants: AdminInternalMembershipScreenGrantRow[];
  onSave: (membershipId: string, keys: AdminInternalScreenCatalogRow['screen_key'][]) => void;
  users: AdminInternalAccessUserRow[];
}) {
  const { busy, catalog, grants, onSave, users } = props;
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

  return (
    <UiCard labelledBy="member-screens-title">
      <UiCardHeader
        description="Escolha as telas que cada pessoa poderá consultar nesta área. Para permitir edição ou outras ações, ajuste as permissões do perfil atribuído."
        icon="users"
        title="Telas liberadas por colaborador"
        titleId="member-screens-title"
      />
      <div className="gso-ui-card-body">
        <div className="gso-ui-grid">
          <UiField label="Colaborador">
            <select className="gso-ui-control gso-ui-select" onChange={(event) => setSelectedUserId(event.target.value)} value={selectedUser?.user_id ?? ''}>
              {users.map((user) => <option key={user.user_id} value={user.user_id}>{user.full_name || user.email || 'Colaborador'}</option>)}
            </select>
          </UiField>
          {selectedUser && selectedUser.areas.length > 1 ? (
            <UiField label="Área">
              <select className="gso-ui-control gso-ui-select" onChange={(event) => setSelectedAreaKey(event.target.value)} value={selectedAreaKey}>
                {selectedUser.areas.map((area) => <option key={String(area.membership_id)} value={String(area.area_key ?? '')}>{String(area.area_label ?? 'Área')}</option>)}
              </select>
            </UiField>
          ) : null}
        </div>
        <p className="gso-ui-note">{membershipId ? 'Selecione as telas desta área.' : 'Este colaborador ainda não possui uma área atribuída.'}</p>
      </div>
      {Object.entries(grouped).map(([category, screens]) => (
        <fieldset className="gso-ui-card-body" key={category}>
          <legend className="gso-ui-field-label">
            {category === 'workspace' ? 'Espaço de trabalho' : category === 'intelligence' ? 'Visão gerencial' : 'Administração'}
          </legend>
          <div className="gso-ui-groups">
            {screens.map((screen) => (
              <label className="gso-ui-toggle" key={screen.screen_key}>
                <span>{screen.display_name}</span>
                <input
                  checked={keys.includes(screen.screen_key)}
                  disabled={!membershipId || busy}
                  onChange={() => setKeys((current) => current.includes(screen.screen_key) ? current.filter((key) => key !== screen.screen_key) : [...current, screen.screen_key])}
                  type="checkbox"
                />
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      <div className="gso-ui-card-body">
        <div className="gso-ui-actions">
          <UiButton disabled={!membershipId || busy} icon="check" onClick={() => onSave(membershipId, keys)} variant="primary">Salvar telas deste colaborador</UiButton>
        </div>
      </div>
    </UiCard>
  );
}
