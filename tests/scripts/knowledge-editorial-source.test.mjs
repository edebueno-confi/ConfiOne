import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const generator = fs.readFileSync('scripts/knowledge/generate-mass-editorial-rewrite.mjs', 'utf8');
const reprocessor = fs.readFileSync('scripts/knowledge/reprocess-octadesk-article-assets.mjs', 'utf8');
const importer = fs.readFileSync('scripts/knowledge/import-octadesk-drafts.mjs', 'utf8');

test('o pipeline preserva a fonte editorial e os assets curados', () => {
  assert.match(generator, /content\.editorial\.md/);
  assert.match(generator, /editorial\.json/);
  assert.match(generator, /knowledge-asset-source/);
  assert.match(generator, /::related/);
  assert.match(generator, /withoutExistingCard/);
  assert.match(generator, /slice\(0, 1\)/);
});

test('o reprocessamento prefere conteúdo editorial e resolve assets por origem', () => {
  assert.match(reprocessor, /readFile\(path\.join\(articlePath, 'editorial\.json'\)/);
  assert.match(reprocessor, /resolveEditorialAssetReferences/);
  assert.match(reprocessor, /knowledge-asset-source/);
  assert.match(reprocessor, /legacyMarkers/);
  assert.match(reprocessor, /unresolvedAssetMarkers/);
  assert.match(reprocessor, /editorialOnly/);
});

test('a importação usa título, resumo e corpo editorial persistidos', () => {
  assert.match(importer, /editorial\.json/);
  assert.match(importer, /const body = editorial\?\.body_md/);
  assert.match(importer, /sqlEscape\(row\.title\)/);
  assert.match(importer, /editorialOnly/);
  assert.match(importer, /hasEditorial/);
});
