import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { ErrorState, LoadingState, StateFrame } from '../../components/states';
import { AppButton, GhostButton } from '../../components/ui';
import { useAuthContext } from '../auth/auth-context';
import { MinimalAppShell } from '../navigation/MinimalAppShell';

/**
 * Gate de auto-servico.
 *
 * Editar o proprio perfil nao e privilegio de area: qualquer identidade com
 * contexto autenticado valido precisa alcancar "Meu perfil". Por isso este gate
 * NAO repete a prova operacional do `SupportGate` (fila, tickets, inbox) — ele
 * exige apenas sessao viva e contexto de ator pronto. A autorizacao real do que
 * pode ser escrito continua no banco, na RLS de `public.profiles` e nas policies
 * do bucket `profile-avatars`.
 */
export function AccountSelfGate({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { clearSessionExpired, configError, gate, phase, sessionExpired, signOut } = useAuthContext();

  if (phase === 'config-error') {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-6 py-12">
        <ErrorState
          title="Configuração de acesso indisponível"
          description={configError ?? 'Este ambiente ainda não recebeu as configurações mínimas.'}
        />
      </div>
    );
  }

  if (sessionExpired) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-6 py-12">
        <StateFrame
          title="Sessão expirada"
          description="Sua sessão perdeu validade. Entre novamente para continuar."
          tone="critical"
          actions={
            <>
              <AppButton onClick={() => { clearSessionExpired(); void signOut(); }}>
                Voltar ao login
              </AppButton>
              <GhostButton onClick={() => clearSessionExpired()}>Fechar aviso</GhostButton>
            </>
          }
        />
      </div>
    );
  }

  if (phase === 'booting' || (phase === 'authenticated' && gate.phase === 'loading')) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[color:var(--minimal-canvas)] px-5 py-10">
        <LoadingState title="Abrindo o seu perfil" description="Estamos validando a sessão." />
      </div>
    );
  }

  if (phase === 'anonymous') {
    const redirectTo = `${location.pathname}${location.search}`;
    return <Navigate replace to={`/login?redirectTo=${encodeURIComponent(redirectTo)}`} />;
  }

  if (phase === 'authenticated' && gate.phase === 'denied') {
    return <Navigate replace to="/access-denied" state={{ reason: gate.denialReason ?? 'route-not-authorized' }} />;
  }

  if (phase === 'authenticated' && (gate.phase === 'error' || gate.phase === 'contract-unavailable')) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-6 py-12">
        <ErrorState
          title="Perfil indisponível"
          description={gate.message ?? 'Não foi possível validar a sua sessão.'}
        />
      </div>
    );
  }

  return <>{children}</>;
}

/** Mesmo casco das demais areas internas, para o menu do usuário continuar presente. */
export function AccountSelfShell() {
  const { gate } = useAuthContext();
  const isPlatformAdmin = gate.actor?.is_platform_admin === true;

  return (
    <MinimalAppShell
      permissions={{ isPlatformAdmin, fullName: gate.actor?.profile.full_name ?? null, roles: gate.actor?.roles ?? [], screenKeys: gate.actor?.screen_keys ?? [] }}
      userSubtitle={isPlatformAdmin ? 'Administrador da plataforma' : 'Operação interna'}
    >
      <Outlet />
    </MinimalAppShell>
  );
}
