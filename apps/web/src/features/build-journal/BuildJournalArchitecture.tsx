import type { ReactNode } from 'react';
import { cx } from '../../components/ui';
import { BuildJournalQuoteFooter } from './BuildJournalQuoteFooter';

type Tone = 'blue' | 'green' | 'pink' | 'violet' | 'orange' | 'cyan';

interface ToneClasses {
  bg: string;
  border: string;
  icon: string;
  soft: string;
}

const tones: Record<Tone, ToneClasses> = {
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
  orange: {
    bg: 'bg-[#FF8A16]',
    border: 'border-[#FFD9B5]',
    icon: 'text-[#C85C00]',
    soft: 'bg-[#FFF6EC]',
  },
  cyan: {
    bg: 'bg-[#27C6C5]',
    border: 'border-[#C8F2F2]',
    icon: 'text-[#129094]',
    soft: 'bg-[#EEFCFC]',
  },
};

const principleCards = [
  {
    title: 'Plataforma modular',
    text: 'Domínios independentes com acordos claros e evolução segura.',
    icon: 'cube',
    tone: 'blue',
  },
  {
    title: 'Fonte oficial',
    text: 'Regras, permissões e dados vivem na plataforma, não na interface.',
    icon: 'shield',
    tone: 'green',
  },
  {
    title: 'Segurança por design',
    text: 'Controle de acesso, identidade e auditoria desde o início em todas as camadas.',
    icon: 'lock',
    tone: 'pink',
  },
  {
    title: 'Acordo em primeiro',
    text: 'Leituras governadas e ações controladas. Sem acesso direto.',
    icon: 'contract',
    tone: 'violet',
  },
  {
    title: 'Operação B2B',
    text: 'Foco em suporte técnico, contexto do cliente e respostas com qualidade.',
    icon: 'users',
    tone: 'orange',
  },
] as const;

const architectureLayers = [
  {
    title: '1. Frontend (Aplicação Web)',
    subtitle: 'React + TypeScript + Vite',
    icon: 'monitor',
    tone: 'blue',
    items: ['Pages & Layouts', 'Componentes', 'Estado & Dados', 'UI Components', 'Navegação'],
  },
  {
    title: '2. Leituras governadas',
    subtitle: 'Superfície autorizada para consulta',
    icon: 'table',
    tone: 'green',
    items: ['Fila de tickets', 'Detalhe do ticket', 'Linha do tempo', 'Cliente 360', 'Outras leituras'],
  },
  {
    title: '3. Ações controladas',
    subtitle: 'Operações validadas pela plataforma',
    icon: 'code',
    tone: 'violet',
    items: ['Criar ticket', 'Atualizar status', 'Adicionar mensagem', 'Atribuir ticket', 'Outras ações'],
  },
  {
    title: '4. Plataforma de dados',
    subtitle: 'Base transacional e lógica de operação',
    icon: 'database',
    tone: 'blue',
    items: ['Tabelas', 'Funções', 'Triggers', 'Enums', 'Índices'],
  },
  {
    title: '5. Identidade e permissões',
    subtitle: 'Segurança, identidades e controle de acesso',
    icon: 'lock',
    tone: 'pink',
    items: ['Identidade', 'Regras de acesso', 'Papéis globais', 'Papéis por cliente', 'Vínculos'],
  },
  {
    title: '6. Auditoria & Observabilidade',
    subtitle: 'Trilhas, logs e rastreamento',
    icon: 'chart',
    tone: 'orange',
    items: ['audit_logs', 'ticket_events', 'Ações Admin', 'Health Checks', 'Métricas'],
  },
  {
    title: '7. Documentação & Conhecimento',
    subtitle: 'Base editorial e governança de conteúdo',
    icon: 'book',
    tone: 'green',
    items: ['Knowledge Base', 'Documentos Oficiais', 'Versionamento', 'Trilhas de Origem', 'Public Help'],
  },
] as const;

