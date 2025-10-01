export function insertAdUnit(container: Element, client: string, slot: string) {
  if (!container || !client || !slot) return;
  try {
    const existing = container.querySelector(
      `ins.adsbygoogle[data-ad-client="${client}"][data-ad-slot="${slot}"]`
    );
    if (existing) return;

    const ins = document.createElement('ins');
    ins.className = 'adsbygoogle';
    ins.style.display = 'block';
    ins.setAttribute('data-ad-client', client);
    ins.setAttribute('data-ad-slot', slot);
    ins.setAttribute('data-ad-format', 'auto');
    ins.setAttribute('data-full-width-responsive', 'true');

    container.appendChild(ins);
    // Initialize this unit
    (window as any).adsbygoogle = (window as any).adsbygoogle || [];
    (window as any).adsbygoogle.push({});
  } catch (e) {
    console.warn('AdSense insertAdUnit error:', e);
  }
}

export function insertPlaceholderUnit(container: Element, label?: string) {
  if (!container) return;
  // Prevent duplicate placeholder for end position
  const existing = container.querySelector(
    `.ad-placeholder[data-ad-pos="end"]`
  );
  if (existing) return;
  const box = document.createElement('div');
  box.className = 'ad-placeholder';
  box.setAttribute('data-ad-pos', 'end');
  box.textContent = label || 'Ad Placeholder';
  container.appendChild(box);
}

export function insertAdAfterMiddle(
  container: Element,
  client: string,
  slot: string
) {
  if (!container || !client || !slot) return;
  try {
    const candidates = Array.from(
      container.querySelectorAll(
        'p, h2, h3, ul, ol, pre, blockquote, figure, img'
      )
    );
    const n = candidates.length;
    const index = n > 4 ? Math.floor(n / 2) : Math.max(n - 1, 0);
    const ref = candidates[index];
    if (!ref || !ref.parentNode) {
      insertAdUnit(container, client, slot);
      return;
    }

    // Prevent duplicate for same slot
    const dup = container.querySelector(
      `ins.adsbygoogle[data-ad-client="${client}"][data-ad-slot="${slot}"]`
    );
    if (dup) return;

    const ins = document.createElement('ins');
    ins.className = 'adsbygoogle';
    ins.style.display = 'block';
    ins.setAttribute('data-ad-client', client);
    ins.setAttribute('data-ad-slot', slot);
    ins.setAttribute('data-ad-format', 'auto');
    ins.setAttribute('data-full-width-responsive', 'true');

    ref.parentNode.insertBefore(ins, ref.nextSibling);
    (window as any).adsbygoogle = (window as any).adsbygoogle || [];
    (window as any).adsbygoogle.push({});
  } catch (e) {
    console.warn('AdSense insertAdAfterMiddle error:', e);
  }
}

export function insertPlaceholderAfterMiddle(container: Element, label?: string) {
  if (!container) return;
  try {
    // Prevent duplicate placeholder for mid position
    const existing = container.querySelector(
      `.ad-placeholder[data-ad-pos="mid"]`
    );
    if (existing) return;
    const candidates = Array.from(
      container.querySelectorAll(
        'p, h2, h3, ul, ol, pre, blockquote, figure, img'
      )
    );
    const n = candidates.length;
    const index = n > 4 ? Math.floor(n / 2) : Math.max(n - 1, 0);
    const ref = candidates[index];
    const box = document.createElement('div');
    box.className = 'ad-placeholder';
    box.setAttribute('data-ad-pos', 'mid');
    box.textContent = label || 'Ad Placeholder';
    if (!ref || !ref.parentNode) {
      container.appendChild(box);
    } else {
      ref.parentNode.insertBefore(box, ref.nextSibling);
    }
  } catch (e) {
    console.warn('AdSense insertPlaceholderAfterMiddle error:', e);
  }
}

export function autoInitBlogAds(
  client: string,
  slotMid?: string,
  slotEnd?: string
) {
  const prose = document.getElementById('blog-content');
  if (!prose) return;
  if (slotMid) insertAdAfterMiddle(prose, client, slotMid);
  if (slotEnd) insertAdUnit(prose, client, slotEnd);
}

export function autoInitBlogPlaceholders() {
  const prose = document.getElementById('blog-content');
  if (!prose) return;
  insertPlaceholderAfterMiddle(prose, 'Ad Placeholder (mid)');
  insertPlaceholderUnit(prose, 'Ad Placeholder (end)');
}

export function autoInitDownloadAds(
  client: string,
  slotMid?: string,
  slotEnd?: string
) {
  const container = document.getElementById('download-content');
  if (!container) return;
  if (slotMid) insertAdAfterMiddle(container, client, slotMid);
  if (slotEnd) insertAdUnit(container, client, slotEnd);
}

export function autoInitDownloadPlaceholders() {
  const container = document.getElementById('download-content');
  if (!container) return;
  insertPlaceholderAfterMiddle(container, 'Ad Placeholder (mid)');
  insertPlaceholderUnit(container, 'Ad Placeholder (end)');
}
