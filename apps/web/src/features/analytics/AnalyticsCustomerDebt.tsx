import { useState } from 'react';
import { ChartCard } from './analytics-ui';
import { MinimalState } from '../../components/minimal-states';
import {
  PRIORITY_LABELS,
  humanizeSilence,
  readCustomerDebt,
  toDebtCsv,
} from './analytics-customer-debt.mjs';

/**
 * Dívida com clientes.
 *
 * Este bloco existe porque o passivo tem duas naturezas que precisam ser
 * separadas antes de qualquer decisão. A maior parte são mensagens avulsas de
 * formulário e WhatsApp que nunca viraram relação — não há o que tratar um a um.
 * Uma fração pequena são clientes do cadastro que pediram alguma coisa e nunca
 * tiveram resposta. Essa fração cabe numa semana de trabalho, e é a única que
 * devolve algo a alguém.
 *
 * A palavra "dívida" foi escolhida. Não é backlog, que soa como trabalho a
 * fazer; não é pendência, que soa neutro. É um compromisso não cumprido, e a
 * tela não tem por que suavizar isso.
 */
export function AnalyticsCustomerDebt({ payload }: { payload: unknown }) {
  const divida = readCustomerDebt(payload);
  const [expandida, setExpandida] = useState<string | null>(null);

  if (!divida.available) {
    return (
      <ChartCard
        title="Clientes sem resposta"
        description="Atendimentos de empresas do cadastro parados além do limite."
      >
        <MinimalState
          title="Nenhum cliente sem resposta"
          description="Nenhum atendimento vinculado a empresa do cadastro está parado além do limite. É o resultado esperado quando a fila é trabalhada."
        />
      </ChartCard>
    );
  }

  function baixar() {
    const csv = toDebtCsv(divida);
    // A marca de ordem de byte vai por código, e não literal no arquivo fonte:
    // colada como caractere ela é invisível na revisão e o lint a rejeita, com
    // razão. Sem ela, o Excel em português abre o CSV com acentuação quebrada.
    const marcaDeOrdem = '\uFEFF';
    const blob = new Blob([`${marcaDeOrdem}${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `clientes-sem-resposta-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <ChartCard
      title="Clientes sem resposta"
      description={`Empresas do cadastro com atendimentos parados há mais de ${divida.threshold ?? 180} dias. Diferente do restante do passivo, aqui há alguém do outro lado esperando.`}
    >
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <p className="text-sm text-[color:var(--minimal-text)]">
          <strong className="text-lg font-semibold tabular-nums">{divida.totalTickets.toLocaleString('pt-BR')}</strong>
          {' '}atendimentos de{' '}
          <strong className="text-lg font-semibold tabular-nums">{divida.totalCompanies.toLocaleString('pt-BR')}</strong>
          {' '}empresas
          {divida.inWorkedQueue > 0 ? (
            <span className="block text-xs text-[color:var(--minimal-text-secondary)]">
              {divida.inWorkedQueue.toLocaleString('pt-BR')} estão dentro da fila que o time trabalha, e não numa caixa
              de entrada sem dono.
            </span>
          ) : null}
        </p>
        <button
          type="button"
          onClick={baixar}
          className="min-h-9 rounded-lg border border-[color:var(--minimal-border-strong)] px-3 py-1.5 text-xs font-medium text-[color:var(--minimal-text)] hover:bg-[color:var(--minimal-surface-muted)]"
        >
          Baixar lista para atendimento
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="gso-analytics-responsive-table w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-[color:var(--minimal-border)] text-left text-[11px] font-semibold uppercase tracking-wide text-[color:var(--minimal-text-tertiary)]">
              <th className="py-2 pr-4">Empresa</th>
              <th className="py-2 pr-4">Prioridade</th>
              <th className="py-2 pr-4 text-right">Atendimentos</th>
              <th className="py-2 pr-4 text-right">Espera mais longa</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {divida.companies.map((empresa) => {
              const aberta = expandida === empresa.companyId;
              return (
                <tr key={empresa.companyId} className="border-b border-[color:var(--minimal-border)] last:border-0 align-top">
                  <td data-label="Empresa" className="py-2 pr-4 text-[color:var(--minimal-text)]">
                    {empresa.name}
                    {aberta ? (
                      <ul className="mt-2 space-y-1 text-[11px] text-[color:var(--minimal-text-tertiary)]">
                        {empresa.details.slice(0, 12).map((atendimento) => (
                          <li key={atendimento.ticketId}>
                            nº {atendimento.ticketId} · {atendimento.pipelineLabel} ·{' '}
                            {humanizeSilence(atendimento.daysSilent)} sem resposta · {atendimento.ownerName}
                          </li>
                        ))}
                        {empresa.details.length > 12 ? (
                          <li>+ {empresa.details.length - 12} outros na lista completa.</li>
                        ) : null}
                      </ul>
                    ) : null}
                  </td>
                  <td data-label="Prioridade" className="py-2 pr-4">
                    <span
                      className={
                        empresa.priority === 'alta'
                          ? 'font-semibold text-[color:var(--minimal-danger-text)]'
                          : empresa.priority === 'media'
                            ? 'font-medium text-[color:var(--minimal-warning-text)]'
                            : 'text-[color:var(--minimal-text-tertiary)]'
                      }
                    >
                      {PRIORITY_LABELS[empresa.priority]}
                    </span>
                  </td>
                  <td data-label="Atendimentos" className="py-2 pr-4 text-right tabular-nums text-[color:var(--minimal-text)]">
                    {empresa.tickets.toLocaleString('pt-BR')}
                  </td>
                  <td data-label="Espera mais longa" className="py-2 pr-4 text-right tabular-nums text-[color:var(--minimal-text-secondary)]">
                    {humanizeSilence(empresa.oldestDaysSilent)}
                  </td>
                  <td className="py-2 text-right">
                    <button
                      type="button"
                      onClick={() => setExpandida(aberta ? null : empresa.companyId)}
                      aria-expanded={aberta}
                      className="text-[11px] font-medium text-[color:var(--minimal-action)] hover:underline"
                    >
                      {aberta ? 'Ocultar' : 'Ver atendimentos'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-3 border-t border-[color:var(--minimal-border)] pt-2 text-[11px] leading-4 text-[color:var(--minimal-text-tertiary)]">
        A prioridade considera há quanto tempo o cliente espera e quantos pedidos dele estão parados — não o porte da
        empresa. Decidir atender primeiro quem paga mais é escolha da operação, não do painel. O assunto de cada
        atendimento não aparece aqui porque não é trazido na sincronização; o número identifica o registro na origem.
      </p>
    </ChartCard>
  );
}
