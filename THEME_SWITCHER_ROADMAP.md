# Theme Switcher Implementation Roadmap

## ✅ Priority 1 - Critical Fixes (COMPLETED)

### 1. ✅ Fix re-initialization pattern untuk view transitions
**Status:** DONE  
**Implementation:**
- Extracted logic ke `src/lib/theme-toggle.ts` (415 lines)
- Cache-but-reinit pattern: module di-cache sekali, `init()` selalu runs
- Forced element re-query: `wrapperElement = null` pada setiap init
- Duplicate removal: check dan hapus duplicate elements

**Files Changed:**
- ✅ `src/lib/theme-toggle.ts` (NEW)
- ✅ `src/components/ThemeToggle.astro` (simplified)

### 2. ✅ Implement AbortController untuk prevent memory leaks
**Status:** DONE  
**Implementation:**
- AbortController untuk semua event listeners
- Auto-cleanup saat navigation via `signal` parameter
- Reset abort controller pada setiap init

**Code:**
```typescript
abortController = new AbortController();
const { signal } = abortController;

// All listeners use signal
trigger.addEventListener('click', handler, { signal });
document.addEventListener('click', handleClickOutside, { signal });
```

### 3. ✅ Simplify icon update dengan pre-cached references
**Status:** DONE  
**Implementation:**
- Icon cache Map untuk store SVG clones
- `cacheIcons()` dipanggil sekali saat init
- Update hanya clone dari cache, tidak query DOM

**Code:**
```typescript
const iconCache = new Map<ThemePreference, SVGElement>();

const cacheIcons = (): void => {
  options.forEach((option) => {
    const svg = option.querySelector<SVGElement>('svg');
    if (theme && svg) {
      iconCache.set(theme, svg.cloneNode(true) as SVGElement);
    }
  });
};
```

---

## 🚧 Priority 2 - Improvements (PLANNED)

### 1. Refactor wrapper placement ke CSS-only solution
**Status:** PENDING  
**Current Issue:** 
- JavaScript manually moves DOM element ke sidebar di mobile
- Complex logic dengan `placeWrapperInSidebar()` dan `restoreWrapperPlacement()`
- DOM manipulation bisa cause performance issues

**Proposed Solution:**
Use CSS Grid/Flexbox dengan media queries instead of DOM manipulation

**Implementation Plan:**

#### A. Update Layout Structure
Create dedicated container untuk theme toggle yang responsive via CSS:

```astro
<!-- SiteLayout.astro -->
<div class="theme-toggle-container">
  <ThemeToggle />
</div>
```

```css
/* Theme toggle positioning via CSS only */
.theme-toggle-container {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 9998;
}

@media (max-width: 1024px) {
  /* Hide fixed position container on mobile */
  .theme-toggle-container {
    display: none;
  }
  
  /* Show in sidebar via CSS */
  .sidebar .nav-content {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  /* Theme toggle automatically flows into sidebar */
  .sidebar .theme-toggle {
    position: static;
    margin-left: auto;
    margin-right: 12px;
  }
}
```

#### B. Render Toggle in Both Locations
Conditionally render theme toggle di dua tempat:

```astro
<!-- SiteLayout.astro -->
<!-- Desktop: Fixed position -->
<div class="theme-toggle-container theme-toggle-desktop">
  <ThemeToggle />
</div>

<!-- Mobile: Inside sidebar -->
{showSidebar && (
  <Sidebar selectedItem={selectedItem}>
    <ThemeToggle slot="nav-actions" />
  </Sidebar>
)}
```

#### C. Remove DOM Manipulation Logic
Delete dari `theme-toggle.ts`:
- `ensureWrapperElement()`
- `restoreWrapperPlacement()`
- `placeWrapperInSidebar()`
- `updateWrapperPlacement()`
- `attachMediaListener()`

**Benefits:**
- ✅ Simpler code (remove ~100 lines)
- ✅ No DOM manipulation overhead
- ✅ Better performance
- ✅ Easier to maintain
- ✅ No layout shift issues

**Files to Modify:**
- `src/lib/theme-toggle.ts` (remove placement logic)
- `src/layouts/SiteLayout.astro` (update layout)
- `src/components/Sidebar.astro` (add slot for actions)
- `src/styles/layout/site-layout.css` (add responsive styles)

**Estimated Effort:** 2-3 hours

---

### 2. Add loading state untuk prevent clicks sebelum ready
**Status:** PENDING  
**Current Issue:**
- User bisa click toggle sebelum `__themeControl` ready
- Bisa cause errors atau unexpected behavior

**Proposed Solution:**

#### A. Add Loading State
```typescript
let isInitializing = true;

export const init = async (): Promise<void> => {
  isInitializing = true;
  
  // Disable trigger during init
  trigger?.setAttribute('disabled', 'true');
  trigger?.setAttribute('aria-busy', 'true');
  
  try {
    // ... initialization logic
    await waitForThemeControl();
    // ... setup listeners
  } finally {
    isInitializing = false;
    trigger?.removeAttribute('disabled');
    trigger?.removeAttribute('aria-busy');
  }
};
```

