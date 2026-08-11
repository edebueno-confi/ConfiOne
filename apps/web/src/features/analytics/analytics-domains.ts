import { lazy, type ComponentType } from 'react';
import type { AnalyticsPageProps } from './analytics-model';

const AnalyticsCommercialPage = lazy(() => import('./AnalyticsCommercialPage').then((module) => ({ default: module.AnalyticsCommercialPage })));
const AnalyticsCsPage = lazy(() => import('./AnalyticsCsPage').then((module) => ({ default: module.AnalyticsCsPage })));
const AnalyticsFinancePage = lazy(() => import('./AnalyticsFinancePage').then((module) => ({ default: module.AnalyticsFinancePage })));
const AnalyticsCeoPage = lazy(() => import('./AnalyticsCeoPage').then((module) => ({ default: module.AnalyticsCeoPage })));
const AnalyticsCustomerSuccessPage = lazy(() => import('./AnalyticsCustomerSuccessPage').then((module) => ({ default: module.AnalyticsCustomerSuccessPage })));
const AnalyticsProductDevelopmentPage = lazy(() => import('./AnalyticsUnavailablePages').then((module) => ({ default: module.AnalyticsProductDevelopmentPage })));

export interface AnalyticsDomain {
  key: string;
  label: string;
  description: string;
  syncDomain: 'commercial' | 'cs' | null;
  Component: ComponentType<AnalyticsPageProps>;
  enabled: boolean;
}

export const ANALYTICS_DOMAINS: AnalyticsDomain[] = [
  { key: 'ceo', label: 'Visão Geral', description: 'Resumo para decisão de CEO', syncDomain: null, Component: AnalyticsCeoPage, enabled: true },
  { key: 'commercial', label: 'Comercial', description: 'Operação Aftersale (Deals HubSpot)', syncDomain: 'commercial', Component: AnalyticsCommercialPage, enabled: true },
  { key: 'customer_success', label: 'Customer Success', description: 'Carteira e relacionamento com clientes', syncDomain: null, Component: AnalyticsCustomerSuccessPage, enabled: true },
  { key: 'support', label: 'Suporte', description: 'Tickets, fila e tempos publicados; conversas ainda não conectadas', syncDomain: 'cs', Component: AnalyticsCsPage, enabled: true },
  { key: 'finance', label: 'Financeiro', description: 'Contas a receber da integração OMIE', syncDomain: null, Component: AnalyticsFinancePage, enabled: true },
  { key: 'product-development', label: 'Produto e Desenvolvimento', description: 'Roadmap, entregas e fluxo técnico aguardando integração', syncDomain: null, Component: AnalyticsProductDevelopmentPage, enabled: true },
];

export function listEnabledAnalyticsDomains() {
  return ANALYTICS_DOMAINS.filter((domain) => domain.enabled);
}
