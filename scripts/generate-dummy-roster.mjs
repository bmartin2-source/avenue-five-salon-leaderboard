import { readFileSync, writeFileSync } from "fs";

const firstNames = [
  "Ada", "Aiden", "Alina", "Amara", "Andre", "Anika", "Ari", "Asher",
  "Bea", "Bianca", "Bodhi", "Briar", "Caleb", "Camila", "Celia", "Clara",
  "Dario", "Delia", "Diego", "Elena", "Elise", "Esme", "Eva", "Felix",
  "Freya", "Gia", "Hugo", "Imani", "Iris", "Ivan", "Jada", "Jonah",
  "Kai", "Keira", "Lila", "Lucia", "Marco", "Mira", "Nia", "Nina",
  "Omar", "Pia", "Rafa", "Rosa", "Sami", "Sienna", "Theo", "Uma",
  "Vera", "Vince", "Willa", "Yara", "Zane", "Zoe",
  "Alex", "Avery", "Blake", "Cameron", "Dakota", "Eden", "Ellis", "Emerson",
  "Finley", "Frankie", "Gray", "Harper", "Hayden", "Indigo", "Jamie", "Jules",
  "Kendall", "Lane", "Lennox", "Logan", "Marley", "Micah", "Morgan", "Oakley",
  "Parker", "Peyton", "Phoenix", "Quinn", "Reese", "Remy", "River", "Rowan",
  "Sage", "Shiloh", "Skyler", "Sloane", "Sutton", "Tatum", "Winter", "Wren",
  "Arden", "Bellamy", "Drew", "Hollis", "Landry", "Marlowe", "Noel",
  "Palmer", "Robin", "Scout", "Shea", "True", "Zion", "Cedar",
  "Dallas", "Haven", "Ivory", "Kit", "Lumen", "Moss", "Navy", "Onyx",
  "Perry", "Rain", "Sol", "Story", "Vesper", "Wynn", "Yael",
];

const lastNames = [
  "Adler", "Banks", "Cole", "Diaz", "Ellis", "Frost", "Grant", "Hayes",
  "Ivers", "Jones", "Kane", "Lopez", "Nash", "Ortiz", "Patel",
  "Quinn", "Soto", "Torres", "Underwood", "Vega", "Walsh", "Xu",
  "Young", "Zimmerman", "Brooks", "Chen", "Drake", "Eaton", "Flynn", "Garcia",
  "Hart", "Ingram", "Jung", "King", "Moore", "Nguyen", "Owens",
  "Price", "Rhodes", "Singh", "Tran", "Vargas", "Wells", "Yates", "Zuniga",
  "Abbott", "Bennett", "Caldwell", "Dorsey", "Farrell", "Gomez", "Hale",
  "Ibarra", "Jensen", "Klein", "Lambert", "Mendez", "Nolan", "Pruitt",
];

const plan = {
  cosmetology: { north: 29, south: 21 },
  esthetics: { north: 31, south: 39 },
  barbering: { north: 12, south: 8 },
  nailTechnology: { north: 17, south: 23 },
};

const pinned = {
  "AFI-2401": { firstName: "Jordan", lastName: "Reyes", program: "cosmetology", campus: "north", service: 1860, retail: 420, previousRank: 4 },
  "AFI-2402": { firstName: "Riley", lastName: "Cruz", program: "esthetics", campus: "south", service: 1580, retail: 310, previousRank: 3 },
  "AFI-2403": { firstName: "Casey", lastName: "Miles", program: "barbering", campus: "north", service: 1320, retail: 760, previousRank: 2 },
};

function hash(value) {
  let total = 0;
  for (const char of value) total = (total * 31 + char.charCodeAt(0)) >>> 0;
  return total;
}

const students = [];
let serial = 3100;

for (const [program, campuses] of Object.entries(plan)) {
  for (const campus of ["north", "south"]) {
    const count = campuses[campus];
    const pins = Object.entries(pinned).filter(([, info]) => info.program === program && info.campus === campus);
    const usedDisplay = new Set(pins.map(([, info]) => `${info.firstName}|${info.lastName[0]}`));
    const need = count - pins.length;
    const generated = [];
    for (let index = 0; index < need; index += 1) {
      const seed = `${program}-${campus}-${index}`;
      let firstName = firstNames[(hash(seed) + index * 7) % firstNames.length];
      let lastName = lastNames[(hash(`${seed}l`) + index * 11) % lastNames.length];
      for (let attempt = 0; attempt < 800; attempt += 1) {
        firstName = firstNames[(hash(seed) + index * 7 + attempt * 13) % firstNames.length];
        lastName = lastNames[(hash(`${seed}l`) + index * 11 + attempt * 17) % lastNames.length];
        const key = `${firstName}|${lastName[0]}`;
        if (!usedDisplay.has(key)) {
          usedDisplay.add(key);
          break;
        }
      }
      const base = 220 + ((count - index) * (program === "esthetics" ? 18 : 22));
      const service = base + (hash(`${seed}s`) % 90);
      const retail = 20 + (hash(`${seed}r`) % (program === "barbering" ? 80 : 160));
      generated.push({
        id: `AFI-${serial}`,
        firstName,
        lastName,
        lastInitial: lastName[0],
        optedIn: true,
        program,
        campus,
        service,
        retail,
        previousRank: Math.min(count, index + 2),
      });
      serial += 1;
    }
    for (const [id, info] of pins) {
      generated.push({
        id,
        firstName: info.firstName,
        lastName: info.lastName,
        lastInitial: info.lastName[0],
        optedIn: true,
        program: info.program,
        campus: info.campus,
        service: info.service,
        retail: info.retail,
        previousRank: info.previousRank,
      });
    }
    students.push(...generated);
  }
}

const seen = new Set();
for (const student of students) {
  if (seen.has(student.id)) throw new Error(`duplicate ${student.id}`);
  seen.add(student.id);
}

const counts = { institute: {}, campus: {} };
for (const student of students) {
  counts.institute[student.program] = (counts.institute[student.program] || 0) + 1;
  const key = `${student.campus} ${student.program}`;
  counts.campus[key] = (counts.campus[key] || 0) + 1;
  if (!student.optedIn) throw new Error("opted out slipped in");
  if (student.firstName.startsWith("Student")) throw new Error("placeholder name");
}

const data = JSON.parse(readFileSync("data/leaderboard.json", "utf8"));
data.meta.notice = "Fictional opted-in students only. Institute totals: Cosmetology 50, Esthetics 70, Barbering 20, Nail Technology 40, split unevenly across North Austin and South Austin.";
data.meta.roster = {
  basis: "institute-totals",
  programs: { cosmetology: 50, esthetics: 70, barbering: 20, nailTechnology: 40 },
  split: plan,
};
data.students = students;
writeFileSync("data/leaderboard.json", JSON.stringify(data, null, 2) + "\n");
console.log(counts, "total", students.length);
