import { useEffect } from 'react';
import { Link } from 'react-router';
import { GeniusMascot } from '../../components/GeniusMascot';

const pillars = [
  {
    number: '01',
    title: 'A fila mostra o que pede atenção',
    text: 'Triagem, prioridade e contexto aparecem juntos para o próximo passo ficar evidente.',
    tone: 'blue',
  },
  {
    number: '02',
    title: 'O cliente continua no centro',
    text: 'Tickets, histórico e sinais da conta formam uma visão única para decisões mais seguras.',
    tone: 'pink',
  },
  {
    number: '03',
    title: 'Conhecimento vira operação',
    text: 'Conteúdo publicado e contexto de atendimento vivem próximos de quem precisa usar.',
    tone: 'cyan',
  },
];

function ProductPreview() {
  return (
    <div className="public-home__preview" aria-label="Prévia do ambiente operacional">
      <div className="public-home__preview-topbar">
        <span className="public-home__preview-brand"><span className="public-home__preview-dot" /> ConfiOne</span>
        <span className="public-home__preview-status"><i /> Ambiente conectado</span>
      </div>
      <div className="public-home__preview-body">
        <aside className="public-home__preview-sidebar">
          <span className="public-home__preview-avatar">C</span>
          <span className="public-home__preview-nav active" />
          <span className="public-home__preview-nav" />
          <span className="public-home__preview-nav" />
          <span className="public-home__preview-nav" />
        </aside>
        <div className="public-home__preview-main">
          <div className="public-home__preview-heading">
            <div><span className="public-home__eyebrow">VISÃO DA OPERAÇÃO</span><strong>Bom dia, time.</strong></div>
            <span className="public-home__preview-filter">Hoje <b>⌄</b></span>
          </div>
          <div className="public-home__preview-metrics">
            <div><small>Fila aberta</small><strong>24</strong><em>↓ 12% hoje</em></div>
            <div><small>Em atendimento</small><strong>08</strong><em className="warn">3 prioritários</em></div>
            <div><small>Clientes ativos</small><strong>148</strong><em>+6 este mês</em></div>
          </div>
          <div className="public-home__preview-queue">
            <div className="public-home__preview-queue-title"><span>Próximos atendimentos</span><small>Ver fila completa →</small></div>
            <div className="public-home__preview-ticket"><span className="ticket-dot high" /><div><strong>Integração não sincronizou pedidos</strong><small>Loja Aurora · há 8 min</small></div><b>Alta</b></div>
            <div className="public-home__preview-ticket"><span className="ticket-dot" /><div><strong>Atualização de catálogo</strong><small>Grupo Horizonte · há 21 min</small></div><b className="soft">Normal</b></div>
            <div className="public-home__preview-ticket"><span className="ticket-dot pink" /><div><strong>Dúvida sobre permissões</strong><small>Casa Nativa · há 34 min</small></div><b className="soft">Normal</b></div>
          </div>
        </div>
      </div>
      <div className="public-home__preview-glow" />
    </div>
  );
}

export function PublicHomePage() {
  useEffect(() => {
    document.title = 'ConfiOne | Operação de suporte B2B';
  }, []);

  return (
    <div className="public-home">
      <header className="public-home__header">
        <Link className="public-home__wordmark" to="/" aria-label="ConfiOne início">
          <span className="public-home__mark">✦</span>
          <span>Confi<span>One</span></span>
        </Link>
        <nav className="public-home__nav" aria-label="Navegação pública">
          <a href="#como-funciona">Como funciona</a>
          <Link to="/help/genius">Central de ajuda</Link>
          <Link className="public-home__login" to="/login">Entrar no ambiente <span>↗</span></Link>
        </nav>
      </header>

      <main>
        <section className="public-home__hero">
          <div className="public-home__hero-copy">
            <div className="public-home__kicker"><span /> SISTEMA OPERACIONAL DE SUPORTE B2B</div>
            <h1>Menos ruído.<br /><em>Mais operação.</em></h1>
            <p className="public-home__hero-lede">O ConfiOne conecta atendimento, clientes e conhecimento em uma única estação de trabalho — para seu time saber o que fazer agora.</p>
            <div className="public-home__hero-actions">
              <Link className="public-home__primary" to="/login">Entrar no ambiente <span>→</span></Link>
              <Link className="public-home__secondary" to="/help/genius">Explorar a central de ajuda</Link>
            </div>
            <p className="public-home__note"><span>⌁</span> Ambiente seguro e preparado para a sua operação</p>
          </div>
          <div className="public-home__hero-visual">
            <div className="public-home__visual-label">A estação de trabalho do seu time <span>↗</span></div>
            <ProductPreview />
            <GeniusMascot alt="Gênio ConfiOne" pose="present" expression="happy" size="sm" surface="default" />
            <div className="public-home__orbit public-home__orbit--one" />
            <div className="public-home__orbit public-home__orbit--two" />
          </div>
        </section>

        <section className="public-home__signal" aria-label="Resumo do produto">
          <p>UMA BASE ÚNICA PARA O TRABALHO QUE ACONTECE TODOS OS DIAS</p>
          <div><strong>Atendimento</strong><span>×</span><strong>Contexto</strong><span>×</span><strong>Conhecimento</strong><span>→</span><b>Próximo passo</b></div>
        </section>

        <section className="public-home__pillars" id="como-funciona">
          <div className="public-home__section-intro"><span className="public-home__section-number">/ 03</span><h2>Clareza para<br /><em>agir melhor.</em></h2></div>
          <div className="public-home__pillar-list">
            {pillars.map((pillar) => (
              <article className={`public-home__pillar public-home__pillar--${pillar.tone}`} key={pillar.number}>
                <span>{pillar.number}</span><div><h3>{pillar.title}</h3><p>{pillar.text}</p></div><b>↗</b>
              </article>
            ))}
          </div>
        </section>

        <section className="public-home__cta">
          <div><span className="public-home__kicker"><span /> PRÓXIMO PASSO</span><h2>Abra o ambiente.<br /><em>Veja o que importa.</em></h2></div>
          <div><p>A operação já está esperando por você.</p><Link className="public-home__primary" to="/login">Acessar ConfiOne <span>→</span></Link></div>
        </section>
      </main>

      <footer className="public-home__footer"><span>✦ ConfiOne</span><small>Sistema operacional de suporte B2B</small><Link to="/help/genius">Central de ajuda ↗</Link></footer>
    </div>
  );
}
