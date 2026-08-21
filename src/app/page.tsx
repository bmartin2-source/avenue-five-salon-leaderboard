import Link from "next/link";

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
              all-institute comparison. Sponsor ticker on the bottom. Arrow keys change slides.
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
            <p>Dummy auth: student ID + last name, then name-display consent. No PIN. No iOS.</p>
          </Link>
        </div>

        <div className="dummy-accounts">
          <p className="kicker">Reviewer notes</p>
          <ul className="meta-list">
            <li>Product name: High Five Competition. Avenue Five Institute branding stays.</li>
            <li>Columns left to right: Cosmetology, Barbering, Esthetics, Nail Technology.</li>
            <li>Each program column lists ~10 students. High Five winners are ranks 1–5 only; 6–10 are quieter.</li>
            <li>Rank = service $ + retail $. TOTAL is large; S: and R: sit under it.</li>
            <li>Opted-in names are first name + last initial. Others show Student + ID.</li>
            <li>Current dummy cycle: July 20 – August 28, week 5 of 6.</li>
            <li>
              Demo logins — Jordan (opted in): <code>AFI-2401</code> / <code>Reyes</code>.
              Riley (opted out): <code>AFI-2402</code> / <code>Cruz</code>.
              Casey: <code>AFI-2403</code> / <code>Miles</code>.
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}
