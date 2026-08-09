import { UiIcon } from '../ui/UiIcon';

/**
 * Politica de seguranca: quatro garantias de produto sobre o tratamento de
 * credenciais de integracao.
 *
 * Cada linha afirma apenas um comportamento observavel da propria tela e do
 * contrato de gravacao: o campo de credencial comeca vazio porque o valor
 * gravado nunca retorna ao navegador, e a substituicao acontece por fluxo
 * autorizado. Nenhuma linha descreve mecanismo interno, identificador de
 * segredo, chave, token ou papel de servico.
 */
const POLICY = [
  'As credenciais de integração ficam protegidas no armazenamento do servidor.',
  'Valores secretos nunca são exibidos de volta na interface.',
  'Nenhum segredo é devolvido ao navegador nem registrado em log.',
  'A credencial pode ser substituída ou revogada a qualquer momento por fluxo autorizado.',
];

export function IntegrationSecurityPolicy() {
  return (
    <section aria-labelledby="integration-policy-title" className="gso-po-region">
      <header className="gso-po-region-head">
        <h3 id="integration-policy-title">Política de segurança</h3>
      </header>
      <ul className="gso-po-policy-list">
        {POLICY.map((statement) => (
          <li key={statement}>
            <UiIcon name="check" />
            <span>{statement}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
