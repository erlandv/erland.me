/**
 * Copy arbitrary text to the clipboard with a robust fallback.
 *
 * **Strategy:**
 * 1. Prefers modern `navigator.clipboard.writeText` API when available
 * 2. Falls back to legacy `document.execCommand('copy')` for older browsers
 *
 * **Fallback Implementation:**
 * - Creates hidden textarea element
 * - Copies text content via execCommand
 * - Cleans up temporary element
 *
 * @param text - Text content to copy to clipboard
 * @returns Promise resolving to true if copy succeeded, false otherwise
 * @example
 * const success = await copyToClipboard('Hello world!');
 * if (success) {
 *   showToast('Copied!');
 * }
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (
      typeof navigator !== 'undefined' &&
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === 'function'
    ) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to fallback below
  }

  // Fallback for older browsers or restricted contexts
  try {
    if (typeof document === 'undefined') return false;

    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '0';
    ta.style.left = '-9999px';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();

    // Avoid TS deprecation hint by accessing execCommand safely
    interface DocumentWithExecCommand {
      execCommand?(command: string): boolean;
    }
    const docWithExec = document as unknown as DocumentWithExecCommand;
    const exec = docWithExec.execCommand;
    const ok =
      typeof exec === 'function' ? !!exec.call(document, 'copy') : false;
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

// Optional: expose as a browser global for compatibility with any
// non-module scripts that might expect `window.copyToClipboard`.
declare global {
  interface Window {
    copyToClipboard?: (text: string) => Promise<boolean>;
  }
}

if (typeof window !== 'undefined') {
  const w = window as Window;
  if (typeof w.copyToClipboard !== 'function') {
    w.copyToClipboard = copyToClipboard;
  }
}