const architecturePrinciples = [
  'Plataforma como fonte oficial',
  'Leituras governadas e ações controladas',
  'Sem acesso direto às tabelas',
  'Controle de acesso em todas as camadas',
  'Auditoria ponta a ponta',
  'Escopo de cliente desde o início',
  'Modular, evolutivo e seguro',
  'Documentação como código',
  'IA como assistente, nunca fonte oficial',
  'Operação CX B2B técnica',
];

const boundaries = [
  ['Suporte', 'Operação de tickets, clientes, respostas e SLAs.', 'headset', 'blue'],
  ['Engenharia', 'Demandas técnicas, work items e devolutivas estruturadas.', 'code', 'violet'],
  ['Knowledge', 'Base editorial, artigos, categorias e governança de conteúdo.', 'book', 'green'],
  ['Portal do Cliente', 'Acesso autenticado do cliente B2B ao seu contexto.', 'users', 'orange'],
  ['Administração', 'Gestão de clientes, acessos, sistema e observabilidade.', 'shield', 'pink'],
] as const;

const dataFlow = [
  ['Usuário interage na interface', 'monitor'],
  ['Interface consulta leituras governadas', 'table'],
  ['Interface aciona operações controladas', 'code'],
  ['Plataforma aplica regras e persistência', 'database'],
  ['Eventos são registrados na auditoria', 'contract'],
  ['Dados retornam por leituras governadas', 'table'],
] as const;

const securityItems = [
  ['Identidade segura', 'Sessão e identidade controladas', 'lock'],
  ['Acesso ativo', 'Regras aplicadas em todas as áreas', 'shield'],
  ['Least Privilege', 'Acesso mínimo necessário', 'shield'],
  ['Isolamento por cliente', 'Dados isolados por cliente', 'shield'],
  ['Auditoria Completa', 'Todas as ações rastreadas', 'contract'],
] as const;

const techItems = [
  ['React', 'UI Library', 'atom'],
  ['TypeScript', 'Linguagem', 'ts'],
  ['Vite', 'Build Tool', 'vite'],
  ['Dados governados', 'Plataforma de dados', 'database'],
  ['PostgreSQL', 'Banco de Dados', 'database'],
] as const;

