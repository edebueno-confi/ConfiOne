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

test('remove contato legado inline sem remover o conteúdo operacional', () => {
  assert.equal(
    stripLegacySupportContacts('Fale com o suporte, WhatsApp 11978935651 e e-mail.'),
    'Fale com o suporte.',
  );
});
