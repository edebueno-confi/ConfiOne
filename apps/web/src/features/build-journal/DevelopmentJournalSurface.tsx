import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { cx } from '../../components/ui';
import {
  buildJournalDocumentCategories,
  buildJournalRecentDeliveries,
  buildJournalTimelinePhases,
  type TimelinePhase,
  type TimelineStatus,
} from './buildJournalContent';

type JournalView = 'overview' | 'timeline' | 'decisions' | 'system';

const statusLabel: Record<TimelineStatus, string> = {
  done: 'Concluído',
  progress: 'Em andamento',
  planned: 'Planejado',
};

const phaseNotes: Record<string, { decision: string; evidence: string; next: string }> = {
  'origem-da-plataforma': {
    decision: 'Começar pela dor operacional real, sem transformar o produto em um CRM genérico.',
    evidence: 'Visão do produto e primeiros acordos de escopo.',
    next: 'Manter a origem como referência de prioridade, não como backlog infinito.',
  },
  'fundacao-segura': {
    decision: 'Permissões, escopo e leituras governadas vêm antes da automação e da experiência final.',
    evidence: 'Estratégia de Auth e Contexto + regras de arquitetura.',
    next: 'Revalidar cada nova superfície contra os contratos reais.',
  },
  'dashboard-principal': {
    decision: 'O Dashboard gerencial interno é a primeira entrega de produto a ganhar prioridade.',
    evidence: 'Estado do Projeto e read models dos domínios do Dashboard.',
    next: 'Consolidar dados, qualidade e performance antes de ampliar escopo.',
  },
  'central-de-ajuda': {
    decision: 'A Central de Ajuda externa acompanha o Dashboard como primeira publicação visível.',
    evidence: 'Superfícies publicadas e conteúdo editorial controlado.',
    next: 'Preservar o boundary público enquanto a plataforma interna amadurece.',
  },
  'cockpit-de-desenvolvimento': {
    decision: 'A construção ganhou um subsistema próprio para backlog, decisões, documentos e handoffs.',
    evidence: 'Painel de Desenvolvimento e contratos de tarefas internas.',
    next: 'Usar o cockpit para executar pequenas demandas com resultado e validação.',
  },
  'memoria-documental': {
    decision: 'Documentar o caminho é tão importante quanto registrar o resultado final.',
    evidence: 'Diário, catálogo documental e ledger de documentação.',
    next: 'Migrar fontes aprovadas e separar vigente, histórico e futuro.',
  },
  'qualidade-evolutiva': {
    decision: 'Qualidade, performance, banco e segurança entram como passagens curtas e evidenciadas.',
    evidence: 'Backlog de qualidade e checklist de validação.',
    next: 'Executar gates por risco, sem criar burocracia para cada ajuste.',
  },
  'saas-interno-futuro': {
    decision: 'A visão ampla permanece válida, mas não deve competir com a primeira entrega publicada.',
    evidence: 'Roadmap Buildout V3 e decisões de mudança de rota.',
    next: 'Retomar quando Dashboard, Central de Ajuda e base operacional estiverem maduros.',
  },
};

function phaseStatusClass(status: TimelineStatus) {
  return status === 'done' ? 'is-done' : status === 'progress' ? 'is-progress' : 'is-planned';
}

