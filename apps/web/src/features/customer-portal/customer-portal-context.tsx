import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type {
  CustomerPortalActiveTenantContext,
  CustomerPortalAvailableTenant,
  CustomerPortalSessionStatus,
  Uuid,
} from '../../contracts/support-contracts';
import { AppError } from '../../app/errors';
import { useAuthContext } from '../auth/auth-context';
import {
  fetchCustomerPortalActiveTenantContext,
  fetchCustomerPortalAvailableTenants,
  fetchCustomerPortalSessionStatus,
  setCustomerPortalActiveTenant,
} from './customer-portal-api';

export type CustomerPortalRuntimePhase =
  | 'initializing'
  | 'ready'
  | 'stale_context'
  | 'session_expired'
  | 'access_revoked'
  | 'tenant_unavailable'
  | 'network_retryable'
  | 'fatal_error';

interface CustomerPortalTenantContextValue {
  phase: CustomerPortalRuntimePhase;
  activeContext: CustomerPortalActiveTenantContext | null;
  availableTenants: CustomerPortalAvailableTenant[];
  canRunSensitiveActions: boolean;
  errorMessage: string | null;
  hasNoTenantAccess: boolean;
  isContextStale: boolean;
  isLoading: boolean;
  isRefreshing: boolean;
  isSwitching: boolean;
  pendingContext: CustomerPortalActiveTenantContext | null;
  phaseMessage: string | null;
  staleMessage: string | null;
  switchingTenantId: Uuid | null;
  ensureFreshContext: () => Promise<boolean>;
  refresh: () => Promise<void>;
  switchTenant: (tenantId: Uuid) => Promise<void>;
}

const CustomerPortalTenantContext = createContext<CustomerPortalTenantContextValue | null>(
  null,
);

function getTenantContextSignature(context: CustomerPortalActiveTenantContext | null) {
  if (!context) {
    return null;
  }

  return `${context.tenantId}:${context.contextVersion}`;
}

function mapPortalContextErrorMessage(error: unknown, fallback: string) {
  if (error instanceof AppError) {
    return error.message;
  }

  return error instanceof Error ? error.message : fallback;
}

function mapSessionStatusToPhase(
  status: CustomerPortalSessionStatus,
): Exclude<CustomerPortalRuntimePhase, 'initializing' | 'stale_context' | 'network_retryable' | 'fatal_error' | 'session_expired'> {
  if (status.sessionState === 'ready') {
    return 'ready';
  }

  if (status.sessionState === 'access_revoked') {
    return 'access_revoked';
  }

  return 'tenant_unavailable';
}

async function fetchTenantContextSnapshot() {
  const [sessionStatus, availableTenants, activeContext] = await Promise.all([
    fetchCustomerPortalSessionStatus(),
    fetchCustomerPortalAvailableTenants(),
    fetchCustomerPortalActiveTenantContext(),
  ]);

  return {
    sessionStatus,
    activeContext,
    availableTenants,
  };
}

export function getCustomerPortalBlockedActionMessage(
  phase: CustomerPortalRuntimePhase,
  phaseMessage: string | null,
) {
  if (phase === 'stale_context') {
    return 'O contexto do portal mudou em outra aba. Atualize para continuar.';
  }

  if (phase === 'session_expired') {
    return 'Sua sessão expirou. Entre novamente para continuar no portal.';
  }

  if (phase === 'access_revoked') {
    return (
      phaseMessage ??
      'Seu acesso customer-facing não está mais disponível para esta sessão.'
    );
  }

  if (phase === 'tenant_unavailable') {
    return (
      phaseMessage ??
      'Nenhum tenant habilitado está disponível para esta sessão agora.'
    );
  }

  if (phase === 'network_retryable') {
    return (
      phaseMessage ??
      'O portal não conseguiu se reconectar agora. Tente novamente antes de continuar.'
    );
  }

  if (phase === 'fatal_error') {
    return (
      phaseMessage ??
      'O portal não conseguiu validar sua sessão customer-facing agora.'
    );
  }

  if (phase === 'initializing') {
    return 'O portal ainda está validando seu contexto atual.';
  }

  return phaseMessage ?? 'O portal não está pronto para concluir esta operação.';
}

export function CustomerPortalTenantContextProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { markSessionExpired, user } = useAuthContext();
  const [phase, setPhase] = useState<CustomerPortalRuntimePhase>('initializing');
  const [activeContext, setActiveContext] =
    useState<CustomerPortalActiveTenantContext | null>(null);
  const [availableTenants, setAvailableTenants] = useState<CustomerPortalAvailableTenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pendingContext, setPendingContext] =
    useState<CustomerPortalActiveTenantContext | null>(null);
  const [phaseMessage, setPhaseMessage] = useState<string | null>(null);
  const [staleMessage, setStaleMessage] = useState<string | null>(null);
  const [switchingTenantId, setSwitchingTenantId] = useState<Uuid | null>(null);

  const acceptedSignatureRef = useRef<string | null>(null);
  const isRevalidatingRef = useRef(false);

  function resetRuntimeState(nextPhase: CustomerPortalRuntimePhase, nextMessage: string | null) {
    setPhase(nextPhase);
    setPhaseMessage(nextMessage);
    setActiveContext(null);
    setPendingContext(null);
    setStaleMessage(null);
    acceptedSignatureRef.current = null;
  }

  function acceptTenantContext(snapshot: {
    activeContext: CustomerPortalActiveTenantContext;
    availableTenants: CustomerPortalAvailableTenant[];
  }) {
    setAvailableTenants(snapshot.availableTenants);
    setActiveContext(snapshot.activeContext);
    setPendingContext(null);
    setStaleMessage(null);
    setPhaseMessage(null);
    setPhase('ready');
    acceptedSignatureRef.current = getTenantContextSignature(snapshot.activeContext);
  }

  function handleOperationalFailure(error: unknown, fallbackMessage: string) {
    if (error instanceof AppError) {
      if (error.code === 'session-expired') {
        resetRuntimeState('session_expired', error.message);
        markSessionExpired();
        return false;
      }

      if (error.code === 'network-retryable') {
        resetRuntimeState('network_retryable', error.message);
        return false;
      }

      if (error.code === 'permission-denied') {
        resetRuntimeState('access_revoked', error.message);
        return false;
      }

      if (error.code === 'contract-unavailable') {
        resetRuntimeState('fatal_error', error.message);
        return false;
      }
    }

    resetRuntimeState('fatal_error', mapPortalContextErrorMessage(error, fallbackMessage));
    return false;
  }

  async function loadTenantContext(options?: {
    mode?: 'blocking' | 'refresh' | 'switch' | 'revalidate';
  }) {
    const mode = options?.mode ?? 'blocking';
    const shouldShowBlockingState = mode === 'blocking' || mode === 'switch';
    const shouldShowRefreshState = mode === 'refresh';

    if (shouldShowBlockingState) {
      setIsLoading(true);
      if (mode === 'blocking') {
        setPhase('initializing');
        setPhaseMessage(null);
      }
    }

    if (shouldShowRefreshState) {
      setIsRefreshing(true);
    }

    try {
      const snapshot = await fetchTenantContextSnapshot();
      const nextPhase = mapSessionStatusToPhase(snapshot.sessionStatus);

      if (nextPhase !== 'ready' || !snapshot.activeContext) {
        setAvailableTenants(snapshot.availableTenants);
        resetRuntimeState(nextPhase, snapshot.sessionStatus.reasonMessage);
        return false;
      }

      const nextSignature = getTenantContextSignature(snapshot.activeContext);
      const previousSignature = acceptedSignatureRef.current;
      const contextChangedElsewhere =
        mode === 'revalidate' &&
        previousSignature !== null &&
        previousSignature !== nextSignature;

      if (contextChangedElsewhere) {
        setAvailableTenants(snapshot.availableTenants);
        setPendingContext(snapshot.activeContext);
        setActiveContext(null);
        setPhase('stale_context');
        setPhaseMessage(null);
        setStaleMessage('O contexto do portal mudou em outra aba. Atualize para continuar.');
        return false;
      }

      acceptTenantContext({
        activeContext: snapshot.activeContext,
        availableTenants: snapshot.availableTenants,
      });
      return true;
    } catch (error) {
      return handleOperationalFailure(
        error,
        'Falha ao carregar o contexto operacional do portal cliente.',
      );
    } finally {
      if (shouldShowBlockingState) {
        setIsLoading(false);
      }

      if (shouldShowRefreshState) {
        setIsRefreshing(false);
      }
    }
  }

  async function refresh() {
    await loadTenantContext({ mode: 'refresh' });
  }

  async function ensureFreshContext() {
    if (phase !== 'ready') {
      return false;
    }

    if (isRevalidatingRef.current || isLoading || switchingTenantId !== null) {
      return phase === 'ready';
    }

    isRevalidatingRef.current = true;

    try {
      return await loadTenantContext({ mode: 'revalidate' });
    } finally {
      isRevalidatingRef.current = false;
    }
  }

  useEffect(() => {
    void loadTenantContext({ mode: 'blocking' });
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    function revalidateIfVisible() {
      if (document.hidden || phase !== 'ready' || isLoading || switchingTenantId !== null) {
        return;
      }

      void ensureFreshContext();
    }

    window.addEventListener('focus', revalidateIfVisible);
    document.addEventListener('visibilitychange', revalidateIfVisible);

    return () => {
      window.removeEventListener('focus', revalidateIfVisible);
      document.removeEventListener('visibilitychange', revalidateIfVisible);
    };
  }, [user?.id, phase, isLoading, switchingTenantId]);

  async function switchTenant(tenantId: Uuid) {
    setSwitchingTenantId(tenantId);
    setPhaseMessage(null);
    setActiveContext(null);
    setPendingContext(null);
    setStaleMessage(null);
    setPhase('initializing');

    try {
      const [nextActiveContext, nextAvailableTenants] = await Promise.all([
        setCustomerPortalActiveTenant({ tenantId }),
        fetchCustomerPortalAvailableTenants(),
      ]);
      acceptTenantContext({
        activeContext: nextActiveContext,
        availableTenants: nextAvailableTenants,
      });
    } catch (error) {
      handleOperationalFailure(
        error,
        'Falha ao trocar o tenant ativo do portal cliente.',
      );
      await loadTenantContext({ mode: 'blocking' });
    } finally {
      setSwitchingTenantId(null);
    }
  }

  const value = useMemo<CustomerPortalTenantContextValue>(
    () => ({
      phase,
      activeContext,
      availableTenants,
      canRunSensitiveActions: phase === 'ready' && !isLoading && !isRefreshing,
      errorMessage:
        phase === 'fatal_error' ||
        phase === 'network_retryable' ||
        phase === 'access_revoked'
          ? phaseMessage
          : null,
      hasNoTenantAccess:
        phase === 'tenant_unavailable' && !isLoading && availableTenants.length === 0,
      isContextStale: phase === 'stale_context',
      isLoading,
      isRefreshing,
      isSwitching: switchingTenantId !== null,
      pendingContext,
      phaseMessage,
      staleMessage,
      switchingTenantId,
      ensureFreshContext,
      refresh,
      switchTenant,
    }),
    [
      phase,
      activeContext,
      availableTenants,
      isLoading,
      isRefreshing,
      pendingContext,
      phaseMessage,
      staleMessage,
      switchingTenantId,
    ],
  );

  return (
    <CustomerPortalTenantContext.Provider value={value}>
      {children}
    </CustomerPortalTenantContext.Provider>
  );
}

export function useCustomerPortalTenantContext() {
  const context = useContext(CustomerPortalTenantContext);

  if (!context) {
    throw new Error(
      'useCustomerPortalTenantContext deve ser usado dentro de CustomerPortalTenantContextProvider.',
    );
  }

  return context;
}
