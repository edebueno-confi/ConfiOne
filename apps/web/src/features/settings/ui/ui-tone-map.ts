import type { UiTone } from './ui-types';

/**
 * Traduz o tom publicado pelas leituras de Configuracoes ('success' | 'warning'
 * | 'danger' | 'muted') para o tom do sistema visual. Nenhum estado novo e
 * criado aqui: 'muted' vira o tom neutro.
 */
export function uiToneOf(tone: 'success' | 'warning' | 'danger' | 'muted'): UiTone {
  if (tone === 'success') return 'success';
  if (tone === 'warning') return 'warning';
  if (tone === 'danger') return 'danger';
  return 'neutral';
}

/** Cor do valor de um indicador, quando o tom precisa aparecer no numero. */
export function uiValueToneOf(
  tone: 'success' | 'warning' | 'danger' | 'muted',
): 'success' | 'warning' | 'danger' | undefined {
  if (tone === 'success') return 'success';
  if (tone === 'warning') return 'warning';
  if (tone === 'danger') return 'danger';
  return undefined;
}
