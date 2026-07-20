import { useEffect, useState } from 'react';
import { MinimalState } from '../../components/minimal-states';
import { getIntegrationSchedule, listAnalyticsSourceConfig, listCsOpsImportRuns, runCsOpsMigration, runIntegrationNow, setIntegrationSchedule, triggerCsOpsSpreadsheetImport, upsertAnalyticsSourceConfig, type CsOpsImportRun, type IntegrationSchedule } from './analytics-api';
import type { AnalyticsSourceConfig } from './analytics-model';
import { ChartCard, MetricInfo } from './analytics-ui';

type Draft = { id?: string; domainKey: 'commercial' | 'cs'; objectType: 'deal' | 'ticket'; pipelineId: string; alias: string; isActive: boolean };
const EMPTY_DRAFT: Draft = { domainKey: 'cs', objectType: 'ticket', pipelineId: '', alias: '', isActive: true };
const CONTROL = 'h-9 rounded-md border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] px-2.5 text-sm text-[color:var(--minimal-text)] outline-none focus:border-[color:var(--minimal-text-secondary)] focus:ring-2 focus:ring-[color:var(--minimal-border-strong)]';

export function AnalyticsConfigPage() {
  const [rows, setRows] = useState<AnalyticsSourceConfig[]>([]);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [csOpsFile, setCsOpsFile] = useState<File | null>(null);
  const [csOpsRuns, setCsOpsRuns] = useState<CsOpsImportRun[]>([]);
  const [state, setState] = useState<{ loading: boolean; saving: boolean; error?: string; message?: string }>({ loading: true, saving: false });
  const load = () => { setState((current) => ({ ...current, loading: true, error: undefined })); listAnalyticsSourceConfig().then((data) => { setRows(data); setState((current) => ({ ...current, loading: false })); }).catch((error) => setState({ loading: false, saving: false, error: error instanceof Error ? error.message : 'Falha ao carregar as fontes.' })); };
  const [schedule, setSchedule] = useState<IntegrationSchedule | null>(null);
  const [scheduleBusy, setScheduleBusy] = useState(false);
  const [scheduleMsg, setScheduleMsg] = useState<string | null>(null);
  const loadSchedule = () => { void getIntegrationSchedule().then(setSchedule).catch(() => setSchedule(null)); };
  const patchSchedule = (patch: Partial<IntegrationSchedule>) => setSchedule((current) => ({ enabled: current?.enabled ?? false, frequency: current?.frequency ?? 'daily', lastRunAt: current?.lastRunAt ?? null, lastStatus: current?.lastStatus ?? null, lastMessage: current?.lastMessage ?? null, ...patch }));
  const saveSchedule = async () => { setScheduleBusy(true); setScheduleMsg(null); try { await setIntegrationSchedule(schedule?.enabled ?? false, schedule?.frequency ?? 'off'); loadSchedule(); setScheduleMsg('Agendamento salvo.'); } catch (error) { setScheduleMsg(error instanceof Error ? error.message : 'Falha ao salvar o agendamento.'); } finally { setScheduleBusy(false); } };
  const runNow = async () => { setScheduleBusy(true); setScheduleMsg(null); try { const r = await runIntegrationNow(); setScheduleMsg(`Sincronização concluída: ${r.omieTitles.toLocaleString('pt-BR')} títulos do OMIE e ${r.updated.toLocaleString('pt-BR')}/${r.companies.toLocaleString('pt-BR')} empresas atualizadas no HubSpot.`); loadSchedule(); } catch (error) { setScheduleMsg(error instanceof Error ? error.message : 'Falha ao sincronizar agora.'); } finally { setScheduleBusy(false); } };
  useEffect(() => { load(); loadSchedule(); void listCsOpsImportRuns().then(setCsOpsRuns).catch(() => setCsOpsRuns([])); }, []);
  const save = async () => {
    if (!draft.pipelineId.trim() || !/^\d+$/.test(draft.pipelineId.trim())) { setState((current) => ({ ...current, error: 'Informe um ID numérico de pipeline.' })); return; }
    setState((current) => ({ ...current, saving: true, error: undefined, message: undefined }));
    try { await upsertAnalyticsSourceConfig({ id: draft.id, domainKey: draft.domainKey, objectType: draft.objectType, pipelineId: draft.pipelineId.trim(), label: draft.alias.trim(), isActive: draft.isActive }); setDraft(EMPTY_DRAFT); setState((current) => ({ ...current, saving: false, message: 'Fonte salva. Execute uma sincronização para atualizar o cache local.' })); load(); } catch (error) { setState((current) => ({ ...current, saving: false, error: error instanceof Error ? error.message : 'Falha ao salvar a fonte.' })); }
  };
  const importCsOps = async () => {
    if (!csOpsFile) return;
    setState((current) => ({ ...current, saving: true, error: undefined, message: undefined }));
    try {
      await triggerCsOpsSpreadsheetImport(csOpsFile);
      setCsOpsFile(null);
      setCsOpsRuns(await listCsOpsImportRuns());
      setState((current) => ({ ...current, saving: false, message: 'Lote CS Ops recebido e validado no staging. Nenhuma empresa HubSpot foi alterada.' }));
    } catch (error) {
      setState((current) => ({ ...current, saving: false, error: error instanceof Error ? error.message : 'Falha ao importar a planilha CS Ops.' }));
    }
  };
  const simulateCsOpsMigration = async () => {
    const latest = csOpsRuns[0];
    if (!latest) return;
    setState((current) => ({ ...current, saving: true, error: undefined, message: undefined }));
    try {
      const result = await runCsOpsMigration(latest.id, 'dry_run');
      const counts = result.counts;
      setState((current) => ({ ...current, saving: false, message: `Simulação CS Ops concluída: ${counts.plannedRows ?? 0} planejadas, ${counts.ambiguousRows ?? 0} ambíguas, ${counts.createRows ?? 0} para criação e ${counts.updateRows ?? 0} para atualização. Nenhuma empresa foi alterada.` }));
    } catch (error) {
      setState((current) => ({ ...current, saving: false, error: error instanceof Error ? error.message : 'Falha ao simular a migração CS Ops.' }));
    }
  };
  const edit = (row: AnalyticsSourceConfig) => setDraft({ id: row.id, domainKey: row.domainKey, objectType: row.objectType, pipelineId: row.pipelineId, alias: row.alias ?? '', isActive: row.isActive });
  if (state.loading && rows.length === 0) return <MinimalState loading title="Carregando configuração" description="O Gênio está consultando os pipelines ativos do Dashboard Gerencial." />;
  if (state.error && rows.length === 0) return <MinimalState tone="critical" title="Não foi possível carregar" description={state.error} />;
  return <div className="space-y-5">
    <ChartCard title="Sincronização automática (OMIE ↔ HubSpot)" description="Define a cadência da atualização automática dos dados financeiros do OMIE nas empresas do HubSpot. Você também pode rodar agora.">
      <div className="flex flex-wrap items-end gap-3">
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
      </div>
      {schedule?.lastRunAt ? <p className="mt-3 text-xs text-[color:var(--minimal-text-tertiary)]">Última execução: {new Date(schedule.lastRunAt).toLocaleString('pt-BR')} · {schedule.lastStatus ?? '—'}{schedule.lastMessage ? ` · ${schedule.lastMessage}` : ''}</p> : <p className="mt-3 text-xs text-[color:var(--minimal-text-tertiary)]">Nenhuma execução automática registrada ainda.</p>}
      <p className="mt-1 text-xs text-[color:var(--minimal-text-tertiary)]">A execução automática server-side (cron) exige o segredo de agendamento configurado; o botão "Rodar agora" funciona de imediato.</p>
      {scheduleMsg ? <p className="mt-2 text-xs text-[color:var(--minimal-warning-text)]">{scheduleMsg}</p> : null}
    </ChartCard>
    <ChartCard title="Fontes de dados do Dashboard" description="Selecione quais pipelines do HubSpot compõem cada área e dê um alias interno legível. O alias aparece no dashboard e não altera o nome nem os tickets no HubSpot.">
      <div className="mb-4 grid gap-3 rounded-lg border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface-muted)] p-3 md:grid-cols-[1fr_1fr_1.2fr_1.6fr_auto_auto] md:items-end">
        <label className="flex flex-col gap-1.5 text-xs font-medium text-[color:var(--minimal-text-secondary)]">Área<select value={draft.domainKey} onChange={(event) => setDraft((current) => ({ ...current, domainKey: event.target.value as Draft['domainKey'], objectType: event.target.value === 'cs' ? 'ticket' : 'deal' }))} className={CONTROL}><option value="cs">CS / Suporte</option><option value="commercial">Comercial</option></select></label>
        <label className="flex flex-col gap-1.5 text-xs font-medium text-[color:var(--minimal-text-secondary)]">Tipo<select value={draft.objectType} onChange={(event) => setDraft((current) => ({ ...current, objectType: event.target.value as Draft['objectType'] }))} className={CONTROL}><option value="ticket">Ticket</option><option value="deal">Deal</option></select></label>
        <label className="flex flex-col gap-1.5 text-xs font-medium text-[color:var(--minimal-text-secondary)]">ID do pipeline<input inputMode="numeric" value={draft.pipelineId} onChange={(event) => setDraft((current) => ({ ...current, pipelineId: event.target.value.replace(/\D/g, '') }))} placeholder="Ex.: 5034314" className={CONTROL} /></label>
        <label className="flex flex-col gap-1.5 text-xs font-medium text-[color:var(--minimal-text-secondary)]">Alias interno (opcional)<input value={draft.alias} onChange={(event) => setDraft((current) => ({ ...current, alias: event.target.value }))} placeholder="Ex.: Formulário Site Conf" className={CONTROL} /><span className="text-[11px] font-normal text-[color:var(--minimal-text-tertiary)]">Se ficar vazio, o dashboard usará o nome original do HubSpot.</span></label>
        <label className="flex h-9 items-center gap-2 rounded-md border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] px-2.5 text-xs font-medium text-[color:var(--minimal-text-secondary)]"><input type="checkbox" checked={draft.isActive} onChange={(event) => setDraft((current) => ({ ...current, isActive: event.target.checked }))} className="accent-[color:var(--minimal-text)]" /> Ativo</label>
        <button type="button" onClick={() => void save()} disabled={state.saving} className="h-9 rounded-md bg-[color:var(--minimal-text)] px-3 text-sm font-medium text-[color:var(--minimal-surface)] disabled:opacity-60">{state.saving ? 'Salvando...' : draft.id ? 'Atualizar' : 'Adicionar'}</button>
      </div>
      {state.error ? <p role="alert" className="mb-3 text-xs text-[color:var(--minimal-danger-text)]">{state.error}</p> : null}
      {state.message ? <p role="status" className="mb-3 text-xs text-[color:var(--minimal-warning-text)]">{state.message}</p> : null}
      <div className="overflow-x-auto rounded-lg border border-[color:var(--minimal-border)]"><table className="w-full min-w-[1100px] text-xs"><thead><tr className="border-b border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface-muted)] text-left text-[11px] font-semibold uppercase tracking-wide text-[color:var(--minimal-text-tertiary)]"><th className="px-3 py-2.5">Área</th><th className="px-3 py-2.5">Tipo</th><th className="px-3 py-2.5">ID do pipeline</th><th className="px-3 py-2.5">Nome no HubSpot</th><th className="px-3 py-2.5">Alias interno</th><th className="px-3 py-2.5">Estado</th><th className="px-3 py-2.5 text-right">Ação</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-b border-[color:var(--minimal-border)] last:border-0"><td className="px-3 py-2.5 font-medium text-[color:var(--minimal-text)]">{row.domainKey === 'cs' ? 'CS / Suporte' : 'Comercial'}</td><td className="px-3 py-2.5 text-[color:var(--minimal-text-secondary)]">{row.objectType === 'ticket' ? 'Ticket' : 'Deal'}</td><td className="px-3 py-2.5 font-mono text-[color:var(--minimal-text-secondary)]">{row.pipelineId}</td><td className="px-3 py-2.5 text-[color:var(--minimal-text)]">{row.hubspotLabel || <span className="text-[color:var(--minimal-text-tertiary)]">Aguardando sincronização</span>}</td><td className="px-3 py-2.5 font-semibold text-[color:var(--minimal-text)]">{row.alias || <span className="font-normal text-[color:var(--minimal-text-tertiary)]">Usa nome do HubSpot</span>}</td><td className="px-3 py-2.5"><span className={row.isActive ? 'text-[color:var(--minimal-action)]' : 'text-[color:var(--minimal-text-tertiary)]'}>{row.isActive ? 'Ativo' : 'Inativo'}</span></td><td className="px-3 py-2.5 text-right"><button type="button" onClick={() => edit(row)} className="rounded-md border border-[color:var(--minimal-border-strong)] px-2.5 py-1.5 font-medium text-[color:var(--minimal-text)] hover:bg-[color:var(--minimal-surface-muted)]">Editar</button></td></tr>)}</tbody></table></div>
      <p className="mt-3 flex items-start gap-1.5 text-xs text-[color:var(--minimal-text-tertiary)]"><MetricInfo text="A área CS / Suporte pode reunir vários pipelines. O sincronizador consulta cada fonte ativa e o dashboard consolida por pipeline, origem, status e responsável." /> Para alterar um pipeline, edite a linha e mantenha o rótulo alinhado ao catálogo do HubSpot.</p>
    </ChartCard>
    <ChartCard title="Importação controlada da planilha CS Ops" description="Use um XLSX/CSV exportado da planilha. A aba BD_Clientes é lida a partir do cabeçalho da linha 4 e fica disponível para o próximo lote de reconciliação.">
      <div className="flex flex-wrap items-center gap-2">
        <input accept=".csv,.xlsx" aria-label="Arquivo da planilha CS Ops" className="max-w-[280px] text-xs text-[color:var(--minimal-text-secondary)]" type="file" onChange={(event) => setCsOpsFile(event.target.files?.[0] ?? null)} />
        <button type="button" onClick={() => void importCsOps()} disabled={!csOpsFile || state.saving} className="rounded-md bg-[color:var(--minimal-text)] px-3 py-2 text-sm font-medium text-[color:var(--minimal-surface)] disabled:opacity-60">{state.saving ? 'Processando...' : 'Importar CS Ops'}</button>
        <button type="button" onClick={() => void simulateCsOpsMigration()} disabled={!csOpsRuns.length || state.saving} className="rounded-md border border-[color:var(--minimal-border-strong)] px-3 py-2 text-sm font-medium text-[color:var(--minimal-text)] disabled:opacity-60">Simular migração</button>
      </div>
      <p className="mt-3 text-xs text-[color:var(--minimal-text-tertiary)]">O lote é idempotente por hash do arquivo e mantém linhas rejeitadas, origem e versão do mapeamento para auditoria.</p>
      {csOpsRuns[0] ? <p className="mt-2 text-xs text-[color:var(--minimal-text-secondary)]">Último lote: <strong>{csOpsRuns[0].originalFilename}</strong> · {csOpsRuns[0].acceptedRows}/{csOpsRuns[0].totalRows} linhas aceitas · {new Date(csOpsRuns[0].createdAt).toLocaleString('pt-BR')}.</p> : <p className="mt-2 text-xs text-[color:var(--minimal-text-tertiary)]">Nenhum lote CS Ops foi importado neste ambiente.</p>}
    </ChartCard>
  </div>;
}
