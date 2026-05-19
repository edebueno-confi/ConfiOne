import type { ReactNode } from 'react';
import { cx } from '../../components/ui';

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

export function ProductDocMarkdownPreview({ source }: { source: string }) {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const blocks: ReactNode[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index] ?? '';
    const line = rawLine.trim();

    if (!line) {
      continue;
    }

    if (line.startsWith('# ')) {
      blocks.push(
        <h2
          className="text-[1.35rem] font-semibold tracking-[-0.035em] text-[color:var(--color-ink)]"
          key={`h1-${index}`}
        >
          {parseInline(line.replace(/^#\s+/, ''))}
        </h2>,
      );
      continue;
    }

    if (line.startsWith('## ')) {
      blocks.push(
        <h3
          className="pt-2 text-base font-semibold tracking-[-0.025em] text-[color:var(--color-ink)]"
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
