import type { ReactNode } from 'react';
import { cx } from '../../components/ui';

export interface ProductDocOutlineItem {
  id: string;
  level: 2 | 3;
  lineIndex: number;
  title: string;
}

function slugifyHeading(value: string) {
  return value
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

      const title = line.replace(/^#{1,2}\s+/, '').trim();
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
  const parts: ReactNode[] = [];
  const pattern = /(`([^`]+)`|\*\*([^*]+)\*\*)/g;
  let lastIndex = 0;

  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      parts.push(text.slice(lastIndex, index));
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

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
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
          className="grid max-w-[74ch] gap-2 pl-5 text-sm leading-7 text-[color:var(--color-muted)]"
          key={`list-${index}`}
        >
          {items.map((item) => (
            <li className="list-disc" key={item}>
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
