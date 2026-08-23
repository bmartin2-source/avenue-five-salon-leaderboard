import Link from "next/link";
import { data } from "@/lib/data";
import { displayCycleWeek } from "@/lib/leaderboard";

export default function HomePage() {
  return (
    <main className="hub">
      <div className="hub-inner">
        <p className="notice">Dummy · private · do not deploy · no real student names</p>
        <p className="kicker">Avenue Five Institute</p>
        <h1>High Five Competition</h1>
        <p className="lede">
          Private break-room TV and student web consent for North and South Austin.
          This is a dummy first pass with fictional names and totals. It is not a
          public marketing site and should not be deployed or indexed.
        </p>

        <div className="card-grid">
          <Link className="card" href="/tv/u/afi-salon-tv">
            <p className="kicker">Unlisted TV</p>
            <h2>Break-room board</h2>
            <p>
              Private slideshow: North Austin Campus, South Austin Campus, then an
              all-institute comparison. About every 60 seconds the board shifts to an
              ALL-TIME career leaderboard, then returns. Lists auto-slide to later ranks.
            </p>
          </Link>
          <Link className="card" href="/tv/north">
            <p className="kicker">Campus board</p>
            <h2>North Austin Campus</h2>
            <p>Locked North Austin view. Four programs, ranked only within program.</p>
          </Link>
          <Link className="card" href="/tv/south">
            <p className="kicker">Campus board</p>
            <h2>South Austin Campus</h2>
            <p>Locked South Austin view. Same ranking rules, dummy data only.</p>
          </Link>
          <Link className="card" href="/login">
            <p className="kicker">Student web</p>
            <h2>Student login</h2>
            <p>Dummy auth: student ID + last name, then High Five Awards Opt-in. No PIN. No iOS.</p>
          </Link>
          <Link className="card" href="/admin">
            <p className="kicker">Staff</p>
            <h2>Administrator</h2>
            <p>Dummy staff dashboard: panic hide, freeze ranks, pin TV, quiet hours, type size, and role stub. Not public.</p>
          </Link>
        </div>

        <div className="dummy-accounts">
          <p className="kicker">Reviewer notes</p>
          <ul className="meta-list">
            <li>Product name: High Five Competition. Avenue Five Institute branding stays.</li>
            <li>Columns left to right: Cosmetology, Barbering, Esthetics, Nail Technology.</li>
            <li>Dummy roster is institute totals split unevenly across campuses: Cosmetology 50, Esthetics 70, Barbering 20, Nail Technology 40. Every visible student is opted in (first name + last initial). No Student AFI-xxxx rows.</li>
            <li>TV columns auto-page every ~7 seconds so ranks below the first screen are visible. High Five highlight stays on ranks 1–5 (page 1). Later pages are quieter.</li>
            <li>Rank = points within program only: 1 pt per $1 service, 5 pts per $1 retail. The large number is points (no $). S: and R: under it stay dollars. High Five is top 5 by points. No Most Services / Most Retail badges.</li>
            <li>Current dummy cycle: July 20 – August 28, week {displayCycleWeek(data.cycle)} of {data.cycle.weeks}. About every 60 seconds the TV shows ALL-TIME career leaders (institute-wide, same point formula). High Five is this-cycle only; all-time top 5 use an All-Time mark.</li>
            <li>
              Demo student logins (all opted in) — Jordan: <code>AFI-2401</code> / <code>Reyes</code>.
              Riley: <code>AFI-2402</code> / <code>Cruz</code>.
              Casey: <code>AFI-2403</code> / <code>Miles</code>.
            </li>
            <li>
              Dummy staff logins — institute admin <code>admin@avenuefive.com</code> / <code>2468</code>.
              North manager <code>north@avenuefive.com</code> / <code>1357</code>.
              South manager <code>south@avenuefive.com</code> / <code>1357</code>.
              Open <code>/admin</code>. Changes save to this browser and show on the TV after refresh.
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}
