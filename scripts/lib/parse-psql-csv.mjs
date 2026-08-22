export function parseCsvRows(csv) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < csv.length; index += 1) {
    const character = csv[index];
    if (quoted) {
      if (character === '"' && csv[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ',') {
      row.push(field);
      field = '';
    } else if (character === '\n') {
      row.push(field.endsWith('\r') ? field.slice(0, -1) : field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += character;
    }
  }

  if (field || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

export function parseCsvValue(value) {
  if (value === '\\N') return null;
  if (value === 'true' || value === 'false') return value === 'true';
  if (/^-?\d+(?:\.\d+)?$/.test(value)) return Number(value);
  return value;
}

export function parsePsqlCsvResult(csv) {
  const csvRows = parseCsvRows(csv.trim());
  const headers = csvRows.shift() ?? [];
  const rows = headers.length > 0 && headers.some(Boolean)
    ? csvRows.map((values) => Object.fromEntries(
      headers.map((header, index) => [header, parseCsvValue(values[index] ?? '')]),
    ))
    : [];

  return { rows };
}
