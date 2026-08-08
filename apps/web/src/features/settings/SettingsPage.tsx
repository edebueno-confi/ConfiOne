import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router';
import { cx } from '../../components/ui';
import {
  archiveConversationType,
  archivePriorityLevel,
  archiveQuickReply,
  createConversationType,
  createPriorityLevel,
  createQuickReply,
  archiveBrand,
  archiveCustomerSegment,
  createBrand,
  createCustomerSegment,
  listBrands,
  listConversationTypes,
  listTicketCategories,
  listCustomerSegments,
  listPriorityLevels,
  listQuickReplies,
  type Brand,
  type ConversationType,
  type TicketCategory,
  type CustomerSegment,
  type PriorityLevel,
  type QuickReply,
  type ManagedIntegration,
  type HelpCenterSupportContacts,
  listHelpCenterSupportContacts,
  listManagedIntegrations,
  saveHelpCenterSupportContacts,
  saveManagedIntegration,
} from './settings-api';
import { useAuthContext } from '../auth/auth-context';

type GroupStatus = 'ativo' | 'existe_hoje' | 'em_breve';

interface SettingsGroup {
  id: string;
  label: string;
  description: string;
  controls: string[];
  usadoEm: string;
  status: GroupStatus;
  nota?: string;
}

type LoadState<T> = { phase: 'idle' | 'loading' } | { phase: 'ready'; items: T[] } | { phase: 'error' };

import { canOpenSettingsSection } from '../../app/release-surface.mjs';
import { BrandsSettingsPage } from './BrandsSettingsPage';
import { DashboardSourcesSettingsPage } from './DashboardSourcesSettingsPage';
import { HelpCenterSettingsPage } from './HelpCenterSettingsPage';
import { SettingsIntegrationsPanel } from './SettingsIntegrationsPanel';
import '../analytics/high-density.css';
import './settings-ui.css';
import { SyncHistorySettingsPage } from './SyncHistorySettingsPage';

const DASHBOARD_SECTION_IDS = ['dashboard-fontes', 'dashboard-historico'];

const SETTINGS_ROUTES: Record<string, string> = {
  marcas: '/admin/settings/brands',
  'central-ajuda': '/admin/settings/help-center',
  integracoes: '/admin/settings/integrations',
  'dashboard-fontes': '/admin/settings/dashboard-sources',
  'dashboard-historico': '/admin/settings/sync-history',
};

function sectionFromPathname(pathname: string) {
  const route = Object.entries(SETTINGS_ROUTES).find(([, path]) => pathname === path)?.[0];
  return route ?? null;
}

const GROUPS: SettingsGroup[] = [
  { id: 'marcas', label: 'Marcas', description: 'As marcas atendidas na plataforma e sua identidade.', controls: ['Nome da marca', 'Central de ajuda (slug)', 'Ordem'], usadoEm: 'Central de ajuda, portal do cliente e atendimento', status: 'ativo', nota: 'Genius e After Sale na mesma plataforma; gerenciável aqui.' },
  { id: 'central-ajuda', label: 'Central de ajuda', description: 'Contatos exibidos no rodapé público, fora do conteúdo dos artigos.', controls: ['E-mail de suporte', 'WhatsApp de suporte', 'Site e links auxiliares', 'Por central de ajuda'], usadoEm: 'Rodapé da Central de Ajuda pública', status: 'ativo', nota: 'Os artigos não armazenam mais contatos operacionais; esta configuração é a fonte única para o público.' },
  { id: 'areas', label: 'Áreas e equipes', description: 'Áreas internas que podem ser acionadas e seus membros.', controls: ['Nome da área', 'Membros', 'Responsável'], usadoEm: 'Acionamentos internos e filas por área', status: 'existe_hoje' },
  { id: 'papeis', label: 'Papéis e permissões', description: 'O que cada perfil pode ver e fazer, por marca e por conta.', controls: ['Papel', 'Permissões', 'Escopo por marca/conta'], usadoEm: 'Todo o sistema (contexto por permissão)', status: 'existe_hoje' },
  { id: 'tipos-conversa', label: 'Tipos de conversa', description: 'Os tipos de conversa que o atendimento pode registrar.', controls: ['Nome do tipo', 'Área sugerida', 'Ordem'], usadoEm: 'Atendimento (inbox)', status: 'ativo', nota: 'Parâmetro totalmente gerenciável pela tela.' },
  { id: 'categorias', label: 'Categorias e classificações', description: 'Como demandas e conversas são classificadas.', controls: ['Categoria', 'Status', 'Ordem'], usadoEm: 'Tickets e demandas', status: 'ativo', nota: 'Categorias de ticket existentes, centralizadas aqui para consulta.' },
  { id: 'prioridades', label: 'Prioridades e severidades', description: 'Níveis de urgência usados na fila e no cálculo de prazo.', controls: ['Nível', 'Peso', 'Cor', 'Ordem'], usadoEm: 'Fila de atendimento e SLA', status: 'ativo', nota: 'Parâmetro totalmente gerenciável pela tela.' },
  { id: 'status-fluxos', label: 'Status e fluxos', description: 'Os estados de uma demanda e as transições permitidas, por tipo.', controls: ['Status interno', 'Rótulo para o cliente', 'Transições permitidas', 'Por tipo de demanda'], usadoEm: 'Tickets e demandas', status: 'em_breve', nota: 'Hoje os status são fixos no código; passarão a ser configuráveis.' },
  { id: 'slas', label: 'SLAs', description: 'Prazos-alvo de primeira resposta e resolução.', controls: ['Tempo de 1ª resposta', 'Tempo de resolução', 'Por prioridade', 'Calendário'], usadoEm: 'Alertas de prazo no atendimento', status: 'em_breve' },
  { id: 'respostas-rapidas', label: 'Respostas rápidas', description: 'Textos prontos para o time responder mais rápido.', controls: ['Título', 'Texto', 'Ordem'], usadoEm: 'Composer do atendimento', status: 'ativo', nota: 'Disponíveis no campo de resposta do Atendimento.' },
  { id: 'automacoes', label: 'Automações', description: 'Regras simples de roteamento (se isto, então aquilo).', controls: ['Condição (se)', 'Ação (então)'], usadoEm: 'Roteamento de demandas entre áreas', status: 'em_breve', nota: 'Exemplo: se o tipo for “bug”, então a área é “Produto”.' },
  { id: 'segmentos', label: 'Segmentos e clusters', description: 'Como os clientes são agrupados na carteira de CS.', controls: ['Nome do segmento', 'Cor', 'Ordem'], usadoEm: 'Carteira de CS (clusterização)', status: 'ativo', nota: 'Parâmetro gerenciável pela tela; base para a clusterização de CS.' },
  { id: 'canais', label: 'Canais', description: 'Por onde as mensagens entram e saem.', controls: ['Canal', 'Situação', 'Marca'], usadoEm: 'Entrada e saída de mensagens', status: 'existe_hoje', nota: 'Portal do cliente ativo; e-mail e WhatsApp são evolução futura.' },
  { id: 'integracoes', label: 'Integrações', description: 'Fontes externas e credenciais do Dashboard Gerencial.', controls: ['HubSpot', 'OMIE Financeiro', 'Estado da credencial'], usadoEm: 'Dashboard Gerencial e atualizações operacionais', status: 'ativo', nota: 'A tela mostra somente o estado da conexão. O valor da credencial nunca retorna para a interface.' },
  { id: 'dashboard-fontes', label: 'Fontes do Dashboard', description: 'Pipelines e fontes que alimentam o Dashboard Gerencial.', controls: ['Pipelines HubSpot', 'Fonte OMIE API'], usadoEm: 'Dashboard Gerencial', status: 'ativo', nota: 'Pipelines e escopos operacionais permanecem separados da credencial da integração.' },
  { id: 'dashboard-historico', label: 'Histórico de sincronizações', description: 'Execuções, resultados e erros das integrações gerenciais.', controls: ['Execuções', 'Status', 'Erros'], usadoEm: 'Dashboard Gerencial', status: 'ativo', nota: 'O histórico fica separado das configurações e das ações de atualização.' },
];

