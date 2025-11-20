/**
 * Convert Markdown content into plain text for search indexing.
 * @param {string | null | undefined} md
 * @returns {string}
 */
export function markdownToPlainText(md) {
  if (!md) return '';
  let txt = String(md);
  txt = txt.replace(/```[\s\S]*?```/g, '');
  txt = txt.replace(/<[^>]+>/g, '');
  txt = txt.replace(/!\[[^\]]*\]\([^)]+\)/g, '');
  txt = txt.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  txt = txt.replace(/^#{1,6}\s+/gm, '');
  txt = txt.replace(/[*_~`]/g, '');
  txt = txt.replace(/\r/g, '');
  txt = txt.replace(/\t/g, ' ');
  txt = txt.replace(/[ ]{2,}/g, ' ');
  txt = txt.replace(/\n{3,}/g, '\n\n');
  return txt.trim();
}

/**
 * Produce a short summary by taking the first paragraph within a character limit.
 * @param {string} text
 * @param {number} [maxChars=280]
 * @returns {string}
 */
export function summarize(text, maxChars = 280) {
  const normalized = typeof text === 'string' ? text.trim() : '';
  if (!normalized) return '';
  if (normalized.length <= maxChars) return normalized;
  const paragraphs = normalized
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(Boolean);
  const first = paragraphs[0] || normalized;
  if (first.length <= maxChars) return first;
  return `${first.slice(0, maxChars).trimEnd()}…`;
}
