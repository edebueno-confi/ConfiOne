# Runbook da migração After Sale V1 para V2

## Objetivo

Replicar a configuração efetiva de um cliente After Sale V1 em um ambiente V2 novo, respeitando as diferenças de nomenclatura e de capacidade entre as versões.

## Regra principal

V1 é a origem da verdade operacional. V2 começa com valores padrão. Um valor padrão só é considerado correto quando for comparado com a V1 e validado após o salvamento.

## Fluxo controlado

```text
Confirmar usuário e escopo
        |
Extrair V1 sem alterar
        |
Organizar parâmetros e evidências
        |
Encontrar equivalentes na V2
        |
Aplicar somente o que a V2 suporta
        |
Recarregar e validar cada alteração
        |
Documentar resultado, limites e pendências
```

## Conferência de escopo

### V1

Use o avatar do perfil, escolha `Trocar e-commerce`, pesquise a loja e confirme `Melissa App` no seletor e no conteúdo da tela. A URL não identifica a loja.

### V2

Abra o seletor de e-commerces e deixe somente `Melissa App` selecionada. A seleção de `Melissa` e `Melissa App` ao mesmo tempo é inválida para uma ação de migração. Confirme o nome da loja na tela e, quando aparecer, o identificador da conta.

### Após qualquer transição

Troca de loja, recarga, retorno ao seletor, salvamento ou abertura de uma rota sensível exige nova conferência. Não use uma seleção anterior como prova.

## Extração por evidência

O DOM é preferível para coletar listas, estados, valores e textos longos. A tela visual é necessária para confirmar contexto, conteúdo renderizado, pré-visualização e resultado persistido. Registre a fonte de cada dado como `DOM`, `tela`, `exportação` ou `documentação`.

## Regras de interpretação

- `Exibir somente no painel administrativo` é uma regra de visibilidade, não um prazo negativo.
- Liberação no Boss não prova uso pelo cliente.
- Motivo padrão da V2 não prova que corresponde à V1.
- Ausência de modelo de e-mail na V2 não bloqueia a migração, mas deve ser registrada.
- CNPJ repetido pode ser válido; código de loja e endereço conflitantes precisam de revisão.
- Não desative um padrão da V2 sem evidência da V1 ou decisão de negócio.
- Não crie motivo duplicado; edite o registro existente quando houver correspondência.
- Tokens, senhas e credenciais não fazem parte da documentação.

## Formato de cada evidência

```text
Módulo:
Parâmetro na V1:
Valor observado na V1:
Destino localizado na V2:
Valor aplicado na V2:
Situação:
Evidência:
Validação após recarregar:
Observação humana:
```

## Checklist de aceite

- [ ] Loja correta confirmada na V1.
- [ ] Loja correta e única confirmada na V2.
- [ ] Extração completa da V1 concluída.
- [ ] Motivos públicos e administrativos comparados.
- [ ] Status e regras Oracle comparados.
- [ ] Lojas e campos obrigatórios conferidos.
- [ ] Configurações de loja conferidas após importação.
- [ ] E-mails e HTML registrados.
- [ ] Integrações sem secrets transportadas.
- [ ] Alterações da V2 recarregadas e confirmadas.
- [ ] Não houve alteração na V1, Boss ou código.
- [ ] Relatório final escrito para leitor que não participou do processo.
