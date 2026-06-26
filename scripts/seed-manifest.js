#!/usr/bin/env node
/*
 * seed-manifest.js — ONE-TIME generator for content/manifest.js
 *
 * Reads the audited content plan (the 224-page library blueprint from the
 * AI-Visibility audit) and emits the site registry: the taxonomy of pillars
 * plus every planned page with a status. This registry is the single source
 * of truth the build reads — it holds the whole 1,000–1,500 page vision as
 * data, so the site scales without hand-wiring files.
 *
 * Re-run only to re-seed from the audit plan; day-to-day you edit manifest.js
 * (mark pages built, add new ones) directly.
 */
const fs = require('fs');
const path = require('path');

// the audited plan lives in the AI-Visibility engine repo (provenance)
const PLAN = '/Users/mattg/ai-visibility-engine/audits/florida-real-estate-careers/data.json';

// universe name (from the audit) → our pillar definition
const PILLARS = {
  'Local Area Pages':                                          { id: 'local',       title: 'Real Estate Careers by City',          hub: 'real-estate-careers-volusia-flagler' },
  'Getting Your Florida Real Estate License':                  { id: 'license',     title: 'Get Your Florida License',             hub: 'florida-real-estate-license' },
  "Is a Real Estate Career Right for You?":                    { id: 'decide',      title: 'Decide If It’s Right for You',          hub: 'is-real-estate-career-right-for-you' },
  'Choosing the Right Brokerage in Volusia & Flagler County':  { id: 'brokerage',   title: 'Choose the Right Brokerage',           hub: 'choosing-a-real-estate-brokerage' },
  'Building Your Real Estate Business in Volusia & Flagler County': { id: 'business', title: 'Build Your Business',                 hub: 'building-your-real-estate-business' },
  'Understanding the Volusia & Flagler County Real Estate Market':  { id: 'market',  title: 'Know the Local Market',               hub: 'volusia-flagler-real-estate-market' },
  'New Agent Training, Tools & Resources':                     { id: 'training',    title: 'Training, Tools & Resources',          hub: 'new-agent-training' },
  'Agent Career Advancement & Licensing Upgrades':             { id: 'advancement', title: 'Advance & Upgrade Your License',       hub: 'real-estate-license-upgrades' },
  'Costs, Income & Financial Reality of Real Estate Careers':  { id: 'income',      title: 'Income, Costs & Tools',                hub: 'real-estate-agent-income-florida' },
  'Local Career Stories, Culture & Community':                 { id: 'stories',     title: 'Stories, Culture & Community',          hub: 'real-estate-agent-stories-daytona' },
};

const slugify = (s) => s.toLowerCase()
  .replace(/&/g, ' and ').replace(/[''.,?:()"]/g, '').replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '').replace(/-+/g, '-').slice(0, 80);

// pages already built (their real slugs) → mark built + point at their spec
const BUILT = {
  'become-a-real-estate-agent-in-florida': { type: 'hub', pillar: 'master', spec: 'content/become-a-real-estate-agent-in-florida.json' },
  'florida-real-estate-license-guide':     { type: 'article', pillar: 'license', spec: 'content/florida-real-estate-license-guide.json' },
  'become-a-real-estate-agent-daytona-beach': { type: 'article', pillar: 'local', spec: 'content/become-a-real-estate-agent-daytona-beach.json' },
};

const plan = JSON.parse(fs.readFileSync(PLAN, 'utf8')).contentPlan;

const pillars = [
  { id: 'master', title: 'Become a Real Estate Agent in Florida', hub: 'become-a-real-estate-agent-in-florida', kicker: 'The master guide' },
];
const pages = [];
const seen = new Set();

// master hub page
pages.push({ slug: 'become-a-real-estate-agent-in-florida', type: 'hub', pillar: 'master', title: 'How to Become a Real Estate Agent in Florida', status: 'built', spec: BUILT['become-a-real-estate-agent-in-florida'].spec });
seen.add('become-a-real-estate-agent-in-florida');

for (const u of plan.universes) {
  const p = PILLARS[u.name];
  if (!p) { console.error('! unmapped universe:', u.name); continue; }
  pillars.push({ id: p.id, title: p.title, hub: p.hub, universe: u.name, format: u.type, planned: u.count });
  // the pillar's own hub page (a cluster hub)
  if (!seen.has(p.hub)) {
    pages.push({ slug: p.hub, type: 'hub', pillar: p.id, title: p.title, status: 'planned' });
    seen.add(p.hub);
  }
  for (const title of (u.titles || [])) {
    let slug = slugify(title);
    if (seen.has(slug)) slug = `${slug}-${p.id}`;
    if (seen.has(slug)) continue;
    seen.add(slug);
    const built = BUILT[slug];
    pages.push({ slug, type: built ? built.type : 'article', pillar: p.id, title, status: built ? 'built' : 'planned', ...(built ? { spec: built.spec } : {}) });
  }
}

// fold in built pages whose titles didn't match a planned slug
for (const [slug, b] of Object.entries(BUILT)) {
  if (!seen.has(slug)) {
    pages.push({ slug, type: b.type, pillar: b.pillar, title: slug, status: 'built', spec: b.spec });
    seen.add(slug);
  }
}

const out = `/*
 * manifest.js — THE SITE REGISTRY (single source of truth).
 *
 * Every page the site has or plans to have lives here. The build reads this to
 * render pages, auto-generate sitemap.xml + llms.txt, wire navigation and
 * breadcrumbs, and report coverage. Add a page = add a row here. Holds the full
 * 1,000–1,500 page vision as data — generated from the audited content plan,
 * then maintained by hand (flip status 'planned' → 'built' as pages ship).
 *
 * Generated by scripts/seed-manifest.js · ${pages.length} pages across ${pillars.length} pillars.
 */
module.exports = {
  site: 'https://floridarealtorcareers.com',
  brand: 'Florida Realtor Careers — Adams, Cameron & Co., Realtors',
  pillars: ${JSON.stringify(pillars, null, 2)},
  pages: ${JSON.stringify(pages, null, 2)},
};
`;
fs.writeFileSync(path.join(__dirname, '..', 'content', 'manifest.js'), out);
const built = pages.filter((p) => p.status === 'built').length;
console.log(`✓ manifest.js: ${pages.length} pages (${built} built / ${pages.length - built} planned) across ${pillars.length} pillars`);
