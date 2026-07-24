export const HUBSPOT_COMPANY_BATCH_SIZE: 100;
export function chunkCompanyUpdates<T>(updates: T[], size?: number): T[][];
export function buildHubSpotCompanyBatchUpdatePayload(updates: Array<{ id: string; properties: Record<string, string> }>): { inputs: Array<{ id: string; properties: Record<string, string> }> };
