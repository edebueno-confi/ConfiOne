import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import test from 'node:test';

import { repairMojibake, stripLegacySupportContacts } from '../../scripts/knowledge/legacy-normalization.mjs';

test('preserva UTF-8 válido quando o documento contém marcador legado isolado', () => {
  const source = 'PARAMETRIZAÇÃO GERAL — fragmento legado Ã isolado';
  assert.equal(repairMojibake(source), source);
});

test('corrige somente o fragmento legado sem corromper os demais acentos', () => {
  assert.equal(repairMojibake('ConfiguraÃ§Ã£o de parametrização'), 'Configuração de parametrização');
});

test('corrige aspas tipográficas e emoji codificados como Windows-1252', () => {
  assert.equal(
    repairMojibake('Resposta â€œinválidaâ€ e valor ðŸ’°'),
    'Resposta “inválida” e valor 💰',
  );
});

test('preserva palavras válidas com a letra â', () => {
  assert.equal(repairMojibake('INTEGRAÇÃO, câmbio e parâmetro'), 'INTEGRAÇÃO, câmbio e parâmetro');
});

test('gera correção por slug sem placeholder ou ID histórico', () => {
  const sql = execFileSync(
    process.execPath,
    ['scripts/knowledge/generate-copy-repair-migration.mjs', '--slug=como-atualizar-os-dados-de-integracao-do-e-commerce'],
    { encoding: 'utf8' },
  );

  assert.match(sql, /ks\.slug = 'genius'/);
  assert.match(sql, /ka\.slug = 'como-atualizar-os-dados-de-integracao-do-e-commerce'/);
  assert.doesNotMatch(sql, /inserir link da FAQ|�|964e5bf7-7de7-4bf4-828e-f199ea40e45a/);
});

test('remove contato legado inline sem remover o conteúdo operacional', () => {
  assert.equal(
    stripLegacySupportContacts('Fale com o suporte, WhatsApp 11978935651 e e-mail.'),
    'Fale com o suporte.',
  );
});
