/**
 * Tipos compartilhados do sistema visual de Configuracoes.
 *
 * Modulo sem componente: mantem os unions de tom e de icone fora dos arquivos
 * de componente, que exportam apenas o proprio componente.
 */

/** Tom tonal das primitivas (ladrilho, selo, valor de indicador). */
export type UiTone = 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'neutral';

/** Glifos lineares disponiveis em UiIcon. */
export type UiIconName =
  | 'activity'
  | 'alert'
  | 'archive'
  | 'brand'
  | 'calendar'
  | 'check'
  | 'chevron-left'
  | 'chevron-right'
  | 'clock'
  | 'database'
  | 'external'
  | 'filter'
  | 'globe'
  | 'help'
  | 'inbox'
  | 'key'
  | 'layers'
  | 'link'
  | 'list'
  | 'mail'
  | 'phone'
  | 'plug'
  | 'plus'
  | 'refresh'
  | 'search'
  | 'shield'
  | 'sparkles'
  | 'tag'
  | 'users'
  | 'x';
