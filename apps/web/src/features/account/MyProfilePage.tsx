import { useCallback, useEffect, useRef, useState } from 'react';
import { Avatar } from '../../components/Avatar';
import { useAuthContext } from '../auth/auth-context';
import { UiButton } from '../settings/ui/UiButton';
import { UiCard } from '../settings/ui/UiCard';
import { UiCardHeader } from '../settings/ui/UiCardHeader';
import { UiDetailList } from '../settings/ui/UiDetailList';
import { UiField } from '../settings/ui/UiField';
import { UiHintBand } from '../settings/ui/UiHintBand';
import { UiPageHeader } from '../settings/ui/UiPageHeader';
import '../settings/settings-ui.css';
import {
  AVATAR_ALLOWED_MIME,
  changeSelfPassword,
  fetchSelfProfile,
  removeSelfAvatar,
  selfPasswordPolicyViolation,
  updateSelfProfile,
  uploadSelfAvatar,
  validateAvatarFile,
  type SelfProfileRow,
} from './account-api';

type Feedback = { text: string; tone: 'positive' | 'critical' } | null;

/**
 * "Meu perfil": a unica tela onde a pessoa edita os proprios dados.
 *
 * O que e editavel aqui e exatamente o que o contrato de auto-edicao de
 * `public.profiles` aceita — `full_name` e `avatar_url`. E-mail, papel, area,
 * funcao e perfil de acesso sao administrados por quem tem permissao de acesso
 * e aparecem apenas como leitura, com a origem declarada.
 */
export function MyProfilePage() {
  const { gate, refreshGate, user } = useAuthContext();
  const userId = user?.id ?? null;
  const [profile, setProfile] = useState<SelfProfileRow | null>(null);
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const row = await fetchSelfProfile();
      setProfile(row);
      setFullName(row?.full_name ?? '');
    } catch (error) {
      setFeedback({
        text: error instanceof Error ? error.message : 'Falha ao carregar o seu perfil.',
        tone: 'critical',
      });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function run(action: () => Promise<SelfProfileRow | null>, success: string) {
    setBusy(true);
    setFeedback(null);
    try {
      const row = await action();
      if (row) {
        setProfile(row);
        setFullName(row.full_name ?? '');
      } else {
        await load();
      }
      // O casco lê nome e foto do contexto de ator. Sem revalidar, a sidebar
      // continuaria mostrando o dado antigo até o próximo login.
      await refreshGate();
      setFeedback({ text: success, tone: 'positive' });
    } catch (error) {
      setFeedback({
        text: error instanceof Error ? error.message : 'Não foi possível concluir a ação.',
        tone: 'critical',
      });
    } finally {
      setBusy(false);
    }
  }

  function onPickAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !userId) return;
    const violation = validateAvatarFile(file);
    if (violation) {
      setFeedback({ text: violation, tone: 'critical' });
      return;
    }
    void run(() => uploadSelfAvatar(userId, file), 'Foto atualizada.');
  }

  if (!userId) return null;

  const roles = gate.actor?.roles ?? [];
  const screenKeys = gate.actor?.screen_keys ?? [];

  return (
    <div className="gso-ui gso-ui-shell">
      <div className="gso-ui-shell-chrome">
        <UiPageHeader
          description="Atualize os seus dados pessoais e a sua senha. Papel, área e permissões continuam sob a administração de acessos."
          parentHref="/inicio"
          parentLabel="Início"
          title="Meu perfil"
          titleId="my-profile-title"
        />
      </div>

      <div className="gso-ui-shell-body">
        {feedback ? (
          <p
            className={feedback.tone === 'critical' ? 'gso-ui-field-error' : 'gso-ui-note'}
            role="status"
          >
            {feedback.text}
          </p>
        ) : null}

        <UiCard labelledBy="my-profile-identity-title">
          <UiCardHeader
            description="Nome e foto são os únicos dados de identidade que você edita por conta própria."
            icon="users"
            title="Identidade"
            titleId="my-profile-identity-title"
            tone="primary"
          />
          <div className="gso-ui-card-body">
            <div className="gso-ui-actions" style={{ alignItems: 'center' }}>
              <Avatar
                email={profile?.email ?? null}
                name={profile?.full_name ?? null}
                size="lg"
                src={profile?.avatar_url ?? null}
                label="Sua foto de perfil"
              />
              <input
                accept={AVATAR_ALLOWED_MIME.join(',')}
                aria-label="Escolher foto de perfil"
                className="sr-only"
                onChange={onPickAvatar}
                ref={fileInputRef}
                type="file"
              />
              <UiButton
                disabled={busy || loading}
                icon="plus"
                onClick={() => fileInputRef.current?.click()}
              >
                {profile?.avatar_url ? 'Trocar foto' : 'Enviar foto'}
              </UiButton>
              {profile?.avatar_url ? (
                <UiButton
                  disabled={busy}
                  icon="x"
                  onClick={() => void run(() => removeSelfAvatar(userId), 'Foto removida.')}
                  variant="ghost"
                >
                  Remover foto
                </UiButton>
              ) : null}
            </div>
            <p className="gso-ui-note">
              PNG, JPEG ou WebP, até 2 MB. Sem foto, o sistema mostra as suas iniciais.
            </p>

            <form
              className="gso-ui-grid"
              onSubmit={(event) => {
                event.preventDefault();
                void run(() => updateSelfProfile(userId, { fullName }), 'Perfil atualizado.');
              }}
            >
              <UiField label="Nome completo" wide>
                <input
                  autoComplete="name"
                  className="gso-ui-control"
                  disabled={busy || loading}
                  onChange={(event) => setFullName(event.target.value)}
                  value={fullName}
                />
              </UiField>
              <div className="gso-ui-actions">
                <UiButton disabled={busy || loading} icon="check" type="submit" variant="primary">
                  {busy ? 'Salvando…' : 'Salvar alterações'}
                </UiButton>
              </div>
            </form>
          </div>
        </UiCard>

        <UiCard labelledBy="my-profile-readonly-title">
          <UiCardHeader
            description="Estes dados são administrados por quem tem permissão de acesso. Peça a alteração ao administrador."
            icon="shield"
            title="Administrado pela gestão de acessos"
            titleId="my-profile-readonly-title"
            tone="neutral"
          />
          <div className="gso-ui-card-body">
            <UiDetailList
              columns
              items={[
                {
                  icon: 'mail',
                  label: 'E-mail',
                  value: profile?.email ?? 'Indisponível',
                },
                {
                  icon: 'shield',
                  label: 'Papéis de plataforma',
                  value: roles.length ? roles.join(', ') : 'Indisponível',
                },
                {
                  icon: 'layers',
                  label: 'Telas autorizadas',
                  value: screenKeys.length ? String(screenKeys.length) : 'Indisponível',
                },
                {
                  icon: 'users',
                  label: 'Área, função e perfil de acesso',
                  value: 'Definidos em Usuários e acesso pelo administrador',
                },
              ]}
            />
          </div>
        </UiCard>

        <SelfPasswordCard />

        <UiHintBand
          description="Nome e foto valem para todo o sistema: a sidebar, o menu do usuário e as listas administrativas passam a mostrar o que você salvar aqui."
          title="Onde estes dados aparecem"
        />
      </div>
    </div>
  );
}

