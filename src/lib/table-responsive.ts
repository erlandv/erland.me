/**
 * Makes tables responsive by adding data-label attributes to cells
 * This enables mobile-friendly vertical layout
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
