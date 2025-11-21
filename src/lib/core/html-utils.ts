/**
 * HTML Utility Functions
 * String-based implementations safe for both browser and Node.js environments
 */

/**
 * Escape HTML special characters using string replacement
 * Safe for both browser and Node.js (build-time) contexts
 *
 * @param value - Value to escape (will be converted to string)
 * @returns HTML-safe escaped string
 *
 * @example
 * escapeHtml('1 < 2 && 3 > 1') // '1 &lt; 2 &amp;&amp; 3 &gt; 1'
 * escapeHtml('AT&T') // 'AT&amp;T'
 * escapeHtml('<script>alert("xss")</script>') // '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
 */
export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
