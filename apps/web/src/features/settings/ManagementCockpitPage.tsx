import { Link } from 'react-router';
import { DashboardSourcesSettingsPage } from './DashboardSourcesSettingsPage';
import { PipelineRoleSettings } from './PipelineRoleSettings';
import { StageMappingSettings } from './StageMappingSettings';
import { SyncHistorySettingsPage } from './SyncHistorySettingsPage';
import { CompanyReconciliationPanel } from './CompanyReconciliationPanel';
import '../analytics/high-density.css';
import './settings-ui.css';

/** Superfície administrativa: compõe somente módulos que já têm contratos reais. */
export function ManagementCockpitPage() {
  return <main className="gso-settings-shell gso-visual-v1-settings-shell gso-high-density-ui min-h-full bg-[color:var(--minimal-canvas)]">
    <header className="gso-settings-gutter border-b border-[color:var(--minimal-border)] py-6">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--minimal-action)]">Administração do Dashboard</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[color:var(--minimal-text)]">Cockpit gerencial</h1>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-[color:var(--minimal-text-secondary)]">Fontes, escopo dos pipelines, etapas e execuções em uma rotina administrativa separada da leitura operacional.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className="gso-settings-button gso-settings-button--secondary" to="/admin/settings/integrations">Integrações</Link>
          <Link className="gso-settings-button gso-settings-button--secondary" to="/admin/analytics">Abrir Dashboard</Link>
        </div>
      </div>
    </header>

    <div className="gso-settings-gutter space-y-10 py-6">
      <section aria-labelledby="cockpit-fontes" className="space-y-5">
        <div className="border-b border-[color:var(--minimal-border)] pb-3">
          <h2 id="cockpit-fontes" className="text-lg font-semibold text-[color:var(--minimal-text)]">Fontes e escopo</h2>
          <p className="mt-1 text-sm text-[color:var(--minimal-text-secondary)]">Revise o nome oficial e a operação antes de qualquer decisão que mude o número publicado.</p>
        </div>
        <DashboardSourcesSettingsPage />
        <PipelineRoleSettings />
      </section>

      <section aria-labelledby="cockpit-etapas" className="space-y-5 border-t border-[color:var(--minimal-border)] pt-6">
        <div className="border-b border-[color:var(--minimal-border)] pb-3">
          <h2 id="cockpit-etapas" className="text-lg font-semibold text-[color:var(--minimal-text)]">Leitura da fila</h2>
          <p className="mt-1 text-sm text-[color:var(--minimal-text-secondary)]">O cruzamento de etapas é uma decisão auditável: etapa sem decisão não é agrupada por conveniência.</p>
        </div>
        <StageMappingSettings />
      </section>

      <section aria-labelledby="cockpit-execucoes" className="space-y-5 border-t border-[color:var(--minimal-border)] pt-6">
        <div className="border-b border-[color:var(--minimal-border)] pb-3">
          <h2 id="cockpit-execucoes" className="text-lg font-semibold text-[color:var(--minimal-text)]">Execuções e rastreabilidade</h2>
          <p className="mt-1 text-sm text-[color:var(--minimal-text-secondary)]">Histórico de sincronizações, sem misturá-lo ao painel de decisão.</p>
        </div>
        <SyncHistorySettingsPage />
      </section>

      <section aria-labelledby="cockpit-conciliacao" className="space-y-5 border-t border-[color:var(--minimal-border)] pt-6">
        <h2 id="cockpit-conciliacao" className="text-lg font-semibold text-[color:var(--minimal-text)]">Conciliação de empresas</h2>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-[color:var(--minimal-text-secondary)]">A conciliação manual HubSpot–OMIE entra aqui. Sugestões por nome não valem como vínculo até uma pessoa autorizada confirmar a evidência.</p>
        <CompanyReconciliationPanel />
      </section>
    </div>
  </main>;
}
