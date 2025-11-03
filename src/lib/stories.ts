/**
 * Avatar Stories - Instagram-like Story Viewer
 * Features:
 * - Fullscreen modal with backdrop
 * - Progress bars with countdown timer
 * - Auto-advance to next story
 * - Manual navigation (prev/next)
 * - Pause/Resume Story
 * - Auto-close after all stories viewed
 */

import closeIcon from '@/icons/close.svg?raw';
import leftArrowIcon from '@/icons/left-arrow.svg?raw';
import rightArrowIcon from '@/icons/right-arrow.svg?raw';
import pauseIcon from '@/icons/pause.svg?raw';
import playIcon from '@/icons/play.svg?raw';
import { onRouteChange } from './router-events';

interface Story {
  src: string;
  alt: string;
}

const STORY_DURATION = 5000; // 5 seconds per story
const PLACEHOLDER_STORIES: Story[] = [
  {
    src: '/assets/stories/story-1.webp',
    alt: 'Story 1',
  },
  {
    src: '/assets/stories/story-2.webp',
    alt: 'Story 2',
  },
  {
    src: '/assets/stories/story-3.webp',
    alt: 'Story 3',
  },
  {
    src: '/assets/stories/story-4.webp',
    alt: 'Story 4',
  },
  {
    src: '/assets/stories/story-5.webp',
    alt: 'Story 5',
  },
  {
    src: '/assets/stories/story-6.webp',
    alt: 'Story 6',
  },
  {
    src: '/assets/stories/story-7.webp',
    alt: 'Story 7',
  },
  {
    src: '/assets/stories/story-8.webp',
    alt: 'Story 8',
  },
];

class StoriesViewer {
  private stories: Story[];
  private currentIndex: number = 0;
  private isPaused: boolean = false;
  private startTime: number = 0;
  private elapsed: number = 0;
  private animationId: number | null = null;
  private holdTimer: number | null = null;

  // DOM elements
  private overlay: HTMLDivElement | null = null;
  private progressBars: HTMLDivElement[] = [];
  private imageElement: HTMLImageElement | null = null;
  private navPrev: HTMLButtonElement | null = null;
  private navNext: HTMLButtonElement | null = null;
  private clickZonePrev: HTMLDivElement | null = null;
  private clickZoneNext: HTMLDivElement | null = null;
  private pauseButton: HTMLButtonElement | null = null;

  constructor(stories: Story[] = PLACEHOLDER_STORIES) {
    this.stories = stories;
  }

  /**
   * Create the stories overlay DOM structure
   */
  private createOverlay(): HTMLDivElement {
    const overlay = document.createElement('div');
    overlay.className = 'stories';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Stories viewer');

    // Backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'stories__backdrop';
    overlay.appendChild(backdrop);

    // Container
    const container = document.createElement('div');
    container.className = 'stories__container';

    // Header section
    const header = document.createElement('div');
    header.className = 'stories__header';

    // Progress bars
    const progressContainer = document.createElement('div');
    progressContainer.className = 'stories__progress';
    this.stories.forEach(() => {
      const bar = document.createElement('div');
      bar.className = 'stories__progress-bar';
      const fill = document.createElement('div');
      fill.className = 'stories__progress-fill';
      bar.appendChild(fill);
      progressContainer.appendChild(bar);
      this.progressBars.push(bar);
    });
    header.appendChild(progressContainer);

    // Controls row (user info + buttons)
    const controlsRow = document.createElement('div');
    controlsRow.className = 'stories__controls';

    // User info
    const userInfo = document.createElement('div');
    userInfo.className = 'stories__user';

    const avatar = document.createElement('img');
    avatar.className = 'stories__avatar';
    avatar.src = '/assets/profile/avatar-stories.webp';
    avatar.alt = 'Erland Ramdhani';
    userInfo.appendChild(avatar);

    const username = document.createElement('div');
    username.className = 'stories__username';
    username.textContent = 'erlandramdhani';
    userInfo.appendChild(username);

    controlsRow.appendChild(userInfo);

    // Buttons container
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'stories__buttons';

    // Pause/Play button
    const pauseBtn = document.createElement('button');
    pauseBtn.className = 'stories__pause';
    pauseBtn.type = 'button';
    pauseBtn.setAttribute('aria-label', 'Pause');
    pauseBtn.innerHTML = pauseIcon;
    buttonsContainer.appendChild(pauseBtn);
    this.pauseButton = pauseBtn;

    // Close button (in header, both mobile and desktop)
    const closeBtn = document.createElement('button');
    closeBtn.className = 'stories__close';
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Close stories');
    closeBtn.innerHTML = closeIcon;
    buttonsContainer.appendChild(closeBtn);

    controlsRow.appendChild(buttonsContainer);
    header.appendChild(controlsRow);

    container.appendChild(header);

    // Content area
    const content = document.createElement('div');
    content.className = 'stories__content';

    // Image
    const img = document.createElement('img');
    img.className = 'stories__image';
    img.alt = '';
    img.draggable = false;
    content.appendChild(img);
    this.imageElement = img;

    // Click zones for mobile navigation
    const clickZonePrev = document.createElement('div');
    clickZonePrev.className = 'stories__click-zone stories__click-zone--prev';
    clickZonePrev.setAttribute('aria-label', 'Previous story');
    content.appendChild(clickZonePrev);
    this.clickZonePrev = clickZonePrev;

    const clickZoneNext = document.createElement('div');
    clickZoneNext.className = 'stories__click-zone stories__click-zone--next';
    clickZoneNext.setAttribute('aria-label', 'Next story');
    content.appendChild(clickZoneNext);
    this.clickZoneNext = clickZoneNext;

    container.appendChild(content);

    // Navigation - Previous (desktop)
    const navPrev = document.createElement('button');
    navPrev.className = 'stories__nav stories__nav--prev';
    navPrev.setAttribute('aria-label', 'Previous story');
    navPrev.type = 'button';
    const navPrevIcon = document.createElement('span');
    navPrevIcon.className = 'stories__nav-icon';
    navPrevIcon.innerHTML = leftArrowIcon;
    navPrev.appendChild(navPrevIcon);
    container.appendChild(navPrev);
    this.navPrev = navPrev;

    // Navigation - Next (desktop)
    const navNext = document.createElement('button');
    navNext.className = 'stories__nav stories__nav--next';
    navNext.setAttribute('aria-label', 'Next story');
    navNext.type = 'button';
    const navNextIcon = document.createElement('span');
    navNextIcon.className = 'stories__nav-icon';
    navNextIcon.innerHTML = rightArrowIcon;
    navNext.appendChild(navNextIcon);
    container.appendChild(navNext);
    this.navNext = navNext;

    overlay.appendChild(container);

    // Event listeners
    backdrop.addEventListener('click', () => this.close());
    closeBtn.addEventListener('click', () => this.close());
    pauseBtn.addEventListener('click', () => this.togglePause());
    navPrev.addEventListener('click', () => this.prev());
    navNext.addEventListener('click', () => this.next());
    clickZonePrev.addEventListener('click', () => this.prev());
    clickZoneNext.addEventListener('click', () => this.next());

    // Keyboard navigation
    document.addEventListener('keydown', this.handleKeyDown);

    return overlay;
  }

