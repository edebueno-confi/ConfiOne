import type { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { LoadingState, SessionExpiredState } from '../../components/states';
import { AppButton, GhostButton } from '../../components/ui';
import { useAuthContext } from './auth-context';

/** Recepção neutra: autenticação, não screen grant, é o único requisito. */
export function ReceptionGate({ children }: { children: ReactNode }) {
  const { phase, sessionExpired, clearSessionExpired, signOut } = useAuthContext();

  if (phase === 'booting') return <LoadingState />;
  if (sessionExpired) {
    return (
      <SessionExpiredState
        action={
          <>
            <AppButton onClick={() => { clearSessionExpired(); void signOut(); }}>
              Voltar ao login
            </AppButton>
            <GhostButton onClick={() => clearSessionExpired()}>
              Fechar aviso
            </GhostButton>
          </>
        }
      />
    );
  }
  if (phase === 'anonymous') return <Navigate replace to="/login" />;
  if (phase === 'config-error') {
    return <LoadingState title="Configuração de acesso indisponível" />;
  }

  return <>{children}</>;
}
