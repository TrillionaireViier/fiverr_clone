// src/crawlers/profileCrawler.js
// ─────────────────────────────────────────────────────────────────────────────
// Strategy: intercept Threads' internal GraphQL API responses instead of
// parsing DOM directly. This bypasses the login-wall that blocks DOM content.
//
// Threads fires API calls to:
//   https://www.threads.net/api/graphql
//   https://www.threads.net/ajax/bulk-route-definitions/
//   https://i.instagram.com/api/v1/text_feed/...
// We capture all JSON responses and extract post payloads from them.
// ─────────────────────────────────────────────────────────────────────────────
import { PlaywrightCrawler } from 'crawlee';
import { applyStealthHeaders, sleep, profileUrl } from '../utils/helpers.js';

// ── API URL patterns we want to intercept ─────────────────────────────────────
const API_PATTERNS = [
  '/api/graphql',
  '/graphql/query',
  'text_feed',
  'threads_timeline',
  'user_threads',
  '/threads/',
];

/**
 * Check if a response URL looks like a Threads data API endpoint.
 * @param {string} url
 */
function isThreadsApi(url) {
  return API_PATTERNS.some((p) => url.includes(p));
}

/**
 * Recursively walk a JSON tree looking for objects that look like thread posts.
 * Threads' GraphQL wraps posts in various shapes; this handles the most common ones.
 * @param {any}   node
 * @param {any[]} found  – collector array (mutated in place)
 */
function extractPostNodes(node, found = []) {
  if (!node || typeof node !== 'object') return found;

  if (Array.isArray(node)) {
    for (const item of node) extractPostNodes(item, found);
    return found;
  }

  // A "thread" or "post" node typically has these fields
  const hasPostShape =
    (node.pk || node.id) &&
    (node.caption !== undefined ||
      node.text !== undefined ||
      node.thread_items !== undefined);

  if (hasPostShape) found.push(node);

  for (const val of Object.values(node)) {
    if (val && typeof val === 'object') extractPostNodes(val, found);
  }
  return found;
}

/**
 * Normalise a raw API node into a clean post record.
 * @param {any} node
 * @param {string} username
 */
function normalisePost(node, username) {
  // thread_items wraps individual posts inside a thread container
  const items = node.thread_items ?? [node];

  return items
    .map((item) => {
      const post   = item.post ?? item;
      const media  = post.image_versions2?.candidates ?? [];
      const caption= post.caption?.text ?? post.text ?? '';
      const pk     = post.pk ?? post.id ?? '';
      const code   = post.code ?? post.shortcode ?? '';
      const ts     = post.taken_at ?? post.timestamp ?? null;
      const user   = post.user?.username ?? post.owner?.username ?? username;

      if (!pk && !caption) return null;

      return {
        postId:     pk?.toString() ?? '',
        code,
        url:        code ? `https://www.threads.net/@${user}/post/${code}` : '',
        author:     user,
        text:       caption,
        timestamp:  ts ? new Date(ts * 1000).toISOString() : '',
        likes:      post.like_count ?? post.likes_count ?? 0,
        replies:    post.text_post_app_info?.direct_reply_count ?? post.reply_count ?? 0,
        reposts:    post.text_post_app_info?.repost_count ?? 0,
        quoteCount: post.text_post_app_info?.quote_count ?? 0,
        imageUrls:  media.map((m) => m.url).slice(0, 3),
        hasMedia:   media.length > 0,
        isRepost:   !!(post.text_post_app_info?.is_post_unavailable === false &&
                       post.original_media_id),
      };
    })
    .filter(Boolean);
}

/**
 * Fallback DOM extraction when API interception yields nothing.
 * Uses more precise selectors to avoid picking up header/nav elements.
 * @param {import('playwright').Page} page
 * @param {string} username
 */
/** Strip relative-time prefixes ("2d ", "5h ") and trailing engagement counts ("1.2K 44 12 5") */
function cleanText(raw = '') {
  return raw
    .replace(/^\d+[smhdw]\s+/i, '')          // strip leading "3d ", "5h ", etc.
    .replace(/(\s+\d[\d.,KMB]*){2,}\s*$/i, '') // strip trailing "4.9K 440 296 132"
    .trim();
}

