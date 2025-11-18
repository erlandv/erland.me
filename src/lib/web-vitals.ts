/**
 * Web Vitals Monitoring
 *
 * Tracks Core Web Vitals and sends them to Google Tag Manager for analysis.
 * Metrics tracked: CLS, LCP, INP, FCP, TTFB
 *
 * Only runs in production to avoid polluting analytics with dev data.
 */

import type { Metric } from 'web-vitals';
import { createLogger } from './logger';

const log = createLogger('WebVitals');

interface GTMDataLayer {
  push(data: Record<string, unknown>): void;
}

interface WindowWithGTM extends Window {
  dataLayer?: GTMDataLayer;
  gtag?: (
    type: string,
    eventName: string,
    params: Record<string, unknown>
  ) => void;
}

/**
 * Check if Google Tag Manager dataLayer is available
 * Verifies window object and dataLayer presence for safe GTM integration
 * @returns True if GTM dataLayer exists and is ready to receive events
 */
function isGTMAvailable(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof (window as WindowWithGTM).dataLayer !== 'undefined'
  );
}

/**
 * Send web vitals metric to Google Tag Manager
 * Pushes structured event data to GTM dataLayer with metric details
 * Falls back to debug logging if GTM unavailable
 * @param metric - Web vitals metric from web-vitals library
 */
function sendToGTM(metric: Metric): void {
  if (!isGTMAvailable()) {
    log.debug(`${metric.name}: ${Math.round(metric.value)}`, {
      rating: metric.rating,
      delta: metric.delta,
    });
    return;
  }

  const w = window as WindowWithGTM;
  const dataLayer = w.dataLayer;

  if (!dataLayer) return;

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

  log.debug(`Sent to GTM: ${metric.name}`, {
    value: Math.round(metric.value),
    rating: metric.rating,
    id: metric.id,
  });
}

/**
 * Send web vitals metric to Google Analytics 4
 * Alternative to GTM for direct GA4 integration using gtag API
 * @param metric - Web vitals metric from web-vitals library
 */
function sendToGA4(metric: Metric): void {
  const w = window as WindowWithGTM;
  if (!w.gtag) return;

  const gtag = w.gtag;

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
 * Initialize Core Web Vitals monitoring
 *
 * Tracks 5 key performance metrics and sends to GTM:
 * - **CLS** (Cumulative Layout Shift): Visual stability - good < 0.1
 * - **LCP** (Largest Contentful Paint): Loading performance - good < 2.5s
 * - **INP** (Interaction to Next Paint): Overall responsiveness - good < 200ms
 * - **FCP** (First Contentful Paint): Perceived loading speed - good < 1.8s
 * - **TTFB** (Time to First Byte): Server response time - good < 800ms
 *
 * Only runs in production builds to avoid polluting analytics with dev data.
 * Uses dynamic import to avoid bundling web-vitals in development.
 *
 * @example
 * // In CriticalInit.astro or app entry point
 * import { initWebVitals } from './lib/web-vitals';
 * initWebVitals();
 */
export async function initWebVitals(): Promise<void> {
  // Only run in production
  if (!import.meta.env.PROD) {
    log.info('Skipping in development mode');
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

    log.info('Monitoring initialized');
  } catch (error) {
    log.error('Failed to initialize', error);
  }
}

/**
 * Initialize web vitals monitoring with dual GTM + GA4 tracking
 * Sends metrics to both Google Tag Manager and Google Analytics 4 simultaneously
 * @example
 * // For dual analytics setup
 * initWebVitalsWithGA4();
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
    log.error('Failed to initialize', error);
  }
}

/**
 * Get current web vitals snapshot for debugging
 * Captures all 5 core metrics with reportAllChanges enabled
 * @returns Object with metric names as keys and current values
 * @example
 * const snapshot = await getWebVitalsSnapshot();
 * console.log('CLS:', snapshot.CLS);
 * console.log('LCP:', snapshot.LCP);
 */
export async function getWebVitalsSnapshot(): Promise<Record<string, number>> {
  try {
    const webVitals = await import('web-vitals');
    const snapshot: Record<string, number> = {};

    webVitals.onCLS(m => (snapshot.CLS = m.value), { reportAllChanges: true });
    webVitals.onLCP(m => (snapshot.LCP = m.value), { reportAllChanges: true });
    webVitals.onINP(m => (snapshot.INP = m.value), { reportAllChanges: true });
    webVitals.onFCP(m => (snapshot.FCP = m.value), { reportAllChanges: true });
    webVitals.onTTFB(m => (snapshot.TTFB = m.value), {
      reportAllChanges: true,
    });

    return snapshot;
  } catch (error) {
    log.error('Failed to get snapshot', error);
    return {};
  }
}

/**
 * Report current web vitals to browser console as formatted table
 * Useful for debugging performance in production or development
 * @example
 * // In browser console
 * import('./lib/web-vitals').then(m => m.reportWebVitals())
 * // Outputs formatted table with all metrics
 */
export async function reportWebVitals(): Promise<void> {
  const snapshot = await getWebVitalsSnapshot();
  console.table(snapshot);
}

/**
 * Send custom performance event to Google Tag Manager
 * Useful for tracking non-standard metrics or resource timings
 * @param eventName - Custom event name for GTM event tracking
 * @param data - Additional data to attach to the performance event
 * @example
 * sendPerformanceEvent('resource_timing', {
 *   resource_name: 'hero-image.jpg',
 *   duration: 234,
 *   size: 45678
 * });
 */
export function sendPerformanceEvent(
  eventName: string,
  data: Record<string, unknown>
): void {
  if (!isGTMAvailable()) return;

  const w = window as WindowWithGTM;
  const dataLayer = w.dataLayer;
  if (!dataLayer) return;

  dataLayer.push({
    event: 'performance',
    performance_event: eventName,
    ...data,
  });
}

export default initWebVitals;
