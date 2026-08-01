import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import heroMountainUrl from '../../assets/build-journal/build-journal-hero-mountain-path.png';
import { cx } from '../../components/ui';
import { BuildJournalArchitecture } from './BuildJournalArchitecture';
import { BuildJournalAI } from './BuildJournalAI';
import { BuildJournalDocuments } from './BuildJournalDocuments';
import {
  buildJournalDefaultQuote,
  buildJournalPlaceholderPanels,
  buildJournalRecentDeliveries,
  buildJournalTabs,
  buildJournalTimelinePhases,
  type BuildJournalTab,
  type TimelineAccent,
  type TimelinePhase,
  type TimelineStatus,
} from './buildJournalContent';
import { BuildJournalQuoteFooter } from './BuildJournalQuoteFooter';

const accentClasses: Record<TimelineAccent, { bg: string; soft: string; text: string; border: string }> = {
  blue: {
    bg: 'bg-[#2D78F4]',
    soft: 'bg-[#EEF6FF]',
    text: 'text-[#2167DB]',
    border: 'border-[#D3E5FF]',
  },
  cyan: {
    bg: 'bg-[#27C6C5]',
    soft: 'bg-[#EEFCFC]',
    text: 'text-[#129094]',
    border: 'border-[#C8F2F2]',
  },
  orange: {
    bg: 'bg-[#FF8A16]',
    soft: 'bg-[#FFF6EC]',
    text: 'text-[#C85C00]',
    border: 'border-[#FFD9B5]',
  },
  pink: {
    bg: 'bg-[#F83D90]',
    soft: 'bg-[#FFF0F7]',
    text: 'text-[#D92C78]',
    border: 'border-[#FFD0E6]',
  },
  rose: {
    bg: 'bg-[#FF5F6D]',
    soft: 'bg-[#FFF1F3]',
    text: 'text-[#D93D4E]',
    border: 'border-[#FFD0D6]',
  },
  teal: {
    bg: 'bg-[#10B981]',
    soft: 'bg-[#EFFDF7]',
    text: 'text-[#0B8C62]',
    border: 'border-[#C8F0DF]',
  },
  violet: {
    bg: 'bg-[#8C54F7]',
    soft: 'bg-[#F7F2FF]',
    text: 'text-[#6D3BDD]',
    border: 'border-[#DACBFF]',
  },
};

const statusMeta: Record<TimelineStatus, { label: string; className: string; dot: string }> = {
  done: {
    label: 'Concluído',
    className: 'border-[#BDEDD8] bg-[#EFFDF7] text-[#0B8C62]',
    dot: 'text-[#0B8C62]',
  },
  progress: {
    label: 'Em andamento',
    className: 'border-[#CFE2FF] bg-[#F1F7FF] text-[#1458E8]',
    dot: 'text-[#1458E8]',
  },
  planned: {
    label: 'Planejado',
    className: 'border-[#FFD5B4] bg-[#FFF6EC] text-[#D05F00]',
    dot: 'text-[#D05F00]',
  },
};

