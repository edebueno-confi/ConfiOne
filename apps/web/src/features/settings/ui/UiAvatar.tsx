/**
 * Avatar do usuario com indicador de estado.
 *
 * Sem foto, mostra as iniciais derivadas do nome — nunca uma imagem generica.
 * O indicador so aparece quando `status` e informado; ausencia de estado nao
 * vira ponto cinza, porque isso sugeriria um dado que nao temos.
 */
export function UiAvatar({
  name,
  size = 'md',
  src,
  status,
}: {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  src?: string | null;
  status?: 'active' | 'suspended' | 'inactive';
}) {
  return (
    <span className={`gso-ui-avatar gso-ui-avatar--${size}`}>
      {src
        ? <img alt="" className="gso-ui-avatar-image" src={src} />
        : <span aria-hidden="true" className="gso-ui-avatar-initials">{initialsOf(name)}</span>}
      {status ? <span aria-hidden="true" className={`gso-ui-avatar-status gso-ui-avatar-status--${status}`} /> : null}
    </span>
  );
}

/** Duas letras no maximo, a partir da primeira e da ultima palavra do nome. */
function initialsOf(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  const first = words[0]?.[0] ?? '';
  const last = words.length > 1 ? words[words.length - 1]?.[0] ?? '' : '';
  return `${first}${last}`.toUpperCase();
}
