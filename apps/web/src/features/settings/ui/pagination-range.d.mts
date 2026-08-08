export declare const PAGE_GAP: 'gap';

export declare function paginationRange(
  current: number,
  total: number,
  window?: number,
): Array<number | 'gap'>;

export declare function paginationSummary(input: {
  page: number;
  perPage: number;
  total: number;
  noun: string;
  nounPlural?: string;
}): string;
