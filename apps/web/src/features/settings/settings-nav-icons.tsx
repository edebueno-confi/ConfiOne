/**
 * Icones lineares da navegacao local de Configuracoes.
 *
 * O projeto nao usa biblioteca de icones: as superficies existentes desenham
 * SVG inline. Este modulo mantem o mesmo padrao (16px, traco 1.6, currentColor)
 * para a navegacao ficar consistente com a sidebar global.
 */
const BASE = {
  'aria-hidden': true as const,
  fill: 'none' as const,
  focusable: 'false' as const,
  height: 16,
  stroke: 'currentColor',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  strokeWidth: 1.6,
  viewBox: '0 0 24 24',
  width: 16,
};

const PATHS: Record<string, readonly string[]> = {
  // Usuários e acesso
  access: ['M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1', 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8', 'M22 19v-1a4 4 0 0 0-3-3.87', 'M16 3.13A4 4 0 0 1 16 11'],
  // Geral
  geral: ['M4 6h16', 'M4 12h16', 'M4 18h16', 'M9 4v4', 'M15 10v4', 'M9 16v4'],
  // Integrações
  integracoes: ['M9 3v4', 'M15 3v4', 'M7 7h10v5a5 5 0 0 1-10 0V7z', 'M12 17v4'],
  // Fontes do Dashboard
  'dashboard-fontes': ['M12 3c4.4 0 8 1.3 8 3s-3.6 3-8 3-8-1.3-8-3 3.6-3 8-3z', 'M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6', 'M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6'],
  // Histórico de sincronizações
  'dashboard-historico': ['M12 21a9 9 0 1 0-9-9', 'M3 3v5h5', 'M12 8v4l3 2'],
  // Marcas
  marcas: ['M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V4h9l8.6 8.6a2 2 0 0 1 0 .8z', 'M7.5 7.5h.01'],
  // Central de ajuda
  'central-ajuda': ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M9.6 9a2.5 2.5 0 1 1 3.4 2.3c-.7.3-1 .9-1 1.7', 'M12 17h.01'],
};

/** Icone da seção, ou nada quando a seção não tem ícone definido. */
export function SettingsNavIcon({ section }: { section: string }) {
  const paths = PATHS[section];
  if (!paths) return null;
  return (
    <svg {...BASE} className="gso-settings-nav-icon">
      {paths.map((path) => <path d={path} key={path} />)}
    </svg>
  );
}