function PhaseRail({ activeId, onSelect }: { activeId: string; onSelect: (id: string) => void }) {
  return (
    <nav aria-label="Fases da construção" className="gso-journal-v2-rail">
      <div className="gso-journal-v2-rail-heading">
        <span>Rota do produto</span>
        <strong>08 fases</strong>
      </div>
      <div className="gso-journal-v2-phase-list">
        {buildJournalTimelinePhases.map((phase) => (
          <button
            aria-current={activeId === phase.id ? 'step' : undefined}
            className={cx('gso-journal-v2-phase', activeId === phase.id && 'is-active')}
            key={phase.id}
            onClick={() => onSelect(phase.id)}
            type="button"
          >
            <span className={cx('gso-journal-v2-phase-index', phaseStatusClass(phase.status))}>{String(phase.number).padStart(2, '0')}</span>
            <span className="gso-journal-v2-phase-copy">
              <strong>{phase.title}</strong>
              <small>{statusLabel[phase.status]} · {phase.period}</small>
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}

function PhaseStage({ phase }: { phase: TimelinePhase }) {
  const notes = phaseNotes[phase.id];

  return (
    <section aria-labelledby="journal-phase-title" className="gso-journal-v2-stage">
      <div className="gso-journal-v2-stage-kicker">
        <span>Fase {String(phase.number).padStart(2, '0')}</span>
        <span className={cx('gso-journal-v2-status', phaseStatusClass(phase.status))}>{statusLabel[phase.status]}</span>
        <span>{phase.area}</span>
      </div>
      <div className="gso-journal-v2-stage-title">
        <div>
          <h2 id="journal-phase-title">{phase.title}</h2>
          <p>{phase.description}</p>
        </div>
        <div className="gso-journal-v2-stage-number">{String(phase.number).padStart(2, '0')}</div>
      </div>

      <div className="gso-journal-v2-decision">
        <span className="gso-journal-v2-label">Decisão que moveu esta fase</span>
        <p>{notes.decision}</p>
      </div>

      <div className="gso-journal-v2-stage-grid">
        <article>
          <span className="gso-journal-v2-label">Evidência</span>
          <strong>{notes.evidence}</strong>
          <Link to={`/admin/product-docs?surface=development&doc=${phase.document}`}>Abrir fonte relacionada →</Link>
        </article>
        <article>
          <span className="gso-journal-v2-label">Próximo movimento</span>
          <strong>{notes.next}</strong>
          <span className="gso-journal-v2-muted">Registrado como direção, não como promessa de entrega.</span>
        </article>
      </div>
    </section>
  );
}

function TimelineView({ onSelect }: { onSelect: (id: string) => void }) {
  return (
    <section className="gso-journal-v2-timeline-view">
      <div className="gso-journal-v2-section-head">
        <div>
          <span className="gso-journal-v2-label">Linha do tempo</span>
          <h2>O produto não chegou aqui em linha reta.</h2>
        </div>
        <span className="gso-journal-v2-muted">Selecione uma fase para abrir o contexto.</span>
      </div>
      <div className="gso-journal-v2-timeline-list">
        {buildJournalTimelinePhases.map((phase) => (
          <button className="gso-journal-v2-timeline-row" key={phase.id} onClick={() => onSelect(phase.id)} type="button">
            <span className={cx('gso-journal-v2-timeline-dot', phaseStatusClass(phase.status))} />
            <span className="gso-journal-v2-timeline-date">{phase.period}</span>
            <span className="gso-journal-v2-timeline-title">{phase.title}</span>
            <span className="gso-journal-v2-timeline-area">{phase.area}</span>
            <span className="gso-journal-v2-timeline-arrow">→</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function DecisionsView() {
  const decisions = buildJournalTimelinePhases.filter((phase) => phaseNotes[phase.id]).map((phase) => ({ phase, note: phaseNotes[phase.id].decision }));

  return (
    <section className="gso-journal-v2-decision-view">
      <div className="gso-journal-v2-section-head">
        <div>
          <span className="gso-journal-v2-label">Decisões de rota</span>
          <h2>O que foi decidido e por quê.</h2>
        </div>
        <span className="gso-journal-v2-muted">Contexto curto para orientar a próxima demanda.</span>
      </div>
      <div className="gso-journal-v2-decision-list">
        {decisions.map(({ phase, note }) => (
          <article key={phase.id}>
            <span>{String(phase.number).padStart(2, '0')}</span>
            <div><strong>{phase.title}</strong><p>{note}</p></div>
          </article>
        ))}
      </div>
    </section>
  );
}

function SystemView() {
  const items = [
    ['Interface', 'React + TypeScript', 'Renderiza o cockpit e as superfícies operacionais.'],
    ['Dados', 'PostgreSQL + Supabase', 'Views e RPCs reais são a fonte das leituras e ações.'],
    ['Acesso', 'Auth + RLS + escopo', 'Permissões são decididas no backend, não na interface.'],
    ['Memória', 'Markdown + catálogo', 'Documentos oficiais e histórico curto convivem sem duplicação.'],
  ];

  return (
    <section className="gso-journal-v2-system-view">
      <div className="gso-journal-v2-section-head">
        <div><span className="gso-journal-v2-label">Mapa técnico</span><h2>O cockpit registra como a solução se sustenta.</h2></div>
        <span className="gso-journal-v2-muted">Stack resumida para leitura humana.</span>
      </div>
      <div className="gso-journal-v2-system-grid">
        {items.map(([label, title, description]) => <article key={label}><span>{label}</span><strong>{title}</strong><p>{description}</p></article>)}
      </div>
    </section>
  );
}

export function DevelopmentJournalSurface() {
  const [activeId, setActiveId] = useState(buildJournalTimelinePhases[4]?.id ?? buildJournalTimelinePhases[0].id);
  const [view, setView] = useState<JournalView>('overview');
  const activePhase = useMemo(() => buildJournalTimelinePhases.find((phase) => phase.id === activeId) ?? buildJournalTimelinePhases[0], [activeId]);

  return (
    <main className="gso-development-journal-v2">
      <header className="gso-journal-v2-command">
        <div><span className="gso-journal-v2-label">MEMÓRIA / CONSTRUCTION LOG</span><h1>Diário de construção</h1><p>O registro vivo das decisões, desvios e passagens que explicam o ConfiOne.</p></div>
        <div className="gso-journal-v2-command-meta"><span><i /> Cockpit ativo</span><span>Última revisão · 13 ago 2026</span><Link to="/admin/product-docs?surface=development">Abrir biblioteca →</Link></div>
      </header>

      <nav aria-label="Modo de leitura do Diário" className="gso-journal-v2-tabs">
        {([
          ['overview', 'Fase em foco'],
          ['timeline', 'Linha do tempo'],
          ['decisions', 'Decisões'],
          ['system', 'Mapa técnico'],
        ] as const).map(([key, label]) => <button className={cx(view === key && 'is-active')} key={key} onClick={() => setView(key)} type="button">{label}</button>)}
      </nav>

      <div className="gso-journal-v2-layout">
        <PhaseRail activeId={activeId} onSelect={(id) => { setActiveId(id); setView('overview'); }} />
        <div className="gso-journal-v2-main">
          {view === 'overview' ? <PhaseStage phase={activePhase} /> : null}
          {view === 'timeline' ? <TimelineView onSelect={(id) => { setActiveId(id); setView('overview'); }} /> : null}
          {view === 'decisions' ? <DecisionsView /> : null}
          {view === 'system' ? <SystemView /> : null}
        </div>
        <aside className="gso-journal-v2-context">
          <section><span className="gso-journal-v2-label">Agora</span><strong>Dashboard + Central de Ajuda</strong><p>A primeira versão publicada está concentrada nessas duas superfícies. O SaaS interno completo volta depois.</p></section>
          <section><span className="gso-journal-v2-label">Entregas recentes</span>{buildJournalRecentDeliveries.map(([title, date]) => <div className="gso-journal-v2-delivery" key={title}><strong>{title}</strong><small>{date}</small></div>)}</section>
          <section><span className="gso-journal-v2-label">Fontes por perto</span>{buildJournalDocumentCategories.slice(0, 3).map((category) => <Link key={category.title} to={`/admin/product-docs?surface=development&doc=${category.documents[0]?.productDocId ?? ''}`}><strong>{category.title}</strong><span>{category.documents.length} referências</span></Link>)}</section>
        </aside>
      </div>
    </main>
  );
}