/**
 * Troca da propria senha. Exige a senha atual, e quem confere e o servidor:
 * a Edge Function reautentica de verdade antes de aceitar a nova credencial.
 * Nenhum valor digitado sobrevive ao envio.
 */
function SelfPasswordCard() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setFeedback(null);
    if (newPassword !== confirmation) {
      setFeedback({ text: 'A confirmação não confere com a nova senha.', tone: 'critical' });
      return;
    }
    const violation = selfPasswordPolicyViolation(newPassword);
    if (violation) {
      setFeedback({ text: violation, tone: 'critical' });
      return;
    }

    setBusy(true);
    try {
      await changeSelfPassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmation('');
      setFeedback({ text: 'Senha alterada.', tone: 'positive' });
    } catch (error) {
      setFeedback({
        text: error instanceof Error ? error.message : 'Não foi possível trocar a senha agora.',
        tone: 'critical',
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <UiCard labelledBy="my-profile-password-title">
      <UiCardHeader
        description="Informe a senha atual para confirmar que é você. A validação acontece no servidor."
        icon="key"
        title="Senha"
        titleId="my-profile-password-title"
        tone="warning"
      />
      <form className="gso-ui-card-body" onSubmit={(event) => void submit(event)}>
        <div className="gso-ui-grid">
          <UiField label="Senha atual">
            <input
              autoComplete="current-password"
              className="gso-ui-control"
              disabled={busy}
              onChange={(event) => setCurrentPassword(event.target.value)}
              type="password"
              value={currentPassword}
            />
          </UiField>
          <UiField hint="Mínimo de 12 caracteres, com maiúscula, minúscula e número." label="Nova senha">
            <input
              autoComplete="new-password"
              className="gso-ui-control"
              disabled={busy}
              onChange={(event) => setNewPassword(event.target.value)}
              type="password"
              value={newPassword}
            />
          </UiField>
          <UiField label="Confirme a nova senha" wide>
            <input
              autoComplete="new-password"
              className="gso-ui-control"
              disabled={busy}
              onChange={(event) => setConfirmation(event.target.value)}
              type="password"
              value={confirmation}
            />
          </UiField>
        </div>
        {feedback ? (
          <p className={feedback.tone === 'critical' ? 'gso-ui-field-error' : 'gso-ui-note'} role="status">
            {feedback.text}
          </p>
        ) : null}
        <div className="gso-ui-actions">
          <UiButton disabled={busy} icon="key" type="submit" variant="primary">
            {busy ? 'Salvando…' : 'Trocar senha'}
          </UiButton>
        </div>
      </form>
    </UiCard>
  );
}
