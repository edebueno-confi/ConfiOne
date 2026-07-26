const PRODUCTION_ORIGIN = 'https://genius-support-os.vercel.app';
const KNOWN_PREVIEW_ORIGIN = 'https://genius-support-qsi9of0cf-edebueno-confis-projects.vercel.app';

export function isAllowedCorsOrigin(origin, options = {}) {
  if (!origin) return false;
  const configured = String(options.allowedOrigins ?? '').split(',').map((item) => item.trim()).filter(Boolean);
  if (configured.includes(origin) || origin === PRODUCTION_ORIGIN || origin === KNOWN_PREVIEW_ORIGIN) return true;
  if (options.allowLocal === true && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true;
  return false;
}

export function resolveCorsOrigin(origin, options = {}) {
  return isAllowedCorsOrigin(origin, options) ? origin : null;
}
