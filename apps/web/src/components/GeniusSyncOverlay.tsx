import { useEffect, useState } from 'react';
import { GeniusMascot } from './GeniusMascot';
import { Link } from 'react-router-dom';

export type SyncSource = 'HubSpot' | 'OMIE' | 'painel';
export type SyncVisualState = 'preparing' | 'syncing_hubspot' | 'syncing_omie' | 'publishing' | 'failed' | 'timed_out' | 'abandoned';

const COPY: Record<SyncVisualState, { title: string; description: string }> = {
  preparing: {
    title: 'O Gênio está abrindo caminho para os dados',
    description: 'Ele está alinhando as fontes para preparar uma leitura confiável.',
  },
  syncing_hubspot: {
    title: 'O Gênio está puxando os fios do HubSpot',
    description: 'Clientes, negócios e atendimentos estão sendo organizados para o painel.',
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
  detail,
  historyHref,
  onContinueInBackground,
  backgroundAfterMs = 60_000,
}: {
  source: SyncSource;
  state?: SyncVisualState;
  hasValidSnapshot?: boolean;
  detail?: string;
  historyHref?: string;
  onContinueInBackground?: () => void;
  backgroundAfterMs?: number;
}) {
  const [background, setBackground] = useState(false);
  const [canContinueInBackground, setCanContinueInBackground] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const copy = COPY[state];
  const active = !['failed', 'timed_out', 'abandoned'].includes(state);
  const problem = !active;
  useEffect(() => {
    setBackground(false);
    setCanContinueInBackground(false);
    setDismissed(false);
    if (!active) return undefined;
    const timer = window.setTimeout(() => setCanContinueInBackground(true), Math.max(0, backgroundAfterMs));
    return () => window.clearTimeout(timer);
  }, [active, backgroundAfterMs, source, state]);
  if (dismissed) return null;
  const blocking = active && !background;
  const continueInBackground = () => {
    setBackground(true);
    onContinueInBackground?.();
  };
  const content = (
    <div className={`gso-genie-sync-content ${problem ? 'is-problem' : ''}`}>
      <div className="gso-genie-sync-mascot" aria-hidden="true">
        <span className="gso-genie-sync-halo" />
        <GeniusMascot alt="" animated={active} expression="happy" pose="magic" size={blocking ? 'xl' : 'lg'} surface="loading" />
      </div>
      <div className="gso-genie-sync-copy">
        {problem ? <span className="gso-genie-sync-state-icon" aria-hidden="true">!</span> : null}
        {problem ? <button type="button" className="gso-genie-sync-dismiss" aria-label="Fechar aviso de atualização" onClick={() => setDismissed(true)}>Fechar</button> : null}
        <p className="gso-genie-sync-kicker">{source === 'painel' ? 'Atualização do painel' : source}</p>
        <h2>{copy.title}</h2>
        <p>{copy.description}</p>
        {detail ? <small>{detail}</small> : null}
        {active && background ? <small className="gso-genie-sync-background-warning">A atualização continua em segundo plano. Não solicite outra sincronização até ela terminar; o sistema já bloqueia uma nova execução.</small> : null}
        {active && canContinueInBackground && !background ? <button type="button" className="gso-genie-sync-background-action" onClick={continueInBackground}>Fechar e continuar em segundo plano</button> : null}
        {historyHref ? <Link className="gso-genie-sync-history-link" to={historyHref}>Acompanhar no Histórico</Link> : null}
      </div>
    </div>
  );

  if (blocking) {
    return <div className="gso-genie-sync-overlay" aria-busy="true" aria-live="polite" role="status">{content}</div>;
  }

  return <div className={`gso-genie-sync-banner ${problem ? 'is-problem' : ''}`} aria-busy={active} aria-live="polite" role={problem ? 'alert' : 'status'} data-state={state}>{content}</div>;
}