async function domFallback(page, username) {
  return page.evaluate((uname) => {
    /** Strip leading relative time and trailing engagement numbers */
    function cleanText(raw) {
      return raw
        .replace(/^\d+[smhdw]\s+/i, '')
        .replace(/(\s+\d[\d.,KMkMB]*){2,}\s*$/i, '')
        .trim();
    }
    // Only grab cards that contain a /post/ link — those are actual posts
    const allLinks = [...document.querySelectorAll('a[href*="/post/"]')];
    const postIds  = new Set();
    const results  = [];

    for (const link of allLinks) {
      const postUrl = link.href ?? '';
      const postId  = postUrl.match(/\/post\/([^/?#]+)/)?.[1] ?? '';
      if (!postId || postIds.has(postId)) continue;
      postIds.add(postId);

      // Walk up to find the containing card element
      let card = link;
      for (let i = 0; i < 8; i++) {
        card = card.parentElement;
        if (!card) break;
        if (card.tagName === 'ARTICLE' || card.getAttribute('data-pressable-container') === 'true') break;
      }
      if (!card) continue;

      // Get post text — prefer longer spans (exclude username spans which are short)
      const spans = [...card.querySelectorAll('span[dir="auto"]')]
        .map((s) => s.innerText?.trim() ?? '')
        .filter((t) => t.length > 1 && t !== uname);   // skip spans that are just the username
      const text = spans.join(' ').trim();

      const timeEl = card.querySelector('time');
      const images = [...card.querySelectorAll('img[src*="cdninstagram"],img[src*="fbcdn"]')]
        .filter((img) => {
          // Skip tiny avatar images (usually < 200px in src URL)
          const src = img.src ?? '';
          return src.includes('t51.71878') || src.includes('t51.2885');
        })
        .map((img) => img.src);

      // Must have either real text content or media
      if (!text && !images.length) continue;

      results.push({
        postId, code: postId,
        url: postUrl,
        author: uname,
        text,
        timestamp: timeEl?.getAttribute('datetime') ?? '',
        likes: 0, replies: 0, reposts: 0, quoteCount: 0,
        imageUrls: images, hasMedia: images.length > 0, isRepost: false,
      });
    }
    return results;
  }, username);
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Run the profile crawler.
 *
 * @param {object} config
 * @param {string}  config.target
 * @param {number}  config.maxItems
 * @param {boolean} config.headless
 * @param {number}  config.scrollDelay
 * @param {string|null} config.proxyUrl
 * @returns {{ profile: object, posts: any[] }}
 */
export async function runProfileCrawler(config) {
  const username = config.target.replace(/^@/, '');
  const url      = profileUrl(username);

  const collectedPosts   = new Map();  // dedup by postId
  let   profileMeta      = { username, url, scrapedAt: new Date().toISOString() };

  const crawler = new PlaywrightCrawler({
    headless: config.headless,
    maxRequestsPerCrawl: 1,
    requestHandlerTimeoutSecs: 90,

    ...(config.proxyUrl ? { proxyConfiguration: { proxyUrls: [config.proxyUrl] } } : {}),

    browserPoolOptions: { useFingerprints: true },

    launchContext: {
      launchOptions: {
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-blink-features=AutomationControlled',
          '--disable-web-security',
        ],
      },
    },

    async requestHandler({ page, log }) {
      await applyStealthHeaders(page);
      await page.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => false });
        window.chrome = { runtime: {} };
      });

      // ── 1. Wire up API response interceptor BEFORE navigation ─────────────
      const interceptedResponses = [];

      page.on('response', async (res) => {
        try {
          const resUrl  = res.url();
          const status  = res.status();
          if (status !== 200) return;
          if (!isThreadsApi(resUrl)) return;

          const ct = res.headers()['content-type'] ?? '';
          if (!ct.includes('json')) return;

          const json = await res.json().catch(() => null);
          if (json) interceptedResponses.push(json);
        } catch { /* ignore response parse errors */ }
      });

      // ── 2. Navigate ────────────────────────────────────────────────────────
      log.info(`🔍  Navigating to ${url}`);
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });

      // Give React time to fire its API calls
      await sleep(4000);

      // ── 3. Scroll to trigger more API calls ───────────────────────────────
      const targetScrolls = Math.max(3, Math.ceil(config.maxItems / 8));
      for (let i = 0; i < targetScrolls; i++) {
        if (collectedPosts.size >= config.maxItems) break;
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await sleep(config.scrollDelay);

        // Process any newly intercepted responses
        while (interceptedResponses.length) {
          const data  = interceptedResponses.shift();
          const nodes = extractPostNodes(data);
          for (const node of nodes) {
            const posts = normalisePost(node, username);
            for (const p of posts) {
              if (p.postId && !collectedPosts.has(p.postId)) {
                collectedPosts.set(p.postId, p);
              }
            }
          }
        }

        log.info(`  Scroll ${i + 1}/${targetScrolls} — captured ${collectedPosts.size} posts so far`);
      }

      // Final drain of any remaining buffered responses
      await sleep(2000);
      for (const data of interceptedResponses) {
        const nodes = extractPostNodes(data);
        for (const node of nodes) {
          const posts = normalisePost(node, username);
          for (const p of posts) {
            if (p.postId && !collectedPosts.has(p.postId)) {
              collectedPosts.set(p.postId, p);
            }
          }
        }
      }

      // ── 4. Extract profile metadata from the page ─────────────────────────
      const meta = await page.evaluate(() => {
        const nameEl      = document.querySelector('h1, [data-testid="username"]');
        const bioEl       = document.querySelector('[data-testid="user-bio"]');
        const followersEl = document.querySelector('a[href*="followers"] span');
        const avatarEl    = document.querySelector('header img, [data-testid="user-avatar"]');
        return {
          displayName: nameEl?.innerText?.trim()      ?? '',
          bio:         bioEl?.innerText?.trim()        ?? '',
          followersRaw:followersEl?.innerText?.trim()  ?? '',
          avatar:      avatarEl?.src                   ?? '',
        };
      });
      profileMeta = { ...profileMeta, ...meta };
      log.info(`👤  ${meta.displayName || username} | Followers: ${meta.followersRaw || 'N/A'}`);

      // ── 5. DOM fallback if API interception yielded nothing ───────────────
      if (collectedPosts.size === 0) {
        log.warning('⚠️  API interception yielded 0 posts. Trying DOM fallback…');
        const domPosts = await domFallback(page, username);
        for (const p of domPosts) {
          if (!collectedPosts.has(p.postId)) collectedPosts.set(p.postId, p);
        }
        if (domPosts.length === 0) {
          log.warning('⚠️  DOM fallback also empty. Threads may require login for this profile.');
          log.info('💡  Tip: Run with --no-headless to inspect what the browser sees.');
        }
      }

      log.info(`📦  Total collected: ${collectedPosts.size} posts.`);
    },
  });

  await crawler.run([url]);

  const posts = [...collectedPosts.values()]
    .slice(0, config.maxItems || Infinity);

  return { profile: profileMeta, posts };
}
