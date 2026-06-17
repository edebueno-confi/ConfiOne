import { type FormEvent, useEffect, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import {
  MinimalButton,
  MinimalField,
  MinimalNotice,
  MinimalPage,
  MinimalSurface,
  MinimalTextInput,
} from '../../components/minimal-ui';
import { MinimalState } from '../../components/minimal-states';
import { signInWithPassword } from '../auth/auth-api';
import { useAuthContext } from '../auth/auth-context';
import {
  resolvePostLoginRedirect,
  type PostLoginDenialReason,
} from '../auth/post-login-redirect';

type RedirectResolverState =
  | { phase: 'idle' | 'loading' }
  | { phase: 'resolved'; destination: string }
  | { phase: 'denied'; reason: PostLoginDenialReason }
  | { phase: 'error'; message: string };

export function LoginPage() {
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirectTo');
  const {
    phase,
    sessionExpired,
    clearSessionExpired,
    configError,
  } = useAuthContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [redirectResolver, setRedirectResolver] = useState<RedirectResolverState>({
    phase: 'idle',
  });

  useEffect(() => {
    if (phase !== 'authenticated') {
      setRedirectResolver({ phase: 'idle' });
      return;
    }

    let cancelled = false;
    setRedirectResolver({ phase: 'loading' });

    resolvePostLoginRedirect(redirectTo)
      .then((resolution) => {
        if (cancelled) {
          return;
        }

        if (resolution.destination) {
          setRedirectResolver({
            phase: 'resolved',
            destination: resolution.destination,
          });
          return;
        }

        setRedirectResolver({
          phase: 'denied',
          reason: resolution.denialReason ?? 'missing-authorized-workspace',
        });
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        setRedirectResolver({
          phase: 'error',
          message:
            error instanceof Error
              ? error.message
              : 'Sua sessão foi encontrada, mas o destino inicial não pôde ser validado.',
        });
      });

    return () => {
      cancelled = true;
    };
  }, [phase, redirectTo]);

  if (phase === 'config-error') {
    return (
      <MinimalPage>
        <MinimalState
          title="Ambiente de acesso indisponível"
          description={
            configError ??
            'As configurações mínimas deste ambiente ainda não foram liberadas.'
          }
          tone="critical"
        />
      </MinimalPage>
    );
  }

  if (phase === 'booting' || (phase === 'authenticated' && redirectResolver.phase === 'loading')) {
    return (
      <MinimalPage>
        <MinimalState
          title="Carregando sessão"
          description="Estamos validando seu acesso."
          loading
        />
      </MinimalPage>
    );
  }

  if (phase === 'authenticated' && redirectResolver.phase === 'resolved') {
    return <Navigate replace to={redirectResolver.destination} />;
  }

  if (phase === 'authenticated' && redirectResolver.phase === 'denied') {
    return (
      <Navigate
        replace
        state={{ reason: redirectResolver.reason }}
        to="/access-denied"
      />
    );
  }

  if (phase === 'authenticated' && redirectResolver.phase === 'error') {
    return (
      <MinimalPage>
        <MinimalState
          description={redirectResolver.message}
          title="Não foi possível validar sua área inicial"
          tone="critical"
        />
      </MinimalPage>
    );
  }

  if (phase === 'authenticated') {
    return (
      <MinimalPage>
        <MinimalState
          title="Carregando sessão"
          description="Estamos validando sua área inicial."
          loading
        />
      </MinimalPage>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);
    clearSessionExpired();

    try {
      await signInWithPassword(email.trim(), password);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Falha ao autenticar neste ambiente.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <MinimalPage>
      <div className="w-full max-w-[26rem]">
        <header className="mb-6">
          <p className="text-sm font-semibold text-[color:var(--minimal-action)]">
            Genius Support OS
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-[color:var(--minimal-text)]">
            Entrar
          </h1>
        </header>

        <MinimalSurface>
          <form className="space-y-5" onSubmit={handleSubmit}>
            {sessionExpired ? (
              <MinimalNotice tone="warning">
                Sua sessão expirou. Entre novamente para continuar.
              </MinimalNotice>
            ) : null}

            {errorMessage ? (
              <MinimalNotice tone="critical">{errorMessage}</MinimalNotice>
            ) : null}

            <MinimalField label="Email">
              <MinimalTextInput
                autoComplete="email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="voce@empresa.com"
                required
                type="email"
                value={email}
              />
            </MinimalField>

            <MinimalField label="Senha">
              <MinimalTextInput
                autoComplete="current-password"
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Sua senha"
                required
                type="password"
                value={password}
              />
            </MinimalField>

            <div className="grid gap-4">
              <MinimalButton
                className="w-full"
                loading={submitting}
                type="submit"
              >
                {submitting ? 'Validando acesso...' : 'Entrar'}
              </MinimalButton>
              <p className="text-center text-xs leading-5 text-[color:var(--minimal-text-tertiary)]">
                Acesso restrito a contas autorizadas.
              </p>
            </div>
          </form>
        </MinimalSurface>
      </div>
    </MinimalPage>
  );
}
