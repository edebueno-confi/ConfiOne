export function buildHelpCenterCategoryHref(
  spaceSlug: string,
  categoryId: string | null | undefined,
  query: string,
): string {
  const basePath = `/help/${encodeURIComponent(spaceSlug)}/articles`;
  if (categoryId) return `${basePath}?category=${encodeURIComponent(categoryId)}`;
  return `${basePath}?q=${encodeURIComponent(query)}`;
}
