export function canManageAnalyticsIntegration(actor) {
  return actor?.is_platform_admin === true;
}
