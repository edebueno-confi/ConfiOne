import { GeniusMascot } from './GeniusMascot';
import { Link } from 'react-router-dom';

export type SyncSource = 'HubSpot' | 'OMIE' | 'painel';
export type SyncVisualState = 'preparing' | 'syncing_hubspot' | 'syncing_omie' | 'publishing' | 'failed' | 'timed_out' | 'abandoned';

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
  failed: {
    title: 'O Gênio encontrou um desvio no caminho',
    description: 'A atualização foi encerrada. O painel mantém o último estado publicado disponível.',
  },
  timed_out: {
    title: 'O Gênio ainda está aguardando uma resposta',
    description: 'A atualização demorou mais que o esperado. Consulte o Histórico antes de tentar novamente.',
  },
  abandoned: {
    title: 'O Gênio interrompeu esta tentativa',
    description: 'A atualização foi encerrada sem substituir o estado publicado anterior.',
  },
};

export function GeniusSyncOverlay({
  source,
  state = source === 'HubSpot' ? 'syncing_hubspot' : source === 'OMIE' ? 'syncing_omie' : 'preparing',
  hasValidSnapshot = false,
  detail,
  historyHref,
}: {
  source: SyncSource;
  state?: SyncVisualState;
  hasValidSnapshot?: boolean;
  detail?: string;
  historyHref?: string;
}) {
  const copy = COPY[state];
  const active = !['failed', 'timed_out', 'abandoned'].includes(state);
  const blocking = active && !hasValidSnapshot;
  const content = (
    <div className="gso-genie-sync-content">
      <div className="gso-genie-sync-mascot" aria-hidden="true">
        <span className="gso-genie-sync-halo" />
        <GeniusMascot alt="" animated={active} expression="happy" pose="magic" size={blocking ? 'xl' : 'lg'} surface="loading" />
      </div>
      <div className="gso-genie-sync-copy">
        <p className="gso-genie-sync-kicker">{source === 'painel' ? 'Atualização do painel' : source}</p>
        <h2>{copy.title}</h2>
        <p>{copy.description}</p>
        {detail ? <small>{detail}</small> : null}
        {historyHref ? <Link className="gso-genie-sync-history-link" to={historyHref}>Acompanhar no Histórico</Link> : null}
      </div>
    </div>
  );

  if (blocking) {
    return <div className="gso-genie-sync-overlay" aria-busy="true" aria-live="polite" role="status">{content}</div>;
  }

  return <div className="gso-genie-sync-banner" aria-busy={active} aria-live="polite" role="status">{content}</div>;
}
