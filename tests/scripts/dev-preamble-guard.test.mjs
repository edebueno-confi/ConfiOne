import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const html = await readFile(new URL('../../apps/web/index.html', import.meta.url), 'utf8');

// Este teste guarda uma armadilha que custou um dev server inteiro.
//
// Dentro de script inline no HTML, o Vite 8 substitui `import.meta.env` por um
// objeto literal com DEV:false e PROD:true — mesmo servindo em desenvolvimento,
// com MODE:"development". Um preâmbulo guardado por `import.meta.env.DEV` nunca
// executa, e a aplicação entrega tela em branco com "$RefreshSig$ is not
// defined". O sintoma não aparece no build, no lint, no typecheck nem em
// nenhuma verificação de código: só abrindo a página.

/**
 * O preâmbulo sem os comentários.
 *
 * A explicação da armadilha cita `import.meta.env` em prosa, e sem esta limpeza
 * o próprio comentário dispararia a asserção que ele existe para justificar.
 */
function preambuloSemComentarios() {
  const bloco = html.slice(html.indexOf('<script type="module">'), html.indexOf('</script>'));
  return bloco.replace(/\/\/.*$/gm, '');
}

test('o preâmbulo de desenvolvimento não é guardado por import.meta.env', () => {
  const inline = preambuloSemComentarios();
  assert.match(inline, /\$RefreshSig\$/, 'o preâmbulo precisa continuar existindo');
  assert.doesNotMatch(
    inline,
    /import\.meta\.env/,
    'use import.meta.hot: import.meta.env.DEV chega como false no script inline do HTML',
  );
  assert.match(inline, /if \(import\.meta\.hot\)/);
});

test('os globais são definidos antes do import assíncrono do runtime', () => {
  const inline = preambuloSemComentarios();
  const posGlobal = inline.indexOf('$RefreshSig$');
  const posImport = inline.indexOf("await import('/@react-refresh')");
  assert.ok(posGlobal > -1 && posImport > -1);
  assert.ok(
    posGlobal < posImport,
    'definir os globais depois do await deixa uma janela em que módulos React quebram',
  );
});

test('falha ao instalar o recarregamento a quente não derruba a aplicação', () => {
  const inline = preambuloSemComentarios();
  assert.match(inline, /try \{[\s\S]*catch/);
});
