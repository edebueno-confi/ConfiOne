export type TimeseriesGrain = 'day' | 'week' | 'month';

export declare const TIMESERIES_GRAINS: TimeseriesGrain[];

export interface TimeseriesReading<T = Record<string, unknown>> {
  available: boolean;
  points: T[];
  legend: Record<string, string>;
  reason: string | null;
  grain: TimeseriesGrain;
}

export declare function grainLabel(grain: string): string;

export declare function readTimeseries<T = Record<string, unknown>>(
  payload: unknown,
  measures?: string[],
): TimeseriesReading<T>;

export declare function measureBasis(
  legend: Record<string, string> | null | undefined,
  measure: string,
): string | null;

export declare function describeCohorts(
  legend: Record<string, string> | null | undefined,
  measures: string[],
): string[];
