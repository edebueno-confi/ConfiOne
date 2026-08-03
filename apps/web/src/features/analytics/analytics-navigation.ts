export type AnalyticsUrlTab = 'ceo' | 'commercial' | 'customer-success' | 'support' | 'finance' | 'product-development' | 'product' | 'development';

const allowedTabs = new Set<AnalyticsUrlTab>(['ceo', 'commercial', 'customer-success', 'support', 'finance', 'product-development', 'product', 'development']);
const allowedKeys = new Set(['tab', 'pipeline', 'from', 'to', 'status', 'owner', 'priority', 'stage']);

export function normalizeAnalyticsSearch(search: string) {
  const input = new URLSearchParams(search);
  const output = new URLSearchParams();
  for (const [key, value] of input.entries()) {
    if (!allowedKeys.has(key) || !value.trim()) continue;
    if (key === 'tab') {
      const tab = value === 'cs' || value === 'cs-support' ? 'support' : value === 'product' || value === 'development' ? 'product-development' : value;
      if (!allowedTabs.has(tab as AnalyticsUrlTab)) continue;
      output.set('tab', tab);
    } else if (key === 'from' || key === 'to') {
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) output.set(key, value);
    } else if (key === 'pipeline' || key === 'owner') {
      if (/^[A-Za-z0-9_-]{1,120}$/.test(value)) output.set(key, value);
    } else if (key === 'status' || key === 'priority' || key === 'stage') {
      output.set(key, value.slice(0, 120));
    }
  }
  const from = output.get('from');
  const to = output.get('to');
  if (from && to && from > to) {
    output.set('from', to);
    output.set('to', from);
  }
  return output;
}

export function analyticsDomainFromTab(tab: string | null) {
  if (tab === 'commercial' || tab === 'customer-success' || tab === 'support' || tab === 'finance' || tab === 'product-development' || tab === 'product' || tab === 'development') {
    if (tab === 'support') return 'support';
    if (tab === 'product' || tab === 'development') return 'product-development';
    return tab.replace('customer-success', 'customer_success');
  }
  return 'ceo';
}

export function analyticsTabForDomain(domain: string) {
  return domain === 'customer_success' ? 'customer-success' : domain === 'cs' ? 'support' : domain as AnalyticsUrlTab;
}

export function analyticsHref(tab: AnalyticsUrlTab, extras: Record<string, string | undefined> = {}) {
  const current = normalizeAnalyticsSearch(typeof window === 'undefined' ? '' : window.location.search);
  current.set('tab', tab);
  for (const [key, value] of Object.entries(extras)) {
    if (value) current.set(key, value); else current.delete(key);
  }
  return `/admin/analytics?${current.toString()}`;
}

export function analyticsNavigationCases() {
  return {
    allowedTabs: [...allowedTabs],
    allowedKeys: [...allowedKeys],
    invalidTab: analyticsDomainFromTab('unknown') === 'ceo',
    reversedDates: normalizeAnalyticsSearch('?from=2026-07-31&to=2026-07-01').toString() === 'from=2026-07-01&to=2026-07-31',
  };
}
