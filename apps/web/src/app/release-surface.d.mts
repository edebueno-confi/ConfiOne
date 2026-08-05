import type { InternalScreenKey } from '../contracts/admin-contracts';

export type ReleaseSurfaceMode = 'first-release' | 'full';

export interface ReleaseRoute {
  readonly path: string;
  readonly screenKey: InternalScreenKey;
  readonly rationale: string;
}

export const RELEASE_SURFACE_MODES: readonly ReleaseSurfaceMode[];
export const PUBLIC_HELP_CENTER_HREF: string;

export function getReleaseSurfaceMode(): ReleaseSurfaceMode;
export function setReleaseSurfaceModeForTests(mode: ReleaseSurfaceMode): void;
export function isInternalRoute(pathname: string): boolean;
export function listReleaseRoutes(): readonly ReleaseRoute[];
export function listPublishedScreenKeys(): readonly InternalScreenKey[];
export function isScreenPublishedInRelease(screenKey: InternalScreenKey): boolean;
export function isRoutePublishedInRelease(pathname: string): boolean;
export function resolveReleaseRouteScreenKey(pathname: string): InternalScreenKey | null;
export function resolveReleaseRedirect(pathname: string): string | null;
export function getReleaseLandingRoute(): string | null;
export function findReleaseSurfaceInconsistencies(): string[];

export interface ReleaseSettingsSection {
  readonly id: string;
  readonly screenKey: InternalScreenKey;
}

export function listPublishedAnalyticsDomains(): readonly string[] | null;
export function isAnalyticsDomainPublishedInRelease(domainKey: string): boolean;
export function listPublishedSettingsSections(): readonly ReleaseSettingsSection[] | null;
export function isSettingsSectionPublishedInRelease(sectionId: string): boolean;
export function canOpenSettingsSection(
  sectionId: string,
  context?: { isPlatformAdmin?: boolean; screenKeys?: InternalScreenKey[] },
): boolean;