function ColorPill({ token, label }: { token: string | null; label: string }) {
  const map: Record<string, string> = {
    danger: 'border-[color:var(--color-danger-border)] bg-[color:var(--color-danger-surface)] text-[color:var(--color-danger-text)]',
    warning: 'border-[color:var(--color-warning-border)] bg-[color:var(--color-warning-surface)] text-[color:var(--color-warning-text)]',
    info: 'border-[color:var(--color-info-border)] bg-[color:var(--color-info-surface)] text-[color:var(--color-info-text)]',
    success: 'border-[color:var(--color-success-border)] bg-[color:var(--color-success-surface)] text-[color:var(--color-success-text)]',
  };
  const cls = (token && map[token]) || 'border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface-muted)] text-[color:var(--minimal-text-secondary)]';
  return <span className={cx('inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium', cls)}>{label}</span>;
}

const inputClass =
  'w-full rounded-lg border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] px-3 py-2 text-sm text-[color:var(--minimal-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--minimal-focus)]';

function ConversationTypesPanel({
  state,
  onCreate,
  onArchive,
  mutating,
  mutationError,
}: {
  state: LoadState<ConversationType>;
  onCreate: (input: { label: string; defaultAreaKey: string; sortOrder: number }) => Promise<boolean>;
  onArchive: (id: string) => Promise<void>;
  mutating: boolean;
  mutationError: string | null;
}) {
  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState('');
  const [area, setArea] = useState('');

  const activeItems = state.phase === 'ready' ? state.items.filter((item: ConversationType) => item.isActive) : [];

  async function handleSave() {
    if (!label.trim()) {
      return;
    }
    const ok = await onCreate({ label, defaultAreaKey: area, sortOrder: (activeItems.length + 1) * 10 });
    if (ok) {
      setLabel('');
      setArea('');
      setShowForm(false);
    }
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-[color:var(--minimal-text)]">Tipos cadastrados</h3>
        {!showForm ? (
          <button className="inline-flex items-center rounded-lg border border-[color:var(--minimal-border)] px-3 py-1.5 text-sm font-medium text-[color:var(--minimal-text)] hover:bg-[color:var(--minimal-surface-muted)]" onClick={() => setShowForm(true)} type="button">
            Adicionar tipo
          </button>
        ) : null}
      </div>

      {showForm ? (
        <div className="mb-4 rounded-lg border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface-muted)] p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-medium text-[color:var(--minimal-text-secondary)]">
              Nome do tipo
              <input className={cx(inputClass, 'mt-1')} onChange={(event) => setLabel(event.target.value)} placeholder="Ex.: Reclamação" value={label} />
            </label>
            <label className="text-xs font-medium text-[color:var(--minimal-text-secondary)]">
              Área sugerida
              <input className={cx(inputClass, 'mt-1')} onChange={(event) => setArea(event.target.value)} placeholder="Ex.: suporte" value={area} />
            </label>
          </div>
          {mutationError ? <p className="mt-2 text-xs text-[color:var(--color-danger-text)]">{mutationError}</p> : null}
          <div className="mt-3 flex items-center gap-2">
            <button className="inline-flex items-center rounded-lg border border-transparent bg-[color:var(--minimal-action)] px-3 py-1.5 text-sm font-medium text-[color:var(--minimal-action-ink)] disabled:opacity-60" disabled={mutating || !label.trim()} onClick={() => void handleSave()} type="button">
              {mutating ? 'Salvando…' : 'Salvar'}
            </button>
            <button className="inline-flex items-center rounded-lg border border-[color:var(--minimal-border)] px-3 py-1.5 text-sm font-medium text-[color:var(--minimal-text-secondary)]" onClick={() => { setShowForm(false); setLabel(''); setArea(''); }} type="button">
              Cancelar
            </button>
          </div>
        </div>
      ) : null}

      {state.phase === 'loading' || state.phase === 'idle' ? (
        <p className="text-sm text-[color:var(--minimal-text-secondary)]">Carregando tipos de conversa…</p>
      ) : state.phase === 'error' ? (
        <div className="rounded-lg border border-[color:var(--color-danger-border)] bg-[color:var(--color-danger-surface)] px-4 py-3 text-sm text-[color:var(--color-danger-text)]">Não foi possível carregar agora. Atualize a página e tente novamente.</div>
      ) : activeItems.length === 0 ? (
        <p className="text-sm text-[color:var(--minimal-text-secondary)]">Nenhum tipo de conversa cadastrado.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-[color:var(--minimal-border)]">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface-muted)] text-xs text-[color:var(--minimal-text-tertiary)]">
              <tr><th className="px-3 py-2 font-medium">Tipo</th><th className="px-3 py-2 font-medium">Área sugerida</th><th className="px-3 py-2 text-right font-medium">Ação</th></tr>
            </thead>
            <tbody>
              {activeItems.map((item: ConversationType) => (
                <tr className="border-b border-[color:var(--minimal-border)] last:border-b-0" key={item.id}>
                  <td className="px-3 py-2.5 font-medium text-[color:var(--minimal-text)]">{item.label}</td>
                  <td className="px-3 py-2.5 text-[color:var(--minimal-text-secondary)]">{item.defaultAreaKey ?? 'Indisponível'}</td>
                  <td className="px-3 py-2.5 text-right">
                    <button className="rounded-md px-2 py-1 text-xs font-medium text-[color:var(--minimal-text-tertiary)] hover:text-[color:var(--color-danger-text)] disabled:opacity-60" disabled={mutating} onClick={() => void onArchive(item.id)} type="button">Arquivar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PriorityLevelsPanel({
  state,
  onCreate,
  onArchive,
  mutating,
  mutationError,
}: {
  state: LoadState<PriorityLevel>;
  onCreate: (input: { label: string; weight: number; colorToken: string | null; sortOrder: number }) => Promise<boolean>;
  onArchive: (id: string) => Promise<void>;
  mutating: boolean;
  mutationError: string | null;
}) {
  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState('');
  const [color, setColor] = useState('neutral');

  const items = state.phase === 'ready' ? state.items.filter((item: PriorityLevel) => item.isActive) : [];

  async function handleSave() {
    if (!label.trim()) {
      return;
    }
    const next = (items.length + 1) * 10;
    const ok = await onCreate({ label, weight: next, colorToken: color, sortOrder: next });
    if (ok) {
      setLabel('');
      setColor('neutral');
      setShowForm(false);
    }
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-[color:var(--minimal-text)]">Níveis cadastrados</h3>
        {!showForm ? (
          <button className="inline-flex items-center rounded-lg border border-[color:var(--minimal-border)] px-3 py-1.5 text-sm font-medium text-[color:var(--minimal-text)] hover:bg-[color:var(--minimal-surface-muted)]" onClick={() => setShowForm(true)} type="button">
            Adicionar nível
          </button>
        ) : null}
      </div>

      {showForm ? (
        <div className="mb-4 rounded-lg border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface-muted)] p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-medium text-[color:var(--minimal-text-secondary)]">
              Nome do nível
              <input className={cx(inputClass, 'mt-1')} onChange={(event) => setLabel(event.target.value)} placeholder="Ex.: Crítica" value={label} />
            </label>
            <label className="text-xs font-medium text-[color:var(--minimal-text-secondary)]">
              Cor
              <select className={cx(inputClass, 'mt-1')} onChange={(event) => setColor(event.target.value)} value={color}>
                <option value="neutral">Neutra</option>
                <option value="info">Azul (informativa)</option>
                <option value="success">Verde (tranquila)</option>
                <option value="warning">Amarela (atenção)</option>
                <option value="danger">Vermelha (urgente)</option>
              </select>
            </label>
          </div>
          {mutationError ? <p className="mt-2 text-xs text-[color:var(--color-danger-text)]">{mutationError}</p> : null}
          <div className="mt-3 flex items-center gap-2">
            <button className="inline-flex items-center rounded-lg border border-transparent bg-[color:var(--minimal-action)] px-3 py-1.5 text-sm font-medium text-[color:var(--minimal-action-ink)] disabled:opacity-60" disabled={mutating || !label.trim()} onClick={() => void handleSave()} type="button">
              {mutating ? 'Salvando…' : 'Salvar'}
            </button>
            <button className="inline-flex items-center rounded-lg border border-[color:var(--minimal-border)] px-3 py-1.5 text-sm font-medium text-[color:var(--minimal-text-secondary)]" onClick={() => { setShowForm(false); setLabel(''); }} type="button">
              Cancelar
            </button>
          </div>
        </div>
      ) : null}

      {state.phase === 'loading' || state.phase === 'idle' ? (
        <p className="text-sm text-[color:var(--minimal-text-secondary)]">Carregando prioridades…</p>
      ) : state.phase === 'error' ? (
        <div className="rounded-lg border border-[color:var(--color-danger-border)] bg-[color:var(--color-danger-surface)] px-4 py-3 text-sm text-[color:var(--color-danger-text)]">Não foi possível carregar agora. Atualize a página e tente novamente.</div>
      ) : items.length === 0 ? (
        <p className="text-sm text-[color:var(--minimal-text-secondary)]">Nenhuma prioridade cadastrada.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-[color:var(--minimal-border)]">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface-muted)] text-xs text-[color:var(--minimal-text-tertiary)]">
              <tr><th className="px-3 py-2 font-medium">Nível</th><th className="px-3 py-2 font-medium">Peso</th><th className="px-3 py-2 font-medium">Cor</th><th className="px-3 py-2 text-right font-medium">Ação</th></tr>
            </thead>
            <tbody>
              {items.map((item: PriorityLevel) => (
                <tr className="border-b border-[color:var(--minimal-border)] last:border-b-0" key={item.id}>
                  <td className="px-3 py-2.5 font-medium text-[color:var(--minimal-text)]">{item.label}</td>
                  <td className="px-3 py-2.5 tabular-nums text-[color:var(--minimal-text-secondary)]">{item.weight}</td>
                  <td className="px-3 py-2.5"><ColorPill label={item.colorToken ?? '—'} token={item.colorToken} /></td>
                  <td className="px-3 py-2.5 text-right">
                    <button className="rounded-md px-2 py-1 text-xs font-medium text-[color:var(--minimal-text-tertiary)] hover:text-[color:var(--color-danger-text)] disabled:opacity-60" disabled={mutating} onClick={() => void onArchive(item.id)} type="button">Arquivar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function QuickRepliesPanel({
  state,
  onCreate,
  onArchive,
  mutating,
  mutationError,
}: {
  state: LoadState<QuickReply>;
  onCreate: (input: { title: string; body: string; sortOrder: number }) => Promise<boolean>;
  onArchive: (id: string) => Promise<void>;
  mutating: boolean;
  mutationError: string | null;
}) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const items = state.phase === 'ready' ? state.items.filter((item: QuickReply) => item.isActive) : [];

  async function handleSave() {
    if (!title.trim() || !body.trim()) return;
    const ok = await onCreate({ title, body, sortOrder: (items.length + 1) * 10 });
    if (ok) {
      setTitle('');
      setBody('');
      setShowForm(false);
    }
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-[color:var(--minimal-text)]">Respostas cadastradas</h3>
        {!showForm ? (
          <button className="inline-flex items-center rounded-lg border border-[color:var(--minimal-border)] px-3 py-1.5 text-sm font-medium text-[color:var(--minimal-text)] hover:bg-[color:var(--minimal-surface-muted)]" onClick={() => setShowForm(true)} type="button">
            Adicionar resposta
          </button>
        ) : null}
      </div>

      {showForm ? (
        <div className="mb-4 rounded-lg border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface-muted)] p-3">
          <label className="block text-xs font-medium text-[color:var(--minimal-text-secondary)]">
            Título
            <input className={cx(inputClass, 'mt-1')} onChange={(event) => setTitle(event.target.value)} placeholder="Ex.: Recebido, em análise" value={title} />
          </label>
          <label className="mt-3 block text-xs font-medium text-[color:var(--minimal-text-secondary)]">
            Texto da resposta
            <textarea className={cx(inputClass, 'mt-1 resize-none')} onChange={(event) => setBody(event.target.value)} placeholder="O texto que será inserido no campo de resposta…" rows={3} value={body} />
          </label>
          {mutationError ? <p className="mt-2 text-xs text-[color:var(--color-danger-text)]">{mutationError}</p> : null}
          <div className="mt-3 flex items-center gap-2">
            <button className="inline-flex items-center rounded-lg border border-transparent bg-[color:var(--minimal-action)] px-3 py-1.5 text-sm font-medium text-[color:var(--minimal-action-ink)] disabled:opacity-60" disabled={mutating || !title.trim() || !body.trim()} onClick={() => void handleSave()} type="button">
              {mutating ? 'Salvando…' : 'Salvar'}
            </button>
            <button className="inline-flex items-center rounded-lg border border-[color:var(--minimal-border)] px-3 py-1.5 text-sm font-medium text-[color:var(--minimal-text-secondary)]" onClick={() => { setShowForm(false); setTitle(''); setBody(''); }} type="button">
              Cancelar
            </button>
          </div>
        </div>
      ) : null}

      {state.phase === 'loading' || state.phase === 'idle' ? (
        <p className="text-sm text-[color:var(--minimal-text-secondary)]">Carregando respostas…</p>
      ) : state.phase === 'error' ? (
        <div className="rounded-lg border border-[color:var(--color-danger-border)] bg-[color:var(--color-danger-surface)] px-4 py-3 text-sm text-[color:var(--color-danger-text)]">Não foi possível carregar agora. Atualize a página e tente novamente.</div>
      ) : items.length === 0 ? (
        <p className="text-sm text-[color:var(--minimal-text-secondary)]">Nenhuma resposta rápida cadastrada.</p>
      ) : (
        <div className="space-y-2">
          {items.map((item: QuickReply) => (
            <div className="rounded-lg border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] px-3.5 py-2.5" key={item.id}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-[color:var(--minimal-text)]">{item.title}</p>
                <button className="rounded-md px-2 py-1 text-xs font-medium text-[color:var(--minimal-text-tertiary)] hover:text-[color:var(--color-danger-text)] disabled:opacity-60" disabled={mutating} onClick={() => void onArchive(item.id)} type="button">Arquivar</button>
              </div>
              <p className="mt-1 text-xs leading-5 text-[color:var(--minimal-text-secondary)]">{item.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CustomerSegmentsPanel({
  state,
  onCreate,
  onArchive,
  mutating,
  mutationError,
}: {
  state: LoadState<CustomerSegment>;
  onCreate: (input: { label: string; colorToken: string; sortOrder: number }) => Promise<boolean>;
  onArchive: (id: string) => Promise<void>;
  mutating: boolean;
  mutationError: string | null;
}) {
  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState('');
  const [color, setColor] = useState('neutral');
  const items = state.phase === 'ready' ? state.items.filter((item: CustomerSegment) => item.isActive) : [];

  async function handleSave() {
    if (!label.trim()) return;
    const ok = await onCreate({ label, colorToken: color, sortOrder: (items.length + 1) * 10 });
    if (ok) {
      setLabel('');
      setColor('neutral');
      setShowForm(false);
    }
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-[color:var(--minimal-text)]">Segmentos cadastrados</h3>
        {!showForm ? (
          <button className="inline-flex items-center rounded-lg border border-[color:var(--minimal-border)] px-3 py-1.5 text-sm font-medium text-[color:var(--minimal-text)] hover:bg-[color:var(--minimal-surface-muted)]" onClick={() => setShowForm(true)} type="button">
            Adicionar segmento
          </button>
        ) : null}
      </div>
      {showForm ? (
        <div className="mb-4 rounded-lg border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface-muted)] p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-medium text-[color:var(--minimal-text-secondary)]">
              Nome do segmento
              <input className={cx(inputClass, 'mt-1')} onChange={(event) => setLabel(event.target.value)} placeholder="Ex.: Grande conta" value={label} />
            </label>
            <label className="text-xs font-medium text-[color:var(--minimal-text-secondary)]">
              Cor
              <select className={cx(inputClass, 'mt-1')} onChange={(event) => setColor(event.target.value)} value={color}>
                <option value="neutral">Neutra</option>
                <option value="info">Azul</option>
                <option value="success">Verde</option>
                <option value="warning">Amarela</option>
                <option value="danger">Vermelha</option>
              </select>
            </label>
          </div>
          {mutationError ? <p className="mt-2 text-xs text-[color:var(--color-danger-text)]">{mutationError}</p> : null}
          <div className="mt-3 flex items-center gap-2">
            <button className="inline-flex items-center rounded-lg border border-transparent bg-[color:var(--minimal-action)] px-3 py-1.5 text-sm font-medium text-[color:var(--minimal-action-ink)] disabled:opacity-60" disabled={mutating || !label.trim()} onClick={() => void handleSave()} type="button">
              {mutating ? 'Salvando…' : 'Salvar'}
            </button>
            <button className="inline-flex items-center rounded-lg border border-[color:var(--minimal-border)] px-3 py-1.5 text-sm font-medium text-[color:var(--minimal-text-secondary)]" onClick={() => { setShowForm(false); setLabel(''); }} type="button">
              Cancelar
            </button>
          </div>
        </div>
      ) : null}
      {state.phase === 'loading' || state.phase === 'idle' ? (
        <p className="text-sm text-[color:var(--minimal-text-secondary)]">Carregando segmentos…</p>
      ) : state.phase === 'error' ? (
        <div className="rounded-lg border border-[color:var(--color-danger-border)] bg-[color:var(--color-danger-surface)] px-4 py-3 text-sm text-[color:var(--color-danger-text)]">Não foi possível carregar agora. Atualize a página e tente novamente.</div>
      ) : items.length === 0 ? (
        <p className="text-sm text-[color:var(--minimal-text-secondary)]">Nenhum segmento cadastrado.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((item: CustomerSegment) => (
            <span className="inline-flex items-center gap-2 rounded-lg border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] px-3 py-1.5 text-sm" key={item.id}>
              <ColorPill label={item.label} token={item.colorToken} />
              <button className="text-xs font-medium text-[color:var(--minimal-text-tertiary)] hover:text-[color:var(--color-danger-text)] disabled:opacity-60" disabled={mutating} onClick={() => void onArchive(item.id)} type="button">Arquivar</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function TicketCategoriesPanel({ state }: { state: LoadState<TicketCategory> }) {
  const items = state.phase === 'ready' ? state.items : [];
  if (state.phase === 'loading' || state.phase === 'idle') {
    return <p className="text-sm text-[color:var(--minimal-text-secondary)]">Carregando categorias…</p>;
  }
  if (state.phase === 'error') {
    return <div className="rounded-lg border border-[color:var(--color-danger-border)] bg-[color:var(--color-danger-surface)] px-4 py-3 text-sm text-[color:var(--color-danger-text)]">Não foi possível carregar agora. Atualize a página e tente novamente.</div>;
  }
  if (items.length === 0) {
    return <p className="text-sm text-[color:var(--minimal-text-secondary)]">Nenhuma categoria cadastrada.</p>;
  }
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-[color:var(--minimal-text)]">Categorias cadastradas</h3>
      <div className="overflow-hidden rounded-lg border border-[color:var(--minimal-border)]">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface-muted)] text-xs text-[color:var(--minimal-text-tertiary)]">
            <tr><th className="px-3 py-2 font-medium">Categoria</th><th className="px-3 py-2 font-medium">Descrição</th><th className="px-3 py-2 font-medium">Status</th></tr>
          </thead>
          <tbody>
            {items.map((item: TicketCategory) => (
              <tr className="border-b border-[color:var(--minimal-border)] last:border-b-0" key={item.id}>
                <td className="px-3 py-2.5 font-medium text-[color:var(--minimal-text)]">{item.name}</td>
                <td className="px-3 py-2.5 text-[color:var(--minimal-text-secondary)]">{item.description ?? '—'}</td>
                <td className="px-3 py-2.5">
                  <span className={cx('inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium', item.status === 'active' ? 'border-[color:var(--color-success-border)] bg-[color:var(--color-success-surface)] text-[color:var(--color-success-text)]' : 'border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface-muted)] text-[color:var(--minimal-text-secondary)]')}>
                    {item.status === 'active' ? 'Ativa' : item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs leading-5 text-[color:var(--minimal-text-tertiary)]">As categorias exibidas aqui orientam a classificação do atendimento e podem ser arquivadas quando deixarem de ser usadas.</p>
    </div>
  );
}

function GroupDetail({
  group,
  conversationTypes,
  priorityLevels,
  onCreate,
  onArchive,
  onCreatePriority,
  onArchivePriority,
  quickReplies,
  onCreateQuickReply,
  onArchiveQuickReply,
  customerSegments,
  onCreateSegment,
  onArchiveSegment,
  brands,
  onCreateBrand,
  onArchiveBrand,
  helpCenterSupportContacts,
  onSaveHelpCenterSupportContacts,
  ticketCategories,
  mutating,
  mutationError,
  integrations,
  onReloadIntegrations,
  onSaveIntegration,
}: {
  group: SettingsGroup;
  conversationTypes: LoadState<ConversationType>;
  priorityLevels: LoadState<PriorityLevel>;
  onCreate: (input: { label: string; defaultAreaKey: string; sortOrder: number }) => Promise<boolean>;
  onArchive: (id: string) => Promise<void>;
  onCreatePriority: (input: { label: string; weight: number; colorToken: string | null; sortOrder: number }) => Promise<boolean>;
  onArchivePriority: (id: string) => Promise<void>;
  quickReplies: LoadState<QuickReply>;
  onCreateQuickReply: (input: { title: string; body: string; sortOrder: number }) => Promise<boolean>;
  onArchiveQuickReply: (id: string) => Promise<void>;
  customerSegments: LoadState<CustomerSegment>;
  onCreateSegment: (input: { label: string; colorToken: string; sortOrder: number }) => Promise<boolean>;
  onArchiveSegment: (id: string) => Promise<void>;
  brands: LoadState<Brand>;
  onCreateBrand: (input: { label: string; helpCenterSlug: string; sortOrder: number }) => Promise<boolean>;
  onArchiveBrand: (id: string) => Promise<void>;
  helpCenterSupportContacts: LoadState<HelpCenterSupportContacts>;
  onSaveHelpCenterSupportContacts: (input: HelpCenterSupportContacts) => Promise<void>;
  ticketCategories: LoadState<TicketCategory>;
  mutating: boolean;
  mutationError: string | null;
  integrations: LoadState<ManagedIntegration>;
  onReloadIntegrations: () => Promise<void>;
  onSaveIntegration: (input: Parameters<typeof saveManagedIntegration>[0]) => Promise<void>;
}) {
  const isConversationTypes = group.id === 'tipos-conversa';
  const isPriorities = group.id === 'prioridades';
  const isQuickReplies = group.id === 'respostas-rapidas';
  const isSegments = group.id === 'segmentos';
  const isBrands = group.id === 'marcas';
  const isHelpCenter = group.id === 'central-ajuda';
  const isCategorias = group.id === 'categorias';
  const isIntegrations = group.id === 'integracoes';

  return (
    <article className="min-h-0 bg-[color:var(--minimal-surface)]">
      {DASHBOARD_SECTION_IDS.includes(group.id) ? (
        // As duas telas do eixo de dados trazem o próprio cabeçalho de página,
        // com breadcrumb, metadado de leitura e ações da seção.
        <div className="px-5 py-5 sm:px-6">
          {group.id === 'dashboard-fontes' ? <DashboardSourcesSettingsPage /> : <SyncHistorySettingsPage />}
        </div>
      ) : isIntegrations ? (
        // Integrações traz o próprio cabeçalho de página: título, contexto de
        // leitura e a ação de reler o estado ficam na composição da tela.
        <div className="px-5 py-5 sm:px-6">
          {integrations.phase === 'ready' ? (
            <SettingsIntegrationsPanel busy={mutating} error={mutationError} integrations={integrations.items} onReload={onReloadIntegrations} onSave={onSaveIntegration} />
          ) : integrations.phase === 'error' ? (
            <div className="rounded-lg border border-[color:var(--color-danger-border)] bg-[color:var(--color-danger-surface)] px-4 py-3 text-sm text-[color:var(--color-danger-text)]">Não foi possível carregar as integrações agora.</div>
          ) : (
            <p className="text-sm text-[color:var(--minimal-text-secondary)]">Carregando integrações…</p>
          )}
        </div>
      ) : isBrands ? (
        // Marcas traz o próprio cabeçalho de página: título, contagem de marcas
        // ativas e a ação de cadastro ficam na composição da tela.
        <div className="px-5 py-5 sm:px-6">
          <BrandsSettingsPage mutating={mutating} mutationError={mutationError} onArchive={onArchiveBrand} onCreate={onCreateBrand} state={brands} />
        </div>
      ) : isHelpCenter ? (
        // Central de ajuda também responde pelo próprio cabeçalho, com a ação de
        // abrir a central pública.
        <div className="px-5 py-5 sm:px-6">
          <HelpCenterSettingsPage mutating={mutating} mutationError={mutationError} onSave={onSaveHelpCenterSupportContacts} state={helpCenterSupportContacts} />
        </div>
      ) : (
      <>
      <header className="border-b border-[color:var(--minimal-border)] px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold tracking-[-0.025em] text-[color:var(--minimal-text)]">{group.label}</h2>
            <p className="mt-1 text-sm text-[color:var(--minimal-text-secondary)]">{group.description}</p>
          </div>

        </div>
      </header>

      <div className="divide-y divide-[color:var(--minimal-border)]">
        <section className="gso-settings-context-strip px-5 py-3 sm:px-6" aria-label="Resumo da configuração">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="text-xs font-semibold text-[color:var(--minimal-text)]">Nesta área</span>
            <div className="flex flex-wrap gap-1.5">{group.controls.map((control: string) => <span className="gso-settings-context-chip" key={control}>{control}</span>)}</div>
            <span className="text-xs text-[color:var(--minimal-text-secondary)]">Usado em: {group.usadoEm}</span>
          </div>
          {group.nota ? <p className="mt-1 text-[11px] leading-4 text-[color:var(--minimal-text-tertiary)]">{group.nota}</p> : null}
        </section>

        <section className="px-5 py-5 sm:px-6">
          {isConversationTypes ? (
            <ConversationTypesPanel mutating={mutating} mutationError={mutationError} onArchive={onArchive} onCreate={onCreate} state={conversationTypes} />
          ) : isPriorities ? (
            <PriorityLevelsPanel mutating={mutating} mutationError={mutationError} onArchive={onArchivePriority} onCreate={onCreatePriority} state={priorityLevels} />
          ) : isQuickReplies ? (
            <QuickRepliesPanel mutating={mutating} mutationError={mutationError} onArchive={onArchiveQuickReply} onCreate={onCreateQuickReply} state={quickReplies} />
          ) : isSegments ? (
            <CustomerSegmentsPanel mutating={mutating} mutationError={mutationError} onArchive={onArchiveSegment} onCreate={onCreateSegment} state={customerSegments} />
          ) : isCategorias ? (
            <TicketCategoriesPanel state={ticketCategories} />
          ) : group.status === 'existe_hoje' ? (
            <div className="rounded-lg border border-[color:var(--color-info-border)] bg-[color:var(--color-info-surface)] px-4 py-3 text-sm text-[color:var(--color-info-text)]">Já existe no sistema. Será centralizado aqui para edição em um único lugar.</div>
          ) : (
            <div className="rounded-lg border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface-muted)] px-4 py-3 text-sm text-[color:var(--minimal-text-secondary)]">Em breve — este parâmetro será configurável nesta tela, sem depender de código.</div>
          )}
        </section>
      </div>
      </>
      )}
    </article>
  );
}

export function SettingsPage() {
  const { gate } = useAuthContext();
  const location = useLocation();
  const isDashboardViewer = gate.actor?.roles.includes('dashboard_viewer') === true && gate.actor?.is_platform_admin !== true;
  // Ordem de validacao: superficie do release primeiro, permissao do perfil
  // depois. Configuracoes passa a exibir apenas o que o usuario pode operar.
  // Referência estável a partir do contexto de auth: evita recalcular os memos
  // que dependem de permissão a cada render e deixa a dependência explícita.
  const settingsPermissions = useMemo(
    () => ({
      isPlatformAdmin: gate.actor?.is_platform_admin === true,
      screenKeys: gate.actor?.screen_keys ?? [],
    }),
    [gate.actor?.is_platform_admin, gate.actor?.screen_keys],
  );
  const visibleGroups = useMemo(
    () => GROUPS.filter((group) => canOpenSettingsSection(group.id, settingsPermissions)),
    [settingsPermissions],
  );
  const requestedSection = sectionFromPathname(location.pathname) ?? 'integracoes';
  const [selectedId, setSelectedId] = useState<string>(() => {
    // A busca global do Genio deixa aqui a secao pedida.
    try {
      const requested = window.sessionStorage.getItem('genius.settings-section');
      if (requested) {
        window.sessionStorage.removeItem('genius.settings-section');
        if (visibleGroups.some((group) => group.id === requested)) return requested;
      }
    } catch {
      // sessionStorage indisponivel: segue com a primeira secao visivel.
    }
    if (requestedSection && visibleGroups.some((group) => group.id === requestedSection)) return requestedSection;
    return visibleGroups[0]?.id ?? GROUPS[0].id;
  });
  const [conversationTypes, setConversationTypes] = useState<LoadState<ConversationType>>({ phase: 'idle' });
  const [priorityLevels, setPriorityLevels] = useState<LoadState<PriorityLevel>>({ phase: 'idle' });
  const [quickReplies, setQuickReplies] = useState<LoadState<QuickReply>>({ phase: 'idle' });
  const [customerSegments, setCustomerSegments] = useState<LoadState<CustomerSegment>>({ phase: 'idle' });
  const [brands, setBrands] = useState<LoadState<Brand>>({ phase: 'idle' });
  const [helpCenterSupportContacts, setHelpCenterSupportContacts] = useState<LoadState<HelpCenterSupportContacts>>({ phase: 'idle' });
  const [ticketCategories, setTicketCategories] = useState<LoadState<TicketCategory>>({ phase: 'idle' });
  const [integrations, setIntegrations] = useState<LoadState<ManagedIntegration>>({ phase: 'idle' });
  const [mutating, setMutating] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const selected = visibleGroups.find((group: SettingsGroup) => group.id === selectedId) ?? visibleGroups[0];

  useEffect(() => {
    const next = isDashboardViewer ? 'integracoes' : sectionFromPathname(location.pathname);
    if (next && visibleGroups.some((group) => group.id === next) && selectedId !== next) setSelectedId(next);
  }, [isDashboardViewer, location.pathname, selectedId, visibleGroups]);

  const loadTypes = useCallback(async () => {
    setConversationTypes({ phase: 'loading' });
    try {
      const items = await listConversationTypes();
      setConversationTypes({ phase: 'ready', items });
    } catch {
      setConversationTypes({ phase: 'error' });
    }
  }, []);

  const loadPriorities = useCallback(async () => {
    setPriorityLevels({ phase: 'loading' });
    try {
      const items = await listPriorityLevels();
      setPriorityLevels({ phase: 'ready', items });
    } catch {
      setPriorityLevels({ phase: 'error' });
    }
  }, []);

  const loadQuickReplies = useCallback(async () => {
    setQuickReplies({ phase: 'loading' });
    try {
      const items = await listQuickReplies();
      setQuickReplies({ phase: 'ready', items });
    } catch {
      setQuickReplies({ phase: 'error' });
    }
  }, []);

  const loadSegments = useCallback(async () => {
    setCustomerSegments({ phase: 'loading' });
    try {
      const items = await listCustomerSegments();
      setCustomerSegments({ phase: 'ready', items });
    } catch {
      setCustomerSegments({ phase: 'error' });
    }
  }, []);

  const loadBrands = useCallback(async () => {
    setBrands({ phase: 'loading' });
    try {
      const items = await listBrands();
      setBrands({ phase: 'ready', items });
    } catch {
      setBrands({ phase: 'error' });
    }
  }, []);

  const loadHelpCenterSupportContacts = useCallback(async () => {
    setHelpCenterSupportContacts({ phase: 'loading' });
    try {
      const items = await listHelpCenterSupportContacts();
      setHelpCenterSupportContacts({ phase: 'ready', items });
    } catch {
      setHelpCenterSupportContacts({ phase: 'error' });
    }
  }, []);

  const loadCategories = useCallback(async () => {
    setTicketCategories({ phase: 'loading' });
    try {
      const items = await listTicketCategories();
      setTicketCategories({ phase: 'ready', items });
    } catch {
      setTicketCategories({ phase: 'error' });
    }
  }, []);

  const loadIntegrations = useCallback(async () => {
    setIntegrations({ phase: 'loading' });
    try {
      const items = await listManagedIntegrations();
      setIntegrations({ phase: 'ready', items });
    } catch {
      setIntegrations({ phase: 'error' });
    }
  }, []);

  useEffect(() => {
    // Cada read model só é consultado quando a seção correspondente está
    // realmente aberta e autorizada. Carregar todas as configurações no mount
    // disparava leituras de módulos que o operador não está usando e gerava
    // 403 de RLS (por exemplo, categorias ao abrir Integrações).
    if (!selected) return;
    if (selected.id === 'tipos-conversa') void loadTypes();
    if (selected.id === 'prioridades') void loadPriorities();
    if (selected.id === 'respostas-rapidas') void loadQuickReplies();
    if (selected.id === 'segmentos') void loadSegments();
    if (selected.id === 'marcas') void loadBrands();
    if (selected.id === 'central-ajuda') void loadHelpCenterSupportContacts();
    if (selected.id === 'categorias') void loadCategories();
    if (selected.id === 'integracoes') void loadIntegrations();
  }, [selected, loadTypes, loadPriorities, loadQuickReplies, loadSegments, loadBrands, loadHelpCenterSupportContacts, loadCategories, loadIntegrations]);

  const handleSaveIntegration = useCallback(
    async (input: Parameters<typeof saveManagedIntegration>[0]) => {
      setMutating(true);
      setMutationError(null);
      try {
        await saveManagedIntegration(input);
        await loadIntegrations();
      } catch {
        setMutationError('Não foi possível salvar a configuração da integração agora.');
      } finally {
        setMutating(false);
      }
    },
    [loadIntegrations],
  );

  const handleSaveHelpCenterSupportContacts = useCallback(
    async (input: HelpCenterSupportContacts) => {
      setMutating(true);
      setMutationError(null);
      try {
        await saveHelpCenterSupportContacts(input);
        await loadHelpCenterSupportContacts();
      } catch {
        setMutationError('Não foi possível salvar os contatos da Central agora. Verifique os formatos informados.');
      } finally {
        setMutating(false);
      }
    },
    [loadHelpCenterSupportContacts],
  );

  const handleCreate = useCallback(
    async (input: { label: string; defaultAreaKey: string; sortOrder: number }) => {
      setMutating(true);
      setMutationError(null);
      try {
        await createConversationType(input);
        await loadTypes();
        return true;
      } catch {
        setMutationError('Não foi possível salvar. Verifique se já existe um tipo com esse nome.');
        return false;
      } finally {
        setMutating(false);
      }
    },
    [loadTypes],
  );

  const handleArchive = useCallback(
    async (id: string) => {
      setMutating(true);
      setMutationError(null);
      try {
        await archiveConversationType(id);
        await loadTypes();
      } catch {
        setMutationError('Não foi possível arquivar agora.');
      } finally {
        setMutating(false);
      }
    },
    [loadTypes],
  );

  const handleCreatePriority = useCallback(
    async (input: { label: string; weight: number; colorToken: string | null; sortOrder: number }) => {
      setMutating(true);
      setMutationError(null);
      try {
        await createPriorityLevel(input);
        await loadPriorities();
        return true;
      } catch {
        setMutationError('Não foi possível salvar. Verifique se já existe um nível com esse nome.');
        return false;
      } finally {
        setMutating(false);
      }
    },
    [loadPriorities],
  );

  const handleCreateQuickReply = useCallback(
    async (input: { title: string; body: string; sortOrder: number }) => {
      setMutating(true);
      setMutationError(null);
      try {
        await createQuickReply(input);
        await loadQuickReplies();
        return true;
      } catch {
        setMutationError('Não foi possível salvar a resposta agora.');
        return false;
      } finally {
        setMutating(false);
      }
    },
    [loadQuickReplies],
  );

  const handleArchiveQuickReply = useCallback(
    async (id: string) => {
      setMutating(true);
      setMutationError(null);
      try {
        await archiveQuickReply(id);
        await loadQuickReplies();
      } catch {
        setMutationError('Não foi possível arquivar agora.');
      } finally {
        setMutating(false);
      }
    },
    [loadQuickReplies],
  );

  const handleCreateSegment = useCallback(
    async (input: { label: string; colorToken: string; sortOrder: number }) => {
      setMutating(true);
      setMutationError(null);
      try {
        await createCustomerSegment(input);
        await loadSegments();
        return true;
      } catch {
        setMutationError('Não foi possível salvar o segmento agora.');
        return false;
      } finally {
        setMutating(false);
      }
    },
    [loadSegments],
  );

  const handleCreateBrand = useCallback(
    async (input: { label: string; helpCenterSlug: string; sortOrder: number }) => {
      setMutating(true);
      setMutationError(null);
      try {
        await createBrand(input);
        await loadBrands();
        return true;
      } catch {
        setMutationError('Não foi possível salvar a marca agora.');
        return false;
      } finally {
        setMutating(false);
      }
    },
    [loadBrands],
  );

  const handleArchiveBrand = useCallback(
    async (id: string) => {
      setMutating(true);
      setMutationError(null);
      try {
        await archiveBrand(id);
        await loadBrands();
      } catch {
        setMutationError('Não foi possível arquivar agora.');
      } finally {
        setMutating(false);
      }
    },
    [loadBrands],
  );

  const handleArchiveSegment = useCallback(
    async (id: string) => {
      setMutating(true);
      setMutationError(null);
      try {
        await archiveCustomerSegment(id);
        await loadSegments();
      } catch {
        setMutationError('Não foi possível arquivar agora.');
      } finally {
        setMutating(false);
      }
    },
    [loadSegments],
  );

  const handleArchivePriority = useCallback(
    async (id: string) => {
      setMutating(true);
      setMutationError(null);
      try {
        await archivePriorityLevel(id);
        await loadPriorities();
      } catch {
        setMutationError('Não foi possível arquivar agora.');
      } finally {
        setMutating(false);
      }
    },
    [loadPriorities],
  );

  return (
    <div className="gso-settings-shell gso-visual-v1-settings-shell gso-high-density-ui flex h-full min-h-0 flex-col bg-[color:var(--minimal-surface)]">
      {/* A navegação das seções de Configurações vive na sidebar global. Aqui
          resta apenas o conteúdo da seção pedida pela rota, em uma coluna
          única, e cada seção responde pelo próprio cabeçalho. */}
      <div className="gso-settings-cockpit-layout flex min-h-0 flex-1 flex-col overflow-y-auto">
        <main className="gso-settings-cockpit-main min-w-0 flex-1">
          <GroupDetail
          conversationTypes={conversationTypes}
          group={selected}
          mutating={mutating}
          mutationError={mutationError}
          onArchive={handleArchive}
          onArchivePriority={handleArchivePriority}
          onCreate={handleCreate}
          onCreatePriority={handleCreatePriority}
          onArchiveQuickReply={handleArchiveQuickReply}
          onCreateQuickReply={handleCreateQuickReply}
          onArchiveSegment={handleArchiveSegment}
          onCreateSegment={handleCreateSegment}
          onArchiveBrand={handleArchiveBrand}
          onCreateBrand={handleCreateBrand}
          brands={brands}
          helpCenterSupportContacts={helpCenterSupportContacts}
          onSaveHelpCenterSupportContacts={handleSaveHelpCenterSupportContacts}
          ticketCategories={ticketCategories}
          customerSegments={customerSegments}
          priorityLevels={priorityLevels}
          quickReplies={quickReplies}
          integrations={integrations}
          onReloadIntegrations={loadIntegrations}
          onSaveIntegration={handleSaveIntegration}
          />
        </main>
      </div>
    </div>
  );
}
