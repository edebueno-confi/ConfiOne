type GeniusMascotProps = {
  size?: 'sm' | 'md' | 'lg';
  alt?: string;
  animated?: boolean;
};

export function GeniusMascot({ size = 'md', alt = '', animated = true }: GeniusMascotProps) {
  return <span className={`genius-mascot genius-mascot--${size}${animated ? ' genius-mascot--animated' : ''}`}>
    <img src="/brand-assets/genio.svg" alt={alt} aria-hidden={alt ? undefined : true} />
    {animated ? <>
      <span aria-hidden="true" className="genius-mascot__spark genius-mascot__spark--one">✦</span>
      <span aria-hidden="true" className="genius-mascot__spark genius-mascot__spark--two">✦</span>
    </> : null}
  </span>;
}
