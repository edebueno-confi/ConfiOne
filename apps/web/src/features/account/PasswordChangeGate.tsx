import { useState, type ReactNode } from 'react';
import { UiButton } from '../settings/ui/UiButton';
import { UiCard } from '../settings/ui/UiCard';
import { UiCardHeader } from '../settings/ui/UiCardHeader';
import { UiField } from '../settings/ui/UiField';
import { useAuthContext } from '../auth/auth-context';
import '../settings/settings-ui.css';
import {
  changeSelfPassword,
  refreshAuthClaims,
  requiresPasswordChange,
  selfPasswordPolicyViolation,
} from './account-api';

/**
 * Troca obrigatoria no primeiro acesso.
 *
 * Fica dentro do `AuthBootstrap`, acima de todas as rotas autenticadas, porque
 * a exigencia nao pode depender de qual area a pessoa abriu primeiro. Enquanto
 * `app_metadata.must_change_password` for verdadeiro, nenhuma rota autenticada
 * e renderizada: so esta tela e a saida da sessao.
 *
 * A verificacao le o claim do JWT ja em memoria, entao nao custa round-trip e
 * acontece antes de qualquer read model. O marcador so e limpo pela Edge
 * Function `account-self-password`, com o service_role.
 */
export function PasswordChangeGate({ children }: { children: ReactNode }) {
  const { phase, signOut, user } = useAuthContext();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const blocked =
    phase === 'authenticated' &&
    requiresPasswordChange(user?.app_metadata as Record<string, unknown> | undefined);

  if (!blocked) return <>{children}</>;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (newPassword !== confirmation) {
      setError('A confirmação não confere com a nova senha.');
      return;
    }
    if (!currentPassword) {
      setError('Informe sua senha atual.');
      return;
    }
    const violation = selfPasswordPolicyViolation(newPassword);
    if (violation) {
      setError(violation);
      return;
    }

    setBusy(true);
    try {
      await changeSelfPassword({ currentPassword, newPassword });
      // Os valores digitados saem da memoria do componente assim que a operacao
      // conclui: nada de senha fica em estado depois do uso.
      setCurrentPassword('');
      setNewPassword('');
      setConfirmation('');
      // Alterar a senha pelo Admin API pode invalidar o refresh token atual.
      // Nesse caso, a renovacao retorna 400; a funcao abaixo reautentica com a
      // nova senha e deixa o Auth emitir uma sessao valida com os claims novos.
      await refreshAuthClaims(newPassword);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível trocar a senha agora.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="gso-ui flex min-h-screen items-center justify-center bg-[color:var(--minimal-canvas)] px-4 py-10">
      <div className="w-full max-w-lg">
        <UiCard labelledBy="forced-password-title">
          <UiCardHeader
            description="Sua senha atual foi definida por um administrador. Defina uma senha só sua para continuar."
            icon="key"
            title="Troque a senha para continuar"
            titleId="forced-password-title"
            tone="warning"
          />
          <form className="gso-ui-card-body" onSubmit={(event) => void submit(event)}>
            <div className="gso-ui-grid">
              <UiField label="Senha atual" wide>
                <input
                  autoComplete="current-password"
                  className="gso-ui-control"
                  disabled={busy}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  type="password"
                  value={currentPassword}
                />
              </UiField>
              <UiField
                hint="Mínimo de 12 caracteres, com maiúscula, minúscula e número."
                label="Nova senha"
                wide
              >
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
            {error ? <p className="gso-ui-field-error" role="alert">{error}</p> : null}
            <div className="gso-ui-actions">
              <UiButton disabled={busy} icon="check" type="submit" variant="primary">
                {busy ? 'Salvando…' : 'Salvar nova senha'}
              </UiButton>
              <UiButton disabled={busy} onClick={() => void signOut()} variant="ghost">
                Sair da sessão
              </UiButton>
            </div>
          </form>
        </UiCard>
      </div>
    </div>
  );
}
