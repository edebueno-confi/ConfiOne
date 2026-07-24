# Produto MVP

## Nome de trabalho

Genius Support OS MVP

## Problema

A Genius precisa de uma central simples e confiavel para clientes B2B encontrarem orientacoes, abrirem demandas e acompanharem respostas. Internamente, o suporte precisa de uma fila unica para receber, tratar, responder e acionar outras areas quando necessario.

Hoje o risco operacional e dispersao:

- conhecimento espalhado;
- solicitacoes por e-mail, WhatsApp e conversas soltas;
- historico dificil de recuperar;
- pouca visibilidade para cliente B2B;
- suporte dependendo de memoria individual;
- acionamentos internos sem trilha clara.

## Proposta do MVP

Criar uma plataforma B2B simples com quatro superficies:

1. Central de ajuda publica.
2. Portal do cliente logado.
3. Workspace do suporte.
4. Workspace simples de areas internas.

Essas quatro superficies resolvem o ciclo minimo:

```text
Cliente consulta artigo -> cliente abre demanda -> suporte trata -> suporte responde ou aciona area -> area devolve informacao -> suporte responde cliente -> demanda fica historica.
```

## Usuarios

### Cliente B2B

Pessoa de uma marca/loja cliente da Genius. Deve conseguir:

- acessar artigos publicos;
- entrar no portal;
- abrir demanda;
- anexar evidencia;
- acompanhar status;
- responder ao suporte;
- ver historico das proprias demandas ou do proprio tenant, conforme permissao.

### Suporte Genius

Time que recepciona e conduz as demandas. Deve conseguir:

- ver fila de demandas;
- criar demanda manual quando receber contato fora da plataforma;
- responder cliente;
- registrar nota interna;
- classificar demanda;
- alterar status;
- atribuir responsavel;
- acionar uma area interna;
- vincular artigo de ajuda;
- encerrar demanda com motivo.

### Area interna

Financeiro, Desenvolvimento, Produto, Integracoes, CS ou outra area acionada pelo suporte. Deve conseguir:

- ver demandas internas direcionadas a sua area;
- assumir demanda;
- comentar internamente;
- devolver resposta estruturada ao suporte;
- sinalizar bloqueio ou necessidade de complemento.

### Admin minimo

Pessoa interna responsavel por configuracao basica. Deve conseguir:

- cadastrar cliente B2B;
- cadastrar usuarios internos;
- vincular usuarios a clientes ou areas;
- manter artigos da central de ajuda;
- revisar logs basicos.

## Resultado esperado

No final do MVP, a Genius deve ter:

- central de ajuda publica navegavel;
- portal cliente para demandas;
- fila de suporte operacional;
- colaboracao interna basica;
- historico auditavel;
- base tecnica segura para evoluir Gmail, CS, financeiro, produto e IA depois.

## Principios de produto

- Simples antes de completo.
- Fluxo real antes de dashboard.
- Historico antes de automacao.
- Backend como fonte da verdade.
- Cliente nunca ve nota interna, engenharia interna, audit bruto ou dado sensivel.
- Dados ausentes aparecem como indisponiveis, nunca inventados.
- IA, Gmail e integrações externas ficam como evolucao, nao como fundacao do MVP.
