/**
 * Responsive Table Enhancement
 *
 * Injects `data-label` attributes to table cells for mobile vertical layout.
 * CSS uses these labels to display column headers inline with cell content on small screens.
 *
 * **Mobile Layout Pattern:**
 * Desktop: Standard table with columns
 * Mobile (≤767px): Each cell becomes a block with label::before pseudo-element
 *
 * **CSS Integration:**
 * ```css
 * @media (max-width: 767px) {
 *   td::before {
 *     content: attr(data-label);
 *     font-weight: bold;
 *   }
 * }
 * ```
 *
 * **Critical Requirement:**
 * Must re-run on every Astro navigation to handle dynamically loaded tables.
 * See `ui-init.ts` for reinit pattern with cached module but always-execute initializer.
 *
 * **Usage:**
 * ```typescript
 * import { initResponsiveTables } from './table-responsive';
 *
 * // Call after content loads or navigation
 * initResponsiveTables();
 * ```
 */

/**
 * Add data-label attributes to all table cells based on header text
 * Processes all tables with `.prose` parent for markdown content
 * Safe to call multiple times - overwrites existing data-label attributes
 * @example
 * // After dynamic content injection
 * initResponsiveTables();
 */
export function initResponsiveTables(): void {
  const tables = document.querySelectorAll('.prose table');

  tables.forEach(table => {
    const headers: string[] = [];
    const headerCells = table.querySelectorAll('thead th');

    // Collect header text
    headerCells.forEach(th => {
      headers.push(th.textContent?.trim() || '');
    });

    // Add data-label to each td
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      cells.forEach((cell, index) => {
        if (headers[index]) {
          cell.setAttribute('data-label', headers[index]);
        }
      });
    });
  });
}
