/**
 * Remark Plugin for Download Files Table Generation
 *
 * Transforms `:::downloadFiles` or `:::download-files` container directives
 * into responsive HTML tables with download links from frontmatter data.
 *
 * **Features:**
 * - Auto-generates table from frontmatter `downloadFiles` array
 * - Responsive table with data-label attributes for mobile vertical layout
 * - Optional size column (shown only if any file has size data)
 * - Optional note text below table
 * - Safe HTML escaping for all user content
 *
 * **Frontmatter Structure:**
 * ```yaml
 * downloadFiles:
 *   - label: "Main Package"
 *     href: "/downloads/package.zip"
 *     size: "2.5 MB"
 *   - label: "Source Code"
 *     href: "/downloads/source.zip"
 * ```
 *
 * **Markdown Usage:**
 * ```markdown
 * :::downloadFiles
 * note: "All files are safe and virus-scanned"
 * :::
 * ```
 *
 * **HTML Output:**
 * ```html
 * <section class="download-files" id="download-files-section">
 *   <table class="download-files-table">
 *     <thead>
 *       <tr>
 *         <th scope="col">File Name</th>
 *         <th scope="col">Size</th>
 *         <th scope="col">Link</th>
 *       </tr>
 *     </thead>
 *     <tbody>
 *       <tr>
 *         <td data-label="File Name">Main Package</td>
 *         <td data-label="Size">2.5 MB</td>
 *         <td data-label="Download">
 *           <a class="download-files-link" href="/downloads/package.zip" rel="noopener" target="_blank" download>
 *             Download
 *           </a>
 *         </td>
 *       </tr>
 *     </tbody>
 *   </table>
 *   <p class="download-files-note">All files are safe and virus-scanned</p>
 * </section>
 * ```
 */

import type { Root } from 'mdast';
import type { ContainerDirective } from 'mdast-util-directive';
import { visit, CONTINUE, SKIP } from 'unist-util-visit';
import { escapeHtml } from '../../core/html-utils.js';

interface VFile {
  data?: {
    astro?: {
      frontmatter?: Record<string, unknown>;
    };
  };
}

/**
 * Escape HTML attribute value with additional backtick escaping
 * Safe for use in href and other HTML attributes
 * @param value - Value to escape for attribute context
 * @returns Attribute-safe string
 */
function escapeAttribute(value: unknown): string {
  return escapeHtml(String(value ?? '')).replace(/`/g, '&#96;');
}

type DownloadLink = { label?: string; href?: string; size?: string };

/**
 * Build responsive HTML table from download items
 * Conditionally shows size column only if any item has size data
 * Includes data-label attributes for mobile vertical layout
 * @param items - Array of download links with label, href, and optional size
 * @param note - Optional note text to display below table
 * @returns Complete HTML string for download section
 */
function buildTableHtml(items: DownloadLink[], note?: string) {
  const hasSize = items.some(item => Boolean(item.size));
  const rows = items
    .map(item => {
      const href = escapeAttribute(item.href ?? '#');
      const label = escapeHtml(item.label ?? item.href ?? 'Download');
      const size = escapeHtml(item.size ?? '-');
      return `
        <tr>
          <td data-label="File Name">${label}</td>
          ${
            hasSize
              ? `<td data-label="Size">${item.size ? size : '-'}</td>`
              : ''
          }
          <td data-label="Download">
            <a href="${href}" rel="noopener" target="_blank" download>
              Download
            </a>
          </td>
        </tr>`;
    })
    .join('');

  return `
    <section class="download-files" id="download-files-section">
      <table>
        <thead>
          <tr>
            <th scope="col">File Name</th>
            ${hasSize ? '<th scope="col">Size</th>' : ''}
            <th scope="col">Link</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
      ${note ? `<p class="download-files-note">${escapeHtml(note)}</p>` : ''}
    </section>
  `;
}

/**
 * Remark plugin to generate download files tables from frontmatter
 *
 * Transforms container directives (:::downloadFiles or :::download-files) into
 * responsive HTML tables with download links sourced from frontmatter data.
 *
 * Validates directive name, reads frontmatter, and generates structured table.
 * Shows helpful message if frontmatter is missing downloadFiles array.
 *
 * @returns Remark transformer function
 */
export default function remarkDownloadFiles() {
  return (tree: Root, file: VFile) => {
    const frontmatter = (file.data?.astro && file.data.astro.frontmatter) || {};
    const downloads: DownloadLink[] = Array.isArray(frontmatter.downloadFiles)
      ? frontmatter.downloadFiles
      : [];

    visit(tree, 'containerDirective', (node, index, parent) => {
      if (!parent || typeof index !== 'number') {
        return CONTINUE;
      }

      const directive = node as ContainerDirective;
      const directiveName = directive.name || '';
      if (!['downloadFiles', 'download-files'].includes(directiveName)) {
        return CONTINUE;
      }

      const attrs = (directive.attributes ?? {}) as Record<string, unknown>;
      const note =
        typeof attrs.note === 'string' && attrs.note.trim().length > 0
          ? attrs.note
          : undefined;

      if (!downloads.length) {
        parent.children.splice(index, 1, {
          type: 'paragraph',
          children: [
            {
              type: 'text',
              value:
                'Download list belum disediakan. Tambahkan `downloadFiles` pada frontmatter untuk menampilkan tabel.',
            },
          ],
        });
        return SKIP;
      }

      parent.children.splice(index, 1, {
        type: 'html',
        value: buildTableHtml(downloads, note),
      });
      return SKIP;
    });
  };
}
