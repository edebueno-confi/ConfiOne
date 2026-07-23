# Plano de execucao - identidade e acesso por contexto

## Objetivo

Unificar administracao de colaboradores, areas internas, funcoes operacionais,
perfis reutilizaveis e telas autorizadas sem criar uma segunda fonte de
identidade ou permissao.

## Sequencia

1. Fechar migration e contratos backend para catalogo de telas, grants por
   vinculo e perfis nomeados.
2. Expor na tela de Areas internas a selecao de funcao, preset ou conjunto
   personalizado de telas, com bloqueio de vinculo ativo sem acesso.
3. Criar CRUD administrativo de perfis nomeados e sua matriz de telas.
4. Fazer Acessos administrar identidade, convite e papeis globais; retirar dali
   regras duplicadas de tela e encaminhar para o contrato contextual.
5. Alterar landing, redirect e shell para ler
   `vw_internal_actor_workspace_context`.
6. Validar com perfis de teste: suporte operador/gestor, CS operador/gestor,
   financeiro, produto e QA com dashboard/conhecimento/documentos.

## Criterios de aceite

- uma pessoa pode ter mais de um vinculo por area/cliente sem duplicar perfil;
- o mesmo preset pode ser aplicado a varias pessoas, respeitando compatibilidade
  com a area;
- uma excecao individual nao altera o preset nem o papel global;
- nenhuma rota fica liberada apenas por esconder item no menu;
- mutacoes exigem ator ativo, `platform_admin`, RLS e auditoria;
- shell e redirect usam contrato backend, com fallback explicito apenas para
  compatibilidade durante a transicao;
- typecheck, build, lint/teste de banco e QA responsivo passam.

## Riscos e limites

- nao aplicar migration remota, fazer deploy ou alterar secrets neste lote;
- nao converter `finance`, `product` ou `engineering` em papeis globais sem
  decisao de dominio;
- nao excluir papeis globais legados antes de haver evidencias de que o novo
  contexto foi consumido por todas as rotas.
