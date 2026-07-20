import { ContextSubsidebar, ContextSubsidebarSection, PageHeader, SummaryStrip, WorkspaceSplit, cx } from '../../../components/ui';

function LoadingBlock({ className }: { className?: string }) {
  return (
    <div
      className={cx(
        'animate-pulse rounded-[18px] bg-[linear-gradient(90deg,rgba(226,232,240,0.9),rgba(241,245,249,0.95),rgba(226,232,240,0.9))]',
        className,
      )}
    />
  );
}

export function SupportQueueLoadingScaffold() {
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Suporte"
        title="Fila operacional"
        description="A fila continua ocupando a área principal enquanto o contexto operacional termina de sincronizar."
      />

      <WorkspaceSplit
        layoutClassName="xl:grid-cols-[292px_minmax(0,1fr)]"
        sidebar={
          <ContextSubsidebar
            description="Filtros e filas rápidas seguem reservados na lateral para a triagem não perder a estrutura."
            title="Triagem da fila"
          >
            <ContextSubsidebarSection
              description="As ferramentas da fila aparecem no mesmo lugar assim que os dados forem liberados."
              title="Carregando filtros"
            >
              <div className="space-y-3">
                <LoadingBlock className="h-16" />
                <LoadingBlock className="h-16" />
                <LoadingBlock className="h-16" />
                <LoadingBlock className="h-16" />
              </div>
            </ContextSubsidebarSection>
          </ContextSubsidebar>
        }
        main={
          <div className="space-y-4">
            <SummaryStrip>
              <LoadingBlock className="h-[76px] min-w-[160px] flex-1" />
              <LoadingBlock className="h-[76px] min-w-[160px] flex-1" />
              <LoadingBlock className="h-[76px] min-w-[160px] flex-1" />
              <LoadingBlock className="h-[76px] min-w-[160px] flex-1" />
            </SummaryStrip>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,0.72fr)_minmax(320px,0.28fr)]">
              <section className="rounded-[24px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)] px-5 py-5 shadow-[0_14px_28px_rgba(19,33,79,0.08)]">
                <div className="mb-4 space-y-2">
                  <LoadingBlock className="h-6 w-40" />
                  <LoadingBlock className="h-4 w-80 max-w-full" />
                </div>
                <div className="space-y-3">
                  <LoadingBlock className="h-44" />
                  <LoadingBlock className="h-44" />
                  <LoadingBlock className="h-44" />
                </div>
              </section>

              <section className="rounded-[24px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)] px-5 py-5 shadow-[0_14px_28px_rgba(19,33,79,0.08)] xl:sticky xl:top-4">
                <div className="mb-4 space-y-2">
                  <LoadingBlock className="h-6 w-36" />
                  <LoadingBlock className="h-4 w-52 max-w-full" />
                </div>
                <LoadingBlock className="h-[420px]" />
              </section>
            </div>
          </div>
        }
      />
    </div>
  );
}

export function SupportTicketLoadingScaffold() {
  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-[28px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)] px-5 py-5 shadow-[0_16px_30px_rgba(19,33,79,0.08)]">
        <div className="flex flex-wrap items-center gap-3">
          <LoadingBlock className="h-9 w-40 rounded-full" />
          <LoadingBlock className="h-9 w-24 rounded-full" />
          <LoadingBlock className="h-6 w-40" />
        </div>
        <LoadingBlock className="h-12 w-[720px] max-w-full" />
        <div className="grid gap-3 border-t border-[color:var(--color-border)] pt-4 lg:grid-cols-4">
          <LoadingBlock className="h-14" />
          <LoadingBlock className="h-14" />
          <LoadingBlock className="h-14" />
          <LoadingBlock className="h-14" />
        </div>
        <div className="flex flex-wrap gap-6 border-t border-[color:var(--color-border)] pt-4">
          <LoadingBlock className="h-6 w-24" />
          <LoadingBlock className="h-6 w-32" />
          <LoadingBlock className="h-6 w-32" />
          <LoadingBlock className="h-6 w-28" />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.74fr)_minmax(318px,0.26fr)]">
        <section className="overflow-hidden rounded-[28px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)] shadow-[0_16px_30px_rgba(19,33,79,0.08)]">
          <div className="px-5 py-4">
            <div className="flex justify-center">
              <LoadingBlock className="h-7 w-20 rounded-full" />
            </div>
            <div className="mt-5 space-y-4">
              <div className="flex items-start gap-3">
                <LoadingBlock className="h-11 w-11 rounded-full" />
                <LoadingBlock className="h-24 flex-1" />
              </div>
              <div className="flex justify-end gap-3">
                <LoadingBlock className="h-24 w-[78%]" />
                <LoadingBlock className="h-11 w-11 rounded-full" />
              </div>
              <div className="flex items-start gap-3">
                <LoadingBlock className="h-11 w-11 rounded-full" />
                <LoadingBlock className="h-28 w-[82%]" />
              </div>
            </div>
          </div>

          <div className="border-t border-[color:var(--color-border)] px-5 py-5">
            <div className="mb-4 flex gap-4">
              <LoadingBlock className="h-7 w-32" />
              <LoadingBlock className="h-7 w-28" />
            </div>
            <LoadingBlock className="h-48 rounded-[26px]" />
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-2">
                <LoadingBlock className="h-10 w-10 rounded-full" />
                <LoadingBlock className="h-10 w-10 rounded-full" />
                <LoadingBlock className="h-10 w-10 rounded-full" />
              </div>
              <LoadingBlock className="h-12 w-80 max-w-full rounded-full" />
              <LoadingBlock className="h-12 w-40 rounded-full" />
            </div>
          </div>
        </section>

        <aside className="space-y-3">
          <LoadingBlock className="h-[340px] rounded-[24px]" />
          <LoadingBlock className="h-[180px] rounded-[24px]" />
          <LoadingBlock className="h-[180px] rounded-[24px]" />
        </aside>
      </div>
    </div>
  );
}
