import type { AnalyticsSourceState, AnalyticsSourceStatusPayload } from '@genius-support-os/contracts';

export function isAnalyticsSourceActive(source: AnalyticsSourceState | null | undefined): boolean;
export function areAnalyticsSourcesActive(payload: AnalyticsSourceStatusPayload | null | undefined, kind?: 'full' | 'hubspot' | 'omie'): boolean;
export function syncProgressLabel(kind: 'full' | 'hubspot' | 'omie', timedOut?: boolean): string;
