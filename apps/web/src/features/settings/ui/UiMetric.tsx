import type { ReactNode } from 'react';
import { UiIconTile } from './UiIconTile';
import type { UiIconName, UiTone } from './ui-types';

/**
 * Celula de indicador: ladrilho de icone, valor, rotulo e sublabel. O valor usa
 * numeral tabular para as colunas nao dancarem entre leituras.
 */
export function UiMetric({
  icon,
  label,
  sub,
  text = false,
  tone = 'neutral',
  value,
  valueTone,
}: {
  icon: UiIconName;
  label: string;
  sub?: ReactNode;
  text?: boolean;
  tone?: UiTone;
  value: ReactNode;
  valueTone?: 'primary' | 'success' | 'warning' | 'danger';
}) {
  return (
    <div className={text ? 'gso-ui-metric gso-ui-metric--text' : 'gso-ui-metric'}>
      <UiIconTile icon={icon} tone={tone} />
      <div>
        <strong className={valueTone ? `gso-ui-metric-value gso-ui-metric-value--${valueTone}` : 'gso-ui-metric-value'}>
          {value}
        </strong>
        <span className="gso-ui-metric-label">{label}</span>
        {sub ? <small className="gso-ui-metric-sub">{sub}</small> : null}
      </div>
    </div>
  );
}