  /**
   * Handle keyboard navigation
   */
  private handleKeyDown = (e: KeyboardEvent): void => {
    if (!this.overlay) return;

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        this.close();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        this.prev();
        break;
      case 'ArrowRight':
        e.preventDefault();
        this.next();
        break;
      case ' ':
        e.preventDefault();
        this.togglePause();
        break;
    }
  };

  /**
   * Toggle pause state
   */
  private togglePause(): void {
    if (this.isPaused) {
      this.resume();
    } else {
      this.pause();
    }
  }

  /**
   * Pause the current story
   */
  private pause(): void {
    if (this.isPaused) return;
    this.isPaused = true;
    this.overlay?.classList.add('paused');

    // Update pause button icon to play
    if (this.pauseButton) {
      this.pauseButton.innerHTML = playIcon;
      this.pauseButton.setAttribute('aria-label', 'Play');
    }

    // Calculate elapsed time
    if (this.startTime > 0) {
      this.elapsed += Date.now() - this.startTime;
    }

    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * Resume the current story
   */
  private resume(): void {
    if (!this.isPaused) return;
    this.isPaused = false;
    this.overlay?.classList.remove('paused');

    // Update pause button icon to pause
    if (this.pauseButton) {
      this.pauseButton.innerHTML = pauseIcon;
      this.pauseButton.setAttribute('aria-label', 'Pause');
    }

    this.startTime = Date.now();
    this.animate();
  }

  /**
   * Update navigation buttons visibility
   */
  private updateNavVisibility(): void {
    const isFirst = this.currentIndex === 0;
    const isLast = this.currentIndex === this.stories.length - 1;

    // Update desktop navigation buttons
    if (this.navPrev) {
      if (isFirst) {
        this.navPrev.classList.add('hidden');
      } else {
        this.navPrev.classList.remove('hidden');
      }
    }

    if (this.navNext) {
      if (isLast) {
        this.navNext.classList.add('hidden');
      } else {
        this.navNext.classList.remove('hidden');
      }
    }

    // Update mobile click zones
    if (this.clickZonePrev) {
      this.clickZonePrev.style.display = isFirst ? 'none' : 'block';
    }

    if (this.clickZoneNext) {
      this.clickZoneNext.style.display = isLast ? 'none' : 'block';
    }
  }

  /**
   * Update progress bar fill percentage
   */
  private updateProgress(): void {
    const currentBar = this.progressBars[this.currentIndex];
    if (!currentBar) return;

    const fill = currentBar.querySelector(
      '.stories__progress-fill'
    ) as HTMLDivElement;
    if (!fill) return;

    const progress = Math.min((this.elapsed / STORY_DURATION) * 100, 100);
    fill.style.width = `${progress}%`;
  }

  /**
   * Animation loop for progress bar
   */
  private animate = (): void => {
    if (this.isPaused) return;

    const now = Date.now();
    const delta = now - this.startTime;
    this.elapsed += delta;
    this.startTime = now;

    this.updateProgress();

    if (this.elapsed >= STORY_DURATION) {
      // Story finished, advance to next
      this.next();
    } else {
      this.animationId = requestAnimationFrame(this.animate);
    }
  };

  /**
   * Load and display a specific story
   */
  private loadStory(index: number): void {
    if (index < 0 || index >= this.stories.length) return;

    this.currentIndex = index;
    const story = this.stories[index];

    // Update image
    if (this.imageElement) {
      this.imageElement.src = story.src;
      this.imageElement.alt = story.alt;
    }

    // Reset progress
    this.elapsed = 0;
    this.startTime = Date.now();

    // Update progress bars state
    this.progressBars.forEach((bar, i) => {
      const fill = bar.querySelector(
        '.stories__progress-fill'
      ) as HTMLDivElement;
      if (!fill) return;

      if (i < index) {
        // Completed
        bar.classList.remove('active');
        bar.classList.add('completed');
        fill.style.width = '100%';
      } else if (i === index) {
        // Active
        bar.classList.remove('completed');
        bar.classList.add('active');
        fill.style.width = '0%';
      } else {
        // Not started
        bar.classList.remove('active', 'completed');
        fill.style.width = '0%';
      }
    });

    // Stop existing animation
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    // Only start animation if not paused
    if (!this.isPaused) {
      this.animate();
    }

    // Update navigation visibility
    this.updateNavVisibility();
  }

  /**
   * Navigate to previous story
   */
  private prev(): void {
    if (this.currentIndex > 0) {
      this.loadStory(this.currentIndex - 1);
    }
  }

  /**
   * Navigate to next story
   */
  private next(): void {
    if (this.currentIndex < this.stories.length - 1) {
      this.loadStory(this.currentIndex + 1);
    } else {
      // All stories finished, auto-close
      this.close();
    }
  }

  /**
   * Disable page scrolling
   */
  private disableScroll(): void {
    document.documentElement.classList.add('image-lightbox--locked');
  }

  /**
   * Enable page scrolling
   */
  private enableScroll(): void {
    document.documentElement.classList.remove('image-lightbox--locked');
  }

  /**
   * Open the stories viewer
   */
  public open(): void {
    if (this.overlay) return; // Already open

    this.overlay = this.createOverlay();
    document.body.appendChild(this.overlay);

    // Force reflow for animation
    void this.overlay.offsetWidth;
    this.overlay.classList.add('open');

    this.disableScroll();

    // Load first story
    this.loadStory(0);
  }

  /**
   * Close the stories viewer
   */
  public close(): void {
    if (!this.overlay) return;

    this.overlay.classList.remove('open');

    // Stop animation
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    // Clear hold timer
    if (this.holdTimer !== null) {
      window.clearTimeout(this.holdTimer);
      this.holdTimer = null;
    }

    // Clean up event listeners
    document.removeEventListener('keydown', this.handleKeyDown);

    // Enable scroll immediately to prevent stuck state
    this.enableScroll();

    // Remove overlay after transition
    const currentOverlay = this.overlay;
    this.overlay.addEventListener(
      'transitionend',
      () => {
        currentOverlay.remove();
      },
      { once: true }
    );

    // Fallback: remove overlay after max transition duration
    setTimeout(() => {
      if (currentOverlay.parentNode) {
        currentOverlay.remove();
      }
    }, 500);

    // Reset state
    this.overlay = null;
    this.progressBars = [];
    this.imageElement = null;
    this.navPrev = null;
    this.navNext = null;
    this.clickZonePrev = null;
    this.clickZoneNext = null;
  }
}

/**
 * Initialize avatar stories feature
 */
export function initAvatarStories(): void {
  const avatarImages = document.querySelectorAll('[data-stories]');

  avatarImages.forEach(avatar => {
    if ((avatar as any)._storiesBound) return;
    (avatar as any)._storiesBound = true;

    avatar.addEventListener('click', (e: Event) => {
      e.preventDefault();
      e.stopPropagation();

      const viewer = new StoriesViewer();
      viewer.open();
    });

    // Add visual indicator (cursor pointer)
    (avatar as HTMLElement).style.cursor = 'pointer';
  });
}

/**
 * Auto-init for router transitions
 */
let routerSetup = false;
function setupRouterReinit() {
  if (routerSetup) return;
  routerSetup = true;

  const run = () => initAvatarStories();

  document.addEventListener('astro:page-load', run);
  document.addEventListener('astro:after-swap', run);

  onRouteChange(run);
}

/**
 * Auto-init when module is loaded
 */
export function autoInit(): void {
  const run = () => initAvatarStories();

  if (document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded',
      () => {
        run();
        setupRouterReinit();
      },
      { once: true }
    );
  } else {
    setTimeout(() => {
      run();
      setupRouterReinit();
    }, 50);
  }
}

export default initAvatarStories;
