#!/usr/bin/env node
/*
 * check.js — the pre-deploy gauntlet for floridarealtorcareers.com
 *
 * Run this BEFORE committing and BEFORE deploying, never after:
 *     node scripts/build.js && node scripts/check.js
 *
 * Every check here exists because something actually shipped or nearly shipped
 * broken. Do not remove one without replacing it with something better.
 *
 *  1  every content spec parses as JSON
 *  2  no em dashes            (house style, set after 69 were found in old pages)
 *  3  no curly quotes         (same)
 *  4  no broken internal links, counted on the BUILT artifact, not the served
 *     HTML — Netlify rewrites href="slug.html" to /slug at serve time, so
 *     grepping the live site for the local form finds nothing and lies to you
 *  5  no duplicate page bodies
 *  6  metaDesc <= 160 chars on anything touched recently (Google truncates)
 *  7  word-count floor of 1400 on new pages — first drafts on operational
 *     topics come in 200-300 words light, every single time
 *  8  no competitor or third-party brand names, matched on WORD BOUNDARIES
 *     (a naive regex once flagged "aceable" inside "traceable")
 *  9  no British spellings — this is a Florida client. Added 2026-08-16 after
 *     58 instances of licence/neighbourhood/recognise shipped into six pages
 * 10  no markdown syntax left inside HTML body fields
 * 11  every page in the registry is status:'built' — a spec plus an EVERGREEN
 *     entry is NOT enough, BUILT[] in seed-manifest.js is a third registration
 *     step and pages missing from it render fine while being absent from
 *     sitemap.xml and llms.txt entirely
 * 12  NEAR-duplicate detection. Check 5 only catches byte-identical bodies, and
 *     that blind spot hid an average 76% overlap across the 21 town comparison
 *     pages for a long time. This one shingles every body into 8-word windows
 *     and compares all pairs. Similarity between town variants is EXPECTED and
 *     fine (Matt's call); this reports the distribution as information and only
 *     fails if a NEW page is ~95% identical to an existing one, i.e. a genuine
 *     copy-paste accident.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CDIR = path.join(ROOT, 'content');
const RECENT_DAYS = 3;

let fail = 0;
const bad = (m) => { console.log('   ✗ ' + m); fail++; };

// ── load ─────────────────────────────────────────────────────────────────────
const files = fs.readdirSync(CDIR).filter((f) => f.endsWith('.json'));
const specs = {};
for (const f of files) {
  try { specs[f] = JSON.parse(fs.readFileSync(path.join(CDIR, f), 'utf8')); }
  catch (e) { bad(`invalid JSON: ${f} — ${e.message}`); }
}
console.log(`1. JSON valid: ${Object.keys(specs).length}/${files.length}`);

// Two different windows, deliberately.
//   `fresh`  = files CREATED recently -> genuinely new pages. The 1400-word
//              floor applies to these only. CONTENT_PHILOSOPHY is explicit that
//              the floor is forward-looking and older pages are not rewritten in
//              a blanket pass, so keying this off mtime would fail every time a
//              link is added to a 2025 page. That is a broken gate, not a finding.
//   `recent` = files MODIFIED recently -> metaDesc is checked here, because it
//              is a one-line fix and truncation costs real clicks.
// "New" is decided by git, not by filesystem timestamps. birthtime is unusable
// here because the tooling rewrites specs in place when adding links, which
// resets it on macOS and made this gate flag five-year-old pages as new.
const cutoff = Date.now() - RECENT_DAYS * 864e5;
const stat = (f) => fs.statSync(path.join(CDIR, f));
const recent = files.filter((f) => stat(f).mtimeMs > cutoff);

let tracked = new Set();
try {
  tracked = new Set(require('child_process')
    .execSync('git ls-tree -r --name-only HEAD content/', { cwd: ROOT, encoding: 'utf8' })
    .split('\n').filter(Boolean).map((p) => path.basename(p)));
} catch (e) { console.log('   (git unavailable — treating all specs as tracked)'); tracked = new Set(files); }
const fresh = files.filter((f) => !tracked.has(f));

// ── 2/3. typography ──────────────────────────────────────────────────────────
let em = 0, cq = 0; const emF = [], cqF = [];
for (const [f, d] of Object.entries(specs)) {
  const s = JSON.stringify(d);
  const e = (s.match(/—/g) || []).length;
  const c = (s.match(/[‘’“”]/g) || []).length;
  if (e) { em += e; emF.push(f); }
  if (c) { cq += c; cqF.push(f); }
}
console.log(`2. em dashes: ${em}`);   if (em) bad('em dashes in: ' + emF.slice(0, 5).join(', '));
console.log(`3. curly quotes: ${cq}`); if (cq) bad('curly quotes in: ' + cqF.slice(0, 5).join(', '));

// ── 4. internal links, on the built artifact ─────────────────────────────────
const html = new Set(fs.readdirSync(ROOT).filter((f) => f.endsWith('.html')));
let links = 0; const broken = [];
for (const f of html) {
  const s = fs.readFileSync(path.join(ROOT, f), 'utf8');
  for (const m of s.matchAll(/href="([^"#?:]+\.html)"/g)) {
    links++;
    if (!html.has(m[1])) broken.push(`${f} -> ${m[1]}`);
  }
}
console.log(`4. internal links on built artifact: ${links}, broken: ${broken.length}`);
broken.slice(0, 10).forEach((b) => bad('broken link ' + b));

// ── 5. duplicate bodies ──────────────────────────────────────────────────────
const seen = new Map(); let dup = 0;
for (const [f, d] of Object.entries(specs)) {
  const b = (d.body || '').replace(/\s+/g, ' ').trim();
  if (!b) continue;
  if (seen.has(b)) { bad(`duplicate body: ${f} == ${seen.get(b)}`); dup++; }
  else seen.set(b, f);
}
console.log(`5. unique bodies: ${seen.size}, duplicates: ${dup}`);

// Entity-aware length. Mirrors the decoder in build-head-seo.js so both measure
// the string a searcher actually sees rather than its JSON source form.
const decode = (s) => s
  .replace(/&amp;/g, '&').replace(/&rsquo;|&#39;/g, "'").replace(/&mdash;/g, '\u2014')
  .replace(/&ndash;/g, '\u2013').replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();

// ── 6/7. metaDesc + word floor on recently touched pages ─────────────────────
const wordsOf = (d) => [d.answer, d.tldr, (d.takeaways || []).join(' '), d.body,
    (d.faq || []).map((x) => x.q + ' ' + x.a).join(' ')]
    .join(' ').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;

console.log(`6. metaDesc <= 160 on ${recent.length} modified spec(s):`);
for (const f of recent) {
  // Measure what Google renders, not the source string: "&rsquo;" is 7 characters
  // in the JSON and one on screen. Measuring raw over-counted a passing page by
  // 10 characters on 2026-08-24 — verify the instrument before the finding.
  const md = decode((specs[f] && specs[f].metaDesc) || '').length;
  if (md > 160) bad(`metaDesc ${md} > 160 — ${f}`);
}

console.log(`7. word floor (1400) on ${fresh.length} NEW page(s):`);
for (const f of fresh) {
  const d = specs[f]; if (!d) continue;
  const w = wordsOf(d);
  if (w < 1400) bad(`only ${w} words (floor 1400) — ${f}`);
  else console.log(`   ✓ ${f.replace('.json', '')} — ${w}w, metaDesc ${(d.metaDesc || '').length}`);
}

// ── 8. competitor / third-party brand names ──────────────────────────────────
const COMP = ['eXp', 'Keller Williams', 'Coldwell', 'RE/MAX', 'Remax', 'Century 21',
  'Compass', 'Berkshire Hathaway', 'Sotheby', 'Aceable', 'Colibri', 'Gold Coast',
  'Kaplan', 'Watson Realty', 'Charles Rutenberg', 'Google Voice', 'Zillow',
  'Realtor.com', 'Redfin', 'LionDesk', 'Follow Up Boss', 'kvCORE', 'BoomTown'];
// Scan only reader-facing text, never the whole JSON. Serializing the spec
// drags in `pillar`, `slug` and `track`, and the pillar id "switch-exp" matches
// /\beXp\b/ at the hyphen — a false positive that has now fired twice, once in
// an earlier session and once against this very check.
const PROSE = (d) => [d.title, d.metaDesc, d.h1, d.eyebrow, d.crumb, d.about,
  d.answer, d.tldr, (d.takeaways || []).join(' '), d.body,
  (d.faq || []).map((x) => x.q + ' ' + x.a).join(' '), d.ctaHeading, d.ctaSub]
  .filter(Boolean).join(' ');

// Brands whose name is also an ordinary English word or a place name. Matching
// these case-insensitively fires on innocent prose: "in a different way than a
// boomtown" flagged three pages in 2026-08-24. For these, require the brand's own
// casing — a real mention writes it the brand's way. Same class of false positive
// as "aceable" inside "traceable", which the COMP comment above already records.
const CASED = new Set(['BoomTown', 'Compass', 'Gold Coast']);

// A published case name is a citation, not an endorsement, and you cannot cite a
// case without naming the parties. VHT v. Zillow is the primary source for how
// listing-photo licences are scoped, and it is the only thing on the site that
// sources that page. Subtract the exact citation strings BEFORE scanning, so the
// brand stays blocked everywhere else — including a bare "Zillow" one sentence
// later on the same page. Matt's call, 2026-08-31: cite the case, never the
// company. Add to this list only for another real case name, never for a
// product, a rate, a ranking or a comparison.
const CITATIONS = [
  'VHT, Inc. v. Zillow Group, Inc.',
  'VHT v. Zillow',
  'v. Zillow Group',
];
const stripCitations = (s) => CITATIONS.reduce(
  (acc, c) => acc.split(c).join(' [case citation] '), s);

let hits = 0;
for (const f of recent) {
  const d = specs[f]; if (!d) continue;
  const s = stripCitations(PROSE(d));
  for (const c of COMP) {
    const re = new RegExp('\\b' + c.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&') + '\\b',
      CASED.has(c) ? '' : 'i');
    if (re.test(s)) { bad(`brand name "${c}" in ${f}`); hits++; }
  }
}
console.log(`8. competitor names in recent pages: ${hits}`);

// ── 9. British spellings (this is a Florida client) ──────────────────────────
// Curated rather than a /-ise$/ regex on purpose: a heuristic flags advise,
// surprise, precise, improvise, franchise and expertise constantly, and a gate
// that cries wolf gets ignored, which is worse than no gate. Add words here as
// they actually turn up. 'rationalisation' was added 2026-08-17 after slipping
// through while 'apologise' in the same paragraph was caught.
const BRIT = ['licence', 'licences', 'organise', 'organised', 'organisation',
  'recognise', 'recognised', 'characterise', 'characterised', 'apologise',
  'realise', 'realised', 'neighbourhood', 'neighbourhoods', 'behaviour',
  'favour', 'colour', 'whilst', 'amongst', 'learnt', 'centre', 'defence',
  'rationalise', 'rationalisation', 'prioritise', 'minimise', 'maximise',
  'summarise', 'emphasise', 'criticise', 'analyse', 'analysed', 'specialise',
  'standardise', 'utilise', 'categorise', 'authorise', 'personalise',
  'customise', 'capitalise', 'finalise', 'normalise', 'generalise',
  'apologised', 'practise', 'offence', 'travelling', 'labelled', 'cancelled'];
let brit = 0;
for (const [f, d] of Object.entries(specs)) {
  const s = JSON.stringify(d);
  for (const w of BRIT) {
    const m = s.match(new RegExp('\\b' + w + '\\b', 'gi'));
    if (m) { bad(`British spelling "${w}" x${m.length} in ${f}`); brit += m.length; }
  }
}
console.log(`9. British spellings: ${brit}`);

// ── 10. markdown left inside HTML ────────────────────────────────────────────
let md = 0;
for (const [f, d] of Object.entries(specs)) {
  if (!d.body) continue;
  if (d.body.includes('**')) { bad(`markdown bold (**) inside HTML body — ${f}`); md++; }
  if (/\[[^\]]+\]\([^)]+\)/.test(d.body)) { bad(`markdown link inside HTML body — ${f}`); md++; }
}
console.log(`10. markdown in HTML bodies: ${md}`);

// ── 10b. balanced paragraph tags ─────────────────────────────────────────────
// Added 2026-08-17. Retrofitting sourced sections into existing pages means
// splicing HTML by hand, and an unclosed <p> renders as a run-on paragraph that
// looks like sloppy writing rather than a bug. Caught one the day this was added.
// NOTE: match /<p[\s>]/ and not /<p>/. The first version of this check counted
// bare <p> only and reported 24 failures, nearly all of them pages using
// <p class="cmp-note"> or <p class="lst-src">. Verify the instrument first.
let unbalanced = 0;
for (const [f, d] of Object.entries(specs)) {
  if (!d.body) continue;
  const o = (d.body.match(/<p[\s>]/g) || []).length;
  const c = (d.body.match(/<\/p>/g) || []).length;
  if (o !== c) { bad(`unbalanced <p> tags (${o} open, ${c} close) — ${f}`); unbalanced++; }
}
console.log(`10b. unbalanced <p> tags: ${unbalanced}`);

// ── 11. every registry page is actually 'built' ──────────────────────────────
try {
  const M = require(path.join(CDIR, 'manifest.js'));
  const planned = M.pages.filter((p) => p.status !== 'built');
  console.log(`11. registry: ${M.pages.length - planned.length} built, ${planned.length} planned`);
  if (planned.length) {
    bad(`${planned.length} page(s) NOT in BUILT[] — they render but are absent from ` +
        `sitemap.xml and llms.txt: ${planned.map((p) => p.slug).slice(0, 8).join(', ')}`);
  }
} catch (e) {
  bad('could not read content/manifest.js — run scripts/seed-manifest.js first');
}


// ── 12. near-duplicate pages ─────────────────────────────────────────────────
// Check 5 above only finds byte-identical bodies. That is close to useless for
// a site built on templated families: the 21 town comparison pages averaged 76%
// overlap with each other and every build passed clean.
//
// This shingles each body into overlapping 8-word windows and measures, for
// each pair, what share of the SMALLER page's windows also appear in the larger.
// ~143k pairs over 535 pages runs in about two seconds, so it is cheap enough
// to run every time.
//
// MATT'S CALL, 2026-08-17: "It's ok for things to be similar don't worry."
// He is right and this check was originally tuned too tight. These are town
// variants for one brokerage in one two-county market; they SHOULD resemble
// each other, and a family resemblance is not a defect to be engineered away.
// So this reports the distribution as information and does not police it.
//
// The failure threshold is deliberately set where only an accident lands: a NEW
// page essentially copy-pasted from an existing one. At 0.95 nothing on the site
// currently trips it, including every templated town family. Do not lower this
// to chase tidier numbers.
const NEAR_DUP_FAIL = 0.95;
const shingle = (body) => {
  const w = body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(' ');
  if (w.length < 50) return null;
  const s = new Set();
  for (let i = 0; i + 8 <= w.length; i++) s.add(w.slice(i, i + 8).join(' '));
  return s;
};
const shingles = [], shNames = [];
for (const [f, d] of Object.entries(specs)) {
  if (!d.body) continue;
  const sg = shingle(d.body);
  if (sg) { shingles.push(sg); shNames.push(f); }
}
const overlap = (A, B) => {
  const [small, big] = A.size < B.size ? [A, B] : [B, A];
  let hit = 0;
  for (const s of small) if (big.has(s)) hit++;
  return hit / small.size;
};
let d95 = 0, d90 = 0, d85 = 0, d80 = 0;
const newPageHits = [];
for (let i = 0; i < shingles.length; i++) {
  for (let j = i + 1; j < shingles.length; j++) {
    const o = overlap(shingles[i], shingles[j]);
    if (o >= 0.95) d95++;
    if (o >= 0.90) d90++;
    if (o >= 0.85) d85++;
    if (o >= 0.80) d80++;
    if (o >= NEAR_DUP_FAIL && (fresh.includes(shNames[i]) || fresh.includes(shNames[j]))) {
      newPageHits.push([o, shNames[i], shNames[j]]);
    }
  }
}
console.log(`12. similarity across ${shingles.length} pages (information, not a target): >=95% ${d95} · >=90% ${d90} · >=85% ${d85} · >=80% ${d80}`);
for (const [o, a, b] of newPageHits.sort((x, y) => y[0] - x[0]).slice(0, 10)) {
  bad(`NEW page is ${Math.round(o * 100)}% identical to an existing one, which looks like an accidental copy — ${a} ~ ${b}`);
}

console.log('\n' + (fail ? `GAUNTLET FAILED — ${fail} issue(s)` : 'GAUNTLET PASSED'));
process.exit(fail ? 1 : 0);
