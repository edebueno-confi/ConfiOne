import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import {
  ErrorState,
  LoadingState,
  StateFrame,
} from '../../components/states';
import { AppButton, GhostButton } from '../../components/ui';
import { useAuthContext } from '../auth/auth-context';

function SupportGateBootShell() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[color:var(--minimal-canvas)] px-5 py-10">
      <LoadingState
        title="Preparando o suporte"
        description="Estamos validando a sessão e liberando as áreas autorizadas."
      />
    </div>
  );
}

export function SupportGate({ children }: { children: ReactNode }) {
  const location = useLocation();
  const {
    phase,
    gate,
    sessionExpired,
    configError,
    signOut,
    clearSessionExpired,
  } = useAuthContext();

  if (phase === 'config-error') {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-6 py-12">
        <ErrorState
          title="Configuração de acesso indisponível"
          description={
            configError ??
            'Este ambiente ainda não recebeu as configurações mínimas para abrir o suporte.'
          }
        />
      </div>
    );
  }

  if (sessionExpired) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-6 py-12">
        <StateFrame
          title="Sessão expirada"
          description="Sua sessão perdeu validade durante a operação. Entre novamente para continuar no suporte."
          eyebrow="auth"
          tone="critical"
          actions={
            <>
              <AppButton
                onClick={() => {
                  clearSessionExpired();
                  void signOut();
                }}
              >
                Voltar ao login
              </AppButton>
              <GhostButton onClick={() => clearSessionExpired()}>
                Fechar aviso
              </GhostButton>
            </>
          }
        />
      </div>
    );
  }

  if (phase === 'booting') {
    return <SupportGateBootShell />;
  }

  if (phase === 'anonymous') {
    const redirectTo = `${location.pathname}${location.search}`;
    return <Navigate replace to={`/login?redirectTo=${encodeURIComponent(redirectTo)}`} />;
  }

  if (phase === 'authenticated' && gate.phase === 'loading') {
    return <SupportGateBootShell />;
  }

  if (phase === 'authenticated' && gate.phase === 'denied') {
    return <Navigate replace to="/access-denied" state={{ reason: gate.denialReason ?? 'route-not-authorized' }} />;
  }

  if (phase === 'authenticated' && (gate.phase === 'error' || gate.phase === 'contract-unavailable')) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-6 py-12">
        <ErrorState
          title="Acesso ao suporte indisponível"
          description={gate.message ?? 'Não foi possível validar seu acesso a esta área.'}
        />
      </div>
    );
  }

  if (
    phase === 'authenticated' &&
    gate.actor?.is_platform_admin !== true &&
    gate.actor?.roles.includes('dashboard_viewer') === true
  ) {
    return <Navigate replace to="/access-denied" state={{ reason: 'route-not-authorized' }} />;
  }

  if (phase === 'authenticated' && gate.phase === 'ready') {
    const isSupportOperator =
      gate.actor?.is_platform_admin === true ||
      gate.actor?.roles.some((role) => role === 'support_manager' || role === 'support_agent') === true ||
      gate.actor?.screen_keys?.some((key) =>
        ['support_inbox', 'support_queue', 'support_tickets'].includes(key),
      ) === true;

    if (!isSupportOperator) {
      return <Navigate replace to="/access-denied" state={{ reason: 'route-not-authorized' }} />;
    }
  }

  return <>{children}</>;
}
