import type { AnalyticsBlockState } from '@genius-support-os/contracts';

export type KpiState = 'available' | 'partial' | 'unavailable' | 'awaiting_history';

export interface KpiEntry {
  state: KpiState;
  value: number | null;
  basis: string | null;
  reason: string | null;
}

export interface KpiMeta {
  freshnessAt: string | null;
  coveragePercent: number | null;
  isPartial: boolean;
  periodFrom: string | null;
  periodTo: string | null;
  historyDays: number | null;
  warnings: string[];
}

export type KpiValueKind = 'count' | 'currency' | 'percent' | 'days';

/** Lê uma entrada de KPI do payload, normalizando formatos inesperados. */
export function readKpi(payload: unknown, key: string): KpiEntry;

/** Formata o valor; devolve o texto de estado quando não há valor confiável. */
export function formatKpiValue(entry: KpiEntry | null | undefined, kind?: KpiValueKind): string;

/** Frase gerencial que explica a limitação do indicador. Vazia quando íntegro. */
export function describeKpiLimitation(entry: KpiEntry | null | undefined): string;

/** Rótulo curto do estado, para o selo ao lado do número. */
export function describeKpiState(entry: KpiEntry | null | undefined): string;

/** Explica qual data define a coorte do indicador. */
export function describeKpiBasis(entry: KpiEntry | null | undefined): string;

/** Converte os códigos de aviso dos metadados em frases gerenciais. */
export function summarizeWarnings(payload: unknown): string[];

/** Lê os metadados de confiabilidade sem expor nomes técnicos. */
export function readKpiMeta(payload: unknown): KpiMeta;

/** Estado de bloco compatível com o selo já usado pelas telas de Analytics. */
export function toAnalyticsBlockState(payload: unknown, sourceLabel: string): AnalyticsBlockState;
