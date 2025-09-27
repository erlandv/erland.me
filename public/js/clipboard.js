(function () {
  if (typeof window === 'undefined') return;
  if (window.copyToClipboard && typeof window.copyToClipboard === 'function')
    return;
  window.copyToClipboard = async function (text) {
    try {
      if (
        typeof navigator !== 'undefined' &&
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === 'function'
      ) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (e) {
      /* continue to fallback */
    }
    try {
      if (typeof document === 'undefined') return false;
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '0';
      ta.style.left = '-9999px';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      var exec = document && document['execCommand'];
      var ok =
        typeof exec === 'function' ? !!exec.call(document, 'copy') : false;
      document.body.removeChild(ta);
      return ok;
    } catch (e) {
      return false;
    }
  };
})();
