import { useCallback, useEffect, useMemo, useState } from 'react';
import { MinimalState } from '../../components/minimal-states';
import { getSupportQueueHealth, updatePipelineQueueRole, type QueueRole } from '../analytics/analytics-api';
import { readQueueHealth } from '../analytics/analytics-queue-health.mjs';
import { UiCard } from './ui/UiCard';

/**
 * Fontes do Dashboard: quais pipelines contam, e como.
 *
 * A versão anterior era uma tabela única com todos os pipelines em sequência.
 * Duas coisas quebravam nela. Rolar uma lista longa faz esquecer o que já foi
 * marcado, e sem agrupamento não havia como saber que "CS | Neotrust" e
 * "Suporte B2B | Confi" pertencem a operações diferentes — que foi exatamente o
 * erro que essa tela deveria ter impedido.
 *
 * A reorganização segue a estrutura real do problema, não a do banco:
 *
 * **Uma seção por operação do grupo.** É a divisão que existe na empresa. Cada
 * seção mostra o próprio progresso, então dá para fechar uma operação e passar
 * para a seguinte sem perder o fio.
 *
 * **O que falta decidir vem primeiro.** Pipeline sem papel definido é o trabalho
 * pendente; o resto é consulta. Uma seção fechada não some, mas também não
 * ocupa espaço.
 *
 * **Três botões em vez de um menu.** A escolha é entre três opções conhecidas.
 * Um seletor esconde as alternativas atrás de um clique e não deixa comparar.
 */

const PAPEIS: Array<{ value: QueueRole; label: string; efeito: string }> = [
  { value: 'trabalhada', label: 'Fila de trabalho', efeito: 'Conta em "Fila atual"' },
  { value: 'caixa_de_entrada', label: 'Caixa de entrada', efeito: 'Sai da fila, vai para o passivo' },
  { value: 'a_classificar', label: 'Não decidir agora', efeito: 'Fica de fora até alguém decidir' },
];

interface Pipeline {
  pipelineId: string;
  label: string;
  alias: string | null;
  groupCompany: string;
  role: QueueRole;
  inQueue: number;
  unowned: number;
  waitingThirdParty: number;
  arrived30d: number;
}

