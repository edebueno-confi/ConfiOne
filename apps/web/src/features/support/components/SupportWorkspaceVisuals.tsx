import type { ReactNode } from 'react';
import { cx } from '../../../components/ui';
import { SupportBadge } from './SupportWorkspacePrimitives';

export type SupportSurfaceIconKind =
  | 'search'
  | 'filter'
  | 'more'
  | 'attachment'
  | 'arrow-left'
  | 'chevron-down'
  | 'close'
  | 'download'
  | 'open'
  | 'alert'
  | 'user-plus'
  | 'clock'
  | 'code'
  | 'user'
  | 'ticket'
  | 'upload'
  | 'bell';

export function CompactSupportPill({
  children,
  tone = 'default',
}: {
  children: ReactNode;
  tone?: 'default' | 'accent' | 'positive' | 'warning' | 'critical';
}) {
  return (
    <SupportBadge className="px-1.5 text-[7.5px] leading-[0.72rem] tracking-[0.11em]" tone={tone}>
      <span className="line-clamp-2">{children}</span>
    </SupportBadge>
  );
}

export function SupportSurfaceIcon({
  kind,
  className,
}: {
  kind: SupportSurfaceIconKind;
  className?: string;
}) {
  const baseClassName = cx('h-4 w-4 shrink-0', className);

  switch (kind) {
    case 'search':
      return (
        <svg aria-hidden="true" className={baseClassName} fill="none" viewBox="0 0 16 16">
          <circle cx="7" cy="7" r="4.75" stroke="currentColor" strokeWidth="1.5" />
          <path d="M10.5 10.5 13.5 13.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
        </svg>
      );
    case 'filter':
      return (
        <svg aria-hidden="true" className={baseClassName} fill="none" viewBox="0 0 16 16">
          <path
            d="M2.5 3.25h11l-4.25 4.9v3.35l-2.5 1.25V8.15L2.5 3.25Z"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth="1.4"
          />
        </svg>
      );
    case 'more':
      return (
        <svg aria-hidden="true" className={baseClassName} fill="currentColor" viewBox="0 0 16 16">
          <circle cx="3" cy="8" r="1.15" />
          <circle cx="8" cy="8" r="1.15" />
          <circle cx="13" cy="8" r="1.15" />
        </svg>
      );
    case 'attachment':
      return (
        <svg aria-hidden="true" className={baseClassName} fill="none" viewBox="0 0 16 16">
          <path
            d="M5.25 8.75 9.9 4.1a2.1 2.1 0 0 1 2.98 2.98L7.62 12.34a3.2 3.2 0 1 1-4.53-4.52l5.1-5.1"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
        </svg>
      );
    case 'arrow-left':
      return (
        <svg aria-hidden="true" className={baseClassName} fill="none" viewBox="0 0 16 16">
          <path d="M12.5 8H3.75" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
          <path
            d="m7 4.75-3.25 3.25L7 11.25"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
        </svg>
      );
    case 'chevron-down':
      return (
        <svg aria-hidden="true" className={baseClassName} fill="none" viewBox="0 0 16 16">
          <path
            d="m4.25 6.25 3.75 3.5 3.75-3.5"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.6"
          />
        </svg>
      );
    case 'close':
      return (
        <svg aria-hidden="true" className={baseClassName} fill="none" viewBox="0 0 16 16">
          <path
            d="m4.25 4.25 7.5 7.5M11.75 4.25l-7.5 7.5"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.5"
          />
        </svg>
      );
    case 'download':
      return (
        <svg aria-hidden="true" className={baseClassName} fill="none" viewBox="0 0 16 16">
          <path d="M8 3.25v6.1" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
          <path
            d="m5.4 6.95 2.6 2.75 2.6-2.75"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
          <path d="M3.5 12.25h9" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
        </svg>
      );
    case 'open':
      return (
        <svg aria-hidden="true" className={baseClassName} fill="none" viewBox="0 0 16 16">
          <path d="M6 3.5h6.5V10" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
          <path d="M12.25 3.75 6.75 9.25" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
          <path
            d="M10.75 12.5h-6a1.25 1.25 0 0 1-1.25-1.25v-6A1.25 1.25 0 0 1 4.75 4h3"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.5"
          />
        </svg>
      );
    case 'alert':
      return (
        <svg aria-hidden="true" className={baseClassName} fill="none" viewBox="0 0 16 16">
          <path
            d="M8 2.5 13.4 12a.75.75 0 0 1-.65 1.12H3.25A.75.75 0 0 1 2.6 12L8 2.5Z"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth="1.4"
          />
          <path d="M8 5.75v3.1" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
          <circle cx="8" cy="11.1" r=".75" fill="currentColor" />
        </svg>
      );
    case 'user-plus':
      return (
        <svg aria-hidden="true" className={baseClassName} fill="none" viewBox="0 0 16 16">
          <circle cx="6" cy="5.5" r="2.35" stroke="currentColor" strokeWidth="1.4" />
          <path
            d="M2.75 12.4c.7-2.05 2.24-3.15 4.25-3.15 2.02 0 3.53 1.1 4.2 3.15"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.4"
          />
          <path d="M12 4.25v3.5M10.25 6h3.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
        </svg>
      );
    case 'clock':
      return (
        <svg aria-hidden="true" className={baseClassName} fill="none" viewBox="0 0 16 16">
          <circle cx="8" cy="8" r="5.25" stroke="currentColor" strokeWidth="1.4" />
          <path d="M8 5v3.2l2.2 1.3" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
        </svg>
      );
    case 'code':
      return (
        <svg aria-hidden="true" className={baseClassName} fill="none" viewBox="0 0 16 16">
          <path
            d="M5.75 4.5 2.75 8l3 3.5M10.25 4.5 13.25 8l-3 3.5M8.9 3.5 7.1 12.5"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.4"
          />
        </svg>
      );
    case 'user':
      return (
        <svg aria-hidden="true" className={baseClassName} fill="none" viewBox="0 0 16 16">
          <circle cx="8" cy="5.4" r="2.45" stroke="currentColor" strokeWidth="1.4" />
          <path
            d="M3.25 12.5c.9-2.25 2.65-3.35 4.75-3.35s3.85 1.1 4.75 3.35"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.4"
          />
        </svg>
      );
    case 'ticket':
      return (
        <svg aria-hidden="true" className={baseClassName} fill="none" viewBox="0 0 16 16">
          <path
            d="M3 4.25c0-.41.34-.75.75-.75h8.5c.41 0 .75.34.75.75v2a1.75 1.75 0 0 0 0 3.5v2c0 .41-.34.75-.75.75h-8.5a.75.75 0 0 1-.75-.75v-2a1.75 1.75 0 0 0 0-3.5v-2Z"
            stroke="currentColor"
            strokeWidth="1.4"
          />
          <path
            d="M6.25 4.25v7.5"
            stroke="currentColor"
            strokeDasharray="1.6 1.6"
            strokeLinecap="round"
            strokeWidth="1.3"
          />
        </svg>
      );
    case 'upload':
      return (
        <svg aria-hidden="true" className={baseClassName} fill="none" viewBox="0 0 16 16">
          <path d="M8 12.75V6.65" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
          <path
            d="m10.6 9.05-2.6-2.75-2.6 2.75"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
          <path d="M3.5 3.75h9" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
        </svg>
      );
    case 'bell':
      return (
        <svg aria-hidden="true" className={baseClassName} fill="none" viewBox="0 0 16 16">
          <path
            d="M8 2.75a3.25 3.25 0 0 0-3.25 3.25v1.05c0 .9-.28 1.77-.8 2.5L3 10.75h10l-.95-1.2a4.3 4.3 0 0 1-.8-2.5V6A3.25 3.25 0 0 0 8 2.75Z"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth="1.4"
          />
          <path d="M6.5 12.1a1.55 1.55 0 0 0 3 0" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
        </svg>
      );
    default:
      return null;
  }
}
