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
  "AFI-2401": { firstName: "Jordan", lastName: "Reyes", program: "cosmetology", campus: "north", service: 1680, retail: 520 },
  "AFI-2402": { firstName: "Riley", lastName: "Cruz", program: "esthetics", campus: "south", service: 1420, retail: 480 },
  "AFI-2403": { firstName: "Casey", lastName: "Miles", program: "barbering", campus: "north", service: 1180, retail: 790 },
};

function hash(value) {
  let total = 0;
  for (const char of value) total = (total * 31 + char.charCodeAt(0)) >>> 0;
  return total;
}

function pointsOf(student) {
  return student.service + student.retail * 5;
}

function dollarsOf(student) {
  return student.service + student.retail;
}

function salesFor(seed, index, count) {
  const profile = index % 4;
  const jitter = hash(seed);
  const ladder = count - index;
  if (profile === 0) {
    return {
      service: 720 + ladder * 8 + (jitter % 120),
      retail: 300 + ladder * 6 + (hash(`${seed}r`) % 160),
    };
  }
  if (profile === 1) {
    return {
      service: 1680 + ladder * 18 + (jitter % 280),
      retail: 28 + (hash(`${seed}r`) % 45),
    };
  }
  if (profile === 2) {
    return {
      service: 1100 + ladder * 12 + (jitter % 160),
      retail: 140 + (hash(`${seed}r`) % 70),
    };
  }
  return {
    service: 480 + ladder * 10 + (jitter % 140),
    retail: 70 + (hash(`${seed}r`) % 50),
  };
}

function assignDollarPreviousRanks(group) {
  const byDollars = group.slice().sort((a, b) => {
    const dollarDiff = dollarsOf(b) - dollarsOf(a);
    if (dollarDiff !== 0) return dollarDiff;
    return a.id.localeCompare(b.id);
  });
  byDollars.forEach((student, index) => {
    student.previousRank = index + 1;
  });
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
      const { service, retail } = salesFor(seed, index, count);
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
        previousRank: 1,
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
        previousRank: 1,
      });
    }
    assignDollarPreviousRanks(generated);
    students.push(...generated);
  }
}

const seen = new Set();
for (const student of students) {
  if (seen.has(student.id)) throw new Error(`duplicate ${student.id}`);
  seen.add(student.id);
}

const counts = { institute: {}, campus: {} };
let inversions = 0;
for (const student of students) {
  counts.institute[student.program] = (counts.institute[student.program] || 0) + 1;
  const key = `${student.campus} ${student.program}`;
  counts.campus[key] = (counts.campus[key] || 0) + 1;
  if (!student.optedIn) throw new Error("opted out slipped in");
  if (student.firstName.startsWith("Student")) throw new Error("placeholder name");
}

for (const [program, campuses] of Object.entries(plan)) {
  for (const campus of ["north", "south"]) {
    const group = students.filter((student) => student.program === program && student.campus === campus);
    const byPoints = group.slice().sort((a, b) => pointsOf(b) - pointsOf(a) || a.id.localeCompare(b.id));
    const byDollars = group.slice().sort((a, b) => dollarsOf(b) - dollarsOf(a) || a.id.localeCompare(b.id));
    const climbed = byPoints.find((student, index) => {
      const dollarRank = byDollars.findIndex((row) => row.id === student.id);
      return dollarRank > index && dollarsOf(student) < dollarsOf(byDollars[index]);
    });
    if (climbed) inversions += 1;
    if (group.length >= 8 && !climbed) {
      throw new Error(`no retail-over-service inversion in ${campus} ${program}`);
    }
  }
}

const data = JSON.parse(readFileSync("data/leaderboard.json", "utf8"));
data.meta.notice = "Fictional opted-in students only. Ranked by points (1 pt per $1 service, 5 pts per $1 retail). Institute totals: Cosmetology 50, Esthetics 70, Barbering 20, Nail Technology 40, split unevenly across North Austin and South Austin.";
data.meta.roster = {
  basis: "institute-totals",
  scoring: { servicePointsPerDollar: 1, retailPointsPerDollar: 5 },
  programs: { cosmetology: 50, esthetics: 70, barbering: 20, nailTechnology: 40 },
  split: plan,
};
data.students = students;
writeFileSync("data/leaderboard.json", JSON.stringify(data, null, 2) + "\n");
console.log(counts, "total", students.length, "inversions", inversions);
