export const HUBSPOT_COMPANY_BATCH_SIZE = 100;

export function chunkCompanyUpdates(updates, size = HUBSPOT_COMPANY_BATCH_SIZE) {
  const chunkSize = Math.max(1, Math.min(Number(size) || HUBSPOT_COMPANY_BATCH_SIZE, HUBSPOT_COMPANY_BATCH_SIZE));
  const chunks = [];
  for (let index = 0; index < updates.length; index += chunkSize) chunks.push(updates.slice(index, index + chunkSize));
  return chunks;
}

export function buildHubSpotCompanyBatchUpdatePayload(updates) {
  return { inputs: updates.map(({ id, properties }) => ({ id: String(id), properties })) };
}
