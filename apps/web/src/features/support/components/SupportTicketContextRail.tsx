import type { ReactNode } from 'react';
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
    <SupportContextRailSlot className="h-full">
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
