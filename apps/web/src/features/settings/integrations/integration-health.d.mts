export type IntegrationTone = 'success' | 'warning' | 'danger' | 'muted';

export type IntegrationHealth = 'ok' | 'attention' | 'failure' | 'idle';

export interface IntegrationStateBadge {
  readonly key: string;
  readonly label: string;
  readonly tone: IntegrationTone;
}

export interface IntegrationHealthInput {
  readonly label: string;
  readonly isEnabled: boolean;
  readonly hasCredentials: boolean;
  readonly lastRunStatus: 'success' | 'partial' | 'error' | 'never';
  readonly lastRunAt: string | null;
  readonly updatedAt: string;
}

export interface IntegrationsHealthSummary {
  readonly total: number;
  readonly enabled: number;
  readonly withCredentials: number;
  readonly pendingCredentials: number;
  readonly lastRunAt: string | null;
  readonly lastRunLabel: string | null;
  readonly updatedAt: string | null;
  readonly health: IntegrationHealth;
  readonly healthLabel: string;
  readonly healthDetail: string;
  readonly tone: IntegrationTone;
}

export const UNAVAILABLE_LABEL: string;

export function toneClassName(tone: IntegrationTone): string;
export function toneTextClassName(tone: IntegrationTone): string;
export function credentialState(item: Pick<IntegrationHealthInput, 'isEnabled' | 'hasCredentials'>): IntegrationStateBadge;
export function lastRunState(item: Pick<IntegrationHealthInput, 'lastRunStatus'>): IntegrationStateBadge;
export function summarizeIntegrations(items: readonly IntegrationHealthInput[]): IntegrationsHealthSummary;

export interface IntegrationProviderMetric {
  readonly key: string;
  readonly label: string;
  readonly at: string | null;
  readonly value: string | null;
  readonly detail: string;
  readonly detailAt?: string | null;
  readonly tone: IntegrationTone;
}

export function integrationScopes(item: { readonly config?: Record<string, unknown> }): string[];
export function providerMetrics(
  item: IntegrationHealthInput & {
    readonly credentialUpdatedAt: string | null;
    readonly lastErrorMessage: string | null;
    readonly config?: Record<string, unknown>;
  },
): IntegrationProviderMetric[];
