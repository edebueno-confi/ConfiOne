import type { TicketActionDrawer, TicketActionDrawerSize } from './SupportWorkspaceTypes';

export function supportActionDrawerSize(drawer: TicketActionDrawer): TicketActionDrawerSize {
  return drawer === 'none' ? 'default' : 'wide';
}

export function supportActionDrawerWidthVariant(
  drawer: TicketActionDrawer,
): 'rail' | 'drawer-default' | 'drawer-wide' {
  return drawer === 'none' ? 'rail' : 'drawer-wide';
}
