# Avenue Five Salon Leaderboard

Private student-salon leaderboard for Avenue Five Institute (North and South Austin). Dummy data first. Not a public marketing site.

**Do not deploy this dummy. Do not make it public.**

This repo is a local-only first pass so a reviewer can open:

- a private/unlisted TV view for a break-room screen
- a student web login (student ID + PIN stub)

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
| North campus board | `/tv/north` |
| South campus board | `/tv/south` |
| Student login | `/login` |
| Student view (after login) | `/student` |

The TV slideshow cycles North → South → all-institute comparison. Use the arrow keys to change slides. Rank rows animate from the previous dummy rank to the current rank when a slide appears.

## Dummy student logins

| Student ID | PIN | Notes |
| --- | --- | --- |
| `AFI-2401` | `1357` | Jordan R. · Cosmetology · North · opted in |
| `AFI-2402` | `2468` | Not opted in · Aesthetics · South · shows as `Student AFI-2402` |
| `AFI-2403` | `8024` | Casey M. · Barbering · North · most retail on the North barbering board |

Auth is a client-side stub against `data/leaderboard.json`. It is not production security.

## Ranking rules in this dummy

- Four programs, ranked **only within program**: Cosmetology, Aesthetics, Barbering, Nails.
- Campus boards rank inside that campus + program. The all-institute slide still ranks within program, then tags North/South.
- Score is `total = service $ + retail $`.
- TOTAL is the large TV number. Under it: `S:$200  R:$100`.
- Opted-in display: first name + last initial. Not opted-in: `Student` + student ID.
- Badges: up/down rank arrows, most retail, most services.
- Cycle dummy: August 10 start, 7 weeks, resets September 25.

Edit fictional students, PINs, sponsors, and cycle dates in `data/leaderboard.json`. Ranking helpers live in `src/lib/leaderboard.ts`.
