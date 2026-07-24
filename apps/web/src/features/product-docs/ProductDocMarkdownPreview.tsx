import type { ReactNode } from 'react';
import { cx } from '../../components/ui';

export interface ProductDocOutlineItem {
  id: string;
  level: 2 | 3;
  lineIndex: number;
  title: string;
}

const OPERATIONAL_TEXT_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bsource of truth\b/gi, 'fonte oficial'],
  [/\bread models?\b/gi, 'leituras governadas'],
  [/\bviews?\b/gi, 'leituras governadas'],
  [/\brpcs?\b/gi, 'acoes governadas'],
  [/\bbackend\b/gi, 'plataforma'],
  [/\bsupabase\b/gi, 'plataforma de dados'],
  [/\brls\b/gi, 'controle de acesso'],
  [/\bpayloads?\b/gi, 'dados protegidos'],
  [/\bmetadata\b/gi, 'contexto protegido'],
  [/\bmemberships?\b/gi, 'vinculos de acesso'],
  [/\bcontratos?\b/gi, 'acordos'],
  [/\btenant_id\b/gi, 'escopo do cliente'],
  [/\btenants?\b/gi, 'clientes'],
];

export function toOperationalDocumentText(value: string) {
  return OPERATIONAL_TEXT_REPLACEMENTS.reduce(
    (current, [pattern, replacement]) => current.replace(pattern, replacement),
    value,
  );
}

function slugifyHeading(value: string) {
  return toOperationalDocumentText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'secao';
}

function toUniqueHeadingId(title: string, usedIds: Map<string, number>) {
  const baseId = slugifyHeading(title);
  const count = usedIds.get(baseId) ?? 0;
  usedIds.set(baseId, count + 1);

  return count === 0 ? baseId : `${baseId}-${count + 1}`;
}

export function getProductDocOutline(source: string): ProductDocOutlineItem[] {
  const usedIds = new Map<string, number>();

  return source
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((rawLine, lineIndex): ProductDocOutlineItem | null => {
      const line = rawLine.trim();
      const level = line.startsWith('## ') ? 3 : line.startsWith('# ') ? 2 : null;

      if (!level) {
        return null;
      }

      const title = toOperationalDocumentText(line.replace(/^#{1,2}\s+/, '').trim());
      return {
        id: toUniqueHeadingId(title, usedIds),
        level,
        lineIndex,
        title,
      };
    })
    .filter((item): item is ProductDocOutlineItem => Boolean(item));
}

function parseInline(text: string): ReactNode[] {
  const displayText = toOperationalDocumentText(text);
  const parts: ReactNode[] = [];
  const pattern = /(`([^`]+)`|\*\*([^*]+)\*\*)/g;
  let lastIndex = 0;

  for (const match of displayText.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      parts.push(displayText.slice(lastIndex, index));
    }

    if (match[2]) {
      parts.push(
        <code
          className="rounded-md bg-[rgba(20,31,71,0.08)] px-1.5 py-0.5 font-mono text-[0.92em] text-[color:var(--color-ink)]"
          key={`${match[2]}-${index}`}
        >
          {match[2]}
        </code>,
      );
    } else if (match[3]) {
      parts.push(<strong key={`${match[3]}-${index}`}>{match[3]}</strong>);
    }

    lastIndex = index + match[0].length;
  }

  if (lastIndex < displayText.length) {
    parts.push(displayText.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [displayText];
}

export function ProductDocMarkdownPreview({
  headingIds,
  source,
}: {
  headingIds?: Map<number, string>;
  source: string;
}) {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const resolvedHeadingIds =
    headingIds ?? new Map(getProductDocOutline(source).map((item) => [item.lineIndex, item.id]));
  const blocks: ReactNode[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index] ?? '';
    const line = rawLine.trim();

    if (!line) {
      continue;
    }

    if (line.startsWith('# ')) {
      const headingId = resolvedHeadingIds.get(index);
      blocks.push(
        <h2
          className="text-[1.35rem] font-semibold tracking-[-0.035em] text-[color:var(--color-ink)]"
          id={headingId}
          key={`h1-${index}`}
        >
          {parseInline(line.replace(/^#\s+/, ''))}
        </h2>,
      );
      continue;
    }

    if (line.startsWith('## ')) {
      const headingId = resolvedHeadingIds.get(index);
      blocks.push(
        <h3
          className="pt-2 text-base font-semibold tracking-[-0.025em] text-[color:var(--color-ink)]"
          id={headingId}
          key={`h2-${index}`}
        >
          {parseInline(line.replace(/^##\s+/, ''))}
        </h3>,
      );
      continue;
    }

    if (line.startsWith('- ')) {
      const items: string[] = [];
      let listIndex = index;
      while ((lines[listIndex] ?? '').trim().startsWith('- ')) {
        items.push((lines[listIndex] ?? '').trim().replace(/^-\s+/, ''));
        listIndex += 1;
      }
      index = listIndex - 1;

      blocks.push(
        <ul
          className="grid min-w-0 max-w-[74ch] gap-2 break-words pl-5 text-sm leading-7 text-[color:var(--color-muted)] [overflow-wrap:anywhere]"
          key={`list-${index}`}
        >
          {items.map((item) => (
            <li className="min-w-0 list-disc" key={item}>
              {parseInline(item)}
            </li>
          ))}
        </ul>,
      );
      continue;
    }

    blocks.push(
      <p
        className={cx(
          'max-w-[74ch] text-sm leading-7 text-[color:var(--color-muted)]',
          'min-w-0 break-words [overflow-wrap:anywhere]',
          line.includes('[conteúdo interno restrito omitido]') &&
            'rounded-2xl border border-[color:var(--color-warning-border)] bg-[color:var(--color-warning-surface)] px-4 py-3 font-medium text-[color:var(--color-warning-ink)]',
        )}
        key={`p-${index}`}
      >
        {parseInline(line)}
      </p>,
    );
  }

  return <div className="space-y-4">{blocks}</div>;
}
