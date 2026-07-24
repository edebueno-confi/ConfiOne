export const geniusReturnsIntegrationLinks = {
  apiDocs: 'https://apidocs.geniusreturns.com.br/openapi',
  apiDocsSpec: 'https://apidocs.geniusreturns.com.br/_spec/openapi.json?download=',
  swagger: 'https://integration.geniusreturns.com.br/swagger/index.html',
  production: 'https://integration.geniusreturns.com.br',
  qa: 'https://integration-qa.geniusreturns.com.br',
} as const;

export type GeniusReturnsApiOperationKey =
  | 'authenticate'
  | 'initiate-flow'
  | 'import-request'
  | 'get-process'
  | 'list-processes'
  | 'add-return-note'
  | 'update-return-note'
  | 'deactivate-return-note'
  | 'list-return-notes'
  | 'get-return-note'
  | 'product-rating';

interface GeniusReturnsApiOperation {
  title: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH';
  path: string;
  purpose: string;
  apiDocsPath: string;
}

export const geniusReturnsApiOperations: Record<
  GeniusReturnsApiOperationKey,
  GeniusReturnsApiOperation
> = {
  authenticate: {
    title: 'Autenticar uma integração',
    method: 'POST',
    path: '/v1/pvt/seguranca/autenticar',
    purpose: 'Obter o JWT para chamadas protegidas.',
    apiDocsPath: 'autenticar',
  },
  'initiate-flow': {
    title: 'Integrar pedido ao fluxo de devolução',
    method: 'POST',
    path: '/v3/pvt/processo/integrar/fluxo',
    purpose: 'Integrar o pedido e obter o link para o cliente iniciar a solicitação.',
    apiDocsPath: 'integrateflow',
  },
  'import-request': {
    title: 'Importar uma solicitação',
    method: 'POST',
    path: '/v1/pvt/processo/enviar-solicitacao',
    purpose: 'Enviar uma troca ou devolução criada em outro sistema.',
    apiDocsPath: 'processos-enviar-solicitacao',
  },
  'get-process': {
    title: 'Consultar um processo',
    method: 'GET',
    path: '/v3/pvt/processo/{id-processo}',
    purpose: 'Obter os dados de uma troca ou devolução pelo identificador.',
    apiDocsPath: 'getprocessobyid',
  },
  'list-processes': {
    title: 'Listar processos',
    method: 'GET',
    path: '/v3/pvt/processo',
    purpose: 'Listar e filtrar processos para acompanhamento operacional.',
    apiDocsPath: 'listarprocessos',
  },
  'add-return-note': {
    title: 'Adicionar nota fiscal de devolução',
    method: 'POST',
    path: '/v3/pvt/Fiscal/{processoId}',
    purpose: 'Vincular uma nota fiscal de devolução ao processo.',
    apiDocsPath: 'addnotadevolucao',
  },
  'update-return-note': {
    title: 'Atualizar nota fiscal de devolução',
    method: 'PUT',
    path: '/v3/pvt/Fiscal/{processoId}/{notaFiscalId}',
    purpose: 'Atualizar os dados de uma nota vinculada ao processo.',
    apiDocsPath: 'updatenotadevolucao',
  },
  'deactivate-return-note': {
    title: 'Inativar nota fiscal de devolução',
    method: 'PATCH',
    path: '/v3/pvt/Fiscal/{processoId}/{notaFiscalId}',
    purpose: 'Inativar uma nota fiscal sem removê-la do histórico do processo.',
    apiDocsPath: 'inativarnotadevolucao',
  },
  'list-return-notes': {
    title: 'Listar notas fiscais de devolução',
    method: 'GET',
    path: '/v3/pvt/fiscal',
    purpose: 'Listar as notas vinculadas a um processo.',
    apiDocsPath: 'listarnotasdevolucaoporprocesso',
  },
  'get-return-note': {
    title: 'Consultar nota fiscal de devolução',
    method: 'GET',
    path: '/v3/pvt/fiscal/{id}',
    purpose: 'Obter uma nota fiscal pelo identificador.',
    apiDocsPath: 'getnotadevolucaoporid',
  },
  'product-rating': {
    title: 'Informar avaliação de produto',
    method: 'POST',
    path: '/v3/pvt/Produto/rating',
    purpose: 'Enviar a avaliação de um ou mais produtos do processo.',
    apiDocsPath: 'informarratingproduto',
  },
};

export function getGeniusReturnsApiOperation(key: string) {
  return geniusReturnsApiOperations[key as GeniusReturnsApiOperationKey] ?? null;
}

export function getGeniusReturnsApiDocsUrl(key: string) {
  const operation = getGeniusReturnsApiOperation(key);
  return operation
    ? `${geniusReturnsIntegrationLinks.apiDocs}/${operation.apiDocsPath}`
    : geniusReturnsIntegrationLinks.apiDocs;
}

export function resolveGeniusReturnsIntegrationTokens(value: string) {
  return value.replace(/\{\{link:([a-z]+(?:_[a-z]+)*)\}\}/g, (_token, key: string) => {
    const link = geniusReturnsIntegrationLinks[key as keyof typeof geniusReturnsIntegrationLinks];
    return link ?? _token;
  });
}
