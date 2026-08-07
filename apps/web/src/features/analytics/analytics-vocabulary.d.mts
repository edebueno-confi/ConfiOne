/** Termos proibidos na interface, mapeados para o termo canônico. */
export declare const FORBIDDEN_TERMS: Record<string, string>;

/** Rótulo canônico de cada indicador. Um conceito, um nome. */
export declare const KPI_LABELS: Record<string, string>;

/** Resolve o rótulo de um indicador; nunca devolve a chave interna. */
export function kpiLabel(key: string): string;

/** Lista os termos proibidos encontrados em um texto de interface. */
export function findForbiddenTerms(text: string): string[];
