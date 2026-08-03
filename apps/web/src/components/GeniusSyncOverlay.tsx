import { GeniusMascot } from './GeniusMascot';

type SyncSource = 'HubSpot' | 'OMIE' | 'painel';
type SyncVisualState = 'preparing' | 'syncing_hubspot' | 'syncing_omie' | 'publishing';

const COPY: Record<SyncVisualState, { title: string; description: string }> = {
  preparing: {
    title: 'O Gênio está abrindo caminho para os dados',
    description: 'O Gênio está organizando os dados do painel e alinhando as fontes para uma leitura única e confiável.',
  },
  syncing_hubspot: {
    title: 'O Gênio está puxando os fios do HubSpot',
    description: 'Clientes, negócios e atendimentos estão sendo organizados para o Dashboard.',
  },
  syncing_omie: {
    title: 'O Gênio está fazendo a conta fechar no OMIE',
    description: 'As informações financeiras estão sendo processadas para publicação.',
  },
  publishing: {
    title: 'O Gênio está soltando a magia no painel',
    description: 'As fontes foram processadas e o painel está preparando a nova versão dos dados.',
  },
};

export function GeniusSyncOverlay({
  source,
  state = source === 'HubSpot' ? 'syncing_hubspot' : source === 'OMIE' ? 'syncing_omie' : 'preparing',
  hasValidSnapshot = false,
  detail,
}: {
  source: SyncSource;
  state?: SyncVisualState;
  hasValidSnapshot?: boolean;
  detail?: string;
}) {
  const copy = COPY[state];
  const blocking = !hasValidSnapshot;
  const content = (
    <div className="gso-genie-sync-content">
      <div className="gso-genie-sync-mascot" aria-hidden="true">
        <span className="gso-genie-sync-halo" />
        <GeniusMascot alt="" animated expression="happy" pose="magic" size={blocking ? 'xl' : 'lg'} surface="loading" />
      </div>
      <div className="gso-genie-sync-copy">
        <p className="gso-genie-sync-kicker">{source === 'painel' ? 'Atualização do painel' : source}</p>
        <h2>{copy.title}</h2>
        <p>{copy.description}</p>
        {detail ? <small>{detail}</small> : null}
      </div>
    </div>
  );

  if (blocking) {
    return <div className="gso-genie-sync-overlay" aria-busy="true" aria-live="polite" role="status">{content}</div>;
  }

  return <div className="gso-genie-sync-banner" aria-busy="true" aria-live="polite" role="status">{content}</div>;
}
