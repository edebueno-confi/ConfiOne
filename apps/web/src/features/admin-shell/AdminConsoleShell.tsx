import { Outlet } from 'react-router-dom';
import { UNIFIED_INTERNAL_SIDEBAR_WIDTH_CLASS } from '../navigation/UnifiedEnvironmentNavigation';
import { AdminSidebar } from './AdminSidebar';
import { AdminTopbar } from './AdminTopbar';

export function AdminConsoleShell() {
  return (
    <div className="bg-[linear-gradient(180deg,#eef4ff_0%,#f7faff_44%,#f2f6fb_100%)] text-[color:var(--color-ink)] xl:h-[var(--app-viewport-height)] xl:overflow-hidden">
      <div className="flex w-full gap-4 px-0 py-0 xl:h-full xl:overflow-hidden xl:px-4 xl:py-4">
        <div className="hidden shrink-0 xl:block">
          <div className={`sticky top-4 h-[calc(var(--app-viewport-height)-2rem)] max-h-[calc(var(--app-viewport-height)-2rem)] ${UNIFIED_INTERNAL_SIDEBAR_WIDTH_CLASS}`}>
            <AdminSidebar />
          </div>
        </div>

        <div className="min-w-0 flex-1 px-3 py-3 sm:px-5 sm:py-5 xl:min-h-0 xl:px-0 xl:py-0">
          <div className="flex h-full w-full max-w-none flex-col gap-3 xl:min-h-0">
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
