import { UiCard } from '../ui/UiCard';
import { UiCardHeader } from '../ui/UiCardHeader';

/**
 * Resumo de protecao das credenciais.
 *
 * Cada frase corresponde a um comportamento verificavel no codigo: o segredo
 * vai para o cofre do banco e o read model devolve apenas o indicador de
 * credencial configurada; campo vazio preserva o segredo gravado; a funcao de
 * gravacao recusa quem nao tem acesso ao Dashboard Gerencial; a data de
 * atualizacao so avanca quando um novo segredo e enviado. Nada alem disso e
 * afirmado aqui.
 */
export function IntegrationSecuritySummary() {
  return (
    <UiCard labelledBy="integration-rail-security">
      <UiCardHeader icon="shield" title="Proteção das credenciais" titleId="integration-rail-security" tone="accent" />
      <ul className="gso-ui-facts">
        <li>O valor da credencial fica guardado em cofre no banco de dados e não retorna para a tela: a interface recebe apenas o indicador de credencial configurada.</li>
        <li>Campo em branco mantém a credencial atual. Um novo valor só é enviado quando você digita no campo.</li>
        <li>A gravação passa por uma função do banco que recusa quem não tem acesso ao Dashboard Gerencial.</li>
        <li>A data em Credencial atualizada em só avança quando uma nova credencial é gravada.</li>
      </ul>
      <p className="gso-ui-note">Rotação automática e monitoramento contínuo de credenciais não fazem parte desta versão.</p>
    </UiCard>
  );
}
