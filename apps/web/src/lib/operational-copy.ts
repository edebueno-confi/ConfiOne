export function sanitizeOperationalVisibleText(
  value: string | null | undefined,
  fallback = 'Indisponivel',
) {
  return (value ?? fallback)
    .replace(/\bfixture local sanitizada\b/gi, 'registro operacional')
    .replace(/\bfixture\b/gi, 'registro operacional')
    .replace(/\btenant\b/gi, 'cliente')
    .replace(/\bbackend\b/gi, 'operacao')
    .replace(/\bprovider\b/gi, 'servico externo')
    .replace(/\bcontratos?\b/gi, 'acordos operacionais')
    .replace(/\bRPCs?\b/g, 'processo operacional')
    .replace(/\bRLS\b/g, 'regra de acesso')
    .replace(/\bpayload\b/gi, 'conteudo tecnico')
    .replace(/\bmetadata\b/gi, 'detalhes operacionais')
    .replace(/\bstack trace\b/gi, 'detalhe tecnico protegido');
}

export function truncateOperationalVisibleText(
  value: string | null | undefined,
  maxLength = 320,
  fallback = 'Indisponivel',
) {
  const sanitized = sanitizeOperationalVisibleText(value, fallback);

  return sanitized.length > maxLength
    ? `${sanitized.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`
    : sanitized;
}
