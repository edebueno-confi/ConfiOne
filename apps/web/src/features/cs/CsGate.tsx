import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import type { CsCustomerPortfolio } from '../../contracts/support-contracts';
import {
  ErrorState,
  LoadingState,
  SessionExpiredState,
} from '../../components/states';
import { AppButton, GhostButton } from '../../components/ui';
import { useAuthContext } from '../auth/auth-context';
import { listCsCustomerPortfolio } from './cs-api';

interface CsPortfolioContextValue {
  portfolio: CsCustomerPortfolio[];
  refreshPortfolio: () => Promise<void>;
}

const CsPortfolioContext = createContext<CsPortfolioContextValue | null>(null);

export function useCsPortfolio() {
  const context = useContext(CsPortfolioContext);
  if (!context) {
    throw new Error('useCsPortfolio must be used within CsGate');
  }

  return context;
}

export function CsGate({ children }: { children: ReactNode }) {
  const location = useLocation();
  const {
    phase,
    gate,
    sessionExpired,
    configError,
    signOut,
    clearSessionExpired,
  } = useAuthContext();
  const [portfolio, setPortfolio] = useState<CsCustomerPortfolio[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);

  const refreshPortfolio = useCallback(async () => {
    setErrorMessage(null);
    setPortfolio(null);
    setRequestVersion((current) => current + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (phase !== 'authenticated') {
      setPortfolio(null);
      setErrorMessage(null);
      return () => {
        cancelled = true;
      };
    }

    listCsCustomerPortfolio()
      .then((result) => {
        if (!cancelled) {
          setPortfolio(result);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : 'Nao foi possivel carregar a carteira de Customer Success.',
          );
          setPortfolio([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [phase, requestVersion]);

  const value = useMemo<CsPortfolioContextValue>(
    () => ({
      portfolio: portfolio ?? [],
      refreshPortfolio,
    }),
    [portfolio, refreshPortfolio],
  );

  if (phase === 'config-error') {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-6 py-12">
        <ErrorState
          description={
            configError ??
            'Este ambiente ainda nao recebeu as configuracoes minimas de acesso.'
          }
          title="Configuracao de acesso indisponivel"
        />
      </div>
    );
  }

  if (sessionExpired) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-6 py-12">
        <SessionExpiredState
          action={
            <AppButton
              onClick={() => {
                clearSessionExpired();
                void signOut();
              }}
            >
              Voltar ao login
            </AppButton>
          }
        />
      </div>
    );
  }

  if (phase === 'booting') {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-6 py-12">
        <LoadingState
          description="Estamos validando a sessao e o escopo da carteira."
          title="Preparando Customer Success"
        />
      </div>
    );
  }

  if (phase === 'anonymous') {
    const redirectTo = `${location.pathname}${location.search}`;
    return <Navigate replace to={`/login?redirectTo=${encodeURIComponent(redirectTo)}`} />;
  }

  if (portfolio === null) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-6 py-12">
        <LoadingState
          description="Estamos consultando os clientes autorizados para este perfil."
          title="Carregando carteira CS"
        />
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-6 py-12">
        <ErrorState
          description={errorMessage}
          action={
            <>
              <AppButton onClick={() => void refreshPortfolio()}>
                Tentar novamente
              </AppButton>
              <GhostButton onClick={() => void signOut()}>Encerrar sessao</GhostButton>
            </>
          }
        />
      </div>
    );
  }

  const isPlatformAdmin =
    gate.phase === 'ready' && gate.actor?.is_platform_admin === true;

  if (portfolio.length === 0 && gate.phase === 'loading') {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-6 py-12">
        <LoadingState
          description="Estamos concluindo a validacao do escopo administrativo."
          title="Validando acesso"
        />
      </div>
    );
  }

  if (portfolio.length === 0 && !isPlatformAdmin) {
    return (
      <Navigate
        replace
        state={{ reason: 'missing-cs-portfolio-access' }}
        to="/access-denied"
      />
    );
  }

  return (
    <CsPortfolioContext.Provider value={value}>
      {children}
    </CsPortfolioContext.Provider>
  );
}
