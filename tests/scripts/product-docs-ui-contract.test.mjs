import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const pageSource = readFileSync(
  'apps/web/src/features/product-docs/ProductDocsPage.tsx',
  'utf8',
);
const readerSource = readFileSync(
  'apps/web/src/features/product-docs/ProductDocReaderPanel.tsx',
  'utf8',
);

test('auto-opens the first available product document after catalog load', () => {
  assert.match(pageSource, /const selectedSlug = requestedSlug \?\? catalog\[0\]\?\.slug \?\? null;/);
  assert.doesNotMatch(pageSource, /requestedSlug \?\? filteredDocs\[0\]\?\.slug/);
});

test('keeps product docs as a three-zone cockpit reader', () => {
  assert.match(pageSource, /xl:grid-cols-\[320px_minmax\(0,1fr\)_280px\]/);
  assert.match(pageSource, /Documentos sincronizados/);
  assert.match(pageSource, /Trilhas sugeridas/);
  assert.match(pageSource, /Fonte governada/);
  assert.doesNotMatch(pageSource, /Contrato real/);
});

test('reader panel uses prose-oriented document typography and safe metadata', () => {
  assert.match(readerSource, /max-w-\[78ch\]/);
  assert.match(readerSource, /Origem versionada/);
  assert.match(readerSource, /Markdown sanitizado/);
  assert.doesNotMatch(readerSource, /Contrato backend/);
  assert.doesNotMatch(readerSource, /contrato real/i);
});

test('reader panel exposes a governed in-document outline from sanitized markdown', () => {
  assert.match(readerSource, /getProductDocOutline\(document\.body_md_sanitized\)/);
  assert.match(readerSource, /Neste documento/);
  assert.match(readerSource, /href=\{`#\$\{item\.id\}`\}/);

  const markdownSource = readFileSync(
    'apps/web/src/features/product-docs/ProductDocMarkdownPreview.tsx',
    'utf8',
  );
  assert.match(markdownSource, /export function getProductDocOutline/);
  assert.match(markdownSource, /id=\{headingId\}/);
});
