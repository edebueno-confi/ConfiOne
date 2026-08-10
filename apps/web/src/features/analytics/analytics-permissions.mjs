export function canManageAnalyticsIntegration(actor) {
  return actor?.is_platform_admin === true || actor?.roles?.includes('platform_admin') === true;
}
