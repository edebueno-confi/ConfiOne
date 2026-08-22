import type { PostLoginDenialReason } from './post-login-redirect';

export interface PostLoginAccessDeniedNavigationState {
  fromAccessDenied: true;
  reason: PostLoginDenialReason;
}

interface PostLoginDeniedRouteNavigationState {
  reason: PostLoginDenialReason;
}

export interface PostLoginNavigation {
  destination: string;
  state: PostLoginAccessDeniedNavigationState | PostLoginDeniedRouteNavigationState | undefined;
}

function buildPostLoginAccessDeniedNavigationState(
  reason: PostLoginDenialReason | null,
): PostLoginAccessDeniedNavigationState | undefined {
  if (!reason) return undefined;

  return {
    fromAccessDenied: true,
    reason,
  };
}

export function buildPostLoginNavigation(
  destination: string | null,
  reason: PostLoginDenialReason | null,
): PostLoginNavigation {
  if (destination) {
    return {
      destination,
      state: buildPostLoginAccessDeniedNavigationState(reason),
    };
  }

  return {
    destination: '/access-denied',
    state: {
      reason: reason ?? 'missing-authorized-workspace',
    },
  };
}
