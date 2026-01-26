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

import closeIcon from '@/icons/btn-close.svg?raw';
import leftArrowIcon from '@/icons/arrow-left.svg?raw';
import rightArrowIcon from '@/icons/arrow-right.svg?raw';
import pauseIcon from '@/icons/stories-pause.svg?raw';
import playIcon from '@/icons/stories-play.svg?raw';
import verifiedIcon from '@/icons/stories-verified.svg?raw';
import volumeOnIcon from '@/icons/stories-volume-on.svg?raw';
import volumeOffIcon from '@/icons/stories-volume-off.svg?raw';
import musicIcon from '@/icons/stories-music.svg?raw';
import { SITE_CONFIG } from '@lib/core/site-config';
import { onRouteChange } from '@lib/infrastructure/router-events';
import { qs, qsa } from '@lib/core/dom-builder';

/**
 * Story data structure
 * @property src - Image source URL
 * @property alt - Image alt text for accessibility
 */
interface Story {
  src: string;
  alt: string;
}

/**
 * Music data structure
 * @property src - Audio file source URL
 * @property title - Song title
 * @property artist - Artist name (optional)
 */
interface Music {
  src: string;
  title: string;
  artist?: string;
}

/**
 * Stories data container
 * @property stories - Array of story objects
 * @property music - Optional background music configuration
 */
interface StoriesData {
  stories: Story[];
  music?: Music;
}

/**
 * Duration for each story in milliseconds (5 seconds)
 */
const STORY_DURATION = 5000; // 5 seconds per story

/**
 * Stories JSON data URL
 */
const STORIES_DATA_URL = '/data/stories.json';

/**
 * In-memory cache for loaded stories data
 * Prevents multiple fetches for same data
 */
let storiesDataCache: StoriesData | null = null;

/**
 * Load stories data from JSON file
 * Uses cache to prevent redundant fetches
 * @returns Promise resolving to stories data object
 * @throws Error if fetch fails or JSON is invalid
 */
