import type { ReactNode } from 'react';

/**
 * Sub-abas dentro de um domínio.
 *
 * Existem por conteúdo, não por navegação: "qual é a posição" e "como evoluiu"
 * são perguntas diferentes, com recortes de data e visualizações distintas.
 * Espremer as duas na mesma tela é o que produz painel confuso.
 *
 * A regra que evita repetir o defeito de duplicidade: a aba de evolução mostra
 * **séries**, nunca repete os indicadores da aba de posição.
 */
export interface DomainTab {
  id: string;
  label: string;
  /** Explica, em uma linha, que pergunta esta aba responde. */
  question: string;
  content: ReactNode;
}

export function AnalyticsDomainTabs({
  tabs,
  activeId,
  onChange,
}: {
  tabs: DomainTab[];
  activeId: string;
  onChange: (id: string) => void;
}) {
  const active = tabs.find((tab) => tab.id === activeId) ?? tabs[0];
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-1 gap-y-2 border-b border-[color:var(--minimal-border)]">
        {tabs.map((tab) => {
          const isActive = tab.id === active.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`-mb-px border-b-2 px-3 py-2 text-xs font-semibold transition ${
                isActive
                  ? 'border-[color:var(--minimal-text)] text-[color:var(--minimal-text)]'
                  : 'border-transparent text-[color:var(--minimal-text-tertiary)] hover:text-[color:var(--minimal-text-secondary)]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <p className="text-xs leading-5 text-[color:var(--minimal-text-secondary)]">{active.question}</p>
      {active.content}
    </div>
  );
}
