/**
 * download-tracker.ts - Track download events via GTM dataLayer
 *
 * Tracks file downloads by pushing events to Google Tag Manager's dataLayer.
 * Event data includes file name, extension, size, and page URL.
 *
 * Features:
 * - Automatic detection of download links (external files with extensions)
 * - GTM dataLayer integration for Google Analytics 4
 * - Extracts file metadata (name, extension, size, page)
 * - Graceful fallback if GTM is not available
 *
 * Events pushed to dataLayer:
 * {
 *   event: 'file_download',
 *   file_name: 'kalender-2026.cdr',
 *   file_extension: 'cdr',
 *   file_size: '1.08 MB',
 *   file_url: 'https://asset.erland.me/template/kalender-2026.cdr',
 *   download_page: '/download/template-kalender-2026'
 * }
 */

interface DownloadEventData {
  event: 'file_download';
  file_name: string;
  file_extension: string;
  file_size?: string;
  file_url: string;
  download_page: string;
}

interface GTMDataLayer {
  push(data: DownloadEventData | Record<string, unknown>): void;
}

interface WindowWithDataLayer extends Window {
  dataLayer?: GTMDataLayer;
}

/**
 * Check if GTM dataLayer is available
 */
function hasDataLayer(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof (window as WindowWithDataLayer).dataLayer !== 'undefined'
  );
}

/**
 * Push download event to GTM dataLayer
 */
function pushDownloadEvent(data: DownloadEventData): void {
  if (!hasDataLayer()) {
    console.warn('[Download Tracker] GTM dataLayer not available');
    return;
  }

  try {
    const w = window as WindowWithDataLayer;
    w.dataLayer?.push(data);
    console.log('[Download Tracker] Event pushed:', data);
  } catch (error) {
    console.error('[Download Tracker] Failed to push event:', error);
  }
}

/**
 * Extract file extension from URL
 */
function getFileExtension(url: string): string {
  try {
    const pathname = new URL(url, window.location.href).pathname;
    const filename = pathname.split('/').pop() || '';
    const parts = filename.split('.');
    if (parts.length > 1) {
      const ext = parts.pop();
      return ext ? ext.toLowerCase() : 'unknown';
    }
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

/**
 * Extract file name from URL
 */
function getFileName(url: string): string {
  try {
    const pathname = new URL(url, window.location.href).pathname;
    return pathname.split('/').pop() || 'unknown';
  } catch {
    return 'unknown';
  }
}

/**
 * Extract file size from table cell (if available)
 */
function getFileSize(link: HTMLAnchorElement): string | undefined {
  // Try to find size in the same row (for download tables)
  const row = link.closest('tr');
  if (row) {
    const cells = row.querySelectorAll('td');
    // Look for cell with data-label="Size"
    for (const cell of cells) {
      const label = cell.getAttribute('data-label');
      if (label === 'Size') {
        return cell.textContent?.trim() || undefined;
      }
    }
  }
  return undefined;
}

/**
 * Get current page path for tracking
 */
function getCurrentPage(): string {
  return window.location.pathname;
}

/**
 * Check if link is a download link (external file)
 */
function isDownloadLink(link: HTMLAnchorElement): boolean {
  const href = link.getAttribute('href') || '';

  // Must have href
  if (!href) return false;

  // Skip internal navigation links
  if (href.startsWith('#')) return false;

  // Check for download attribute
  if (link.hasAttribute('download')) return true;

  // Check for common file extensions
  const extension = getFileExtension(href);
  const downloadExtensions = [
    'zip',
    'rar',
    '7z',
    'pdf',
    'doc',
    'docx',
    'xls',
    'xlsx',
    'ppt',
    'pptx',
    'ai',
    'cdr',
    'psd',
    'eps',
    'svg',
    'png',
    'jpg',
    'jpeg',
    'gif',
    'webp',
    'mp4',
    'mp3',
    'wav',
    'avi',
    'mov',
  ];

  return downloadExtensions.includes(extension);
}

/**
 * Handle download link click
 */
function handleDownloadClick(event: MouseEvent): void {
  const link = event.currentTarget as HTMLAnchorElement;
  const href = link.getAttribute('href') || '';

  if (!href) return;

  const eventData: DownloadEventData = {
    event: 'file_download',
    file_name: getFileName(href),
    file_extension: getFileExtension(href),
    file_size: getFileSize(link),
    file_url: href,
    download_page: getCurrentPage(),
  };

  pushDownloadEvent(eventData);
}

/**
 * Initialize download tracking on all download links
 */
export function initDownloadTracking(): void {
  // Skip if GTM is not available
  if (!hasDataLayer()) {
    console.warn(
      '[Download Tracker] GTM dataLayer not available, skipping initialization'
    );
    return;
  }

  // Find all download links
  const links = document.querySelectorAll('a');
  let trackedCount = 0;

  links.forEach(link => {
    // Skip if already tracked
    if (link.hasAttribute('data-download-tracked')) return;

    // Check if it's a download link
    if (isDownloadLink(link)) {
      link.addEventListener('click', handleDownloadClick);
      link.setAttribute('data-download-tracked', 'true');
      trackedCount++;
    }
  });

  if (trackedCount > 0) {
    console.log(
      `[Download Tracker] Initialized tracking on ${trackedCount} download links`
    );
  }
}

/**
 * Auto-init when module is imported
 */
export function autoInit(): void {
  initDownloadTracking();
}