async function loadStoriesData(): Promise<StoriesData> {
  // Return cached data if available
  if (storiesDataCache !== null) {
    return storiesDataCache;
  }

  try {
    const response = await fetch(STORIES_DATA_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch stories: ${response.statusText}`);
    }

    const data: StoriesData = await response.json();

    // Validate data structure
    if (!data.stories || !Array.isArray(data.stories)) {
      throw new Error('Invalid stories data format');
    }

    // Cache the loaded stories data
    storiesDataCache = data;
    return storiesDataCache;
  } catch (error) {
    console.error('[Stories] Failed to load stories:', error);
    // Return empty data as fallback
    return { stories: [] };
  }
}

/**
 * Instagram-like Stories Viewer
 *
 * Provides fullscreen story viewing experience with:
 * - Auto-advancing progress bars
 * - Manual navigation (prev/next)
 * - Pause/resume functionality
 * - Keyboard controls (arrows, space, escape)
 * - Touch-friendly click zones
 * - Automatic cleanup on close
 *
 * Stories are loaded from /data/stories.json by default,
 * or can be provided directly via constructor parameter.
 *
 * @example
 * // Load from JSON (default)
 * const viewer = new StoriesViewer();
 * await viewer.open();
 *
 * @example
 * // Use custom stories
 * const customStories = [{ src: '/img.jpg', alt: 'Custom' }];
 * const viewer = new StoriesViewer(customStories);
 * await viewer.open();
 */
class StoriesViewer {
  private stories: Story[];
  private music: Music | undefined;
  private currentIndex: number = 0;
  private isPaused: boolean = false;
  private isMuted: boolean = false;
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
  private muteButton: HTMLButtonElement | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private musicInfoElement: HTMLDivElement | null = null;

  /**
   * Create new stories viewer instance
   * @param stories - Optional array of story objects (defaults to loading from JSON)
   * @param music - Optional music configuration
   */
  constructor(stories?: Story[], music?: Music) {
    this.stories = stories || [];
    this.music = music;
  }

  /**
   * Create stories overlay template HTML
   * Generates complete modal structure with header, progress bars, content, and navigation
   * @returns HTML string for overlay structure
   */
  private createOverlayTemplate(): string {
    const progressBarsHTML = this.stories
      .map(
        () => `
        <div class="stories__progress-bar">
          <div class="stories__progress-fill"></div>
        </div>
      `,
      )
      .join('');

    // Music info HTML (only if music is configured)
    const musicInfoHTML = this.music
      ? `
      <div class="stories__music-info">
        <span class="stories__music-icon" aria-hidden="true">
          ${musicIcon}
        </span>
        <span class="stories__music-text">
          ${this.music.artist ? `<span class="stories__music-artist">${this.music.artist}</span> • ` : ''}<span class="stories__music-title">${this.music.title}</span>
        </span>
      </div>
    `
      : '';

    return `
      <div class="stories__backdrop"></div>
      <div class="stories__container">
        <!-- Header section -->
        <div class="stories__header">
          <!-- Progress bars -->
          <div class="stories__progress">
            ${progressBarsHTML}
          </div>

          <!-- Controls row (user info + buttons) -->
          <div class="stories__controls">
            <!-- User info -->
            <div class="stories__user">
              <img 
                class="stories__avatar" 
                src="/assets/profile/avatar-stories.webp" 
                alt="${SITE_CONFIG.author.name}"
              />
              <div class="stories__user-details">
                <div class="stories__username-container">
                  <div class="stories__username">erlandramdhani</div>
                  <span class="stories__verified" aria-label="Verified">
                    ${verifiedIcon}
                  </span>
                </div>
                ${musicInfoHTML}
              </div>
            </div>

            <!-- Buttons container -->
            <div class="stories__buttons">
              ${
                this.music
                  ? `
              <button 
                class="stories__mute" 
                type="button" 
                aria-label="Mute"
              >
                ${volumeOnIcon}
              </button>
              `
                  : ''
              }
              <button 
                class="stories__pause" 
                type="button" 
                aria-label="Pause"
              >
                ${pauseIcon}
              </button>
              <button 
                class="stories__close" 
                type="button" 
                aria-label="Close stories"
              >
                ${closeIcon}
              </button>
            </div>
          </div>
        </div>

        <!-- Content area -->
        <div class="stories__content">
          <img 
            class="stories__image" 
            alt="" 
            draggable="false"
          />
          
          <!-- Click zones for mobile navigation -->
          <div 
            class="stories__click-zone stories__click-zone--prev" 
            aria-label="Previous story"
          ></div>
          <div 
            class="stories__click-zone stories__click-zone--next" 
            aria-label="Next story"
          ></div>
        </div>

        <!-- Navigation - Previous (desktop) -->
        <button 
          class="stories__nav stories__nav--prev" 
          type="button" 
          aria-label="Previous story"
        >
          <span class="stories__nav-icon">${leftArrowIcon}</span>
        </button>

        <!-- Navigation - Next (desktop) -->
        <button 
          class="stories__nav stories__nav--next" 
          type="button" 
          aria-label="Next story"
        >
          <span class="stories__nav-icon">${rightArrowIcon}</span>
        </button>
      </div>
    `;
  }

  /**
   * Create the stories overlay DOM structure
   * Builds overlay element, caches DOM references, and sets up event listeners
   * @returns Configured overlay div element ready to append to body
   */
  private createOverlay(): HTMLDivElement {
    const overlay = document.createElement('div');
    overlay.className = 'stories';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Stories viewer');

    // Use template to create structure
    overlay.innerHTML = this.createOverlayTemplate();

    // Query and cache DOM references
    const backdrop = qs<HTMLDivElement>(overlay, '.stories__backdrop');
    const closeBtn = qs<HTMLButtonElement>(overlay, '.stories__close');
    const pauseBtn = qs<HTMLButtonElement>(overlay, '.stories__pause');
    const muteBtn = qs<HTMLButtonElement>(overlay, '.stories__mute');
    const navPrev = qs<HTMLButtonElement>(overlay, '.stories__nav--prev');
    const navNext = qs<HTMLButtonElement>(overlay, '.stories__nav--next');
    const clickZonePrev = qs<HTMLDivElement>(
      overlay,
      '.stories__click-zone--prev',
    );
    const clickZoneNext = qs<HTMLDivElement>(
      overlay,
      '.stories__click-zone--next',
    );
    const imageElement = qs<HTMLImageElement>(overlay, '.stories__image');
    const progressBars = qsa<HTMLDivElement>(overlay, '.stories__progress-bar');
    const musicInfoElement = qs<HTMLDivElement>(
      overlay,
      '.stories__music-info',
    );

    // Store references
    this.imageElement = imageElement;
    this.pauseButton = pauseBtn;
    this.muteButton = muteBtn;
    this.navPrev = navPrev;
    this.navNext = navNext;
    this.clickZonePrev = clickZonePrev;
    this.clickZoneNext = clickZoneNext;
    this.progressBars = progressBars;
    this.musicInfoElement = musicInfoElement;

    // Setup event listeners
    if (backdrop) {
      backdrop.addEventListener('click', () => this.close());
    }
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }
    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => this.togglePause());
    }
    if (muteBtn) {
      muteBtn.addEventListener('click', () => this.toggleMute());
    }
    if (navPrev) {
      navPrev.addEventListener('click', () => this.prev());
    }
    if (navNext) {
      navNext.addEventListener('click', () => this.next());
    }
    if (clickZonePrev) {
      clickZonePrev.addEventListener('click', () => this.prev());
    }
    if (clickZoneNext) {
      clickZoneNext.addEventListener('click', () => this.next());
    }

    // Keyboard navigation
    document.addEventListener('keydown', this.handleKeyDown);

    return overlay;
  }

  /**
   * Handle keyboard navigation
   * - Escape: Close viewer
   * - ArrowLeft: Previous story
   * - ArrowRight: Next story
   * - Space: Toggle pause/resume
   * - M: Toggle mute/unmute
   * @param e - Keyboard event
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
      case 'm':
      case 'M':
        e.preventDefault();
        this.toggleMute();
        break;
    }
  };

  /**
   * Toggle pause state
   * Switches between paused and playing states
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
   * Stops progress animation and updates button icon to play
   * Also pauses background music if playing
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

    // Pause audio and update mute button icon to volume off
    if (this.audioElement && !this.audioElement.paused) {
      this.audioElement.pause();

      // Update mute button icon to show audio is not playing
      if (this.muteButton && !this.isMuted) {
        this.muteButton.innerHTML = volumeOffIcon;
      }
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
   * Restarts progress animation and updates button icon to pause
   * Also resumes background music if not muted
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

    // Resume audio and update mute button icon to volume on
    if (this.audioElement && this.audioElement.paused && !this.isMuted) {
      this.audioElement.play().catch(err => {
        console.error('[Stories] Failed to resume audio:', err);
      });

      // Update mute button icon to show audio is playing
      if (this.muteButton) {
        this.muteButton.innerHTML = volumeOnIcon;
      }
    }

    this.startTime = Date.now();
    this.animate();
  }

  /**
   * Toggle mute state
   * Switches between muted and unmuted states
   */
  private toggleMute(): void {
    if (this.isMuted) {
      this.unmute();
    } else {
      this.mute();
    }
  }

  /**
   * Mute background music
   * Updates button icon and pauses audio playback
   */
  private mute(): void {
    if (this.isMuted || !this.audioElement) return;
    this.isMuted = true;

    // Update mute button icon to volume off
    if (this.muteButton) {
      this.muteButton.innerHTML = volumeOffIcon;
      this.muteButton.setAttribute('aria-label', 'Unmute');
    }

    // Pause audio
    if (!this.audioElement.paused) {
      this.audioElement.pause();
    }
  }

  /**
   * Unmute background music
   * Updates button icon and resumes audio playback if story is playing
   */
  private unmute(): void {
    if (!this.isMuted || !this.audioElement) return;
    this.isMuted = false;

    // Update mute button icon to volume on
    if (this.muteButton) {
      this.muteButton.innerHTML = volumeOnIcon;
      this.muteButton.setAttribute('aria-label', 'Mute');
    }

    // Resume audio if story is not paused
    if (!this.isPaused && this.audioElement.paused) {
      this.audioElement.play().catch(err => {
        console.error('[Stories] Failed to unmute audio:', err);
      });
    }
  }

  /**
   * Initialize background music
   * Creates audio element, sets up looping, and starts playback
   * Hides music info if audio fails to load
   */
  private async initAudio(): Promise<void> {
    if (!this.music) return;

    try {
      this.audioElement = new Audio(this.music.src);
      this.audioElement.loop = true;
      this.audioElement.preload = 'auto';

      // Handle audio load errors
      this.audioElement.addEventListener('error', () => {
        console.error('[Stories] Failed to load audio:', this.music?.src);
        // Hide music info on error
        if (this.musicInfoElement) {
          this.musicInfoElement.style.display = 'none';
        }
        // Hide mute button on error
        if (this.muteButton) {
          this.muteButton.style.display = 'none';
        }
      });

      // Start playing audio (unmuted by default)
      await this.audioElement.play();
    } catch (error) {
      console.error('[Stories] Failed to initialize audio:', error);
      // Hide music info on error
      if (this.musicInfoElement) {
        this.musicInfoElement.style.display = 'none';
      }
      // Hide mute button on error
      if (this.muteButton) {
        this.muteButton.style.display = 'none';
      }
    }
  }

  /**
   * Cleanup audio resources
   * Stops playback, removes event listeners, and nullifies audio element
   */
  private cleanupAudio(): void {
    if (!this.audioElement) return;

    this.audioElement.pause();
    this.audioElement.currentTime = 0;
    this.audioElement.src = '';
    this.audioElement.load();
    this.audioElement = null;
  }

  /**
   * Update navigation buttons visibility
   * Hides prev button on first story, next button on last story
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
   * Calculates percentage based on elapsed time vs STORY_DURATION
   */
  private updateProgress(): void {
    const currentBar = this.progressBars[this.currentIndex];
    if (!currentBar) return;

    const fill = qs<HTMLDivElement>(currentBar, '.stories__progress-fill');
    if (!fill) return;

    const progress = Math.min((this.elapsed / STORY_DURATION) * 100, 100);
    fill.style.width = `${progress}%`;
  }

  /**
   * Animation loop for progress bar
   * Uses requestAnimationFrame for smooth 60fps animation
   * Auto-advances to next story when duration reached
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
   * Updates image, resets progress, and starts animation
   * @param index - Story index to load (0-based)
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
      const fill = qs<HTMLDivElement>(bar, '.stories__progress-fill');
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
   * No-op if already on first story
   */
  private prev(): void {
    if (this.currentIndex > 0) {
      this.loadStory(this.currentIndex - 1);
    }
  }

  /**
   * Navigate to next story
   * Auto-closes viewer if on last story
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
   * Adds CSS class to prevent body scroll while viewer is open
   */
  private disableScroll(): void {
    document.documentElement.classList.add('image-lightbox--locked');
  }

  /**
   * Enable page scrolling
   * Removes CSS class to restore normal scrolling after viewer closes
   */
  private enableScroll(): void {
    document.documentElement.classList.remove('image-lightbox--locked');
  }

  /**
   * Open the stories viewer
   * Loads stories from JSON if not provided, creates overlay, appends to body,
   * animates in, initializes audio, and loads first story
   * @example
   * const viewer = new StoriesViewer();
   * await viewer.open();
   */
  public async open(): Promise<void> {
    if (this.overlay) return; // Already open

    // Load stories data from JSON if not provided
    if (this.stories.length === 0) {
      const data = await loadStoriesData();
      this.stories = data.stories;
      this.music = data.music;

      // Check if stories were loaded successfully
      if (this.stories.length === 0) {
        console.error('[Stories] No stories available to display');
        return;
      }
    }

    this.overlay = this.createOverlay();
    document.body.appendChild(this.overlay);

    // Force reflow for animation
    void this.overlay.offsetWidth;
    this.overlay.classList.add('open');

    this.disableScroll();

    // Initialize audio if music is configured
    if (this.music) {
      await this.initAudio();
    }

    // Load first story
    this.loadStory(0);
  }

  /**
   * Close the stories viewer
   * Stops animation, audio, cleans up event listeners, animates out, and removes overlay
   * Automatically called when all stories are viewed or user presses escape
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

    // Cleanup audio
    this.cleanupAudio();

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
      { once: true },
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
    this.pauseButton = null;
    this.muteButton = null;
    this.musicInfoElement = null;
  }
}

/**
 * Initialize avatar stories feature
 * Finds all elements with [data-stories] attribute and attaches click handlers
 * Safe to call multiple times - prevents duplicate event binding
 * @example
 * // In HTML: <img data-stories src="avatar.jpg" />
 * initAvatarStories();
 */
export function initAvatarStories(): void {
  const avatarImages = document.querySelectorAll('[data-stories]');

  interface ElementWithStoriesBound extends Element {
    _storiesBound?: boolean;
  }

  avatarImages.forEach(avatar => {
    const elem = avatar as ElementWithStoriesBound;
    if (elem._storiesBound) return;
    elem._storiesBound = true;

    avatar.addEventListener('click', async (e: Event) => {
      e.preventDefault();
      e.stopPropagation();

      const viewer = new StoriesViewer();
      await viewer.open();
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
      { once: true },
    );
  } else {
    setTimeout(() => {
      run();
      setupRouterReinit();
    }, 50);
  }
}

export default initAvatarStories;
