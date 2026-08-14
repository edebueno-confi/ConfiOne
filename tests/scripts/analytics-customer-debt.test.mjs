import assert from 'node:assert/strict';
import test from 'node:test';
import {
  PRIORITY_LABELS,
  humanizeSilence,
  readCustomerDebt,
  toDebtCsv,
  toDebtRows,
} from '../../apps/web/src/features/analytics/analytics-customer-debt.mjs';

// Payload espelhando produção: L'Oréal com 25 atendimentos parados há até 715
// dias, Neotrust com 23 até 912. Números reais, para que o teste falhe se a
// leitura deles mudar.
const producao = {
  threshold_days: 180,
  total_tickets: 146,
  total_companies: 63,
  high_priority: 2,
  in_worked_queue: 26,
  companies: [
    {
      company_id: '1', company_name: "L'OREAL BRASIL", tickets: 25,
      oldest_days_silent: 715, avg_days_silent: 420, tickets_in_worked_queue: 25, priority: 'alta',
      tickets_detail: [
        { ticket_id: '901', pipeline_label: 'Suporte', days_silent: 715, owner_name: 'Sem responsável' },
        { ticket_id: '902', pipeline_label: 'Suporte', days_silent: 300, owner_name: 'Ana' },
      ],
    },
    {
      company_id: '2', company_name: 'New Solutions', tickets: 3,
      oldest_days_silent: 537, avg_days_silent: 400, tickets_in_worked_queue: 0, priority: 'media',
      tickets_detail: [{ ticket_id: '903', pipeline_label: 'Fale conosco | Confi', days_silent: 537, owner_name: 'Ana' }],
    },
    {
      company_id: '3', company_name: 'Pequena', tickets: 1,
      oldest_days_silent: 200, avg_days_silent: 200, tickets_in_worked_queue: 1, priority: 'baixa',
      tickets_detail: [{ ticket_id: '904', pipeline_label: 'Suporte', days_silent: 200, owner_name: 'Ana' }],
    },
  ],
};

test('payload ausente não vira lista vazia silenciosa', () => {
  const leitura = readCustomerDebt(null);
  assert.equal(leitura.available, false);
  assert.equal(leitura.totalTickets, 0);
});

test('os totais vêm do backend, não de soma na tela', () => {
  const leitura = readCustomerDebt(producao);
  assert.equal(leitura.totalTickets, 146);
  assert.equal(leitura.totalCompanies, 63);
  // A lista traz só as empresas retornadas; o total é do conjunto inteiro.
  assert.equal(leitura.companies.length, 3);
});

test('a prioridade e os agregados vêm prontos do backend', () => {
  const leitura = readCustomerDebt(producao);
  assert.deepEqual(leitura.companies.map((company) => company.priority), ['alta', 'media', 'baixa']);
  assert.equal(leitura.highPriority, 2);
});

test('o que está dentro da fila trabalhada é contado à parte', () => {
  const leitura = readCustomerDebt(producao);
  // 25 da L'Oréal e 1 da Pequena; os 3 da New Solutions estão em caixa de
  // entrada e não entram nessa contagem.
  assert.equal(leitura.inWorkedQueue, 26);
});

test('tempo de silêncio vira frase legível, sem o leitor converter nada', () => {
  assert.equal(humanizeSilence(45), '45 dias');
  assert.equal(humanizeSilence(200), '7 meses');
  assert.equal(humanizeSilence(400), 'mais de 1 ano');
  assert.equal(humanizeSilence(912), 'mais de 2 anos');
  assert.equal(humanizeSilence(0), 'Indisponível');
  assert.equal(humanizeSilence(null), 'Indisponível');
});

test('a exportação é por atendimento, não por empresa', () => {
  // Quem vai tratar precisa da lista de atendimentos; o resumo por empresa não
  // permite trabalhar.
  const linhas = toDebtRows(readCustomerDebt(producao));
  assert.equal(linhas.length, 4);
  assert.equal(linhas[0].dias_sem_resposta, 715, 'a espera mais longa vem primeiro');
  assert.equal(linhas[0].empresa, "L'OREAL BRASIL");
});

test('o CSV usa ponto e vírgula e escapa o que precisa', () => {
  const csv = toDebtCsv(readCustomerDebt(producao));
  const [cabecalho, primeira] = csv.split('\r\n');
  assert.equal(cabecalho, 'Empresa;Prioridade;Atendimento;Pipeline;Responsável;Dias sem resposta');
  assert.match(primeira, /^L'OREAL BRASIL;Alta;901;Suporte;Sem responsável;715$/);
});

test('valor com ponto e vírgula no texto não quebra a coluna', () => {
  const comSeparador = {
    ...producao,
    companies: [{
      company_id: '9', company_name: 'Empresa; com ponto e vírgula', tickets: 1,
      oldest_days_silent: 400, avg_days_silent: 400, tickets_in_worked_queue: 1,
      tickets_detail: [{ ticket_id: '910', pipeline_label: 'Suporte', days_silent: 400, owner_name: 'Ana' }],
    }],
  };
  const csv = toDebtCsv(readCustomerDebt(comSeparador));
  assert.match(csv, /"Empresa; com ponto e vírgula"/);
});

test('os rótulos de prioridade estão em português', () => {
  assert.deepEqual(PRIORITY_LABELS, { alta: 'Alta', media: 'Média', baixa: 'Baixa' });
});
