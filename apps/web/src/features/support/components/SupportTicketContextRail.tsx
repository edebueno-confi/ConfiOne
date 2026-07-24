import type { ReactNode } from 'react';
import { cx } from '../../../components/ui';
import { SupportActionDrawer, SupportContextRailSlot } from './SupportWorkspacePrimitives';

export function SupportTicketContextRail({
  title,
  subtitle,
  drawerSize,
  onClose,
  footer,
  panel,
  defaultRail,
}: {
  title: string | null;
  subtitle?: string | null;
  drawerSize: 'default' | 'wide';
  onClose: () => void;
  footer?: ReactNode;
  panel: ReactNode;
  defaultRail: ReactNode;
}) {
  return (
    <SupportContextRailSlot
      className={cx(
        title && panel
          ? 'fixed inset-x-0 bottom-0 top-24 z-40 flex bg-[color:var(--minimal-surface)] xl:static xl:h-full'
          : 'hidden h-full xl:flex',
      )}
    >
      {panel && title ? (
        <SupportActionDrawer
          className="h-full"
          footer={footer}
          onClose={onClose}
          size={drawerSize}
          subtitle={subtitle ?? undefined}
          title={title}
        >
          {panel}
        </SupportActionDrawer>
      ) : (
        defaultRail
      )}
    </SupportContextRailSlot>
  );
}
