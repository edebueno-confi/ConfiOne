const CP1252_BYTES = new Map([
  ['€', 0x80], ['‚', 0x82], ['ƒ', 0x83], ['„', 0x84], ['…', 0x85],
  ['†', 0x86], ['‡', 0x87], ['ˆ', 0x88], ['‰', 0x89], ['Š', 0x8a],
  ['‹', 0x8b], ['Œ', 0x8c], ['Ž', 0x8e], ['‘', 0x91], ['’', 0x92],
  ['“', 0x93], ['”', 0x94], ['•', 0x95], ['–', 0x96], ['—', 0x97],
  ['˜', 0x98], ['™', 0x99], ['š', 0x9a], ['›', 0x9b], ['œ', 0x9c],
  ['ž', 0x9e], ['Ÿ', 0x9f],
]);

function mojibakeScore(value) {
  return (String(value ?? '').match(/[ÃÂâð]/g) ?? []).length;
}

function decodeLegacyFragment(fragment) {
  const bytes = [];
  for (const character of fragment) {
    const codePoint = character.codePointAt(0);
    if (CP1252_BYTES.has(character)) {
      bytes.push(CP1252_BYTES.get(character));
    } else if (codePoint <= 0xff) {
      bytes.push(codePoint);
    } else {
      return null;
    }
  }

  const repaired = Buffer.from(bytes).toString('utf8');
  return repaired.includes('�') ? null : repaired;
}

function repairOnce(value) {
  return String(value ?? '').replace(
    /(?:Ã.|Â.)+|â(?:[€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ\u0080-\u00ff]){2}|ð(?:[€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ\u0080-\u00ff]){3}/g,
    (fragment) => {
      return decodeLegacyFragment(fragment) ?? fragment;
    },
  );
}

export function repairMojibake(value) {
  let current = String(value ?? '');

  for (let pass = 0; pass < 3; pass += 1) {
    const repaired = repairOnce(current);
    if (repaired === current || mojibakeScore(repaired) >= mojibakeScore(current)) {
      break;
    }
    current = repaired;
  }

  return current;
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