function ArchitectureIcon({ name, className }: { name: string; className?: string }) {
  const base = cx('h-5 w-5', className);

  if (name === 'atom') {
    return (
      <svg aria-hidden="true" className={base} fill="none" stroke="currentColor" strokeWidth="1.9" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="1.8" />
        <ellipse cx="12" cy="12" rx="8" ry="3.3" />
        <ellipse cx="12" cy="12" rx="8" ry="3.3" transform="rotate(60 12 12)" />
        <ellipse cx="12" cy="12" rx="8" ry="3.3" transform="rotate(120 12 12)" />
      </svg>
    );
  }

  if (name === 'book') {
    return (
      <svg aria-hidden="true" className={base} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M4.8 6.2c2.8 0 5 .7 7.2 2.2 2.2-1.5 4.4-2.2 7.2-2.2v12.6c-2.8 0-5 .7-7.2 2.2-2.2-1.5-4.4-2.2-7.2-2.2V6.2Z" strokeLinejoin="round" />
        <path d="M12 8.4V21" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === 'chart') {
    return (
      <svg aria-hidden="true" className={base} fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M5 19V9M10 19V5M15 19v-7M20 19V7" />
      </svg>
    );
  }

  if (name === 'code') {
    return (
      <svg aria-hidden="true" className={base} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
        <path d="m8.5 8-4 4 4 4M15.5 8l4 4-4 4M13.4 5.8l-2.8 12.4" />
      </svg>
    );
  }

  if (name === 'contract') {
    return (
      <svg aria-hidden="true" className={base} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M7 4.8h7l3 3v11.4H7A1.2 1.2 0 0 1 5.8 18V6A1.2 1.2 0 0 1 7 4.8Z" strokeLinejoin="round" />
        <path d="M14 5v3.5h3.5M8.5 12h6M8.5 15h4.5" strokeLinecap="round" />
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

  if (name === 'headset') {
    return (
      <svg aria-hidden="true" className={base} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M5 13v-1a7 7 0 0 1 14 0v1M5 13h3v5H6.5A1.5 1.5 0 0 1 5 16.5V13ZM19 13h-3v5h1.5a1.5 1.5 0 0 0 1.5-1.5V13ZM16 18c-.7 1.3-2 2-4 2" strokeLinecap="round" />
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

  if (name === 'monitor') {
    return (
      <svg aria-hidden="true" className={base} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <rect height="11" rx="1.8" width="17" x="3.5" y="5" />
        <path d="M8 20h8M12 16v4" strokeLinecap="round" />
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

  if (name === 'supabase') {
    return (
      <svg aria-hidden="true" className={base} fill="currentColor" viewBox="0 0 24 24">
        <path d="M13.3 2.8 4.7 13.2a.9.9 0 0 0 .7 1.5h5.2l-.7 6a.7.7 0 0 0 1.3.5l8.2-10.5a.9.9 0 0 0-.7-1.4h-5.1l.9-6a.7.7 0 0 0-1.2-.5Z" />
      </svg>
    );
  }

  if (name === 'table') {
    return (
      <svg aria-hidden="true" className={base} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <rect height="14" rx="1.8" width="16" x="4" y="5" />
        <path d="M4 10h16M9 10v9M15 10v9" />
      </svg>
    );
  }

  if (name === 'ts') {
    return (
      <svg aria-hidden="true" className={base} fill="currentColor" viewBox="0 0 24 24">
        <rect height="16" rx="2" width="16" x="4" y="4" />
        <path d="M7.3 9.3h6.1v1.6h-2.1v6H9.4v-6H7.3V9.3Zm7.1 5.5c.6.5 1.2.8 1.9.8.5 0 .8-.2.8-.6 0-.3-.2-.5-1.1-.9-1.2-.5-2-1.1-2-2.4 0-1.4 1.1-2.4 2.8-2.4.9 0 1.7.2 2.3.7l-.8 1.4c-.5-.3-1-.5-1.5-.5s-.8.2-.8.6c0 .3.3.5 1.2.9 1.3.5 1.9 1.2 1.9 2.4 0 1.5-1.1 2.5-2.9 2.5-1 0-2-.3-2.7-1l.9-1.5Z" fill="#fff" />
      </svg>
    );
  }

  if (name === 'users') {
    return (
      <svg aria-hidden="true" className={base} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M9.5 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM4.5 19a5 5 0 0 1 10 0M16 11.5a2.6 2.6 0 1 0 0-5.2M17 14.2a4.5 4.5 0 0 1 3.5 4.3" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === 'vite') {
    return (
      <svg aria-hidden="true" className={base} fill="currentColor" viewBox="0 0 24 24">
        <path d="m12 20.6 8.3-15.1a.7.7 0 0 0-.8-1L13 5.8 9.5 4.5a.7.7 0 0 0-.9.7L8.2 8l-3.7.8a.7.7 0 0 0-.4 1.1L12 20.6Z" />
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

function SectionCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cx('rounded-[18px] border border-[#D9E6F7] bg-[color:var(--color-surface-strong)] shadow-[0_14px_36px_rgba(31,67,125,0.06)]', className)}>
      {children}
    </section>
  );
}

function ArchitecturePrincipleCards() {
  return (
    <section className="grid gap-5 xl:grid-cols-5">
      {principleCards.map((card) => {
        const tone = tones[card.tone];
        return (
          <article className={cx('rounded-[16px] border bg-[color:var(--color-surface-strong)] p-6 shadow-[0_12px_30px_rgba(31,67,125,0.05)]', tone.border)} key={card.title}>
            <span className={cx('mx-auto flex h-16 w-16 items-center justify-center rounded-full', tone.soft, tone.icon)}>
              <ArchitectureIcon className="h-9 w-9" name={card.icon} />
            </span>
            <h2 className="mt-6 text-center text-base font-black text-[#071641]">{card.title}</h2>
            <p className="mt-3 text-sm font-semibold leading-7 text-[#20375F]">{card.text}</p>
          </article>
        );
      })}
    </section>
  );
}

function ArchitectureLayerStack() {
  return (
    <SectionCard className="p-6">
      <h2 className="text-xl font-black text-[#071641]">Arquitetura em camadas</h2>
      <p className="mt-1 text-sm font-semibold text-[#31476C]">Visão geral de como as camadas se conectam</p>

      <div className="mt-6 space-y-4">
        {architectureLayers.map((layer, index) => {
          const tone = tones[layer.tone];
          return (
            <div key={layer.title}>
              <article className={cx('grid gap-5 rounded-[14px] border p-5 md:grid-cols-[76px_1fr]', tone.border, tone.soft)}>
                <span className={cx('flex h-16 w-16 items-center justify-center rounded-[13px] text-white shadow-[0_12px_24px_rgba(20,88,232,0.18)]', tone.bg)}>
                  <ArchitectureIcon className="h-9 w-9" name={layer.icon} />
                </span>
                <div>
                  <h3 className="text-lg font-black text-[#071641]">{layer.title}</h3>
                  <p className="mt-1 text-sm font-bold text-[#20375F]">{layer.subtitle}</p>
                  <div className="mt-5 grid gap-3 md:grid-cols-5">
                    {layer.items.map((item) => (
                      <div className="text-center" key={item}>
                        <ArchitectureIcon className="mx-auto h-5 w-5 text-[#1D3470]" name={layer.icon === 'monitor' ? 'contract' : layer.icon} />
                        <p className="mt-2 text-[11px] font-black leading-4 text-[#1D3470]">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </article>
              {index < architectureLayers.length - 1 ? (
                <div className="flex h-8 items-center justify-center gap-8">
                  <span className="text-2xl font-black text-[#21B889]">↑</span>
                  <span className="text-2xl font-black text-[#6D3BDD]">↓</span>
                  {index >= 3 ? <span className="text-2xl font-black text-[#F83D90]">↓</span> : null}
                  {index >= 4 ? <span className="text-2xl font-black text-[#FF8A16]">↑</span> : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap gap-5 border-t border-[#E3EBF6] pt-4 text-sm font-black text-[#20375F]">
        <span><span className="mr-2 text-[#21B889]">↑</span>Leitura governada</span>
        <span><span className="mr-2 text-[#6D3BDD]">↓</span>Ação controlada</span>
        <span><span className="mr-2 text-[#FF8A16]">↑</span>Eventos / Auditoria</span>
        <span><span className="mr-2 text-[#F83D90]">↓</span>Identidade / acesso</span>
      </div>
    </SectionCard>
  );
}

function ArchitecturePrinciplesPanel() {
  return (
    <SectionCard className="p-6">
      <h2 className="text-xl font-black text-[#071641]">Princípios da arquitetura</h2>
      <p className="mt-1 text-sm font-semibold text-[#31476C]">Nossos pilares de construção</p>
      <ul className="mt-6 space-y-4">
        {architecturePrinciples.map((item) => (
          <li className="flex items-center gap-3 text-sm font-bold text-[#20375F]" key={item}>
            <ArchitectureIcon className="h-5 w-5 shrink-0 text-[#0B8C62]" name="shield" />
            {item}
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}

function ArchitectureBoundaryPanel() {
  return (
    <SectionCard className="p-6">
      <h2 className="text-xl font-black text-[#071641]">Boundaries entre domínios</h2>
          <p className="mt-1 text-sm font-semibold text-[#31476C]">Domínios separados com acordos próprios</p>
      <div className="mt-5 space-y-3">
        {boundaries.map(([title, description, icon, toneName]) => {
          const tone = tones[toneName as Tone];
          return (
            <article className={cx('grid grid-cols-[52px_1fr] gap-4 rounded-[14px] border p-4', tone.border, tone.soft)} key={title}>
              <span className={cx('flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--color-surface-strong)]', tone.icon)}>
                <ArchitectureIcon className="h-7 w-7" name={icon} />
              </span>
              <div>
                <h3 className="text-sm font-black text-[#071641]">{title}</h3>
                <p className="mt-1 text-sm font-semibold leading-6 text-[#20375F]">{description}</p>
              </div>
            </article>
          );
        })}
      </div>
    </SectionCard>
  );
}

function ArchitectureDataFlowPanel() {
  return (
    <SectionCard className="p-6">
      <h2 className="text-xl font-black text-[#071641]">Fluxo de dados resumido</h2>
      <p className="mt-1 text-sm font-semibold text-[#31476C]">Como as informações circulam</p>
      <ol className="mt-6 space-y-4">
        {dataFlow.map(([text, icon]) => (
          <li className="flex items-center gap-4 text-sm font-bold text-[#20375F]" key={text}>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] bg-[#EEF6FF] text-[#236EFF]">
              <ArchitectureIcon className="h-5 w-5" name={icon} />
            </span>
            {text}
          </li>
        ))}
      </ol>
    </SectionCard>
  );
}

function ArchitectureSecurityAndTechFooter() {
  return (
    <>
      <section className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
        <SectionCard className="p-6">
          <h2 className="text-lg font-black text-[#071641]">Segurança em todas as camadas</h2>
          <p className="mt-1 text-sm font-semibold text-[#31476C]">Proteções aplicadas de ponta a ponta</p>
          <div className="mt-6 grid gap-4 md:grid-cols-5">
            {securityItems.map(([title, text, icon]) => (
              <article className="rounded-[12px] border border-[#D9E6F7] bg-[#FBFDFF] p-3 text-center" key={title}>
                <ArchitectureIcon className="mx-auto h-7 w-7 text-[#236EFF]" name={icon} />
                <h3 className="mt-3 text-xs font-black text-[#071641]">{title}</h3>
                <p className="mt-1 text-[11px] font-semibold leading-4 text-[#41567A]">{text}</p>
              </article>
            ))}
          </div>
        </SectionCard>

        <SectionCard className="p-6">
          <h2 className="text-lg font-black text-[#071641]">Tecnologias principais</h2>
          <p className="mt-1 text-sm font-semibold text-[#31476C]">Stack utilizado na plataforma</p>
          <div className="mt-6 grid gap-4 md:grid-cols-5">
            {techItems.map(([title, text, icon]) => (
              <article className="rounded-[12px] border border-[#D9E6F7] bg-[#FBFDFF] p-4 text-center" key={title}>
                <ArchitectureIcon className="mx-auto h-8 w-8 text-[#236EFF]" name={icon} />
                <h3 className="mt-3 text-sm font-black text-[#071641]">{title}</h3>
                <p className="mt-1 text-[11px] font-semibold leading-4 text-[#41567A]">{text}</p>
              </article>
            ))}
          </div>
        </SectionCard>
      </section>

      <BuildJournalQuoteFooter
        author="Cada camada tem responsabilidade clara, acordo definido e controle de segurança. Assim garantimos evolutividade, qualidade e confiança em cada entrega."
        quote="Arquitetura feita para escalar com segurança"
        variant="architecture"
      />
    </>
  );
}

export function BuildJournalArchitecture() {
  return (
    <section className="space-y-6">
      <div className="flex justify-end">
        <div className="grid w-full max-w-[390px] grid-cols-2 rounded-[9px] border border-[#D9E6F7] bg-[color:var(--color-surface-strong)] p-1 shadow-[0_10px_24px_rgba(31,67,125,0.05)]">
          <button aria-pressed="true" className="min-h-11 rounded-[7px] bg-[#1458E8] px-4 text-sm font-black text-white shadow-[0_12px_24px_rgba(20,88,232,0.20)]" type="button">
            Visão geral
          </button>
          <button
            aria-disabled="true"
            aria-pressed="false"
            disabled
            className="min-h-11 cursor-not-allowed rounded-[7px] px-4 text-sm font-black text-[#33486B]"
            title="Detalhes técnicos ainda sem tela dedicada"
            type="button"
          >
            Detalhes técnicos
          </button>
        </div>
      </div>

      <ArchitecturePrincipleCards />

      <section className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">
        <ArchitectureLayerStack />
        <aside className="space-y-5">
          <ArchitecturePrinciplesPanel />
          <ArchitectureBoundaryPanel />
          <ArchitectureDataFlowPanel />
        </aside>
      </section>

      <ArchitectureSecurityAndTechFooter />
    </section>
  );
}