#### B. Add Visual Loading Indicator
```css
/* ThemeToggle.module.css */
.trigger[disabled] {
  opacity: 0.6;
  cursor: not-allowed;
}

.trigger[aria-busy="true"]::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: inherit;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

#### C. Queue Clicks During Init
```typescript
let pendingAction: (() => void) | null = null;

trigger.addEventListener('click', (e) => {
  if (isInitializing) {
    e.preventDefault();
    // Queue action to run after init
    pendingAction = () => toggleFlyout(trigger, flyout);
    return;
  }
  toggleFlyout(trigger, flyout);
});

// After init completes
if (pendingAction) {
  pendingAction();
  pendingAction = null;
}
```

**Files to Modify:**
- `src/lib/theme-toggle.ts`
- `src/components/ThemeToggle/ThemeToggle.module.css`

**Estimated Effort:** 1-2 hours

---

### 3. Add transition animations untuk theme changes
**Status:** PENDING  
**Current Issue:**
- Theme changes instantly without visual feedback
- Jarring experience, especially for light ↔ dark transitions

**Proposed Solution:**

#### A. CSS Transitions for Color Changes
```css
/* variables.css */
:root {
  --theme-transition-duration: 200ms;
  --theme-transition-easing: cubic-bezier(0.4, 0, 0.2, 1);
}

/* Apply to all themed properties */
* {
  transition: 
    background-color var(--theme-transition-duration) var(--theme-transition-easing),
    color var(--theme-transition-duration) var(--theme-transition-easing),
    border-color var(--theme-transition-duration) var(--theme-transition-easing),
    box-shadow var(--theme-transition-duration) var(--theme-transition-easing);
}

/* Opt-out for elements that shouldn't transition */
.no-theme-transition,
.no-theme-transition * {
  transition: none !important;
}
```

#### B. Crossfade Animation (Advanced)
Optional: Add a brief overlay during theme switch for smoother transition

```typescript
const applyThemeWithTransition = (theme: ThemePreference) => {
  // Add transition overlay
  const overlay = document.createElement('div');
  overlay.className = 'theme-transition-overlay';
  document.body.appendChild(overlay);
  
  // Trigger theme change
  control.setPreference(theme);
  
  // Remove overlay after transition
  setTimeout(() => {
    overlay.remove();
  }, 300);
};
```

```css
.theme-transition-overlay {
  position: fixed;
  inset: 0;
  background: var(--bg-primary);
  opacity: 0;
  animation: fadeInOut 300ms ease-in-out;
  pointer-events: none;
  z-index: 10000;
}

@keyframes fadeInOut {
  0%, 100% { opacity: 0; }
  50% { opacity: 0.3; }
}
```

#### C. Reduce Motion Support
```css
@media (prefers-reduced-motion: reduce) {
  * {
    --theme-transition-duration: 0ms !important;
  }
  
  .theme-transition-overlay {
    display: none !important;
  }
}
```

**Files to Modify:**
- `src/styles/variables.css`
- `src/lib/theme-toggle.ts` (optional crossfade)
- `src/styles/base.css` (global transitions)

**Estimated Effort:** 1-2 hours

---

## 🎨 Priority 3 - Polish (PLANNED)

### 1. Add toast notification ketika theme berubah
**Status:** PENDING  
**Goal:** Consistency dengan fitur lain (share buttons sudah pakai toast)

**Implementation Plan:**

#### A. Integrate with Existing Toast System
```typescript
import { showToast } from './toast';

