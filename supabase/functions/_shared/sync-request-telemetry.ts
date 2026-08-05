import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';

export type SyncRequestTelemetryEvent = {
  endpoint: string;
  method: string;
  attempt: number;
  statusCode?: number | null;
  durationMs: number;
  retryAfterMs?: number | null;
  pageNumber?: number | null;
  errorCode?: string | null;
};

type SyncRequestTelemetryContext = {
  provider: 'hubspot' | 'omie';
  hubspotRunId?: string | null;
  omieRunId?: string | null;
  cycleId?: string | null;
  workItemId?: string | null;
  correlationId?: string | null;
  pageNumber?: number | null;
};

export function createSyncRequestTelemetryBuffer(context: SyncRequestTelemetryContext) {
  const events: Array<Record<string, unknown>> = [];

  return {
    observer: {
      record(event: SyncRequestTelemetryEvent) {
        events.push({
          provider: context.provider,
          hubspot_run_id: context.hubspotRunId ?? null,
          omie_run_id: context.omieRunId ?? null,
          cycle_id: context.cycleId ?? null,
          work_item_id: context.workItemId ?? null,
          correlation_id: context.correlationId ?? null,
          endpoint_key: event.endpoint,
          http_method: event.method,
          attempt_number: Math.max(1, Math.trunc(event.attempt || 1)),
          status_code: event.statusCode ?? null,
          duration_ms: Math.max(0, Math.trunc(event.durationMs || 0)),
          retry_after_ms: event.retryAfterMs ?? null,
          page_number: event.pageNumber ?? context.pageNumber ?? null,
          error_code: event.errorCode ?? null,
        });
      },
    },
    async flush(client: SupabaseClient) {
      if (events.length === 0) return { attempted: 0, persisted: 0, error: null };
      const batch = events.splice(0, events.length);
      const { error } = await client.from('analytics_sync_request_attempts').insert(batch);
      // Telemetry never changes the provider result. A telemetry failure is
      // returned to the caller for logging, but must not trigger a duplicate
      // provider call or invalidate a valid snapshot.
      return { attempted: batch.length, persisted: error ? 0 : batch.length, error: error?.message ?? null };
    },
  };
}
