import { cx } from '../../components/ui';
import { BuildJournalQuoteFooter } from './BuildJournalQuoteFooter';

type Tone = 'blue' | 'green' | 'pink' | 'violet';

const tones: Record<Tone, { bg: string; border: string; icon: string; soft: string }> = {
  blue: {
    bg: 'bg-[#236EFF]',
    border: 'border-[#CFE0FF]',
    icon: 'text-[#236EFF]',
    soft: 'bg-[#EEF6FF]',
  },
  green: {
    bg: 'bg-[#21B889]',
    border: 'border-[#C8F0DF]',
    icon: 'text-[#0B8C62]',
    soft: 'bg-[#EFFDF7]',
  },
  pink: {
    bg: 'bg-[#F83D90]',
    border: 'border-[#FFD0E6]',
    icon: 'text-[#D92C78]',
    soft: 'bg-[#FFF0F7]',
  },
  violet: {
    bg: 'bg-[#8C54F7]',
    border: 'border-[#DACBFF]',
    icon: 'text-[#6D3BDD]',
    soft: 'bg-[#F7F2FF]',
  },
};

const collaborationSteps = [
  {
    number: '1',
    title: 'Humano',
    subtitle: 'Decide o objetivo e contexto',
    tone: 'green',
    icon: 'user',
    items: ['Define problema ou necessidade', 'Traz contexto real do negócio', 'Consulta o GPT', 'Leva e traz informação entre as IAs'],
  },
  {
    number: '2',
    title: 'GPT',
    subtitle: 'Raciocina, estrutura e traduz',
    tone: 'violet',
    icon: 'spark',
    items: ['Interpreta a conversa em linguagem natural', 'Normaliza a demanda', 'Converte em prompt técnico para o Codex', 'Questiona riscos e inconsistências'],
  },
  {
    number: '3',
    title: 'Codex',
    subtitle: 'Executa a construção',
    tone: 'blue',
    icon: 'cube',
    items: ['Implementa código e mudanças técnicas', 'Cria ou ajusta telas, fluxos e acordos', 'Executa tarefas de construção', 'Retorna resultado técnico'],
  },
  {
    number: '4',
    title: 'Humano',
    subtitle: 'Valida, decide e direciona',
    tone: 'pink',
    icon: 'user',
    items: ['Analisa o retorno do Codex', 'Consulta novamente o GPT quando necessário', 'Aprova ou reprova', 'Mantém a decisão final e a responsabilidade'],
  },
] as const;

const capabilityCards = [
  {
    title: 'O que a IA faz hoje',
    subtitle: 'Apoio real ao time na construção e operação.',
    tone: 'green',
    items: [
      'Apoia raciocínio e tomada de decisão',
      'Estrutura prompts para o Codex',
      'Ajuda a revisar arquitetura, fluxo e UX',
      'Organiza documentação e diário de construção',
      'Acelera análise de retornos técnicos',
    ],
    note: 'IA é assistente do time. A decisão e a responsabilidade final são humanas.',
  },
  {
    title: 'O que a IA poderá fazer no produto',
    subtitle: 'Capacidades futuras, quando ativadas.',
    tone: 'blue',
    items: [
      'Resumos inteligentes de tickets e artigos longos',
      'Sugestão de artigos relacionados',
      'Detecção de lacunas e duplicidades de conteúdo',
      'Apoio à classificação e triagem inicial',
      'Respostas internas com citação explícita',
    ],
    note: 'Recursos futuros dependem de governança, curadoria e aprovação formal.',
  },
  {
    title: 'O que a IA não pode fazer',
    subtitle: 'Limites claros que não serão ultrapassados.',
    tone: 'pink',
    items: [
      'Inventar resposta ou informação',
      'Responder sem fonte ou sem citação',
      'Usar conteúdo draft sem aprovação',
      'Acessar conteúdo fora do cliente ou da permissão',
      'Expor playbook interno como se fosse público',
      'Publicar artigo automaticamente',
      'Misturar conteúdo público com operação interna',
    ],
    note: 'Limites existem para proteger confiança, privacidade e integridade.',
  },
] as const;

