# 🧵 Threads Parser

A production-ready **Threads.net scraper** built with [Crawlee](https://crawlee.dev/) + [Playwright](https://playwright.dev/).

## Features

| Mode | What it scrapes |
|------|----------------|
| `profile` | Bio, followers, and all posts for a user |
| `hashtag` | All posts under a topic/hashtag |
| `thread`  | A single post + all its replies |

- ✅ Infinite scroll support (auto-loads more content)
- ✅ Export to **JSON** and/or **CSV**
- ✅ Stealth browser mode (fingerprint randomisation, no webdriver flag)
- ✅ Optional proxy support
- ✅ Configurable via `.env` or CLI flags

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Install Playwright browsers (one-time)
npx playwright install chromium

# 3. Copy the env template
cp .env.example .env

# 4. Run!
node src/main.js --mode=profile --target=zuck --max=50
```

---

## Usage

```
Usage: threads-parser [options]

Options:
  -m, --mode <mode>      Scrape mode: profile | hashtag | thread  (default: "profile")
  -t, --target <value>   Username, hashtag, or full post URL
  -n, --max <number>     Max items to collect                      (default: 50)
  -f, --format <fmt>     Output format: json | csv | both          (default: "both")
  -o, --output <dir>     Output directory                          (default: "./output")
  --no-headless          Show browser window (useful for debugging)
  --proxy <url>          Proxy URL e.g. http://user:pass@host:port
  --delay <ms>           Scroll delay in ms                        (default: 1200)
  -V, --version          output the version number
  -h, --help             display help
```

### Examples

```bash
# Profile: collect up to 100 posts from @zuck
node src/main.js --mode=profile --target=zuck --max=100

# Hashtag: scrape posts tagged #technology, JSON only
node src/main.js --mode=hashtag --target=technology --max=75 --format=json

# Thread: scrape a specific post + all replies
node src/main.js --mode=thread --target=https://www.threads.net/@zuck/post/XXXXX

# Show browser window for debugging
node src/main.js --mode=profile --target=zuck --no-headless

# Use a proxy
node src/main.js --mode=hashtag --target=ai --proxy=http://user:pass@proxy.example.com:8080
```

---

## Output

Results are saved to `./output/` by default:

| Mode | Files created |
|------|--------------|
| `profile` | `profile_<username>_<ts>.json/csv` + `posts_<username>_<ts>.json/csv` |
| `hashtag` | `hashtag_<tag>_<ts>.json/csv` |
| `thread`  | `thread_post_<ts>.json/csv` + `thread_replies_<ts>.json/csv` |

### Post record shape

```json
{
  "postId":    "Cxxxxxxx",
  "url":       "https://www.threads.net/@zuck/post/Cxxxxxxx",
  "author":    "zuck",
  "text":      "Post content here…",
  "timestamp": "2025-01-01T12:00:00.000Z",
  "likes":     42000,
  "replies":   3800,
  "imageUrls": ["https://cdn..."],
  "hasMedia":  true
}
```

---

## Notes

- Threads requires **no login** for public profiles and hashtag pages.
- If you see `⚠️ Feed not detected`, the page may have hit a rate limit — try adding `--delay=2000` or a proxy.
- For very large collections (500+), consider running multiple sessions with different proxies.

## Tech Stack

- [Crawlee](https://crawlee.dev/) — crawler framework
- [Playwright](https://playwright.dev/) — headless browser
- [Commander.js](https://github.com/tj/commander.js) — CLI parsing
- [csv-writer](https://github.com/ryu1kn/csv-writer) — CSV export
