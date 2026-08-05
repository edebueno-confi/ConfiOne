import { Outlet, useLocation } from 'react-router';
import type { ReactNode } from 'react';
import { ThemeProvider } from '../../app/theme-context';
import { isPublicSurfacePath } from '../../lib/theme';
import { AuthProvider, useAuthContext } from './auth-context';

/**
 * Regra de superfície do tema.
 *
 * O tema escuro é um recurso do ambiente autenticado. A Central Pública, o login
 * e as telas anônimas são sempre claras, mesmo quando um usuário autenticado
 * navega até elas: quem lê a Central Pública é cliente final, e a identidade
 * dessa superfície não acompanha a preferência do operador interno.
 */
function AuthenticatedTheme({ children }: { children: ReactNode }) {
  const { phase } = useAuthContext();
  const location = useLocation();
  const darkThemeAllowed =
    phase === 'authenticated' && !isPublicSurfacePath(location.pathname);

  return <ThemeProvider enabled={darkThemeAllowed}>{children}</ThemeProvider>;
}

export function AuthBootstrap() {
  return (
    <AuthProvider>
      <AuthenticatedTheme>
        <Outlet />
      </AuthenticatedTheme>
    </AuthProvider>
  );
}
