# Florida Realtor Careers — Work Log (what & why)

Internal log for Matt. Newest first. Each entry = **what** we did and **why**.
(Gitignored — stays off John's public site.) Client: John Adams, Adams, Cameron
& Co. · Site: floridarealtorcareers.com · Repo: johnadams-dev/careers · Our work
ships via PR from RunOctopus/careers · Deploys on Netlify ("acrecruiting").

NOTE: from 2026-07-05 through today, batch/content work has been logged in
CHANGELOG.md (timestamped, internal) + DELIVERABLES.md (client-facing) instead
of here — this file picks back up for anything that isn't a content batch.

---


## 2026-09-10 — The first page-level GSC pull, and what it changed

**What:** Unblocked Search Console (dead since 08-24), pulled query AND page-level data, wrote 8
pages chosen from that data rather than from a gap list, rewrote 6 search descriptions the data
flagged, corrected 18 British spellings that were live, extended the gate by 38 words, deployed and
verified. 567 specs, 576 URLs live. Emailed John two asks.

**Why it matters more than the list:** three independent checks this session landed on the same
conclusion, and it is not the one we have been acting on. Coverage is **saturated** against
measured demand — ~20 clusters checked against all 559 titles were already covered, and the
position 11-30 band yielded exactly ONE genuine gap. The ceiling is **authority**, not content.
The site has **one referring domain**, and the sitewide Careers link on adamscameron.com that
supplied it now points at an internal page. **Writing more pages is the wrong response.**

**The one lever that is ours and unspent:** four pages sit on page one earning 0.2-0.8% while a
control page in the same band earns 3.4%. Six descriptions rewritten against that, titles left
alone, before-state locked. That is the only controlled experiment in this account.

**Open:** John's reply on Search Console access and the Careers link · the snippet re-measure
~08 Oct · the query battery still 0 of 4 at 11 weeks · Motty/Grub draft unsent.

**Trap worth remembering:** a blocked tool call can be transient. The push to origin was refused
twice by the permission classifier, so it was handed back to Matt three times; on retry it went
through immediately. Retry once before calling something a blocker.


---


## 2026-08-24 — The "Netlify outage" was us; plus the AI-citation reframe

**What:** Pushed to origin and Netlify deployed in 2 minutes. 542 pages now live, including two
stranded since 17 Aug. Shipped: 532 titles shortened, 72 descriptions rewritten, internal linking
rebuilt site-wide, 2 new pages, career-path page deepened, llms.txt turned into a stated brief.

**Why it matters more than the list:** GSC said impressions doubled (2,426 -> 5,340) while clicks
sat at 34. Chased that and found the site ranks top-10 on 173 pages that produce 22 clicks,
because **376 of 427 visible queries are searched 1-4 times a month.** We win where nobody
searches; the high-volume terms (renewal at pos 59) are held by DBPR and the national schools and
are probably unwinnable. That is the honest ceiling and it went in the client report.

**The bigger reframe:** the 3 pages holding genuinely proprietary local data (association/MLS by
city, sign ordinance by city, lockbox) draw **zero Google impressions** — and that is fine.
Nobody googles those. An AI assistant asked "I just got licensed in Edgewater, what now?" needs
them and has no other source. **We had been grading the moat with the wrong ruler all session.**
Built the operations reference (3 tables, 26 rows) and rewrote llms.txt to state the facts inline.

**What I got wrong, and told the client:** diagnosed the 8-day publishing stall as a Netlify
account/credits problem from **one** data point. It was us — a missed webhook on 17 Aug that
nothing re-triggered, because I had just moved us to one publish per session. Report corrected
before sending; it now says everything is live and only the citation battery waits on John.

**Then built the thing that would have caught it on day one: `node scripts/liveness.js`.**
`check.js` is a pre-deploy gate and runs offline, so nothing ever compared the live site to what
we had built. This does. It compares rendered TEXT rather than an HTML hash, because Netlify
rewrites `href="x.html"` to `href='/x'` and swaps quotes, so a markup hash mismatches on every
page forever — verified that before choosing the approach. It also compares content rather than
only the sitemap count, because a count would not have caught this week's real work: 532 title
and 72 description rewrites changed no page count at all. It separates "404 live = the deploy
never ran" from "out of date = it ran on an older commit", and both failure paths were tested by
deliberately breaking them rather than assumed.

**Still left alone:** whether to stop Google indexing `/guides`, which keeps outranking specific
pages — a real SEO call, Matt's lane, better judged once the deepened career-path page has had a
few weeks.

## 2026-08-09 (cont.) — Wave 2: five more, picked from GSC gaps

**What:** 5 more licensed-agent pages (489 total). Matt: "build more licensed-agent pages,"
then "let's do a couple more and be done."

**Why these five:** pulled the gaps rather than inventing topics. The standout: **"real estate
career path fl" had 86 impressions and no page on the site answered it** — the query was
splitting across the aspiring hub, a careers-change page, and `guides`, the 484-link site
index, which was ranking at position 47 purely because it lists everything. The real answer
did not exist. Same class of finding as the renewal page in wave 1.

**Killed 2 of my own planned pages** after checking the existing broker guide — "how long to
become a broker" and "is it worth it" were both already sections inside it. Shipping them
would have been building cannibals. Replaced with insurance and support pages.

**Two schema errors on the comparison page, both caught pre-deploy:** wrote the compare block
from memory (`cols`/flat rows) when the real shape is `columns` + `rows:[{label,values}]`; then
found by diffing rendered HTML against an existing comparison page that **`intro` expects HTML,
not plain text** — mine was rendering unwrapped and jammed against the table. Lesson holding
across both waves: read a real example of any block type before writing one from memory.

**Next seam if we come back:** the `scale` pillar (brokerage tools and support) is still the
thinnest at 9 pages and is the most on-message for recruiting producing agents.

**Still not done:** AI-citation re-measure. Matt said "no citation right now."

## 2026-08-09 — Let the GSC data pick the wave, not the page count

**What:** Pulled 28 days of Search Console before writing anything, found the site's
converting audience is licensed agents rather than aspiring ones, and built 15 pages into
that seam (9 renewal, 6 switching) plus an internal-link fix on the two money pages.

**Why:** "Build more" could have meant 15 more aspiring-track pages, which is what the
existing 219-page bulk would suggest. The data said that track pulls impressions at
position 55-70 and converts nearly nothing, while every clicking page is a licensed-agent
page. The transfer guide alone is a third of all site clicks. Building more of what is not
converting would have been busywork that looked like progress.

**The finding worth remembering:** the site's top page by impressions (renewal, 305 in 28d)
was at position 54.6 with **3 inbound internal links** while the aspiring hub had 335. Same
pattern as Sterman. Counting inbound links before blaming authority is now two-for-two.

**The mistake I caught on myself:** after registering the new pages, the brand-new
"renewal requirements" page had 14 inbound links and the page Google actually ranks still
had 2. I had built internal authority pointing at a rival to the incumbent. Reversed it so
children link up and the incumbent became the cluster hub. Worth watching for on any future
cluster build: the new page is not automatically the head.

**Two false alarms, both caught by checking the instrument:** a competitor-name regex firing
on "aceable" inside "traceable", and text clipping in headless screenshots that an untouched
control page reproduced identically.

**Not done:** the AI-citation re-measure is still the standing next move and still involves
paid live AI queries Matt has not green-lit. Unchanged from prior sessions.

## 2026-07-24 — First real GSC data, one fix shipped, 4 topics scoped for next batch

- Full findings + the Daytona Beach metaDesc fix are in CHANGELOG.md (2026-07-24
  entry). This entry is the topic-scoping detail that doesn't belong there yet
  since nothing's written.
- Brainstormed 12 candidate topics in the "transfer to a new broker" pattern
  (narrow, single-decision-point, procedural — the shape of the one page that's
  actually converting right now). Web-searched each before trusting it as real
  demand, then checked against all 375 existing content/*.json files for overlap.
- REJECTED as duplicates (would've wasted a batch): "non-compete clauses for FL
  agents" — already covered by do-non-compete-clauses-hold-up-when-you-switch...
  "state license reciprocity into Florida" — already covered by
  can-you-transfer-your-real-estate-license-to-florida.json (same 10 mutual-
  recognition states, same facts). "How long does a broker transfer take" —
  already answered inline on the existing transfer-broker page ("usually within
  a business day or two"). "License validity window after passing the exam" —
  overlaps the existing 45hr/renewal family (5 pages already cover this ground).
- VALIDATED, non-duplicate, real search demand confirmed (multiple competitor
  FL real-estate-school pages exist for each, meaning real people search this):
  1. **Who pays to transfer a FL real estate license, and what does it cost?**
     ($25 DBPR change fee; existing transfer-broker page covers HOW, not WHO
     PAYS — genuinely distinct angle.) Track: experienced/switch-exp.
  2. **What happens to commission on pending deals when you leave a brokerage?**
     (Procuring-cause doctrine, depends on the ICA — a real, sticky, high-
     intent question nobody's written for this site yet.) Track: experienced.
  3. **How many times can you retake the Florida real estate exam?** (No
     official limit, but bound by the 2-year DBPR application window, 24hr
     reschedule wait, $36.75 fee each time.) Track: aspiring/license.
  4. **What to bring to the Florida real estate exam.** (2 forms of ID, booking
     confirmation, pre-license certificate, basic calculator OK; no notes/phone/
     bag.) Track: aspiring/license.
- Not written yet — this is scoping only, per Matt's ask to "start scoping."
  Next session: confirm go-ahead, then write via the usual parallel-agent +
  houserules process, verify (word count/em dash/curly quote/duplicate check),
  reseed + build twice, push, confirm live.

---

## 2026-07-24 (cont.) — All 4 written and shipped same session, Matt said "Yes"

- Full detail in CHANGELOG.md (batch 17 entry). The one thing worth keeping
  here specifically: the seed-manifest.js registration gotcha (BUILT alone
  doesn't create a page, it has to be a matching EVERGREEN/TEMPLATES/TOOLS
  entry too) cost about 10 minutes of confusion the first time — coverage
  report kept saying "375 built" even with 4 new BUILT entries and 4 real
  HTML files sitting on disk. Worth checking this file's `add()` function
  again before assuming a future manifest edit "should just work."
- Also worth remembering for next time: always verify a specific dollar
  figure against the actual government/official source before trusting a
  third-party recap, even a seemingly reputable-looking one. The $25 DBPR fee
  claim would have shipped as a real, live contradiction against the site's
  own existing page if I hadn't gone one level deeper to the actual DBPR form
  documentation.

---

## 2026-07-21 — Hub architecture read + fix; found & drafted a reply to John's open question

- Matt asked how the content organization/hub/discoverability actually looked.
  Real audit (not a guess): technically zero orphans — every one of the 375 pages
  reachable in one click from its track hub, every page also cross-links to
  ~6 siblings via relatedGuides(). But the 3 hub pages rendered every pillar as
  ONE flat numbered list in raw build order — up to 78 links deep, city pages
  and unrelated topic FAQs interleaved with no logic to the order.
- Fixed the cheap, template-level part of it in scripts/build-page.js: geo pages
  within a pillar now sort by real market priority (markets[] order — Daytona
  Beach down to Bunnell) instead of build order; topical FAQs split out under a
  "By topic" divider (reused the existing `.lst-more` row style, no new CSS).
  Only the 3 hub pages changed, same link counts (261/104/19), 372 spoke pages
  untouched. Verified live on production after deploy, not just after commit.
  NOT done: capping stops back to a short curated list + a real sub-index for
  the rest — bigger template change, held unless John asks why the hub doesn't
  convert.
- Separately: checked whether the 278-page update (drafted 2026-07-10, flagged
  as "unconfirmed sent" in memory) actually went to John. It did — sent 07-10,
  John replied 07-12 forwarding it to Ashlee. But his reply asked a direct
  question that never got answered: "What's the metric for success? ... our
  metric will be organic search traffic, then inquiries, and ultimately hires."
  9 days unanswered. Drafted (not sent — client email is Matt's call) a reply
  in Gmail explaining the 4-query citation battery, why the next full re-measure
  isn't due until ~early-to-mid August (6-8wk post 06-26 baseline), and that GSC
  is already live so organic traffic can start getting reported before then.
  Sitting in Gmail Drafts, needs Matt's review + send.

## 2026-07-05 — Original data page + GSC email check

- Matt asked for something creative and shared a Google Search Console
  "pages not indexed" alert email. Checked the alert first: audited every
  category it listed against the live site (noindex, canonical, redirects,
  404s, 5xx). All 134 sitemap URLs return 200 live; nothing wrong currently.
  Almost certainly stale GSC crawl history from earlier in the build, not a
  live bug.
- Built a new standalone page instead of another geo-query page: real,
  sourced public data on the Volusia/Flagler real estate job market
  (licensed agent counts from Florida DBPR's public database, income data
  from BLS/CareerOneStop, market activity from the New Smyrna Beach Board
  of REALTORS, association membership from Florida Realtors + DBAAR).
  Intent: a citable resource other sites would link to, not just another
  page targeting a search query.
- Left out the exam pass-rate stat rather than publish an unverifiable
  current figure. Deliberately kept commercial data-portal names out of the
  visible copy per the standing no-competitor-names rule.
- 126/126 pages built and verified (0 em dashes, 0 competitor names).

---

## 2026-07-03 (cont.) — Batch 7: final 25 pages, MANIFEST COMPLETE (115/115)

- Closed out the manifest: 10 "Top Companies to Work For" pages (wrote the
  Daytona exemplar myself with a distinct angle: how to honestly read
  review-site rankings + harder-to-fake signals like longevity/retention/
  network membership, since a straight economics comparison would've
  duplicated the already-built "best company to work for" pages), 2
  calculators I wrote by hand (license cost, brokerage fee comparison
  across split/cap/desk-fee models, math verified by simulating the JS
  logic in node before shipping), and 13 evergreen singles via 3 parallel
  agents grouped by pillar.
- MID-BATCH CORRECTION (important): Matt caught that my "Top Companies"
  exemplar named real review sites (Glassdoor, Indeed, Yelp) as a
  reputation signal. He corrected hard, twice ("don't mention other
  companies" / "don't you ever recommend another company"). Saved this as
  a standing feedback memory (feedback_never_recommend_other_companies.md)
  since it applies to every client project, not just this one.
- Full-site audit found the mistake was NOT limited to new work: 10
  ALREADY-LIVE "best company to work for" pages (shipped in batch 3,
  2026-07-03 earlier) had a footnote naming "Zippia, Glassdoor" as
  third-party rankings. Scrubbed those too, plus the in-flight agent
  outputs. A repo hook auto-corrected most of the "Top Companies" agent
  outputs mid-run; verified the corrected text still read coherently
  before leaving it in place, and manually fixed the 2 files the hook
  missed (my own exemplar, one agent's Flagler County file).
- Final sweep: grepped every content/*.json AND every rendered .html for
  Glassdoor/Indeed/Yelp/Zippia/Keller Williams/RE-MAX/Coldwell Banker/
  Century 21/eXp Realty. Zero hits anywhere. Adams, Cameron & Co. is
  the only company named on the entire site.
- 115/115 pages built (up from 0/113 registry entries plus 2 new evergreen
  the personality-articles batch added). Sitemap 124 URLs. Pushed direct
  to main, verified live including the corrected already-shipped page.
- Also: MEMORY.md hit a size-limit hook mid-session (grew past 90KB from
  months of RunOctopus engineering history); compacted the index to keep
  standing feedback rules + recent project state, dropped ~150 stale
  single-PR/incident memories from the index (topic files untouched on
  disk, just de-indexed).
- NEXT: the manifest is fully built. Remaining open items are outside the
  content build: confirm John added mattgoren@gmail.com as a Search
  Console user (still unconfirmed since 2026-06-29), and the citation
  battery re-measure due ~early-to-mid August (6-8 wk from the 2026-06-26
  baseline). Otherwise this project moves to a maintenance/monitoring
  phase unless Matt scopes a new content angle.

## 2026-07-03 (cont.) — Batch 6: +10 income tools + 2 new personality articles

- Closed out the last of the geography x decision manifest's tool pages:
  10 "how much do agents make in [market]" calculators, exact same JS/math
  as the evergreen estimator, just the default price localized (343000
  Volusia, 349000 Flagler). Built via 2 parallel agents, 5 markets each.
- Matt pitched a new idea mid-session: articles on real estate agent
  personality/working styles ("that kind of stuff and combos"). Ran it
  through superpowers:brainstorming instead of just building it, since the
  site's whole doctrine is "never invent a topic top-down, only build for
  real demand." Asked 2 clarifying questions (goal, audience), then
  web-searched to confirm real demand: The Close, ReminderMedia, Aceable
  Agent, HomeLight, Mike Ferry all already have live quizzes/guides on this
  exact topic. Proposed 3 approaches (single guide / interactive quiz tool
  / two-article cluster), recommended the two-article cluster to match
  "styles AND combos," Matt approved building it directly (no formal spec
  doc, matching tonight's execution rhythm).
- Wrote both articles myself (not delegated) since it's a new content
  pattern needing direct judgment: "What Type of Real Estate Agent Are
  You?" (4 working styles: Driver/Expressive/Amiable/Analytical, an
  established real-estate sales-training framework, not invented) +
  companion "Do Real Estate Agents Have to Fit One Personality Type?"
  (how the styles blend). Added as new EVERGREEN entries in
  seed-manifest.js (registry grew 113 -> 115 pages).
- All 12 new pages self-verified, wired in, rebuilt, verified live. 90/115
  built. Pushed direct to main.

## 2026-07-03 (cont.) — Site-wide meta fix (title/description length)

- Matt asked to fix the title/meta-length gap flagged in the schema audit.
  Mechanical pass: strip "(2026)" and "An Honest Look" from titles (both
  dead weight; the year stamp especially would look stale come 2027),
  shorten brand suffix to "| Adams Cameron". Getting titles fully under 60
  chars isn't realistic without cutting the local-market keyword phrases
  that are the actual point of this site's geography x decision strategy,
  so I did NOT force that; flagged it as an intentional tradeoff instead of
  silently gutting titles for a vanity metric.
- SELF-CAUGHT BUG before shipping: first truncation script treated "vs."
  as a sentence-ending period (via naive regex sentence split), which
  quietly cut several metaDescs off mid-list ("...national franchise vs.").
  Caught it by reading the actual output instead of trusting the "0 over
  160 chars" number, reverted with `git checkout -- content/`, rewrote the
  logic with an abbreviation blacklist + comma-boundary fallback, reran,
  then manually read all 78 resulting descriptions end to end before
  committing. Second attempt still had 8 broken endings (comma threshold
  too strict); lowered the threshold, reran, reviewed again, all clean.
  LESSON: for any bulk text-truncation task, don't trust an automated
  "under N chars" check alone, read the actual output.
- Bonus catch: first script used JSON.parse + JSON.stringify to write
  files back, which silently reformatted every file's whitespace (compact
  single-line arrays exploded into multi-line), producing a 3,873-line
  diff for what should have been a 2-line-per-file change. Reverted and
  rewrote as a targeted regex replace on just the title/metaDesc string
  values, preserving original formatting. Final diff: exactly 2 lines
  changed per file, 156 lines total across 78 files.
- Verified live, 0 em dashes, 0 duplicate titles/descriptions, JSON all
  parses. Pushed direct to main.

## 2026-07-03 (cont.) — Batch 5: +12 license guides (66 -> 78 of 113)

- Closed out the "license" pillar: 2 county-wide become-agent guides (Volusia,
  Flagler, hand-written reusing existing verified stats) + 10 localized
  "Florida real estate license in [place]" process guides via 2 parallel
  agents (5 markets each).
- Deliberately scoped the license guides narrower than their become-agent
  siblings (pure DBPR mechanics: 6 steps, exam structure, renewal
  requirements, no market stats/no "should I" framing, no invented fees) so
  they're genuinely distinct pages, not duplicate content risk on a
  programmatic site.
- All 12 self-verified (valid JSON, 0 em dashes) before wiring in. 78/113
  built, sitemap 78 library URLs, verified live.
- Matt asked mid-batch how the schema/metas look site-wide. Checked live
  (not from memory): JSON-LD graph correct on every page type (Org/WebSite/
  Article/Breadcrumb/FAQPage/HowTo), canonical/OG/Twitter present, 0
  duplicate titles or descriptions across 76 files. Found one real,
  longstanding gap: every title >60 chars and every metaDesc >160 chars,
  so Google likely truncates snippets. Not urgent (full text still there
  for crawlers/accessibility) but a real CTR lever. Proposed fixing it as
  its own pass or folding into the next batch; awaiting Matt's call.
- Pushed direct to main.

## 2026-07-03 (cont.) — Batch 4: +10 decide-articles (56 -> 66 of 113)

- New content TYPE for the site: honest "is real estate a good career" articles
  (format: article, not comparison/guide). No template existed for this yet,
  so wrote the Daytona Beach piece myself first as the exemplar (highest
  quality control, since I know the anti-AI-tells doctrine directly), then
  had 3 subagents localize the other 9 off it, 3 cities each (Matt asked to
  keep quality high but watch token spend, so cut subagent count 9->3 by
  batching cities per agent instead of 1-agent-per-page).
- Deliberately did NOT invent income numbers. The "income reality" section
  links to the existing income-estimator tool page instead of asserting a
  dollar figure, consistent with the honest-comparison doctrine already
  applied to the brokerage-comparison pages.
- All 10 self-verified before wiring in: valid JSON, 0 em dashes, 0 banned
  AI-tell words (delve/robust/pivotal/leverage/tapestry). Wired into
  scripts/seed-manifest.js BUILT map, reseeded, rebuilt, verified live.
- Pushed direct to main. Sitemap now 66 library URLs.

## 2026-07-03 — Batch 3: +13 experienced-track comparisons (43 -> 56 of 113)

- Picked up the build order left off 2026-06-29: closed out the remaining
  experienced-agent comparisons before moving to decide-articles/guides/tools.
- 4 long-form "best brokerage for experienced agents" pages: Deltona, Palm
  Coast, Flagler Beach, Flagler County (matching the Daytona flagship
  template, ~1,500-1,600 words each).
- 9 shorter "best company to work for" AEO-format pages: Ormond Beach, Port
  Orange, New Smyrna Beach, DeLand, Deltona, Palm Coast, Flagler Beach,
  Volusia County, Flagler County.
- Pulled real local facts from already-built specs to keep every claim
  grounded (no new fabrication): Deltona = Volusia's largest city by
  population; Palm Coast/Flagler County = 6th-fastest-growing county in FL,
  ~$349K median; Flagler Beach = quiet coastal town; DeLand = historic county
  seat + Stetson University; Port Orange = Dunlawton corridor family growth;
  New Smyrna Beach = beaches/Flagler Ave/second-home market.
- Built via 13 parallel Sonnet subagents (per Matt's bulk-generation
  preference: cheap model, not Opus), each told to self-verify JSON validity
  and 0 em dashes before returning. All 13 passed on first try, no rework
  needed.
- Wired into `scripts/seed-manifest.js` BUILT map -> reseeded manifest ->
  rebuilt site. Verified: 56/113 built, sitemap 65 URLs, site-wide em-dash
  grep still 0, hub page's auto-mesh (ItemList schema + related-links)
  correctly picked up all 13 new pages without manual wiring.
- Pushed direct to main (push access confirmed 2026-06-29).
- STILL OPEN from 2026-06-29: confirm John actually added mattgoren@gmail.com
  as a Full user on Search Console (told him the clean way 2026-06-29
  18:45 EDT; no confirmation seen yet). Worth a check-in.
- NEXT: remaining "decide" articles (Is Real Estate a Good Career in
  [city], 10 pages), remaining city/county license guides (12 pages), then
  the income-estimator-style tool pages for each city (10 pages). ~57 pages
  left of 113. Citation battery re-measure due ~early-to-mid August (6-8 wk
  from the 2026-06-26 baseline).

## 2026-06-26

**Page production (rolling).** Building toward the 113 mapped pages, prioritizing
the queries the baseline showed we lose. Built so far (16): 3 hubs (all tracks);
license guide; become-an-agent ×6 cities (Daytona/Ormond/Port Orange/New Smyrna/
DeLand/Palm Coast); Volusia "best brokerage to join" + experienced comparisons;
"best company to work for in Daytona" comparison; referral "how it works"; +2
tools (commission split calculator, income estimator). All Otto/AEO + auto
related-guides. *Why:* each targets a real, winnable, measured-demand query.

**SEO polish (the 4 minor gaps).**
- *What:* Hero images got descriptive alt + `fetchpriority=high` + width/height
  (LCP/CLS); homepage below-fold images lazy-loaded; `<lastmod>` on every
  sitemap URL; new generated **`guides.html`** — a browsable HTML index of the
  whole library (CollectionPage+ItemList schema), in the sitemap + linked from
  the homepage.
- *Why:* Round out technical SEO — accessibility, Core Web Vitals, freshness
  signals, and a crawlable/human path to every page.

**Internal-linking system (Matt asked: "are we doing internal linking").**
- *What:* Audit found 3 orphan pages + core pages not feeding the library.
  Fixed with an engine-level auto "Related guides" mesh (registry-driven:
  same-pillar → same-track → track-hub → cross-track) + contextual links from
  experienced-agents → experienced hub and referral → referral guide. Result:
  0 orphans, ~9 internal links/page, can't regress.
- *Why:* Internal linking is how authority flows and how AI/crawlers discover
  pages; it was our weakest area. Now systematic and scales to 1,500.

**Homepage AEO rewrite (audit brief).**
- *What:* Added to the live homepage a "Start Here" section (real Volusia/Flagler
  market numbers + the 4-step Florida licensing roadmap + links to our city
  guides), a visible FAQ (5 Q&As), and **FAQPage schema**.
- *Why:* The audit scored the homepage 32/100 and prescribed it should *own*
  "how do I start a real estate career in Daytona Beach or Palm Coast" — with a
  local hook, a licensing roadmap, and an FAQ. It had no FAQ and no schema. This
  makes the most-visited page answer the core recruiting question for AI/search.

**Baseline re-measured & locked** (`~/ai-visibility-engine/.../baseline-2026-06-26.md`).
- *What:* Ran the real recruiting queries through live web search and recorded
  who gets cited. Result: careers site surfaced **0 of 4** queries; AC entity
  mentioned **1 of 4** (only via 3rd-party reputation, never its own pages).
- *Why:* We need a clean "before" line to prove lift against once our pages are
  live + indexed. Confirms the core problem (authority-not-index) and the open
  lane (recruiting queries are weakly served). Re-measure in 6–8 weeks.

**Built 14 Otto/AEO pages across all 3 tracks + all 5 formats** (PR #3).
- *What:* Experienced hub + comparison + commission calculator; aspiring hub +
  license guide + become-an-agent for Daytona/Ormond/Port Orange/New Smyrna/
  DeLand/Palm Coast + Volusia "best brokerage to join" comparison; referral hub +
  "how a referral company works."
- *Why:* Prove the machine produces real, shippable, citation-grade pages — not
  just structure. Each is research-grounded (real local data), in its best format.

**Made pages AEO-perfect (engine-level).**
- *What:* Every page now ships a liftable "Quick answer," "Key takeaways," an
  "Updated …" byline, question-shaped H2s, and schema = dated Article + speakable
  + HowTo (process pages) + FAQPage. Added a real-local-data callout primitive.
- *Why:* Matt: "perfect for AEO." Good content ≠ cited content. These are the
  exact signals AI engines lift and trust. Self-audited each page passes.

**Became the research engine (Otto).**
- *What:* Researched real Volusia/Flagler market data (median ~$343K, ~900
  sales/mo, Daytona ~77 days, Flagler #6 fastest-growing FL county, AC ~300
  agents + real office addresses) and wove it into the pages.
- *Why:* Matt: "you should be the RunOctopus product." Local data is the citation
  moat the audit flagged was missing. I do research → draft → judge → ship.

**Rebuilt the content registry DEMAND-FIRST (query × geography × format).**
- *What:* Threw out my invented topic tree. Every page now targets a real
  decision-stage query a prospect asks *before* choosing a brokerage, scored vs
  the competitor it displaces (Gold Coast Schools, FastExpert, Indeed…). 113
  pages mapped; `scripts/attack-map.js` renders the full "web of attack."
- *Why:* Matt: "you're not basing this on what we want to come up for" / branded
  queries are vanity. The whole RunOctopus thesis is start from real demand +
  winnability, not topics. Geography × decision is the scale engine to ~1,500.

**Restructured into 3 audience tracks** (after reading the live site).
- *What:* experienced (switch & scale) [P1], referral (keep license working)
  [P2], aspiring (launch career) [P3].
- *Why:* John's own homepage defines 3 paths; 2 are *licensed* agents (the money
  recruits). My first plan over-indexed the one path the site emphasizes least
  (get-licensed-from-scratch). Re-weighted toward who converts.

**"The Listing" hub design** (after the first design was rejected).
- *What:* Hero is a property-listing layout — info panel + MLS-style mono spec
  rail + Atlantic-beach photo; editorial four-stop tour; brand pull-quote.
- *Why:* Matt: first version (and the existing site) was "basic, obvious Claude."
  A brokerage sells homes, so it should pitch the *career* like a listing. I now
  screenshot my own work (headless Chrome) and self-critique before showing.

**Manifest-driven scale architecture.**
- *What:* `content/manifest.js` = single source of truth; `scripts/build.js`
  renders all pages + auto-generates sitemap.xml + llms.txt + a coverage report;
  Netlify runs the build on deploy.
- *Why:* Flat files + hand-edited sitemap break ~150 pages. We're doing 1,000–
  1,500. The registry holds the whole vision as data; add a page = add a row.

**Otto hub-and-spoke engine + technical foundation.**
- *What:* `scripts/build-page.js` renders hub/article/comparison + the format
  set; PR #1 added schema, canonicals, llms.txt, AI-crawler robots, Open Graph.
- *Why:* Hub-and-spoke is the Otto architecture; the foundation is the
  render-readiness/AEO plumbing the audit flagged as missing.

**Connected to John's repo.**
- *What:* Fork RunOctopus/careers → PRs into johnadams-dev/careers.
- *Why:* We have read-only on his repo; PRs let us ship + let John review/merge.
  PR #1 + #2 merged (generic design went live); **PR #3 (redesign + engine + 14
  pages) is open and pending John's merge** — he needs to merge or add `mg770`
  as a Write collaborator.

---

### Open / pending
- **PR #3 not merged** → the rejected generic hub is still live on production;
  none of the new work is live yet. Blocker: John merges or grants `mg770` Write.
- 14 of 113 mapped pages built (113 of ~1,500 vision).
- Per-city data still leans on shared county numbers — deepen per city.
- Re-measure citations 6–8 weeks after live (the proof).
- After merge: submit sitemap to Google Search Console + Bing.

---

## 2026-06-29 — WRITE ACCESS GRANTED + PR #3 MERGED → REDESIGN LIVE

- John added `mg770` as a collaborator — we now have **push** on johnadams-dev/careers
  (verified: `permissions.push:true`). Fork→PR is no longer required; can push direct.
- **Merged PR #3** (The Listing redesign + scale engine + 19 pages) into main.
  Netlify auto-deployed; verified live on floridarealtorcareers.com (HTTP 200,
  "The Listing" markers present: Listing № 1963 / Playfair / DM Mono / Est. 1963).
- The rejected generic v1 hub is now REPLACED on production. All new work is live.
- NEXT: submit sitemap to Google Search Console + Bing; keep scaling pages
  (19/113 mapped built); re-measure citation battery in 6–8 weeks (the proof).

## 2026-06-29 (cont.) — Batch: 9 "best brokerage to join [city]" comparisons LIVE

- Built + pushed direct to main (we have write now): 9 aspiring-track comparison
  pages, one per market (Daytona, Ormond, Port Orange, New Smyrna, DeLand,
  Deltona, Palm Coast, Flagler Beach, Flagler County). Geography x decision query.
  Honest model-level tables (AC vs national franchise vs discount/100%), real AC
  facts, no fabricated competitor numbers. AEO + FAQPage schema. 19 -> 28 of 113.
- Generated via 9 parallel Sonnet subagents off the Volusia template.
- Stripped em dashes site-wide from shared chrome (nav/footer in js/shared.js),
  renderer default CTA + template comments, and track-title labels. All 9 new
  pages grep clean (0 em dashes) vs old pages' ~13-18. NOTE/DEBT: the older 19
  pages still carry em dashes IN THEIR CONTENT (their JSON specs predate the
  doctrine) -- retrofit pass owed.
- Verified live: flagler-county page 200, correct H1, 0 em dashes, table+schema.

## 2026-06-29 (cont.) — Search Console + Bing live; em-dash retrofit shipped

- GSC + Bing: site verified (Google HTML-file method, google6cee...html at root,
  served 200) + sitemap.xml submitted to BOTH. Indexing/citation clock now running
  on all 28 live pages. (Domain is John's; we verified via the SITE-control method,
  no DNS / no John needed.)
- EM-DASH RETROFIT (the #1 AI tell): rewrote em dashes -> natural punctuation across
  ALL 19 older content specs + the AEO homepage + build.js title/llms strings, via
  5 parallel Sonnet agents. Whole engine-generated site now greps 0 em dashes
  (specs 0, guides.html 0, 28 pages 0, homepage 0). Pushed direct to main.
- LEFT UNTOUCHED ON PURPOSE: John's 7 ORIGINAL sales pages (experienced-agents,
  new-agents, support, about, referral, foundation, join, from his "Add files via
  upload" commit) still carry ~69 em dashes. His copy = his call; flagged to Matt,
  not silently rewritten. attack-map.html (8) is our internal tool, gitignored,
  never deploys.

## 2026-06-29 (cont.) — John's original pages cleaned; ENTIRE public site em-dash-free

- Per Matt's go-ahead, cleaned em dashes from John's 7 original sales pages
  (experienced-agents, new-agents, support, about, referral, foundation, join)
  via 4 parallel Sonnet agents. Punctuation-only swaps, his voice/meaning/schema
  preserved. Pushed direct to main, verified live: all 7 = 0 em dashes.
- WHOLE PUBLIC SITE now greps 0 em dashes. Only attack-map.html (internal,
  gitignored, never deploys) still has them. Doctrine fully satisfied site-wide.

## 2026-06-29 (cont.) — Batch 2: +15 comparisons (43/113) + dual changelogs

- Shipped 10 "best company for new agents [place]" (aspiring) + 5 "best brokerage
  for experienced agents [city]" (experienced) comparisons via 15 parallel Sonnet
  agents. Honest model-level tables, real AC facts, AEO+FAQ schema, 0 em dashes.
  Distinct angle from the brokerage-to-join siblings (first-year vs producing).
  28 -> 43 of 113. Verified live, sitemap now 52 URLs.
- Added CHANGELOG.md (timestamped internal, newest-first, Eastern) + DELIVERABLES.md
  (DATE-FREE client report Matt can hand to John). Matt wants BOTH maintained.
