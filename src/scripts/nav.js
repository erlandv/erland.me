export function setupNav() {
  const navButton = document.querySelector('.navbar-icon-button');
  const navMenu = document.querySelector('.w-nav-menu');
  const iconElement = navButton?.querySelector('.navbar-icon');

  if (!navButton || !navMenu || !iconElement) return;

  // Cache for loaded icons
  let menuIconSVG = null;
  let closeIconSVG = null;

  // Load icons asynchronously
  const loadIcons = async () => {
    try {
      const [menuModule, closeModule] = await Promise.all([
        import('../icons/menu.svg?raw'),
        import('../icons/close.svg?raw')
      ]);
      menuIconSVG = menuModule.default;
      closeIconSVG = closeModule.default;
      
      // Initialize with menu icon
      updateIconElement('menu', menuIconSVG);
    } catch (error) {
      console.error('Failed to load icons:', error);
    }
  };

  // Helper function to update icon element
  const updateIconElement = (iconType, svgContent) => {
    if (!svgContent) return;
    
    // Normalize SVG content (similar to Icon.astro)
    const normalizedSVG = svgContent
      .replace(/<\?xml[\s\S]*?\?>/g, "")
      .replace(/<!--([\s\S]*?)-->/g, "")
      .replace(/<style[\s\S]*?<\/style>/g, "")
      .replace(/fill\s*:\s*(?!none\b)(?!currentColor\b)(?!url\()[^;"']+/gi, "fill:currentColor")
      .replace(/stroke\s*:\s*(?!none\b)(?!currentColor\b)(?!url\()[^;"']+/gi, "stroke:currentColor")
      .replace(/fill\s*=\s*"(?!none\b)(?!currentColor\b)(?!url\()[^"]*"/gi, 'fill="currentColor"')
      .replace(/stroke\s*=\s*"(?!none\b)(?!currentColor\b)(?!url\()[^"]*"/gi, 'stroke="currentColor"')
      .replace(/<svg(\s[^>]*)?>/i, (match) => {
        let tag = match;
        tag = tag.replace(/\s(width|height)\s*=\s*"[^"]*"/gi, "");
        tag = tag.replace(/\sfill\s*=\s*"[^"]*"/i, "");
        if (/class\s*=\s*"[^"]*"/i.test(tag)) {
          tag = tag.replace(/class\s*=\s*"([^"]*)"/i, `class="$1 navbar-icon"`);
        } else {
          tag = tag.replace(/<svg/i, `<svg class="navbar-icon"`);
        }
        if (!/aria-hidden\s*=\s*"true"/i.test(tag)) {
          tag = tag.replace(/<svg/i, `<svg aria-hidden="true"`);
        }
        if (!/fill\s*=\s*"currentColor"/i.test(tag)) {
          tag = tag.replace(/<svg/i, `<svg fill="currentColor"`);
        }
        return tag;
      });

    iconElement.setAttribute('data-icon', iconType);
    iconElement.innerHTML = normalizedSVG;
  };

  const updateIcon = (isOpen) => {
    // Add animation class for smooth transition
    iconElement.classList.add('icon-transitioning');
    
    // Small delay to ensure the animation class is applied
    requestAnimationFrame(() => {
      if (isOpen) {
        updateIconElement('close', closeIconSVG);
      } else {
        updateIconElement('menu', menuIconSVG);
      }
      
      // Remove animation class after transition
      setTimeout(() => {
        iconElement.classList.remove('icon-transitioning');
      }, 200);
    });
  };

  const toggleNav = () => {
    const isOpen = navMenu.classList.contains('is-open');

    if (isOpen) {
      // Closing: first remove `is-open` to animate, then hide with `is-visible` after transition
      navMenu.classList.remove('is-open');
      updateIcon(false);
      setTimeout(() => {
        navMenu.classList.remove('is-visible');
      }, 260); // keep in sync with CSS transition (250ms)
    } else {
      // Opening: make visible then allow a frame before adding `is-open` to trigger transition
      navMenu.classList.add('is-visible');
      updateIcon(true);
      // Use rAF for reliable transition start across browsers
      requestAnimationFrame(() => navMenu.classList.add('is-open'));
    }
  };

  // Load icons and set up event listener
  loadIcons();
  navButton.addEventListener('click', toggleNav);
  return () => navButton.removeEventListener('click', toggleNav);
}
