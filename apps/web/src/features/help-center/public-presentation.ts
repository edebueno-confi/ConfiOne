/**
 * Helpers de apresentacao da Central Publica.
 *
 * Ficam fora de `public-ui.tsx` para que aquele modulo exporte somente
 * componentes, mantendo o Fast Refresh confiavel em desenvolvimento. Nenhum
 * comportamento de produto muda: as funcoes aqui sao puras e foram movidas sem
 * alteracao de logica.
 */

const DIACRITICS = new RegExp('[\\u0300-\\u036f]', 'g');

export function getCategoryVisuals(name: string | null | undefined) {
  const normalized = (name ?? '')
    .normalize('NFD')
    .replace(DIACRITICS, '')
    .toLowerCase();

  if (normalized.includes('integr')) {
    return { icon: 'puzzle' as const, tone: 'blue' as const };
  }

  if (normalized.includes('config') || normalized.includes('primeiro')) {
    return { icon: 'gear' as const, tone: 'pink' as const };
  }

  if (normalized.includes('oper') || normalized.includes('reversa') || normalized.includes('troca')) {
    return { icon: 'truck' as const, tone: 'blue' as const };
  }

  if (normalized.includes('relat') || normalized.includes('solu') || normalized.includes('problem')) {
    return { icon: 'chart' as const, tone: 'pink' as const };
  }

  if (normalized.includes('boa') || normalized.includes('seller') || normalized.includes('loja')) {
    return { icon: 'cap' as const, tone: 'blue' as const };
  }

  if (normalized.includes('suporte')) {
    return { icon: 'support' as const, tone: 'blue' as const };
  }

  return { icon: 'doc' as const, tone: 'neutral' as const };
}

export function getCategoryDescription(name: string | null | undefined) {
  const normalized = (name ?? '')
    .normalize('NFD')
    .replace(DIACRITICS, '')
    .toLowerCase();

  if (normalized.includes('integr')) return 'Conecte seus canais e mantenha a operação em ordem.';
  if (normalized.includes('config') || normalized.includes('cadastro')) return 'Encontre orientações para preparar e ajustar a operação.';
  if (normalized.includes('oper') || normalized.includes('reversa') || normalized.includes('troca')) return 'Acompanhe as etapas dos fluxos de troca e devolução.';
  if (normalized.includes('relat') || normalized.includes('solu') || normalized.includes('problem') || normalized.includes('pend')) return 'Resolva ocorrências com orientações claras e práticas.';
  if (normalized.includes('seller') || normalized.includes('loja')) return 'Organize lojas, sellers e os canais da sua operação.';
  if (normalized.includes('suporte')) return 'Encontre os caminhos oficiais para pedir ajuda.';
  return 'Explore as orientações disponíveis para esta frente.';
}

export function formatRelativePublicDate(value: string | null | undefined) {
  if (!value) {
    return 'Atualizado recentemente';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Atualizado recentemente';
  }

  const now = Date.now();
  const diffMs = date.getTime() - now;
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  const absDays = Math.abs(diffDays);
  const formatter = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });

  if (absDays < 7) {
    return `Atualizado ${formatter.format(diffDays, 'day')}`;
  }

  if (absDays < 30) {
    return `Atualizado ${formatter.format(Math.round(diffDays / 7), 'week')}`;
  }

  if (absDays < 365) {
    return `Atualizado ${formatter.format(Math.round(diffDays / 30), 'month')}`;
  }

  return `Atualizado ${formatter.format(Math.round(diffDays / 365), 'year')}`;
}

export function getPublicCategoryLabel(value: string | null | undefined) {
  const label = value?.trim();
  if (!label) return 'Categoria pública';

  const normalized = label
    .normalize('NFD')
    .replace(DIACRITICS, '')
    .toLocaleLowerCase('pt-BR');

  if (normalized === 'operacao de trocas e devolucoes') return 'Trocas e devoluções';
  return label;
}

export function isPublicNavigationCategory(value: string | null | undefined) {
  const normalized = value
    ?.trim()
    .normalize('NFD')
    .replace(DIACRITICS, '')
    .toLocaleLowerCase('pt-BR');

  return normalized !== 'primeiros passos';
}
