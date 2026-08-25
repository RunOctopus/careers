#!/usr/bin/env node
/*
 * liveness.js — is the LIVE site actually serving what we built?
 *
 * Run this AFTER publishing, and any time you have not published in a while:
 *     node scripts/liveness.js
 *
 * WHY THIS EXISTS. On 2026-08-24 the site had not published for EIGHT DAYS and
 * nobody noticed. A deploy did not fire on 17 Aug, Netlify never retries a missed
 * webhook delivery, and because we had just moved to batching a whole session into
 * a single publish, nothing pushed again to nudge it. Two finished pages sat 404
 * for over a week. The diagnosis then went wrong too: an account/billing problem
 * was inferred from ONE push that did not deploy, when in fact a second push fixed
 * it in under two minutes.
 *
 * The lesson is not "check the sitemap count". A count alone would NOT have caught
 * that week's real work: 532 title rewrites and 72 description rewrites changed no
 * page count at all. So this compares CONTENT, not just how many pages exist.
 *
 * WHAT IT COMPARES, AND WHY IN THIS FORM.
 *   1  Reachability — homepage and a sample of pages must return 200.
 *   2  Sitemap URL count, live vs local — catches pages added or removed.
 *   3  Visible TEXT of sampled pages, live vs local — catches pages EDITED, which
 *      is the case a count silently misses.
 *
 * It compares rendered text rather than raw HTML on purpose. Netlify post-processes
 * the markup it serves: it rewrites href="page.html" into href='/page' and swaps
 * attribute quotes. Hashing the HTML therefore reports a false mismatch on every
 * page forever, and would break again the day Netlify changes that optimizer.
 * Stripping tags and collapsing whitespace is stable across all of it while still
 * catching any real content change, including <title>, whose text survives the strip.
 *
 * WHICH PAGES IT SAMPLES. The most recently MODIFIED pages, taken from git, because
 * those are precisely what a stalled deploy would be missing. A page that is present
 * locally but 404 live is reported separately from one that is merely out of date:
 * the first usually means the deploy never ran, the second that it ran against an
 * older commit.
 *
 * Exit code 0 if the live site matches, 1 if it is stale or unreachable, so this can
 * be wired into a cron or a post-publish step later without changing anything here.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const SITE = 'https://floridarealtorcareers.com';
const SAMPLE = Number(process.env.LIVENESS_SAMPLE || 8);
const TIMEOUT = 20000;

let failed = false;
const bad = (m) => { failed = true; console.log(`   ✗ ${m}`); };
const ok = (m) => console.log(`   ✓ ${m}`);

// Visible text only. See the header for why this is not an HTML hash.
const textOf = (html) => html
  .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

async function get(url) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), TIMEOUT);
  try {
    const r = await fetch(url, { signal: ctl.signal, redirect: 'follow' });
    return { status: r.status, body: r.ok ? await r.text() : '' };
  } catch (e) {
    return { status: 0, body: '', error: e.message };
  } finally { clearTimeout(t); }
}

// Recently touched pages are the ones a stalled deploy would be missing. Fall back
// to newest-by-mtime if git is unavailable, so this still works outside a checkout.
function recentPages(n) {
  const exists = (f) => f.endsWith('.html') && !f.includes('/')
    && fs.existsSync(path.join(ROOT, f));
  const git = (cmd) => {
    try {
      return execSync(cmd, { cwd: ROOT, encoding: 'utf8' })
        .split('\n').map((x) => x.trim()).filter(exists);
    } catch { return []; }
  };

  // NEWLY ADDED pages first. A brand-new page 404ing live is the loudest possible
  // signal that the deploy never ran, and it is the case that cost eight days.
  const added = [...new Set(git(
    'git log -12 --diff-filter=A --name-only --pretty=format: -- "*.html"'))];

  // Then MODIFIED pages, sampled evenly across the list rather than taking the
  // head of it. A single commit touching 500 files lists them alphabetically, so
  // the first n are all near the start of the alphabet and tell you very little.
  const modified = [...new Set(git(
    'git log -12 --diff-filter=M --name-only --pretty=format: -- "*.html"'))]
    .filter((f) => !added.includes(f));

  const out = added.slice(0, n);
  const room = n - out.length;
  if (room > 0 && modified.length) {
    const step = Math.max(1, Math.floor(modified.length / room));
    for (let i = 0; i < modified.length && out.length < n; i += step) out.push(modified[i]);
  }
  if (out.length) return out;

  // Not a git checkout: fall back to newest files on disk.
  return fs.readdirSync(ROOT).filter(exists)
    .map((f) => [f, fs.statSync(path.join(ROOT, f)).mtimeMs])
    .sort((a, b) => b[1] - a[1]).map(([f]) => f).slice(0, n);
}

const urlFor = (file) => {
  const slug = file.replace(/\.html$/, '');
  return slug === 'index' ? `${SITE}/` : `${SITE}/${slug}`;
};

(async () => {
  console.log(`\nliveness: ${SITE}  (${new Date().toISOString().slice(0, 16).replace('T', ' ')})\n`);

  // ── 1. reachability ────────────────────────────────────────────────────────
  const home = await get(`${SITE}/`);
  if (home.status === 200) ok('homepage reachable');
  else bad(`homepage returned ${home.status || 'no response'}${home.error ? ` (${home.error})` : ''}`);

  // ── 2. sitemap count ───────────────────────────────────────────────────────
  const localSitemap = path.join(ROOT, 'sitemap.xml');
  let localCount = null;
  if (fs.existsSync(localSitemap)) {
    localCount = (fs.readFileSync(localSitemap, 'utf8').match(/<loc>/g) || []).length;
  }
  const liveSm = await get(`${SITE}/sitemap.xml`);
  const liveCount = (liveSm.body.match(/<loc>/g) || []).length;
  if (localCount === null) {
    console.log('   - no local sitemap.xml to compare against');
  } else if (!liveCount) {
    bad('live sitemap.xml unreadable');
  } else if (liveCount === localCount) {
    ok(`sitemap: ${liveCount} URLs live, matches local`);
  } else {
    bad(`sitemap: ${liveCount} live vs ${localCount} local ` +
        `(${localCount - liveCount > 0 ? `${localCount - liveCount} page(s) not published` : 'live has MORE than local, local may be behind'})`);
  }

  // ── 3. content of recently changed pages ───────────────────────────────────
  const pages = recentPages(SAMPLE);
  if (!pages.length) { console.log('   - no local pages found to sample'); }
  else {
    console.log(`\n   comparing the ${pages.length} most recently changed pages:`);
    let stale = 0; let missing = 0;
    for (const file of pages) {
      const r = await get(urlFor(file));
      const label = file.replace(/\.html$/, '').slice(0, 58);
      if (r.status === 404) { bad(`404 live, exists locally — ${label}`); missing++; continue; }
      if (r.status !== 200) { bad(`HTTP ${r.status || 'no response'} — ${label}`); continue; }
      const local = textOf(fs.readFileSync(path.join(ROOT, file), 'utf8'));
      if (textOf(r.body) === local) ok(label);
      else { bad(`live copy is OUT OF DATE — ${label}`); stale++; }
    }
    if (missing) console.log(`\n   ${missing} page(s) exist locally but 404 live: the deploy probably never ran.`);
    if (stale) console.log(`   ${stale} page(s) live but out of date: a deploy ran against an older commit.`);
  }

  console.log(failed
    ? '\nSTALE — the live site does not match what is built here.\n' +
      'First move is to publish again, not to diagnose. A missed webhook is not retried,\n' +
      'and it looks identical to an account problem until you send a second push.\n'
    : '\nLIVE MATCHES LOCAL\n');
  process.exit(failed ? 1 : 0);
})();
