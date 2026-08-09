# Main Wins Roadmap — titles to produce

The only query pattern on this site with real GSC proof behind it: a 3-column model comparison ("Adams, Cameron & Co." vs. "National Franchise" vs. "Discount / 100% Model"), titled **"Best Real Estate Brokerage to Join in [geography]"** (aspiring track) and **"Best Brokerage for Experienced Agents in [geography]"** (experienced track). At Volusia County level: 20% CTR / position 4.0 (aspiring), 100% CTR / position 1.0 (experienced). Both beat every city-level equivalent measured. Everything below is testing whether the pattern holds at other real geography framings, not inventing new topics.

Last updated 2026-08-06 (cont.). This file lives in the private repo only.

## STATUS: geography-extension test set COMPLETE (18 variants, 417 pages total)

| Geography | Aspiring | Experienced |
|---|---|---|
| 21 individual cities | done | done |
| Volusia County | done | done |
| Flagler County | done | done |
| Volusia & Flagler County (combined) | done | done |
| Daytona Beach Area (colloquial) | done | done |
| West Volusia | done | done |
| New Smyrna Beach Area | done | done |
| Palm Coast Area (colloquial) | done | done |

All 7 titles from the prior "to produce" list shipped 2026-08-06, verified (417/417 valid JSON, 0 em dash/curly quote, 0 duplicate bodies, 0 broken links, each wired into its correct track hub) and confirmed live.

## DATA CHECK 2026-08-09 — too early, and the headline numbers need a caveat

Pulled GSC (via `~/gsc-tool/gsc.mjs`) at the 3-day mark on the 8 geography-extension pages. **No usable data yet**, as expected: the whole set shows 2-3 impressions combined and no clicks. Nothing to conclude. **Re-check no earlier than 2026-09-03** (roughly 4 weeks post-ship), which is comparable to when the original Volusia County signal first appeared.

**A caveat this file should have carried from the start.** The two headline numbers above are much weaker than they read:

| Page | This file claims | Actual 90d (2026-05-11 to 08-08) |
|---|---|---|
| `best-real-estate-brokerage-to-join-volusia-county` | 20% CTR / pos 4.0 | 2 clicks, 24 impressions, **8.33% CTR / pos 7.8** |
| `best-brokerage-experienced-agents-volusia-county` | 100% CTR / pos 1.0 | 1 click, **1 impression**, pos 1.0 |

The experienced-track figure is **one click on one impression**. That is not a 100% click-through rate in any meaningful sense, it is a sample of one, and it should never have been written down as proof of a pattern. The aspiring-track page is a real but modest signal on 24 impressions. Treat the whole "proven pattern" framing here as a hypothesis with thin support until the extension set returns actual volume.

## What the 2026-08-09 GSC pull DID establish

Separately from this test, the 28-day picture (impressions 1,180 -> 3,628, clicks 5 -> 25) showed something with more behind it: **clicks concentrate almost entirely on licensed-agent intent.** `how-to-transfer-your-florida-real-estate-license-to-a-new-broker` alone took 9 of 30 clicks over 90 days at position 6.8, and the two brokerage-comparison pages above are the next contributors. The 219-page aspiring track produces impressions at positions 55-70 and almost no clicks.

That is consistent with the comparison-page pattern mattering more on the **experienced** side than the aspiring side, but the sample above is far too small to claim it. Two waves of licensed-agent content shipped 2026-08-09 (20 pages, see CHANGELOG) to test that seam directly with real volume behind it.

## What's next: still wait for real data, then decide



This was a real test, not a guaranteed win. The next real step isn't more titles, it's checking GSC performance on all 8 new sub-region/combined pages once they've had a few weeks to index (comparable to when the original Volusia County win first showed up in the data). If the pattern holds at these broader/colloquial geographies too, that's the strongest signal yet for where the site's real leverage is. If it doesn't, that's useful too, it means the win was specific to "county," not geography framing in general.

## Not in scope here

Anything that isn't a geography variant of this exact proven pattern (new query shapes, new topics, more long-tail) is separate work, tracked in CHANGELOG.md, not this list. This file is specifically the "extend the one proven winner" backlog, and for now, it's done.
