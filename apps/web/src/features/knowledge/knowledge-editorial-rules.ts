export const KNOWLEDGE_SUMMARY_LIMIT = 320;

export type KnowledgeSaveMode = 'create' | 'draft' | 'editorial-revision';

export function resolveKnowledgeSaveMode(input: {
  articleId?: string | null;
  articleStatus?: string | null;
  isEditorialRevision: boolean;
}): KnowledgeSaveMode {
  if (!input.articleId) {
    return 'create';
  }

  if (input.isEditorialRevision || input.articleStatus === 'published') {
    return 'editorial-revision';
  }

  return 'draft';
}
