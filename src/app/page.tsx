import Link from "next/link";

export default function HomePage() {
  return (
    <main className="hub">
      <div className="hub-inner">
        <p className="notice">Dummy · private · do not deploy · no real student names</p>
        <p className="kicker">Avenue Five Institute</p>
        <h1>Student salon leaderboard</h1>
        <p className="lede">
          Private break-room TV and student login for North and South Austin. This
          is a dummy first pass with fictional names and totals. It is not a public
          marketing site and should not be deployed or indexed.
        </p>

        <div className="card-grid">
          <Link className="card" href="/tv/u/afi-salon-tv">
            <p className="kicker">Unlisted TV</p>
            <h2>Break-room board</h2>
            <p>
              Private slideshow: North campus, South campus, then an all-institute
              comparison. Sponsor ticker on the bottom. Arrow keys change slides.
            </p>
          </Link>
          <Link className="card" href="/tv/north">
            <p className="kicker">Campus board</p>
            <h2>North campus</h2>
            <p>Locked North view. Four programs, ranked only within program.</p>
          </Link>
          <Link className="card" href="/tv/south">
            <p className="kicker">Campus board</p>
            <h2>South campus</h2>
            <p>Locked South view. Same ranking rules, dummy data only.</p>
          </Link>
          <Link className="card" href="/login">
            <p className="kicker">Student web</p>
            <h2>Student login</h2>
            <p>Dummy auth stub: student ID + PIN. No iOS app in this pass.</p>
          </Link>
        </div>

        <div className="dummy-accounts">
          <p className="kicker">Reviewer notes</p>
          <ul className="meta-list">
            <li>Rank = service $ + retail $. TOTAL is large; S: and R: sit under it.</li>
            <li>Opted-in names are first name + last initial. Others show Student + ID.</li>
            <li>Badges: up/down arrows, most retail, most services.</li>
            <li>Cycle dummy: August 10 start, 7 weeks, resets September 25.</li>
            <li>
              Demo logins — Jordan (opted in): <code>AFI-2401</code> / <code>1357</code>.
              Riley (not opted in): <code>AFI-2402</code> / <code>2468</code>.
              Casey (most retail, barbering): <code>AFI-2403</code> / <code>8024</code>.
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}
