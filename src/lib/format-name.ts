/** Capitalize each word for display (e.g. "china" → "China", "mary jane" → "Mary Jane"). */
export function formatDisplayName(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      const lower = word.toLocaleLowerCase();
      return lower.charAt(0).toLocaleUpperCase() + lower.slice(1);
    })
    .join(" ");
}
