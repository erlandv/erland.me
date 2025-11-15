import type { Root } from 'mdast';
import type { ContainerDirective } from 'mdast-util-directive';
import { visit, CONTINUE, SKIP } from 'unist-util-visit';

interface VFile {
  data?: {
    astro?: {
      frontmatter?: Record<string, unknown>;
    };
  };
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttribute(value: unknown): string {
  return escapeHtml(value).replace(/`/g, '&#96;');
}

type DownloadLink = { label?: string; href?: string; size?: string };

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
            <a class="download-files-link" href="${href}" rel="noopener" target="_blank" download>
              Download
            </a>
          </td>
        </tr>`;
    })
    .join('');

  return `
    <section class="download-files" id="download-files-section">
      <table class="download-files-table">
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
