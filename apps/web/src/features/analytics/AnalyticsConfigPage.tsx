import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MinimalState } from '../../components/minimal-states';
import { GeniusSyncOverlay } from '../../components/GeniusSyncOverlay';
import { getCsSyncProgress, getIntegrationSchedule, getLatestCsSyncRun, listAnalyticsSourceConfig, setIntegrationSchedule, triggerSequentialAnalyticsSync, triggerCsSupportSync, triggerHubspotSync, upsertAnalyticsSourceConfig, type IntegrationSchedule } from './analytics-api';
import type { AnalyticsSourceConfig, SyncRun } from './analytics-model';
import { ChartCard, MetricInfo } from './analytics-ui';
import { useAuthContext } from '../auth/auth-context';
import { canManageAnalyticsIntegration } from './analytics-permissions.mjs';
import { HubspotCsDiagnosticCard } from './HubspotCsDiagnosticCard';

type Draft = { id?: string; domainKey: 'commercial' | 'cs'; objectType: 'deal' | 'ticket'; pipelineId: string; alias: string; isActive: boolean };
const EMPTY_DRAFT: Draft = { domainKey: 'cs', objectType: 'ticket', pipelineId: '', alias: '', isActive: true };
const CONTROL = 'h-9 rounded-md border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] px-2.5 text-sm text-[color:var(--minimal-text)] outline-none focus:border-[color:var(--minimal-text-secondary)] focus:ring-2 focus:ring-[color:var(--minimal-border-strong)]';

