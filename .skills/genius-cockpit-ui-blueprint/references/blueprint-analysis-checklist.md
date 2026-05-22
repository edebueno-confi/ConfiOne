# Blueprint Analysis Checklist

## Objetivo

Usar este checklist antes de escrever qualquer JSX, classe Tailwind ou variação de layout.

## Checklist

- Qual é a tarefa principal da tela?
- Qual informação precisa ser vista primeiro?
- Qual é a ação principal?
- O que é secundário?
- O que pode ficar no rail?
- O que deve virar drawer?
- O que está poluindo?
- Onde há duplicidade?
- Onde há risco de copy técnica?
- Onde pode haver vazamento de dado sensível?
- Quais elementos do blueprint são obrigatórios?
- Quais elementos são apenas ilustrativos?
- Quais estados faltam?

## Leitura operacional do blueprint

- Identificar a zona que governa a ação principal.
- Identificar a hierarquia visual real, não a ordem casual dos blocos.
- Marcar tudo o que parece decorativo, repetido ou administrativo demais.
- Separar o que precisa ficar fixo do que pode rolar internamente.
- Mapear onde o usuário decide, onde executa e onde só consulta contexto.

## Perguntas de risco

- O blueprint esconde a ação principal atrás de cards, tabs ou excesso de bordas?
- O blueprint sugere um dado que o contrato real não entrega?
- O blueprint mostra um CTA que ainda não tem RPC real?
- O blueprint expõe termos técnicos que precisam ser traduzidos para linguagem operacional?
- O blueprint depende de largura, altura ou densidade que podem quebrar em viewport menor?

## Saída mínima esperada

Antes de implementar, registrar:

- objetivo operacional da tela;
- zona principal;
- ação principal;
- blocos que serão removidos ou compactados;
- estados que precisam ser criados além do happy path;
- riscos de fidelidade, contrato ou permissão.
