// src/crawlers/hashtagCrawler.js
// ─────────────────────────────────────────────────────────────────────────────
// Strategy: intercept Threads' internal GraphQL/REST API responses.
// URL: https://www.threads.net/tag/<hashtag>
// ─────────────────────────────────────────────────────────────────────────────
import { PlaywrightCrawler } from 'crawlee';
import { applyStealthHeaders, sleep, hashtagUrl } from '../utils/helpers.js';

const API_PATTERNS = ['/api/graphql', '/graphql/query', 'text_feed', 'hashtag', 'tag_feed'];

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

function normalisePost(node, hashtag) {
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
      hashtag,
    };
  }).filter(Boolean);
}

/**
 * Run the hashtag crawler.
 * @param {object} config
 */
export async function runHashtagCrawler(config) {
  const tag         = config.target.replace(/^#/, '');
  const url         = hashtagUrl(tag);
  const collectedPosts = new Map();

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

      log.info(`🔍  Navigating to hashtag page: ${url}`);
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
      await sleep(4000);

      const targetScrolls = Math.max(3, Math.ceil(config.maxItems / 8));
      for (let i = 0; i < targetScrolls; i++) {
        if (collectedPosts.size >= config.maxItems) break;
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await sleep(config.scrollDelay);

        while (interceptedResponses.length) {
          const data  = interceptedResponses.shift();
          const nodes = extractPostNodes(data);
          for (const node of nodes) {
            const posts = normalisePost(node, tag);
            for (const p of posts) {
              if (p.postId && !collectedPosts.has(p.postId)) collectedPosts.set(p.postId, p);
            }
          }
        }
        log.info(`  Scroll ${i + 1}/${targetScrolls} — captured ${collectedPosts.size} posts`);
      }

      await sleep(2000);
      for (const data of interceptedResponses) {
        const nodes = extractPostNodes(data);
        for (const node of nodes) {
          const posts = normalisePost(node, tag);
          for (const p of posts) {
            if (p.postId && !collectedPosts.has(p.postId)) collectedPosts.set(p.postId, p);
          }
        }
      }

      if (collectedPosts.size === 0) {
        log.warning('⚠️  No posts captured from API. Hashtag may require login or not exist.');
        log.info('💡  Try: --no-headless to see what the browser shows.');
      }
      log.info(`📦  Total: ${collectedPosts.size} posts for #${tag}`);
    },
  });

  await crawler.run([url]);
  return [...collectedPosts.values()].slice(0, config.maxItems || Infinity);
}
