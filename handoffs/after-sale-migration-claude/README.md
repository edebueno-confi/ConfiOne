# Pacote de transferência: migração After Sale V1 para V2

Este diretório reúne o contexto operacional necessário para o Claude continuar a migração da loja Melissa App, usando o mesmo padrão aplicado na migração da Melissa, e para iniciar posteriormente a frente de migração Genius para After Sale V2.

## Ponto de entrada para o Cloud

Leia primeiro [`docs/AFTER_SALE_V1_V2_GENIUS_MIGRATION_HANDOFF.md`](../../docs/AFTER_SALE_V1_V2_GENIUS_MIGRATION_HANDOFF.md). Esse documento consolida o conhecimento, separa After Sale V1 de Genius, aponta as fontes locais e explica o que ainda depende de leitura ao vivo e aprovação humana.

## Como usar

1. Leia `PROMPT_CLAUDE_MELISSA_APP.md` e use seu conteúdo como instrução inicial.
2. Leia `RUNBOOK_MIGRACAO.md` antes de abrir ou alterar qualquer painel.
3. Use `DEPAR_EVIDENCIAS.md` como referência de decisões e pontos de atenção.
4. Consulte `ARTEFATOS_EVIDENCIAS.md` para acessar a pasta canônica do Drive e os documentos da Melissa.
5. Gere os novos documentos da Melissa App na própria pasta canônica do Drive, sem sobrescrever os artefatos da Melissa.
6. Leia `GENIUS_PARA_V2_PREBRIEF.md` somente para preparar a próxima frente. Não inicie a migração Genius antes de o responsável ensinar o login, a seleção do cliente e o fluxo de extração.
7. Use `CENTRAIS_AJUDA_E_FONTES.md` para separar o conteúdo da Central Genius, da V1 e da V2. O que não estiver disponível localmente deve ser lido ao vivo, sem inventar conteúdo.

## Limite deste pacote

Este pacote é um handoff operacional. Ele não contém senhas, tokens, cookies, JWTs, credenciais ou conteúdo de secrets. Valores sensíveis devem ser informados manualmente pelo responsável no ambiente de destino.

Os números históricos incluídos aqui servem para orientar a conferência e não substituem uma extração ao vivo. O Claude deve confirmar novamente a loja, os parâmetros, os motivos, os e-mails e o resultado após cada gravação.

## Resultado esperado

Ao final, deve existir uma documentação humana e completa da Melissa App, com:

- resumo do resultado da migração;
- checklist por módulo da V1 e correspondente na V2;
- itens migrados, adaptados, parciais, não suportados ou não localizados;
- lista de lojas e CSV baseado no modelo oficial da V2;
- conferência de duplicidades e campos obrigatórios;
- e-mails encontrados na V1, destino equivalente na V2 e resultado;
- evidências de validação após salvar e recarregar;
- pendências que não impedem a conclusão, mas precisam de evolução futura.

## Próxima frente: Genius para After Sale V2

A migração Genius é um fluxo diferente da migração After Sale V1. A origem, os nomes dos módulos, os clientes e os parâmetros podem ser diferentes. O Claude deve aprender esse fluxo com o humano antes de executar qualquer leitura ou escrita. O prompt e o pré-brief dessa frente já estão neste diretório, mas não autorizam ações em ambiente Genius.

## Documentos vivos da frente Genius

Os documentos abaixo são mantidos como registros atuais da configuração Genius para After Sale V2. Cada nova descoberta, correção de interpretação ou confirmação deve ser incorporada neles, sem apagar o histórico necessário para entender a decisão:

- `genius-digaspi/EXTRACAO_INICIAL_DIGASPI.md`: informações de origem e contexto das duas lojas.
- `genius-digaspi/MIGRACAO_GENIUS_V2_DIGASPI.html`: de-para detalhado, configurações realizadas e alertas.
- `genius-digaspi/RELATORIO_GERENCIAL_MARI_DIGASPI_UPSPORTS.html`: resumo para leitura gerencial.

### Sérgio K.

- `genius-sergio-k/EXTRACAO_INICIAL_SERGIO_K.md`: parâmetros lidos na Genius, sem credenciais.
- `genius-sergio-k/MIGRACAO_GENIUS_V2_SERGIO_K.html`: de-para detalhado e resultado da configuração.
- `genius-sergio-k/RELATORIO_GERENCIAL_SERGIO_K.html`: resumo para leitura gerencial.
- `genius-sergio-k/RELATORIO_GERENCIAL_MARI_SERGIO_K.html`: versão do resumo gerencial destinada à Mari.

### Sapatella

- `genius-sapatella/EXTRACAO_INICIAL_SAPATELLA.md`: parâmetros da Genius, motivos, sellers e lojas físicas, sem credenciais.
- `genius-sapatella/MIGRACAO_GENIUS_V2_SAPATELLA.html`: de-para completo e situação da configuração na V2.
- `genius-sapatella/RELATORIO_GERENCIAL_MARI_SAPATELLA.html`: resumo para leitura gerencial.

Regra de atualização: registrar cada achado por loja, distinguir fato confirmado de item não localizado, e atualizar o de-para e o resumo gerencial sempre que uma decisão alterar o resultado. Não declarar uma configuração como concluída apenas porque existe um cadastro padrão na V2.
