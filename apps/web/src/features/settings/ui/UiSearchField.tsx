import type { InputHTMLAttributes } from 'react';
import { UiIcon } from './UiIcon';

/** Campo de busca da barra de filtros: icone de lupa a esquerda do controle. */
export function UiSearchField(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <span className="gso-ui-search">
      <UiIcon name="search" />
      <input className="gso-ui-control" type="search" {...props} />
    </span>
  );
}
