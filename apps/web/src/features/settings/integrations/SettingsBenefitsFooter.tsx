import { UiCard } from '../ui/UiCard';
import { UiIconTile } from '../ui/UiIconTile';

/**
 * Faixa inferior da tela. Reafirma, em linguagem operacional, apenas o que a
 * propria tela garante: qual fonte abastece qual area, o que o operador
 * consegue ver antes de agir e como a credencial e tratada.
 */
export function SettingsBenefitsFooter() {
  return (
    <UiCard label="O que esta tela garante">
      <div className="gso-ui-featurerow">
        <div className="gso-ui-feature">
          <UiIconTile icon="layers" tone="primary" />
          <strong>Uma fonte por domínio</strong>
          <span>HubSpot abastece Comercial, Customer Success e Suporte. OMIE abastece o Financeiro.</span>
        </div>
        <div className="gso-ui-feature">
          <UiIconTile icon="activity" tone="success" />
          <strong>Estado antes da ação</strong>
          <span>Cada card mostra se a credencial está gravada e como terminou a última execução da fonte.</span>
        </div>
        <div className="gso-ui-feature">
          <UiIconTile icon="shield" tone="accent" />
          <strong>Alteração sem exposição</strong>
          <span>A credencial não volta para a tela. Um campo em branco mantém exatamente o que já está gravado.</span>
        </div>
      </div>
    </UiCard>
  );
}
