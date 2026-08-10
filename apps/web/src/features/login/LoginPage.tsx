import { type FormEvent, useEffect, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router';
import {
  MinimalButton,
  MinimalField,
  MinimalNotice,
  MinimalPage,
  MinimalSurface,
  MinimalTextInput,
} from '../../components/minimal-ui';
import { MinimalState } from '../../components/minimal-states';
import { GeniusMascot } from '../../components/GeniusMascot';
import { signInWithPassword } from '../auth/auth-api';
import { acceptAdminInternalInvitation } from '../admin/admin-api';
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
  const inviteId = searchParams.get('invite_id');
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

    const resolve = async () => {
      if (inviteId) await acceptAdminInternalInvitation(inviteId);
      return resolvePostLoginRedirect(redirectTo);
    };

    resolve()
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
  }, [phase, redirectTo, inviteId]);

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
    <MinimalPage className="gso-login-page">
      <div className="gso-login-shell">
        <section className="gso-login-brand-panel" aria-labelledby="login-brand-title">
          <div className="gso-login-brand-lockup">
            <GeniusMascot size="lg" alt="Gênio, mascote do ConfiOne" />
            <div>
              <p className="gso-login-brand-name">
                Confi<span>One</span>
              </p>
              <p className="gso-login-brand-caption">Suporte, conhecimento e operação</p>
            </div>
          </div>

          <div className="gso-login-brand-copy">
            <p className="gso-login-eyebrow">PLATAFORMA CONFI ONE</p>
            <h1 id="login-brand-title">Tudo o que sua operação precisa, em um só lugar</h1>
            <p>
              Acompanhe atendimentos, consulte o conhecimento e acesse os recursos
              disponíveis para sua equipe.
            </p>
          </div>

          <div className="gso-login-feature-grid">
            {[
              ['Atendimento', 'Acompanhe e organize as demandas da sua operação.', '◇'],
              ['Conhecimento', 'Encontre orientações confiáveis para agir com clareza.', '▤'],
              ['Acompanhamento', 'Tenha visibilidade do que precisa de atenção.', '✓'],
            ].map(([title, description, icon]) => (
              <article className="gso-login-feature" key={title}>
                <span aria-hidden="true" className="gso-login-feature-icon">{icon}</span>
                <h2>{title}</h2>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="gso-login-form-panel" aria-labelledby="login-title">
          <MinimalSurface className="gso-login-form-surface">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <h2 id="login-title" className="text-xl font-semibold tracking-[-0.02em] text-[color:var(--minimal-text)]">
                Entrar na ConfiOne
              </h2>
              <p className="mt-1 text-sm text-[color:var(--minimal-text-secondary)]">
                Use sua conta para continuar. Os recursos disponíveis seguem o seu perfil de acesso.
              </p>
            </div>

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
              <MinimalButton className="w-full" loading={submitting} type="submit">
                {submitting ? 'Validando acesso...' : 'Entrar na plataforma'}
              </MinimalButton>
              <p className="text-center text-xs leading-5 text-[color:var(--minimal-text-tertiary)]">
                Ambiente protegido para clientes e colaboradores autorizados.
              </p>
            </div>
          </form>
          </MinimalSurface>
        </section>
      </div>
    </MinimalPage>
  );
}
