import { ChartCard } from './analytics-ui';
import { MinimalState } from '../../components/minimal-states';
import { queueRoleLabel, readQueueHealth, suggestsInbox } from './analytics-queue-health.mjs';

/**
 * Saúde da fila.
 *
 * A decisão de desenho que sustenta este bloco: **o passivo não é um segundo
 * cartão de fila**. Um cartão grande com 2.207 ao lado de um cartão grande com
 * 2.851 faria o leitor somar mentalmente e voltar ao número enganoso.
 *
 * Em vez disso, uma barra única de proporção mostra a fila inteira dividida
 * entre o que anda e o que está parado. É a mesma quantidade vista de outro
 * ângulo, não uma quantidade a mais.
 *
 * A barra é cinza, não vermelha. Vermelho seria julgamento; a proporção é fato,
 * e a decisão sobre o que fazer com ela pertence a quem lê.
 */
export function AnalyticsQueueHealth({ payload }: { payload: unknown }) {
  const saude = readQueueHealth(payload);

  if (!saude.available) {
    return (
      <ChartCard title="Saúde da fila" description="Quanto da fila está em movimento e quanto está parado.">
        <MinimalState
          title="Leitura indisponível"
          description={
            saude.coverageWarning
            ?? 'Nenhum atendimento em aberto nos pipelines ativos neste momento.'
          }
        />
      </ChartCard>
    );
  }

  const pctParado = saude.stagnantRate ?? 0;

  return (
    <ChartCard
      title="Saúde da fila"
      description={`Um atendimento é considerado parado quando fica ${saude.threshold ?? 180} dias sem nenhuma atividade registrada.`}
    >
      <div className="mb-4">
        <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <span className="text-sm text-[color:var(--minimal-text)]">
            <strong className="text-base font-semibold tabular-nums">{saude.moving.toLocaleString('pt-BR')}</strong>
            {' '}em movimento
          </span>
          <span className="text-sm text-[color:var(--minimal-text-secondary)]">
            <strong className="text-base font-semibold tabular-nums">{saude.stagnant.toLocaleString('pt-BR')}</strong>
            {' '}parados · {pctParado.toLocaleString('pt-BR')}%
          </span>
        </div>
        {/* Uma barra, não duas. A fila é a mesma; muda o que se enxerga dela. */}
        <div
          className="flex h-2 w-full overflow-hidden rounded-full bg-[color:var(--minimal-surface-muted)]"
          role="img"
          aria-label={`De ${saude.inQueue.toLocaleString('pt-BR')} atendimentos na fila, ${saude.stagnant.toLocaleString('pt-BR')} estão parados há mais de ${saude.threshold ?? 180} dias.`}
        >
          <div className="h-full bg-[color:var(--minimal-action)]" style={{ width: `${100 - pctParado}%` }} />
          <div className="h-full bg-[color:var(--minimal-text-tertiary)]" style={{ width: `${pctParado}%` }} />
        </div>
      </div>

      {saude.coverageWarning ? (
        <p className="mb-3 text-xs leading-5 text-[color:var(--minimal-warning-text)]">{saude.coverageWarning}</p>
      ) : null}

      {saude.notice ? (
        <p className="mb-4 border-l-2 border-[color:var(--minimal-border-strong)] pl-3 text-xs leading-5 text-[color:var(--minimal-text-secondary)]">
          {saude.notice}
        </p>
      ) : null}

      <div className="overflow-x-auto">
        <table className="gso-analytics-responsive-table w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-[color:var(--minimal-border)] text-left text-[11px] font-semibold uppercase tracking-wide text-[color:var(--minimal-text-tertiary)]">
              <th className="py-2 pr-4">Pipeline</th>
              <th className="py-2 pr-4">Papel</th>
              <th className="py-2 pr-4 text-right">Na fila</th>
              <th className="py-2 pr-4 text-right">Parados</th>
              <th className="py-2 pr-4 text-right">Entraram em 30 dias</th>
              <th className="py-2 text-right">Espera mediana</th>
            </tr>
          </thead>
          <tbody>
            {saude.pipelines.map((pipeline) => {
              const sugere = suggestsInbox(pipeline);
              return (
                <tr key={pipeline.pipelineId} className="border-b border-[color:var(--minimal-border)] last:border-0">
                  <td data-label="Pipeline" className="py-2 pr-4 text-[color:var(--minimal-text)]">
                    {pipeline.label}
                    {sugere ? (
                      <span className="ml-2 whitespace-nowrap text-[10px] text-[color:var(--minimal-text-tertiary)]">
                        quase nada entrando
                      </span>
                    ) : null}
                  </td>
                  <td data-label="Papel" className="py-2 pr-4 text-[color:var(--minimal-text-secondary)]">
                    {queueRoleLabel(pipeline.role)}
                  </td>
                  <td data-label="Na fila" className="py-2 pr-4 text-right tabular-nums text-[color:var(--minimal-text)]">
                    {pipeline.inQueue.toLocaleString('pt-BR')}
                  </td>
                  <td data-label="Parados" className="py-2 pr-4 text-right tabular-nums text-[color:var(--minimal-text-secondary)]">
                    {pipeline.stagnantRate === null ? (
                      <span className="text-[color:var(--minimal-text-tertiary)]">Indisponível</span>
                    ) : (
                      <>
                        {pipeline.stagnant.toLocaleString('pt-BR')}
                        <span className="ml-1 text-[color:var(--minimal-text-tertiary)]">
                          ({pipeline.stagnantRate.toLocaleString('pt-BR')}%)
                        </span>
                      </>
                    )}
                  </td>
                  <td data-label="Entraram em 30 dias" className="py-2 pr-4 text-right tabular-nums text-[color:var(--minimal-text-secondary)]">
                    {pipeline.arrived30d.toLocaleString('pt-BR')}
                  </td>
                  <td data-label="Espera mediana" className="py-2 text-right tabular-nums text-[color:var(--minimal-text-secondary)]">
                    {pipeline.medianAgeDays === null ? 'Indisponível' : `${pipeline.medianAgeDays.toLocaleString('pt-BR')} dias`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-3 border-t border-[color:var(--minimal-border)] pt-2 text-[11px] leading-4 text-[color:var(--minimal-text-tertiary)]">
        A observação sobre entrada é leitura da evidência, não classificação: um pipeline com muita coisa parada e quase
        nada entrando costuma ser uma caixa de entrada sem dono. Um pipeline com entrada saudável e acúmulo é outro
        problema, de capacidade. A decisão sobre o papel de cada um é de quem opera.
      </p>
    </ChartCard>
  );
}
