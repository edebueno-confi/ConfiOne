import { useCallback, useEffect, useState } from 'react';
import { MinimalState } from '../../components/minimal-states';
import { getSupportQueueHealth, updatePipelineQueueRole, type QueueRole } from '../analytics/analytics-api';
import { queueRoleLabel, readQueueHealth } from '../analytics/analytics-queue-health.mjs';

/**
 * Editor do papel de cada pipeline.
 *
 * A decisão que esta tela registra muda o indicador mais visível do painel, e
 * por isso ela é tomada com a evidência à vista: quanto tem na fila, quanto está
 * parado, quanto entrou no último mês. Um seletor sem esses números levaria a
 * decidir pelo nome do pipeline, que é o que produziu a leitura errada de antes.
 *
 * A tela diz o efeito antes de ele acontecer. Ninguém deve descobrir que a fila
 * caiu pela metade abrindo o Dashboard no dia seguinte.
 */

const OPCOES: Array<{ value: QueueRole; label: string; hint: string }> = [
  { value: 'trabalhada', label: 'Fila de trabalho', hint: 'Conta em "Fila atual"' },
  { value: 'caixa_de_entrada', label: 'Caixa de entrada', hint: 'Sai da fila e conta no passivo' },
  { value: 'a_classificar', label: 'A classificar', hint: 'Fica de fora até alguém decidir' },
];

export function PipelineRoleSettings() {
  const [payload, setPayload] = useState<unknown>(null);
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading');
  const [salvando, setSalvando] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(() => {
    setPhase('loading');
    void getSupportQueueHealth()
      .then((data) => {
        setPayload(data);
        setPhase('ready');
      })
      .catch(() => setPhase('error'));
  }, []);

  useEffect(carregar, [carregar]);

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

  const saude = readQueueHealth(payload);

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h3 className="text-sm font-semibold text-[color:var(--minimal-text)]">Papel de cada pipeline</h3>
        <p className="text-xs leading-5 text-[color:var(--minimal-text-secondary)]">
          O portal do HubSpot é compartilhado por mais de uma operação do grupo, e o nome abaixo de cada pipeline diz a qual pertence. Pipelines marcados como fila de trabalho são os únicos contados em "Fila atual" no Dashboard. Os demais
          continuam visíveis, no passivo. Um pipeline novo entra como "a classificar" e fica fora da fila até alguém
          decidir — o padrão é não entrar sem ninguém saber.
        </p>
      </header>

      {erro ? <p className="text-xs text-[color:var(--minimal-danger-text)]">{erro}</p> : null}

      <div className="overflow-x-auto">
        <table className="gso-analytics-responsive-table w-full min-w-[620px] text-sm">
          <thead>
            <tr className="border-b border-[color:var(--minimal-border)] text-left text-[11px] font-semibold uppercase tracking-wide text-[color:var(--minimal-text-tertiary)]">
              <th className="py-2 pr-4">Pipeline</th>
              <th className="py-2 pr-4 text-right">Na fila</th>
              <th className="py-2 pr-4 text-right">Sem dono</th>
              <th className="py-2 pr-4 text-right">Entraram em 30 dias</th>
              <th className="py-2">Papel</th>
            </tr>
          </thead>
          <tbody>
            {saude.pipelines.map((pipeline) => {
              const naoDecidido = pipeline.role === 'a_classificar';
              return (
                <tr
                  key={pipeline.pipelineId}
                  className={`border-b border-[color:var(--minimal-border)] last:border-0 ${naoDecidido ? 'bg-[color:var(--minimal-surface-muted)]' : ''}`}
                >
                  <td data-label="Pipeline" className="py-2 pr-4 text-[color:var(--minimal-text)]">
                    {/* Nome oficial do HubSpot como rótulo, apelido abaixo. O
                        apelido sozinho já fez "CS | Neotrust" ser classificado
                        como se fosse o suporte da Confi. */}
                    {pipeline.label}
                    <span className="block text-[10px] text-[color:var(--minimal-text-tertiary)]">
                      {pipeline.groupCompany === 'a_definir' ? 'operação a definir' : pipeline.groupCompany}
                      {pipeline.groupCompanyConfirmed ? '' : ' (sugerida)'}
                      {pipeline.alias && pipeline.alias !== pipeline.label ? ` · apelido: ${pipeline.alias}` : ''}
                    </span>
                  </td>
                  <td data-label="Na fila" className="py-2 pr-4 text-right tabular-nums text-[color:var(--minimal-text)]">
                    {pipeline.inQueue.toLocaleString('pt-BR')}
                  </td>
                  <td data-label="Sem dono" className="py-2 pr-4 text-right tabular-nums text-[color:var(--minimal-text)]">
                    {pipeline.unowned.toLocaleString('pt-BR')}
                    {pipeline.waitingThirdParty > 0 ? (
                      <span className="block text-[10px] font-normal text-[color:var(--minimal-text-tertiary)]">
                        +{pipeline.waitingThirdParty.toLocaleString('pt-BR')} esperando terceiro
                      </span>
                    ) : null}
                  </td>
                  <td data-label="Entraram em 30 dias" className="py-2 pr-4 text-right tabular-nums text-[color:var(--minimal-text-secondary)]">
                    {pipeline.arrived30d.toLocaleString('pt-BR')}
                  </td>
                  <td data-label="Papel" className="py-2">
                    <select
                      value={pipeline.role}
                      disabled={salvando === pipeline.pipelineId}
                      onChange={(event) => void decidir(pipeline.pipelineId, event.target.value as QueueRole)}
                      aria-label={`Papel do pipeline ${pipeline.label}`}
                      className="h-9 w-full min-w-[180px] rounded-lg border border-[color:var(--minimal-border-strong)] bg-[color:var(--minimal-surface)] px-2 text-xs text-[color:var(--minimal-text)] disabled:opacity-60"
                    >
                      {OPCOES.map((opcao) => (
                        <option key={opcao.value} value={opcao.value}>
                          {opcao.label} — {opcao.hint}
                        </option>
                      ))}
                    </select>
                    {!naoDecidido ? (
                      <span className="mt-1 block text-[10px] text-[color:var(--minimal-text-tertiary)]">
                        {queueRoleLabel(pipeline.role)} · decisão registrada
                      </span>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] leading-4 text-[color:var(--minimal-text-tertiary)]">
        {saude.classified === saude.total
          ? 'Todos os pipelines têm papel definido. "Fila atual" já reflete apenas as filas de trabalho.'
          : `${saude.total - saude.classified} de ${saude.total} pipelines ainda sem papel definido. Enquanto houver algum, "Fila atual" conta todos e o Dashboard declara a leitura como parcial.`}
      </p>
    </section>
  );
}
