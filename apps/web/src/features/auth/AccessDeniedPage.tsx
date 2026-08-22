import { Navigate, useLocation } from 'react-router';
import { MinimalState } from '../../components/minimal-states';
import { MinimalButton, MinimalPage } from '../../components/minimal-ui';
import { useAuthContext } from './auth-context';

function describeReason(reason: unknown) {
  if (reason === 'missing-profile') {
    return 'Sua conta foi autenticada, mas ainda não tem acesso liberado para esta área.';
  }

  if (reason === 'inactive-profile') {
    return 'Sua conta existe, mas está inativa neste momento. Fale com quem administra o acesso para voltar a operar.';
  }

  if (reason === 'missing-platform-admin') {
    return 'Sua conta não tem permissão para abrir esta área.';
  }

  if (reason === 'missing-authorized-workspace') {
    return 'Esta área não está liberada para a sua conta agora. Se você acredita que deveria entrar, revise seu acesso com a equipe responsável.';
  }

  return 'Sua conta não tem permissão para abrir esta área agora.';
}

export function AccessDeniedPage() {
  const location = useLocation();
  const { phase, sessionExpired, signOut } = useAuthContext();

  if (phase === 'anonymous' && !sessionExpired) {
    return <Navigate replace to="/login" />;
  }

  if (phase === 'authenticated' && !sessionExpired) {
    return (
      <Navigate
        replace
        state={{
          fromAccessDenied: true,
          reason: (location.state as { reason?: unknown } | null)?.reason,
        }}
        to="/inicio"
      />
    );
  }

  return (
    <MinimalPage>
      <MinimalState
        description={describeReason((location.state as { reason?: unknown } | null)?.reason)}
        title="Acesso não autorizado"
        tone="critical"
        actions={
          <>
            <MinimalButton onClick={() => void signOut()}>
              Encerrar sessão
            </MinimalButton>
            <MinimalButton
              onClick={() => window.history.back()}
              variant="secondary"
            >
              Voltar
            </MinimalButton>
          </>
        }
      />
    </MinimalPage>
  );
}
