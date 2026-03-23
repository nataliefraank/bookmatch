/** Stable lowercase key for deduping title+author across Open Library and swipes. */
export function bookKey(title: string, author: string): string {
  return `${title.trim()}::${author.trim()}`.toLowerCase();
}
