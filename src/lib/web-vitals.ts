/**
 * Web Vitals Monitoring
 * 
 * Tracks Core Web Vitals and sends them to Google Tag Manager for analysis.
 * Metrics tracked: CLS, LCP, INP, FCP, TTFB
 * 
 * Only runs in production to avoid polluting analytics with dev data.
 */

import type { Metric } from 'web-vitals';

/**
 * Check if GTM dataLayer is available
 */
function isGTMAvailable(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof (window as any).dataLayer !== 'undefined'
  );
}

/**
 * Send metric to Google Tag Manager
 */
function sendToGTM(metric: Metric): void {
  if (!isGTMAvailable()) {
    if (import.meta.env.DEV) {
      console.log('[Web Vitals]', metric.name, Math.round(metric.value), metric);
    }
    return;
  }

  const dataLayer = (window as any).dataLayer;

  // Send metric to GTM
  dataLayer.push({
    event: 'web_vitals',
    metric_name: metric.name,
    metric_value: Math.round(metric.value),
    metric_id: metric.id,
    metric_rating: metric.rating, // 'good', 'needs-improvement', or 'poor'
    metric_delta: Math.round(metric.delta),
    metric_navigation_type: metric.navigationType,
  });

  // Also log in development for debugging
  if (import.meta.env.DEV) {
    console.log('[Web Vitals → GTM]', {
      name: metric.name,
      value: Math.round(metric.value),
      rating: metric.rating,
      id: metric.id,
    });
  }
}

/**
 * Send metric to Google Analytics 4 (alternative to GTM)
 */
function sendToGA4(metric: Metric): void {
  if (typeof (window as any).gtag === 'undefined') return;

  const gtag = (window as any).gtag;

  gtag('event', metric.name, {
    value: Math.round(metric.value),
    metric_id: metric.id,
    metric_rating: metric.rating,
    metric_delta: Math.round(metric.delta),
    event_category: 'Web Vitals',
    event_label: metric.id,
    non_interaction: true,
  });
}

/**
 * Initialize Web Vitals tracking
 */
export async function initWebVitals(): Promise<void> {
  // Only run in production
  if (!import.meta.env.PROD) {
    console.log('[Web Vitals] Skipping in development mode');
    return;
  }

  try {
    // Dynamic import to avoid bundling in non-production builds
    const webVitals = await import('web-vitals');

    // Track Cumulative Layout Shift (CLS)
    // Measures visual stability - good < 0.1
    webVitals.onCLS(sendToGTM);

    // Track Largest Contentful Paint (LCP)
    // Measures loading performance - good < 2.5s
    webVitals.onLCP(sendToGTM);

    // Track Interaction to Next Paint (INP)
    // Measures overall responsiveness - good < 200ms
    webVitals.onINP(sendToGTM);

    // Track First Contentful Paint (FCP)
    // Measures perceived loading speed - good < 1.8s
    webVitals.onFCP(sendToGTM);

    // Track Time to First Byte (TTFB)
    // Measures server response time - good < 800ms
    webVitals.onTTFB(sendToGTM);

    console.log('[Web Vitals] Monitoring initialized');
  } catch (error) {
    console.error('[Web Vitals] Failed to initialize:', error);
  }
}

/**
 * Initialize with alternative analytics (Google Analytics 4)
 */
export async function initWebVitalsWithGA4(): Promise<void> {
  if (!import.meta.env.PROD) return;

  try {
    const webVitals = await import('web-vitals');

    const sendToBoth = (metric: Metric) => {
      sendToGTM(metric);
      sendToGA4(metric);
    };

    webVitals.onCLS(sendToBoth);
    webVitals.onLCP(sendToBoth);
    webVitals.onINP(sendToBoth);
    webVitals.onFCP(sendToBoth);
    webVitals.onTTFB(sendToBoth);
  } catch (error) {
    console.error('[Web Vitals] Failed to initialize:', error);
  }
}

/**
 * Get current web vitals snapshot (for debugging)
 */
export async function getWebVitalsSnapshot(): Promise<Record<string, number>> {
  try {
    const webVitals = await import('web-vitals');
    const snapshot: Record<string, number> = {};

    webVitals.onCLS(m => (snapshot.CLS = m.value), { reportAllChanges: true });
    webVitals.onLCP(m => (snapshot.LCP = m.value), { reportAllChanges: true });
    webVitals.onINP(m => (snapshot.INP = m.value), { reportAllChanges: true });
    webVitals.onFCP(m => (snapshot.FCP = m.value), { reportAllChanges: true });
    webVitals.onTTFB(m => (snapshot.TTFB = m.value), { reportAllChanges: true });

    return snapshot;
  } catch (error) {
    console.error('[Web Vitals] Failed to get snapshot:', error);
    return {};
  }
}

/**
 * Report web vitals for specific navigation
 * 
 * Usage in browser console:
 * import('./lib/web-vitals').then(m => m.reportWebVitals())
 */
export async function reportWebVitals(): Promise<void> {
  const snapshot = await getWebVitalsSnapshot();
  console.table(snapshot);
}

/**
 * Helper to send custom performance events to GTM
 * 
 * @example
 * sendPerformanceEvent('resource_timing', {
 *   resource_name: 'hero-image.jpg',
 *   duration: 234,
 *   size: 45678
 * });
 */
export function sendPerformanceEvent(
  eventName: string,
  data: Record<string, any>
): void {
  if (!isGTMAvailable()) return;

  const dataLayer = (window as any).dataLayer;
  dataLayer.push({
    event: 'performance',
    performance_event: eventName,
    ...data,
  });
}

export default initWebVitals;
