import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {
  KNOWLEDGE_SUMMARY_LIMIT,
  resolveKnowledgeSaveMode,
} from '../../apps/web/src/features/knowledge/knowledge-editorial-rules.ts';

test('usa a revisão editorial para artigo publicado mesmo quando o estado visual ainda não foi atualizado', () => {
  assert.equal(
    resolveKnowledgeSaveMode({
      articleId: 'article-1',
      articleStatus: 'published',
      isEditorialRevision: false,
    }),
    'editorial-revision',
  );
});

test('preserva Markdown editorial estruturado nas categorias de Configuracoes', () => {
  const source = fs.readFileSync('apps/web/src/features/help-center/markdown.tsx', 'utf8');
  assert.match(source, /hasEditorialStructure/);
  assert.match(source, /if \(hasEditorialStructure\)/);
});

test('mantém rascunho e criação separados do fluxo editorial publicado', () => {
  assert.equal(
    resolveKnowledgeSaveMode({ articleId: 'article-1', articleStatus: 'draft', isEditorialRevision: false }),
    'draft',
  );
  assert.equal(resolveKnowledgeSaveMode({ isEditorialRevision: false }), 'create');
});

test('permite resumos editoriais acima do limite legado de 160 caracteres', () => {
  assert.equal(KNOWLEDGE_SUMMARY_LIMIT, 320);
  assert.ok(KNOWLEDGE_SUMMARY_LIMIT > 252);
});

test('mapeia as categorias novas para ícones específicos em vez do documento genérico', () => {
  const source = fs.readFileSync('apps/web/src/features/help-center/public-ui.tsx', 'utf8');
  assert.match(source, /normalized\.includes\('solu'\)/);
  assert.match(source, /normalized\.includes\('seller'\)/);
  assert.match(source, /normalized\.includes\('loja'\)/);
});

test('renderiza Dica como callout editorial próprio', () => {
  const source = fs.readFileSync('apps/web/src/features/help-center/markdown.tsx', 'utf8');
  assert.match(source, /isTip/);
  assert.match(source, /const title = isTip\s*\n\s*\? 'Dica'/);
});

test('usa a data de publicação como data editorial pública', () => {
  const home = fs.readFileSync('apps/web/src/features/help-center/HelpCenterHomePage.tsx', 'utf8');
  const article = fs.readFileSync('apps/web/src/features/help-center/HelpCenterArticlePage.tsx', 'utf8');
  assert.match(home, /formatRelativePublicDate\(article\.published_at\)/);
  assert.match(article, /formatRelativePublicDate\(article\.published_at\)/);
  assert.doesNotMatch(home, /formatRelativePublicDate\(article\.updated_at\)/);
  assert.doesNotMatch(article, /formatRelativePublicDate\(article\.updated_at\)/);
});

test('mantém as imagens comprovadas da parametrização geral vinculadas aos assets públicos', () => {
  const source = fs.readFileSync('scripts/knowledge/generate-mass-editorial-rewrite.mjs', 'utf8');
  const assetRefs = source.match(/knowledge-asset:[0-9a-f-]{36}/g) ?? [];
  assert.equal(assetRefs.length, 9);
  assert.match(source, /#### Segurança[\s\S]+knowledge-asset:04427c82-6646-4a7e-9a63-24daa0d80cff/);
  assert.match(source, /#### Informar o SKU da troca por texto[\s\S]+knowledge-asset:53bea01d-ba6d-4166-a946-c70884321f76/);
  assert.match(source, /#### Variação do produto[\s\S]+knowledge-asset:18be680b-00c4-4ba1-a90b-dae3dac54792/);
});
