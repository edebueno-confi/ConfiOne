# Plano de documentação do Dashboard Gerencial

Status: **planejado**, registrado em 2026-08-07. Não iniciado.

## Por que este documento existe

O Dashboard vai ser compartilhado com pessoas que não participaram da sua
construção: lideranças, times de Comercial, CS, Suporte e Financeiro, e
eventualmente pessoas de fora da operação. Elas vão fazer três perguntas, sempre
nesta ordem:

1. **Como uso isto?** — onde clico, o que cada filtro faz, o que significa cada
   aba.
2. **De onde vem este número?** — qual sistema, qual campo, com que frequência
   atualiza.
3. **Como este número é calculado?** — qual fórmula, qual recorte de data, o que
   entra e o que fica de fora.

Hoje essas respostas existem espalhadas em relatórios técnicos de ciclo, que são
registro de execução e não material de consulta. Um relatório de ciclo responde
"o que fizemos e por quê"; a pessoa que abre o painel precisa de "o que isto
significa".

**O risco de não documentar não é dúvida, é decisão errada com confiança.**
Alguém lê "Taxa de ganho: 12,1%", supõe que o denominador são todos os negócios
do período, e conclui algo falso. O número está certo; a leitura, não.

## Princípio que a documentação precisa carregar

A regra central do painel é que **ausência de fonte nunca vira zero**. Um
indicador aparece como "Indisponível", "Dados parciais" ou "Aguardando
histórico", e cada um desses estados significa algo diferente. Se a documentação
não ensinar essa distinção, o recurso mais valioso do painel vira ruído visual.

## Entregáveis previstos

### 1. Guia de uso

Público: qualquer pessoa com acesso ao painel, sem conhecimento prévio.

- O que cada aba responde, em uma frase.
- Como o filtro de período funciona e o que ele **não** afeta — indicadores de
  posição atual, como fila e carteira, não mudam com o período.
- Como ler os três estados de indisponibilidade.
- Como interpretar o seletor de pipelines: por que existe, o que acontece ao
  desmarcar, e por que a configuração persistida não é alterada.
- O que fazer quando um número parece errado.

### 2. Glossário de negócio

Público: quem precisa falar do número com outra pessoa.

Para cada indicador publicado:

- nome canônico — já existe em `apps/web/src/features/analytics/analytics-vocabulary.mjs`;
- o que mede, em linguagem de negócio;
- **qual data define o recorte** — é a fonte mais comum de mal-entendido;
- o que entra e o que fica de fora;
- quando aparece como parcial ou indisponível, e por quê.

Termos que precisam de distinção explícita, porque são confundidos com
frequência: receita recorrente, faturamento, recebimento, valor a receber, caixa
e valor em negociação. São seis conceitos financeiros distintos, e tratá-los como
sinônimos produz erro grave.

### 3. Ficha técnica por indicador

Público: quem audita, reconcilia ou constrói em cima.

- fórmula, escrita como a operação a leria;
- sistema de origem e campo;
- frequência de atualização e como saber se está atrasado;
- cobertura conhecida e limitações;
- divergências registradas contra outras fontes.

### 4. Mapa de origem dos dados

- Quais sistemas alimentam o painel e o que cada um é fonte oficial de.
- Como o cliente do sistema comercial é ligado ao cliente do sistema financeiro,
  e por que o cruzamento nunca é feito por nome.
- O que é atualizado automaticamente, com que frequência, e o que depende de
  execução manual.

### 5. Perguntas frequentes

Construída a partir das dúvidas reais que aparecerem depois do compartilhamento.
Não faz sentido escrever antes: seria adivinhação.

## Material que já existe e pode ser reaproveitado

| Fonte | O que aproveitar |
| --- | --- |
| `analytics-vocabulary.mjs` | nomes canônicos, já com um conceito por nome |
| `analytics-kpi-contract.mjs` | as frases de limitação já estão em linguagem de negócio |
| `docs/reports/2026-08-07_kpi-discovery-e-lote-p0.md` | fórmulas, coortes, cobertura medida e divergências conhecidas |
| Migrations de read model | fonte da verdade das fórmulas; a documentação deve derivar delas, nunca duplicá-las à mão |

**O ponto mais importante da manutenção:** a ficha técnica precisa ser gerada ou
verificada a partir do código, não escrita em paralelo. Documentação que diverge
do comportamento real é pior que documentação ausente, porque tem a aparência de
autoridade.

Uma opção a avaliar: um teste que falhe quando um indicador for publicado sem
entrada correspondente na documentação — o mesmo mecanismo que já impede rótulo
fora do glossário.

## Pré-requisitos

1. As cinco abas estabilizadas visualmente. Documentar tela que ainda vai mudar
   gera retrabalho.
2. A série histórica com алguns dias, para que os indicadores que hoje aparecem
   como "Aguardando histórico" tenham comportamento observável a descrever.
3. Definição de onde a documentação vive: dentro do produto, na Central de Ajuda
   já existente, ou em `docs/`. A escolha muda o formato.

## Decisões em aberto

- **Onde publicar.** A Central de Ajuda pública já existe no produto e seria o
  lugar natural para o guia de uso. A ficha técnica talvez deva ficar restrita.
- **Quem mantém.** Documentação sem dono envelhece em silêncio.
- **Idioma e público.** Se o painel for compartilhado fora da operação, o guia
  precisa assumir menos contexto do que assume hoje.
