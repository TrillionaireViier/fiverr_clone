// src/crawlers/threadCrawler.js
// ─────────────────────────────────────────────────────────────────────────────
// Scrapes a single Threads post and its replies via network interception.
// URL: https://www.threads.net/@<user>/post/<id>
// ─────────────────────────────────────────────────────────────────────────────
import { PlaywrightCrawler } from 'crawlee';
import { applyStealthHeaders, sleep } from '../utils/helpers.js';

const API_PATTERNS = ['/api/graphql', '/graphql/query', 'text_feed', 'reply', 'thread'];

function isThreadsApi(url) {
  return API_PATTERNS.some((p) => url.includes(p));
}

function extractPostNodes(node, found = []) {
  if (!node || typeof node !== 'object') return found;
  if (Array.isArray(node)) {
    for (const item of node) extractPostNodes(item, found);
    return found;
  }
  const hasPostShape =
    (node.pk || node.id) &&
    (node.caption !== undefined || node.text !== undefined || node.thread_items !== undefined);
  if (hasPostShape) found.push(node);
  for (const val of Object.values(node)) {
    if (val && typeof val === 'object') extractPostNodes(val, found);
  }
  return found;
}

function normaliseItem(node, type = 'post') {
  const items = node.thread_items ?? [node];
  return items.map((item) => {
    const post    = item.post ?? item;
    const media   = post.image_versions2?.candidates ?? [];
    const caption = post.caption?.text ?? post.text ?? '';
    const pk      = post.pk ?? post.id ?? '';
    const code    = post.code ?? post.shortcode ?? '';
    const ts      = post.taken_at ?? post.timestamp ?? null;
    const user    = post.user?.username ?? post.owner?.username ?? '';
    if (!pk && !caption) return null;
    return {
      type,
      postId:     pk?.toString() ?? '',
      code,
      url:        code && user ? `https://www.threads.net/@${user}/post/${code}` : '',
      author:     user,
      text:       caption,
      timestamp:  ts ? new Date(ts * 1000).toISOString() : '',
      likes:      post.like_count ?? 0,
      replies:    post.text_post_app_info?.direct_reply_count ?? post.reply_count ?? 0,
      reposts:    post.text_post_app_info?.repost_count ?? 0,
      imageUrls:  media.map((m) => m.url).slice(0, 3),
      hasMedia:   media.length > 0,
      replyToId:  post.text_post_app_info?.reply_to_author?.pk?.toString() ?? '',
    };
  }).filter(Boolean);
}

/**
 * Run the thread (single post + replies) crawler.
 * @param {object} config
 */
export async function runThreadCrawler(config) {
  const url = config.target.startsWith('http')
    ? config.target
    : `https://www.threads.net/@${config.target}`;

  const allItems   = new Map();
  let   mainPostId = null;

  const crawler = new PlaywrightCrawler({
    headless: config.headless,
    maxRequestsPerCrawl: 1,
    requestHandlerTimeoutSecs: 90,

    ...(config.proxyUrl ? { proxyConfiguration: { proxyUrls: [config.proxyUrl] } } : {}),
    browserPoolOptions: { useFingerprints: true },
    launchContext: {
      launchOptions: {
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled'],
      },
    },

    async requestHandler({ page, log }) {
      await applyStealthHeaders(page);
      await page.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => false });
        window.chrome = { runtime: {} };
      });

      const interceptedResponses = [];
      page.on('response', async (res) => {
        try {
          if (res.status() !== 200) return;
          if (!isThreadsApi(res.url())) return;
          const ct = res.headers()['content-type'] ?? '';
          if (!ct.includes('json')) return;
          const json = await res.json().catch(() => null);
          if (json) interceptedResponses.push(json);
        } catch {}
      });

      log.info(`🔍  Navigating to thread: ${url}`);
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
      await sleep(4000);

      // Scroll to load replies
      const targetScrolls = Math.max(3, Math.ceil(config.maxItems / 8));
      for (let i = 0; i < targetScrolls; i++) {
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await sleep(config.scrollDelay);
        while (interceptedResponses.length) {
          const data  = interceptedResponses.shift();
          const nodes = extractPostNodes(data);
          for (const node of nodes) {
            const posts = normaliseItem(node);
            for (const p of posts) {
              if (p.postId && !allItems.has(p.postId)) allItems.set(p.postId, p);
            }
          }
        }
      }

      await sleep(2000);
      for (const data of interceptedResponses) {
        const nodes = extractPostNodes(data);
        for (const node of nodes) {
          const posts = normaliseItem(node);
          for (const p of posts) {
            if (p.postId && !allItems.has(p.postId)) allItems.set(p.postId, p);
          }
        }
      }

      // Try to identify the main post from the URL
      const urlMatch = url.match(/\/post\/([^/?#]+)/);
      if (urlMatch) mainPostId = urlMatch[1];

      if (allItems.size === 0) {
        log.warning('⚠️  No data captured. Post may require login.');
        log.info('💡  Try: --no-headless to inspect.');
      }
      log.info(`📦  Total items: ${allItems.size}`);
    },
  });

  await crawler.run([url]);

  const all     = [...allItems.values()];
  const mainPost = mainPostId
    ? (all.find((p) => p.code === mainPostId) ?? all[0] ?? {})
    : (all[0] ?? {});
  const replies  = all
    .filter((p) => p.postId !== mainPost.postId)
    .slice(0, config.maxItems || Infinity);

  // Mark types
  if (mainPost.postId) mainPost.type = 'post';
  replies.forEach((r) => (r.type = 'reply'));

  return { post: mainPost, replies };
}
