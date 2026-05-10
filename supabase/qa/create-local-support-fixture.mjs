import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const FIXTURE = {
  qaAdmin: {
    email: 'qa.local.platform-admin@genius.local',
    password: 'Local-QA-Admin-2026!',
    fullName: 'QA Local Platform Admin',
  },
  contentAuthor: {
    email: 'ede.oliveira@confi.com.vc',
    password: 'Admin123!',
    fullName: 'Eduardo Oliveira',
  },
  agents: [
    {
      key: 'support-agent-a',
      email: 'qa.local.support-agent-a@genius.local',
      password: 'Local-QA-Agent-A-2026!',
      fullName: 'QA Local Support Agent A',
      globalRole: 'support_agent',
      tenantSlug: 'support-qa-a',
    },
    {
      key: 'support-manager-a',
      email: 'qa.local.support-manager-a@genius.local',
      password: 'Local-QA-Manager-A-2026!',
      fullName: 'QA Local Support Manager A',
      globalRole: 'support_manager',
      tenantSlug: 'support-qa-a',
    },
    {
      key: 'support-agent-b',
      email: 'qa.local.support-agent-b@genius.local',
      password: 'Local-QA-Agent-B-2026!',
      fullName: 'QA Local Support Agent B',
      globalRole: 'support_agent',
      tenantSlug: 'support-qa-b',
    },
    {
      key: 'engineering-member-a',
      email: 'qa.local.engineering-member-a@genius.local',
      password: 'Local-QA-Engineering-A-2026!',
      fullName: 'QA Local Engineering Member A',
      globalRole: 'engineering_member',
      tenantSlug: 'support-qa-a',
    },
  ],
  accessUsers: [
    {
      key: 'access-tenant-admin',
      email: 'qa.local.access-tenant-admin@genius.local',
      password: 'Local-QA-Access-Admin-2026!',
      fullName: 'QA Local Access Tenant Admin',
      tenantSlug: 'support-qa-a',
      role: 'tenant_admin',
      status: 'active',
    },
    {
      key: 'access-invited-viewer',
      email: 'qa.local.access-invited-viewer@genius.local',
      password: 'Local-QA-Access-Viewer-2026!',
      fullName: 'QA Local Access Invited Viewer',
      tenantSlug: 'support-qa-b',
      role: 'tenant_viewer',
      status: 'invited',
    },
    {
      key: 'access-revoked-requester',
      email: 'qa.local.access-revoked-requester@genius.local',
      password: 'Local-QA-Access-Revoked-2026!',
      fullName: 'QA Local Access Revoked Requester',
      tenantSlug: 'support-qa-c',
      role: 'tenant_requester',
      status: 'revoked',
    },
  ],
  customerPortalUsers: [
    {
      key: 'customer-user-a',
      email: 'marina.ops@support-qa-a.local',
      password: 'Local-QA-Customer-A-2026!',
      fullName: 'Marina Operações QA',
      tenantSlug: 'support-qa-a',
      role: 'customer_user',
      status: 'active',
      contact: {
        fullName: 'Marina Operações QA',
        email: 'marina.ops@support-qa-a.local',
        phone: '+55 11 91000-0001',
        jobTitle: 'Coordenação de Operações',
      },
    },
    {
      key: 'customer-manager-a',
      email: 'gestao.portal@support-qa-a.local',
      password: 'Local-QA-Customer-Manager-A-2026!',
      fullName: 'Gestão Portal QA Tenant A',
      tenantSlug: 'support-qa-a',
      role: 'customer_manager',
      status: 'active',
      contact: {
        fullName: 'Gestão Portal QA Tenant A',
        email: 'gestao.portal@support-qa-a.local',
        phone: '+55 11 91000-0004',
        jobTitle: 'Gestão de Atendimento B2B',
      },
    },
    {
      key: 'customer-user-b',
      email: 'rafael.integracoes@support-qa-b.local',
      password: 'Local-QA-Customer-B-2026!',
      fullName: 'Rafael Integrações QA',
      tenantSlug: 'support-qa-b',
      role: 'customer_user',
      status: 'active',
      contact: {
        fullName: 'Rafael Integrações QA',
        email: 'rafael.integracoes@support-qa-b.local',
        phone: '+55 11 91000-0002',
        jobTitle: 'Analista de Integrações',
      },
    },
    {
      key: 'customer-no-access',
      email: 'sem.acesso.portal@support-qa-b.local',
      password: 'Local-QA-Customer-No-Access-2026!',
      fullName: 'Cliente Sem Acesso QA',
      tenantSlug: 'support-qa-b',
      role: 'customer_user',
      status: 'revoked',
      contact: {
        fullName: 'Cliente Sem Acesso QA',
        email: 'sem.acesso.portal@support-qa-b.local',
        phone: '+55 11 91000-0005',
        jobTitle: 'Contato sem acesso ativo',
      },
    },
  ],
  tenants: [
    {
      slug: 'support-qa-a',
      legalName: 'Support QA Tenant A Ltda',
      displayName: 'Support QA Tenant A',
      contact: {
        fullName: 'Marina Operações QA',
        email: 'marina.ops@support-qa-a.local',
        phone: '+55 11 91000-0001',
        jobTitle: 'Coordenação de Operações',
      },
      customerAccount: {
        productLine: 'genius_returns',
        operationalStatus: 'active',
        accountTier: 'enterprise',
        internalNotes:
          'Conta com acompanhamento operacional proximo e fluxo sensivel de devoluções.',
        operationalFlags: {
          high_touch_account: true,
          custom_operational_flow: true,
          integration_sensitive_account: true,
        },
        integrations: [
          {
            integrationType: 'erp',
            provider: 'totvs',
            status: 'active',
            environment: 'production',
            notes: 'Integra pedidos, devoluções e conciliação financeira do tenant.',
          },
          {
            integrationType: 'carrier',
            provider: 'correios',
            status: 'active',
            environment: 'production',
            notes: 'Operação principal de coleta e tracking contratada pelo tenant.',
          },
        ],
        features: [
          {
            featureKey: 'returns_portal',
            enabled: true,
            source: 'contract',
            notes: 'Portal principal de operacao habilitado.',
          },
          {
            featureKey: 'refund_manual_review',
            enabled: true,
            source: 'operations',
            notes: 'CS valida casos de estorno com revisao humana.',
          },
        ],
        customizations: [
          {
            title: 'Fluxo prioritario de coleta',
            description:
              'Coletas de alto valor seguem janela dedicada e retorno manual do suporte.',
            riskLevel: 'high',
            operationalNote:
              'Antes de responder, conferir janela combinada e fila operacional dedicada.',
            status: 'active',
          },
        ],
        alerts: [
          {
            severity: 'warning',
            title: 'Janela de ERP reduzida',
            description:
              'Evitar respostas conclusivas fora da janela homologada de sincronização do ERP.',
          },
        ],
      },
    },
    {
      slug: 'support-qa-b',
      legalName: 'Support QA Tenant B Ltda',
      displayName: 'Support QA Tenant B',
      contact: {
        fullName: 'Rafael Integrações QA',
        email: 'rafael.integracoes@support-qa-b.local',
        phone: '+55 11 91000-0002',
        jobTitle: 'Analista de Integrações',
      },
      customerAccount: {
        productLine: 'after_sale',
        operationalStatus: 'limited',
        accountTier: 'growth',
        internalNotes:
          'Tenant B opera com stack mais simples e depende de apoio tecnico pontual.',
        operationalFlags: {
          restricted_support_window: true,
        },
        integrations: [
          {
            integrationType: 'ecommerce_platform',
            provider: 'shopify',
            status: 'active',
            environment: 'production',
            notes: 'Plataforma de ecommerce principal do tenant B.',
          },
        ],
        features: [
          {
            featureKey: 'basic_returns_flow',
            enabled: true,
            source: 'contract',
            notes: 'Fluxo basico ativo para operacao do tenant B.',
          },
        ],
        customizations: [
          {
            title: 'Motivo customizado de homologação',
            description:
              'Tenant B depende de motivo especial durante ajustes de onboarding estendido.',
            riskLevel: 'medium',
            operationalNote:
              'Se o ticket tocar homologação, responder com cautela e revisar a regra ativa.',
            status: 'active',
          },
        ],
        alerts: [
          {
            severity: 'info',
            title: 'Onboarding estendido',
            description:
              'Acompanhar chamados do tenant B considerando a fase atual de onboarding assistido.',
          },
        ],
      },
    },
    {
      slug: 'support-qa-c',
      legalName: 'Support QA Tenant C Ltda',
      displayName: 'Support QA Tenant C',
    },
  ],
  tickets: [
    {
      tenantSlug: 'support-qa-a',
      title: 'QA Support | Conciliacao de devoluções com atraso',
      description:
        'Cliente B2B reporta atraso na conciliação das devoluções aprovadas na plataforma.',
      priority: 'high',
      severity: 'medium',
      source: 'portal',
      categorySlug: 'estorno-reembolso',
      operationalReasonSlug: 'classificacao-inicial',
      assignee: 'support-agent-a',
      status: 'in_progress',
      slaScenario: 'at_risk',
      publicMessage:
        'Recebemos o caso e estamos validando a trilha operacional da conciliação.',
      internalNote:
        'Validar lote de conciliação, janela de sincronização e discrepâncias por cliente.',
      extraTimelineEntries: 18,
    },
    {
      tenantSlug: 'support-qa-a',
      title: 'QA Support | Webhook sem retorno na integração ERP',
      description:
        'O cliente informa que o webhook de atualização de status não retornou confirmação.',
      priority: 'urgent',
      severity: 'critical',
      source: 'api',
      categorySlug: 'integracao-tecnica',
      operationalReasonSlug: 'classificacao-inicial',
      assignee: null,
      status: 'waiting_engineering',
      slaScenario: 'breached',
      publicMessage:
        'Registramos o incidente e escalamos a validação técnica do endpoint informado.',
      internalNote:
        'Conferir timeout, retries e eventuais bloqueios no endpoint do tenant.',
    },
    {
      tenantSlug: 'support-qa-a',
      title: 'QA Support | Etiqueta sem baixa automatica',
      description:
        'A equipe operacional relata que etiquetas expedidas não estão baixando automaticamente no cliente.',
      priority: 'high',
      severity: 'medium',
      source: 'email',
      categorySlug: 'devolucao-troca',
      operationalReasonSlug: 'classificacao-inicial',
      assignee: 'support-manager-a',
      status: 'triage',
      publicMessage:
        'Iniciamos a triagem do fluxo logístico e vamos retornar com o próximo passo.',
      internalNote:
        'Cruzar webhook da transportadora com o reconciliador interno antes de responder.',
    },
    {
      tenantSlug: 'support-qa-a',
      title: 'QA Support | Painel de SLA interno desalinhado',
      description:
        'O time percebeu divergência entre a fila interna e a expectativa contratual do cliente.',
      priority: 'normal',
      severity: 'low',
      source: 'internal',
      categorySlug: 'dados-relatorios',
      operationalReasonSlug: 'classificacao-ajustada',
      assignee: null,
      status: 'waiting_customer',
      publicMessage:
        'Pedimos confirmação do horário de corte aplicado pelo cliente para revisar a fila.',
      internalNote:
        'Não tratar como SLA de produto ainda; apenas validar o entendimento operacional.',
    },
    {
      tenantSlug: 'support-qa-a',
      title: 'QA Support | Reenvio de coleta sem tracking',
      description:
        'A operação informou reenvio sem número de rastreio disponível para o cliente.',
      priority: 'normal',
      severity: 'medium',
      source: 'phone',
      categorySlug: 'devolucao-troca',
      operationalReasonSlug: 'classificacao-ajustada',
      assignee: 'support-agent-a',
      status: 'waiting_support',
      publicMessage:
        'Estamos consolidando a trilha do reenvio para responder com status unico.',
      internalNote:
        'Buscar correlação entre a coleta original e a ordem de reenvio no cliente.',
    },
    {
      tenantSlug: 'support-qa-a',
      title: 'QA Support | Divergência na regra de expedição',
      description:
        'O fluxo de expedição apresentou comportamento diferente do combinado no rollout do cliente.',
      priority: 'urgent',
      severity: 'high',
      source: 'portal',
      categorySlug: 'operacao-plataforma',
      operationalReasonSlug: 'classificacao-inicial',
      assignee: 'support-manager-a',
      status: 'in_progress',
      publicMessage:
        'Caso priorizado pelo suporte. Estamos revisando a regra operacional aplicada.',
      internalNote:
        'Comparar as configurações atuais do cliente com a baseline de implantação aprovada.',
    },
    {
      tenantSlug: 'support-qa-a',
      title: 'QA Support | Ajuste de motivo pendente em homologação',
      description:
        'Mudança de motivo ainda pendente de aprovação final do cliente em homologação.',
      priority: 'low',
      severity: 'low',
      source: 'internal',
      assignee: null,
      status: 'new',
      publicMessage:
        'Ticket aberto para acompanhar a aprovação final antes de aplicar a configuração.',
      internalNote:
        'Sem ação técnica agora. Aguarde o retorno do time responsável.',
    },
    {
      tenantSlug: 'support-qa-c',
      title: 'QA Support | Intake criado via RPC sem solicitante',
      description:
        'Ticket aberto pelo fluxo real de intake para validar tenant sem contato ativo vinculado.',
      priority: 'normal',
      severity: 'medium',
      source: 'internal',
      assignee: null,
      status: 'new',
      publicMessage:
        'Fluxo de intake validado sem contato vinculado no momento da abertura.',
      internalNote:
        'Confirmar visibilidade na fila e trilha inicial de auditoria após criação via RPC.',
      viaRpc: true,
    },
    {
      tenantSlug: 'support-qa-b',
      title: 'QA Support | Divergência de tracking em cliente B',
      description:
        'O cliente B reportou divergência pontual entre o tracking externo e o status refletido no app.',
      priority: 'high',
      severity: 'medium',
      source: 'api',
      assignee: 'support-agent-b',
      status: 'triage',
      publicMessage:
        'Estamos verificando a divergência do evento de tracking informado.',
      internalNote:
        'Conferir o payload do cliente B e a cronologia dos eventos recebidos.',
    },
    {
      tenantSlug: 'support-qa-b',
      title: 'QA Support | Regra de motivo precisa de ajuste',
      description:
        'O time pediu orientação para uma regra de motivo que deixou de refletir a política atual do cliente.',
      priority: 'normal',
      severity: 'low',
      source: 'internal',
      assignee: 'support-manager-a',
      status: 'waiting_customer',
      publicMessage:
        'Solicitamos a confirmação do novo critério operacional para concluir a configuração.',
      internalNote:
        'Aguardando o retorno do cliente com o mapeamento final dos motivos aprovados.',
    },
  ],
  customerPortalCollaborations: [
    {
      ticketTenantSlug: 'support-qa-a',
      ticketTitle: 'QA Support | Painel de SLA interno desalinhado',
      actorKey: 'customer-manager-a',
      message:
        'Confirmamos o horário de corte operacional. Podem seguir com a revisão pelo suporte.',
      acknowledge: true,
    },
  ],
  knowledgeBase: {
    categories: [
      {
        tenantSlug: 'support-qa-a',
        name: 'Suporte interno tenant A',
        slug: 'support-interno-tenant-a',
        description: 'Playbooks internos operacionais do tenant A.',
        visibility: 'internal',
      },
      {
        tenantSlug: 'support-qa-a',
        name: 'Suporte restrito tenant A',
        slug: 'support-restrito-tenant-a',
        description: 'Referencias restritas do tenant A.',
        visibility: 'restricted',
      },
    ],
    articles: [
      {
        tenantSlug: 'support-qa-a',
        categorySlug: 'support-interno-tenant-a',
        title: 'ERP: diagnóstico interno de webhook',
        slug: 'erp-diagnostico-interno-webhook',
        summary: 'Passo a passo interno para diagnosticar timeouts e retries do webhook.',
        bodyMd:
          'Uso interno do suporte: revisar janela do ERP, retries, payload e eventuais bloqueios operacionais.',
        visibility: 'internal',
      },
      {
        tenantSlug: 'support-qa-a',
        categorySlug: 'support-restrito-tenant-a',
        title: 'ERP: observações restritas do rollout',
        slug: 'erp-observacoes-restritas-rollout',
        summary: 'Anotações restritas do rollout do cliente A.',
        bodyMd:
          'Conteúdo restrito da operação. Não compartilhar com o cliente nem replicar em área pública.',
        visibility: 'restricted',
      },
      {
        tenantSlug: 'support-qa-a',
        categorySlug: 'support-restrito-tenant-a',
        title: 'Expedição: checklist autenticado do tenant A',
        slug: 'expedicao-checklist-autenticado-tenant-a',
        summary: 'Guia autenticado liberado para o portal do tenant A.',
        bodyMd:
          'Conteúdo autenticado customer-facing para o tenant A, com orientações operacionais aprovadas sem expor playbook interno.',
        visibility: 'restricted',
      },
      {
        tenantSlug: 'support-qa-a',
        categorySlug: 'support-restrito-tenant-a',
        title: 'Expedição: retorno controlado para ticket específico',
        slug: 'expedicao-retorno-controlado-ticket-especifico',
        summary: 'Orientação restrita liberada apenas para um ticket autorizado.',
        bodyMd:
          'Conteúdo restrito aprovado apenas para o ticket específico, sem advisory editorial nem contexto interno bruto.',
        visibility: 'restricted',
      },
      {
        tenantSlug: 'support-qa-a',
        categorySlug: 'support-restrito-tenant-a',
        title: 'Rascunho restrito que não pode vazar',
        slug: 'rascunho-restrito-que-nao-pode-vazar',
        summary: 'Rascunho de fixture para validar bloqueio customer-facing.',
        bodyMd:
          'Este rascunho existe apenas para validar que o portal não expõe conteúdo não publicado.',
        visibility: 'restricted',
        targetStatus: 'draft',
      },
    ],
    entitlements: [
      {
        tenantSlug: 'support-qa-a',
        actorKey: 'qa-admin',
        articleSlug: 'expedicao-checklist-autenticado-tenant-a',
        entitlementScope: 'customer_portal',
        relationReason:
          'Liberado para o portal do tenant A como orientação autenticada aprovada.',
      },
    ],
    customerTicketLinks: [
      {
        ticketTitle: 'QA Support | Divergência na regra de expedição',
        ticketTenantSlug: 'support-qa-a',
        actorKey: 'qa-admin',
        articleSlug: 'expedicao-retorno-controlado-ticket-especifico',
        relationReason:
          'Liberado para este ticket porque o fluxo aprovado depende de orientação contextual restrita.',
      },
    ],
    links: [
      {
        ticketTitle: 'QA Support | Webhook sem retorno na integração ERP',
        ticketTenantSlug: 'support-qa-a',
        actorKey: 'support-manager-a',
        linkType: 'sent_to_customer',
        articleSlug: 'checklist-de-integracao-erp-webhook',
        note: 'Artigo público oficial preparado para orientar o cliente sobre a validação inicial.',
      },
      {
        ticketTitle: 'QA Support | Webhook sem retorno na integração ERP',
        ticketTenantSlug: 'support-qa-a',
        actorKey: 'support-manager-a',
        linkType: 'reference_internal',
        articleSlug: 'erp-diagnostico-interno-webhook',
        note: 'Referência interna para diagnóstico antes de responder o cliente.',
      },
      {
        ticketTitle: 'QA Support | Divergência na regra de expedição',
        ticketTenantSlug: 'support-qa-a',
        actorKey: 'support-manager-a',
        linkType: 'documentation_gap',
        note: 'Falta uma página dedicada explicando a divergência de expedição aprovada no rollout.',
      },
    ],
  },
  engineeringHandoffs: [
    {
      ticketTitle: 'QA Support | Webhook sem retorno na integração ERP',
      ticketTenantSlug: 'support-qa-a',
      actorKey: 'support-manager-a',
      workItemType: 'investigation',
      title: 'Investigar timeout do webhook ERP do tenant A',
      description:
        'Consolidar a cronologia do incidente, revisar retries e validar por que o retorno do endpoint não confirmou o processamento.',
      handoffNote:
        'Cliente A com operação crítica parada. Suporte já confirmou impacto, janela e ausência de retorno na trilha externa.',
    },
  ],
  engineeringOperations: [
    {
      handoffTitle: 'Investigar timeout do webhook ERP do tenant A',
      actorKey: 'engineering-member-a',
      assign: true,
      status: 'in_progress',
      statusSummary:
        'Engenharia iniciou a demanda e confirmou que a análise técnica deve seguir no tenant A.',
      statusNextStep: 'Consolidar evidências antes do retorno ao suporte.',
      updateSummary:
        'Timeout reproduzido em ambiente controlado sem expor payload sensível.',
      updateNextStep:
        'Preparar orientação operacional para o suporte validar com o cliente.',
    },
  ],
  attachments: [
    {
      ticketTitle: 'QA Support | Conciliacao de devoluções com atraso',
      ticketTenantSlug: 'support-qa-a',
      actorKey: 'customer-manager-a',
      fileName: 'conciliacao-devolucoes-portal-qa.pdf',
      contentType: 'application/pdf',
      visibility: 'customer',
      uploadBoundary: 'customer',
      body:
        'Evidência operacional da fila de conciliação para o tenant A. Conteúdo sanitizado para validar o fluxo seguro de anexos.',
    },
  ],
  publicHelpCenter: {
    legacyCategorySlugs: ['primeiros-passos-genius'],
    categories: [
      {
        name: 'Primeiros passos',
        slug: 'primeiros-passos',
        description:
          'Orientações iniciais para equipes B2B que operam a Central Genius no dia a dia.',
        visibility: 'public',
      },
      {
        name: 'Operação de reversa',
        slug: 'operacao-de-reversa',
        description:
          'Guias objetivos para acompanhar solicitações, etapas e status da logística reversa.',
        visibility: 'public',
      },
      {
        name: 'Integrações',
        slug: 'integracoes',
        description:
          'Checklists públicos para validar ERP, webhook e pontos críticos de integração.',
        visibility: 'public',
      },
      {
        name: 'Suporte técnico',
        slug: 'suporte-tecnico',
        description:
          'Boas práticas para abrir tickets, compartilhar evidências e acelerar o suporte.',
        visibility: 'public',
      },
    ],
    articles: [
      {
        title: 'Visão geral da Central Genius',
        slug: 'visao-geral-da-central-genius',
        categorySlug: 'primeiros-passos',
        summary:
          'Resumo operacional do que a Central Genius concentra e quando consultar cada orientação pública.',
        bodyMd: `# Visão geral da Central Genius

A Central Genius reúne orientações públicas para operações B2B que usam Genius Returns e Central Genius no atendimento diário.

## O que você encontra aqui

- artigos publicados para operação de troca e devolução
- checklists de integração que podem ser compartilhados com times do cliente
- orientações práticas para abrir tickets com contexto suficiente

## Quando consultar a Central

Consulte a Central antes de abrir um chamado novo, quando precisar alinhar um procedimento com outro time ou quando quiser compartilhar uma referência pública com o cliente.

## O que não entra na Central pública

Não entram detalhes internos de engenharia, credenciais, configurações restritas ou anotações operacionais exclusivas do suporte.
`,
      },
      {
        title: 'Como acompanhar solicitações de troca e devolução',
        slug: 'acompanhar-solicitacoes-de-troca-e-devolucao',
        categorySlug: 'operacao-de-reversa',
        summary:
          'Passo a passo para acompanhar uma solicitação e alinhar expectativa com operação, CS e cliente.',
        bodyMd: `# Como acompanhar solicitações de troca e devolução

Use este roteiro para acompanhar a evolução de uma solicitação sem perder contexto entre atendimento, operação e cliente.

## 1. Confirme os dados básicos

- número da solicitação
- canal de abertura
- cliente responsável pelo acompanhamento

## 2. Revise a última atualização válida

Antes de responder, confira a última movimentação registrada e valide se ainda representa a etapa atual do processo.

## 3. Alinhe o próximo passo

Explique sempre qual é a próxima ação esperada: coleta, análise, transporte, confirmação do recebimento ou retorno do financeiro.

## 4. Registre evidências objetivas

Quando houver atraso ou divergência, compartilhe número do pedido, identificador da solicitação e uma descrição curta do impacto operacional.
`,
      },
      {
        title: 'Como interpretar status da logística reversa',
        slug: 'interpretar-status-da-logistica-reversa',
        categorySlug: 'operacao-de-reversa',
        summary:
          'Leitura prática dos principais status para evitar resposta ambígua durante o acompanhamento do retorno.',
        bodyMd: `# Como interpretar status da logística reversa

Os status da logística reversa servem para orientar a tratativa e evitar respostas prematuras ao cliente.

## Status que costumam exigir atenção

- solicitação recebida: a abertura foi registrada e aguarda a próxima etapa operacional
- coleta em andamento: existe tratativa ativa para retirada ou postagem
- material em trânsito: o retorno está no fluxo logístico e depende de atualização externa
- análise concluída: a etapa operacional principal terminou e a próxima decisão pode seguir

## Como responder melhor

Use o status como ponto de partida, mas complemente com a última ação confirmada e o próximo passo previsto.

## Quando escalar

Escalone quando o status ficar parado além da janela operacional combinada ou quando a etapa atual não refletir o ocorrido no campo.
`,
      },
      {
        title: 'Checklist de integração ERP e webhook',
        slug: 'checklist-de-integracao-erp-webhook',
        categorySlug: 'integracoes',
        summary:
          'Checklist público para validar configurações mínimas e reduzir retrabalho em incidentes de integração.',
        bodyMd: `# Checklist de integração ERP e webhook

Antes de escalar um incidente de integração, percorra este checklist com o time responsável.

## Validações iniciais

- confirmar a URL configurada para recebimento
- validar se o ambiente certo está em uso
- revisar o último evento recebido com data e horário

## Confirmações recomendadas

- o time do ERP recebeu o retorno esperado
- não houve mudança recente de endpoint sem alinhamento
- o identificador usado na conciliação continua válido

## O que compartilhar no ticket

Inclua o horário do último evento, o identificador afetado e a descrição objetiva do que deixou de acontecer.
`,
      },
      {
        title: 'Boas práticas antes de acionar suporte',
        slug: 'boas-praticas-antes-de-acionar-suporte',
        categorySlug: 'suporte-tecnico',
        summary:
          'Checklist curto para abrir chamados com contexto suficiente e acelerar a análise do suporte.',
        bodyMd: `# Boas práticas antes de acionar suporte

Um chamado bem contextualizado reduz o tempo de triagem e evita trocas desnecessárias.

## Reúna estas informações

- cliente ou operação impactada
- identificador da solicitação, pedido ou coleta
- horário aproximado da ocorrência
- impacto operacional percebido

## Descreva o comportamento observado

Explique o que deveria acontecer, o que aconteceu de fato e desde quando o desvio foi percebido.

## Anexe apenas o necessário

Prefira prints, planilhas ou relatórios exportados que ajudem a reproduzir o contexto sem expor dados sensíveis de outras operações.
`,
      },
      {
        title: 'Como compartilhar evidências em um ticket',
        slug: 'como-compartilhar-evidencias-em-um-ticket',
        categorySlug: 'suporte-tecnico',
        summary:
          'Orientações objetivas para anexar evidências úteis sem prejudicar a leitura do ticket.',
        bodyMd: `# Como compartilhar evidências em um ticket

Evidência boa é aquela que ajuda o suporte a entender o contexto sem depender de suposições.

## Priorize evidências objetivas

- print da tela com o horário visível
- identificador da solicitação ou pedido
- arquivo exportado com os registros relacionados

## Organize a descrição

Ao anexar, diga em uma linha o que o material comprova e em que ponto da operação ele foi capturado.

## Evite anexos sem contexto

Arquivos soltos ou capturas sem explicação atrasam a triagem porque exigem nova rodada de perguntas.
`,
      },
    ],
  },
};

