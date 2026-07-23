import { useMemo, type ButtonHTMLAttributes } from 'react';
import { GeniusMascot, type GeniusAvatarVariant } from './GeniusMascot';
import { cx } from './ui';

type AvatarSize = 'sm' | 'md' | 'lg';

interface AvatarProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'name'> {
  name?: string | null;
  email?: string | null;
  src?: string | null;
  size?: AvatarSize;
  fallbackMascot?: boolean;
  mascotVariant?: GeniusAvatarVariant;
  label?: string;
}

function identityParts(name: string | null | undefined, email: string | null | undefined) {
  return String(name ?? email ?? 'GS')
    .trim()
    .split(/[\s@._-]+/)
    .filter(Boolean);
}

function initials(name: string | null | undefined, email: string | null | undefined) {
  const parts = identityParts(name, email);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || 'GS';
}

function paletteFor(name: string | null | undefined, email: string | null | undefined) {
  const source = String(name ?? email ?? 'gso');
  const hash = [...source].reduce((total, character) => total + character.charCodeAt(0), 0);
  return hash % 5;
}

const sizeClasses: Record<AvatarSize, string> = {
  sm: 'h-8 w-8 text-[10px]',
  md: 'h-10 w-10 text-xs',
  lg: 'h-12 w-12 text-sm',
};

export function Avatar({
  className,
  email,
  fallbackMascot = false,
  label,
  mascotVariant = 'default',
  name,
  onClick,
  size = 'md',
  src,
  type = 'button',
  ...buttonProps
}: AvatarProps) {
  const displayName = name?.trim() || email?.trim() || 'Usuário';
  const accessibleLabel = label ?? `Abrir perfil de ${displayName}`;
  const palette = useMemo(() => paletteFor(name, email), [email, name]);
  const content = src ? (
    <img alt={displayName} className="h-full w-full object-cover" loading="lazy" src={src} />
  ) : fallbackMascot ? (
    <GeniusMascot alt={displayName} animated={false} avatarVariant={mascotVariant} size={size === 'lg' ? 'md' : 'sm'} surface="avatar" />
  ) : initials(name, email);
  const classes = cx(
    'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold ring-1 ring-inset ring-[color:var(--minimal-border)]',
    sizeClasses[size],
    !src && !fallbackMascot && `avatar-palette-${palette}`,
    className,
  );

  if (!onClick) {
    return <span aria-label={accessibleLabel} className={classes} role="img" title={displayName}>{content}</span>;
  }

  return (
    <button
      {...buttonProps}
      aria-label={accessibleLabel}
      className={cx(classes, 'transition-transform duration-150 hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--minimal-focus)] focus-visible:ring-offset-2')}
      onClick={onClick}
      title={displayName}
      type={type}
    >
      {content}
    </button>
  );
}
