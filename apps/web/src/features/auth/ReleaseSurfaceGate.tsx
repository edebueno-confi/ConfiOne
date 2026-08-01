import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import {
  isRoutePublishedInRelease,
  resolveReleaseRedirect,
} from '../../app/release-surface.mjs';

/**
 * Step 1 of the validation order: the release surface.
 *
 * Wraps the internal route families so an unpublished module is unreachable by
 * URL for every profile, including `platform_admin`, before any permission gate
 * runs. The modules stay in the repository and in the router; only the release
 * manifest decides what is reachable.
 *
 * Entry points listed as technical redirects land on a published surface.
 * Every other unpublished route resolves to an explicit denial — never a silent
 * redirect to a different screen.
 */
export function ReleaseSurfaceGate({ children }: { children: ReactNode }) {
  const location = useLocation();

  const redirect = resolveReleaseRedirect(location.pathname);
  if (redirect) {
    return <Navigate replace to={redirect} />;
  }

  if (!isRoutePublishedInRelease(location.pathname)) {
    return (
      <Navigate
        replace
        state={{ reason: 'route-not-in-release' }}
        to="/access-denied"
      />
    );
  }

  return <>{children}</>;
}
