import type { CeoSnapshot, CommercialSnapshot, CsSnapshot, FinanceSnapshot } from './analytics-model';
import { formatCurrencyBRL, formatPercent } from './analytics-model';

export type AnalyticsReportSection = 'ceo' | 'commercial' | 'cs' | 'finance';

export interface AnalyticsReportData {
  from: string;
  to: string;
  selected: AnalyticsReportSection[];
  ceo?: CeoSnapshot;
  commercial?: CommercialSnapshot;
  cs?: CsSnapshot;
  finance?: FinanceSnapshot;
}

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function periodLabel(data: AnalyticsReportData) {
  return `${data.from || 'início indisponível'} a ${data.to || 'fim indisponível'}`;
}

function reportSections(data: AnalyticsReportData) {
  const sections: string[] = [];
  if (data.selected.includes('ceo') && data.ceo) {
    const c = data.ceo.commercial;
    const f = data.ceo.finance;
    const s = data.ceo.support;
    sections.push(`<section><h2>Visão executiva</h2><div class="grid"><div><b>Receita ganha</b><strong>${escapeHtml(formatCurrencyBRL(c.wonRevenue))}</strong></div><div><b>Conversão</b><strong>${escapeHtml(formatPercent(c.conversionRate))}</strong></div><div><b>Saldo vencido</b><strong>${escapeHtml(formatCurrencyBRL(f.overdueBalance))}</strong></div><div><b>Tickets abertos</b><strong>${s.openTickets.toLocaleString('pt-BR')}</strong></div></div></section>`);
  }
  if (data.selected.includes('commercial') && data.commercial) {
    const k = data.commercial.kpis;
    sections.push(`<section><h2>Comercial</h2><div class="grid"><div><b>Deals totais</b><strong>${k.totalDeals.toLocaleString('pt-BR')}</strong></div><div><b>Deals abertos</b><strong>${k.openDeals.toLocaleString('pt-BR')}</strong></div><div><b>Receita ganha</b><strong>${escapeHtml(formatCurrencyBRL(k.wonRevenue))}</strong></div><div><b>Conversão</b><strong>${escapeHtml(formatPercent(k.conversionRate))}</strong></div><div><b>Ticket médio</b><strong>${escapeHtml(formatCurrencyBRL(k.avgTicket))}</strong></div></div></section>`);
  }
  if (data.selected.includes('cs') && data.cs) {
    const k = data.cs.kpis;
    sections.push(`<section><h2>CS / Suporte</h2><div class="grid"><div><b>Tickets totais</b><strong>${k.totalTickets.toLocaleString('pt-BR')}</strong></div><div><b>Abertos</b><strong>${k.openTickets.toLocaleString('pt-BR')}</strong></div><div><b>Encerrados</b><strong>${k.closedTickets.toLocaleString('pt-BR')}</strong></div><div><b>Taxa de encerramento</b><strong>${escapeHtml(formatPercent(k.closedRate))}</strong></div></div><p class="muted">Origem e distribuição seguem os pipelines selecionados no Dashboard.</p></section>`);
  }
  if (data.selected.includes('finance') && data.finance) {
    const k = data.finance.kpis;
    sections.push(`<section><h2>Financeiro</h2><div class="grid"><div><b>Títulos</b><strong>${k.totalTitles.toLocaleString('pt-BR')}</strong></div><div><b>Valor líquido</b><strong>${escapeHtml(formatCurrencyBRL(k.netAmount))}</strong></div><div><b>Recebido</b><strong>${escapeHtml(formatCurrencyBRL(k.receivedAmount))}</strong></div><div><b>Saldo em aberto</b><strong>${escapeHtml(formatCurrencyBRL(k.balance))}</strong></div><div class="danger"><b>Saldo vencido</b><strong>${escapeHtml(formatCurrencyBRL(k.overdueBalance))}</strong></div></div></section>`);
  }
  return sections.join('');
}

