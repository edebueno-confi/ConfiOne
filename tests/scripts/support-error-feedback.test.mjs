import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const supportWorkspacePath = new URL(
  '../../apps/web/src/features/support/SupportWorkspacePage.tsx',
  import.meta.url,
);

const source = await readFile(supportWorkspacePath, 'utf8');

test('Support Workspace mantém estados auxiliares consumidos pela interface', () => {
  const discardedSetters = [
    'customerAccountContext',
    'customerRecentEvents',
    'attachmentPhase',
    'attachmentMessage',
    'attachmentDownloadingId',
    'engineeringMessage',
    'knowledgeMessage',
    'agentsPhase',
    'agentsMessage',
    'selectedRecentEventsWindow',
  ];

  const discardedStatePattern = (stateName) => {
    const capitalizedStateName = stateName.charAt(0).toUpperCase() + stateName.slice(1);

    return new RegExp(
      'const\\s*\\[\\s*,\\s*set' + capitalizedStateName + '\\s*\\]',
    );
  };

  for (const stateName of discardedSetters) {
    assert.doesNotMatch(
      source,
      discardedStatePattern(stateName),
      'o estado ' + stateName + ' não pode ter setter sem valor consumido',
    );
  }

  assert.match(
    '  const [, setAgentsPhase] = useState(\'idle\');',
    discardedStatePattern('agentsPhase'),
    'o guardião deve detectar a forma descartada em uma regressão sintética',
  );

  for (const stateName of [
    'attachmentPhase',
    'attachmentMessage',
    'engineeringMessage',
    'knowledgeMessage',
    'agentsPhase',
    'agentsMessage',
  ]) {
    const capitalizedStateName = stateName.charAt(0).toUpperCase() + stateName.slice(1);

    assert.match(
      source,
      new RegExp('\\[' + stateName + ', set' + capitalizedStateName + '\\]'),
      'o estado ' + stateName + ' deve ser lido pela interface',
    );
  }
});

test('falhas auxiliares chegam ao aviso visível da conversa do ticket', () => {
  assert.match(source, /const auxiliaryLoadFeedback = \[/);
  assert.match(source, /const visibleDetailNotice = detailNotice \?\? auxiliaryLoadFeedback/);
  assert.match(source, /detailNotice=\{visibleDetailNotice\}/);
  assert.match(source, /agentsMessage \?\? 'O diretório de agentes atribuíveis não ficou disponível\.'/);
  assert.match(source, /attachmentMessage \?\? 'As evidências do ticket não ficaram disponíveis\.'/);
  assert.match(source, /engineeringMessage \?\? 'O handoff técnico não ficou disponível\.'/);
  assert.match(source, /knowledgeMessage \?\? 'O painel de conhecimento não ficou disponível\.'/);
});
