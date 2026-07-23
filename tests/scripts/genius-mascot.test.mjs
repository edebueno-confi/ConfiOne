import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const componentPath = new URL('../../apps/web/src/components/GeniusMascot.tsx', import.meta.url);
const stylesPath = new URL('../../apps/web/src/index.css', import.meta.url);
const component = fs.readFileSync(componentPath, 'utf8');
const styles = fs.readFileSync(stylesPath, 'utf8');

test('expõe as seis poses oficiais e as três expressões oficiais', () => {
  for (const value of ['welcome', 'present', 'think', 'celebrate', 'magic', 'shrug', 'happy', 'wink', 'wow']) {
    assert.match(component, new RegExp(`['"]${value}['"]`), `valor ausente: ${value}`);
  }
});

test('expõe variantes semânticas de avatar com mapeamento estável', () => {
  for (const value of ['default', 'attention', 'success']) {
    assert.match(component, new RegExp(`['"]${value}['"]`), `variante ausente: ${value}`);
  }
  assert.match(component, /avatarVariant/);
  assert.match(component, /attention:[\s\S]*magic[\s\S]*wink/);
  assert.match(component, /success:[\s\S]*celebrate[\s\S]*wow/);
});

test('implementa present e think como poses explícitas do SVG', () => {
  assert.match(component, /posePresent/);
  assert.match(component, /poseThink/);
  assert.match(component, /data-pose/);
});

test('não duplica o braço base em poses com dois braços explícitos', () => {
  assert.match(component, /showBaseArm/);
  assert.match(component, /genius-mascot__base-arm/);
  assert.match(component, /!\['celebrate', 'shrug'\]\.includes\(resolvedPose\)/);
});

test('pose magic usa mão aberta sem silhueta de dedo isolado', () => {
  assert.match(component, /M234 98c-2-8/);
  assert.doesNotMatch(component, /M236 98c-4-8-2-18 8-18h4V56/);
});

test('mantém acessibilidade sem animar indefinidamente quando reduced motion está ativo', () => {
  assert.match(component, /aria-hidden/);
  assert.match(component, /aria-label/);
  assert.match(styles, /prefers-reduced-motion/);
  assert.match(styles, /genius-mascot--animated/);
});

test('define enquadramento de avatar por tamanho sem remover a moldura circular', () => {
  assert.match(styles, /data-surface=['"]avatar['"][^}]*genius-mascot--sm|genius-mascot--sm[^}]*data-surface=['"]avatar['"]/s);
  assert.match(styles, /data-surface=['"]avatar['"][^}]*genius-mascot--md|genius-mascot--md[^}]*data-surface=['"]avatar['"]/s);
  assert.match(styles, /data-surface=['"]avatar['"][^}]*genius-mascot--lg|genius-mascot--lg[^}]*data-surface=['"]avatar['"]/s);
  assert.match(styles, /avatar.*overflow|overflow.*avatar/s);
});
