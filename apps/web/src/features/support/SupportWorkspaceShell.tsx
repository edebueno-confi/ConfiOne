import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuthContext } from '../auth/auth-context';
import { listInternalActionAreaAuthContexts } from '../internal-actions/internal-actions-api';
import { MinimalAppShell } from '../navigation/MinimalAppShell';

function useInternalActionAreaAccess(
  userId: string | null | undefined,
  isPlatformAdmin: boolean,
) {
  const [hasInternalActionAreaAccess, setHasInternalActionAreaAccess] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!userId || isPlatformAdmin) {
      setHasInternalActionAreaAccess(false);
      return () => {
        cancelled = true;
      };
    }

    listInternalActionAreaAuthContexts()
      .then((contexts) => {
        if (!cancelled) {
          setHasInternalActionAreaAccess(
            contexts.some((context) => context.canViewQueue),
          );
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHasInternalActionAreaAccess(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isPlatformAdmin, userId]);

  return hasInternalActionAreaAccess;
}

export function SupportWorkspaceShell() {
  const { gate, user } = useAuthContext();
  const isPlatformAdmin = gate.actor?.is_platform_admin === true;
  const hasInternalActionAreaAccess = useInternalActionAreaAccess(
    user?.id,
    isPlatformAdmin,
  );

  return (
    <MinimalAppShell
      permissions={{ isPlatformAdmin, roles: gate.actor?.roles ?? [], hasInternalActionAreaAccess }}
      userSubtitle={isPlatformAdmin ? 'Administrador da plataforma' : 'Operação interna'}
    >
      <Outlet />
    </MinimalAppShell>
  );
}
