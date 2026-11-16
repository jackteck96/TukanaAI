/** Null means a legacy process; an empty array is an explicit empty selection. */
export function explicitDocumentSelection(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  return [...new Set(value.filter((name): name is string => typeof name === 'string').map(name => name.trim()).filter(Boolean))];
}