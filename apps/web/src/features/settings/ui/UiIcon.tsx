import type { UiIconName } from './ui-types';

/**
 * Glifos lineares do sistema visual de Configuracoes.
 *
 * O projeto nao usa biblioteca de icones. Este modulo segue o mesmo padrao do
 * conjunto existente em settings-nav-icons.tsx: 16 ou 18px, traco 1.6,
 * currentColor, sem preenchimento.
 */
const PATHS: Record<UiIconName, readonly string[]> = {
  activity: ['M3 12h4l3 7 4-14 3 7h4'],
  alert: ['M12 4.5 21 19.5H3z', 'M12 10v4', 'M12 17h.01'],
  archive: ['M3 7h18v4H3z', 'M5 11v9h14v-9', 'M10 15h4'],
  brand: ['M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V4h9l8.6 8.6a2 2 0 0 1 0 .8z', 'M7.5 7.5h.01'],
  calendar: ['M4 6h16v14H4z', 'M4 10h16', 'M9 3v4', 'M15 3v4'],
  check: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'm8.5 12.3 2.4 2.4 4.6-5'],
  'chevron-down': ['m6 10 6 6 6-6'],
  'chevron-left': ['m14 6-6 6 6 6'],
  'chevron-right': ['m10 6 6 6-6 6'],
  clock: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M12 8v4.5l3 1.8'],
  database: ['M12 3c4.4 0 8 1.3 8 3s-3.6 3-8 3-8-1.3-8-3 3.6-3 8-3z', 'M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6', 'M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6'],
  external: ['M14 4h6v6', 'M20 4 11 13', 'M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5'],
  filter: ['M4 6h16', 'M7 12h10', 'M10 18h4'],
  globe: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M3.5 9.5h17', 'M3.5 14.5h17', 'M12 3c2.4 2.6 3.6 5.6 3.6 9S14.4 18.4 12 21c-2.4-2.6-3.6-5.6-3.6-9S9.6 5.6 12 3z'],
  help: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M9.6 9a2.5 2.5 0 1 1 3.4 2.3c-.7.3-1 .9-1 1.7', 'M12 17h.01'],
  inbox: ['M4 6h16v12H4z', 'M4 13h4l1.6 2.4h4.8L16 13h4'],
  key: ['M18 7.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0z', 'M12.6 9.9 4 18.5V21h3v-2h2v-2h2l1.6-1.6'],
  layers: ['m12 3 8 4.5-8 4.5-8-4.5z', 'm4 12 8 4.5 8-4.5', 'm4 16.5 8 4.5 8-4.5'],
  link: ['M10.5 13.5a3.5 3.5 0 0 0 5 0l3-3a3.5 3.5 0 0 0-5-5l-1 1', 'M13.5 10.5a3.5 3.5 0 0 0-5 0l-3 3a3.5 3.5 0 0 0 5 5l1-1'],
  list: ['M4 6h16', 'M4 12h16', 'M4 18h10'],
  mail: ['M4 6h16v12H4z', 'm4 7.5 8 5.5 8-5.5'],
  more: ['M12 6.5h.01', 'M12 12h.01', 'M12 17.5h.01'],
  phone: ['M6.5 3.5h3l1.5 4-2 1.5a10 10 0 0 0 5 5L15.5 12l4 1.5v3a2 2 0 0 1-2.2 2A15 15 0 0 1 4.5 5.7a2 2 0 0 1 2-2.2z'],
  plug: ['M9 3v4', 'M15 3v4', 'M7 7h10v5a5 5 0 0 1-10 0V7z', 'M12 17v4'],
  plus: ['M12 5v14', 'M5 12h14'],
  refresh: ['M20 12a8 8 0 1 1-2.6-5.9', 'M20 4v4.5h-4.5'],
  search: ['M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z', 'm16.2 16.2 3.8 3.8'],
  shield: ['M12 3.5 19 6v5.5c0 4.2-2.8 7.9-7 9.1-4.2-1.2-7-4.9-7-9.1V6z', 'm9 12 2 2 4-4'],
  sort: ['m8 9 3-3 3 3', 'm8 15 3 3 3-3'],
  'sort-asc': ['m7 10 5-5 5 5', 'M12 5v14'],
  'sort-desc': ['m7 14 5 5 5-5', 'M12 19V5'],
  sparkles: ['M12 4l1.6 4.4L18 10l-4.4 1.6L12 16l-1.6-4.4L6 10l4.4-1.6z', 'M18 16.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z'],
  tag: ['M11 4h8v8l-8 8-8-8z', 'M15.5 7.5h.01'],
  users: ['M15 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1', 'M9 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7', 'M21 19v-1a4 4 0 0 0-3-3.8', 'M16 3.3a3.5 3.5 0 0 1 0 6.8'],
  x: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'm9.2 9.2 5.6 5.6', 'm14.8 9.2-5.6 5.6'],
};

/** Glifo linear de 16 ou 18px, sempre decorativo. */
export function UiIcon({ name, size = 16 }: { name: UiIconName; size?: 16 | 18 }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      focusable="false"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.6}
      viewBox="0 0 24 24"
      width={size}
    >
      {PATHS[name].map((path) => <path d={path} key={path} />)}
    </svg>
  );
}
