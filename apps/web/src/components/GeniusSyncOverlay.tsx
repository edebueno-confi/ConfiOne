import { GeniusMascot } from './GeniusMascot';

export function GeniusSyncOverlay({
  source,
  detail = 'Os dados serão atualizados assim que a operação terminar.',
}: {
  source: 'HubSpot' | 'OMIE';
  detail?: string;
}) {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="fixed inset-0 z-[80] flex items-center justify-center bg-[color:var(--minimal-surface)]/90 px-6 py-10 backdrop-blur-sm"
      role="status"
    >
      <div className="flex w-full max-w-md flex-col items-center text-center">
        <div className="relative flex h-72 w-72 items-center justify-center sm:h-80 sm:w-80">
          <span
            aria-hidden="true"
            className="absolute inset-5 rounded-full bg-[color:var(--minimal-action)]/15 blur-3xl"
          />
          <GeniusMascot
            alt={`Gênio sincronizando dados do ${source}`}
            animated
            interactive
            size="xl"
            surface="loading"
          />
        </div>
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--minimal-action)]">
          Sincronização em andamento
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[color:var(--minimal-text)]">
          Atualizando dados do {source}
        </h2>
        <p className="mt-3 max-w-sm text-sm leading-6 text-[color:var(--minimal-text-secondary)]">
          A operação pode levar alguns minutos. Não feche esta tela enquanto o Gênio trabalha.
        </p>
        <div className="mt-5 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-[color:var(--minimal-surface-muted)]">
          <span className="block h-full w-2/5 animate-pulse rounded-full bg-[color:var(--minimal-action)]" />
        </div>
        <p className="mt-3 text-xs text-[color:var(--minimal-text-tertiary)]">{detail}</p>
      </div>
    </div>
  );
}