function reportHtml(data: AnalyticsReportData) {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Genius Support OS — Relatório Gerencial</title><style>*{box-sizing:border-box}body{margin:0;background:#fff;color:#102347;font:14px Arial,sans-serif}main{max-width:1100px;margin:0 auto;padding:34px}header{border-bottom:2px solid #2f6bff;padding-bottom:18px;margin-bottom:20px}h1{font-size:26px;margin:0 0 8px}h2{font-size:17px;margin:0 0 14px;color:#183b72}.muted{color:#60708f;font-size:12px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px}section{border:1px solid #d7deeb;border-radius:12px;padding:16px;margin-bottom:14px;break-inside:avoid}section div{background:#f5f8fc;border-radius:8px;padding:11px}section b{display:block;color:#60708f;font-size:11px;margin-bottom:7px}section strong{display:block;font-size:18px}.danger strong{color:#b42318}@media print{main{padding:0}section{break-inside:avoid}body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body><main><header><h1>Genius Support OS — Relatório Gerencial</h1><div class="muted">Período: ${escapeHtml(periodLabel(data))} · Gerado em ${escapeHtml(new Date().toLocaleString('pt-BR'))}</div><div class="muted">Fontes: HubSpot e OMIE API. O relatório contém apenas as abas selecionadas.</div></header>${reportSections(data) || '<p>Nenhuma aba selecionada.</p>'}</main></body></html>`;
}

export function printAnalyticsReport(data: AnalyticsReportData) {
  const reportWindow = window.open('', '_blank', 'width=1200,height=900');
  if (!reportWindow) return false;
  reportWindow.opener = null;
  const reportUrl = URL.createObjectURL(
    new Blob([reportHtml(data)], { type: 'text/html;charset=utf-8' }),
  );
  reportWindow.addEventListener(
    'load',
    () => {
      window.setTimeout(() => {
        reportWindow.print();
        reportWindow.addEventListener('afterprint', () => reportWindow.close(), { once: true });
      }, 120);
    },
    { once: true },
  );
  reportWindow.location.replace(reportUrl);
  window.setTimeout(() => URL.revokeObjectURL(reportUrl), 60_000);
  return true;
}

function reportLines(data: AnalyticsReportData) {
  const lines = [`Genius Support OS - Relatorio Gerencial`, `Periodo: ${periodLabel(data)}`, ''];
  if (data.selected.includes('ceo') && data.ceo) lines.push('VISÃO EXECUTIVA', `Receita ganha: ${formatCurrencyBRL(data.ceo.commercial.wonRevenue)}`, `Conversão: ${formatPercent(data.ceo.commercial.conversionRate)}`, `Saldo vencido: ${formatCurrencyBRL(data.ceo.finance.overdueBalance)}`, '');
  if (data.selected.includes('commercial') && data.commercial) lines.push('COMERCIAL', `Deals: ${data.commercial.kpis.totalDeals}`, `Receita ganha: ${formatCurrencyBRL(data.commercial.kpis.wonRevenue)}`, `Conversão: ${formatPercent(data.commercial.kpis.conversionRate)}`, '');
  if (data.selected.includes('cs') && data.cs) lines.push('CS / SUPORTE', `Tickets: ${data.cs.kpis.totalTickets}`, `Abertos: ${data.cs.kpis.openTickets}`, `Encerrados: ${data.cs.kpis.closedTickets}`, '');
  if (data.selected.includes('finance') && data.finance) lines.push('FINANCEIRO', `Titulos: ${data.finance.kpis.totalTitles}`, `Saldo aberto: ${formatCurrencyBRL(data.finance.kpis.balance)}`, `Saldo vencido: ${formatCurrencyBRL(data.finance.kpis.overdueBalance)}`);
  return lines;
}

export async function downloadAnalyticsPng(data: AnalyticsReportData) {
  const lines = reportLines(data);
  const width = 1400;
  const height = Math.max(520, 150 + lines.length * 34);
  const text = lines.map((line, index) => `<text x="70" y="${90 + index * 34}" class="${line && !line.includes(':') ? 'section' : 'body'}">${escapeHtml(line)}</text>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#ffffff"/><rect width="100%" height="12" fill="#2f6bff"/><style>.section{font:700 22px Arial;fill:#183b72}.body{font:16px Arial;fill:#102347}</style>${text}</svg>`;
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const image = new Image();
  image.src = url;
  await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error('Não foi possível renderizar o relatório PNG.')); });
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d')?.drawImage(image, 0, 0);
  const png = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  URL.revokeObjectURL(url);
  if (!png) throw new Error('Não foi possível gerar o arquivo PNG.');
  const downloadUrl = URL.createObjectURL(png);
  const anchor = document.createElement('a');
  anchor.href = downloadUrl;
  anchor.download = 'gso-relatorio-gerencial.png';
  anchor.click();
  URL.revokeObjectURL(downloadUrl);
}
