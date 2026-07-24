export function repairMojibake(value) {
  const source = String(value ?? '');
  return source.replace(/(?:Ã.|Â.)+/g, (fragment) => {
    try {
      const repaired = Buffer.from(fragment, 'latin1').toString('utf8');
      return repaired.includes('�') ? fragment : repaired;
    } catch {
      return fragment;
    }
  });
}

export function stripLegacySupportContacts(value) {
  return String(value ?? '')
    .replace(/(^|\n)[ \t]*em caso de d(?:Ãº|u)vidas[^\n]*(?:\n[ \t]*(?:whatsapp|e-?mail)\s*:\s*[^\n]*){0,2}/gim, '$1')
    .replace(/(^|\n)[ \t]*\*{0,2}[ \t]*(?:whatsapp|e-?mail)\s*:\s*\*{0,2}[^\n]*/gim, '$1')
    .replace(/,?\s*(?:whats?app|e-?mail)\s*[:\-]?\s*(?:\+?55\s*)?\(?\d{2}\)?\s*\d{4,5}[-\s]?\d{4}(?:\s+e-?mail)?(?:\s*\*{1,2})?/gi, '')
    .replace(/\s+e-?mail\.?$/gim, '.')
    .replace(/\s+e\.$/gim, '.')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
