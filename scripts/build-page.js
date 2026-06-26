#!/usr/bin/env node
/*
 * build-page.js — Otto page engine, "The Listing" design system.
 *
 * Concept: a brokerage sells homes for a living, so it should pitch the CAREER
 * with the same craft it pitches a property. The hub is a feature listing for
 * "a real estate career"; spokes are the property brochure's detail pages.
 * Signature: the MLS-style spec rail (mono data) + listing-status framing.
 *
 *   • type "hub"     → CollectionPage + ItemList + FAQPage + Breadcrumb
 *   • type "article" → Article + FAQPage + Breadcrumb
 *
 * Hub→spoke links are LINK-AWARE: a spoke is a live row only if its page
 * exists; not-yet-built spokes render muted. Re-run as the library grows.
 *
 * Usage: node scripts/build-page.js [slug ...]   (omit = build all specs)
 */
const fs = require('fs');
const path = require('path');

const SITE = 'https://floridarealtorcareers.com';
const ROOT = path.join(__dirname, '..');
const CONTENT = path.join(ROOT, 'content');

const ORG = {
  '@type': ['RealEstateAgent', 'Organization'],
  '@id': `${SITE}/#organization`,
  name: 'Adams, Cameron & Co., Realtors',
  alternateName: 'Florida Realtor Careers',
  url: `${SITE}/`,
  logo: `${SITE}/images/ac-logo.png`,
  telephone: '+1-386-243-9504',
  foundingDate: '1963',
  address: { '@type': 'PostalAddress', streetAddress: '600 S. Atlantic Ave', addressLocality: 'Daytona Beach', addressRegion: 'FL', postalCode: '32118', addressCountry: 'US' },
  areaServed: [{ '@type': 'AdministrativeArea', name: 'Volusia County, Florida' }, { '@type': 'AdministrativeArea', name: 'Flagler County, Florida' }],
  sameAs: ['https://www.adamscameron.com', 'https://www.facebook.com/adamscameron', 'https://www.instagram.com/adamscameronrealtors/', 'https://www.linkedin.com/company/adams-cameron'],
};
const WEBSITE = { '@type': 'WebSite', '@id': `${SITE}/#website`, url: `${SITE}/`, name: 'Florida Realtor Careers', publisher: { '@id': `${SITE}/#organization` } };

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com" />\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />\n<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,800;1,400;1,600;1,700&family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />';

const slugExists = (slug) => fs.existsSync(path.join(ROOT, `${slug}.html`));

