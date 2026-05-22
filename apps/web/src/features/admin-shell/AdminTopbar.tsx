import { useLocation } from 'react-router-dom';
import { useAuthContext } from '../auth/auth-context';
import { UnifiedInternalTopbar } from '../navigation/UnifiedEnvironmentNavigation';

export function AdminTopbar() {
  const location = useLocation();
  const { gate } = useAuthContext();

  return (
    <UnifiedInternalTopbar
      pathname={location.pathname}
      permissions={{ isPlatformAdmin: gate.actor?.is_platform_admin === true }}
    />
  );
}