const announceThemeChange = (theme: ThemePreference): void => {
  // Screen reader announcement (existing)
  const statusEl = document.getElementById('theme-status');
  if (statusEl) {
    statusEl.textContent = `Theme changed to ${stateLabels[theme]}`;
  }
  
  // Visual toast notification (NEW)
  showToast(`Theme: ${stateLabels[theme]}`, {
    duration: 2000,
    icon: iconNames[theme], // 'auto' | 'sun' | 'moon'
  });
};
```

#### B. Custom Toast Styling for Theme Changes
```css
/* toast.css */
.toast--theme {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toast--theme .toast__icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

**Files to Modify:**
- `src/lib/theme-toggle.ts` (import toast)
- `src/styles/toast.css` (optional styling)

**Estimated Effort:** 30 minutes - 1 hour

---

### 2. Keyboard navigation untuk option menu (Arrow keys)
**Status:** PENDING  
**Goal:** Better accessibility dan UX

**Implementation Plan:**

#### A. Arrow Key Navigation
```typescript
const setupKeyboardNavigation = (
  flyout: HTMLElement,
  options: NodeListOf<HTMLElement>
) => {
  let currentIndex = Array.from(options).findIndex(
    opt => opt.getAttribute('data-active') === 'true'
  );

  flyout.addEventListener('keydown', (e) => {
    if (!['ArrowUp', 'ArrowDown', 'Enter', 'Escape'].includes(e.key)) {
      return;
    }
    
    e.preventDefault();

    switch (e.key) {
      case 'ArrowDown':
        currentIndex = (currentIndex + 1) % options.length;
        options[currentIndex].focus();
        break;

      case 'ArrowUp':
        currentIndex = (currentIndex - 1 + options.length) % options.length;
        options[currentIndex].focus();
        break;

      case 'Enter':
        options[currentIndex].click();
        break;

      case 'Escape':
        closeFlyout(trigger, flyout);
        break;
    }
  });
};
```

#### B. Focus Management
```typescript
const openFlyout = (trigger: HTMLElement, flyout: HTMLElement): void => {
  isOpen = true;
  trigger.setAttribute('aria-expanded', 'true');
  flyout.hidden = false;
  positionFlyout(trigger, flyout);
  
  // Focus active option instead of first option
  const activeOption = flyout.querySelector('[data-active="true"]') as HTMLElement;
  const firstOption = flyout.querySelector('[data-theme-option]') as HTMLElement;
  (activeOption || firstOption)?.focus();
};
```

#### C. Visual Focus Indicators
```css
.option:focus {
  outline: 2px solid var(--text-accent);
  outline-offset: -2px;
}

.option:focus:not(:focus-visible) {
  outline: none;
}
```

**Files to Modify:**
- `src/lib/theme-toggle.ts`
- `src/components/ThemeToggle/ThemeToggle.module.css`

**Estimated Effort:** 1-2 hours

---

### 3. Persist flyout state (optional)
**Status:** PENDING - Needs Discussion  
**Goal:** Remember if user prefers flyout to stay open or close automatically

**Options:**

#### Option A: Always Close (Current Behavior)
- ✅ Clean, predictable
- ✅ Consistent with most UIs
- ❌ Extra click if changing multiple times

#### Option B: Stay Open Until Manual Close
- ✅ Quick theme cycling
- ❌ Can feel cluttered
- ❌ Might confuse users

#### Option C: User Preference
Store user preference in localStorage:

```typescript
const FLYOUT_BEHAVIOR_KEY = 'theme-flyout-behavior';

type FlyoutBehavior = 'auto-close' | 'stay-open';

const getFlyoutBehavior = (): FlyoutBehavior => {
  try {
    const stored = localStorage.getItem(FLYOUT_BEHAVIOR_KEY);
    return stored === 'stay-open' ? 'stay-open' : 'auto-close';
  } catch {
    return 'auto-close';
  }
};

// In option click handler
if (getFlyoutBehavior() === 'auto-close') {
  closeFlyout(trigger, flyout);
}
```

Add setting toggle in flyout:

```astro
<div class="flyout-settings">
  <label>
    <input type="checkbox" id="stay-open-toggle" />
    Keep open after selection
  </label>
</div>
```

**Recommendation:** Stick with Option A (always close) for simplicity. Add Option C only if users request it.

**Estimated Effort:** 2 hours (if implemented)

---

## 📊 Implementation Timeline

### Sprint 1 (Priority 2 - Week 1)
- Day 1-2: Refactor wrapper placement to CSS-only
- Day 3: Add loading state
- Day 4: Add transition animations
- Day 5: Testing & bug fixes

### Sprint 2 (Priority 3 - Week 2)
- Day 1: Toast notification integration
- Day 2-3: Keyboard navigation
- Day 4: Optional flyout persistence (if needed)
- Day 5: Final testing & polish

---

## 🧪 Testing Checklist

### Desktop (≥1025px)
- [ ] Theme toggle fixed di top-right
- [ ] Klik trigger → flyout terbuka
- [ ] Arrow keys navigate options
- [ ] Enter key selects option
- [ ] ESC key closes flyout
- [ ] Theme changes smoothly (transitions)
- [ ] Toast notification muncul
- [ ] No duplicate elements

### Mobile (≤1024px)
- [ ] Theme toggle di sidebar
- [ ] Position via CSS (no JS manipulation)
- [ ] Touch interaction smooth
- [ ] Flyout positioned correctly
- [ ] No layout shifts
- [ ] No duplicate elements

### View Transitions
- [ ] Toggle persists across navigation
- [ ] Init runs on every page load
- [ ] No memory leaks (listeners cleaned up)
- [ ] Theme preference preserved

### Accessibility
- [ ] Screen reader announcements
- [ ] Keyboard navigation works
- [ ] Focus management correct
- [ ] ARIA attributes accurate
- [ ] Reduced motion respected

---

## 📝 Notes

- Semua Priority 1 sudah selesai dan working
- Priority 2 fokus pada performance dan UX improvements
- Priority 3 adalah polish dan optional features
- Testing sangat penting setelah setiap perubahan
- Consider user feedback sebelum implement Optional features

---

**Last Updated:** October 22, 2025  
**Current Branch:** `feat/theme-switcher`  
**Status:** Priority 1 ✅ DONE | Priority 2 🚧 PLANNED | Priority 3 🎨 PLANNED
