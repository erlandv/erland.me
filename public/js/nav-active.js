// Consolidated navigation active-state sync and sidebar state lifecycle
// Depends on public/js/sidebar-state.js exposing window.sidebarState
(function () {
  function normalizePath(p) {
    try {
      if (!p) return '/';
      return p.endsWith('/') ? p : p + '/';
    } catch (e) {
      return '/';
    }
  }

  function closeMobileMenu() {
    try {
      var toggle = document.getElementById('nav-toggle');
      if (!toggle) return;
      if (toggle.checked) {
        toggle.checked = false;
        var btn = document.querySelector('.navbar-icon-button');
        if (btn && typeof btn.blur === 'function') btn.blur();
      }
    } catch (e) {}
  }

  function updateActiveNav() {
    try {
      var links = document.querySelectorAll(
        '.sidebar .nav-link-container[href]'
      );
      if (!links || !links.length) return;
      var current = normalizePath(window.location.pathname);
      var best = null;
      var bestLen = -1;

      links.forEach(function (link) {
        try {
          var hrefAttr = link.getAttribute('href') || '';
          var hrefPath = normalizePath(
            new URL(hrefAttr, window.location.origin).pathname
          );
          if (current === '/' && hrefPath === '/') {
            if (hrefPath.length > bestLen) {
              best = link;
              bestLen = hrefPath.length;
            }
          } else if (hrefPath !== '/' && current.startsWith(hrefPath)) {
            if (hrefPath.length > bestLen) {
              best = link;
              bestLen = hrefPath.length;
            }
          }
        } catch (e) {}
      });

      links.forEach(function (link) {
        link.classList.remove('w--current');
        link.removeAttribute('aria-current');
      });
      if (best) {
        best.classList.add('w--current');
        best.setAttribute('aria-current', 'page');
      }
    } catch (e) {}
  }

  function attachNavClickHandlers() {
    try {
      var links = document.querySelectorAll(
        '.sidebar .nav-link-container[href]'
      );
      if (!links || !links.length) return;
      links.forEach(function (link) {
        if (link.dataset.navActiveBound === 'true') return;
        link.dataset.navActiveBound = 'true';
        link.addEventListener(
          'click',
          function (ev) {
            try {
              if (ev.defaultPrevented) return;
              if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
              var hrefAttr = link.getAttribute('href') || '';
              var targetUrl = new URL(hrefAttr, window.location.origin);
              if (targetUrl.origin !== window.location.origin) return;

              closeMobileMenu();
              var all = document.querySelectorAll(
                '.sidebar .nav-link-container[href]'
              );
              all.forEach(function (a) {
                a.classList.remove('w--current');
                a.removeAttribute('aria-current');
              });
              link.classList.add('w--current');
              link.setAttribute('aria-current', 'page');
              setTimeout(updateActiveNav, 0);
            } catch (e) {}
          },
          { passive: true }
        );
      });
    } catch (e) {}
  }

  function initSidebarState() {
    try {
      if (!window.sidebarState) return;
      // Apply root flags ASAP (before paint)
      if (typeof window.sidebarState.applyInitialRootFlags === 'function') {
        window.sidebarState.applyInitialRootFlags();
      }

      function initAll() {
        try {
          if (typeof window.sidebarState.init === 'function') {
            window.sidebarState.init();
          }
          if (
            typeof window.sidebarState.handleBreakpointChanges === 'function'
          ) {
            window.sidebarState.handleBreakpointChanges();
          }
        } catch (e) {}
      }

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAll);
      } else {
        initAll();
      }
      window.addEventListener('astro:page-load', initAll);
      window.addEventListener('astro:after-swap', initAll);
    } catch (e) {}
  }

  function installNavSyncHooks() {
    try {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
          closeMobileMenu();
          updateActiveNav();
          attachNavClickHandlers();
        });
      } else {
        closeMobileMenu();
        updateActiveNav();
        attachNavClickHandlers();
      }

      try {
        var _push = history.pushState && history.pushState.bind(history);
        if (_push) {
          history.pushState = function () {
            var r = _push.apply(history, arguments);
            try {
              queueMicrotask(function () {
                closeMobileMenu();
                updateActiveNav();
              });
            } catch (e) {}
            return r;
          };
        }
        var _replace =
          history.replaceState && history.replaceState.bind(history);
        if (_replace) {
          history.replaceState = function () {
            var r = _replace.apply(history, arguments);
            try {
              queueMicrotask(function () {
                closeMobileMenu();
                updateActiveNav();
              });
            } catch (e) {}
            return r;
          };
        }
      } catch (e) {}

      window.addEventListener('popstate', function () {
        closeMobileMenu();
        updateActiveNav();
      });
      window.addEventListener('astro:before-swap', closeMobileMenu);
      window.addEventListener('astro:page-load', function () {
        closeMobileMenu();
        updateActiveNav();
        attachNavClickHandlers();
      });
      window.addEventListener('astro:after-swap', function () {
        closeMobileMenu();
        updateActiveNav();
        attachNavClickHandlers();
      });

      // MutationObserver fallback: trigger on content swaps
      try {
        if (!window.__navActiveSyncObserver) {
          var target = document.querySelector('.content') || document.body;
          var obs = new MutationObserver(function () {
            try {
              updateActiveNav();
            } catch (e) {}
          });
          obs.observe(target, { childList: true, subtree: true });
          window.__navActiveSyncObserver = obs;
        }
      } catch (e) {}
    } catch (e) {}
  }

  // Init
  initSidebarState();
  installNavSyncHooks();
})();
