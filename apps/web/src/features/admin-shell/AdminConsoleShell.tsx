import { Outlet } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { AdminTopbar } from './AdminTopbar';

export function AdminConsoleShell() {
  return (
    <div className="bg-[linear-gradient(180deg,#eef4ff_0%,#f7faff_44%,#f2f6fb_100%)] text-[color:var(--color-ink)] xl:h-dvh xl:min-h-0 xl:overflow-hidden">
      <div className="flex w-full min-w-0 gap-[var(--workspace-shell-gap)] px-0 py-0 xl:h-full xl:min-h-0 xl:overflow-hidden xl:px-[var(--workspace-shell-pad)] xl:py-[var(--workspace-shell-pad)]">
        <div className="hidden shrink-0 xl:block">
          <div className="sticky top-[var(--workspace-shell-pad)] h-[calc(100dvh-(var(--workspace-shell-pad)*2))] max-h-[calc(100dvh-(var(--workspace-shell-pad)*2))]">
            <AdminSidebar />
          </div>
        </div>

        <div className="min-w-0 flex-1 px-3 py-3 sm:px-5 sm:py-5 xl:min-h-0 xl:px-0 xl:py-0 xl:overflow-hidden">
          <div className="flex h-full w-full max-w-none flex-col gap-[var(--workspace-panel-gap)] xl:min-h-0 xl:overflow-hidden">
            <AdminTopbar />
            <main className="min-w-0 xl:flex-1 xl:min-h-0 xl:overflow-hidden">
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