export function PipelineRoleSettings() {
  const [payload, setPayload] = useState<unknown>(null);
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading');
  const [salvando, setSalvando] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [recolhidas, setRecolhidas] = useState<Set<string>>(new Set());

  const carregar = useCallback(() => {
    void getSupportQueueHealth()
      .then((data) => {
        setPayload(data);
        setPhase('ready');
      })
      .catch(() => setPhase('error'));
  }, []);

  useEffect(carregar, [carregar]);

  const saude = readQueueHealth(payload);

  /** Agrupado por operação, com o que falta decidir no topo de cada uma. */
  const secoes = useMemo(() => {
    const mapa = new Map<string, Pipeline[]>();
    for (const pipeline of saude.pipelines as Pipeline[]) {
      const chave = pipeline.groupCompany === 'a_definir' ? 'Operação a definir' : pipeline.groupCompany;
      const lista = mapa.get(chave) ?? [];
      lista.push(pipeline);
      mapa.set(chave, lista);
    }
    return [...mapa.entries()]
      .map(([operacao, pipelines]) => {
        const pendentes = pipelines.filter((p) => p.role === 'a_classificar').length;
        return {
          operacao,
          pipelines: [...pipelines].sort((a, b) => {
            // Pendente primeiro; entre pendentes, o de maior volume, que é o que
            // mais muda o indicador.
            const aPend = a.role === 'a_classificar' ? 0 : 1;
            const bPend = b.role === 'a_classificar' ? 0 : 1;
            return aPend - bPend || b.inQueue - a.inQueue;
          }),
          pendentes,
          naFila: pipelines.reduce((soma, p) => soma + p.inQueue, 0),
        };
      })
      .sort((a, b) => b.pendentes - a.pendentes || b.naFila - a.naFila);
  }, [saude.pipelines]);

  async function decidir(pipelineId: string, role: QueueRole) {
    setSalvando(pipelineId);
    setErro(null);
    try {
      await updatePipelineQueueRole(pipelineId, role);
      carregar();
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível registrar a decisão.');
    } finally {
      setSalvando(null);
    }
  }

  function alternar(operacao: string) {
    setRecolhidas((atual) => {
      const proximo = new Set(atual);
      if (proximo.has(operacao)) proximo.delete(operacao);
      else proximo.add(operacao);
      return proximo;
    });
  }

  if (phase === 'loading') {
    return <p className="text-sm text-[color:var(--minimal-text-tertiary)]">Carregando os pipelines...</p>;
  }

  if (phase === 'error') {
    return (
      <MinimalState
        tone="critical"
        title="Não foi possível carregar"
        description="Os pipelines de atendimento estão indisponíveis no momento."
      />
    );
  }

  const faltam = saude.total - saude.classified;

  return (
    <UiCard labelledBy="pipeline-role-settings-title">
      <div className="gso-ui-card-body">
      <section className="space-y-4">
      <header className="space-y-2">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h3 id="pipeline-role-settings-title" className="text-sm font-semibold text-[color:var(--minimal-text)]">Quais pipelines contam na fila</h3>
          <p className="text-xs tabular-nums text-[color:var(--minimal-text-secondary)]">
            {faltam === 0
              ? 'Todos decididos'
              : `${faltam} de ${saude.total} ainda sem decisão`}
          </p>
        </div>
        <p className="text-xs leading-5 text-[color:var(--minimal-text-secondary)]">
          O HubSpot é compartilhado por mais de uma operação do grupo, e cada seção abaixo é uma delas. Só os pipelines
          marcados como fila de trabalho entram em "Fila atual" no Dashboard; os demais continuam contados, no passivo.
        </p>
      </header>

      {erro ? <p className="text-xs text-[color:var(--minimal-danger-text)]">{erro}</p> : null}

      <div className="space-y-3">
        {secoes.map((secao) => {
          const fechada = recolhidas.has(secao.operacao);
          return (
            <section
              key={secao.operacao}
              className="rounded-xl border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)]"
            >
              <button
                type="button"
                onClick={() => alternar(secao.operacao)}
                aria-expanded={!fechada}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
              >
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-[color:var(--minimal-text)]">{secao.operacao}</span>
                  <span className="block text-[11px] text-[color:var(--minimal-text-tertiary)]">
                    {secao.pipelines.length} {secao.pipelines.length === 1 ? 'pipeline' : 'pipelines'} ·{' '}
                    {secao.naFila.toLocaleString('pt-BR')} na fila
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-3">
                  {secao.pendentes > 0 ? (
                    <span className="rounded-full bg-[color:var(--minimal-surface-muted)] px-2 py-0.5 text-[11px] font-medium text-[color:var(--minimal-text)]">
                      {secao.pendentes} a decidir
                    </span>
                  ) : (
                    <span className="text-[11px] text-[color:var(--minimal-text-tertiary)]">tudo decidido</span>
                  )}
                  <span aria-hidden className="text-[color:var(--minimal-text-tertiary)]">{fechada ? '+' : '−'}</span>
                </span>
              </button>

              {!fechada ? (
                <ul className="border-t border-[color:var(--minimal-border)]">
                  {secao.pipelines.map((pipeline) => {
                    const pendente = pipeline.role === 'a_classificar';
                    return (
                      <li
                        key={pipeline.pipelineId}
                        className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3 border-b border-[color:var(--minimal-border)] px-4 py-3 last:border-0"
                      >
                        <div className="min-w-[13rem] flex-1">
                          <p className="text-sm text-[color:var(--minimal-text)]">
                            {pipeline.label}
                            {pendente ? (
                              <span className="ml-2 align-middle text-[10px] font-medium uppercase tracking-wide text-[color:var(--minimal-warning-text)]">
                                a decidir
                              </span>
                            ) : null}
                          </p>
                          <p className="mt-0.5 text-[11px] tabular-nums text-[color:var(--minimal-text-tertiary)]">
                            {pipeline.inQueue.toLocaleString('pt-BR')} na fila ·{' '}
                            {pipeline.unowned.toLocaleString('pt-BR')} sem dono ·{' '}
                            {pipeline.arrived30d.toLocaleString('pt-BR')} entraram no mês
                            {pipeline.alias && pipeline.alias !== pipeline.label
                              ? ` · apelido: ${pipeline.alias}`
                              : ''}
                          </p>
                        </div>

                        {/* Três botões, e não um menu: a escolha é entre opções
                            conhecidas, e comparar exige vê-las juntas. */}
                        <div
                          role="group"
                          aria-label={`Papel de ${pipeline.label}`}
                          className="flex flex-wrap gap-1"
                        >
                          {PAPEIS.map((papel) => {
                            const ativo = pipeline.role === papel.value;
                            return (
                              <button
                                key={papel.value}
                                type="button"
                                onClick={() => void decidir(pipeline.pipelineId, papel.value)}
                                disabled={salvando === pipeline.pipelineId}
                                aria-pressed={ativo}
                                title={papel.efeito}
                                className={`min-h-8 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition disabled:opacity-50 ${
                                  ativo
                                    ? 'border-[color:var(--minimal-text)] bg-[color:var(--minimal-text)] text-[color:var(--minimal-surface)]'
                                    : 'border-[color:var(--minimal-border-strong)] text-[color:var(--minimal-text-secondary)] hover:bg-[color:var(--minimal-surface-muted)]'
                                }`}
                              >
                                {papel.label}
                              </button>
                            );
                          })}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </section>
          );
        })}
      </div>

      <p className="text-[11px] leading-4 text-[color:var(--minimal-text-tertiary)]">
        {faltam === 0
          ? 'Todos os pipelines têm papel definido. "Fila atual" reflete apenas as filas de trabalho.'
          : 'Enquanto houver pipeline sem decisão, "Fila atual" conta todos eles e o Dashboard declara a leitura como parcial.'}{' '}
        A operação de cada pipeline é sugerida pelo nome usado no HubSpot; confirmar cabe a quem conhece a estrutura do
        grupo.
      </p>
      </section>
      </div>
    </UiCard>
  );
}