function head(spec, graph) {
  const url = `${SITE}/${spec.slug}`;
  const ld = { '@context': 'https://schema.org', '@graph': graph };
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(spec.title)}</title>
<meta name="description" content="${esc(spec.metaDesc)}" />
<link rel="canonical" href="${url}" />
<meta property="og:type" content="${spec.type === 'article' ? 'article' : 'website'}" />
<meta property="og:site_name" content="Florida Realtor Careers" />
<meta property="og:title" content="${esc(spec.title)}" />
<meta property="og:description" content="${esc(spec.metaDesc)}" />
<meta property="og:url" content="${url}" />
<meta property="og:image" content="${spec.heroImg || SITE + '/images/ac-logo.png'}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(spec.title)}" />
<meta name="twitter:description" content="${esc(spec.metaDesc)}" />
<meta name="twitter:image" content="${spec.heroImg || SITE + '/images/ac-logo.png'}" />
<link rel="icon" type="image/png" href="favicon.png" />
${FONTS}
<link rel="stylesheet" href="css/styles.css" />
<script type="application/ld+json">
${JSON.stringify(ld, null, 2)}
</script>`;
}

const faqSchema = (faq) => faq && faq.length ? { '@type': 'FAQPage', mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) } : null;
const breadcrumb = (crumbs) => ({ '@type': 'BreadcrumbList', itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: c.url })) });

// ── shared design system ───────────────────────────────────────────────────
const STYLE = `
<style>
/* ════ "THE LISTING" — career sold like a property ════ */
.lst{--ink:#1b2730;--paper:#faf8f3;--navy:#0168a1;--navy-dk:#013f63;--gold:#c9a84c;--gold-dk:#9a7d2c;--line:#e6e0d3;--mono:'DM Mono',ui-monospace,monospace;--mute:#6a7682}
.lst{font-family:var(--ff-body);color:var(--ink);background:var(--paper)}
.lst ::selection{background:var(--gold);color:#fff}
.lst a{color:inherit}
.lst-wrap{max-width:1080px;margin:0 auto;padding:0 1.6rem}
.lst-narrow{max-width:760px;margin:0 auto;padding:0 1.6rem}
.lst-kicker{font-family:var(--mono);font-size:.72rem;font-weight:500;letter-spacing:.18em;text-transform:uppercase;color:var(--gold-dk)}

/* ── HERO: the feature listing ── */
.lst-hero{position:relative;min-height:92vh;display:flex;flex-direction:column;justify-content:flex-end;color:#fff;overflow:hidden;background:var(--navy-dk)}
.lst-hero-bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 40%}
.lst-hero-scrim{position:absolute;inset:0;background:linear-gradient(180deg,rgba(12,22,30,.30) 0%,rgba(12,22,30,.12) 40%,rgba(12,22,30,.78) 100%)}
.lst-hero-inner{position:relative;z-index:2;max-width:1080px;width:100%;margin:0 auto;padding:0 1.6rem 2.4rem;animation:lstRise .9s var(--ease) both}
.lst-status{display:inline-flex;align-items:center;gap:.7rem;font-family:var(--mono);font-size:.72rem;letter-spacing:.16em;text-transform:uppercase;color:#fff;border:1px solid rgba(255,255,255,.4);border-radius:2px;padding:.4rem .8rem;margin-bottom:1.6rem;backdrop-filter:blur(4px)}
.lst-status::before{content:'';width:7px;height:7px;border-radius:50%;background:var(--gold);box-shadow:0 0 0 3px rgba(201,168,76,.35)}
.lst-hero h1{font-family:var(--ff-head);font-weight:800;font-size:clamp(2.6rem,7vw,5.4rem);line-height:.98;letter-spacing:-.01em;margin:0 0 1.3rem;max-width:16ch;text-shadow:0 2px 30px rgba(0,0,0,.25)}
.lst-hero h1 em{font-style:italic;font-weight:700;color:var(--gold)}
.lst-hero-sub{font-size:clamp(1.05rem,1.6vw,1.3rem);line-height:1.55;color:rgba(255,255,255,.9);max-width:52ch;font-weight:300}
.lst-hero-actions{display:flex;flex-wrap:wrap;gap:.9rem;margin-top:2rem}
.lst-btn{display:inline-flex;align-items:center;gap:.5rem;font-family:var(--ff-body);font-weight:600;font-size:.86rem;letter-spacing:.04em;padding:.95rem 1.8rem;border-radius:2px;text-decoration:none;transition:transform .25s var(--ease),background .25s,color .25s}
.lst-btn.solid{background:var(--gold);color:var(--ink)}
.lst-btn.solid:hover{transform:translateY(-2px);background:#d9bb63}
.lst-btn.ghost{border:1px solid rgba(255,255,255,.55);color:#fff}
.lst-btn.ghost:hover{background:#fff;color:var(--ink)}

/* ── SPEC RAIL: the MLS data strip (signature) ── */
.lst-spec{position:relative;z-index:2;background:var(--ink);color:#fff}
.lst-spec-grid{max-width:1080px;margin:0 auto;display:grid;grid-template-columns:repeat(4,1fr)}
.lst-spec-item{padding:1.5rem 1.6rem;border-right:1px solid rgba(255,255,255,.12)}
.lst-spec-item:last-child{border-right:none}
.lst-spec-n{font-family:var(--ff-head);font-weight:700;font-size:clamp(1.5rem,2.6vw,2.1rem);color:var(--gold);line-height:1}
.lst-spec-l{font-family:var(--mono);font-size:.68rem;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.62);margin-top:.5rem}

/* ── breadcrumb (own, quiet) ── */
.lst-crumb{font-family:var(--mono);font-size:.7rem;letter-spacing:.08em;text-transform:uppercase;color:var(--mute);padding:1.1rem 0;border-bottom:1px solid var(--line)}
.lst-crumb a{color:var(--mute);text-decoration:none}.lst-crumb a:hover{color:var(--gold-dk)}
.lst-crumb span{margin:0 .55rem;color:var(--gold)}

/* ── intro to the tour ── */
.lst-lead{padding:4.5rem 0 1rem}
.lst-lead h2{font-family:var(--ff-head);font-weight:700;font-size:clamp(1.7rem,3.2vw,2.6rem);line-height:1.12;margin:.9rem 0 0;max-width:20ch}
.lst-lead p{color:var(--mute);font-size:1.08rem;line-height:1.7;max-width:60ch;margin-top:1.1rem}

/* ── THE TOUR: stops + reading lists ── */
.lst-tour{padding:2.5rem 0 1rem}
.lst-stop{padding:2.6rem 0;border-top:1px solid var(--line);display:grid;grid-template-columns:minmax(220px,300px) 1fr;gap:2.4rem;align-items:start}
.lst-stop-no{font-family:var(--mono);font-size:.74rem;letter-spacing:.14em;color:var(--gold-dk)}
.lst-stop-head h3{font-family:var(--ff-head);font-weight:700;font-size:clamp(1.4rem,2.6vw,1.95rem);line-height:1.1;margin:.6rem 0 .6rem}
.lst-stop-head p{color:var(--mute);font-size:.96rem;line-height:1.6}
.lst-list{list-style:none;margin:0;padding:0;border-top:1px solid var(--line)}
.lst-row{border-bottom:1px solid var(--line)}
.lst-row a,.lst-row .soon{display:flex;align-items:baseline;gap:1.1rem;padding:1.05rem .3rem;text-decoration:none;transition:padding .25s var(--ease),background .25s}
.lst-row a:hover{padding-left:1rem;background:rgba(201,168,76,.06)}
.lst-row-no{font-family:var(--mono);font-size:.8rem;color:var(--gold-dk);flex:0 0 auto;width:1.8rem}
.lst-row-t{font-family:var(--ff-head);font-size:1.12rem;font-weight:500;color:var(--ink);line-height:1.3;flex:1}
.lst-row a:hover .lst-row-t{color:var(--navy)}
.lst-row-arr{font-family:var(--mono);color:var(--gold);opacity:0;transform:translateX(-6px);transition:.25s var(--ease)}
.lst-row a:hover .lst-row-arr{opacity:1;transform:translateX(0)}
.lst-row .soon .lst-row-t{color:var(--mute);font-weight:400}
.lst-row-tag{font-family:var(--mono);font-size:.62rem;letter-spacing:.12em;text-transform:uppercase;color:var(--mute);border:1px solid var(--line);border-radius:2px;padding:.2rem .5rem;align-self:center}

/* ── FAQ ── */
.lst-faq{padding:4rem 0}
.lst-faq h2{font-family:var(--ff-head);font-weight:700;font-size:clamp(1.6rem,3vw,2.3rem);margin:.8rem 0 1.6rem}
.lst-q{border-top:1px solid var(--line)}
.lst-q summary{display:flex;justify-content:space-between;gap:1.2rem;align-items:baseline;cursor:pointer;list-style:none;padding:1.3rem 0;font-family:var(--ff-head);font-size:1.18rem;color:var(--ink)}
.lst-q summary::-webkit-details-marker{display:none}
.lst-q summary::after{content:'+';font-family:var(--mono);color:var(--gold-dk);font-size:1.4rem;line-height:1}
.lst-q[open] summary::after{content:'\\2013'}
.lst-q .a{padding:0 0 1.4rem;color:var(--mute);line-height:1.72;max-width:64ch}

/* ── OFFER: closing CTA, styled like a showing card ── */
.lst-offer{background:var(--navy-dk);color:#fff;margin-top:1rem}
.lst-offer-inner{max-width:1080px;margin:0 auto;padding:5rem 1.6rem;display:grid;grid-template-columns:1.3fr 1fr;gap:3rem;align-items:center}
.lst-offer h2{font-family:var(--ff-head);font-weight:700;font-size:clamp(1.8rem,3.4vw,2.8rem);line-height:1.08;margin:.8rem 0 1rem}
.lst-offer p{color:rgba(255,255,255,.78);font-size:1.05rem;line-height:1.7;font-weight:300}
.lst-offer-actions{display:flex;flex-direction:column;gap:.9rem}
.lst-offer .lst-kicker{color:var(--gold)}

/* ── ARTICLE (spoke brochure) ── */
.lst-art-head{position:relative;min-height:48vh;display:flex;align-items:flex-end;color:#fff;overflow:hidden;background:var(--navy-dk)}
.lst-art-head .lst-hero-bg{object-position:center 45%}
.lst-art-head-inner{position:relative;z-index:2;max-width:880px;margin:0 auto;width:100%;padding:0 1.6rem 2.4rem}
.lst-art-head h1{font-family:var(--ff-head);font-weight:800;font-size:clamp(2rem,4.6vw,3.4rem);line-height:1.04;margin:1rem 0 0;max-width:20ch;text-shadow:0 2px 24px rgba(0,0,0,.3)}
.lst-art{max-width:720px;margin:0 auto;padding:3.4rem 1.6rem 1rem}
.lst-facts{border-left:3px solid var(--gold);background:#fff;border:1px solid var(--line);border-left:3px solid var(--gold);padding:1.3rem 1.5rem;margin-bottom:2.4rem}
.lst-facts-l{font-family:var(--mono);font-size:.66rem;letter-spacing:.14em;text-transform:uppercase;color:var(--gold-dk);display:block;margin-bottom:.5rem}
.lst-facts p{margin:0;color:var(--ink);line-height:1.6}
.lst-art h2{font-family:var(--ff-head);font-weight:700;font-size:clamp(1.45rem,2.6vw,2rem);color:var(--ink);margin:2.6rem 0 .9rem;padding-top:1.4rem;border-top:1px solid var(--line)}
.lst-art h3{font-family:var(--ff-head);font-weight:600;font-size:1.25rem;margin:1.7rem 0 .6rem}
.lst-art p{color:#384450;line-height:1.78;font-size:1.05rem;margin:0 0 1.15rem}
.lst-art p:first-of-type::first-letter{font-family:var(--ff-head);font-weight:700;font-size:3.3rem;line-height:.8;float:left;padding:.3rem .6rem .1rem 0;color:var(--navy)}
.lst-art ul,.lst-art ol{margin:0 0 1.4rem 1.2rem;color:#384450;line-height:1.7}
.lst-art li{margin-bottom:.55rem}
.lst-art a{color:var(--navy);text-decoration:underline;text-decoration-color:var(--gold);text-underline-offset:3px}
.lst-art em{color:var(--mute)}
.lst-back{display:inline-block;margin-top:2.2rem;font-family:var(--mono);font-size:.76rem;letter-spacing:.06em;text-transform:uppercase;color:var(--navy);text-decoration:none}
.lst-back:hover{color:var(--gold-dk)}

.lst a:focus-visible,.lst summary:focus-visible{outline:2px solid var(--gold);outline-offset:3px;border-radius:2px}
@keyframes lstRise{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:none}}
@media(max-width:760px){
  .lst-spec-grid{grid-template-columns:1fr 1fr}
  .lst-spec-item:nth-child(2){border-right:none}
  .lst-spec-item{border-bottom:1px solid rgba(255,255,255,.12)}
  .lst-stop{grid-template-columns:1fr;gap:1.2rem}
  .lst-offer-inner{grid-template-columns:1fr;gap:2rem}
  .lst-hero{min-height:88vh}
}
@media(prefers-reduced-motion:reduce){.lst *{animation:none!important;transition:none!important}}
</style>`;

const faqHtml = (faq) => !faq || !faq.length ? '' : `
<section class="lst-faq"><div class="lst-narrow">
  <p class="lst-kicker">Straight answers</p>
  <h2>Questions, answered.</h2>
  ${faq.map((f) => `<details class="lst-q"><summary>${esc(f.q)}</summary><div class="a"><p>${f.a}</p></div></details>`).join('\n  ')}
</div></section>`;

const offerHtml = (spec) => `
<section class="lst-offer"><div class="lst-offer-inner">
  <div>
    <p class="lst-kicker">${esc(spec.offerKicker || 'Make your move')}</p>
    <h2>${esc(spec.ctaHeading || 'Ready to start your real estate career?')}</h2>
    <p>${spec.ctaSub || 'Have a real conversation with Adams, Cameron &amp; Co. about getting licensed and launching across Volusia and Flagler County. No pressure &mdash; just a clear picture of the path.'}</p>
  </div>
  <div class="lst-offer-actions">
    <a href="join.html" class="lst-btn solid">Talk to a manager &rarr;</a>
    <a href="new-agents.html" class="lst-btn ghost">See the new-agent support</a>
  </div>
</div></section>`;

const SCRIPTS = '\n<script src="js/shared.js"></script>\n</body>\n</html>\n';

// ── HUB ─────────────────────────────────────────────────────────────────────
function renderHub(spec) {
  const url = `${SITE}/${spec.slug}`;
  const crumbs = [{ name: 'Home', url: `${SITE}/` }, { name: spec.crumb || 'Become an Agent', url }];
  const itemList = { '@type': 'ItemList', itemListElement: [] };
  let pos = 0;
  const n = spec.clusters.length;

  const stops = spec.clusters.map((cl, ci) => {
    let rn = 0;
    const rows = cl.spokes.map((sp) => {
      const live = slugExists(sp.slug);
      rn++;
      const num = String(rn).padStart(2, '0');
      if (live) {
        itemList.itemListElement.push({ '@type': 'ListItem', position: ++pos, url: `${SITE}/${sp.slug}`, name: sp.title });
        return `<li class="lst-row"><a href="${sp.slug}.html"><span class="lst-row-no">${num}</span><span class="lst-row-t">${esc(sp.title)}</span><span class="lst-row-arr">&rarr;</span></a></li>`;
      }
      return `<li class="lst-row"><div class="soon"><span class="lst-row-no">${num}</span><span class="lst-row-t">${esc(sp.title)}</span><span class="lst-row-tag">In the library</span></div></li>`;
    }).join('\n      ');
    const j = (spec.journey && spec.journey[ci]) || {};
    return `<section class="lst-stop">
  <div class="lst-stop-head">
    <span class="lst-stop-no">STOP ${String(ci + 1).padStart(2, '0')} / ${String(n).padStart(2, '0')}</span>
    <h3>${esc(j.title || cl.name)}</h3>
    <p>${esc(j.desc || '')}</p>
  </div>
  <ol class="lst-list">
      ${rows}
  </ol>
</section>`;
  }).join('\n');

  const collectionPage = { '@type': 'CollectionPage', '@id': `${url}#webpage`, url, name: spec.title, description: spec.metaDesc, isPartOf: { '@id': `${SITE}/#website` }, about: { '@id': `${SITE}/#organization` }, inLanguage: 'en-US', mainEntity: itemList };
  const graph = [ORG, WEBSITE, collectionPage, breadcrumb(crumbs)];
  const fq = faqSchema(spec.faq); if (fq) graph.push(fq);

  const spec4 = (spec.heroMeta || []).map((m) => `<div class="lst-spec-item"><div class="lst-spec-n">${esc(m.num)}</div><div class="lst-spec-l">${esc(m.lbl)}</div></div>`).join('');

  const body = `${STYLE}
<body data-page="${spec.slug}" class="lst">

<header class="lst-hero">
  <img class="lst-hero-bg" src="${spec.heroImg}" alt="" />
  <div class="lst-hero-scrim"></div>
  <div class="lst-hero-inner">
    <span class="lst-status">${esc(spec.heroStatus || 'Now showing')}</span>
    <h1>${spec.h1}</h1>
    <p class="lst-hero-sub">${spec.lede}</p>
    <div class="lst-hero-actions">
      <a href="#tour" class="lst-btn solid">Tour the path &darr;</a>
      <a href="join.html" class="lst-btn ghost">Talk to a manager</a>
    </div>
  </div>
</header>
<div class="lst-spec"><div class="lst-spec-grid">${spec4}</div></div>

<div class="lst-crumb"><div class="lst-wrap"><a href="index.html">Home</a><span>&rsaquo;</span>${esc(spec.crumb || 'Become an Agent')}</div></div>

<section class="lst-lead" id="tour"><div class="lst-wrap">
  <p class="lst-kicker">${esc(spec.tourKicker || 'The showing · four stops')}</p>
  <h2>${esc(spec.tourTitle || 'From “thinking about it” to your first SOLD sign.')}</h2>
  <p>${spec.tourLede || ''}</p>
</div></section>

<div class="lst-tour"><div class="lst-wrap">
${stops}
</div></div>

${faqHtml(spec)}
${offerHtml(spec)}`;

  return head(spec, graph) + body + SCRIPTS;
}

// ── ARTICLE (spoke) ─────────────────────────────────────────────────────────
function renderArticle(spec) {
  const url = `${SITE}/${spec.slug}`;
  const crumbs = [{ name: 'Home', url: `${SITE}/` }];
  if (spec.hub) crumbs.push({ name: spec.hub.name, url: `${SITE}/${spec.hub.slug}` });
  crumbs.push({ name: spec.crumb || spec.h1, url });

  const article = { '@type': 'Article', '@id': `${url}#article`, headline: spec.h1, description: spec.metaDesc, url, inLanguage: 'en-US', author: { '@id': `${SITE}/#organization` }, publisher: { '@id': `${SITE}/#organization` }, mainEntityOfPage: url, about: spec.about || 'Real estate careers in Volusia and Flagler County, Florida' };
  const graph = [ORG, WEBSITE, article, breadcrumb(crumbs)];
  const fq = faqSchema(spec.faq); if (fq) graph.push(fq);

  const crumbHtml = `<div class="lst-crumb"><div class="lst-wrap"><a href="index.html">Home</a><span>&rsaquo;</span>${spec.hub ? `<a href="${spec.hub.slug}.html">${esc(spec.hub.name)}</a><span>&rsaquo;</span>` : ''}${esc(spec.crumb || spec.h1)}</div></div>`;

  const body = `${STYLE}
<body data-page="${spec.slug}" class="lst">

<header class="lst-art-head">
  <img class="lst-hero-bg" src="${spec.heroImg}" alt="" />
  <div class="lst-hero-scrim"></div>
  <div class="lst-art-head-inner">
    <span class="lst-kicker" style="color:var(--gold)">${esc(spec.eyebrow)}</span>
    <h1>${spec.h1}</h1>
  </div>
</header>
${crumbHtml}

<article class="lst-art">
  ${spec.tldr ? `<div class="lst-facts"><span class="lst-facts-l">The short answer</span><p>${spec.tldr}</p></div>` : ''}
  ${spec.body}
  ${spec.hub ? `<a class="lst-back" href="${spec.hub.slug}.html">&larr; Back to ${esc(spec.hub.name)}</a>` : ''}
</article>

${faqHtml(spec)}
${offerHtml(spec)}`;

  return head(spec, graph) + body + SCRIPTS;
}

// ── render all specs in /content (recursive) ─────────────────────────────────
function buildSpecs(only = []) {
  const files = [];
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const fp = path.join(dir, e.name);
      if (e.isDirectory()) walk(fp);
      else if (e.name.endsWith('.json')) files.push(fp);
    }
  })(CONTENT);

  let n = 0;
  for (const file of files) {
    const spec = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (only.length && !only.includes(spec.slug)) continue;
    const html = spec.type === 'hub' ? renderHub(spec) : renderArticle(spec);
    fs.writeFileSync(path.join(ROOT, `${spec.slug}.html`), html);
    console.log(`  ✓ ${spec.type.padEnd(7)} ${spec.slug}.html`);
    n++;
  }
  return n;
}

module.exports = { renderHub, renderArticle, buildSpecs, ORG, WEBSITE, SITE };

if (require.main === module) {
  const n = buildSpecs(process.argv.slice(2));
  console.log(`\nBuilt ${n} page(s).`);
}
