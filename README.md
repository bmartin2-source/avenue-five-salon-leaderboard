# Avenue Five High Five Competition

Private High Five Competition board for Avenue Five Institute (North and South Austin). Dummy data first. Not a public marketing site.

**Do not deploy this dummy. Do not make it public.**

This repo is a local-only first pass so a reviewer can open:

- a private/unlisted TV view for a break-room screen
- a student web login (student ID + last name) and name-display consent

There is no iOS app in this pass. There are no real student names.

## Run locally

```bash
npm install
npm test
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Reviewer paths

| View | URL |
| --- | --- |
| Reviewer hub | `/` |
| Unlisted break-room TV | `/tv/u/afi-salon-tv` |
| North Austin Campus board | `/tv/north` |
| South Austin Campus board | `/tv/south` |
| Student login | `/login` |
| Name-display consent | `/consent` |
| Student view (after login) | `/student` |
| Dummy administrator | `/admin` |

The TV slideshow cycles North Austin Campus → South Austin Campus → all-institute comparison after each campus finishes paging through its list. About every 60 seconds it shifts to an institute-wide **ALL-TIME** career board, then returns to the current-cycle campus boards. Left/right arrows change campus slides. Up/down or Page Up/Page Down advance the list. Current-cycle columns also auto-page every ~7 seconds so a break-room TV does not need a mouse.

## Dummy student logins

| Student ID | Last name | Notes |
| --- | --- | --- |
| `AFI-2401` | `Reyes` | Jordan R. · Cosmetology · North Austin Campus · opted in |
| `AFI-2402` | `Cruz` | Riley C. · Esthetics · South Austin Campus · opted in |
| `AFI-2403` | `Miles` | Casey M. · Barbering · North Austin Campus · opted in |

Auth is a client-side stub against `data/leaderboard.json`. It is not production security. After sign-in, students land on the consent page to Opt In or Opt Out.

Dummy staff logins for `/admin` (role stub only, not real auth). Settings persist in this browser and update the TV after save/refresh.

| Role | Email | PIN | Can control |
| --- | --- | --- | --- |
| Institute admin | `admin@avenuefive.com` | `2468` | Both campuses + overall board |
| North campus manager | `north@avenuefive.com` | `1357` | North Austin board only |
| South campus manager | `south@avenuefive.com` | `1357` | South Austin board only |

## Dummy instructor TV settings

All of these are reachable from `/admin`. They are dummy switches, not production.

| Setting | What it does |
| --- | --- |
| Panic hide (one student) | Omits that student from the TV. No name, no `Student AFI-xxxx` row. |
| Hide the whole board | Safe Avenue Five branding screen. Institute admin only. |
| Freeze ranks | Locks the current walk-on order. Live dummy totals cannot reshuffle. TV shows **RANKS FROZEN**. Unfreeze restores live ranking. Campus managers freeze their campus; institute admin can freeze all. |
| Pin physical TV | Assigns `/tv/u/afi-salon-tv` to North Austin, South Austin, or the institute slideshow. The pin sticks in this browser. Locked `/tv/north` and `/tv/south` routes stay as-is. |
| Quiet hours | Off until enabled. Dummy window 21:00–07:00 (overnight). Stops slide flipping and paging. Hold a branding screen or the last slide. |
| Type size | Smaller / default / larger. Default stays the last clean mid-size board (24px names, 50px rows, reserved name vs points columns). HIGH FIVE chips stay under the rank, not on names. No service/retail badges. |

## Ranking rules in this dummy

- Four programs, ranked **only within program**, left to right: Cosmetology, Barbering, Esthetics, Nail Technology.
- Campus boards rank inside that campus + program. The all-institute slide still ranks within program, then tags North Austin Campus / South Austin Campus.
- Dummy roster uses **institute totals**, split unevenly so both campuses have a real list: Cosmetology 50 (29/21), Esthetics 70 (31/39), Barbering 20 (12/8), Nail Technology 40 (17/23).
- Every board row is an opted-in fictional student: first name + last initial only. No `Student AFI-xxxx` rows.
- Each campus program column fills a 1080p TV with slim HUD-style rows. A 1080p column cannot show 35–70 ranks at once, so the list **auto-pages** (hold ~7 seconds, slide up, loop). Cosmetology and Esthetics need more than one page.
- High Five winners are **ranks 1–5 by points** only (gold chip / stronger row, page 1). Later pages are quieter. Rank 1 is a bit stronger, same row height. No Most Services / Most Retail badges.
- Score is `points = serviceDollars × 1 + retailDollars × 5`. Rank is points descending, still only within program (and per campus).
- The large TV number is **points** (labeled `pts`, no $). Under it: `S:$200  R:$100` as dollars.
- Current dummy cycle, from published class starts: July 20 – August 28, 2026 (week 5 of 6). A cycle starts on a class start date and ends the Friday before the next start.
- **ALL-TIME** is a separate institute-wide board of career salon totals (same point formula). Dummy program lengths: Cosmetology ~9 months, Barbering ~8 months, Esthetics ~6.5–7 months, Nail Technology ~5 months. Start dates are mixed so some students are newer. All-time top 5 get an All-Time mark, not a High Five.

Edit fictional students, last names, sponsors, and cycle dates in `data/leaderboard.json`. Ranking helpers live in `src/lib/leaderboard.ts`.
