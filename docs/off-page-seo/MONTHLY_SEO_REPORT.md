# Monthly off-page report

Copy this template into a new section at the top of the file each month. Do not delete older months. Leave a cell blank when it was not measured. Do not estimate a blank with a round number.

## Template

### [Month Year]

Period: [start date] to [end date]  
Prepared by:

#### Verified backlinks

Count only rows in `BACKLINK_TRACKER.csv` whose status is `Published` and whose source URL was opened during this period.

| New published | Still live from earlier months | Lost this month | Nofollow or sponsored among the live set |
| --- | --- | --- | --- |
|  |  |  |  |

#### Referring domains

| Source of the count | New domains | Total domains | Notes |
| --- | --- | --- | --- |
| Google Search Console Links report |  |  | Export date: |
| Other index, if a subscription was used |  |  | Tool and date. Leave empty if unused. |

#### Outreach

| Emails approved and sent | Replies | Approved, not yet live | Declined or marked Lost |
| --- | --- | --- | --- |
|  |  |  |  |

No unapproved email is counted.

#### Brand and social

| Profile | Exists | Bio matches the site | Posts published | Issues |
| --- | --- | --- | --- | --- |
| Facebook |  |  |  |  |
| LinkedIn |  |  |  |  |
| Pinterest |  |  |  |  |
| X |  |  |  |  |
| YouTube |  |  |  |  |

#### Competitor and mention watch

Run the checks in `COMPETITOR_RESEARCH.md`. Record URLs. Do not paste unverified scores.

| Check | What changed | Source URL | Follow-up |
| --- | --- | --- | --- |
| "ReelFetch" query |  |  |  |
| New comparison article worth a correction |  |  |  |
| Cobalt or another named competitor page that changed positioning |  |  |  |
| Broken outbound link on a page already in the tracker |  |  |  |

#### Risks

List anything that looked like a paid-link offer, a badge exchange, a fake review request, or a directory that wanted an untrue claim. Record that it was declined.

#### Next month

At most three actions, each with an owner.

## November 2026 baseline

Period: 12 November 2026, the day this workspace was created. There is no earlier off-page program in the repository to compare.

Prepared from public pages and the ReelFetch site. Ahrefs, Semrush, Moz, and Majestic were not used.

#### Verified backlinks

| New published | Still live from earlier months | Lost this month | Nofollow or sponsored among the live set |
| --- | --- | --- | --- |
| 0 | Not previously tracked | 0 | Not applicable. No link was verified. |

Search Console's Links report was not available in this workspace, so this zero means "not verified here." It does not prove the live site has no links from before this file existed. The first action after deployment access is to export that report and add any real linking sites as `Published` only after opening them.

#### Referring domains

| Source of the count | New domains | Total domains | Notes |
| --- | --- | --- | --- |
| Google Search Console Links report |  |  | Not exported on 12 November 2026 |
| Other index |  |  | No subscription was used |

#### Outreach

| Emails approved and sent | Replies | Approved, not yet live | Declined or marked Lost |
| --- | --- | --- | --- |
| 0 | 0 | 0 | Uneed rejected. Slant failed to load. See `SUBMISSION_LOG.md`. |

#### Brand and social

| Profile | Exists | Bio matches the site | Posts published | Issues |
| --- | --- | --- | --- | --- |
| Facebook | Not created by this work |  | 0 | Create only when someone can answer messages |
| LinkedIn | Not created by this work |  | 0 | Same |
| Pinterest | Not created by this work |  | 0 | Same |
| X | Not created by this work |  | 0 | Same |
| YouTube | Not created by this work |  | 0 | Do not upload other people's videos |

#### Competitor and mention watch

| Check | What changed | Source URL | Follow-up |
| --- | --- | --- | --- |
| "ReelFetch" on the public web | No independent mention index was queried beyond building this pack |  | Add a Google Alerts query for "ReelFetch" and for bestdownloader.site, then review hits by hand |
| Comparison articles in this category | Several 2026 listicles discuss Cobalt, SaveFrom, Y2Mate-named sites, and single-platform tools. Their tables disagree and were not audited | See `COMPETITOR_RESEARCH.md` | Do not email those authors with a stock "add us" note |
| Cobalt public docs | Repository page showed 46,120 stars on 12 November 2026. That is not a backlink count | https://github.com/imputnet/cobalt | Reread only if their public positioning changes in a way that affects ReelFetch's comparisons |
| Broken links | None were verified |  | Do not send the broken-link template until a dead URL is requested and saved |

#### Risks

- A search for contributor guidelines surfaced a pitch that offered fast placement on major sites. It was not contacted. Do not buy that kind of placement.
- Some launch directories are reported by third-party roundups to require a badge or a reciprocal link. Treat that as a link exchange unless the destination's own page shows a normal editorial listing.
- `docs/PROJECT_OVERVIEW.md` is older than the public website and still describes providers as unconfigured. Outreach must follow the live site, not that overview.

#### Next month

1. Owner: export Google Search Console links and add verified rows to `BACKLINK_TRACKER.csv`.
2. Owner: approve or reject the nine prospect rows already in the tracker. Submit no more than three.
3. Owner: choose one publication, read its guidelines, and only then personalize the guest-post template.

## Competitor monitoring workflow

Repeat on the first week of each month. Keep notes in that month's section.

1. **Own links.** In Search Console, open Links and compare linking sites with the tracker. Add unknown sites only after the page loads and the ReelFetch URL is visible. Mark a previously published row `Lost` if the link is gone.
2. **Brand queries.** Search `"ReelFetch"` and `"bestdownloader.site"` in Google. Open new results. Correct a wrong description with the brand-mention template. Ignore scraped duplicates of the same article.
3. **Named competitors.** Re-open https://cobalt.tools/about/general and one comparison article already cited in `COMPETITOR_RESEARCH.md`. Write down positioning changes in words. Do not record a rank you did not measure.
4. **New content opportunities.** When a new editorial page explains public video, copyright, or browser downloads, add one tracker row in `Prospecting`. Do not email it in the same sitting.
5. **Spam check.** If a new referring domain is unrelated, hidden, or part of a network of thin domains, disavow is a last resort. Document the domain and ask Search Console's help documentation before uploading a disavow file. Most junk links should be ignored rather than disavowed in bulk.
6. **Close the month.** Fill the template. Leave authority, traffic, and ranking cells blank unless the export that produced them is named.
