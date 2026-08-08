import { ChartCard } from './analytics-ui';
import { MinimalState } from '../../components/minimal-states';
import { queueRoleLabel, readQueueHealth } from './analytics-queue-health.mjs';

/**
 * Saúde da fila.
 *
 * Duas correções mudaram este bloco por completo, e as duas vieram de conferir o
 * dado contra a tela do HubSpot.
 *
 * **A operação do grupo é a dimensão principal.** O portal é compartilhado por
 * Confi, Neotrust e Aftersale. Um número único chamado "fila" somava as três e
 * não servia para nenhuma: escondia que a operação com problema era uma só.
 *
 * **"Parado" não é "abandonado".** Uma etapa como "Aguardando Cliente" significa
 * que a bola está com a outra parte. Somar isso ao que está sem dono inflou o
 * problema em quase o triplo.
 *
 * O nome oficial do pipeline é o rótulo, com o apelido interno ao lado. Foi o
 * apelido sozinho que fez "CS | Neotrust" ser lido como "Suporte".
 */
export function AnalyticsQueueHealth({ payload }: { payload: unknown }) {
  const saude = readQueueHealth(payload);

  if (!saude.available) {
    return (
      <ChartCard title="Saúde da fila" description="Quanto da fila está sem dono e quanto está esperando resposta de outra parte.">
        <MinimalState
          title="Leitura indisponível"
          description={saude.coverageWarning ?? 'Nenhum atendimento em aberto nos pipelines ativos neste momento.'}
        />
      </ChartCard>
    );
  }

  return (
    <ChartCard
      title="Saúde da fila por operação"
      description={`Um atendimento entra na contagem de parado quando fica ${saude.threshold ?? 180} dias sem atividade. Parado esperando o cliente ou outra área é fila legítima; parado sem dono é o problema de atendimento.`}
    >
      {saude.coverageWarning ? (
        <p className="mb-3 text-xs leading-5 text-[color:var(--minimal-warning-text)]">{saude.coverageWarning}</p>
      ) : null}

      {/* Operação primeiro, porque é a divisão que muda a conclusão. */}
      {saude.byGroupCompany.length > 0 ? (
        <div className="mb-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {saude.byGroupCompany.map((operacao) => (
            <div
              key={operacao.company}
              className="rounded-lg border border-[color:var(--minimal-border)] p-3"
            >
              <p className="text-xs font-semibold text-[color:var(--minimal-text)]">
                {operacao.company === 'a_definir' ? 'Operação a definir' : operacao.company}
              </p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-[color:var(--minimal-text)]">
                {operacao.inQueue.toLocaleString('pt-BR')}
                <span className="ml-1 text-xs font-normal text-[color:var(--minimal-text-tertiary)]">na fila</span>
              </p>
              <p className="mt-0.5 text-xs text-[color:var(--minimal-text-secondary)]">
                <strong className="tabular-nums">{operacao.unowned.toLocaleString('pt-BR')}</strong> sem dono ·{' '}
                <span className="tabular-nums">{operacao.waitingThirdParty.toLocaleString('pt-BR')}</span> esperando
              </p>
              {operacao.confirmedPipelines < operacao.pipelines ? (
                <p className="mt-1 text-[10px] text-[color:var(--minimal-text-tertiary)]">
                  Operação sugerida pelo nome do pipeline, ainda não confirmada.
                </p>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {saude.notice ? (
        <p className="mb-4 border-l-2 border-[color:var(--minimal-border-strong)] pl-3 text-xs leading-5 text-[color:var(--minimal-text-secondary)]">
          {saude.notice}
        </p>
      ) : null}

      {saude.ageBuckets.length > 0 ? (
        <div className="mb-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[color:var(--minimal-text-tertiary)]">
            Há quanto tempo sem atividade
          </p>
          <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-4">
            {saude.ageBuckets.map((faixa) => (
              <div
                key={faixa.bucket}
                className="flex items-baseline justify-between gap-2 rounded-md bg-[color:var(--minimal-surface-muted)] px-2.5 py-2"
              >
                <span className="text-[11px] text-[color:var(--minimal-text-secondary)]">{faixa.bucket}</span>
                <span className="text-sm font-semibold tabular-nums text-[color:var(--minimal-text)]">
                  {faixa.tickets.toLocaleString('pt-BR')}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="gso-analytics-responsive-table w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-[color:var(--minimal-border)] text-left text-[11px] font-semibold uppercase tracking-wide text-[color:var(--minimal-text-tertiary)]">
              <th className="py-2 pr-4">Pipeline</th>
              <th className="py-2 pr-4">Papel</th>
              <th className="py-2 pr-4 text-right">Na fila</th>
              <th className="py-2 pr-4 text-right">Sem dono</th>
              <th className="py-2 pr-4 text-right">Esperando</th>
              <th className="py-2 text-right">Entraram em 30 dias</th>
            </tr>
          </thead>
          <tbody>
            {saude.pipelines.map((pipeline) => (
              <tr key={pipeline.pipelineId} className="border-b border-[color:var(--minimal-border)] last:border-0">
                <td data-label="Pipeline" className="py-2 pr-4 text-[color:var(--minimal-text)]">
                  {pipeline.label}
                  <span className="block text-[10px] text-[color:var(--minimal-text-tertiary)]">
                    {pipeline.groupCompany === 'a_definir' ? 'operação a definir' : pipeline.groupCompany}
                    {pipeline.alias && pipeline.alias !== pipeline.label ? ` · apelido: ${pipeline.alias}` : ''}
                  </span>
                </td>
                <td data-label="Papel" className="py-2 pr-4 text-[color:var(--minimal-text-secondary)]">
                  {queueRoleLabel(pipeline.role)}
                </td>
                <td data-label="Na fila" className="py-2 pr-4 text-right tabular-nums text-[color:var(--minimal-text)]">
                  {pipeline.inQueue.toLocaleString('pt-BR')}
                </td>
                <td data-label="Sem dono" className="py-2 pr-4 text-right tabular-nums font-medium text-[color:var(--minimal-text)]">
                  {pipeline.unowned.toLocaleString('pt-BR')}
                </td>
                <td data-label="Esperando" className="py-2 pr-4 text-right tabular-nums text-[color:var(--minimal-text-secondary)]">
                  {pipeline.waitingThirdParty.toLocaleString('pt-BR')}
                  {pipeline.waitingUndecided > 0 ? (
                    <span className="ml-1 text-[10px] text-[color:var(--minimal-text-tertiary)]">
                      +{pipeline.waitingUndecided} sem decisão
                    </span>
                  ) : null}
                </td>
                <td data-label="Entraram em 30 dias" className="py-2 text-right tabular-nums text-[color:var(--minimal-text-secondary)]">
                  {pipeline.arrived30d.toLocaleString('pt-BR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 border-t border-[color:var(--minimal-border)] pt-2 text-[11px] leading-4 text-[color:var(--minimal-text-tertiary)]">
        O nome do pipeline é o oficial do HubSpot; o apelido interno aparece abaixo quando existe. A operação do grupo é
        sugerida pela convenção de nome e vale como decisão apenas depois de confirmada em Configurações. Etapa sem
        decisão de espera aparece à parte, e não é somada a nenhum dos dois grupos.
      </p>
    </ChartCard>
  );
}
