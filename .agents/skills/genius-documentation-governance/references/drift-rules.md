# Regras de drift documental

## Comparações mínimas

Confronte docs com `package.json`, scripts, router, manifestos, navegação, `InternalScreenKey`, shell, contratos TypeScript, Edge Functions, migrations, views, RPCs, policies, testes e arquivos presentes.

## Sinais objetivos

- link interno ou caminho citado não existe;
- `npm run <script>` documentado não está no manifest;
- RPC/view/migration citada não aparece em código ou schema;
- rota documentada não aparece no router/manifesto;
- doc diz `pronto`, `publicado`, `ativo` ou `passou`, mas não traz evidência atual;
- alteração de runtime/contrato/permissão sem doc de área, `PROJECT_STATE` ou ledger proporcional;
- documento atual aponta para branch, HEAD, porta ou estado antigo;
- dado ausente é documentado como zero/fallback fabricado;
- integração é descrita como real quando só existe fixture/cache/local.

## Contradições

Compare pares de documentos que compartilham domínio e assunto. Registre ambos os trechos, datas/commits, fonte provável, confiança e decisão necessária. Frases opostas são candidatos, não prova: “bloqueado” pode ser histórico enquanto “pronto” é atual.

## Tela e runtime

Nos modos `domain`/`full`, navegador é opcional e exige ambiente/conta QA autorizados. Registre rota, porta, timestamp e screenshot; não use evidência visual antiga como estado atual e não interfira em servidor do Product Owner.