export function AnalyticsConfigPage() {
  const { gate } = useAuthContext();
  const canManageIntegration = canManageAnalyticsIntegration(gate.actor);
  const [rows, setRows] = useState<AnalyticsSourceConfig[]>([]);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [state, setState] = useState<{ loading: boolean; saving: boolean; error?: string; message?: string }>({ loading: true, saving: false });
  const load = () => { setState((current) => ({ ...current, loading: true, error: undefined })); listAnalyticsSourceConfig().then((data) => { setRows(data); setState((current) => ({ ...current, loading: false })); }).catch((error) => setState({ loading: false, saving: false, error: error instanceof Error ? error.message : 'Falha ao carregar as fontes.' })); };
  const [schedule, setSchedule] = useState<IntegrationSchedule | null>(null);
  const [scheduleBusy, setScheduleBusy] = useState(false);
  const [runningNow, setRunningNow] = useState(false);
  const [hubspotRunningNow, setHubspotRunningNow] = useState(false);
  const [latestCsRun, setLatestCsRun] = useState<SyncRun | null>(null);
  const [csControlBusy, setCsControlBusy] = useState(false);
  const [csControlMsg, setCsControlMsg] = useState<string | null>(null);
  const [scheduleMsg, setScheduleMsg] = useState<string | null>(null);
  const loadSchedule = () => { void getIntegrationSchedule().then(setSchedule).catch(() => setSchedule(null)); };
  const loadLatestCsRun = () => { void getLatestCsSyncRun().then(setLatestCsRun).catch(() => setLatestCsRun(null)); };
  const patchSchedule = (patch: Partial<IntegrationSchedule>) => setSchedule((current) => ({
    enabled: current?.enabled ?? false,
     frequency: current?.frequency ?? 'off',
    lastRunAt: current?.lastRunAt ?? null,
    lastStatus: current?.lastStatus ?? null,
    lastMessage: current?.lastMessage ?? null,
    hubspotEnabled: current?.hubspotEnabled ?? false,
     hubspotFrequency: current?.hubspotFrequency ?? 'off',
    hubspotLastRunAt: current?.hubspotLastRunAt ?? null,
    hubspotLastStatus: current?.hubspotLastStatus ?? null,
    hubspotLastMessage: current?.hubspotLastMessage ?? null,
    ...patch,
  }));
  const saveSchedule = async () => { setScheduleBusy(true); setScheduleMsg(null); try { await setIntegrationSchedule(schedule?.enabled ?? false, schedule?.frequency ?? 'off', schedule?.hubspotEnabled ?? false, schedule?.hubspotFrequency ?? 'off'); loadSchedule(); setScheduleMsg('Agendamento salvo.'); } catch (error) { setScheduleMsg(error instanceof Error ? error.message : 'Falha ao salvar o agendamento.'); } finally { setScheduleBusy(false); } };
  const runNow = async () => { setScheduleBusy(true); setRunningNow(true); setScheduleMsg(null); try { const r = await triggerSequentialAnalyticsSync(); setScheduleMsg(`${r.status === 'partial' ? 'Atenção: ' : ''}Sequência HubSpot → OMIE concluída. ${r.updated.toLocaleString('pt-BR')} registros HubSpot promovidos.${r.message ? ` ${r.message}` : ''}`); loadSchedule(); } catch (error) { setScheduleMsg(error instanceof Error ? error.message : 'Falha ao executar a sequência HubSpot → OMIE.'); } finally { setRunningNow(false); setScheduleBusy(false); } };
  const runHubspotNow = async () => { setScheduleBusy(true); setHubspotRunningNow(true); setScheduleMsg(null); try { const result = await triggerHubspotSync(undefined, { phased: false }); setScheduleMsg(`Sincronização HubSpot iniciada: o orquestrador consultará as fontes configuradas e atualizará o Dashboard ao concluir. Execução: ${result.runId ?? 'indisponível'}.`); loadSchedule(); } catch (error) { setScheduleMsg(error instanceof Error ? error.message : 'Falha ao iniciar a sincronização do HubSpot.'); } finally { setHubspotRunningNow(false); setScheduleBusy(false); } };
  const runCsSupport = async () => {
    if (!canManageIntegration || csControlBusy) return;
    const initial = latestCsRun?.status !== 'success';
    const confirmation = initial
      ? 'Executar uma única carga inicial de CS / Suporte do HubSpot? A ação consulta apenas tickets e não aciona Comercial ou OMIE.'
      : 'Sincronizar CS / Suporte incrementalmente? A ação consulta apenas tickets e não aciona Comercial ou OMIE.';
    if (!window.confirm(confirmation)) return;
    setCsControlBusy(true); setCsControlMsg(null);
    try {
      const result = await triggerCsSupportSync(latestCsRun);
      setCsControlMsg(result.status === 'queued'
        ? `Carga de CS enfileirada (${result.mode}). O progresso será atualizado automaticamente. Correlação: ${result.correlationId ?? 'indisponível'}.`
        : `${result.status === 'partial' ? 'Execução parcial' : 'Execução concluída'} (${result.mode}): ${result.tickets.toLocaleString('pt-BR')} tickets, ${result.owners.toLocaleString('pt-BR')} responsáveis e ${result.stages.toLocaleString('pt-BR')} estágios. Correlação: ${result.correlationId ?? 'indisponível'}.`);
      loadLatestCsRun();
    } catch (error) {
      setCsControlMsg(error instanceof Error ? error.message : 'Falha ao executar CS / Suporte.');
    } finally { setCsControlBusy(false); }
  };
  useEffect(() => { load(); loadSchedule(); loadLatestCsRun(); }, []);
  useEffect(() => {
    if (!latestCsRun || !['queued', 'running', 'partial'].includes(latestCsRun.status)) return;
    const timer = window.setInterval(() => {
      void Promise.all([loadLatestCsRun(), getCsSyncProgress(latestCsRun.id)]).then(([, progress]) => {
        if (progress?.error) setCsControlMsg(`Carga de CS: ${progress.error}`);
        else if (progress) setCsControlMsg(`Carga de CS em andamento: ${progress.pipelinesCompleted}/${progress.pipelinesTotal} pipelines, ${progress.pages} páginas e ${progress.received.toLocaleString('pt-BR')} tickets recebidos.`);
      });
    }, 3000);
    return () => window.clearInterval(timer);
  }, [latestCsRun?.id, latestCsRun?.status]);
  const save = async () => {
    if (!canManageIntegration) { setState((current) => ({ ...current, error: 'Somente administradores da plataforma podem alterar as fontes.' })); return; }
    if (!draft.pipelineId.trim() || !/^\d+$/.test(draft.pipelineId.trim())) { setState((current) => ({ ...current, error: 'Informe um ID numérico de pipeline.' })); return; }
    setState((current) => ({ ...current, saving: true, error: undefined, message: undefined }));
    try { await upsertAnalyticsSourceConfig({ id: draft.id, domainKey: draft.domainKey, objectType: draft.objectType, pipelineId: draft.pipelineId.trim(), label: draft.alias.trim(), isActive: draft.isActive }); setDraft(EMPTY_DRAFT); setState((current) => ({ ...current, saving: false, message: 'Fonte salva. Execute uma sincronização para atualizar o cache local.' })); load(); } catch (error) { setState((current) => ({ ...current, saving: false, error: error instanceof Error ? error.message : 'Falha ao salvar a fonte.' })); }
  };
  const edit = (row: AnalyticsSourceConfig) => { if (!canManageIntegration) return; setDraft({ id: row.id, domainKey: row.domainKey, objectType: row.objectType, pipelineId: row.pipelineId, alias: row.alias ?? '', isActive: row.isActive }); };
  if (state.loading && rows.length === 0) return <MinimalState loading title="Carregando configuração" description="O Gênio está consultando os pipelines ativos do Dashboard Gerencial." />;
  if (state.error && rows.length === 0) return <MinimalState tone="critical" title="Não foi possível carregar" description={state.error} />;
  return <>
    <div className="gso-hd-domain-surface space-y-5">
    <nav aria-label="Painéis de Dashboard e Analytics" className="flex flex-wrap items-center gap-2 rounded-lg border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface-muted)] px-3 py-2 text-xs">
      <span className="font-semibold text-[color:var(--minimal-text)]">Dashboard e Analytics</span>
      {[['overview', 'Visão geral'], ['hubspot', 'HubSpot'], ['omie', 'OMIE'], ['schedules', 'Agendamentos'], ['pipelines', 'Pipelines'], ['history', 'Histórico'], ['diagnostics', 'Diagnóstico']].map(([panel, label]) => <Link key={panel} to={`/admin/settings?section=analytics&panel=${panel}`} className="rounded-md px-2 py-1 text-[color:var(--minimal-action)] hover:bg-[color:var(--minimal-surface)] hover:underline">{label}</Link>)}
    </nav>
    <HubspotCsDiagnosticCard enabled={canManageIntegration} />
    {canManageIntegration ? <ChartCard title="Controle de CS / Suporte" description="Executa exclusivamente a leitura de tickets do HubSpot usando a sessão autenticada. Não aciona Comercial, OMIE ou alterações no HubSpot.">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" disabled={csControlBusy} onClick={() => void runCsSupport()} className="h-9 rounded-md bg-[color:var(--minimal-action)] px-3 text-sm font-medium text-[color:var(--minimal-action-ink)] disabled:cursor-not-allowed disabled:opacity-60">
          {csControlBusy ? 'Consultando CS / Suporte…' : latestCsRun?.status === 'success' ? 'Sincronizar CS / Suporte' : 'Executar carga inicial de CS / Suporte'}
        </button>
        <span className="text-xs text-[color:var(--minimal-text-tertiary)]">
          {latestCsRun ? `Última execução: ${latestCsRun.status} · ${new Date(latestCsRun.finishedAt ?? latestCsRun.startedAt).toLocaleString('pt-BR')}${latestCsRun.pipelinesTotal > 0 ? ` · ${latestCsRun.pipelinesCompleted}/${latestCsRun.pipelinesTotal} pipelines` : ''}` : 'Nenhuma execução CS registrada.'}
        </span>
      </div>
      {csControlMsg ? <p role="status" className="mt-3 text-xs text-[color:var(--minimal-text-secondary)]">{csControlMsg}</p> : null}
    </ChartCard> : null}
    <ChartCard title="Sincronização automática do HubSpot" description="Atualiza todas as áreas conectadas: empresas, Comercial, CS / Suporte, responsáveis e estágios dos pipelines ativos.">
      {canManageIntegration ? <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1.5 text-xs font-medium text-[color:var(--minimal-text-secondary)]">Frequência
          <select value={schedule?.hubspotFrequency ?? 'off'} onChange={(event) => patchSchedule({ hubspotFrequency: event.target.value as IntegrationSchedule['hubspotFrequency'] })} className={CONTROL}>
            <option value="off">Desativada</option>
            <option value="hourly">De hora em hora</option>
            <option value="daily">Diária</option>
          </select>
        </label>
        <label className="flex h-9 items-center gap-2 rounded-md border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] px-2.5 text-xs font-medium text-[color:var(--minimal-text-secondary)]"><input type="checkbox" checked={schedule?.hubspotEnabled ?? false} onChange={(event) => patchSchedule({ hubspotEnabled: event.target.checked })} className="accent-[color:var(--minimal-text)]" /> Ativa</label>
        <button type="button" disabled={scheduleBusy} onClick={() => void saveSchedule()} className="h-9 rounded-md bg-[color:var(--minimal-text)] px-3 text-sm font-medium text-[color:var(--minimal-surface)] disabled:opacity-60">Salvar</button>
        <button type="button" disabled={scheduleBusy} onClick={() => void runHubspotNow()} className="h-9 rounded-md border border-[color:var(--minimal-action)] px-3 text-sm font-medium text-[color:var(--minimal-action)] disabled:opacity-60">{hubspotRunningNow ? 'Processando...' : 'Rodar agora'}</button>
      </div> : <p className="rounded-md border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface-muted)] px-3 py-2 text-xs text-[color:var(--minimal-text-secondary)]">A configuração da sincronização está disponível somente para administradores da plataforma.</p>}
      {schedule?.hubspotLastRunAt ? <p className="mt-3 text-xs text-[color:var(--minimal-text-tertiary)]">Última execução: {new Date(schedule.hubspotLastRunAt).toLocaleString('pt-BR')} · {schedule.hubspotLastStatus ?? '—'}{schedule.hubspotLastMessage ? ` · ${schedule.hubspotLastMessage}` : ''}</p> : <p className="mt-3 text-xs text-[color:var(--minimal-text-tertiary)]">Nenhuma execução automática do HubSpot registrada ainda.</p>}
      <p className="mt-1 text-xs text-[color:var(--minimal-text-tertiary)]">Este agendamento é independente do financeiro OMIE e usa os pipelines ativos configurados acima.</p>
    </ChartCard>
    <ChartCard title="Sincronização automática (OMIE ↔ HubSpot)" description="Define a cadência da atualização automática dos dados financeiros do OMIE nas empresas do HubSpot. Você também pode rodar agora.">
      {canManageIntegration ? <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1.5 text-xs font-medium text-[color:var(--minimal-text-secondary)]">Frequência
          <select value={schedule?.frequency ?? 'off'} onChange={(event) => patchSchedule({ frequency: event.target.value as IntegrationSchedule['frequency'] })} className={CONTROL}>
            <option value="off">Desativada</option>
            <option value="hourly">De hora em hora</option>
            <option value="daily">Diária</option>
          </select>
        </label>
        <label className="flex h-9 items-center gap-2 rounded-md border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] px-2.5 text-xs font-medium text-[color:var(--minimal-text-secondary)]"><input type="checkbox" checked={schedule?.enabled ?? false} onChange={(event) => patchSchedule({ enabled: event.target.checked })} className="accent-[color:var(--minimal-text)]" /> Ativa</label>
        <button type="button" disabled={scheduleBusy} onClick={() => void saveSchedule()} className="h-9 rounded-md bg-[color:var(--minimal-text)] px-3 text-sm font-medium text-[color:var(--minimal-surface)] disabled:opacity-60">Salvar</button>
        <button type="button" disabled={scheduleBusy} onClick={() => void runNow()} className="h-9 rounded-md border border-[color:var(--minimal-action)] px-3 text-sm font-medium text-[color:var(--minimal-action)] disabled:opacity-60">{scheduleBusy ? 'Processando...' : 'Rodar agora'}</button>
      </div> : <p className="rounded-md border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface-muted)] px-3 py-2 text-xs text-[color:var(--minimal-text-secondary)]">A configuração da integração e a execução manual estão disponíveis somente para administradores da plataforma.</p>}
      {schedule?.lastRunAt ? <p className="mt-3 text-xs text-[color:var(--minimal-text-tertiary)]">Última execução: {new Date(schedule.lastRunAt).toLocaleString('pt-BR')} · {schedule.lastStatus ?? '—'}{schedule.lastMessage ? ` · ${schedule.lastMessage}` : ''}</p> : <p className="mt-3 text-xs text-[color:var(--minimal-text-tertiary)]">Nenhuma execução automática registrada ainda.</p>}
      <p className="mt-1 text-xs text-[color:var(--minimal-text-tertiary)]">A execução automática server-side (cron) exige o segredo de agendamento configurado; a execução manual exige `platform_admin`.</p>
      {scheduleMsg ? <p className="mt-2 text-xs text-[color:var(--minimal-text-secondary)]">{scheduleMsg}</p> : null}
    </ChartCard>
    <ChartCard title="Fontes de dados do Dashboard" description="Selecione quais pipelines do HubSpot compõem cada área e dê um alias interno legível. O alias aparece no dashboard e não altera o nome nem os tickets no HubSpot.">
      {canManageIntegration ? <div className="mb-4 grid gap-3 rounded-lg border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface-muted)] p-3 md:grid-cols-[1fr_1fr_1.2fr_1.6fr_auto_auto] md:items-end">
        <label className="flex flex-col gap-1.5 text-xs font-medium text-[color:var(--minimal-text-secondary)]">Área<select value={draft.domainKey} onChange={(event) => setDraft((current) => ({ ...current, domainKey: event.target.value as Draft['domainKey'], objectType: event.target.value === 'cs' ? 'ticket' : 'deal' }))} className={CONTROL}><option value="cs">CS / Suporte</option><option value="commercial">Comercial</option></select></label>
        <label className="flex flex-col gap-1.5 text-xs font-medium text-[color:var(--minimal-text-secondary)]">Tipo<select value={draft.objectType} onChange={(event) => setDraft((current) => ({ ...current, objectType: event.target.value as Draft['objectType'] }))} className={CONTROL}><option value="ticket">Ticket</option><option value="deal">Deal</option></select></label>
        <label className="flex flex-col gap-1.5 text-xs font-medium text-[color:var(--minimal-text-secondary)]">ID do pipeline<input inputMode="numeric" value={draft.pipelineId} onChange={(event) => setDraft((current) => ({ ...current, pipelineId: event.target.value.replace(/\D/g, '') }))} placeholder="Ex.: 5034314" className={CONTROL} /></label>
        <label className="flex flex-col gap-1.5 text-xs font-medium text-[color:var(--minimal-text-secondary)]">Alias interno (opcional)<input value={draft.alias} onChange={(event) => setDraft((current) => ({ ...current, alias: event.target.value }))} placeholder="Ex.: Formulário Site Conf" className={CONTROL} /><span className="text-[11px] font-normal text-[color:var(--minimal-text-tertiary)]">Se ficar vazio, o dashboard usará o nome original do HubSpot.</span></label>
        <label className="flex h-9 items-center gap-2 rounded-md border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] px-2.5 text-xs font-medium text-[color:var(--minimal-text-secondary)]"><input type="checkbox" checked={draft.isActive} onChange={(event) => setDraft((current) => ({ ...current, isActive: event.target.checked }))} className="accent-[color:var(--minimal-text)]" /> Ativo</label>
        <button type="button" onClick={() => void save()} disabled={state.saving} className="h-9 rounded-md bg-[color:var(--minimal-text)] px-3 text-sm font-medium text-[color:var(--minimal-surface)] disabled:opacity-60">{state.saving ? 'Salvando...' : draft.id ? 'Atualizar' : 'Adicionar'}</button>
      </div> : <p className="mb-4 rounded-md border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface-muted)] px-3 py-2 text-xs text-[color:var(--minimal-text-secondary)]">As fontes estão em modo somente leitura para este perfil. Um administrador da plataforma pode alterar aliases, estado e pipelines.</p>}
      {state.error ? <p role="alert" className="mb-3 text-xs text-[color:var(--minimal-danger-text)]">{state.error}</p> : null}
      {state.message ? <p role="status" className="mb-3 text-xs text-[color:var(--minimal-action)]">{state.message}</p> : null}
      <div className="overflow-x-auto rounded-lg border border-[color:var(--minimal-border)]"><table className="w-full min-w-[1100px] text-xs"><thead><tr className="border-b border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface-muted)] text-left text-[11px] font-semibold uppercase tracking-wide text-[color:var(--minimal-text-tertiary)]"><th className="px-3 py-2.5">Área</th><th className="px-3 py-2.5">Tipo</th><th className="px-3 py-2.5">ID do pipeline</th><th className="px-3 py-2.5">Nome no HubSpot</th><th className="px-3 py-2.5">Alias interno</th><th className="px-3 py-2.5">Estado</th><th className="px-3 py-2.5 text-right">Ação</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-b border-[color:var(--minimal-border)] last:border-0"><td className="px-3 py-2.5 font-medium text-[color:var(--minimal-text)]">{row.domainKey === 'cs' ? 'CS / Suporte' : 'Comercial'}</td><td className="px-3 py-2.5 text-[color:var(--minimal-text-secondary)]">{row.objectType === 'ticket' ? 'Ticket' : 'Deal'}</td><td className="px-3 py-2.5 font-mono text-[color:var(--minimal-text-secondary)]">{row.pipelineId}</td><td className="px-3 py-2.5 text-[color:var(--minimal-text)]">{row.hubspotLabel || <span className="text-[color:var(--minimal-text-tertiary)]">Aguardando sincronização</span>}</td><td className="px-3 py-2.5 font-semibold text-[color:var(--minimal-text)]">{row.alias || <span className="font-normal text-[color:var(--minimal-text-tertiary)]">Usa nome do HubSpot</span>}</td><td className="px-3 py-2.5"><span className={row.isActive ? 'text-[color:var(--minimal-action)]' : 'text-[color:var(--minimal-text-tertiary)]'}>{row.isActive ? 'Ativo' : 'Inativo'}</span></td><td className="px-3 py-2.5 text-right"><button type="button" onClick={() => edit(row)} className="rounded-md border border-[color:var(--minimal-border-strong)] px-2.5 py-1.5 font-medium text-[color:var(--minimal-text)] hover:bg-[color:var(--minimal-surface-muted)]">Editar</button></td></tr>)}</tbody></table></div>
      <p className="mt-3 flex items-start gap-1.5 text-xs text-[color:var(--minimal-text-tertiary)]"><MetricInfo text="A área CS / Suporte pode reunir vários pipelines. O sincronizador consulta cada fonte ativa e o dashboard consolida por pipeline, origem, status e responsável." /> Para alterar um pipeline, edite a linha e mantenha o rótulo alinhado ao catálogo do HubSpot.</p>
    </ChartCard>
    <ChartCard title="Fonte operacional de CS" description="Os indicadores de CS e Suporte são lidos do HubSpot, usando os pipelines ativos configurados acima. A planilha CS Ops permanece somente como histórico de migração e não é uma fonte operacional desta tela.">
      <div className="rounded-lg border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface-muted)] p-3 text-sm text-[color:var(--minimal-text-secondary)]">
        <p className="font-medium text-[color:var(--minimal-text)]">HubSpot é a fonte atual de CS</p>
        <p className="mt-1 text-xs">A planilha CS Ops pode continuar registrada no histórico técnico para auditoria e migração assistida, mas novas atualizações devem ocorrer no HubSpot.</p>
      </div>
    </ChartCard>
    </div>
    {runningNow ? <GeniusSyncOverlay source="OMIE" detail="O OMIE será sincronizado e os vínculos financeiros com o HubSpot serão recalculados." /> : null}
    {hubspotRunningNow ? <GeniusSyncOverlay source="HubSpot" detail="Empresas, Comercial, CS / Suporte, responsáveis e estágios serão atualizados no cache do Dashboard." /> : null}
  </>;
}
