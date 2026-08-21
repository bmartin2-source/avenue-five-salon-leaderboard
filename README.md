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

The TV slideshow cycles North Austin Campus → South Austin Campus → all-institute comparison. Use the arrow keys to change slides. Rank rows animate from the previous dummy rank to the current rank when a slide appears.

## Dummy student logins

| Student ID | Last name | Notes |
| --- | --- | --- |
| `AFI-2401` | `Reyes` | Jordan R. · Cosmetology · North Austin Campus · opted in |
| `AFI-2402` | `Cruz` | Opted out · Esthetics · South Austin Campus · shows as `Student AFI-2402` |
| `AFI-2403` | `Miles` | Casey M. · Barbering · North Austin Campus |

Auth is a client-side stub against `data/leaderboard.json`. It is not production security. After sign-in, students land on the consent page to Opt In or Opt Out.

## Ranking rules in this dummy

- Four programs, ranked **only within program**, left to right: Cosmetology, Barbering, Esthetics, Nail Technology.
- Campus boards rank inside that campus + program. The all-institute slide still ranks within program, then tags North Austin Campus / South Austin Campus.
- Each campus program column fills a 1080p TV with slim HUD-style rows (about 15–18 dummy students). High Five winners are **ranks 1–5** only (gold chip / stronger row). Lower ranks stay visible and quieter. Rank 1 is a bit stronger, same row height.
- Score is `total = service $ + retail $`.
- TOTAL is the large TV number. Under it: `S:$200  R:$100`.
- Opted-in display: first name + last initial. Opted-out: `Student` + student ID.
- Badges: up/down rank arrows next to the rank number, High Five, most retail, most services.
- Current dummy cycle, from published class starts: July 20 – August 28, 2026 (week 5 of 6). A cycle starts on a class start date and ends the Friday before the next start.

Edit fictional students, last names, sponsors, and cycle dates in `data/leaderboard.json`. Ranking helpers live in `src/lib/leaderboard.ts`.
