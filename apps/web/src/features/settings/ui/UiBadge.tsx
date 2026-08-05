import type { ReactNode } from 'react';
import type { UiTone } from './ui-types';

/** Pill tonal. Com `dot`, ganha o ponto de status a esquerda. */
export function UiBadge({
  children,
  dot = false,
  tone = 'neutral',
}: {
  children: ReactNode;
  dot?: boolean;
  tone?: UiTone;
}) {
  return (
    <span className={`gso-ui-badge gso-ui-badge--${tone}`}>
      {dot ? <span aria-hidden="true" className="gso-ui-badge-dot" /> : null}
      {children}
    </span>
  );
}
