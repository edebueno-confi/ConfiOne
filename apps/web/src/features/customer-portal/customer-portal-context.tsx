import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
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

interface CustomerPortalTenantContextValue {
  activeContext: CustomerPortalActiveTenantContext | null;
  availableTenants: CustomerPortalAvailableTenant[];
  errorMessage: string | null;
  hasNoTenantAccess: boolean;
  isLoading: boolean;
  isSwitching: boolean;
  switchingTenantId: Uuid | null;
  refresh: () => Promise<void>;
  switchTenant: (tenantId: Uuid) => Promise<void>;
}

const CustomerPortalTenantContext = createContext<CustomerPortalTenantContextValue | null>(
  null,
);

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
  const [isLoading, setIsLoading] = useState(true);
  const [switchingTenantId, setSwitchingTenantId] = useState<Uuid | null>(null);

  async function loadTenantContext() {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const [nextAvailableTenants, nextActiveContext] = await Promise.all([
        fetchCustomerPortalAvailableTenants(),
        fetchCustomerPortalActiveTenantContext(),
      ]);
      setAvailableTenants(nextAvailableTenants);
      setActiveContext(nextActiveContext);
    } catch (error) {
      setErrorMessage(
        mapPortalTenantContextError(
          error,
          'Falha ao carregar o tenant ativo do portal cliente.',
        ),
      );
      setAvailableTenants([]);
      setActiveContext(null);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadTenantContext();
  }, [user?.id]);

  async function switchTenant(tenantId: Uuid) {
    setSwitchingTenantId(tenantId);
    setErrorMessage(null);
    setActiveContext(null);

    try {
      const [nextActiveContext, nextAvailableTenants] = await Promise.all([
        setCustomerPortalActiveTenant({ tenantId }),
        fetchCustomerPortalAvailableTenants(),
      ]);
      setActiveContext(nextActiveContext);
      setAvailableTenants(nextAvailableTenants);
    } catch (error) {
      setErrorMessage(
        mapPortalTenantContextError(
          error,
          'Falha ao trocar o tenant ativo do portal cliente.',
        ),
      );
      await loadTenantContext();
    } finally {
      setSwitchingTenantId(null);
    }
  }

  const value = useMemo<CustomerPortalTenantContextValue>(
    () => ({
      activeContext,
      availableTenants,
      errorMessage,
      hasNoTenantAccess: !isLoading && availableTenants.length === 0,
      isLoading,
      isSwitching: switchingTenantId !== null,
      switchingTenantId,
      refresh: loadTenantContext,
      switchTenant,
    }),
    [activeContext, availableTenants, errorMessage, isLoading, switchingTenantId],
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
