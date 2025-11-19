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
 * - Only active in production with GTM configured
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

import { GTM_ID } from './env';

/**
 * GTM dataLayer event structure for file downloads
 * Pushed to window.dataLayer for Google Analytics 4 tracking
 */
interface DownloadEventData {
  event: 'file_download';
  file_name: string;
  file_extension: string;
  file_size?: string;
  file_url: string;
  download_page: string;
}

/**
 * GTM dataLayer API interface
 */
interface GTMDataLayer {
  push(data: DownloadEventData | Record<string, unknown>): void;
}

/**
 * Window extended with GTM dataLayer
 */
interface WindowWithDataLayer extends Window {
  dataLayer?: GTMDataLayer;
}

/**
 * Check if GTM dataLayer is available
 * @returns True if window.dataLayer exists
 */
function hasDataLayer(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof (window as WindowWithDataLayer).dataLayer !== 'undefined'
  );
}

/**
 * Push download event to GTM dataLayer
 * Logs event data in console for debugging
 * @param data - Download event data to push
 */
function pushDownloadEvent(data: DownloadEventData): void {
  if (!hasDataLayer()) return;

  try {
    const w = window as WindowWithDataLayer;
    w.dataLayer?.push(data);
  } catch {
    // Silent fail
  }
}

/**
 * Extract file extension from URL
 * @param url - File URL (absolute or relative)
 * @returns Lowercase file extension or 'unknown'
 * @example
 * getFileExtension('https://example.com/file.PDF') // 'pdf'
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
 * @param url - File URL (absolute or relative)
 * @returns File name from URL path or 'unknown'
 * @example
 * getFileName('https://example.com/assets/file.zip') // 'file.zip'
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
 * Looks for table cell with data-label="Size" in same row as link
 * @param link - Download link element
 * @returns Human-readable file size (e.g., '1.08 MB') or undefined
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
 * @returns Current pathname (e.g., '/blog/post-slug')
 */
function getCurrentPage(): string {
  return window.location.pathname;
}

/**
 * Check if link is a download link (external file)
 * Checks for download attribute or common file extensions
 * @param link - Anchor element to check
 * @returns True if link points to downloadable file
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
 * Extracts file metadata and pushes event to GTM dataLayer
 * @param event - Mouse click event
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
 * Attaches click handlers to links with downloadable file extensions
 * Safe to call multiple times - skips already-tracked links
 * Only active in production environment with GTM configured
 * @example
 * // Initialize after page load or navigation
 * initDownloadTracking();
 */
export function initDownloadTracking(): void {
  // Skip if not production environment
  if (!import.meta.env.PROD) {
    return;
  }

  // Skip if GTM is not configured
  if (!GTM_ID || GTM_ID.trim() === '') {
    return;
  }

  // Skip if GTM dataLayer is not available
  if (!hasDataLayer()) return;

  // Find all download links
  const links = document.querySelectorAll('a');

  links.forEach(link => {
    // Skip if already tracked
    if (link.hasAttribute('data-download-tracked')) return;

    // Check if it's a download link
    if (isDownloadLink(link)) {
      link.addEventListener('click', handleDownloadClick);
      link.setAttribute('data-download-tracked', 'true');
    }
  });
}

/**
 * Auto-initialization entry point
 * Called by ui-init.ts gate system when download links are detected
 */
export function autoInit(): void {
  initDownloadTracking();
}
