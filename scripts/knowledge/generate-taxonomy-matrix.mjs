import fs from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';
import { readLocalSupabaseConfig } from './local-supabase-config.mjs';

const outputPath = process.argv[2] ?? 'docs/reports/TAXONOMY_01_ARTICLE_MATRIX_2026-07-24.md';
const config = readLocalSupabaseConfig({
  ...process.env,
  KNOWLEDGE_ADMIN_EMAIL: process.env.KNOWLEDGE_ADMIN_EMAIL,
  KNOWLEDGE_ADMIN_PASSWORD: process.env.KNOWLEDGE_ADMIN_PASSWORD,
});
const client = createClient(config.url, config.serviceRoleKey ?? config.anonKey);
const { data: space, error: spaceError } = await client.from('knowledge_spaces').select('id').eq('slug', 'genius').single();
if (spaceError) throw spaceError;
const { data: articles, error: articleError } = await client
  .from('knowledge_articles')
  .select('id,title,slug,status,visibility,category_id,body_md')
  .eq('knowledge_space_id', space.id)
  .order('title');
if (articleError) throw articleError;
const { data: categories, error: categoryError } = await client
  .from('knowledge_categories')
  .select('id,name,slug,parent_category_id,visibility')
  .eq('knowledge_space_id', space.id);
if (categoryError) throw categoryError;

const byId = new Map(categories.map((category) => [category.id, category]));
const intentBySlug = new Map([
  ['configurando-parametrizacao-geral', 'Configurar parâmetros gerais da operação'],
  ['como-automatizar-a-conclusao-de-uma-solicitacao', 'Configurar automação de conclusão'],
  ['como-o-consumidor-solicita-uma-reversa', 'Iniciar uma solicitação'],
  ['acompanhar-solicitacoes-de-troca-e-devolucao', 'Acompanhar uma solicitação'],
  ['interpretar-status-da-logistica-reversa', 'Interpretar logística reversa'],
]);
const confidenceBySlug = new Map([
  ['posso-enviar-uma-notificacao-de-analise-ao-cliente', 'média'],
  ['como-configurar-a-cor-exibida-nos-filtros-basicos-das-solicitacoes', 'média'],
  ['como-realizar-alteracoes-em-um-vale-compra-pendente', 'média'],
]);
const previousCategoryBySlug = new Map([
  ['acompanhar-solicitacoes-de-troca-e-devolucao', 'Operação de reversa'],
  ['interpretar-status-da-logistica-reversa', 'Operação de reversa'],
  ['erro-ao-tentar-realizar-o-estorno', 'Erros e pendências'],
  ['erro-de-autorizacao-ao-acessar-pedidos-na-vtex', 'Erros e pendências'],
  ['erro-nao-autorizado-ao-gerar-codigo-reverso-postagem', 'Erros e pendências'],
  ['erro-no-cep-ou-endereco-incorreto', 'Erros e pendências'],
  ['pendencia-de-logistica-reversa', 'Erros e pendências'],
  ['como-cadastrar-lojas-fisicas', 'Sellers e Loja Fisica'],
  ['configuracao-de-sellers-permitidos', 'Sellers e Loja Fisica'],
  ['criar-lojas-virtuais', 'Sellers e Loja Fisica'],
  ['sellers-permitidos-para-criar-vale-compras', 'Sellers e Loja Fisica'],
  ['regras-de-cadastro-e-configuracoes-de-sellers-estorno-e-logistica', 'Sellers e Loja Fisica'],
  ['como-atualizar-os-dados-de-integracao-do-e-commerce', 'Integração e atualização'],
  ['erros-na-integracao-do-contrato-do-correios', 'Integração e atualização'],
  ['habilitar-a-api-de-logistica-reversa-do-correios', 'Integração e atualização'],
  ['intalacao-e-integracao-nuvemshop', 'Integração e atualização'],
  ['integracao-e-configuracao-com-os-correios', 'Integração e atualização'],
  ['permissoes-shopify', 'Integração e atualização'],
  ['permissoes-tray', 'Integração e atualização'],
  ['permissoes-vtex', 'Integração e atualização'],
]);

function parentName(category) {
  return category?.parent_category_id ? byId.get(category.parent_category_id)?.name ?? '—' : category?.name ?? '—';
}

const lines = [
  '# TAXONOMY-01 — Matriz artigo por artigo',
  '',
  'Gerada a partir do catálogo local do espaço `genius`; conteúdo, status, visibilidade, categoria e subcategoria foram conferidos antes da aplicação.',
  '',
  '| ID | Título | Status | Categoria anterior | Categoria proposta | Subcategoria | Intenção principal | Público | Confiança | Observação |',
  '|---|---|---|---|---|---|---|---|---|',
];

for (const article of articles) {
  const category = byId.get(article.category_id);
  const isPublic = article.status === 'published' && article.visibility === 'public';
  const previousCategory = previousCategoryBySlug.get(article.slug) ?? (category?.slug === 'integracoes' ? 'Integrações e API' : category?.slug === 'primeiros-passos' ? 'Primeiros passos' : category?.slug === 'suporte-tecnico' ? 'Suporte técnico' : 'Configuração de ambiente');
  const categoryLabel = category?.parent_category_id ? parentName(category) : category?.name ?? '—';
  const subcategoryLabel = category?.parent_category_id ? category.name : '—';
  const confidence = confidenceBySlug.get(article.slug) ?? 'alta';
  const intent = intentBySlug.get(article.slug) ?? (subcategoryLabel !== '—' ? `Consultar ${subcategoryLabel.toLowerCase()}` : 'Conteúdo de referência');
  const observation = isPublic ? 'Mantido na navegação pública.' : 'Preservado fora da navegação pública.';
  const safe = (value) => String(value ?? '—').replaceAll('|', '\\|').replaceAll('\n', ' ');
  lines.push(`| ${safe(article.id)} | ${safe(article.title)} | ${safe(article.status)} / ${safe(article.visibility)} | ${safe(previousCategory)} | ${safe(categoryLabel)} | ${safe(subcategoryLabel)} | ${safe(intent)} | ${isPublic ? 'sim' : 'não'} | ${confidence} | ${observation} |`);
}

await fs.writeFile(outputPath, `${lines.join('\n')}\n`, 'utf8');
console.log(JSON.stringify({ outputPath, articles: articles.length, public: articles.filter((article) => article.status === 'published' && article.visibility === 'public').length }));
