import type { TicketActionDrawer, TicketActionDrawerSize } from './SupportWorkspaceTypes';

export function supportActionDrawerSize(drawer: TicketActionDrawer): TicketActionDrawerSize {
  switch (drawer) {
    case 'evidence':
    case 'knowledge':
    case 'automation':
    case 'handoff':
    case 'related':
      return 'wide';
    case 'status':
    case 'classification':
    case 'none':
    default:
      return 'default';
  }
}

export function supportActionDrawerWidthVariant(
  drawer: TicketActionDrawer,
): 'rail' | 'drawer-default' | 'drawer-wide' {
  switch (supportActionDrawerSize(drawer)) {
    case 'wide':
      return 'drawer-wide';
    case 'default':
      return drawer === 'none' ? 'rail' : 'drawer-default';
    default:
      return 'rail';
  }
}
