import { Outlet } from 'react-router-dom';
import type { ReactNode } from 'react';
import { ThemeProvider } from '../../app/theme-context';
import { AuthProvider } from './auth-context';
import { useAuthContext } from './auth-context';

function AuthenticatedTheme({ children }: { children: ReactNode }) {
  const { phase } = useAuthContext();
  return <ThemeProvider enabled={phase === 'authenticated'}>{children}</ThemeProvider>;
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
