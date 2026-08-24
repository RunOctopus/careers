#!/usr/bin/env node
/*
 * build-page.js — page engine, "The Listing" design system.
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
let MANIFEST = { pillars: [], pages: [] };
try { MANIFEST = require('../content/manifest.js'); } catch (_) {}

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

// Entity-aware escape: escapes bare & < > " but leaves valid HTML entities
// (&mdash; &rsquo; &amp; &#8212; …) intact, so hand-written copy can use them.
const esc = (s) => String(s)
  .replace(/&(?!#?[a-zA-Z0-9]+;)/g, '&amp;')
  .replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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
/* ════ "THE LISTING" - career sold like a property ════ */
.lst{--ink:#1b2730;--paper:#faf8f3;--navy:#0168a1;--navy-dk:#013f63;--gold:#c9a84c;--gold-dk:#9a7d2c;--line:#e6e0d3;--mono:'DM Mono',ui-monospace,monospace;--mute:#6a7682}
.lst{font-family:var(--ff-body);color:var(--ink);background:var(--paper)}
.lst ::selection{background:var(--gold);color:#fff}
.lst a{color:inherit}
.lst-wrap{max-width:1080px;margin:0 auto;padding:0 1.6rem}
.lst-narrow{max-width:760px;margin:0 auto;padding:0 1.6rem}
.lst-kicker{font-family:var(--mono);font-size:.72rem;font-weight:500;letter-spacing:.18em;text-transform:uppercase;color:var(--gold-dk)}

/* ── HERO: the career, laid out like a property listing ── */
.lst-hero{position:relative;display:grid;grid-template-columns:minmax(440px,1fr) 1.3fr;min-height:90vh;background:var(--ink);color:#fff;overflow:hidden}
.lst-hero-photo{position:relative;overflow:hidden;order:2}
.lst-hero-photo img{width:100%;height:100%;object-fit:cover;object-position:center;animation:lstZoom 14s var(--ease) both}
.lst-photo-tag{position:absolute;left:1.2rem;bottom:1.2rem;font-family:var(--mono);font-size:.66rem;letter-spacing:.13em;color:#fff;background:rgba(18,28,36,.55);backdrop-filter:blur(6px);border:1px solid rgba(255,255,255,.28);padding:.4rem .75rem;border-radius:2px}
.lst-hero-panel{display:flex;flex-direction:column;justify-content:center;padding:clamp(2.2rem,4.5vw,4.6rem);order:1;animation:lstRise .9s var(--ease) both}
.lst-status{display:inline-flex;align-items:center;gap:.6rem;align-self:flex-start;font-family:var(--mono);font-size:.7rem;letter-spacing:.15em;text-transform:uppercase;color:var(--gold-lt,#e8c96b);margin-bottom:1.5rem}
.lst-status::before{content:'';width:7px;height:7px;border-radius:50%;background:var(--gold);box-shadow:0 0 0 3px rgba(201,168,76,.3)}
.lst-hero-panel h1{font-family:var(--ff-head);font-weight:800;font-size:clamp(2.2rem,3.9vw,3.7rem);line-height:1.0;letter-spacing:-.01em;margin:0 0 1.1rem;max-width:13ch}
.lst-hero-panel h1 em{font-style:italic;font-weight:700;color:var(--gold-lt,#e8c96b)}
.lst-hero-sub{font-size:1.05rem;line-height:1.6;color:rgba(255,255,255,.8);font-weight:300;max-width:44ch;margin-bottom:2.1rem}
.lst-hero-actions{display:flex;flex-wrap:wrap;gap:.8rem;margin-top:.3rem}
.lst-btn{display:inline-flex;align-items:center;gap:.5rem;font-family:var(--ff-body);font-weight:600;font-size:.86rem;letter-spacing:.04em;padding:.92rem 1.7rem;border-radius:2px;text-decoration:none;transition:transform .25s var(--ease),background .25s,color .25s}
.lst-btn.solid{background:var(--gold);color:var(--ink)}
.lst-btn.solid:hover{transform:translateY(-2px);background:#d9bb63}
.lst-btn.ghost{border:1px solid rgba(255,255,255,.5);color:#fff}
.lst-btn.ghost:hover{background:#fff;color:var(--ink)}

/* spec rail = the listing's data sheet (signature), inside the panel */
.lst-spec-grid{display:grid;grid-template-columns:1fr 1fr;border:1px solid rgba(255,255,255,.16);border-radius:3px;margin-bottom:2rem}
.lst-spec-item{padding:1.05rem 1.3rem;border-right:1px solid rgba(255,255,255,.13);border-bottom:1px solid rgba(255,255,255,.13)}
.lst-spec-item:nth-child(2n){border-right:none}
.lst-spec-item:nth-last-child(-n+2){border-bottom:none}
.lst-spec-n{font-family:var(--ff-head);font-weight:700;font-size:1.7rem;color:var(--gold-lt,#e8c96b);line-height:1}
.lst-spec-l{font-family:var(--mono);font-size:.63rem;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.6);margin-top:.4rem}
.lst-more{font-family:var(--mono);font-size:.74rem;letter-spacing:.04em;color:var(--gold-dk);padding:1.1rem .3rem;border-bottom:1px solid var(--line)}
.lst-more::before{content:'+ ';opacity:.7}

/* ── breadcrumb (own, quiet) ── */
.lst-crumb{font-family:var(--mono);font-size:.7rem;letter-spacing:.08em;text-transform:uppercase;color:var(--mute);padding:1.1rem 0;border-bottom:1px solid var(--line)}
.lst-crumb a{color:var(--mute);text-decoration:none}.lst-crumb a:hover{color:var(--gold-dk)}
.lst-crumb span{margin:0 .55rem;color:var(--gold)}

/* ── intro to the tour ── */
.lst-lead{padding:4.5rem 0 1rem}
.lst-lead h2{font-family:var(--ff-head);font-weight:700;font-size:clamp(1.7rem,3.2vw,2.6rem);line-height:1.12;margin:.9rem 0 0;max-width:20ch}
.lst-lead p{color:var(--mute);font-size:1.08rem;line-height:1.7;max-width:60ch;margin-top:1.1rem}

/* ── THE TOUR: a guided showing with stops ── */
.lst-tour{padding:2.5rem 0 1rem}
.lst-stop{padding:3rem 0;border-top:1px solid var(--line);display:grid;grid-template-columns:minmax(230px,320px) 1fr;gap:2.8rem;align-items:start;position:relative}
.lst-stop-head{position:relative}
.lst-stop-fig{font-family:var(--ff-head);font-weight:700;font-size:4.2rem;line-height:.8;color:transparent;-webkit-text-stroke:1.5px var(--gold);letter-spacing:-.02em;margin-bottom:.6rem;display:block;opacity:.85}
.lst-stop-no{font-family:var(--mono);font-size:.72rem;letter-spacing:.16em;text-transform:uppercase;color:var(--gold-dk)}
.lst-stop-head h3{font-family:var(--ff-head);font-weight:700;font-size:clamp(1.4rem,2.6vw,1.95rem);line-height:1.08;margin:.45rem 0 .65rem}
.lst-stop-head p{color:var(--mute);font-size:.98rem;line-height:1.65;max-width:34ch}
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

/* ── PULL-QUOTE: a confident editorial moment ── */
.lst-quote{background:var(--ink);color:#fff;padding:clamp(4rem,8vw,6.5rem) 0;position:relative;overflow:hidden}
.lst-quote::before{content:'\\201C';position:absolute;top:-.1em;left:.1em;font-family:var(--ff-head);font-size:18rem;line-height:1;color:rgba(201,168,76,.12);pointer-events:none}
.lst-quote .lst-narrow{position:relative}
.lst-quote .lst-kicker{color:var(--gold-lt,#e8c96b)}
.lst-quote blockquote{font-family:var(--ff-head);font-weight:600;font-style:italic;font-size:clamp(1.7rem,3.6vw,2.9rem);line-height:1.2;margin:1.2rem 0 1.4rem;max-width:24ch;color:#fff}
.lst-quote cite{font-family:var(--mono);font-style:normal;font-size:.76rem;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.6)}

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
/* comparison table */
.lst-art-wide{max-width:920px}
.cmp-wrap{overflow-x:auto;margin:1.5rem 0 1rem}
.cmp{width:100%;border-collapse:collapse;font-size:.92rem}
.cmp th,.cmp td{padding:.95rem 1.05rem;text-align:left;vertical-align:top;border-bottom:1px solid var(--line);line-height:1.45}
.cmp thead th{font-family:var(--ff-head);font-weight:700;font-size:1rem;color:var(--ink);border-bottom:2px solid var(--ink);vertical-align:bottom}
.cmp .c-crit{font-family:var(--mono);font-size:.7rem;letter-spacing:.06em;text-transform:uppercase;color:var(--mute);width:150px;font-weight:500}
.cmp td{color:#384450}
.cmp .c-win{background:rgba(201,168,76,.10)}
.cmp thead .c-win{color:var(--gold-dk);border-bottom-color:var(--gold)}
.cmp tbody tr:first-child .c-win{border-top:2px solid var(--gold)}
.cmp-note{font-size:.82rem;color:var(--mute);font-style:italic;margin:.4rem 0 1.5rem}
/* data snapshot callout - real local numbers win citations */
.lst-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:1px;background:var(--line);border:1px solid var(--line);border-radius:4px;margin:1.8rem 0 .5rem;overflow:hidden}
.lst-stat{background:#fff;padding:1.15rem 1.25rem}
.lst-stat-n{font-family:var(--ff-head);font-weight:700;font-size:1.65rem;color:var(--navy);line-height:1}
.lst-stat-l{font-size:.78rem;color:var(--mute);margin-top:.4rem;line-height:1.35}
.lst-src{font-family:var(--mono);font-size:.7rem;color:var(--mute);margin:.3rem 0 1.8rem}
/* AEO blocks - engineered to be the lifted answer */
.lst-updated{font-family:var(--mono);font-size:.7rem;letter-spacing:.04em;color:var(--mute);margin:0 0 1.4rem}
.lst-answer{background:var(--navy-dk);color:#fff;border-radius:6px;padding:1.5rem 1.7rem;margin-bottom:1.5rem}
.lst-answer-l{font-family:var(--mono);font-size:.66rem;letter-spacing:.14em;text-transform:uppercase;color:var(--gold-lt,#e8c96b);display:block;margin-bottom:.55rem}
.lst-answer p{margin:0;font-size:1.13rem;line-height:1.55;color:#fff}
.lst-takeaways{border:1px solid var(--line);border-left:3px solid var(--gold);border-radius:4px;padding:1.2rem 1.5rem;margin-bottom:2rem}
.lst-tk-l{font-family:var(--mono);font-size:.66rem;letter-spacing:.14em;text-transform:uppercase;color:var(--gold-dk);display:block;margin-bottom:.55rem}
.lst-takeaways ul{margin:0;padding-left:1.15rem}
.lst-takeaways li{margin-bottom:.4rem;color:#384450;line-height:1.55}
/* related guides - auto internal-linking mesh */
.lst-related{padding:3.2rem 0;background:var(--cream)}
.lst-related h2{font-family:var(--ff-head);font-weight:700;font-size:clamp(1.4rem,2.6vw,2rem);margin:.5rem 0 1.1rem}
.lst-related ul{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:1fr 1fr;gap:0 2rem}
.lst-related li{border-bottom:1px solid var(--line)}
.lst-related a{display:block;padding:.95rem .2rem;color:var(--ink);text-decoration:none;font-family:var(--ff-head);font-size:1.06rem;line-height:1.3;transition:color .2s,padding .2s var(--ease)}
.lst-related a:hover{color:var(--navy);padding-left:.5rem}
@media(max-width:640px){.lst-related ul{grid-template-columns:1fr}}
/* interactive tool / calculator */
.calc{background:#fff;border:1px solid var(--line);border-radius:8px;padding:1.6rem 1.7rem;margin:1.7rem 0 .6rem}
.calc-grid{display:grid;grid-template-columns:1fr 1fr;gap:1rem}
.calc-row{margin-bottom:.2rem}
.calc-row label{display:block;font-family:var(--mono);font-size:.68rem;letter-spacing:.07em;text-transform:uppercase;color:var(--mute);margin-bottom:.4rem}
.calc-row input{width:100%;font-family:var(--ff-body);font-size:1.08rem;padding:.7rem .9rem;border:1px solid var(--line);border-radius:4px;color:var(--ink);background:var(--paper)}
.calc-row input:focus{outline:2px solid var(--gold);border-color:var(--gold)}
.calc-out{background:var(--navy-dk);color:#fff;border-radius:6px;padding:1.3rem 1.6rem;margin-top:1.4rem;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:.5rem}
.calc-out-l{font-family:var(--mono);font-size:.72rem;letter-spacing:.1em;text-transform:uppercase;color:var(--gold-lt,#e8c96b)}
.calc-out-v{font-family:var(--ff-head);font-weight:700;font-size:2.1rem;color:#fff;line-height:1}
@media(max-width:560px){.calc-grid{grid-template-columns:1fr}}

.lst a:focus-visible,.lst summary:focus-visible{outline:2px solid var(--gold);outline-offset:3px;border-radius:2px}
@keyframes lstRise{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:none}}
@keyframes lstZoom{from{transform:scale(1.08)}to{transform:scale(1)}}
@media(max-width:860px){
  .lst-hero{grid-template-columns:1fr;min-height:auto}
  .lst-hero-photo{order:0;height:40vh}
  .lst-hero-panel{order:1;padding:2.6rem 1.6rem 3rem}
  .lst-stop{grid-template-columns:1fr;gap:1.2rem}
  .lst-offer-inner{grid-template-columns:1fr;gap:2rem}
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
    <p>${spec.ctaSub || 'Have a real conversation with Adams, Cameron &amp; Co. about getting licensed and launching across Volusia and Flagler County. No pressure. Just a clear picture of the path.'}</p>
  </div>
  <div class="lst-offer-actions">
    <a href="${spec.ctaBtn1Href || 'join.html'}" class="lst-btn solid">${esc(spec.ctaBtn1Label || 'Talk to a manager')} &rarr;</a>
    <a href="${spec.ctaBtn2Href || 'new-agents.html'}" class="lst-btn ghost">${esc(spec.ctaBtn2Label || 'See the new-agent support')}</a>
  </div>
</div></section>`;

const SCRIPTS = '\n<script src="js/shared.js"></script>\n</body>\n</html>\n';

// ── AEO: schema + on-page blocks engineered for AI citation ──────────────────
const stripTags = (s) => String(s).replace(/<[^>]+>/g, '');
const UPDATED_LABEL = 'June 2026';
const UPDATED_ISO = '2026-06-01';

function articleNode(spec, url) {
  const iso = spec.updated || UPDATED_ISO;
  return {
    '@type': 'Article', '@id': `${url}#article`,
    headline: stripTags(spec.h1), description: spec.metaDesc, url,
    datePublished: iso, dateModified: iso, inLanguage: 'en-US',
    author: { '@id': `${SITE}/#organization` }, publisher: { '@id': `${SITE}/#organization` },
    mainEntityOfPage: url, about: spec.about || 'Real estate careers in Volusia and Flagler County, Florida',
    ...(spec.answer ? { abstract: spec.answer } : {}),
    speakable: { '@type': 'SpeakableSpecification', cssSelector: ['.lst-answer', '.lst-takeaways'] },
  };
}
function howToNode(spec, url) {
  if (!spec.howto || !spec.howto.length) return null;
  return { '@type': 'HowTo', '@id': `${url}#howto`, name: spec.howtoName || stripTags(spec.h1), description: spec.metaDesc,
    step: spec.howto.map((s, i) => ({ '@type': 'HowToStep', position: i + 1, name: s.name, text: s.text })) };
}
// full page graph: org + site + dated article + breadcrumb + howto? + faq?
function pageGraph(spec, url, crumbs) {
  const g = [ORG, WEBSITE, articleNode(spec, url), breadcrumb(crumbs)];
  const h = howToNode(spec, url); if (h) g.push(h);
  const f = faqSchema(spec.faq); if (f) g.push(f);
  return g;
}
// auto internal-linking: link every page to siblings + its track hub, drawn
// from the registry, so nothing is orphaned and authority flows (scales to 1,500)
function relatedGuides(spec) {
  const me = MANIFEST.pages.find((p) => p.slug === spec.slug);
  if (!me) return '';
  const exists = (s) => s !== spec.slug && slugExists(s);
  const pool = MANIFEST.pages.filter((p) => p.type !== 'hub' && exists(p.slug));
  const samePillar = pool.filter((p) => p.pillar === me.pillar);
  const sameTrack = pool.filter((p) => p.track === me.track && p.pillar !== me.pillar);
  const crossTrack = pool.filter((p) => p.track !== me.track);
  const links = [];
  const hub = (MANIFEST.tracks || []).find((t) => t.id === me.track);
  if (hub && exists(hub.hub)) links.push({ slug: hub.hub, title: hub.title });
  // Rotate the SAME-PILLAR pool by this page's own position in the registry.
  // Without any rotation every page in a pillar took the same first six, so the
  // block fed a handful of pages and starved the rest: measured 2026-08-24,
  // 460 of 537 pages received zero links from here while one received 102, and
  // 77 of the 89 brokerage-comparison pages had none.
  //
  // Rotate WITHIN samePillar, not across the whole concatenated pool. Rotating
  // the flat list pushes almost every page's window past the same-pillar region
  // into unrelated cross-track pages: it spreads the links but only 19% of them
  // stay topically related, which is worse than the starvation it fixes.
  // Rotating inside the pillar keeps that at 100% and still distributes:
  // zero-link pages 460 -> 38, median inbound 0 -> 5, max 102 -> 14.
  // Index-based so it stays deterministic: same registry, same links, every build.
  const meIdx = MANIFEST.pages.findIndex((p) => p.slug === spec.slug);
  let rotated = samePillar;
  if (samePillar.length > 1 && meIdx > 0) {
    const k = meIdx % samePillar.length;
    rotated = [...samePillar.slice(k), ...samePillar.slice(0, k)];
  }
  for (const p of [...rotated, ...sameTrack, ...crossTrack]) {
    if (links.length >= 6) break;
    if (!links.some((l) => l.slug === p.slug)) links.push({ slug: p.slug, title: p.title });
  }
  if (links.length < 2) return '';
  return `
<section class="lst-related"><div class="lst-narrow">
  <p class="lst-kicker">Keep reading</p>
  <h2>Related guides</h2>
  <ul>${links.map((l) => `<li><a href="${l.slug}.html">${esc(l.title)}</a></li>`).join('\n    ')}</ul>
</div></section>`;
}

// Cross-link into the proven-winning county brokerage-comparison page (real
// GSC data, 2026-07-24: 5-25x every other page's CTR) from the aspiring
// track's city-level license/decide pillar pages, which don't naturally
// surface it via relatedGuides()'s same-pillar pooling since they sit in a
// different pillar entirely. 42 pages qualify (21 become-a-real-estate-agent-*
// + 21 how-much-do-real-estate-agents-make-*).
function winnerCrossLink(spec) {
  const me = MANIFEST.pages.find((p) => p.slug === spec.slug);
  if (!me || me.track !== 'aspiring' || !['license', 'decide'].includes(me.pillar) || !me.place) return '';
  const market = (MANIFEST.markets || []).find((mk) => mk.place === me.place);
  if (!market) return '';
  const countySlug = market.county === 'Flagler' ? 'flagler-county' : 'volusia-county';
  const winnerSlug = `best-real-estate-brokerage-to-join-${countySlug}`;
  if (winnerSlug === spec.slug || !slugExists(winnerSlug)) return '';
  const countyName = market.county === 'Flagler' ? 'Flagler County' : 'Volusia County';
  return `
<section class="lst-related"><div class="lst-narrow">
  <p class="lst-kicker">Before you choose</p>
  <p><a href="${winnerSlug}.html">See the full brokerage comparison for ${esc(countyName)} &rarr;</a></p>
</div></section>`;
}

// Same pattern, referral track: the 2 new referral-only brokerage comparison
// pages (2026-07-24) have no aspiring/experienced-style geo winner check
// since the 14 existing referral pages are FL-statewide, not city-bound, so
// there's no single county to disambiguate to. Link to both.
function referralWinnerCrossLink(spec) {
  const me = MANIFEST.pages.find((p) => p.slug === spec.slug);
  if (!me || me.track !== 'referral' || me.type === 'hub' || me.format === 'comparison') return '';
  const winners = [
    { slug: 'best-referral-only-brokerage-volusia-county', name: 'Volusia County' },
    { slug: 'best-referral-only-brokerage-flagler-county', name: 'Flagler County' },
  ].filter((w) => slugExists(w.slug));
  if (!winners.length) return '';
  return `
<section class="lst-related"><div class="lst-narrow">
  <p class="lst-kicker">Before you choose where to park your license</p>
  <p>${winners.map((w) => `<a href="${w.slug}.html">See the referral-only brokerage comparison for ${esc(w.name)} &rarr;</a>`).join('<br/>')}</p>
</div></section>`;
}

// on-page: liftable answer + key takeaways + freshness byline
function aeoTop(spec) {
  const out = [`<p class="lst-updated">Updated ${esc(spec.updatedLabel || UPDATED_LABEL)} · Reviewed by Adams, Cameron &amp; Co.</p>`];
  const answer = spec.answer || spec.tldr;
  if (answer) out.push(`<div class="lst-answer"><span class="lst-answer-l">Quick answer</span><p>${answer}</p></div>`);
  if (spec.takeaways && spec.takeaways.length)
    out.push(`<div class="lst-takeaways"><span class="lst-tk-l">Key takeaways</span><ul>${spec.takeaways.map((t) => `<li>${t}</li>`).join('')}</ul></div>`);
  return out.join('\n  ');
}

// Market rank: markets[] is authored biggest/highest-priority first, so its
// array index doubles as a sort key. A page counts as "geo" if its .place
// field names a market, or (parks/neighborhoods specs) its title does.
const MARKET_RANK = new Map((MANIFEST.markets || []).map((mk, i) => [mk.place.toLowerCase(), i]));
function marketRankFor(pg) {
  if (pg.place && MARKET_RANK.has(pg.place.toLowerCase())) return MARKET_RANK.get(pg.place.toLowerCase());
  const title = (pg.title || '').toLowerCase();
  let best = -1;
  for (const [place, rank] of MARKET_RANK) {
    if (title.includes(place) && (best === -1 || rank < best)) best = rank;
  }
  return best; // -1 = not a geo page
}

// Hub clusters: use hand-listed spec.clusters, else auto-build from the registry
// (this track's pillars × their pages) so a hub always reflects the manifest.
// Within a pillar, geo pages sort by real market size/priority (not the order
// they happened to be written in) and sit ahead of undifferentiated topical
// FAQs, which sort alphabetically — so "Daytona Beach" isn't shuffled in
// randomly next to "Bunnell", and a topic question isn't buried mid-roster.
function hubClusters(spec) {
  if (spec.clusters) return spec.clusters;
  if (!spec.track) return [];
  return MANIFEST.pillars.filter((pl) => pl.track === spec.track).map((pl) => {
    const pages = MANIFEST.pages.filter((pg) => pg.track === spec.track && pg.pillar === pl.id && pg.type !== 'hub');
    // Proven-winner boost (real GSC data, 2026-07-24): the county-level "brokerage
    // to join"/"brokerage for experienced agents" pages convert at 5-25x every other
    // page on the site (up to 100% CTR at position 1) when Google shows them, but sat
    // buried at market-rank 9/10 behind every individual city. Pin those specific,
    // proven slug patterns to the top of their pillar regardless of city population
    // rank. Deliberately narrow: does NOT include "company to work for" county pages,
    // which share the same pillar/format but convert at 0% -- the win is specific to
    // the "brokerage" phrasing, not "county-level comparison" in general.
    const isProvenWinner = (pg) => /county$/i.test(pg.place || '') && /^best-real-estate-brokerage-to-join-|^best-brokerage-experienced-agents-/.test(pg.slug || '');
    const geo = pages.filter((pg) => marketRankFor(pg) !== -1)
      .sort((a, b) => (isProvenWinner(b) - isProvenWinner(a)) || (marketRankFor(a) - marketRankFor(b)));
    const topic = pages.filter((pg) => marketRankFor(pg) === -1).sort((a, b) => a.title.localeCompare(b.title));
    const spokes = [
      ...geo.map((pg) => ({ slug: pg.slug, title: pg.title, group: 'geo' })),
      ...topic.map((pg) => ({ slug: pg.slug, title: pg.title, group: 'topic' })),
    ];
    return { name: pl.title, spokes };
  });
}

// ── HUB ─────────────────────────────────────────────────────────────────────
function renderHub(spec) {
  const url = `${SITE}/${spec.slug}`;
  const crumbs = [{ name: 'Home', url: `${SITE}/` }, { name: spec.crumb || 'Become an Agent', url }];
  const itemList = { '@type': 'ItemList', itemListElement: [] };
  let pos = 0;
  const clusters = hubClusters(spec);
  const n = clusters.length;

  const stops = clusters.map((cl, ci) => {
    // Feature the published guides as live rows; fold the rest into a single
    // quiet "+N more publishing soon" line so the page never looks unfinished.
    const liveSpokes = cl.spokes.filter((sp) => slugExists(sp.slug));
    const comingCount = cl.spokes.length - liveSpokes.length;
    const geoLive = liveSpokes.filter((sp) => sp.group === 'geo');
    const topicLive = liveSpokes.filter((sp) => sp.group === 'topic');
    const renderGroup = (spokes) => spokes.map((sp, i) => {
      itemList.itemListElement.push({ '@type': 'ListItem', position: ++pos, url: `${SITE}/${sp.slug}`, name: sp.title });
      const num = String(i + 1).padStart(2, '0');
      return `<li class="lst-row"><a href="${sp.slug}.html"><span class="lst-row-no">${num}</span><span class="lst-row-t">${esc(sp.title)}</span><span class="lst-row-arr">&rarr;</span></a></li>`;
    }).join('\n      ');
    let rows;
    if (geoLive.length && topicLive.length) {
      rows = renderGroup(geoLive)
        + `\n      <li class="lst-row"><div class="lst-more">By topic</div></li>\n      `
        + renderGroup(topicLive);
    } else {
      rows = renderGroup(geoLive.length ? geoLive : topicLive);
    }
    if (comingCount) {
      const label = liveSpokes.length ? `${comingCount} more guide${comingCount > 1 ? 's' : ''} in this stop &middot; publishing soon`
        : `${comingCount} guide${comingCount > 1 ? 's' : ''} publishing soon`;
      rows += `\n      <li class="lst-row"><div class="lst-more">${label}</div></li>`;
    }
    const j = (spec.journey && spec.journey[ci]) || {};
    return `<section class="lst-stop">
  <div class="lst-stop-head">
    <span class="lst-stop-fig">${String(ci + 1).padStart(2, '0')}</span>
    <span class="lst-stop-no">Stop ${String(ci + 1).padStart(2, '0')} of ${String(n).padStart(2, '0')}</span>
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
  <div class="lst-hero-photo">
    <img src="${spec.heroImg}" alt="${esc(spec.heroAlt || 'Volusia and Flagler County, Florida coast')}" fetchpriority="high" width="1500" height="1000" />
    <span class="lst-photo-tag">${esc(spec.photoTag || 'Listing № 1963 · Volusia–Flagler Co., FL')}</span>
  </div>
  <div class="lst-hero-panel">
    <span class="lst-status">${esc(spec.heroStatus || 'Now accepting · for the right person')}</span>
    <h1>${spec.h1}</h1>
    <p class="lst-hero-sub">${spec.lede}</p>
    <div class="lst-spec-grid">${spec4}</div>
    <div class="lst-hero-actions">
      <a href="#tour" class="lst-btn solid">See the path &darr;</a>
      <a href="join.html" class="lst-btn ghost">Talk to a manager</a>
    </div>
  </div>
</header>

<div class="lst-crumb"><div class="lst-wrap"><a href="index.html">Home</a><span>&rsaquo;</span>${esc(spec.crumb || 'Become an Agent')}</div></div>

<section class="lst-lead" id="tour"><div class="lst-wrap">
  <p class="lst-kicker">${esc(spec.tourKicker || 'The showing · four stops')}</p>
  <h2>${esc(spec.tourTitle || 'From &ldquo;thinking about it&rdquo; to your first SOLD sign.')}</h2>
  <p>${spec.tourLede || ''}</p>
</div></section>

<div class="lst-tour"><div class="lst-wrap">
${stops}
</div></div>
${spec.pullQuote ? `
<section class="lst-quote"><div class="lst-narrow">
  <p class="lst-kicker">${esc(spec.pullQuoteKicker || 'The culture you&rsquo;re joining')}</p>
  <blockquote>${esc(spec.pullQuote)}</blockquote>
  ${spec.pullQuoteCite ? `<cite>${esc(spec.pullQuoteCite)}</cite>` : ''}
</div></section>` : ''}

${relatedGuides(spec)}
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

  const graph = pageGraph(spec, url, crumbs);

  const crumbHtml = `<div class="lst-crumb"><div class="lst-wrap"><a href="index.html">Home</a><span>&rsaquo;</span>${spec.hub ? `<a href="${spec.hub.slug}.html">${esc(spec.hub.name)}</a><span>&rsaquo;</span>` : ''}${esc(spec.crumb || spec.h1)}</div></div>`;

  const body = `${STYLE}
<body data-page="${spec.slug}" class="lst">

<header class="lst-art-head">
  <img class="lst-hero-bg" src="${spec.heroImg}" alt="${esc(spec.heroAlt || (spec.place ? spec.place + ', Florida coastline' : 'Volusia and Flagler County, Florida coast'))}" fetchpriority="high" width="1500" height="900" />
  <div class="lst-hero-scrim"></div>
  <div class="lst-art-head-inner">
    <span class="lst-kicker" style="color:var(--gold)">${esc(spec.eyebrow)}</span>
    <h1>${spec.h1}</h1>
  </div>
</header>
${crumbHtml}

<article class="lst-art">
  ${aeoTop(spec)}
  ${spec.body}
  ${spec.hub ? `<a class="lst-back" href="${spec.hub.slug}.html">&larr; Back to ${esc(spec.hub.name)}</a>` : ''}
</article>

${winnerCrossLink(spec)}
${referralWinnerCrossLink(spec)}
${relatedGuides(spec)}
${faqHtml(spec)}
${offerHtml(spec)}`;

  return head(spec, graph) + body + SCRIPTS;
}

// ── COMPARISON (the citation wedge) ─────────────────────────────────────────
// spec.compare = { columns:[...], highlight:0, rows:[{label, values:[...]}] }
function renderComparison(spec) {
  const url = `${SITE}/${spec.slug}`;
  const crumbs = [{ name: 'Home', url: `${SITE}/` }];
  if (spec.hub) crumbs.push({ name: spec.hub.name, url: `${SITE}/${spec.hub.slug}` });
  crumbs.push({ name: spec.crumb || spec.h1, url });

  const c = spec.compare || { columns: [], rows: [] };
  const hi = c.highlight ?? 0;
  const thead = `<tr><th class="c-crit"></th>${c.columns.map((col, i) => `<th${i === hi ? ' class="c-win"' : ''}>${esc(col)}</th>`).join('')}</tr>`;
  const tbody = c.rows.map((r) => `<tr><th class="c-crit">${esc(r.label)}</th>${r.values.map((v, i) => `<td${i === hi ? ' class="c-win"' : ''}>${v}</td>`).join('')}</tr>`).join('\n      ');

  const graph = pageGraph(spec, url, crumbs);

  const crumbHtml = `<div class="lst-crumb"><div class="lst-wrap"><a href="index.html">Home</a><span>&rsaquo;</span>${spec.hub ? `<a href="${spec.hub.slug}.html">${esc(spec.hub.name)}</a><span>&rsaquo;</span>` : ''}${esc(spec.crumb || spec.h1)}</div></div>`;

  const body = `${STYLE}
<body data-page="${spec.slug}" class="lst">

<header class="lst-art-head">
  <img class="lst-hero-bg" src="${spec.heroImg}" alt="${esc(spec.heroAlt || (spec.place ? spec.place + ', Florida coastline' : 'Volusia and Flagler County, Florida coast'))}" fetchpriority="high" width="1500" height="900" />
  <div class="lst-hero-scrim"></div>
  <div class="lst-art-head-inner">
    <span class="lst-kicker" style="color:var(--gold)">${esc(spec.eyebrow || 'The honest comparison')}</span>
    <h1>${spec.h1}</h1>
  </div>
</header>
${crumbHtml}

<article class="lst-art lst-art-wide">
  ${aeoTop(spec)}
  ${spec.intro || ''}
  <div class="cmp-wrap"><table class="cmp">
    <thead>${thead}</thead>
    <tbody>
      ${tbody}
    </tbody>
  </table></div>
  ${c.note ? `<p class="cmp-note">${c.note}</p>` : ''}
  ${spec.body || ''}
  ${spec.hub ? `<a class="lst-back" href="${spec.hub.slug}.html">&larr; Back to ${esc(spec.hub.name)}</a>` : ''}
</article>

${winnerCrossLink(spec)}
${referralWinnerCrossLink(spec)}
${relatedGuides(spec)}
${faqHtml(spec)}
${offerHtml(spec)}`;

  return head(spec, graph) + body + SCRIPTS;
}

const RENDERERS = { hub: renderHub, comparison: renderComparison };
const renderSpec = (spec) => (RENDERERS[spec.format] || RENDERERS[spec.type] || renderArticle)(spec);

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
    const html = renderSpec(spec);
    fs.writeFileSync(path.join(ROOT, `${spec.slug}.html`), html);
    console.log(`  ✓ ${(spec.format || spec.type).padEnd(10)} ${spec.slug}.html`);
    n++;
  }
  return n;
}

module.exports = { renderHub, renderArticle, renderComparison, renderSpec, buildSpecs, ORG, WEBSITE, SITE };

if (require.main === module) {
  const n = buildSpecs(process.argv.slice(2));
  console.log(`\nBuilt ${n} page(s).`);
}
