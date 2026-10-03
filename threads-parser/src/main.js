#!/usr/bin/env node
// src/main.js
// ─────────────────────────────────────────────────────────────────────────────
// CLI entry point for the Threads Parser.
//
// Usage examples:
//   node src/main.js --mode=profile  --target=zuck        --max=100
//   node src/main.js --mode=hashtag  --target=technology  --max=50
//   node src/main.js --mode=thread   --target=https://www.threads.net/@zuck/post/XXXXX
//   node src/main.js --mode=profile  --target=zuck  --format=json --no-headless
// ─────────────────────────────────────────────────────────────────────────────
import { program } from 'commander';
import chalk       from 'chalk';
import ora         from 'ora';
import path        from 'path';

import { buildConfig }       from './config.js';
import { runProfileCrawler } from './crawlers/profileCrawler.js';
import { runHashtagCrawler } from './crawlers/hashtagCrawler.js';
import { runThreadCrawler }  from './crawlers/threadCrawler.js';
import { saveResults }       from './utils/export.js';

// ── CLI definition ────────────────────────────────────────────────────────────
program
  .name('threads-parser')
  .description('Threads.net scraper — profile, hashtag, or single thread')
  .version('1.0.0')
  .option('-m, --mode <mode>',    'Scrape mode: profile | hashtag | thread', 'profile')
  .option('-t, --target <value>', 'Username (@), hashtag (#), or full post URL')
  .option('-n, --max <number>',   'Max items to collect',  (v) => parseInt(v), 50)
  .option('-f, --format <fmt>',   'Output format: json | csv | both',  'both')
  .option('-o, --output <dir>',   'Output directory',      './output')
  .option('--no-headless',        'Show browser window (useful for debugging)')
  .option('--proxy <url>',        'Proxy URL (e.g. http://user:pass@host:port)')
  .option('--delay <ms>',         'Scroll delay in ms',    (v) => parseInt(v), 1200)
  .parse(process.argv);

const opts = program.opts();

// ── Banner ────────────────────────────────────────────────────────────────────
console.log(chalk.bold.cyan('\n  ┌─────────────────────────────────┐'));
console.log(chalk.bold.cyan('  │       🧵  Threads Parser         │'));
console.log(chalk.bold.cyan('  └─────────────────────────────────┘\n'));

// ── Build merged config ───────────────────────────────────────────────────────
const config = buildConfig({
  mode:         opts.mode,
  target:       opts.target,
  maxItems:     opts.max,
  outputFormat: opts.format,
  outputDir:    path.resolve(opts.output),
  headless:     opts.headless,
  proxyUrl:     opts.proxy,
  scrollDelay:  opts.delay,
});

// ── Validate ──────────────────────────────────────────────────────────────────
if (!config.target) {
  console.error(chalk.red('❌  --target is required.\n'));
  console.log(chalk.gray('  Examples:'));
  console.log(chalk.gray('    --mode=profile  --target=zuck'));
  console.log(chalk.gray('    --mode=hashtag  --target=technology'));
  console.log(chalk.gray('    --mode=thread   --target=https://www.threads.net/@zuck/post/XXXXX\n'));
  process.exit(1);
}

const VALID_MODES = ['profile', 'hashtag', 'thread'];
if (!VALID_MODES.includes(config.mode)) {
  console.error(chalk.red(`❌  Unknown mode "${config.mode}". Use: ${VALID_MODES.join(' | ')}\n`));
  process.exit(1);
}

// ── Print settings ────────────────────────────────────────────────────────────
console.log(chalk.bold('  Settings:'));
console.log(`  ${chalk.gray('Mode:')}       ${chalk.yellow(config.mode)}`);
console.log(`  ${chalk.gray('Target:')}     ${chalk.yellow(config.target)}`);
console.log(`  ${chalk.gray('Max items:')}  ${chalk.yellow(config.maxItems)}`);
console.log(`  ${chalk.gray('Format:')}     ${chalk.yellow(config.outputFormat)}`);
console.log(`  ${chalk.gray('Output:')}     ${chalk.yellow(config.outputDir)}`);
console.log(`  ${chalk.gray('Headless:')}   ${chalk.yellow(config.headless)}`);
if (config.proxyUrl) console.log(`  ${chalk.gray('Proxy:')}      ${chalk.yellow(config.proxyUrl)}`);
console.log();

// ── Run ───────────────────────────────────────────────────────────────────────
const spinner = ora({ text: 'Starting crawler…', color: 'cyan' }).start();

try {
  const ts       = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const safeName = config.target.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 60);

  // ── PROFILE ─────────────────────────────────────────────────────────────────
  if (config.mode === 'profile') {
    spinner.text = `Crawling profile @${config.target}…`;
    const { profile, posts } = await runProfileCrawler(config);
    spinner.succeed(chalk.green(`Done! Collected ${posts.length} posts.`));

    // Save profile metadata separately
    const profileFile = `profile_${safeName}_${ts}`;
    const postsFile   = `posts_${safeName}_${ts}`;

    await saveResults({
      outputDir: config.outputDir,
      filename:  profileFile,
      records:   [profile],
      format:    config.outputFormat,
      log:       (msg) => console.log('  ' + msg),
    });

    await saveResults({
      outputDir: config.outputDir,
      filename:  postsFile,
      records:   posts,
      format:    config.outputFormat,
      log:       (msg) => console.log('  ' + msg),
    });

  // ── HASHTAG ──────────────────────────────────────────────────────────────────
  } else if (config.mode === 'hashtag') {
    const tag = config.target.replace(/^#/, '');
    spinner.text = `Crawling hashtag #${tag}…`;
    const posts = await runHashtagCrawler(config);
    spinner.succeed(chalk.green(`Done! Collected ${posts.length} posts.`));

    await saveResults({
      outputDir: config.outputDir,
      filename:  `hashtag_${tag}_${ts}`,
      records:   posts,
      format:    config.outputFormat,
      log:       (msg) => console.log('  ' + msg),
    });

  // ── THREAD ───────────────────────────────────────────────────────────────────
  } else if (config.mode === 'thread') {
    spinner.text = 'Crawling thread…';
    const { post, replies } = await runThreadCrawler(config);
    spinner.succeed(chalk.green(`Done! Post + ${replies.length} replies.`));

    const postFile    = `thread_post_${safeName}_${ts}`;
    const repliesFile = `thread_replies_${safeName}_${ts}`;

    await saveResults({
      outputDir: config.outputDir,
      filename:  postFile,
      records:   [post],
      format:    config.outputFormat,
      log:       (msg) => console.log('  ' + msg),
    });

    await saveResults({
      outputDir: config.outputDir,
      filename:  repliesFile,
      records:   replies,
      format:    config.outputFormat,
      log:       (msg) => console.log('  ' + msg),
    });
  }

  console.log(chalk.bold.green('\n  ✅  All done!\n'));

} catch (err) {
  spinner.fail(chalk.red('Crawler failed.'));
  console.error(chalk.red('\n' + err.message));
  if (process.env.DEBUG) console.error(err.stack);
  process.exit(1);
}
