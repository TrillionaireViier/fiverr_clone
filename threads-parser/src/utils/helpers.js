// src/utils/helpers.js
// ─────────────────────────────────────────────────────────────────────────────
// Shared utilities: sleep, stealth headers, scrolling helpers.
// ─────────────────────────────────────────────────────────────────────────────

/** Pause execution for `ms` milliseconds. */
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Inject stealth HTTP headers so requests look like a real Chrome browser.
 * @param {import('playwright').Page} page
 */
export async function applyStealthHeaders(page) {
  await page.setExtraHTTPHeaders({
    'accept-language':             'en-US,en;q=0.9',
    'sec-ch-ua':                   '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
    'sec-ch-ua-mobile':            '?0',
    'sec-ch-ua-platform':          '"macOS"',
    'sec-fetch-dest':              'document',
    'sec-fetch-mode':              'navigate',
    'sec-fetch-site':              'none',
    'sec-fetch-user':              '?1',
    'upgrade-insecure-requests':   '1',
  });
}

/**
 * Scroll to the bottom of the page incrementally, waiting for new content.
 * @param {import('playwright').Page} page
 * @param {object} opts
 * @param {number} opts.maxScrolls   – stop after this many scroll steps
 * @param {number} opts.delay        – ms between scrolls
 * @param {() => Promise<number>} opts.itemCount – async fn returning current item count
 * @param {number} opts.maxItems     – stop when count reaches this
 */
export async function infiniteScroll(page, { maxScrolls = 30, delay = 1200, itemCount, maxItems = Infinity }) {
  let previousHeight = 0;
  let noChangeCount  = 0;

  for (let i = 0; i < maxScrolls; i++) {
    const currentCount = await itemCount();
    if (currentCount >= maxItems) break;

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await sleep(delay);

    const newHeight = await page.evaluate(() => document.body.scrollHeight);
    if (newHeight === previousHeight) {
      noChangeCount++;
      if (noChangeCount >= 3) break; // page truly ended
    } else {
      noChangeCount = 0;
    }
    previousHeight = newHeight;
  }
}

/**
 * Wait for a selector to appear, return null if it never does (instead of throwing).
 * @param {import('playwright').Page} page
 * @param {string} selector
 * @param {number} timeout
 */
export async function waitForOptional(page, selector, timeout = 5000) {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch {
    return false;
  }
}

/**
 * Safely grab innerText from the first matching element, or return fallback.
 * @param {import('playwright').Page|import('playwright').ElementHandle} ctx
 * @param {string} selector
 * @param {string} fallback
 */
export async function safeText(ctx, selector, fallback = '') {
  try {
    return (await ctx.$eval(selector, (el) => el.innerText.trim())) ?? fallback;
  } catch {
    return fallback;
  }
}

/**
 * Safely grab an attribute value, or return fallback.
 */
export async function safeAttr(ctx, selector, attr, fallback = '') {
  try {
    return (await ctx.$eval(selector, (el, a) => el.getAttribute(a), attr)) ?? fallback;
  } catch {
    return fallback;
  }
}

/** Parse a compact number string like "1.2K" → 1200, "3.4M" → 3400000. */
export function parseCompactNumber(str = '') {
  if (!str) return 0;
  const s = str.trim().replace(/,/g, '');
  const n = parseFloat(s);
  if (s.endsWith('K') || s.endsWith('k')) return Math.round(n * 1_000);
  if (s.endsWith('M') || s.endsWith('m')) return Math.round(n * 1_000_000);
  if (s.endsWith('B') || s.endsWith('b')) return Math.round(n * 1_000_000_000);
  return isNaN(n) ? 0 : Math.round(n);
}

/** Build a Threads profile URL from a username (with or without @). */
export function profileUrl(username) {
  const u = username.replace(/^@/, '');
  return `https://www.threads.net/@${u}`;
}

/** Build a Threads hashtag URL. */
export function hashtagUrl(tag) {
  const t = tag.replace(/^#/, '');
  return `https://www.threads.net/tag/${t}`;
}