function fail(message) {
  console.error(message);
  process.exit(1);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readLocalSupabaseStatusEnv() {
  const status = spawnSync('npx', ['supabase', 'status', '-o', 'env'], {
    cwd: process.cwd(),
    env: process.env,
    encoding: 'utf-8',
    shell: process.platform === 'win32',
  });

  if (status.status !== 0) {
    fail(`Falha ao ler o ambiente local do Supabase: ${status.stderr || status.stdout}`);
  }

  const entries = {};
  for (const rawLine of status.stdout.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || !line.includes('=')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');
    const key = line.slice(0, separatorIndex);
    const rawValue = line.slice(separatorIndex + 1).trim();
    entries[key] = rawValue.replace(/^"/, '').replace(/"$/, '');
  }

  return entries;
}

async function isEdgeRuntimeHealthy(apiUrl) {
  try {
    const response = await fetch(`${apiUrl.replace(/\/$/, '')}/functions/v1/_internal/health`, {
      method: 'HEAD',
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function ensureLocalEdgeRuntime() {
  const localEnv = readLocalSupabaseStatusEnv();
  const apiUrl = localEnv.API_URL;
  const anonKey = localEnv.ANON_KEY;
  const serviceRoleKey = localEnv.SERVICE_ROLE_KEY;

  if (!apiUrl || !anonKey || !serviceRoleKey) {
    fail('API_URL, ANON_KEY ou SERVICE_ROLE_KEY ausentes no Supabase local.');
  }

  if (await isEdgeRuntimeHealthy(apiUrl)) {
    return { apiUrl, anonKey, serviceRoleKey };
  }

  const tempDir = mkdtempSync(join(tmpdir(), 'genius-support-edge-runtime-'));
  const envFile = join(tempDir, '.env.edge-runtime');
  writeFileSync(
    envFile,
    [
      `API_URL=${apiUrl}`,
      `ANON_KEY=${anonKey}`,
      `SERVICE_ROLE_KEY=${serviceRoleKey}`,
      `SUPABASE_URL=${apiUrl}`,
      `SUPABASE_ANON_KEY=${anonKey}`,
      `SUPABASE_SERVICE_ROLE_KEY=${serviceRoleKey}`,
    ].join('\n'),
  );

  const serveCommand =
    process.platform === 'win32'
      ? `${process.env.ComSpec ?? 'cmd.exe'} /d /s /c "npx supabase functions serve --env-file \"${envFile}\""`
      : `npx supabase functions serve --env-file "${envFile}"`;

  const child = spawn(serveCommand, {
    cwd: process.cwd(),
    env: process.env,
    shell: true,
    detached: true,
    stdio: 'ignore',
  });
  child.unref();

  const startedAt = Date.now();
  while (Date.now() - startedAt < 30_000) {
    if (await isEdgeRuntimeHealthy(apiUrl)) {
      return { apiUrl, anonKey, serviceRoleKey };
    }

    await sleep(1_000);
  }

  fail('O runtime local de Edge Functions não respondeu após tentar subir o servidor.');
}

function localSupabaseCommandArgs(args) {
  const localSupabaseBinary = join(
    process.cwd(),
    'node_modules',
    'supabase',
    'bin',
    process.platform === 'win32' ? 'supabase.exe' : 'supabase',
  );

  if (existsSync(localSupabaseBinary)) {
    return {
      command: localSupabaseBinary,
      args,
    };
  }

  return {
    command: process.platform === 'win32' ? 'npx.cmd' : 'npx',
    args: ['supabase', ...args],
  };
}

function runProcess(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: process.env,
    ...options,
  });

  if (result.error) {
    fail(result.error.message);
  }

  if (result.status !== 0) {
    const detail = [result.stderr?.trim(), result.stdout?.trim()]
      .filter(Boolean)
      .join('\n');
    fail(detail || `Falha ao executar ${command}.`);
  }

  return result.stdout?.trim() ?? '';
}

function runSupabaseStatusEnv() {
  const { command, args } = localSupabaseCommandArgs(['status', '-o', 'env']);
  const stdout = runProcess(command, args);
  const envMap = new Map();

  for (const line of stdout.split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)="?(.*?)"?$/);
    if (!match) {
      continue;
    }

    envMap.set(match[1], match[2]);
  }

  return envMap;
}

function assertLocalOnly(envMap) {
  const apiUrl = envMap.get('API_URL') ?? '';
  const dbUrl = envMap.get('DB_URL') ?? '';
  const serviceRoleKey = envMap.get('SERVICE_ROLE_KEY') ?? '';
  const anonKey = envMap.get('ANON_KEY') ?? '';

  const isLocalApi =
    apiUrl.startsWith('http://127.0.0.1:') ||
    apiUrl.startsWith('http://localhost:');
  const isLocalDb = dbUrl.includes('@127.0.0.1:') || dbUrl.includes('@localhost:');

  if (!isLocalApi || !isLocalDb || !serviceRoleKey || !anonKey) {
    fail(
      'Fixture de suporte bloqueada: este script so pode rodar contra o Supabase local com API_URL/DB_URL locais e chaves locais validas.',
    );
  }

  return {
    apiUrl,
    serviceRoleKey,
    anonKey,
  };
}

function sqlEscape(value) {
  return value.replace(/'/g, "''");
}

function runSupabaseDbQuery(sql) {
  const tempDir = mkdtempSync(join(tmpdir(), 'genius-support-os-support-fixture-'));
  const tempFile = join(tempDir, 'query.sql');
  writeFileSync(tempFile, `${sql.trim()}\n`, 'utf8');

  const { command, args } = localSupabaseCommandArgs([
    'db',
    'query',
    '--local',
    '--file',
    tempFile,
    '--output',
    'json',
  ]);

  try {
    const stdout = runProcess(command, args);
    let parsed;
    try {
      parsed = JSON.parse(stdout);
    } catch {
      if (/^(INSERT|UPDATE|DELETE|BEGIN|COMMIT|SET|RESET)\b/i.test(stdout.trim())) {
        return { rows: [] };
      }

      throw new Error(stdout);
    }

    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.rows)) {
      return parsed;
    }

    if (Array.isArray(parsed)) {
      const rowsEntry = [...parsed].reverse().find((entry) => Array.isArray(entry?.rows));
      return rowsEntry ?? { rows: [] };
    }

    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.results)) {
      const rowsEntry = [...parsed.results]
        .reverse()
        .find((entry) => Array.isArray(entry?.rows));
      return rowsEntry ?? { rows: [] };
    }

    return { rows: [] };
  } catch (error) {
    fail(
      error instanceof Error
        ? error.message
        : 'Nao foi possivel interpretar a resposta JSON do Supabase CLI.',
    );
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

async function signInLocalUser({ apiUrl, anonKey, email, password }) {
  let lastError = null;

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      const response = await fetch(`${apiUrl}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          apikey: anonKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      if (!response.ok) {
        const detail = await response.text();
        fail(`Falha ao autenticar fixture local ${email}: ${response.status} ${detail}`);
      }

      return response.json();
    } catch (error) {
      lastError = error;

      if (attempt === 5) {
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
    }
  }

  fail(
    lastError instanceof Error
      ? `Falha ao autenticar fixture local ${email}: ${lastError.message}`
      : `Falha ao autenticar fixture local ${email}.`,
  );
}

async function callRpcAsUser({ apiUrl, anonKey, accessToken, rpcName, body }) {
  const response = await fetch(`${apiUrl}/rest/v1/rpc/${rpcName}`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const detail = await response.text();
    fail(`Falha ao executar RPC ${rpcName}: ${response.status} ${detail}`);
  }

  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function queryAuthUserByEmail(email) {
  const result = runSupabaseDbQuery(`
    select id::text as id
    from auth.users
    where email = '${sqlEscape(email)}'
    limit 1;
  `);

  return result.rows?.[0] ?? null;
}

async function createOrUpdateAuthUser({
  apiUrl,
  serviceRoleKey,
  email,
  password,
  fullName,
}) {
  const existingUser = queryAuthUserByEmail(email);
  const payload = {
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      name: fullName,
      locale: 'pt-BR',
      timezone: 'America/Sao_Paulo',
    },
  };

  if (existingUser?.id) {
    const updateResponse = await fetch(`${apiUrl}/auth/v1/admin/users/${existingUser.id}`, {
      method: 'PUT',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!updateResponse.ok) {
      const detail = await updateResponse.text();
      fail(`Falha ao atualizar usuario Auth local ${email}: ${updateResponse.status} ${detail}`);
    }

    return updateResponse.json();
  }

  const createResponse = await fetch(`${apiUrl}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!createResponse.ok) {
    const detail = await createResponse.text();
    fail(`Falha ao criar usuario Auth local ${email}: ${createResponse.status} ${detail}`);
  }

  return createResponse.json();
}

function queryProfileByEmail(email) {
  const result = runSupabaseDbQuery(`
    select
      id::text as id,
      is_active
    from public.profiles
    where email = '${sqlEscape(email)}'
    limit 1;
  `);

  return result.rows?.[0] ?? null;
}

function bootstrapFirstPlatformAdmin(userId) {
  const result = spawnSync(
    process.execPath,
    [
      'supabase/bootstrap/bootstrap-first-platform-admin.mjs',
      '--local',
      '--user-id',
      userId,
      '--reason',
      'local support fixture bootstrap',
    ],
    {
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      env: process.env,
    },
  );

  if (result.error) {
    fail(result.error.message);
  }

  if (result.status !== 0) {
    const detail = [result.stderr?.trim(), result.stdout?.trim()]
      .filter(Boolean)
      .join('\n');
    fail(detail || 'Falha ao executar bootstrap local do platform_admin de suporte.');
  }
}

function ensurePlatformAdminRole(userId) {
  const current = runSupabaseDbQuery(`
    select
      (
        select count(*)::integer
        from public.user_global_roles
        where role = 'platform_admin'::public.platform_role
      ) as platform_admin_count,
      exists(
        select 1
        from public.user_global_roles
        where user_id = '${sqlEscape(userId)}'::uuid
          and role = 'platform_admin'::public.platform_role
      ) as is_platform_admin;
  `);

  const row = current.rows?.[0];
  if (row?.is_platform_admin) {
    return;
  }

  if ((row?.platform_admin_count ?? 0) === 0) {
    bootstrapFirstPlatformAdmin(userId);
    return;
  }

  runSupabaseDbQuery(`
    insert into public.user_global_roles (user_id, role)
    select '${sqlEscape(userId)}'::uuid, 'platform_admin'::public.platform_role
    where not exists (
      select 1
      from public.user_global_roles
      where user_id = '${sqlEscape(userId)}'::uuid
        and role = 'platform_admin'::public.platform_role
    );
  `);
}

function ensureGlobalRole({ actorUserId, userId, role }) {
  runSupabaseDbQuery(`
    insert into public.user_global_roles (
      user_id,
      role,
      created_by_user_id,
      updated_by_user_id
    )
    select
      '${sqlEscape(userId)}'::uuid,
      '${role}'::public.platform_role,
      '${sqlEscape(actorUserId)}'::uuid,
      '${sqlEscape(actorUserId)}'::uuid
    where not exists (
      select 1
      from public.user_global_roles
      where user_id = '${sqlEscape(userId)}'::uuid
        and role = '${role}'::public.platform_role
    );
  `);
}

function ensureTenantMembership({
  actorUserId,
  tenantId,
  userId,
  role = 'tenant_viewer',
  status = 'active',
}) {
  runSupabaseDbQuery(`
    insert into public.tenant_memberships (
      tenant_id,
      user_id,
      role,
      status,
      invited_by_user_id,
      created_by_user_id,
      updated_by_user_id
    )
    select
      '${sqlEscape(tenantId)}'::uuid,
      '${sqlEscape(userId)}'::uuid,
      '${role}'::public.tenant_role,
      '${status}'::public.membership_status,
      '${sqlEscape(actorUserId)}'::uuid,
      '${sqlEscape(actorUserId)}'::uuid,
      '${sqlEscape(actorUserId)}'::uuid
    where not exists (
      select 1
      from public.tenant_memberships
      where tenant_id = '${sqlEscape(tenantId)}'::uuid
        and user_id = '${sqlEscape(userId)}'::uuid
    );
  `);

  runSupabaseDbQuery(`
    update public.tenant_memberships
    set
      status = '${status}'::public.membership_status,
      role = '${role}'::public.tenant_role,
      updated_by_user_id = '${sqlEscape(actorUserId)}'::uuid
    where tenant_id = '${sqlEscape(tenantId)}'::uuid
      and user_id = '${sqlEscape(userId)}'::uuid;
  `);
}

function ensureTenant(adminUserId, tenant) {
  const existing = runSupabaseDbQuery(`
    select id::text as id
    from public.tenants
    where slug = '${sqlEscape(tenant.slug)}'
    limit 1;
  `);

  const existingId = existing.rows?.[0]?.id;
  if (existingId) {
    return existingId;
  }

  const created = runSupabaseDbQuery(`
    insert into public.tenants (
      slug,
      legal_name,
      display_name,
      status,
      data_region,
      created_by_user_id,
      updated_by_user_id
    )
    values (
      '${sqlEscape(tenant.slug)}',
      '${sqlEscape(tenant.legalName)}',
      '${sqlEscape(tenant.displayName)}',
      'active'::public.tenant_status,
      'sa-east-1',
      '${sqlEscape(adminUserId)}'::uuid,
      '${sqlEscape(adminUserId)}'::uuid
    )
    returning id::text as id;
  `);

  const tenantId = created.rows?.[0]?.id;
  if (!tenantId) {
    fail(`Nao foi possivel criar o tenant ${tenant.slug}.`);
  }

  return tenantId;
}

function ensureCustomerAccountProfile(adminUserId, tenantId, customerAccount) {
  const existing = runSupabaseDbQuery(`
    select id::text as id
    from public.customer_account_profiles
    where tenant_id = '${sqlEscape(tenantId)}'::uuid
    limit 1;
  `);

  const internalNotesSql = customerAccount.internalNotes
    ? `'${sqlEscape(customerAccount.internalNotes)}'`
    : 'null';
  const flagsSql = `'${sqlEscape(JSON.stringify(customerAccount.operationalFlags ?? {}))}'::jsonb`;

  if (existing.rows?.[0]?.id) {
    runSupabaseDbQuery(`
      update public.customer_account_profiles
      set
        product_line = '${customerAccount.productLine}'::public.customer_product_line,
        operational_status = '${customerAccount.operationalStatus}'::public.customer_operational_status,
        account_tier = '${sqlEscape(customerAccount.accountTier)}',
        internal_notes = ${internalNotesSql},
        operational_flags = ${flagsSql},
        updated_by_user_id = '${sqlEscape(adminUserId)}'::uuid
      where tenant_id = '${sqlEscape(tenantId)}'::uuid;
    `);

    return existing.rows[0].id;
  }

  const created = runSupabaseDbQuery(`
    insert into public.customer_account_profiles (
      tenant_id,
      product_line,
      operational_status,
      account_tier,
      internal_notes,
      operational_flags,
      created_by_user_id,
      updated_by_user_id
    )
    values (
      '${sqlEscape(tenantId)}'::uuid,
      '${customerAccount.productLine}'::public.customer_product_line,
      '${customerAccount.operationalStatus}'::public.customer_operational_status,
      '${sqlEscape(customerAccount.accountTier)}',
      ${internalNotesSql},
      ${flagsSql},
      '${sqlEscape(adminUserId)}'::uuid,
      '${sqlEscape(adminUserId)}'::uuid
    )
    returning id::text as id;
  `);

  return created.rows?.[0]?.id ?? null;
}

function ensureCustomerAccountIntegrations(adminUserId, tenantId, customerAccount) {
  for (const integration of customerAccount.integrations ?? []) {
    const existing = runSupabaseDbQuery(`
      select id::text as id
      from public.customer_account_integrations
      where tenant_id = '${sqlEscape(tenantId)}'::uuid
        and integration_type = '${integration.integrationType}'::public.customer_integration_type
        and lower(provider) = lower('${sqlEscape(integration.provider)}')
        and environment = '${integration.environment}'::public.customer_integration_environment
      limit 1;
    `);

    const notesSql = integration.notes ? `'${sqlEscape(integration.notes)}'` : 'null';

    if (existing.rows?.[0]?.id) {
      runSupabaseDbQuery(`
        update public.customer_account_integrations
        set
          status = '${integration.status}'::public.customer_integration_status,
          notes = ${notesSql},
          updated_by_user_id = '${sqlEscape(adminUserId)}'::uuid
        where id = '${sqlEscape(existing.rows[0].id)}'::uuid;
      `);
      continue;
    }

    runSupabaseDbQuery(`
      insert into public.customer_account_integrations (
        tenant_id,
        integration_type,
        provider,
        status,
        environment,
        notes,
        created_by_user_id,
        updated_by_user_id
      )
      values (
        '${sqlEscape(tenantId)}'::uuid,
        '${integration.integrationType}'::public.customer_integration_type,
        '${sqlEscape(integration.provider)}',
        '${integration.status}'::public.customer_integration_status,
        '${integration.environment}'::public.customer_integration_environment,
        ${notesSql},
        '${sqlEscape(adminUserId)}'::uuid,
        '${sqlEscape(adminUserId)}'::uuid
      );
    `);
  }
}

function ensureCustomerAccountFeatures(adminUserId, tenantId, customerAccount) {
  for (const feature of customerAccount.features ?? []) {
    const existing = runSupabaseDbQuery(`
      select id::text as id
      from public.customer_account_features
      where tenant_id = '${sqlEscape(tenantId)}'::uuid
        and lower(feature_key) = lower('${sqlEscape(feature.featureKey)}')
      limit 1;
    `);

    const notesSql = feature.notes ? `'${sqlEscape(feature.notes)}'` : 'null';
    const enabledSql = feature.enabled ? 'true' : 'false';

    if (existing.rows?.[0]?.id) {
      runSupabaseDbQuery(`
        update public.customer_account_features
        set
          enabled = ${enabledSql},
          source = '${sqlEscape(feature.source)}',
          notes = ${notesSql},
          updated_by_user_id = '${sqlEscape(adminUserId)}'::uuid
        where id = '${sqlEscape(existing.rows[0].id)}'::uuid;
      `);
      continue;
    }

    runSupabaseDbQuery(`
      insert into public.customer_account_features (
        tenant_id,
        feature_key,
        enabled,
        source,
        notes,
        created_by_user_id,
        updated_by_user_id
      )
      values (
        '${sqlEscape(tenantId)}'::uuid,
        '${sqlEscape(feature.featureKey)}',
        ${enabledSql},
        '${sqlEscape(feature.source)}',
        ${notesSql},
        '${sqlEscape(adminUserId)}'::uuid,
        '${sqlEscape(adminUserId)}'::uuid
      );
    `);
  }
}

function ensureCustomerAccountCustomizations(adminUserId, tenantId, customerAccount) {
  for (const customization of customerAccount.customizations ?? []) {
    const existing = runSupabaseDbQuery(`
      select id::text as id
      from public.customer_account_customizations
      where tenant_id = '${sqlEscape(tenantId)}'::uuid
        and lower(title) = lower('${sqlEscape(customization.title)}')
      limit 1;
    `);

    const noteSql = customization.operationalNote
      ? `'${sqlEscape(customization.operationalNote)}'`
      : 'null';

    if (existing.rows?.[0]?.id) {
      runSupabaseDbQuery(`
        update public.customer_account_customizations
        set
          description = '${sqlEscape(customization.description)}',
          risk_level = '${customization.riskLevel}'::public.customer_customization_risk_level,
          operational_note = ${noteSql},
          status = '${sqlEscape(customization.status)}',
          updated_by_user_id = '${sqlEscape(adminUserId)}'::uuid
        where id = '${sqlEscape(existing.rows[0].id)}'::uuid;
      `);
      continue;
    }

    runSupabaseDbQuery(`
      insert into public.customer_account_customizations (
        tenant_id,
        title,
        description,
        risk_level,
        operational_note,
        status,
        created_by_user_id,
        updated_by_user_id
      )
      values (
        '${sqlEscape(tenantId)}'::uuid,
        '${sqlEscape(customization.title)}',
        '${sqlEscape(customization.description)}',
        '${customization.riskLevel}'::public.customer_customization_risk_level,
        ${noteSql},
        '${sqlEscape(customization.status)}',
        '${sqlEscape(adminUserId)}'::uuid,
        '${sqlEscape(adminUserId)}'::uuid
      );
    `);
  }
}

function ensureCustomerAccountAlerts(adminUserId, tenantId, customerAccount) {
  for (const alert of customerAccount.alerts ?? []) {
    const existing = runSupabaseDbQuery(`
      select id::text as id
      from public.customer_account_alerts
      where tenant_id = '${sqlEscape(tenantId)}'::uuid
        and lower(title) = lower('${sqlEscape(alert.title)}')
      limit 1;
    `);

    if (existing.rows?.[0]?.id) {
      runSupabaseDbQuery(`
        update public.customer_account_alerts
        set
          severity = '${alert.severity}'::public.customer_alert_severity,
          description = '${sqlEscape(alert.description)}',
          active = true,
          updated_by_user_id = '${sqlEscape(adminUserId)}'::uuid
        where id = '${sqlEscape(existing.rows[0].id)}'::uuid;
      `);
      continue;
    }

    runSupabaseDbQuery(`
      insert into public.customer_account_alerts (
        tenant_id,
        severity,
        title,
        description,
        active,
        created_by_user_id,
        updated_by_user_id
      )
      values (
        '${sqlEscape(tenantId)}'::uuid,
        '${alert.severity}'::public.customer_alert_severity,
        '${sqlEscape(alert.title)}',
        '${sqlEscape(alert.description)}',
        true,
        '${sqlEscape(adminUserId)}'::uuid,
        '${sqlEscape(adminUserId)}'::uuid
      );
    `);
  }
}

function ensureContact(adminUserId, tenantId, contact) {
  const existing = runSupabaseDbQuery(`
    select id::text as id
    from public.tenant_contacts
    where tenant_id = '${sqlEscape(tenantId)}'::uuid
      and email = '${sqlEscape(contact.email)}'
    limit 1;
  `);

  const existingId = existing.rows?.[0]?.id;
  if (existingId) {
    return existingId;
  }

  const created = runSupabaseDbQuery(`
    insert into public.tenant_contacts (
      tenant_id,
      linked_user_id,
      full_name,
      email,
      phone,
      job_title,
      is_primary,
      is_active,
      created_by_user_id,
      updated_by_user_id
    )
    values (
      '${sqlEscape(tenantId)}'::uuid,
      null,
      '${sqlEscape(contact.fullName)}',
      '${sqlEscape(contact.email)}',
      '${sqlEscape(contact.phone)}',
      '${sqlEscape(contact.jobTitle)}',
      not exists (
        select 1
        from public.tenant_contacts
        where tenant_id = '${sqlEscape(tenantId)}'::uuid
          and is_primary
          and is_active
      ),
      true,
      '${sqlEscape(adminUserId)}'::uuid,
      '${sqlEscape(adminUserId)}'::uuid
    )
    returning id::text as id;
  `);

  const contactId = created.rows?.[0]?.id;
  if (!contactId) {
    fail(`Nao foi possivel criar o contato do tenant ${tenantId}.`);
  }

  return contactId;
}

function ensureCustomerPortalContact({ actorUserId, tenantId, userId, contact }) {
  const contactId = ensureContact(actorUserId, tenantId, contact);

  runSupabaseDbQuery(`
    update public.tenant_contacts
    set
      linked_user_id = '${sqlEscape(userId)}'::uuid,
      full_name = '${sqlEscape(contact.fullName)}',
      phone = '${sqlEscape(contact.phone)}',
      job_title = '${sqlEscape(contact.jobTitle)}',
      is_active = true,
      updated_by_user_id = '${sqlEscape(actorUserId)}'::uuid
    where id = '${sqlEscape(contactId)}'::uuid
      and tenant_id = '${sqlEscape(tenantId)}'::uuid;
  `);

  return contactId;
}

function queryExistingSupportTicket(tenantId, title) {
  const result = runSupabaseDbQuery(`
    select id::text as id
    from public.tickets
    where tenant_id = '${sqlEscape(tenantId)}'::uuid
      and title = '${sqlEscape(title)}'
    limit 1;
  `);

  return result.rows?.[0]?.id ?? null;
}

function queryKnowledgeCategoryBySlug(slug) {
  const result = runSupabaseDbQuery(`
    select id::text as id
    from public.knowledge_categories
    where slug = '${sqlEscape(slug)}'
    limit 1;
  `);

  return result.rows?.[0]?.id ?? null;
}

function queryKnowledgeSpaceBySlug(slug) {
  const result = runSupabaseDbQuery(`
    select id::text as id
    from public.knowledge_spaces
    where slug = '${sqlEscape(slug)}'
    limit 1;
  `);

  return result.rows?.[0]?.id ?? null;
}

async function ensureKnowledgeCategory(adminSession, tenantId, category) {
  const existingId = queryKnowledgeCategoryBySlug(category.slug);
  if (existingId) {
    return existingId;
  }

  await callRpcAsUser({
    apiUrl: adminSession.apiUrl,
    anonKey: adminSession.anonKey,
    accessToken: adminSession.accessToken,
    rpcName: 'rpc_admin_create_knowledge_category',
    body: {
      p_name: category.name,
      p_slug: category.slug,
      p_description: category.description,
      p_visibility: category.visibility,
      p_parent_category_id: null,
      p_tenant_id: tenantId,
    },
  });

  return queryKnowledgeCategoryBySlug(category.slug);
}

function queryKnowledgeArticleBySlug(slug, tenantId = null) {
  const tenantPredicate = tenantId
    ? `and tenant_id = '${sqlEscape(tenantId)}'::uuid`
    : '';
  const result = runSupabaseDbQuery(`
    select
      id::text as id,
      status::text as status
    from public.knowledge_articles
    where slug = '${sqlEscape(slug)}'
      ${tenantPredicate}
    limit 1;
  `);

  return result.rows?.[0] ?? null;
}

function queryKnowledgeCategoryBySlugInSpace(slug, knowledgeSpaceId) {
  const result = runSupabaseDbQuery(`
    select id::text as id
    from public.knowledge_categories
    where knowledge_space_id = '${sqlEscape(knowledgeSpaceId)}'::uuid
      and slug = '${sqlEscape(slug)}'
    limit 1;
  `);

  return result.rows?.[0]?.id ?? null;
}

function queryKnowledgeArticleBySlugInSpace(slug, knowledgeSpaceId) {
  const result = runSupabaseDbQuery(`
    select
      id::text as id,
      status::text as status
    from public.knowledge_articles
    where knowledge_space_id = '${sqlEscape(knowledgeSpaceId)}'::uuid
      and slug = '${sqlEscape(slug)}'
    limit 1;
  `);

  return result.rows?.[0] ?? null;
}

function ensurePublicKnowledgeArticleReviewEvidence(articleId, reviewerEmail) {
  const reviewer = queryAuthUserByEmail(reviewerEmail);
  if (!reviewer?.id) {
    fail(`Revisor humano ausente para evidência de Knowledge: ${reviewerEmail}.`);
  }

  runSupabaseDbQuery(`
    insert into public.knowledge_article_review_advisories (
      article_id,
      source_hash,
      suggested_visibility,
      suggested_classification,
      classification_reason,
      risk_flags,
      human_confirmations,
      review_status,
      review_notes,
      reviewed_by_user_id,
      reviewed_at,
      created_by_user_id,
      updated_by_user_id
    )
    values (
      '${sqlEscape(articleId)}'::uuid,
      null,
      'public',
      'public',
      'Evidência humana QA para publicação pública controlada.',
      '[]'::jsonb,
      jsonb_build_object(
        'title_reviewed', true,
        'summary_reviewed', true,
        'body_reviewed', true,
        'category_reviewed', true,
        'visibility_reviewed', true,
        'no_sensitive_data_exposed', true,
        'ready_for_review', true,
        'ready_for_publish', true
      ),
      'reviewed',
      'Fixture QA registra evidência explícita antes de publicar artigo público.',
      '${sqlEscape(reviewer.id)}'::uuid,
      timezone('utc', now()),
      '${sqlEscape(reviewer.id)}'::uuid,
      '${sqlEscape(reviewer.id)}'::uuid
    )
    on conflict (article_id) do update
    set suggested_visibility = excluded.suggested_visibility,
        suggested_classification = excluded.suggested_classification,
        classification_reason = excluded.classification_reason,
        risk_flags = excluded.risk_flags,
        human_confirmations = excluded.human_confirmations,
        review_status = excluded.review_status,
        review_notes = excluded.review_notes,
        reviewed_by_user_id = excluded.reviewed_by_user_id,
        reviewed_at = excluded.reviewed_at,
        updated_by_user_id = excluded.updated_by_user_id;
  `);
}

function queryPublicHelpCenterArticleContractBySlug(slug) {
  const result = runSupabaseDbQuery(`
    select
      ka.id::text as article_id,
      ka.title,
      ka.slug,
      kc.name as category_name,
      creator.email::text as created_by_email,
      creator.full_name as created_by_full_name,
      updater.email::text as updated_by_email,
      updater.full_name as updated_by_full_name,
      pub.public_article_path
    from public.knowledge_articles as ka
    join public.knowledge_spaces as ks
      on ks.id = ka.knowledge_space_id
    left join public.knowledge_categories as kc
      on kc.id = ka.category_id
    left join public.profiles as creator
      on creator.id = ka.created_by_user_id
    left join public.profiles as updater
      on updater.id = ka.updated_by_user_id
    left join app_private.vw_knowledge_articles_public_contract as pub
      on pub.article_id = ka.id
    where ks.slug = 'genius'
      and ka.slug = '${sqlEscape(slug)}'
    limit 1;
  `);

  return result.rows?.[0] ?? null;
}

async function ensureKnowledgeArticlePublished(adminSession, tenantId, article, categoryId) {
  const targetStatus = article.targetStatus ?? 'published';
  let existing = queryKnowledgeArticleBySlug(article.slug, tenantId);

  if (!existing?.id) {
    await callRpcAsUser({
      apiUrl: adminSession.apiUrl,
      anonKey: adminSession.anonKey,
      accessToken: adminSession.accessToken,
      rpcName: 'rpc_admin_create_knowledge_article_draft',
      body: {
        p_title: article.title,
        p_slug: article.slug,
        p_summary: article.summary,
        p_body_md: article.bodyMd,
        p_category_id: categoryId,
        p_visibility: article.visibility,
        p_tenant_id: tenantId,
        p_source_path: null,
        p_source_hash: null,
      },
    });

    existing = queryKnowledgeArticleBySlug(article.slug, tenantId);
  }

  if (!existing?.id) {
    fail(`Nao foi possivel materializar o artigo ${article.slug}.`);
  }

  if (targetStatus === 'draft') {
    return existing.id;
  }

  if (existing.status === 'draft') {
    await callRpcAsUser({
      apiUrl: adminSession.apiUrl,
      anonKey: adminSession.anonKey,
      accessToken: adminSession.accessToken,
      rpcName: 'rpc_admin_submit_knowledge_article_for_review',
      body: {
        p_article_id: existing.id,
      },
    });
    existing = queryKnowledgeArticleBySlug(article.slug, tenantId);
  }

  if (existing?.status === 'review') {
    await callRpcAsUser({
      apiUrl: adminSession.apiUrl,
      anonKey: adminSession.anonKey,
      accessToken: adminSession.accessToken,
      rpcName: 'rpc_admin_publish_knowledge_article',
      body: {
        p_article_id: existing.id,
      },
    });
    existing = queryKnowledgeArticleBySlug(article.slug, tenantId);
  }

  return existing?.id ?? null;
}

async function ensureKnowledgeCategoryV2(adminSession, knowledgeSpaceId, category) {
  const existingId = queryKnowledgeCategoryBySlugInSpace(category.slug, knowledgeSpaceId);
  if (existingId) {
    return existingId;
  }

  await callRpcAsUser({
    apiUrl: adminSession.apiUrl,
    anonKey: adminSession.anonKey,
    accessToken: adminSession.accessToken,
    rpcName: 'rpc_admin_create_knowledge_category_v2',
    body: {
      p_name: category.name,
      p_slug: category.slug,
      p_description: category.description,
      p_visibility: category.visibility,
      p_parent_category_id: null,
      p_knowledge_space_id: knowledgeSpaceId,
      p_tenant_id: null,
    },
  });

  return queryKnowledgeCategoryBySlugInSpace(category.slug, knowledgeSpaceId);
}

async function ensureKnowledgeArticlePublishedV2(
  adminSession,
  knowledgeSpaceId,
  article,
  categoryId,
) {
  let existing = queryKnowledgeArticleBySlugInSpace(article.slug, knowledgeSpaceId);

  if (!existing?.id) {
    await callRpcAsUser({
      apiUrl: adminSession.apiUrl,
      anonKey: adminSession.anonKey,
      accessToken: adminSession.accessToken,
      rpcName: 'rpc_admin_create_knowledge_article_draft_v2',
      body: {
        p_title: article.title,
        p_slug: article.slug,
        p_summary: article.summary,
        p_body_md: article.bodyMd,
        p_category_id: categoryId,
        p_visibility: 'public',
        p_knowledge_space_id: knowledgeSpaceId,
        p_tenant_id: null,
        p_source_path: null,
        p_source_hash: null,
      },
    });

    existing = queryKnowledgeArticleBySlugInSpace(article.slug, knowledgeSpaceId);
  }

  if (!existing?.id) {
    fail(`Nao foi possivel materializar o artigo publico ${article.slug}.`);
  }

  if (existing.status === 'draft') {
    await callRpcAsUser({
      apiUrl: adminSession.apiUrl,
      anonKey: adminSession.anonKey,
      accessToken: adminSession.accessToken,
      rpcName: 'rpc_admin_submit_knowledge_article_for_review_v2',
      body: {
        p_article_id: existing.id,
        p_knowledge_space_id: knowledgeSpaceId,
      },
    });
    existing = queryKnowledgeArticleBySlugInSpace(article.slug, knowledgeSpaceId);
  }

  if (existing?.status === 'review') {
    ensurePublicKnowledgeArticleReviewEvidence(existing.id, FIXTURE.contentAuthor.email);

    await callRpcAsUser({
      apiUrl: adminSession.apiUrl,
      anonKey: adminSession.anonKey,
      accessToken: adminSession.accessToken,
      rpcName: 'rpc_admin_publish_knowledge_article_v2',
      body: {
        p_article_id: existing.id,
        p_knowledge_space_id: knowledgeSpaceId,
      },
    });
    existing = queryKnowledgeArticleBySlugInSpace(article.slug, knowledgeSpaceId);
  }

  return existing?.id ?? null;
}

async function archiveKnowledgeArticleV2IfPresent(adminSession, knowledgeSpaceId, slug) {
  const existing = queryKnowledgeArticleBySlugInSpace(slug, knowledgeSpaceId);
  if (!existing?.id || existing.status === 'archived') {
    return existing?.id ?? null;
  }

  await callRpcAsUser({
    apiUrl: adminSession.apiUrl,
    anonKey: adminSession.anonKey,
    accessToken: adminSession.accessToken,
    rpcName: 'rpc_admin_archive_knowledge_article_v2',
    body: {
      p_article_id: existing.id,
      p_knowledge_space_id: knowledgeSpaceId,
    },
  });

  return existing.id;
}

function queryTicketKnowledgeLink(ticketId, linkType, articleSlug = null) {
  const articlePredicate = articleSlug
    ? `and ka.slug = '${sqlEscape(articleSlug)}'`
    : 'and tkl.article_id is null';

  const result = runSupabaseDbQuery(`
    select tkl.id::text as id
    from public.ticket_knowledge_links as tkl
    left join public.knowledge_articles as ka
      on ka.id = tkl.article_id
    where tkl.ticket_id = '${sqlEscape(ticketId)}'::uuid
      and tkl.link_type = '${linkType}'::public.ticket_knowledge_link_type
      and tkl.archived_at is null
      ${articlePredicate}
    limit 1;
  `);

  return result.rows?.[0]?.id ?? null;
}

async function ensureTicketKnowledgeLink({ actorSession, tenantId, ticketId, link }) {
  const existingId = queryTicketKnowledgeLink(ticketId, link.linkType, link.articleSlug ?? null);
  if (existingId) {
    return existingId;
  }

  if (link.linkType === 'documentation_gap') {
    const created = await callRpcAsUser({
      apiUrl: actorSession.apiUrl,
      anonKey: actorSession.anonKey,
      accessToken: actorSession.accessToken,
      rpcName: 'rpc_support_mark_documentation_gap',
      body: {
        p_ticket_id: ticketId,
        p_note: link.note,
        p_article_id: null,
      },
    });

    return created?.id ?? queryTicketKnowledgeLink(ticketId, link.linkType, null);
  }

  let article = queryKnowledgeArticleBySlug(link.articleSlug, tenantId);
  if (!article?.id) {
    const publicKnowledgeSpaceId = queryKnowledgeSpaceBySlug('genius');
    if (publicKnowledgeSpaceId) {
      article = queryKnowledgeArticleBySlugInSpace(link.articleSlug, publicKnowledgeSpaceId);
    }
  }

  if (!article?.id) {
    fail(`Artigo de fixture nao encontrado para o vinculo ${link.linkType}: ${link.articleSlug}.`);
  }

  const created = await callRpcAsUser({
    apiUrl: actorSession.apiUrl,
    anonKey: actorSession.anonKey,
    accessToken: actorSession.accessToken,
    rpcName: 'rpc_support_link_ticket_article',
    body: {
      p_ticket_id: ticketId,
      p_article_id: article.id,
      p_link_type: link.linkType,
      p_note: link.note,
    },
  });

  return created?.id ?? queryTicketKnowledgeLink(ticketId, link.linkType, link.articleSlug);
}

function queryKnowledgeArticleEntitlement(tenantId, articleId, entitlementScope) {
  const result = runSupabaseDbQuery(`
    select id::text as id
    from public.knowledge_article_entitlements
    where tenant_id = '${sqlEscape(tenantId)}'::uuid
      and article_id = '${sqlEscape(articleId)}'::uuid
      and entitlement_scope = '${sqlEscape(entitlementScope)}'::public.knowledge_article_entitlement_scope
      and archived_at is null
    limit 1;
  `);

  return result.rows?.[0]?.id ?? null;
}

async function ensureKnowledgeArticleEntitlement({
  actorSession,
  tenantId,
  articleSlug,
  entitlementScope,
  relationReason,
}) {
  const article = queryKnowledgeArticleBySlug(articleSlug, tenantId);
  if (!article?.id) {
    fail(`Artigo restrito ausente para entitlement customer-facing: ${articleSlug}.`);
  }

  const existingId = queryKnowledgeArticleEntitlement(tenantId, article.id, entitlementScope);
  if (existingId) {
    return existingId;
  }

  const created = await callRpcAsUser({
    apiUrl: actorSession.apiUrl,
    anonKey: actorSession.anonKey,
    accessToken: actorSession.accessToken,
    rpcName: 'rpc_admin_grant_knowledge_article_entitlement',
    body: {
      p_tenant_id: tenantId,
      p_article_id: article.id,
      p_entitlement_scope: entitlementScope,
      p_relation_reason: relationReason,
    },
  });

  return (
    created?.id ??
    queryKnowledgeArticleEntitlement(tenantId, article.id, entitlementScope)
  );
}

async function ensureCustomerTicketKnowledgeLink({
  actorSession,
  tenantId,
  ticketId,
  articleSlug,
  relationReason,
}) {
  let article = queryKnowledgeArticleBySlug(articleSlug, tenantId);
  if (!article?.id) {
    const publicKnowledgeSpaceId = queryKnowledgeSpaceBySlug('genius');
    if (publicKnowledgeSpaceId) {
      article = queryKnowledgeArticleBySlugInSpace(articleSlug, publicKnowledgeSpaceId);
    }
  }

  if (!article?.id) {
    fail(`Artigo ausente para vínculo customer-facing com ticket: ${articleSlug}.`);
  }

  const existingId = queryTicketKnowledgeLink(ticketId, 'sent_to_customer', articleSlug);
  if (existingId) {
    return existingId;
  }

  const created = await callRpcAsUser({
    apiUrl: actorSession.apiUrl,
    anonKey: actorSession.anonKey,
    accessToken: actorSession.accessToken,
    rpcName: 'rpc_admin_link_knowledge_article_to_ticket',
    body: {
      p_tenant_id: tenantId,
      p_ticket_id: ticketId,
      p_article_id: article.id,
      p_relation_reason: relationReason,
    },
  });

  return created?.id ?? queryTicketKnowledgeLink(ticketId, 'sent_to_customer', articleSlug);
}

function queryBusinessCalendarIdBySlug(slug) {
  const result = runSupabaseDbQuery(`
    select id::text as id
    from public.business_calendars
    where slug = '${sqlEscape(slug)}'
    limit 1;
  `);

  return result.rows?.[0]?.id ?? null;
}

function queryTicketSlaPolicyIdBySlug(slug) {
  const result = runSupabaseDbQuery(`
    select id::text as id
    from public.ticket_sla_policies
    where slug = '${sqlEscape(slug)}'
    limit 1;
  `);

  return result.rows?.[0]?.id ?? null;
}

function createSupportTicket({ actorUserId, tenantId, contactId, ticket }) {
  const existingTicketId = queryExistingSupportTicket(tenantId, ticket.title);
  if (existingTicketId) {
    return existingTicketId;
  }

  const assignedUserId = ticket.assignee ? ticket.assignee : null;

  const created = runSupabaseDbQuery(`
    insert into public.tickets (
      tenant_id,
      requester_contact_id,
      title,
      description,
      source,
      status,
      priority,
      severity,
      created_by_user_id,
      assigned_to_user_id,
      updated_by_user_id
    )
    values (
      '${sqlEscape(tenantId)}'::uuid,
      '${sqlEscape(contactId)}'::uuid,
      '${sqlEscape(ticket.title)}',
      '${sqlEscape(ticket.description)}',
      '${ticket.source}'::public.ticket_source,
      '${ticket.status}'::public.ticket_status,
      '${ticket.priority}'::public.ticket_priority,
      '${ticket.severity}'::public.ticket_severity,
      '${sqlEscape(actorUserId)}'::uuid,
      ${assignedUserId ? `'${sqlEscape(assignedUserId)}'::uuid` : 'null::uuid'},
      '${sqlEscape(actorUserId)}'::uuid
    )
    returning id::text as id;
  `);

  const ticketId = created.rows?.[0]?.id;
  if (!ticketId) {
    fail(`Nao foi possivel criar o ticket ${ticket.title}.`);
  }

  if (ticket.categorySlug) {
    runSupabaseDbQuery(`
      with selected_category as (
        select id
        from public.ticket_categories
        where slug = '${sqlEscape(ticket.categorySlug)}'
          and status = 'active'
        limit 1
      ),
      selected_reason as (
        select id
        from public.ticket_operational_reasons
        where slug = '${sqlEscape(ticket.operationalReasonSlug ?? 'classificacao-inicial')}'
          and status = 'active'
        limit 1
      ),
      updated_ticket as (
        update public.tickets as t
        set
          category_id = (select id from selected_category),
          initial_operational_reason_id = (select id from selected_reason),
          current_operational_reason_id = (select id from selected_reason),
          updated_by_user_id = '${sqlEscape(actorUserId)}'::uuid
        where t.id = '${sqlEscape(ticketId)}'::uuid
        returning t.*
      ),
      resolved_policy as (
        select
          ut.id as ticket_id,
          p.id as policy_id,
          p.first_response_minutes,
          p.resolution_minutes
        from updated_ticket as ut
        left join lateral app_private.resolve_ticket_sla_policy(
          ut.tenant_id,
          ut.category_id,
          ut.priority,
          ut.severity
        ) as p
          on true
      )
      update public.tickets as t
      set
        sla_policy_id = rp.policy_id,
        first_response_due_at = case
          when rp.policy_id is null then null
          else t.created_at + make_interval(mins => rp.first_response_minutes)
        end,
        resolution_due_at = case
          when rp.policy_id is null then null
          else t.created_at + make_interval(mins => rp.resolution_minutes)
        end,
        updated_by_user_id = '${sqlEscape(actorUserId)}'::uuid
      from resolved_policy as rp
      where t.id = rp.ticket_id;
    `);
  }

  runSupabaseDbQuery(`
    insert into public.ticket_events (
      tenant_id,
      ticket_id,
      event_type,
      visibility,
      actor_user_id,
      metadata
    )
    values (
      '${sqlEscape(tenantId)}'::uuid,
      '${sqlEscape(ticketId)}'::uuid,
      'ticket_created'::public.ticket_event_type,
      'customer'::public.message_visibility,
      '${sqlEscape(actorUserId)}'::uuid,
      jsonb_build_object(
        'category_slug',
        ${ticket.categorySlug ? `'${sqlEscape(ticket.categorySlug)}'` : 'null'},
        'operational_reason_slug',
        ${ticket.operationalReasonSlug ? `'${sqlEscape(ticket.operationalReasonSlug)}'` : 'null'}
      )
    );
  `);

  if (assignedUserId) {
    const assignment = runSupabaseDbQuery(`
      insert into public.ticket_assignments (
        tenant_id,
        ticket_id,
        assignment_kind,
        assigned_to_user_id,
        previous_assigned_to_user_id,
        assigned_by_user_id
      )
      values (
        '${sqlEscape(tenantId)}'::uuid,
        '${sqlEscape(ticketId)}'::uuid,
        'assigned'::public.ticket_assignment_kind,
        '${sqlEscape(assignedUserId)}'::uuid,
        null,
        '${sqlEscape(actorUserId)}'::uuid
      )
      returning id::text as id;
    `);

    const assignmentId = assignment.rows?.[0]?.id;
    if (assignmentId) {
      runSupabaseDbQuery(`
        insert into public.ticket_events (
          tenant_id,
          ticket_id,
          event_type,
          visibility,
          actor_user_id,
          assignment_id,
          metadata
        )
        values (
          '${sqlEscape(tenantId)}'::uuid,
          '${sqlEscape(ticketId)}'::uuid,
          'assigned'::public.ticket_event_type,
          'internal'::public.message_visibility,
          '${sqlEscape(actorUserId)}'::uuid,
          '${sqlEscape(assignmentId)}'::uuid,
          jsonb_build_object('assigned_to_user_id', '${sqlEscape(assignedUserId)}')
        );
      `);
    }
  }

  const publicMessage = runSupabaseDbQuery(`
    insert into public.ticket_messages (
      tenant_id,
      ticket_id,
      visibility,
      body,
      created_by_user_id
    )
    values (
      '${sqlEscape(tenantId)}'::uuid,
      '${sqlEscape(ticketId)}'::uuid,
      'customer'::public.message_visibility,
      '${sqlEscape(ticket.publicMessage)}',
      '${sqlEscape(actorUserId)}'::uuid
    )
    returning id::text as id;
  `);

  const publicMessageId = publicMessage.rows?.[0]?.id;
  if (publicMessageId) {
    runSupabaseDbQuery(`
      insert into public.ticket_events (
        tenant_id,
        ticket_id,
        event_type,
        visibility,
        actor_user_id,
        message_id,
        metadata
      )
      values (
        '${sqlEscape(tenantId)}'::uuid,
        '${sqlEscape(ticketId)}'::uuid,
        'message_added'::public.ticket_event_type,
        'customer'::public.message_visibility,
        '${sqlEscape(actorUserId)}'::uuid,
        '${sqlEscape(publicMessageId)}'::uuid,
        '{}'::jsonb
      );
    `);
  }

  const internalMessage = runSupabaseDbQuery(`
    insert into public.ticket_messages (
      tenant_id,
      ticket_id,
      visibility,
      body,
      created_by_user_id
    )
    values (
      '${sqlEscape(tenantId)}'::uuid,
      '${sqlEscape(ticketId)}'::uuid,
      'internal'::public.message_visibility,
      '${sqlEscape(ticket.internalNote)}',
      '${sqlEscape(actorUserId)}'::uuid
    )
    returning id::text as id;
  `);

  const internalMessageId = internalMessage.rows?.[0]?.id;
  if (internalMessageId) {
    runSupabaseDbQuery(`
      insert into public.ticket_events (
        tenant_id,
        ticket_id,
        event_type,
        visibility,
        actor_user_id,
        message_id,
        metadata
      )
      values (
        '${sqlEscape(tenantId)}'::uuid,
        '${sqlEscape(ticketId)}'::uuid,
        'internal_note_added'::public.ticket_event_type,
        'internal'::public.message_visibility,
        '${sqlEscape(actorUserId)}'::uuid,
        '${sqlEscape(internalMessageId)}'::uuid,
        '{}'::jsonb
      );
    `);
  }

  if (ticket.status !== 'new') {
    runSupabaseDbQuery(`
      insert into public.ticket_events (
        tenant_id,
        ticket_id,
        event_type,
        visibility,
        actor_user_id,
        metadata
      )
      values (
        '${sqlEscape(tenantId)}'::uuid,
        '${sqlEscape(ticketId)}'::uuid,
        ${ticket.status === 'resolved' ? "'resolved'::public.ticket_event_type" : ticket.status === 'cancelled' ? "'cancelled'::public.ticket_event_type" : "'status_changed'::public.ticket_event_type"},
        'internal'::public.message_visibility,
        '${sqlEscape(actorUserId)}'::uuid,
        jsonb_build_object(
          'status', '${ticket.status}',
          'note', 'Fixture local do Support Workspace'
        )
      );
    `);
  }

  const extraTimelineEntries = Number(ticket.extraTimelineEntries ?? 0);
  for (let index = 1; index <= extraTimelineEntries; index += 1) {
    const visibility = index % 3 === 0 ? 'internal' : 'customer';
    const body =
      visibility === 'internal'
        ? `Nota interna extra ${index} para validar continuidade operacional do ticket.`
        : `Atualização pública extra ${index} para manter o cliente alinhado sobre a tratativa.`;

    const extraMessage = runSupabaseDbQuery(`
      insert into public.ticket_messages (
        tenant_id,
        ticket_id,
        visibility,
        body,
        created_by_user_id,
        metadata
      )
      values (
        '${sqlEscape(tenantId)}'::uuid,
        '${sqlEscape(ticketId)}'::uuid,
        '${visibility}'::public.message_visibility,
        '${sqlEscape(body)}',
        '${sqlEscape(actorUserId)}'::uuid,
        jsonb_build_object('fixture_extra_index', ${index})
      )
      returning id::text as id;
    `);

    const extraMessageId = extraMessage.rows?.[0]?.id;
    if (extraMessageId) {
      runSupabaseDbQuery(`
        insert into public.ticket_events (
          tenant_id,
          ticket_id,
          event_type,
          visibility,
          actor_user_id,
          message_id,
          metadata
        )
        values (
          '${sqlEscape(tenantId)}'::uuid,
          '${sqlEscape(ticketId)}'::uuid,
          ${visibility === 'internal' ? "'internal_note_added'::public.ticket_event_type" : "'message_added'::public.ticket_event_type"},
          '${visibility}'::public.message_visibility,
          '${sqlEscape(actorUserId)}'::uuid,
          '${sqlEscape(extraMessageId)}'::uuid,
          jsonb_build_object('fixture_extra_index', ${index})
        );
      `);
    }
  }

  return ticketId;
}

function queryTicketCategoryIdBySlug(slug) {
  const result = runSupabaseDbQuery(`
    select id::text as id
    from public.ticket_categories
    where slug = '${sqlEscape(slug)}'
      and status = 'active'
    limit 1;
  `);

  const categoryId = result.rows?.[0]?.id;
  if (!categoryId) {
    fail(`Categoria operacional de ticket ausente: ${slug}.`);
  }

  return categoryId;
}

function queryTicketOperationalReasonIdBySlug(slug) {
  const result = runSupabaseDbQuery(`
    select id::text as id
    from public.ticket_operational_reasons
    where slug = '${sqlEscape(slug)}'
      and status = 'active'
    limit 1;
  `);

  const reasonId = result.rows?.[0]?.id;
  if (!reasonId) {
    fail(`Motivo operacional de ticket ausente: ${slug}.`);
  }

  return reasonId;
}

async function ensureSupportSlaPolicyFixture({ actorSession, tenantMap }) {
  const tenantId = tenantMap.get('support-qa-a');
  if (!tenantId) {
    fail('Tenant support-qa-a ausente para fixture de SLA.');
  }

  const categoryId = queryTicketCategoryIdBySlug('integracao-tecnica');
  if (!categoryId) {
    fail('Categoria integracao-tecnica ausente para fixture de SLA.');
  }

  const calendarSlug = 'qa-tenant-a-business-hours';
  const calendar = await callRpcAsUser({
    apiUrl: actorSession.apiUrl,
    anonKey: actorSession.anonKey,
    accessToken: actorSession.accessToken,
    rpcName: 'rpc_admin_upsert_business_calendar',
    body: {
      p_business_calendar_id: queryBusinessCalendarIdBySlug(calendarSlug),
      p_tenant_id: tenantId,
      p_slug: calendarSlug,
      p_name: 'Expediente QA Tenant A',
      p_timezone: 'America/Sao_Paulo',
      p_status: 'active',
    },
  });

  if (!calendar?.id) {
    fail('Calendario de SLA do tenant A nao foi criado pela RPC administrativa.');
  }

  const policySlug = 'qa-tenant-a-integracao-critica';
  await callRpcAsUser({
    apiUrl: actorSession.apiUrl,
    anonKey: actorSession.anonKey,
    accessToken: actorSession.accessToken,
    rpcName: 'rpc_admin_upsert_ticket_sla_policy',
    body: {
      p_policy_id: queryTicketSlaPolicyIdBySlug(policySlug),
      p_tenant_id: tenantId,
      p_slug: policySlug,
      p_name: 'SLA interno QA Tenant A integração crítica',
      p_description: 'Política tenant-aware para validar precedência de SLA no cockpit de suporte.',
      p_category_id: categoryId,
      p_priority: 'urgent',
      p_severity: 'critical',
      p_first_response_minutes: 15,
      p_resolution_minutes: 30,
      p_business_calendar_id: calendar.id,
      p_status: 'active',
    },
  });
}

function applyFixtureTicketSlaScenario({ ticketId, scenario, actorUserId }) {
  if (!scenario) {
    return;
  }

  const resolutionExpression =
    scenario === 'breached'
      ? "timezone('utc', now()) - interval '15 minutes'"
      : scenario === 'at_risk'
        ? "timezone('utc', now()) + interval '30 minutes'"
        : null;

  if (!resolutionExpression) {
    return;
  }

  runSupabaseDbQuery(`
    update public.tickets
    set
      first_response_due_at = least(first_response_due_at, timezone('utc', now()) + interval '10 minutes'),
      resolution_due_at = ${resolutionExpression},
      updated_by_user_id = '${sqlEscape(actorUserId)}'::uuid
    where id = '${sqlEscape(ticketId)}'::uuid;
  `);
}

async function createSupportTicketViaRpc({
  actorSession,
  tenantId,
  contactId,
  ticket,
}) {
  const existingTicketId = queryExistingSupportTicket(tenantId, ticket.title);
  if (existingTicketId) {
    return existingTicketId;
  }

  const created = await callRpcAsUser({
    apiUrl: actorSession.apiUrl,
    anonKey: actorSession.anonKey,
    accessToken: actorSession.accessToken,
    rpcName: 'rpc_create_ticket',
    body: {
      p_tenant_id: tenantId,
      p_title: ticket.title,
      p_description: ticket.description,
      p_source: ticket.source,
      p_priority: ticket.priority,
      p_severity: ticket.severity,
      p_requester_contact_id: contactId ?? null,
      p_category_id: ticket.categorySlug
        ? queryTicketCategoryIdBySlug(ticket.categorySlug)
        : null,
      p_operational_reason_id: ticket.operationalReasonSlug
        ? queryTicketOperationalReasonIdBySlug(ticket.operationalReasonSlug)
        : null,
    },
  });

  const ticketId = created?.id ?? queryExistingSupportTicket(tenantId, ticket.title);
  if (!ticketId) {
    fail(`Nao foi possivel criar via RPC o ticket ${ticket.title}.`);
  }

  return ticketId;
}

async function createEngineeringWorkItemFromTicketViaRpc({
  actorSession,
  ticketId,
  handoff,
}) {
  const existingLink = runSupabaseDbQuery(`
    select etl.id::text as id
    from public.engineering_ticket_links as etl
    join public.engineering_work_items as ewi
      on ewi.id = etl.engineering_work_item_id
     and ewi.tenant_id = etl.tenant_id
    where etl.ticket_id = '${sqlEscape(ticketId)}'::uuid
      and ewi.title = '${sqlEscape(handoff.title)}'
    limit 1;
  `);

  if (existingLink.rows?.[0]?.id) {
    return existingLink.rows[0].id;
  }

  const created = await callRpcAsUser({
    apiUrl: actorSession.apiUrl,
    anonKey: actorSession.anonKey,
    accessToken: actorSession.accessToken,
    rpcName: 'rpc_support_create_engineering_work_item_from_ticket',
    body: {
      p_ticket_id: ticketId,
      p_work_item_type: handoff.workItemType,
      p_title: handoff.title,
      p_description: handoff.description,
      p_handoff_note: handoff.handoffNote ?? null,
    },
  });

  const linkId =
    created?.id ??
    runSupabaseDbQuery(`
      select etl.id::text as id
      from public.engineering_ticket_links as etl
      join public.engineering_work_items as ewi
        on ewi.id = etl.engineering_work_item_id
       and ewi.tenant_id = etl.tenant_id
      where etl.ticket_id = '${sqlEscape(ticketId)}'::uuid
        and ewi.title = '${sqlEscape(handoff.title)}'
      limit 1;
    `).rows?.[0]?.id;

  if (!linkId) {
    fail(`Nao foi possivel criar o handoff técnico para o ticket ${handoff.ticketTitle}.`);
  }

  return linkId;
}

function queryEngineeringWorkItemIdByLink(linkId) {
  const result = runSupabaseDbQuery(`
    select engineering_work_item_id::text as id
    from public.engineering_ticket_links
    where id = '${sqlEscape(linkId)}'::uuid
    limit 1;
  `);

  return result.rows?.[0]?.id ?? null;
}

function queryEngineeringWorkItemState(workItemId) {
  const result = runSupabaseDbQuery(`
    select
      status::text as status,
      assigned_to_user_id::text as assigned_to_user_id
    from public.engineering_work_items
    where id = '${sqlEscape(workItemId)}'::uuid
    limit 1;
  `);

  return result.rows?.[0] ?? null;
}

async function applyEngineeringOperationViaRpc({
  actorSession,
  workItemId,
  tenantId,
  operation,
}) {
  if (operation.assign) {
    const currentState = queryEngineeringWorkItemState(workItemId);
    if (!currentState?.assigned_to_user_id) {
      await callRpcAsUser({
        apiUrl: actorSession.apiUrl,
        anonKey: actorSession.anonKey,
        accessToken: actorSession.accessToken,
        rpcName: 'rpc_engineering_assign_work_item',
        body: {
          p_engineering_work_item_id: workItemId,
          p_tenant_id: tenantId,
          p_assigned_to_user_id: null,
        },
      });
    }
  }

  if (operation.status) {
    const currentState = queryEngineeringWorkItemState(workItemId);
    if (currentState?.status !== operation.status) {
      await callRpcAsUser({
        apiUrl: actorSession.apiUrl,
        anonKey: actorSession.anonKey,
        accessToken: actorSession.accessToken,
        rpcName: 'rpc_engineering_update_work_item_status',
        body: {
          p_engineering_work_item_id: workItemId,
          p_tenant_id: tenantId,
          p_status: operation.status,
          p_summary: operation.statusSummary,
          p_next_step: operation.statusNextStep ?? null,
        },
      });
    }
  }

  if (operation.updateSummary) {
    await callRpcAsUser({
      apiUrl: actorSession.apiUrl,
      anonKey: actorSession.anonKey,
      accessToken: actorSession.accessToken,
      rpcName: 'rpc_engineering_add_work_item_update',
      body: {
        p_engineering_work_item_id: workItemId,
        p_tenant_id: tenantId,
        p_summary: operation.updateSummary,
        p_next_step: operation.updateNextStep ?? null,
      },
    });
  }
}

function queryTicketAttachmentId(ticketId, fileName) {
  const result = runSupabaseDbQuery(`
    select id::text as id
    from public.ticket_attachments
    where ticket_id = '${sqlEscape(ticketId)}'::uuid
      and file_name = '${sqlEscape(fileName)}'
    order by created_at desc
    limit 1;
  `);

  return result.rows?.[0]?.id ?? null;
}

function applyFixtureUploadIntentVisibility({ uploadIntentId, visibility }) {
  if (visibility !== 'customer') {
    return;
  }

  runSupabaseDbQuery(`
    update public.ticket_attachment_upload_intents
    set visibility = 'customer'::public.message_visibility
    where id = '${sqlEscape(uploadIntentId)}'::uuid;
  `);
}

async function uploadTicketAttachmentViaSecureFlow({
  actorSession,
  ticketId,
  tenantId,
  attachment,
}) {
  const existingAttachmentId = queryTicketAttachmentId(ticketId, attachment.fileName);
  if (existingAttachmentId) {
    return existingAttachmentId;
  }

  const encoded = new TextEncoder().encode(attachment.body);
  const isCustomerUpload = attachment.uploadBoundary === 'customer';
  const prepared = await callRpcAsUser({
    apiUrl: actorSession.apiUrl,
    anonKey: actorSession.anonKey,
    accessToken: actorSession.accessToken,
    rpcName: isCustomerUpload
      ? 'rpc_customer_create_ticket_attachment_upload'
      : 'rpc_support_create_ticket_attachment_upload',
    body: {
      p_ticket_id: ticketId,
      p_tenant_id: tenantId,
      p_original_filename: attachment.fileName,
      p_content_type: attachment.contentType,
      p_size_bytes: encoded.byteLength,
    },
  });

  const uploadContract = Array.isArray(prepared) ? prepared[0] : prepared;
  if (!uploadContract?.upload_url || !uploadContract?.upload_intent_id) {
    fail(`Contrato de upload ausente para a evidência ${attachment.fileName}.`);
  }

  if (!isCustomerUpload) {
    applyFixtureUploadIntentVisibility({
      uploadIntentId: uploadContract.upload_intent_id,
      visibility: attachment.visibility,
    });
  }

  const formData = new FormData();
  formData.append(
    'file',
    new Blob([encoded], { type: attachment.contentType }),
    attachment.fileName,
  );

  const uploadResponse = await fetch(`${actorSession.apiUrl}${uploadContract.upload_url}`, {
    method: 'POST',
    headers: {
      apikey: actorSession.anonKey,
      Authorization: `Bearer ${actorSession.accessToken}`,
    },
    body: formData,
  });

  if (!uploadResponse.ok) {
    const detail = await uploadResponse.text();
    fail(
      `Falha ao enviar evidência segura ${attachment.fileName}: ${uploadResponse.status} ${detail}`,
    );
  }

  const payload = await uploadResponse.json().catch(() => null);
  const attachmentId =
    payload?.attachment?.attachment_id ??
    payload?.attachment?.attachmentId ??
    queryTicketAttachmentId(ticketId, attachment.fileName);

  if (!attachmentId) {
    fail(`Nao foi possivel registrar a evidência segura ${attachment.fileName}.`);
  }

  return attachmentId;
}

function clearFixtureTickets() {
  return null;
}

async function ensurePublicHelpCenterFixture(authorSession) {
  runSupabaseDbQuery(`
    update public.knowledge_spaces
    set status = 'active'
    where slug = 'genius';
  `);

  runSupabaseDbQuery(`
    insert into public.brand_settings (
      knowledge_space_id,
      brand_name,
      logo_asset_url,
      theme_tokens,
      seo_defaults,
      support_contacts
    )
    values (
      (select id from public.knowledge_spaces where slug = 'genius'),
      'Genius Returns',
      '/brand-assets/genius-returns-help.svg',
      jsonb_build_object(
        'surface', '#f7fbff',
        'accent', '#1459c7',
        'hero', 'linear-gradient(135deg, #141f47, #307fe2 58%, #74d2e7)',
        'orbA', 'rgba(116,210,231,0.18)',
        'orbB', 'rgba(20,31,71,0.16)'
      ),
      jsonb_build_object(
        'title', 'Genius Returns Help Center',
        'description', 'Documentação oficial para operação B2B.',
        'imageUrl', 'https://cdn.example.com/help-center-og.png'
      ),
      jsonb_build_object(
        'email', 'support@geniusreturns.com.br',
        'websiteUrl', 'https://geniusreturns.com.br',
        'statusPageUrl', 'https://status.geniusreturns.com.br',
        'docsUrl', 'https://geniusreturns.com.br/help'
      )
    )
    on conflict (knowledge_space_id) do update
    set brand_name = excluded.brand_name,
        logo_asset_url = excluded.logo_asset_url,
        theme_tokens = excluded.theme_tokens,
        seo_defaults = excluded.seo_defaults,
        support_contacts = excluded.support_contacts;
  `);

  const knowledgeSpaceId = queryKnowledgeSpaceBySlug('genius');
  if (!knowledgeSpaceId) {
    fail('Knowledge space publico genius nao encontrado para a fixture local.');
  }

  await archiveKnowledgeArticleV2IfPresent(
    authorSession,
    knowledgeSpaceId,
    'space-aware-ci-fixture',
  );

  const categoryMap = new Map();
  for (const category of FIXTURE.publicHelpCenter.categories) {
    const categoryId = await ensureKnowledgeCategoryV2(authorSession, knowledgeSpaceId, category);
    if (!categoryId) {
      fail(`Nao foi possivel materializar a categoria publica ${category.slug}.`);
    }

    categoryMap.set(category.slug, categoryId);
  }

  const createdArticles = [];
  for (const article of FIXTURE.publicHelpCenter.articles) {
    const categoryId = categoryMap.get(article.categorySlug);
    if (!categoryId) {
      fail(`Categoria publica ausente para o artigo ${article.slug}.`);
    }

    const articleId = await ensureKnowledgeArticlePublishedV2(
      authorSession,
      knowledgeSpaceId,
      article,
      categoryId,
    );

    const contract = queryPublicHelpCenterArticleContractBySlug(article.slug);
    if (!articleId || !contract?.public_article_path) {
      fail(`Contrato publico nao materializado para o artigo ${article.slug}.`);
    }

    createdArticles.push({
      id: articleId,
      title: article.title,
      slug: article.slug,
      category_slug: article.categorySlug,
      public_article_path: contract.public_article_path,
      created_by_email: contract.created_by_email,
      updated_by_email: contract.updated_by_email,
    });
  }

  return {
    space_slug: 'genius',
    author_email: FIXTURE.contentAuthor.email,
    articles: createdArticles,
  };
}

async function main() {
  const envMap = runSupabaseStatusEnv();
  const { apiUrl, serviceRoleKey, anonKey } = assertLocalOnly(envMap);
  await ensureLocalEdgeRuntime();

  const qaAdmin = await createOrUpdateAuthUser({
    apiUrl,
    serviceRoleKey,
    ...FIXTURE.qaAdmin,
  });

  const profile = queryProfileByEmail(FIXTURE.qaAdmin.email);
  if (!profile?.id || !profile.is_active) {
    fail('O profile do QA admin de suporte nao foi materializado corretamente.');
  }

  ensurePlatformAdminRole(profile.id);

  const contentAuthor = await createOrUpdateAuthUser({
    apiUrl,
    serviceRoleKey,
    ...FIXTURE.contentAuthor,
  });

  const contentAuthorProfile = queryProfileByEmail(FIXTURE.contentAuthor.email);
  if (!contentAuthorProfile?.id || !contentAuthorProfile.is_active) {
    fail('O profile do autor humano da central publica nao foi materializado corretamente.');
  }

  ensurePlatformAdminRole(contentAuthorProfile.id);

  const tenantMap = new Map();
  const contactMap = new Map();

  for (const tenant of FIXTURE.tenants) {
    const tenantId = ensureTenant(profile.id, tenant);
    tenantMap.set(tenant.slug, tenantId);
    if (tenant.contact) {
      contactMap.set(tenant.slug, ensureContact(profile.id, tenantId, tenant.contact));
    }
    if (tenant.customerAccount) {
      ensureCustomerAccountProfile(profile.id, tenantId, tenant.customerAccount);
      ensureCustomerAccountIntegrations(profile.id, tenantId, tenant.customerAccount);
      ensureCustomerAccountFeatures(profile.id, tenantId, tenant.customerAccount);
      ensureCustomerAccountCustomizations(profile.id, tenantId, tenant.customerAccount);
      ensureCustomerAccountAlerts(profile.id, tenantId, tenant.customerAccount);
    }
    ensureTenantMembership({
      actorUserId: profile.id,
      tenantId,
      userId: profile.id,
    });
  }

  const operatorMap = new Map([['qa-admin', profile.id]]);
  const sessionConfigByKey = new Map([
    [
      'qa-admin',
      {
        apiUrl,
        anonKey,
        email: FIXTURE.qaAdmin.email,
        password: FIXTURE.qaAdmin.password,
      },
    ],
    [
      'content-author',
      {
        apiUrl,
        anonKey,
        email: FIXTURE.contentAuthor.email,
        password: FIXTURE.contentAuthor.password,
      },
    ],
  ]);
  for (const agent of FIXTURE.agents) {
    const authUser = await createOrUpdateAuthUser({
      apiUrl,
      serviceRoleKey,
      email: agent.email,
      password: agent.password,
      fullName: agent.fullName,
    });

    const agentProfile = queryProfileByEmail(agent.email);
    if (!agentProfile?.id || !agentProfile.is_active) {
      fail(`O profile do agente local ${agent.email} nao foi materializado corretamente.`);
    }

    const tenantId = tenantMap.get(agent.tenantSlug);
    if (!tenantId) {
      fail(`Tenant ausente para o agente local ${agent.email}.`);
    }

    ensureGlobalRole({
      actorUserId: profile.id,
      userId: agentProfile.id,
      role: agent.globalRole,
    });
    ensureTenantMembership({
      actorUserId: profile.id,
      tenantId,
      userId: agentProfile.id,
    });

    operatorMap.set(agent.key, agentProfile.id);
    operatorMap.set(agent.email, agentProfile.id);
    operatorMap.set(authUser.id, agentProfile.id);
    sessionConfigByKey.set(agent.key, {
      apiUrl,
      anonKey,
      email: agent.email,
      password: agent.password,
    });
  }

  for (const accessUser of FIXTURE.accessUsers) {
    const authUser = await createOrUpdateAuthUser({
      apiUrl,
      serviceRoleKey,
      email: accessUser.email,
      password: accessUser.password,
      fullName: accessUser.fullName,
    });

    const accessProfile = queryProfileByEmail(accessUser.email);
    if (!accessProfile?.id || !accessProfile.is_active) {
      fail(`O profile do usuario de access local ${accessUser.email} nao foi materializado corretamente.`);
    }

    const tenantId = tenantMap.get(accessUser.tenantSlug);
    if (!tenantId) {
      fail(`Tenant ausente para o usuario de access local ${accessUser.email}.`);
    }

    ensureTenantMembership({
      actorUserId: profile.id,
      tenantId,
      userId: accessProfile.id,
      role: accessUser.role,
      status: accessUser.status,
    });

    operatorMap.set(accessUser.key, accessProfile.id);
    operatorMap.set(accessUser.email, accessProfile.id);
    operatorMap.set(authUser.id, accessProfile.id);
  }

  const customerPortalUserMap = new Map();
  for (const portalUser of FIXTURE.customerPortalUsers) {
    const authUser = await createOrUpdateAuthUser({
      apiUrl,
      serviceRoleKey,
      email: portalUser.email,
      password: portalUser.password,
      fullName: portalUser.fullName,
    });

    const portalProfile = queryProfileByEmail(portalUser.email);
    if (!portalProfile?.id || !portalProfile.is_active) {
      fail(`O profile customer-facing local ${portalUser.email} nao foi materializado corretamente.`);
    }

    const tenantId = tenantMap.get(portalUser.tenantSlug);
    if (!tenantId) {
      fail(`Tenant ausente para o usuario customer-facing local ${portalUser.email}.`);
    }

    const contactId = ensureCustomerPortalContact({
      actorUserId: profile.id,
      contact: portalUser.contact,
      tenantId,
      userId: portalProfile.id,
    });

    ensureTenantMembership({
      actorUserId: profile.id,
      tenantId,
      userId: portalProfile.id,
      role: portalUser.role,
      status: portalUser.status,
    });

    operatorMap.set(portalUser.key, portalProfile.id);
    operatorMap.set(portalUser.email, portalProfile.id);
    operatorMap.set(authUser.id, portalProfile.id);
    customerPortalUserMap.set(portalUser.key, {
      contactId,
      profileId: portalProfile.id,
      userId: authUser.id,
    });
    sessionConfigByKey.set(portalUser.key, {
      apiUrl,
      anonKey,
      email: portalUser.email,
      password: portalUser.password,
    });
  }

  const sessionCache = new Map();
  const getSessionForKey = async (key) => {
    if (sessionCache.has(key)) {
      return sessionCache.get(key);
    }

    const config = sessionConfigByKey.get(key);
    if (!config) {
      fail(`Sessao local ausente para ${key}.`);
    }

    const authSession = await signInLocalUser(config);
    const session = {
      apiUrl: config.apiUrl,
      anonKey: config.anonKey,
      accessToken: authSession.access_token,
    };
    sessionCache.set(key, session);
    return session;
  };

  await ensureSupportSlaPolicyFixture({
    actorSession: await getSessionForKey('qa-admin'),
    tenantMap,
  });

  clearFixtureTickets();

  const createdTickets = [];
  const ticketMap = new Map();
  for (const ticket of FIXTURE.tickets) {
    const tenantId = tenantMap.get(ticket.tenantSlug);
    const contactId = contactMap.get(ticket.tenantSlug);

    if (!tenantId) {
      fail(`Tenant ausente para o fixture ${ticket.title}.`);
    }

    const ticketId = ticket.viaRpc
      ? await createSupportTicketViaRpc({
          actorSession: await getSessionForKey('qa-admin'),
          tenantId,
          contactId: contactId ?? null,
          ticket,
        })
      : createSupportTicket({
          actorUserId:
            ticket.assignee && operatorMap.has(ticket.assignee)
              ? operatorMap.get(ticket.assignee)
              : profile.id,
          tenantId,
          contactId,
          ticket: {
            ...ticket,
            assignee:
              ticket.assignee && operatorMap.has(ticket.assignee)
                ? operatorMap.get(ticket.assignee)
                : null,
          },
        });

    applyFixtureTicketSlaScenario({
      ticketId,
      scenario: ticket.slaScenario,
      actorUserId: profile.id,
    });

    createdTickets.push({
      id: ticketId,
      title: ticket.title,
      tenant_slug: ticket.tenantSlug,
      status: ticket.status,
    });
    ticketMap.set(`${ticket.tenantSlug}::${ticket.title}`, ticketId);
  }

  const createdCustomerPortalCollaborations = [];
  for (const collaboration of FIXTURE.customerPortalCollaborations ?? []) {
    const ticketId = ticketMap.get(
      `${collaboration.ticketTenantSlug}::${collaboration.ticketTitle}`,
    );
    const actorSession = await getSessionForKey(collaboration.actorKey);

    if (!ticketId) {
      fail(`Ticket ausente para colaboracao customer-facing: ${collaboration.ticketTitle}.`);
    }

    if (collaboration.message) {
      await callRpcAsUser({
        ...actorSession,
        body: {
          p_body: collaboration.message,
          p_ticket_id: ticketId,
        },
        rpcName: 'rpc_customer_add_ticket_message',
      });
    }

    if (collaboration.acknowledge) {
      await callRpcAsUser({
        ...actorSession,
        body: {
          p_last_timeline_entry_id: null,
          p_ticket_id: ticketId,
        },
        rpcName: 'rpc_customer_acknowledge_ticket_update',
      });
    }

    createdCustomerPortalCollaborations.push({
      actor_key: collaboration.actorKey,
      acknowledged: Boolean(collaboration.acknowledge),
      message_registered: Boolean(collaboration.message),
      ticket_id: ticketId,
      ticket_title: collaboration.ticketTitle,
      ticket_tenant_slug: collaboration.ticketTenantSlug,
    });
  }

  const knowledgeCategoryMap = new Map();
  const createdKnowledgeArticles = [];
  const createdKnowledgeEntitlements = [];
  const createdKnowledgeLinks = [];
  const createdEngineeringHandoffs = [];
  const engineeringWorkItemMap = new Map();
  const createdEngineeringOperations = [];
  const createdAttachments = [];
  const adminSession = await getSessionForKey('qa-admin');
  const contentAuthorSession = await getSessionForKey('content-author');
  const publicHelpCenter = await ensurePublicHelpCenterFixture(contentAuthorSession);

  for (const category of FIXTURE.knowledgeBase.categories ?? []) {
    const tenantId = tenantMap.get(category.tenantSlug);
    if (!tenantId) {
      fail(`Tenant ausente para a categoria de conhecimento ${category.slug}.`);
    }

    const categoryId = await ensureKnowledgeCategory(adminSession, tenantId, category);
    knowledgeCategoryMap.set(category.slug, categoryId);
  }

  for (const article of FIXTURE.knowledgeBase.articles ?? []) {
    const tenantId = tenantMap.get(article.tenantSlug);
    const categoryId = knowledgeCategoryMap.get(article.categorySlug);

    if (!tenantId || !categoryId) {
      fail(`Tenant ou categoria ausente para o artigo ${article.slug}.`);
    }

    const articleId = await ensureKnowledgeArticlePublished(
      adminSession,
      tenantId,
      article,
      categoryId,
    );
    createdKnowledgeArticles.push({
      slug: article.slug,
      id: articleId,
      tenant_slug: article.tenantSlug,
      visibility: article.visibility,
      status: article.targetStatus ?? 'published',
    });
  }

  for (const entitlement of FIXTURE.knowledgeBase.entitlements ?? []) {
    const tenantId = tenantMap.get(entitlement.tenantSlug);
    const actorSession = await getSessionForKey(entitlement.actorKey);

    if (!tenantId) {
      fail(`Tenant ausente para entitlement de conhecimento: ${entitlement.tenantSlug}.`);
    }

    const entitlementId = await ensureKnowledgeArticleEntitlement({
      actorSession,
      tenantId,
      articleSlug: entitlement.articleSlug,
      entitlementScope: entitlement.entitlementScope,
      relationReason: entitlement.relationReason,
    });

    createdKnowledgeEntitlements.push({
      id: entitlementId,
      tenant_slug: entitlement.tenantSlug,
      article_slug: entitlement.articleSlug,
      entitlement_scope: entitlement.entitlementScope,
    });
  }

  for (const link of FIXTURE.knowledgeBase.links ?? []) {
    const ticketId = ticketMap.get(`${link.ticketTenantSlug}::${link.ticketTitle}`);
    const tenantId = tenantMap.get(link.ticketTenantSlug);
    const actorSession = await getSessionForKey(link.actorKey);

    if (!ticketId) {
      fail(`Ticket ausente para vinculo de conhecimento: ${link.ticketTitle}.`);
    }

    if (!tenantId) {
      fail(`Tenant ausente para vinculo de conhecimento: ${link.ticketTenantSlug}.`);
    }

    const linkId = await ensureTicketKnowledgeLink({
      actorSession,
      tenantId,
      ticketId,
      link,
    });

    createdKnowledgeLinks.push({
      id: linkId,
      ticket_title: link.ticketTitle,
      ticket_tenant_slug: link.ticketTenantSlug,
      link_type: link.linkType,
      article_slug: link.articleSlug ?? null,
    });
  }

  for (const link of FIXTURE.knowledgeBase.customerTicketLinks ?? []) {
    const ticketId = ticketMap.get(`${link.ticketTenantSlug}::${link.ticketTitle}`);
    const tenantId = tenantMap.get(link.ticketTenantSlug);
    const actorSession = await getSessionForKey(link.actorKey);

    if (!ticketId) {
      fail(`Ticket ausente para vínculo customer-facing: ${link.ticketTitle}.`);
    }

    if (!tenantId) {
      fail(`Tenant ausente para vínculo customer-facing: ${link.ticketTenantSlug}.`);
    }

    const linkId = await ensureCustomerTicketKnowledgeLink({
      actorSession,
      tenantId,
      ticketId,
      articleSlug: link.articleSlug,
      relationReason: link.relationReason,
    });

    createdKnowledgeLinks.push({
      id: linkId,
      ticket_title: link.ticketTitle,
      ticket_tenant_slug: link.ticketTenantSlug,
      link_type: 'sent_to_customer',
      article_slug: link.articleSlug,
      relation_reason: link.relationReason,
    });
  }

  for (const handoff of FIXTURE.engineeringHandoffs ?? []) {
    const ticketId = ticketMap.get(`${handoff.ticketTenantSlug}::${handoff.ticketTitle}`);
    if (!ticketId) {
      fail(`Ticket ausente para handoff técnico: ${handoff.ticketTitle}.`);
    }

    const actorSession = await getSessionForKey(handoff.actorKey);
    const linkId = await createEngineeringWorkItemFromTicketViaRpc({
      actorSession,
      ticketId,
      handoff,
    });
    const workItemId = queryEngineeringWorkItemIdByLink(linkId);
    if (!workItemId) {
      fail(`Work item ausente para o handoff técnico ${handoff.title}.`);
    }

    createdEngineeringHandoffs.push({
      link_id: linkId,
      work_item_id: workItemId,
      ticket_title: handoff.ticketTitle,
      ticket_tenant_slug: handoff.ticketTenantSlug,
      work_item_type: handoff.workItemType,
      title: handoff.title,
    });
    engineeringWorkItemMap.set(handoff.title, {
      workItemId,
      tenantId: tenantMap.get(handoff.ticketTenantSlug),
    });
  }

  for (const operation of FIXTURE.engineeringOperations ?? []) {
    const target = engineeringWorkItemMap.get(operation.handoffTitle);
    if (!target?.workItemId || !target.tenantId) {
      fail(`Work item ausente para operacao tecnica: ${operation.handoffTitle}.`);
    }

    const actorSession = await getSessionForKey(operation.actorKey);
    await applyEngineeringOperationViaRpc({
      actorSession,
      workItemId: target.workItemId,
      tenantId: target.tenantId,
      operation,
    });

    createdEngineeringOperations.push({
      work_item_id: target.workItemId,
      actor_key: operation.actorKey,
      status: operation.status ?? null,
      assigned: Boolean(operation.assign),
      update_registered: Boolean(operation.updateSummary),
    });
  }

  for (const attachment of FIXTURE.attachments ?? []) {
    const ticketId = ticketMap.get(`${attachment.ticketTenantSlug}::${attachment.ticketTitle}`);
    const tenantId = tenantMap.get(attachment.ticketTenantSlug);
    if (!ticketId) {
      fail(`Ticket ausente para evidência segura: ${attachment.ticketTitle}.`);
    }
    if (!tenantId) {
      fail(`Tenant ausente para evidência segura: ${attachment.ticketTenantSlug}.`);
    }

    const actorSession = await getSessionForKey(attachment.actorKey);
    const attachmentId = await uploadTicketAttachmentViaSecureFlow({
      actorSession,
      ticketId,
      tenantId,
      attachment,
    });

    createdAttachments.push({
      attachment_id: attachmentId,
      ticket_id: ticketId,
      ticket_title: attachment.ticketTitle,
      ticket_tenant_slug: attachment.ticketTenantSlug,
      file_name: attachment.fileName,
      content_type: attachment.contentType,
    });
  }

  console.log(
    JSON.stringify(
      {
        fixture: 'local-support-workspace',
        remote_used: false,
        qa_admin: {
          user_id: qaAdmin.id,
          profile_id: profile.id,
          email: FIXTURE.qaAdmin.email,
          password: FIXTURE.qaAdmin.password,
        },
        content_author: {
          user_id: contentAuthor.id,
          profile_id: contentAuthorProfile.id,
          email: FIXTURE.contentAuthor.email,
          password: FIXTURE.contentAuthor.password,
        },
        support_agents: FIXTURE.agents.map((agent) => ({
          key: agent.key,
          email: agent.email,
          password: agent.password,
          tenant_slug: agent.tenantSlug,
          user_id: operatorMap.get(agent.key),
        })),
        access_users: FIXTURE.accessUsers.map((accessUser) => ({
          key: accessUser.key,
          email: accessUser.email,
          password: accessUser.password,
          tenant_slug: accessUser.tenantSlug,
          role: accessUser.role,
          status: accessUser.status,
          user_id: operatorMap.get(accessUser.key),
        })),
        customer_portal_users: FIXTURE.customerPortalUsers.map((portalUser) => ({
          key: portalUser.key,
          email: portalUser.email,
          password: portalUser.password,
          tenant_slug: portalUser.tenantSlug,
          role: portalUser.role,
          status: portalUser.status,
          user_id: customerPortalUserMap.get(portalUser.key)?.profileId ?? null,
          contact_id: customerPortalUserMap.get(portalUser.key)?.contactId ?? null,
        })),
        tenants: FIXTURE.tenants.map((tenant) => ({
          slug: tenant.slug,
          id: tenantMap.get(tenant.slug),
        })),
        customer_accounts: FIXTURE.tenants.map((tenant) => ({
          tenant_slug: tenant.slug,
          has_profile: Boolean(tenant.customerAccount),
          product_line: tenant.customerAccount?.productLine ?? null,
          integrations: tenant.customerAccount?.integrations?.length ?? 0,
          features: tenant.customerAccount?.features?.length ?? 0,
          customizations: tenant.customerAccount?.customizations?.length ?? 0,
          alerts: tenant.customerAccount?.alerts?.length ?? 0,
        })),
        knowledge_articles: createdKnowledgeArticles,
        knowledge_entitlements: createdKnowledgeEntitlements,
        knowledge_links: createdKnowledgeLinks,
        engineering_handoffs: createdEngineeringHandoffs,
        engineering_operations: createdEngineeringOperations,
        attachments: createdAttachments,
        public_help_center: publicHelpCenter,
        tickets: createdTickets,
        customer_portal_collaborations: createdCustomerPortalCollaborations,
      },
      null,
      2,
    ),
  );
}

await main();