const governanceItems = [
  ['Base oficial', 'Só usa conteúdo versionado, classificado e auditável.', 'shield'],
  ['Escopo e permissão', 'Respeita cliente, papel e visibilidade.', 'lock'],
  ['Citação obrigatória', 'Toda resposta da IA deve citar a fonte aprovada.', 'search'],
  ['Auditoria', 'Prompt, contexto e fontes precisam ser rastreáveis.', 'clipboard'],
  ['Controle humano', 'Publicação, decisão editorial e mudanças sensíveis continuam humanas.', 'user'],
  ['Desligamento seletivo', 'Artigos podem sair da base de IA sem apagar histórico editorial.', 'database'],
] as const;

const currentState = [
  'Núcleo editorial da Knowledge materializado',
  'Corpus legado importado como draft e local-only',
  'Sem indexação em IA nesta fase',
  'IA ainda não está aberta sobre a base pública',
  'Curadoria humana necessária antes de qualquer exposição',
  'IA é assistente, nunca fonte de verdade',
];

const preconditions = [
  'Pipeline de curadoria humana aprovado',
  'Classificação editorial consistente',
  'Separação entre público, interno e restrito',
  'Política de citação e resposta aprovada',
  'Trilha de auditoria ponta a ponta',
];

function AIIcon({ name, className }: { name: string; className?: string }) {
  const base = cx('h-5 w-5', className);

  if (name === 'clipboard') {
    return (
      <svg aria-hidden="true" className={base} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M9 5.5h6M9.2 4h5.6a1.2 1.2 0 0 1 1.2 1.2v1.3H8V5.2A1.2 1.2 0 0 1 9.2 4Z" />
        <path d="M7 6.5H6a1.8 1.8 0 0 0-1.8 1.8v10A1.8 1.8 0 0 0 6 20h12a1.8 1.8 0 0 0 1.8-1.8v-10A1.8 1.8 0 0 0 18 6.5h-1" />
        <path d="M8 12h8M8 15.5h6" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === 'cube') {
    return (
      <svg aria-hidden="true" className={base} fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
        <path d="m12 3.8 7.2 4.1v8.2L12 20.2l-7.2-4.1V7.9L12 3.8Z" />
        <path d="M4.9 8 12 12.1 19.1 8M12 20v-7.9" />
      </svg>
    );
  }

  if (name === 'database') {
    return (
      <svg aria-hidden="true" className={base} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M5 7.4c0-1.7 3.1-3.1 7-3.1s7 1.4 7 3.1-3.1 3.1-7 3.1-7-1.4-7-3.1Z" />
        <path d="M5 7.5v4.7c0 1.7 3.1 3 7 3s7-1.3 7-3V7.5M5 12.3V17c0 1.7 3.1 3 7 3s7-1.3 7-3v-4.7" />
      </svg>
    );
  }

  if (name === 'lock') {
    return (
      <svg aria-hidden="true" className={base} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <rect height="10" rx="2" width="14" x="5" y="10" />
        <path d="M8 10V8a4 4 0 0 1 8 0v2M12 14v2.5" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === 'search') {
    return (
      <svg aria-hidden="true" className={base} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="10.8" cy="10.8" r="5.8" />
        <path d="m15.2 15.2 4.1 4.1" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === 'shield') {
    return (
      <svg aria-hidden="true" className={base} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M12 4.2 18.4 6v5.2c0 4-2.4 7-6.4 8.6-4-1.6-6.4-4.6-6.4-8.6V6L12 4.2Z" />
        <path d="m9.4 12.1 1.7 1.7 3.6-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (name === 'spark') {
    return (
      <svg aria-hidden="true" className={base} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M12 3.8c1.2 3.6 2.8 5.2 6.4 6.4-3.6 1.2-5.2 2.8-6.4 6.4-1.2-3.6-2.8-5.2-6.4-6.4 3.6-1.2 5.2-2.8 6.4-6.4Z" />
        <path d="M18.5 15.5c.5 1.4 1.1 2 2.5 2.5-1.4.5-2 1.1-2.5 2.5-.5-1.4-1.1-2-2.5-2.5 1.4-.5 2-1.1 2.5-2.5Z" />
      </svg>
    );
  }

  if (name === 'user') {
    return (
      <svg aria-hidden="true" className={base} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M12 12.3a3.8 3.8 0 1 0 0-7.6 3.8 3.8 0 0 0 0 7.6ZM5.2 20a6.8 6.8 0 0 1 13.6 0" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className={base} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="7" />
      <path d="m9.5 12 1.7 1.7 3.6-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckItem({ children, negative = false }: { children: string; negative?: boolean }) {
  return (
    <li className="flex gap-3 text-sm font-bold leading-6 text-[#20375F]">
      <span
        className={cx(
          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-black',
          negative ? 'border-[#FFB4C7] text-[#F83D90]' : 'border-[#AEE8D0] text-[#0B8C62]',
        )}
      >
        {negative ? '×' : '✓'}
      </span>
      {children}
    </li>
  );
}

function WorkflowCard({ step }: { step: (typeof collaborationSteps)[number] }) {
  const tone = tones[step.tone];
  return (
    <article className={cx('relative rounded-[16px] border bg-[color:var(--color-surface-strong)] p-6 shadow-[0_12px_30px_rgba(31,67,125,0.05)]', tone.border)}>
      <span className={cx('mx-auto flex h-20 w-20 items-center justify-center rounded-full', tone.soft, tone.icon)}>
        <AIIcon className="h-11 w-11" name={step.icon} />
      </span>
      <h3 className={cx('mt-5 text-center text-2xl font-black', tone.icon)}>
        {step.number}. {step.title}
      </h3>
      <p className="mt-2 text-center text-sm font-black text-[#20375F]">{step.subtitle}</p>
      <ul className="mt-7 space-y-4">
        {step.items.map((item) => (
          <CheckItem key={item}>{item}</CheckItem>
        ))}
      </ul>
    </article>
  );
}

function CapabilityCard({ card }: { card: (typeof capabilityCards)[number] }) {
  const tone = tones[card.tone];
  const negative = card.tone === 'pink';
  return (
    <article className={cx('rounded-[16px] border bg-[color:var(--color-surface-strong)] p-6 shadow-[0_12px_30px_rgba(31,67,125,0.05)]', tone.border)}>
      <h2 className="text-xl font-black text-[#071641]">{card.title}</h2>
      <p className="mt-2 text-sm font-semibold text-[#31476C]">{card.subtitle}</p>
      <ul className="mt-7 space-y-4">
        {card.items.map((item) => (
          <CheckItem key={item} negative={negative}>{item}</CheckItem>
        ))}
      </ul>
      <div className={cx('mt-7 flex gap-3 rounded-[12px] border p-4', tone.border, tone.soft)}>
        <AIIcon className={cx('h-7 w-7 shrink-0', tone.icon)} name={negative ? 'lock' : 'shield'} />
        <p className="text-sm font-black leading-6 text-[#20375F]">{card.note}</p>
      </div>
    </article>
  );
}

export function BuildJournalAI() {
  return (
    <section className="space-y-6">
      <section className="rounded-[18px] border border-[#D9E6F7] bg-[color:var(--color-surface-strong)] p-6 shadow-[0_14px_36px_rgba(31,67,125,0.06)]">
        <h2 className="text-2xl font-black text-[#071641]">Como funciona: Humano + GPT + Codex</h2>
        <p className="mt-2 text-sm font-semibold text-[#31476C]">Fluxo colaborativo com papéis claros, governança e responsabilidade humana.</p>
        <div className="mt-8 grid gap-8 xl:grid-cols-4">
          {collaborationSteps.map((step, index) => (
            <div className="relative" key={`${step.number}-${step.title}`}>
              <WorkflowCard step={step} />
              {index < collaborationSteps.length - 1 ? (
                <span className="absolute -right-6 top-[150px] hidden text-3xl font-black text-[#236EFF] xl:block">→</span>
              ) : null}
            </div>
          ))}
        </div>
        <div className="mt-7 flex items-center gap-4 rounded-[12px] border border-[#D9E6F7] bg-[#F7FAFF] px-5 py-4 text-sm font-black text-[#1458E8]">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#236EFF] text-white">i</span>
          O humano faz a interface entre as duas IAs. O GPT estrutura e orienta. O Codex executa.
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        {capabilityCards.map((card) => (
          <CapabilityCard card={card} key={card.title} />
        ))}
      </section>

      <section className="rounded-[18px] border border-[#D9E6F7] bg-[color:var(--color-surface-strong)] p-6 shadow-[0_14px_36px_rgba(31,67,125,0.06)]">
        <h2 className="text-2xl font-black text-[#071641]">Governança da IA na construção e na operação</h2>
        <p className="mt-2 text-sm font-semibold text-[#31476C]">Princípios que guiam como usamos IA com segurança, ética e auditabilidade.</p>
        <div className="mt-7 grid gap-5 md:grid-cols-3 xl:grid-cols-6">
          {governanceItems.map(([title, text, icon]) => (
            <article className="rounded-[14px] border border-[#D9E6F7] bg-[#FBFDFF] p-5 text-center" key={title}>
              <AIIcon className="mx-auto h-10 w-10 text-[#236EFF]" name={icon} />
              <h3 className="mt-4 text-sm font-black text-[#071641]">{title}</h3>
              <p className="mt-3 text-xs font-semibold leading-5 text-[#20375F]">{text}</p>
            </article>
          ))}
        </div>
        <div className="mt-7 flex items-center gap-4 rounded-[12px] border border-[#D9E6F7] bg-[#F7FAFF] px-5 py-4 text-sm font-black text-[#1458E8]">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#236EFF] text-white">i</span>
          Governança não é burocracia. É o que torna a IA útil, confiável e alinhada ao nosso produto e aos nossos clientes.
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <article className="rounded-[18px] border border-[#D9E6F7] bg-[color:var(--color-surface-strong)] p-6 shadow-[0_14px_36px_rgba(31,67,125,0.06)]">
          <h2 className="text-xl font-black text-[#071641]">Estado atual</h2>
          <p className="mt-2 text-sm font-semibold text-[#31476C]">Onde estamos agora em relação à IA.</p>
          <ul className="mt-6 space-y-3">
            {currentState.map((item) => (
              <CheckItem key={item}>{item}</CheckItem>
            ))}
          </ul>
          <div className="mt-6 flex gap-3 rounded-[12px] border border-[#D9E6F7] bg-[#F7FAFF] p-4 text-sm font-black leading-6 text-[#1458E8]">
            <AIIcon className="h-6 w-6 shrink-0" name="shield" />
            Cada passo será habilitado apenas quando o próximo critério de governança for concluído.
          </div>
        </article>

        <article className="rounded-[18px] border border-[#D9E6F7] bg-[color:var(--color-surface-strong)] p-6 shadow-[0_14px_36px_rgba(31,67,125,0.06)]">
          <h2 className="text-xl font-black text-[#071641]">Pré-condições para abrir IA sobre a Knowledge Base</h2>
          <p className="mt-2 text-sm font-semibold text-[#31476C]">Requisitos que precisam estar maduros antes de qualquer ativação.</p>
          <ol className="mt-6 space-y-4">
            {preconditions.map((item, index) => (
              <li className="flex gap-3 text-sm font-bold text-[#20375F]" key={item}>
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#236EFF] text-xs font-black text-white">{index + 1}</span>
                {item}
              </li>
            ))}
          </ol>
          <div className="mt-6 flex gap-3 rounded-[12px] border border-[#D9E6F7] bg-[#F7FAFF] p-4 text-sm font-black leading-6 text-[#1458E8]">
            <AIIcon className="h-6 w-6 shrink-0" name="shield" />
            Sem esses requisitos, a IA permanece bloqueada.
          </div>
        </article>
      </section>

      <BuildJournalQuoteFooter
        quote="IA amplia nossa capacidade de execução e clareza, mas a responsabilidade, a decisão e o produto final continuam sendo humanos, governados e auditáveis."
        variant="ai"
      />
    </section>
  );
}
