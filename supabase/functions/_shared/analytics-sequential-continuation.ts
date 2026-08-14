import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { runnerMessage } from './hubspot-cs-runner.ts';

type Cycle = {
  id: string;
  correlation_id: string;
  current_step: string | null;
};

type HubSpotStep = {
  cycle_id: string;
  run_id: string | null;
  status: string;
  processed_count: number | null;
  sanitized_error: string | null;
  finished_at: string | null;
};

const TERMINAL_HUBSPOT_STATUSES = new Set(['success', 'succeeded', 'failed', 'error', 'abandoned', 'timed_out', 'cancelled']);

function isHubSpotSuccess(status: string) {
  return status === 'success' || status === 'succeeded';
}

async function findCycleReadyForOmie(client: SupabaseClient) {
  const { data: cycles, error: cyclesError } = await client
    .from('analytics_sync_cycles')
    .select('id,correlation_id,current_step')
    .eq('status', 'running')
    .eq('current_step', 'hubspot')
    .order('created_at', { ascending: false })
    .limit(10);
  if (cyclesError) throw cyclesError;

  for (const cycle of (cycles ?? []) as Cycle[]) {
    const { data: hubspotStep, error: hubspotStepError } = await client
      .from('analytics_sync_cycle_steps')
      .select('cycle_id,run_id,status,processed_count,sanitized_error,finished_at')
      .eq('cycle_id', cycle.id)
      .eq('step_key', 'hubspot')
      .maybeSingle();
    if (hubspotStepError) throw hubspotStepError;
    if (!hubspotStep?.run_id) continue;

    const step = hubspotStep as HubSpotStep;
    const { data: run, error: runError } = await client
      .from('hubspot_sync_runs')
      .select('status,records_promoted,error_message,sanitized_error,finished_at')
      .eq('id', step.run_id)
      .maybeSingle();
    if (runError) throw runError;
    if (!run || !TERMINAL_HUBSPOT_STATUSES.has(String(run.status))) continue;

    return {
      cycle,
      hubspotStep: step,
      hubspotRun: run as { status: string; records_promoted: number | null; error_message: string | null; sanitized_error: string | null; finished_at: string | null },
    };
  }

  return null;
}

export async function claimCycleOmieStep(client: SupabaseClient) {
  const candidate = await findCycleReadyForOmie(client);
  if (!candidate) return { status: 'waiting' as const };

  const { data: claimed, error: claimError } = await client
    .from('analytics_sync_cycle_steps')
    .update({ status: 'running', started_at: new Date().toISOString(), last_heartbeat_at: new Date().toISOString() })
    .eq('cycle_id', candidate.cycle.id)
    .eq('step_key', 'omie')
    .eq('status', 'queued')
    .select('id')
    .maybeSingle();
  if (claimError) throw claimError;
  if (!claimed) return { status: 'already_claimed' as const };

  const hubspotSucceeded = isHubSpotSuccess(candidate.hubspotRun.status);
  const hubspotError = hubspotSucceeded ? null : candidate.hubspotRun.sanitized_error ?? candidate.hubspotRun.error_message ?? 'A leitura do HubSpot não foi concluída.';
  const { error: hubspotStepError } = await client
    .from('analytics_sync_cycle_steps')
    .update({
      status: hubspotSucceeded ? 'succeeded' : 'failed',
      finished_at: candidate.hubspotRun.finished_at ?? new Date().toISOString(),
      processed_count: Number(candidate.hubspotRun.records_promoted ?? candidate.hubspotStep.processed_count ?? 0),
      sanitized_error: hubspotError,
      last_heartbeat_at: new Date().toISOString(),
    })
    .eq('cycle_id', candidate.cycle.id)
    .eq('step_key', 'hubspot');
  if (hubspotStepError) throw hubspotStepError;

  const { error: cycleError } = await client
    .from('analytics_sync_cycles')
    .update({ current_step: 'omie', last_heartbeat_at: new Date().toISOString() })
    .eq('id', candidate.cycle.id)
    .eq('status', 'running');
  if (cycleError) throw cycleError;

  return {
    status: 'claimed' as const,
    cycle: candidate.cycle,
    hubspotSucceeded,
  };
}

export async function finishCycleAfterOmie(
  client: SupabaseClient,
  cycleId: string,
  hubspotSucceeded: boolean,
  responseStatus: number,
  payload: Record<string, unknown> | null,
) {
  const omieSucceeded = responseStatus < 400 && payload?.ok !== false;
  const now = new Date().toISOString();
  const { error: stepError } = await client
    .from('analytics_sync_cycle_steps')
    .update({
      status: omieSucceeded ? 'succeeded' : 'failed',
      run_id: typeof payload?.syncRunId === 'string' ? payload.syncRunId : null,
      finished_at: now,
      last_heartbeat_at: now,
      processed_count: Number(payload?.acceptedRows ?? 0),
      sanitized_error: omieSucceeded ? null : 'A atualização do OMIE não foi concluída.',
    })
    .eq('cycle_id', cycleId)
    .eq('step_key', 'omie');
  if (stepError) throw stepError;

  const succeeded = hubspotSucceeded && omieSucceeded;
  const { error: cycleError } = await client
    .from('analytics_sync_cycles')
    .update({
      status: succeeded ? 'succeeded' : 'partial',
      current_step: 'complete',
      overall_result: succeeded ? 'success' : 'partial',
      finished_at: now,
      last_heartbeat_at: now,
      sanitized_error: succeeded ? null : 'Uma ou mais fontes não concluíram a atualização.',
    })
    .eq('id', cycleId)
    .eq('status', 'running');
  if (cycleError) throw cycleError;

  return { status: succeeded ? 'success' : 'partial', omieSucceeded, message: responseStatus >= 400 ? runnerMessage(payload?.error ?? 'Falha ao sincronizar o OMIE.') : undefined };
}
