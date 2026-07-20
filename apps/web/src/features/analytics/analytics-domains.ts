import type { ComponentType } from 'react';
import type { AnalyticsPageProps } from './analytics-model';
import { AnalyticsCommercialPage } from './AnalyticsCommercialPage';
import { AnalyticsCsPage } from './AnalyticsCsPage';
import { AnalyticsFinancePage } from './AnalyticsFinancePage';
import { AnalyticsCeoPage } from './AnalyticsCeoPage';
import { AnalyticsLogsPage } from './AnalyticsLogsPage';
import { AnalyticsConfigPage } from './AnalyticsConfigPage';

// Registry/adapter por dominio de dados. Adicionar uma nova area (Financeiro,
// Produto, Migracao, Onboarding, Juridico, Clientes) = registrar um item aqui
// com o seu componente de secao. A UI (AnalyticsShell) itera sobre este array,
// entao nenhuma tela precisa ser reescrita para plugar uma area nova.
export interface AnalyticsDomain {
  key: string;
  label: string;
  description: string;
  // syncDomain: chave enviada a Edge Function hubspot-sync. null = area sem
  // fonte HubSpot sincronizavel ainda (usa outro adapter no futuro).
  syncDomain: 'commercial' | 'cs' | null;
  Component: ComponentType<AnalyticsPageProps>;
  enabled: boolean;
}

export const ANALYTICS_DOMAINS: AnalyticsDomain[] = [
  {
    key: 'ceo',
    label: 'Visão executiva',
    description: 'Resumo para decisão de CEO',
    syncDomain: null,
    Component: AnalyticsCeoPage,
    enabled: true,
  },
  {
    key: 'commercial',
    label: 'Comercial',
    description: 'Operacao Aftersale (Deals HubSpot)',
    syncDomain: 'commercial',
    Component: AnalyticsCommercialPage,
    enabled: true,
  },
  {
    key: 'cs',
    label: 'CS / Suporte',
    description: 'Tickets de suporte (HubSpot)',
    syncDomain: 'cs',
    Component: AnalyticsCsPage,
    enabled: true,
  },
  {
    key: 'finance',
    label: 'Financeiro',
    description: 'Contas a receber do Omie ou planilha exportada',
    syncDomain: null,
    Component: AnalyticsFinancePage,
    enabled: true,
  },
  {
    key: 'logs',
    label: 'Logs',
    description: 'Histórico das integrações gerenciais',
    syncDomain: null,
    Component: AnalyticsLogsPage,
    enabled: true,
  },
  {
    key: 'config',
    label: 'Configuração',
    description: 'Pipelines e fontes do Dashboard Gerencial',
    syncDomain: null,
    Component: AnalyticsConfigPage,
    enabled: true,
  },
];

export function listEnabledAnalyticsDomains(): AnalyticsDomain[] {
  return ANALYTICS_DOMAINS.filter((domain) => domain.enabled);
}