function Icon({ name, className }: { name: string; className?: string }) {
  const base = cx('h-5 w-5', className);

  if (name === 'book') {
    return (
      <svg aria-hidden="true" className={base} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M4.8 6.2c2.8 0 5 .7 7.2 2.2 2.2-1.5 4.4-2.2 7.2-2.2v12.6c-2.8 0-5 .7-7.2 2.2-2.2-1.5-4.4-2.2-7.2-2.2V6.2Z" strokeLinejoin="round" />
        <path d="M12 8.4V21" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === 'calendar') {
    return (
      <svg aria-hidden="true" className={base} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M7 4v3M17 4v3M5.5 8.6h13M7.5 12.2h3M13.5 12.2h3M7.5 16h3" strokeLinecap="round" />
        <rect height="15" rx="2.2" width="15" x="4.5" y="5.5" />
      </svg>
    );
  }

  if (name === 'clipboard') {
    return (
      <svg aria-hidden="true" className={base} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M9 5.5h6M9.2 4h5.6a1.2 1.2 0 0 1 1.2 1.2v1.3H8V5.2A1.2 1.2 0 0 1 9.2 4Z" />
        <path d="M7 6.5H6a1.8 1.8 0 0 0-1.8 1.8v10A1.8 1.8 0 0 0 6 20h12a1.8 1.8 0 0 0 1.8-1.8v-10A1.8 1.8 0 0 0 18 6.5h-1" />
        <path d="M8 12h8M8 15.5h6" strokeLinecap="round" />
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

  if (name === 'database') {
    return (
      <svg aria-hidden="true" className={base} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M5 7.4c0-1.7 3.1-3.1 7-3.1s7 1.4 7 3.1-3.1 3.1-7 3.1-7-1.4-7-3.1Z" />
        <path d="M5 7.5v4.7c0 1.7 3.1 3 7 3s7-1.3 7-3V7.5M5 12.3V17c0 1.7 3.1 3 7 3s7-1.3 7-3v-4.7" />
      </svg>
    );
  }

  if (name === 'doc') {
    return (
      <svg aria-hidden="true" className={base} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M7 4.8h7l3 3v11.4H7A1.2 1.2 0 0 1 5.8 18V6A1.2 1.2 0 0 1 7 4.8Z" strokeLinejoin="round" />
        <path d="M14 5v3.5h3.5M8.5 12h6M8.5 15h4.5" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === 'download') {
    return (
      <svg aria-hidden="true" className={base} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M12 4v9.5M8.5 10 12 13.5 15.5 10M6 19h12" strokeLinecap="round" strokeLinejoin="round" />
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

  if (name === 'portal') {
    return (
      <svg aria-hidden="true" className={base} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M8 19v-2.6a4 4 0 0 1 8 0V19M12 11.6a3.1 3.1 0 1 0 0-6.2 3.1 3.1 0 0 0 0 6.2Z" />
        <path d="M5.5 20h13" strokeLinecap="round" />
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

  return (
    <svg aria-hidden="true" className={base} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M12 4.2 14.2 9l5.3.5-4 3.4 1.2 5.2-4.7-2.8-4.7 2.8 1.2-5.2-4-3.4L9.8 9 12 4.2Z" strokeLinejoin="round" />
    </svg>
  );
}

function StatusBadge({ status }: { status: TimelineStatus }) {
  const meta = statusMeta[status];

  return (
    <span className={cx('inline-flex items-center gap-2 rounded-[8px] border px-3 py-2 text-xs font-black', meta.className)}>
      <Icon className="h-4 w-4" name={status === 'planned' ? 'calendar' : 'shield'} />
      {meta.label}
    </span>
  );
}

function BuildJournalSectionTabs({
  activeTab,
  onTabChange,
}: {
  activeTab: BuildJournalTab;
  onTabChange: (tab: BuildJournalTab) => void;
}) {
  return (
    <nav className="grid w-full grid-cols-2 gap-1 md:grid-cols-3 xl:grid-cols-6">
      {buildJournalTabs.map((tab) => {
        const isActive = activeTab === tab.key;

        return (
          <button
            aria-pressed={isActive}
            className={cx(
              'min-h-12 min-w-0 rounded-[9px] border px-4 text-sm font-black transition-colors',
              isActive
                ? 'border-[#1458E8] bg-[#1458E8] text-white shadow-[0_12px_24px_rgba(20,88,232,0.20)]'
                : 'border-transparent text-[#33486B] hover:border-[#D9E6F7] hover:bg-[color:var(--color-surface-strong)]',
            )}
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            type="button"
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}

function FilterBar({
  area,
  onAreaChange,
  onPhaseChange,
  onQueryChange,
  onStatusChange,
  phase,
  query,
  status,
}: {
  area: string;
  onAreaChange: (value: string) => void;
  onPhaseChange: (value: string) => void;
  onQueryChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  phase: string;
  query: string;
  status: string;
}) {
  const selectClass =
    'h-12 rounded-[9px] border border-[#D9E6F7] bg-[color:var(--color-surface-strong)] px-4 text-sm font-semibold text-[#263B62] outline-none transition focus:border-[#1458E8] focus:ring-2 focus:ring-[#1458E8]/10';

  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)]">
      <select aria-label="Filtrar por fase" className={selectClass} onChange={(event) => onPhaseChange(event.target.value)} value={phase}>
        <option value="all">Todas as fases</option>
        {buildJournalTimelinePhases.map((item) => (
          <option key={item.id} value={item.id}>
            {item.title}
          </option>
        ))}
      </select>
      <select aria-label="Filtrar por status" className={selectClass} onChange={(event) => onStatusChange(event.target.value)} value={status}>
        <option value="all">Todos os status</option>
        <option value="done">Concluído</option>
        <option value="progress">Em andamento</option>
        <option value="planned">Planejado</option>
      </select>
      <select aria-label="Filtrar por área" className={selectClass} onChange={(event) => onAreaChange(event.target.value)} value={area}>
        <option value="all">Todas as áreas</option>
        {Array.from(new Set(buildJournalTimelinePhases.map((item) => item.area))).map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
      <label className="relative block">
        <Icon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7C8BA7]" name="search" />
        <input
          aria-label="Buscar marco, entrega ou documento"
          className="h-12 w-full rounded-[9px] border border-[#D9E6F7] bg-[color:var(--color-surface-strong)] pl-12 pr-4 text-sm font-semibold text-[#263B62] outline-none transition placeholder:text-[#8B9AB4] focus:border-[#1458E8] focus:ring-2 focus:ring-[#1458E8]/10"
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Buscar marco, entrega ou documento..."
          value={query}
        />
      </label>
    </section>
  );
}

function TimelineCard({ phase }: { phase: TimelinePhase }) {
  const accent = accentClasses[phase.accent];

  return (
    <article className="relative grid min-h-[156px] gap-5 rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[var(--shadow-sm)] lg:grid-cols-[132px_minmax(0,1fr)_170px_290px]">
      <div className="flex items-center gap-4 lg:justify-center">
        <span className={cx('absolute left-[32px] top-7 z-20 flex h-12 w-12 items-center justify-center rounded-full text-xl font-black text-white lg:left-[22px]', accent.bg)}>
          {phase.number}
        </span>
        <span className={cx('ml-16 flex h-[82px] w-[82px] shrink-0 items-center justify-center rounded-full border lg:ml-0', accent.soft, accent.border, accent.text)}>
          <Icon className="h-9 w-9" name={phase.icon} />
        </span>
      </div>

      <div className="min-w-0 self-center">
        <h2 className="text-lg font-black leading-6 tracking-[-0.01em] text-[#071641]">{phase.title}</h2>
        <p className="mt-2 text-sm font-semibold text-[#31476C]">{phase.period}</p>
        <p className="mt-3 max-w-[66ch] text-sm font-medium leading-6 text-[#41567A]">{phase.description}</p>
      </div>

      <div className="self-center lg:justify-self-end">
        <StatusBadge status={phase.status} />
      </div>

      <aside className="border-[#E3EBF6] lg:border-l lg:pl-6">
        <p className="text-sm font-black text-[#071641]">Documentos relacionados</p>
        <Link
          className="mt-3 flex min-h-10 items-center gap-3 rounded-[8px] border border-[#D9E6F7] bg-[color:var(--color-surface-strong)] px-3 text-xs font-black text-[#33486B] transition hover:border-[#1458E8]/35 hover:bg-[#F7FAFF]"
          to={`/admin/product-docs?doc=${encodeURIComponent(phase.document)}`}
        >
          <Icon className="h-4 w-4 shrink-0 text-[#5F74A0]" name="doc" />
          <span className="min-w-0 flex-1 break-all">{phase.document}</span>
          <span aria-hidden="true" className="text-[#5F74A0]">›</span>
        </Link>
        <p className="mt-3 text-sm font-black text-[#31476C]">+ {phase.extraDocuments} documentos</p>
      </aside>
    </article>
  );
}

function SummaryCards({ onShowOverview }: { onShowOverview: () => void }) {
  return (
    <section className="grid gap-5 lg:grid-cols-[1fr_1.25fr_1.25fr]">
      <article className="rounded-[16px] border border-[#D9E6F7] bg-[color:var(--color-surface-strong)] p-6 shadow-[0_14px_36px_rgba(31,67,125,0.06)]">
        <h2 className="text-lg font-black text-[#071641]">Resumo da construção</h2>
        <dl className="mt-6 space-y-4">
          {[
            ['Total de fases', '8'],
            ['Concluídas', '4'],
            ['Em andamento', '3'],
            ['Planejadas', '1'],
            ['Documentos relacionados', '26+'],
          ].map(([label, value]) => (
            <div className="flex items-center justify-between gap-4 text-sm" key={label}>
              <dt className="font-semibold text-[#41567A]">{label}</dt>
              <dd className="font-black text-[#071641]">{value}</dd>
            </div>
          ))}
        </dl>
        <button
          className="mt-6 flex h-11 w-full items-center justify-center gap-3 rounded-[8px] border border-[#D9E6F7] bg-[#F8FBFF] text-sm font-black text-[#1458E8]"
          onClick={onShowOverview}
          type="button"
        >
          Ver mapa da construção
          <span aria-hidden="true">→</span>
        </button>
      </article>

      <article className="rounded-[16px] border border-[#D9E6F7] bg-[color:var(--color-surface-strong)] p-6 shadow-[0_14px_36px_rgba(31,67,125,0.06)]">
        <h2 className="text-lg font-black text-[#071641]">Progresso geral</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-[132px_1fr]">
          <div className="relative h-[132px] w-[132px]">
            <svg aria-hidden="true" className="h-full w-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" fill="none" r="46" stroke="#E8EFF8" strokeWidth="14" />
              <circle cx="60" cy="60" fill="none" r="46" stroke="#2D78F4" strokeDasharray="182 289" strokeLinecap="round" strokeWidth="14" />
              <circle cx="60" cy="60" fill="none" r="46" stroke="#27C678" strokeDasharray="72 289" strokeDashoffset="-182" strokeLinecap="round" strokeWidth="14" />
              <circle cx="60" cy="60" fill="none" r="46" stroke="#FF8A16" strokeDasharray="35 289" strokeDashoffset="-254" strokeLinecap="round" strokeWidth="14" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-3xl font-black text-[#071641]">63%</span>
          </div>
          <div className="self-center space-y-4 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="font-semibold text-[#31476C]"><span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-[#27C678]" />Concluídas</span>
              <strong className="text-[#071641]">4 (50%)</strong>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="font-semibold text-[#31476C]"><span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-[#2D78F4]" />Em andamento</span>
              <strong className="text-[#071641]">3 (38%)</strong>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="font-semibold text-[#31476C]"><span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-[#FF8A16]" />Planejadas</span>
              <strong className="text-[#071641]">1 (12%)</strong>
            </div>
          </div>
        </div>
        <p className="mt-5 rounded-[10px] bg-[#F4F7FF] p-4 text-sm font-semibold leading-6 text-[#1F3A75]">
          Foco atual: finalizar acordos operacionais e avançar no portal e workspace técnico.
        </p>
      </article>

      <article className="rounded-[16px] border border-[#D9E6F7] bg-[color:var(--color-surface-strong)] p-6 shadow-[0_14px_36px_rgba(31,67,125,0.06)]">
        <h2 className="text-lg font-black text-[#071641]">Entregas recentes</h2>
        <ul className="mt-6 space-y-4">
          {buildJournalRecentDeliveries.map(([title, date]) => (
            <li className="flex items-center justify-between gap-4 text-sm" key={title}>
              <span className="flex items-center gap-3 font-semibold text-[#31476C]">
                <Icon className="h-4 w-4 text-[#0B8C62]" name="shield" />
                {title}
              </span>
              <span className="font-semibold text-[#5B6D8E]">{date}</span>
            </li>
          ))}
        </ul>
        <button
          aria-disabled="true"
          disabled
          className="mt-6 flex h-11 w-full cursor-not-allowed items-center justify-center gap-3 rounded-[8px] border border-[#D9E6F7] bg-[#F8FBFF] text-sm font-black text-[#1458E8]"
          title="Sem listagem completa nesta fase"
          type="button"
        >
          Ver todas as entregas
          <span aria-hidden="true">→</span>
        </button>
      </article>
    </section>
  );
}

function OverviewPanel({
  activeTab,
  onTabChange,
}: {
  activeTab: BuildJournalTab;
  onTabChange: (tab: BuildJournalTab) => void;
}) {
  const overviewCards = [
    {
      title: 'Visão geral',
      icon: 'spark',
      accent: 'text-[#F83D90] bg-[#FFF0F7]',
      body:
        'O Genius Support OS nasceu da dor real de um suporte descentralizado, sem histórico confiável e com conhecimento espalhado.',
      detail:
        'Nosso objetivo é construir uma plataforma interna que centraliza suporte, conhecimento, comunicação, engenharia e operação com segurança, rastreabilidade e escala.',
    },
    {
      title: 'Como ler este diário',
      icon: 'shield',
      accent: 'text-[#1458E8] bg-[#EEF6FF]',
      list: [
        'Comece pelo problema e a visão do produto',
        'Entenda as decisões e a arquitetura',
        'Acompanhe a evolução por fases',
        'Acesse os documentos oficiais detalhados',
        'Volte sempre que precisar explicar o produto',
      ],
    },
    {
      title: 'Princípios que guiam tudo o que construímos',
      icon: 'shield',
      accent: 'text-[#0B8C62] bg-[#EFFDF7]',
      list: [
        'Plataforma como fonte oficial',
        'Escopo de cliente desde o início',
        'Segurança, auditoria e acesso primeiro',
        'IA assiste, não decide',
        'Processos claros e documentação viva',
      ],
    },
  ];

  const architectureLayers = [
    ['Frontend', 'Renderiza informação e envia comandos', 'monitor', 'violet'],
    ['Leituras', 'Consulta segura por leituras governadas', 'spark', 'cyan'],
    ['Ações', 'Operações controladas com regras de negócio', 'code', 'violet'],
    ['PostgreSQL', 'Banco relacional transacional e confiável', 'database', 'blue'],
    ['Acesso', 'Segurança por cliente e permissão', 'shield', 'teal'],
    ['Audit Logs', 'Rastreabilidade e trilha de auditoria', 'clipboard', 'blue'],
    ['Documentos', 'Governança, políticas e fonte da verdade', 'book', 'violet'],
  ] as const;

  const documentCards = [
    ['Produto e Visão', 'Visão, roadmap e estado do produto.', '3 documentos', 'pink', 'spark'],
    ['Arquitetura operacional', 'Regras arquiteturais, acordos e contexto.', '3 documentos', 'violet', 'code'],
    ['Segurança e IA', 'Governança de IA, segurança e runbooks.', '2 documentos', 'teal', 'shield'],
    ['Suporte e Operação', 'Fluxos, workspace, perfil de cliente e anexos.', '4 documentos', 'orange', 'headset'],
    ['Knowledge e Docs', 'Estratégia, governança editorial e checkpoint.', '3 documentos', 'violet', 'book'],
    ['Portal do Cliente', 'Acesso, contexto, busca, anexos e colaboração.', '5 documentos', 'blue', 'portal'],
    ['Engenharia', 'Workspace técnico e handoff.', '1 documento', 'blue', 'code'],
    ['Design System', 'Padrões visuais, cores, tipografia e componentes.', '1 documento', 'pink', 'spark'],
  ] as const;

  const nextSteps = [
    ['Onboarding interno', 'Guia e trilha para novos membros do time.'],
    ['Whitelist documental', 'Ampliação segura da biblioteca oficial.'],
    ['Navegação por trilhas', 'Melhorar a descoberta dos conteúdos.'],
    ['Prints sanitizados', 'Catálogo visual do produto para time e clientes.'],
    ['IA assistiva futura', 'Assistente com contexto oficial e citações.'],
    ['Documentação viva', 'Evolução contínua por fase e melhoria.'],
  ] as const;

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[2rem] font-black leading-10 tracking-[-0.01em] text-[#071641]">Diário de Construção</h1>
          <p className="mt-1 text-base font-semibold text-[#20375F]">A história por trás do Genius Support OS</p>
        </div>
        <span className="inline-flex min-h-10 items-center gap-3 rounded-[10px] border border-[#D9E6F7] bg-[#F7FAFF] px-5 text-sm font-black text-[#1458E8]">
          <Icon className="h-4 w-4" name="shield" />
          Área documental interna
        </span>
      </header>

      <section className="relative min-h-[320px] overflow-hidden rounded-[18px] border border-[#CFE0F7] bg-[#F4F8FF] shadow-[0_18px_45px_rgba(31,67,125,0.08)]">
        <img
          alt=""
          aria-hidden="true"
          className="absolute inset-y-0 right-0 h-full w-[72%] object-cover object-right"
          src={heroMountainUrl}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#F8FBFF_0%,#F8FBFF_35%,rgba(248,251,255,0.78)_52%,rgba(248,251,255,0.12)_100%)]" />
        <div className="relative z-10 max-w-[560px] px-9 py-10">
          <h2 className="text-[2rem] font-black leading-[1.12] tracking-[-0.02em] text-[#071641]">
            Da dor operacional à plataforma CX B2B técnica
          </h2>
          <p className="mt-5 text-base font-semibold leading-8 text-[#20375F]">
            Entenda como transformamos problemas reais de suporte em uma plataforma segura, escalável e centrada na operação.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <button
              className="inline-flex min-h-12 items-center justify-center rounded-[9px] bg-[#1458E8] px-6 text-sm font-black text-white shadow-[0_14px_28px_rgba(20,88,232,0.22)]"
              onClick={() => onTabChange('timeline')}
              type="button"
            >
              Começar leitura guiada <span className="ml-2">→</span>
            </button>
            <Link
              className="inline-flex min-h-12 items-center justify-center gap-3 rounded-[9px] border border-[#BFD4F3] bg-[color:var(--color-surface-strong)] px-6 text-sm font-black text-[#1458E8]"
              to="/admin/product-docs"
            >
              Abrir documentos do produto <Icon className="h-4 w-4" name="doc" />
            </Link>
          </div>
        </div>
        {[
          ['Visão', 'right-[22%] top-[26%]'],
          ['Arquitetura', 'right-[31%] top-[40%]'],
          ['Execução', 'right-[40%] top-[57%]'],
          ['Governança', 'right-[35%] top-[73%]'],
          ['Impacto', 'right-[45%] top-[84%]'],
        ].map(([label, position]) => (
          <span
            className={cx('absolute z-10 rounded-[8px] bg-[color:var(--color-surface-strong)] px-4 py-2 text-xs font-black text-[#20375F] shadow-[0_10px_24px_rgba(31,67,125,0.12)]', position)}
            key={label}
          >
            {label}
          </span>
        ))}
        <div className="absolute bottom-10 right-12 z-10 hidden h-28 w-40 rounded-[16px] bg-[#1D6BFF]/80 shadow-[0_20px_40px_rgba(20,88,232,0.30)] xl:block">
          <div className="mx-5 mt-5 flex gap-2">
            <span className="h-2 w-2 rounded-full bg-[color:var(--color-surface-strong)]/70" />
            <span className="h-2 w-2 rounded-full bg-[color:var(--color-surface-strong)]/70" />
            <span className="h-2 w-2 rounded-full bg-[color:var(--color-surface-strong)]/70" />
          </div>
          <div className="mx-5 mt-5 h-3 rounded-full bg-[color:var(--color-surface-strong)]/35" />
          <div className="mx-5 mt-4 h-3 w-24 rounded-full bg-[color:var(--color-surface-strong)]/25" />
        </div>
        <div className="absolute bottom-8 right-5 z-20 hidden h-24 w-36 rotate-[-2deg] items-center justify-center rounded-[12px] border border-white/30 bg-[#236EFF] text-3xl font-black text-white shadow-[0_16px_30px_rgba(20,88,232,0.28)] xl:flex">
          {'</>'}
        </div>
      </section>

      <div className="rounded-[14px] border border-[#D9E6F7] bg-[color:var(--color-surface-strong)] shadow-[0_12px_30px_rgba(31,67,125,0.05)]">
        <div className="flex flex-wrap justify-between gap-1 px-4 py-0">
          <BuildJournalSectionTabs activeTab={activeTab} onTabChange={onTabChange} />
        </div>
      </div>

      <section className="grid gap-5 lg:grid-cols-3">
        {overviewCards.map((card) => (
          <article className="grid grid-cols-[42px_1fr] gap-4 rounded-[16px] border border-[#D9E6F7] bg-[color:var(--color-surface-strong)] p-6 shadow-[0_12px_30px_rgba(31,67,125,0.05)]" key={card.title}>
            <span className={cx('flex h-10 w-10 items-center justify-center rounded-full', card.accent)}>
              <Icon className="h-5 w-5" name={card.icon} />
            </span>
            <div>
              <h3 className="text-lg font-black text-[#071641]">{card.title}</h3>
              {'body' in card ? (
                <>
                  <p className="mt-3 text-sm font-bold leading-7 text-[#20375F]">{card.body}</p>
                  <p className="mt-3 text-sm font-semibold leading-7 text-[#31476C]">{card.detail}</p>
                </>
              ) : (
                <ul className="mt-4 space-y-3">
                  {card.list.map((item) => (
                    <li className="flex gap-3 text-sm font-bold text-[#20375F]" key={item}>
                      <Icon className="h-4 w-4 shrink-0 text-[#0B8C62]" name="shield" />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </article>
        ))}
      </section>

      <section className="rounded-[16px] border border-[#D9E6F7] bg-[color:var(--color-surface-strong)] p-6 shadow-[0_12px_30px_rgba(31,67,125,0.05)]">
        <h2 className="text-xl font-black text-[#071641]">Linha do tempo da construção</h2>
        <p className="mt-1 text-sm font-semibold text-[#31476C]">Principais marcos e entregas por fase</p>
        <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
          {buildJournalTimelinePhases.map((phaseItem, index) => {
            const accent = accentClasses[phaseItem.accent];
            return (
              <button
                className="relative flex flex-col items-center rounded-[14px] border border-transparent p-2 text-center transition hover:border-[#D9E6F7] hover:bg-[#F8FBFF]"
                key={phaseItem.id}
                onClick={() => onTabChange('timeline')}
                type="button"
              >
                {index < buildJournalTimelinePhases.length - 1 ? (
                  <span aria-hidden="true" className="absolute left-1/2 top-8 hidden h-[2px] w-full bg-[#1458E8]/50 2xl:block" />
                ) : null}
                <span className={cx('relative z-10 flex h-16 w-16 items-center justify-center rounded-full text-white ring-8 ring-[#F1F6FF]', accent.bg)}>
                  <Icon className="h-8 w-8" name={phaseItem.icon} />
                </span>
                <h3 className="mt-4 text-sm font-black text-[#071641]">{phaseItem.title}</h3>
                <p className="mt-2 min-h-[48px] text-xs font-semibold leading-5 text-[#41567A]">{phaseItem.description.split('.')[0]}</p>
                <StatusBadge status={phaseItem.status} />
              </button>
            );
          })}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)]">
        <article className="rounded-[16px] border border-[#D9E6F7] bg-[color:var(--color-surface-strong)] p-6 shadow-[0_12px_30px_rgba(31,67,125,0.05)]">
          <h2 className="text-xl font-black text-[#071641]">Arquitetura em camadas</h2>
          <p className="mt-1 text-sm font-semibold text-[#31476C]">Como os componentes se conectam para entregar valor</p>
          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
            {architectureLayers.map(([name, text, icon, accent], index) => {
              const color = accentClasses[accent as TimelineAccent];
              return (
                <div className="relative rounded-[13px] border border-[#D9E6F7] bg-[#FBFDFF] p-4 text-center" key={name}>
                  {index > 0 ? <span className="absolute -left-3 top-10 hidden text-[#1458E8] 2xl:block">→</span> : null}
                  <span className={cx('mx-auto flex h-12 w-12 items-center justify-center rounded-[12px]', color.soft, color.text)}>
                    <Icon className="h-7 w-7" name={icon} />
                  </span>
                  <h3 className="mt-4 text-sm font-black text-[#071641]">{name}</h3>
                  <p className="mt-2 text-xs font-semibold leading-5 text-[#41567A]">{text}</p>
                </div>
              );
            })}
          </div>
        </article>

        <article className="rounded-[16px] border border-[#D9E6F7] bg-[color:var(--color-surface-strong)] p-6 shadow-[0_12px_30px_rgba(31,67,125,0.05)]">
          <h2 className="text-lg font-black text-[#071641]">Benefícios dessa arquitetura</h2>
          <ul className="mt-6 space-y-4">
            {['Segregação clara de responsabilidades', 'Segurança aplicada em todas as camadas', 'Escalabilidade com governança', 'Rastreabilidade ponta a ponta', 'Base sólida para IA no futuro'].map((item) => (
              <li className="flex gap-3 text-sm font-bold text-[#20375F]" key={item}>
                <Icon className="h-5 w-5 shrink-0 text-[#0B8C62]" name="shield" />
                {item}
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="rounded-[16px] border border-[#D9E6F7] bg-[color:var(--color-surface-strong)] p-6 shadow-[0_12px_30px_rgba(31,67,125,0.05)]">
        <h2 className="text-xl font-black text-[#071641]">IA na construção</h2>
        <p className="mt-1 text-sm font-semibold text-[#31476C]">Como ChatGPT e Codex aceleram a construção com responsabilidade</p>
        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.05fr)]">
          {[
            ['ChatGPT', 'Raciocínio e estratégia', ['Visão do produto, arquitetura e decisões', 'Especificações, acordos e revisão crítica', 'Documentação, prompts e raciocínio'], 'teal', 'spark'],
            ['Codex', 'Execução e entrega', ['Implementação de código e refatoração', 'Testes automatizados e validação', 'Scripts, migrations e documentação técnica'], 'blue', 'code'],
            ['IA futura', 'Assistente operacional', ['Respostas com base oficial e citável', 'Contexto operacional e histórico seguro', 'Assistência que não substitui pessoas'], 'pink', 'spark'],
          ].map(([title, subtitle, items, accent, icon]) => {
            const color = accentClasses[accent as TimelineAccent];
            return (
              <article className="rounded-[14px] border border-[#D9E6F7] bg-[#FBFDFF] p-5" key={title as string}>
                <span className={cx('flex h-12 w-12 items-center justify-center rounded-full', color.soft, color.text)}>
                  <Icon className="h-7 w-7" name={icon as string} />
                </span>
                <h3 className="mt-4 text-base font-black text-[#071641]">{title as string}</h3>
                <p className="mt-1 text-xs font-black text-[#1458E8]">{subtitle as string}</p>
                <ul className="mt-4 space-y-3">
                  {(items as string[]).map((item) => (
                    <li className="text-xs font-semibold leading-5 text-[#31476C]" key={item}>• {item}</li>
                  ))}
                </ul>
              </article>
            );
          })}
          <article className="rounded-[14px] border border-[#BFD4F3] bg-[linear-gradient(135deg,#F5F8FF,#FFFFFF)] p-6">
            <h3 className="text-lg font-black leading-7 text-[#071641]">IA assiste. Pessoas decidem. Documentação governa.</h3>
            <p className="mt-5 text-sm font-semibold leading-7 text-[#31476C]">
              Plataforma, acordos e documentação versionada continuam sendo a fonte oficial.
            </p>
          </article>
        </div>
      </section>

      <section className="rounded-[16px] border border-[#D9E6F7] bg-[color:var(--color-surface-strong)] p-6 shadow-[0_12px_30px_rgba(31,67,125,0.05)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-[#071641]">Documentos oficiais</h2>
            <p className="mt-1 text-sm font-semibold text-[#31476C]">Acesse os documentos que guiam o Genius Support OS</p>
          </div>
          <Link className="rounded-[10px] bg-[#F2F7FF] px-5 py-3 text-sm font-black text-[#1458E8]" to="/admin/product-docs">
            Ver todos em Documentos do Produto →
          </Link>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {documentCards.map(([title, text, count, accent, icon]) => {
            const color = accentClasses[accent as TimelineAccent];
            return (
              <Link className="grid grid-cols-[48px_1fr_32px] gap-4 rounded-[14px] border border-[#D9E6F7] bg-[#FBFDFF] p-4 hover:border-[#1458E8]/35" key={title} to="/admin/product-docs">
                <span className={cx('flex h-12 w-12 items-center justify-center rounded-full', color.soft, color.text)}>
                  <Icon className="h-7 w-7" name={icon} />
                </span>
                <span>
                  <strong className="block text-sm font-black text-[#071641]">{title}</strong>
                  <span className="mt-1 block text-xs font-black text-[#1458E8]">{count}</span>
                  <span className="mt-1 block text-xs font-semibold leading-5 text-[#41567A]">{text}</span>
                </span>
                <span className="self-center rounded-[8px] border border-[#D9E6F7] bg-[color:var(--color-surface-strong)] py-2 text-center text-[#1458E8]">→</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="rounded-[16px] border border-[#D9E6F7] bg-[color:var(--color-surface-strong)] p-6 shadow-[0_12px_30px_rgba(31,67,125,0.05)]">
        <h2 className="text-xl font-black text-[#071641]">Próximos passos</h2>
        <p className="mt-1 text-sm font-semibold text-[#31476C]">O que vem pela frente no Genius Support OS</p>
        <div className="mt-6 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          {nextSteps.map(([title, text]) => (
            <article className="rounded-[13px] border border-[#D9E6F7] bg-[#FBFDFF] p-4" key={title}>
              <h3 className="text-sm font-black text-[#071641]">{title}</h3>
              <p className="mt-2 text-xs font-semibold leading-5 text-[#41567A]">{text}</p>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

function SimpleDocumentPanel({
  activeTab,
  onShowTimeline,
}: {
  activeTab: 'next';
  onShowTimeline: () => void;
}) {
  const content = buildJournalPlaceholderPanels[activeTab];

  return (
    <section className="rounded-[18px] border border-[#D9E6F7] bg-[color:var(--color-surface-strong)] p-7 shadow-[0_14px_36px_rgba(31,67,125,0.06)]">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div>
          <span className="text-xs font-black uppercase tracking-[0.22em] text-[#1458E8]">Diário de Construção</span>
          <h2 className="mt-3 text-[1.6rem] font-black leading-tight text-[#071641]">{content.title}</h2>
          <p className="mt-4 text-base font-semibold leading-8 text-[#31476C]">{content.description}</p>
          <button
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-[10px] bg-[#1458E8] px-5 text-sm font-black text-white shadow-[0_12px_24px_rgba(20,88,232,0.18)]"
            onClick={onShowTimeline}
            type="button"
          >
            {content.action}
          </button>
        </div>
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
          {content.items.map((item, index) => (
            <article className="rounded-[14px] border border-[#D9E6F7] bg-[#F8FBFF] p-5" key={item}>
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EEF6FF] text-sm font-black text-[#1458E8]">
                {index + 1}
              </span>
              <p className="mt-4 text-sm font-bold leading-7 text-[#31476C]">{item}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function BuildJournalPage() {
  const [activeTab, setActiveTab] = useState<BuildJournalTab>('overview');
  const [phase, setPhase] = useState('all');
  const [status, setStatus] = useState('all');
  const [area, setArea] = useState('all');
  const [query, setQuery] = useState('');
  const isTimelineTab = activeTab === 'timeline';
  const isArchitectureTab = activeTab === 'architecture';
  const isAITab = activeTab === 'ai';
  const isDocsTab = activeTab === 'docs';
  const activeTabLabel = buildJournalTabs.find((tab) => tab.key === activeTab)?.label ?? 'Visão geral';
  const showTimelineHeader = activeTab !== 'overview';

  const filteredPhases = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR');

    return buildJournalTimelinePhases.filter((item) => {
      const matchesPhase = phase === 'all' || item.id === phase;
      const matchesStatus = status === 'all' || item.status === status;
      const matchesArea = area === 'all' || item.area === area;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [item.title, item.description, item.document, item.period, item.area]
          .join(' ')
          .toLocaleLowerCase('pt-BR')
          .includes(normalizedQuery);

      return matchesPhase && matchesStatus && matchesArea && matchesQuery;
    });
  }, [area, phase, query, status]);

  return (
    <main className="h-full min-h-0 overflow-y-auto overflow-x-hidden rounded-[22px] bg-[#F8FBFF] text-[#071641]">
      <div className="mx-auto w-full max-w-[1460px] space-y-6 p-6 pb-8">
        {showTimelineHeader ? (
          <header className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm font-semibold text-[#496186]">
                <Link className="text-[#1458E8]" to="/admin">Administração</Link>
                <span aria-hidden="true">›</span>
                <button className="text-[#1458E8]" onClick={() => setActiveTab('overview')} type="button">Diário de Construção</button>
                <span aria-hidden="true">›</span>
                <span className="font-black text-[#071641]">{activeTabLabel}</span>
              </nav>
              {isTimelineTab || isArchitectureTab || isAITab ? (
                <button
                  aria-disabled="true"
                  disabled
                  className="inline-flex min-h-12 cursor-not-allowed items-center gap-3 rounded-[10px] border border-[#D9E6F7] bg-[color:var(--color-surface-strong)] px-5 text-sm font-black text-[#071641] shadow-[0_10px_24px_rgba(31,67,125,0.05)]"
                  title="Exportação ainda indisponível nesta fase"
                  type="button"
                >
                  <Icon className="h-4 w-4 text-[#1458E8]" name="download" />
                  {isArchitectureTab ? 'Exportar arquitetura' : isAITab ? 'Exportar página' : 'Exportar linha do tempo'}
                </button>
              ) : null}
            </div>

            <div className="space-y-5">
              <div>
                <h1 className="text-[2rem] font-black leading-10 tracking-[-0.01em] text-[#071641]">
                  {isTimelineTab
                    ? 'Linha do tempo da construção'
                    : isArchitectureTab
                      ? 'Arquitetura do Genius Support OS'
                      : isAITab
                        ? 'IA na Construção'
                        : isDocsTab
                          ? 'Documentos oficiais'
                          : activeTabLabel}
                </h1>
                <p className="mt-2 text-base font-semibold text-[#31476C]">
                  {isTimelineTab
                    ? 'Principais marcos e entregas por fase'
                    : isArchitectureTab
                      ? 'Como o sistema funciona por camadas, acordos e limites'
                      : isAITab
                        ? 'Usamos IA para acelerar raciocínio, execução e documentação sem abrir mão de governança, acordos reais e decisão humana.'
                        : isDocsTab
                          ? 'Fontes versionadas, sanitizadas e controladas que sustentam a construção do Genius Support OS.'
                          : 'Conteúdo documental interno conectado à evolução do produto'}
                </p>
              </div>
              <div className="rounded-[14px] border border-[#D9E6F7] bg-[color:var(--color-surface-strong)] p-1 shadow-[0_12px_30px_rgba(31,67,125,0.05)]">
                <BuildJournalSectionTabs activeTab={activeTab} onTabChange={setActiveTab} />
              </div>
            </div>
          </header>
        ) : null}

        {isTimelineTab ? (
          <>
            <FilterBar
              area={area}
              onAreaChange={setArea}
              onPhaseChange={setPhase}
              onQueryChange={setQuery}
              onStatusChange={setStatus}
              phase={phase}
              query={query}
              status={status}
            />

            <section className="relative space-y-0">
              <span aria-hidden="true" className="absolute bottom-7 left-[46px] top-7 z-10 hidden w-[2px] bg-[#1458E8] lg:block" />
              {filteredPhases.length > 0 ? (
                <div className="space-y-0">
                  {filteredPhases.map((item) => (
                    <TimelineCard key={item.id} phase={item} />
                  ))}
                </div>
              ) : (
                <div className="rounded-[18px] border border-[#D9E6F7] bg-[color:var(--color-surface-strong)] p-10 text-center shadow-[0_14px_36px_rgba(31,67,125,0.06)]">
                  <p className="text-lg font-black text-[#071641]">Nenhum marco encontrado</p>
                  <p className="mt-2 text-sm font-semibold text-[#5B6D8E]">Ajuste os filtros para visualizar outras fases da construção.</p>
                </div>
              )}
            </section>

            <SummaryCards onShowOverview={() => setActiveTab('overview')} />
          </>
        ) : activeTab === 'overview' ? (
          <OverviewPanel activeTab={activeTab} onTabChange={setActiveTab} />
        ) : activeTab === 'architecture' ? (
          <BuildJournalArchitecture />
        ) : activeTab === 'ai' ? (
          <BuildJournalAI />
        ) : activeTab === 'docs' ? (
          <BuildJournalDocuments />
        ) : (
          <SimpleDocumentPanel activeTab={activeTab} onShowTimeline={() => setActiveTab('timeline')} />
        )}
        {activeTab === 'overview' || activeTab === 'timeline' ? (
          <BuildJournalQuoteFooter
            author={buildJournalDefaultQuote.author}
            quote={buildJournalDefaultQuote.quote}
          />
        ) : null}
      </div>
    </main>
  );
}
