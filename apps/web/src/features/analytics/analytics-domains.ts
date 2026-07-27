import { lazy, type ComponentType } from 'react';
import type { AnalyticsPageProps } from './analytics-model';

const AnalyticsCommercialPage = lazy(() => import('./AnalyticsCommercialPage').then((module) => ({ default: module.AnalyticsCommercialPage })));
const AnalyticsCsPage = lazy(() => import('./AnalyticsCsPage').then((module) => ({ default: module.AnalyticsCsPage })));
const AnalyticsFinancePage = lazy(() => import('./AnalyticsFinancePage').then((module) => ({ default: module.AnalyticsFinancePage })));
const AnalyticsCeoPage = lazy(() => import('./AnalyticsCeoPage').then((module) => ({ default: module.AnalyticsCeoPage })));

export interface AnalyticsDomain {
  key: string;
  label: string;
  description: string;
  syncDomain: 'commercial' | 'cs' | null;
  Component: ComponentType<AnalyticsPageProps>;
  enabled: boolean;
}

export const ANALYTICS_DOMAINS: AnalyticsDomain[] = [
  { key: 'ceo', label: 'Visão executiva', description: 'Resumo para decisão de CEO', syncDomain: null, Component: AnalyticsCeoPage, enabled: true },
  { key: 'commercial', label: 'Comercial', description: 'Operação Aftersale (Deals HubSpot)', syncDomain: 'commercial', Component: AnalyticsCommercialPage, enabled: true },
  { key: 'cs', label: 'CS / Suporte', description: 'Tickets de suporte (HubSpot)', syncDomain: 'cs', Component: AnalyticsCsPage, enabled: true },
  { key: 'finance', label: 'Financeiro', description: 'Contas a receber do OMIE ou planilha exportada', syncDomain: null, Component: AnalyticsFinancePage, enabled: true },
];

export function listEnabledAnalyticsDomains() {
  return ANALYTICS_DOMAINS.filter((domain) => domain.enabled);
}
