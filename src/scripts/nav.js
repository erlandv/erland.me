export function setupNav() {
  const navButton = document.querySelector('.navbar-icon-button');
  const navMenu = document.querySelector('.w-nav-menu');

  if (!navButton || !navMenu) return;

  const toggleNav = () => {
    const isOpen = navMenu.classList.contains('is-open');

    if (isOpen) {
      // Closing: first remove `is-open` to animate, then hide with `is-visible` after transition
      navMenu.classList.remove('is-open');
      setTimeout(() => {
        navMenu.classList.remove('is-visible');
      }, 260); // keep in sync with CSS transition (250ms)
    } else {
      // Opening: make visible then allow a frame before adding `is-open` to trigger transition
      navMenu.classList.add('is-visible');
      // Use rAF for reliable transition start across browsers
      requestAnimationFrame(() => navMenu.classList.add('is-open'));
    }
  };

  navButton.addEventListener('click', toggleNav);
  return () => navButton.removeEventListener('click', toggleNav);
}
