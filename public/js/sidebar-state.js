// Sidebar state utility (shared across Header and AnimatedSidebar)
// Exposes a global API under window.sidebarState
(function() {
  var MOBILE_QUERY = '(max-width: 1024px)';
  var STORAGE_KEY = 'sidebar-collapsed';

  function isMobile() {
    try { return window.matchMedia && window.matchMedia(MOBILE_QUERY).matches; } catch (e) { return false; }
  }

  function getState() {
    try {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(STORAGE_KEY) === 'true';
      }
    } catch (e) {}
    return false;
  }

  function saveState(isCollapsed) {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, isCollapsed ? 'true' : 'false');
      }
    } catch (e) {}
  }

  function applyStateImmediate(isCollapsed) {
    var sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;
    // Never apply collapsed visuals on mobile
    if (isMobile()) { isCollapsed = false; }
    if (isCollapsed) {
      document.documentElement.classList.add('sidebar-collapsed-global');
      document.documentElement.setAttribute('data-sidebar', 'collapsed');
      document.body.classList.add('sidebar-collapsed');
      sidebar.classList.add('sidebar-collapsed');
      sidebar.classList.remove('sidebar-animating', 'hiding-text');
    } else {
      document.documentElement.classList.remove('sidebar-collapsed-global');
      document.documentElement.setAttribute('data-sidebar', 'expanded');
      document.body.classList.remove('sidebar-collapsed');
      sidebar.classList.remove('sidebar-collapsed', 'sidebar-animating', 'hiding-text');
    }
  }

  function animateToState(isCollapsed) {
    var sidebar = document.querySelector('.sidebar');
    if (!sidebar) return applyStateImmediate(isCollapsed);
    // Never animate to collapsed on mobile
    if (isMobile()) { return applyStateImmediate(false); }
    sidebar.classList.add('sidebar-animating');
    if (isCollapsed) {
      sidebar.classList.add('hiding-text');
      setTimeout(function() {
        document.documentElement.classList.add('sidebar-collapsed-global');
        document.documentElement.setAttribute('data-sidebar', 'collapsed');
        document.body.classList.add('sidebar-collapsed');
        sidebar.classList.add('sidebar-collapsed');
      }, 120);
      setTimeout(function() { sidebar.classList.remove('sidebar-animating'); }, 360);
    } else {
      document.documentElement.classList.remove('sidebar-collapsed-global');
      document.documentElement.setAttribute('data-sidebar', 'expanded');
      document.body.classList.remove('sidebar-collapsed');
      sidebar.classList.remove('sidebar-collapsed');
      sidebar.classList.add('hiding-text');
      setTimeout(function() { sidebar.classList.remove('hiding-text'); }, 180);
      setTimeout(function() { sidebar.classList.remove('sidebar-animating'); }, 360);
    }
  }

  function init() {
    try {
      var sidebar = document.querySelector('.sidebar');
      var sidebarToggle = document.getElementById('sidebar-toggle');
      if (!sidebar || !sidebarToggle) return;

      // Prevent double init on the same element
      if (sidebar.dataset.initialized === 'true') {
        applyStateImmediate(getState());
        return;
      }
      sidebar.dataset.initialized = 'true';

      var collapsed = getState();
      if (isMobile()) { collapsed = false; }
      sidebarToggle.checked = collapsed;
      applyStateImmediate(collapsed);

      sidebarToggle.addEventListener('change', function() {
        var newState = this.checked;
        if (isMobile()) {
          this.checked = false;
          applyStateImmediate(false);
          // Preserve desktop preference but don't enforce collapse on mobile
          saveState(true);
          return;
        }
        animateToState(newState);
        saveState(newState);
      });
    } catch (e) {}
  }

  function applyInitialRootFlags() {
    try {
      var initialCollapsed = getState();
      var shouldCollapse = initialCollapsed && !isMobile();
      document.documentElement.classList.toggle('sidebar-collapsed-global', shouldCollapse);
      document.documentElement.setAttribute('data-sidebar', shouldCollapse ? 'collapsed' : 'expanded');
    } catch (e) {}
  }

  function handleBreakpointChanges() {
    try {
      var mq = window.matchMedia(MOBILE_QUERY);
      var mqHandler = function() {
        var toggle = document.getElementById('sidebar-toggle');
        if (!toggle) return;
        if (mq.matches) {
          toggle.checked = false;
          applyStateImmediate(false);
        } else {
          var collapsed = getState();
          toggle.checked = collapsed;
          applyStateImmediate(collapsed);
        }
      };
      if (typeof mq.addEventListener === 'function') mq.addEventListener('change', mqHandler);
      else if (typeof mq.addListener === 'function') mq.addListener(mqHandler);
    } catch (e) {}
  }

  window.sidebarState = {
    MOBILE_QUERY: MOBILE_QUERY,
    isMobile: isMobile,
    getState: getState,
    saveState: saveState,
    applyStateImmediate: applyStateImmediate,
    animateToState: animateToState,
    init: init,
    applyInitialRootFlags: applyInitialRootFlags,
    handleBreakpointChanges: handleBreakpointChanges,
  };
})();

