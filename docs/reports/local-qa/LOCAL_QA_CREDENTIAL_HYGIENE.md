# LOCAL-QA-01.1 — Higiene de credenciais

- Senhas funcionais rastreadas na versão atual: zero.
- Referências antigas foram substituídas por nomes de variáveis e leitura por `readQaPassword`.
- `.env.local.qa` permanece ignorado e fora do pacote de revisão.
- As credenciais locais foram rotacionadas; valores omitidos deste relatório.
- As cinco credenciais anteriores foram testadas após a rotação e deixaram de autenticar.
- `npm run local:qa:secret-scan`: passou sem matches em 1.541 arquivos rastreados.
- Scripts de fixture não imprimem mais senhas; saídas usam `[LOCAL_QA_PASSWORD_OMITTED]`.
- Nenhum token, JWT, service role, cookie ou payload real foi adicionado ao lote.

