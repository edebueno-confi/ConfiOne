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
  Uuid,
} from '../../contracts/support-contracts';
import { AppError } from '../../app/errors';
import { useAuthContext } from '../auth/auth-context';
import {
  fetchCustomerPortalActiveTenantContext,
  fetchCustomerPortalAvailableTenants,
  setCustomerPortalActiveTenant,
} from './customer-portal-api';

function mapPortalTenantContextError(error: unknown, fallback: string) {
  if (error instanceof AppError) {
    return error.message;
  }

  return error instanceof Error ? error.message : fallback;
}

function getTenantContextSignature(context: CustomerPortalActiveTenantContext | null) {
  if (!context) {
    return null;
  }

  return `${context.tenantId}:${context.contextVersion}`;
}

interface CustomerPortalTenantContextValue {
  activeContext: CustomerPortalActiveTenantContext | null;
  availableTenants: CustomerPortalAvailableTenant[];
  errorMessage: string | null;
  hasNoTenantAccess: boolean;
  isContextStale: boolean;
  isLoading: boolean;
  isRefreshing: boolean;
  isSwitching: boolean;
  pendingContext: CustomerPortalActiveTenantContext | null;
  staleMessage: string | null;
  switchingTenantId: Uuid | null;
  ensureFreshContext: () => Promise<boolean>;
  refresh: () => Promise<void>;
  switchTenant: (tenantId: Uuid) => Promise<void>;
}

const CustomerPortalTenantContext = createContext<CustomerPortalTenantContextValue | null>(
  null,
);

async function fetchTenantContextSnapshot() {
  const [availableTenants, activeContext] = await Promise.all([
    fetchCustomerPortalAvailableTenants(),
    fetchCustomerPortalActiveTenantContext(),
  ]);

  return {
    activeContext,
    availableTenants,
  };
}

export function CustomerPortalTenantContextProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { user } = useAuthContext();
  const [activeContext, setActiveContext] =
    useState<CustomerPortalActiveTenantContext | null>(null);
  const [availableTenants, setAvailableTenants] = useState<CustomerPortalAvailableTenant[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isContextStale, setIsContextStale] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pendingContext, setPendingContext] =
    useState<CustomerPortalActiveTenantContext | null>(null);
  const [staleMessage, setStaleMessage] = useState<string | null>(null);
  const [switchingTenantId, setSwitchingTenantId] = useState<Uuid | null>(null);

  const acceptedSignatureRef = useRef<string | null>(null);
  const isRevalidatingRef = useRef(false);

  function acceptTenantContext(snapshot: {
    activeContext: CustomerPortalActiveTenantContext | null;
    availableTenants: CustomerPortalAvailableTenant[];
  }) {
    setAvailableTenants(snapshot.availableTenants);
    setActiveContext(snapshot.activeContext);
    setPendingContext(null);
    setStaleMessage(null);
    setIsContextStale(false);
    acceptedSignatureRef.current = getTenantContextSignature(snapshot.activeContext);
  }

  async function loadTenantContext(options?: {
    mode?: 'blocking' | 'refresh' | 'switch' | 'revalidate';
  }) {
    const mode = options?.mode ?? 'blocking';
    const shouldShowBlockingState = mode === 'blocking';
    const shouldShowRefreshState = mode === 'refresh';

    if (shouldShowBlockingState) {
      setIsLoading(true);
    }

    if (shouldShowRefreshState) {
      setIsRefreshing(true);
    }

    if (mode !== 'revalidate') {
      setErrorMessage(null);
    }

    try {
      const snapshot = await fetchTenantContextSnapshot();
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
        setIsContextStale(true);
        setStaleMessage('O contexto do portal mudou em outra aba. Atualize para continuar.');
        setErrorMessage(null);
        return false;
      }

      acceptTenantContext(snapshot);
      return true;
    } catch (error) {
      const nextMessage = mapPortalTenantContextError(
        error,
        'Falha ao carregar o tenant ativo do portal cliente.',
      );

      if (mode === 'revalidate') {
        setErrorMessage(nextMessage);
        return false;
      }

      setErrorMessage(nextMessage);
      setAvailableTenants([]);
      setActiveContext(null);
      setPendingContext(null);
      setIsContextStale(false);
      setStaleMessage(null);
      acceptedSignatureRef.current = null;
      return false;
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
    if (isRevalidatingRef.current || isLoading || switchingTenantId !== null) {
      return !isContextStale;
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
      if (document.hidden) {
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
  }, [user?.id, isLoading, isContextStale, switchingTenantId]);

  async function switchTenant(tenantId: Uuid) {
    setSwitchingTenantId(tenantId);
    setErrorMessage(null);
    setActiveContext(null);
    setPendingContext(null);
    setStaleMessage(null);
    setIsContextStale(false);

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
      setErrorMessage(
        mapPortalTenantContextError(
          error,
          'Falha ao trocar o tenant ativo do portal cliente.',
        ),
      );
      await loadTenantContext({ mode: 'blocking' });
    } finally {
      setSwitchingTenantId(null);
    }
  }

  const value = useMemo<CustomerPortalTenantContextValue>(
    () => ({
      activeContext,
      availableTenants,
      errorMessage,
      hasNoTenantAccess:
        !isLoading && !isContextStale && availableTenants.length === 0 && activeContext === null,
      isContextStale,
      isLoading,
      isRefreshing,
      isSwitching: switchingTenantId !== null,
      pendingContext,
      staleMessage,
      switchingTenantId,
      ensureFreshContext,
      refresh,
      switchTenant,
    }),
    [
      activeContext,
      availableTenants,
      errorMessage,
      isContextStale,
      isLoading,
      isRefreshing,
      pendingContext,
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
