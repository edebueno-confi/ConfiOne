import lampUrl from '../../assets/brand/genius-lamp.svg';

type GeniusLampProps = {
  alt?: string;
  animated?: boolean;
  className?: string;
  size?: 'sm' | 'md';
};

/** Marca compacta para superfícies pequenas; o Gênio completo fica reservado a estados contextuais. */
export function GeniusLamp({ alt = '', animated = true, className, size = 'sm' }: GeniusLampProps) {
  return (
    <span
      aria-hidden={alt ? undefined : true}
      aria-label={alt || undefined}
      className={`genius-lamp genius-lamp--${size}${animated ? ' genius-lamp--animated' : ''}${className ? ` ${className}` : ''}`}
      role={alt ? 'img' : undefined}
    >
      <img alt="" aria-hidden="true" className="genius-lamp__svg" src={lampUrl} />
    </span>
  );
}
