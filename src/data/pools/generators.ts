/** Deterministic hash for stable rotation from string seeds */
export function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function seededPick<T>(items: T[], seed: string, count: number): T[] {
  if (count >= items.length) return [...items];
  const h = hashSeed(seed);
  const picked: T[] = [];
  const used = new Set<number>();
  let i = 0;
  while (picked.length < count && used.size < items.length) {
    const idx = (h + i * 2654435761) % items.length;
    i++;
    if (used.has(idx)) continue;
    used.add(idx);
    picked.push(items[idx]);
  }
  return picked;
}

const PREFIXES = [
  "Focus", "Deep", "Study", "Session", "Lock-In", "Revision", "Grind", "Discipline",
  "Night", "Morning", "Silent", "Sharp", "Calm", "Steady", "Prime", "Peak",
  "Laser", "Iron", "Quiet", "Rapid", "Solid", "Pure", "Core", "Alpha",
];

const NOUNS = [
  "Rookie", "Apprentice", "Strategist", "Scholar", "Warrior", "Phantom", "Legend",
  "Slayer", "Master", "Demon", "Sage", "Hunter", "Architect", "Pilot", "Captain",
  "Runner", "Builder", "Crafter", "Guardian", "Veteran", "Ace", "Maven", "Pro",
  "Striker", "Anchor", "Spark", "Engine", "Machine", "Monk", "Knight",
];

const SUFFIXES = [
  "", " Prime", " Elite", " X", " II", " Pro", " Plus", " One", " Zero",
  " Rising", " Ascendant", " Unlocked", " Mode", " Flow", " Zone",
];

const CHALLENGE_VERBS = ["Complete", "Finish", "Log", "Hit", "Reach", "Earn", "Review", "Clear"];
const CHALLENGE_OBJECTS = [
  "focus minutes", "study sessions", "tasks", "flashcards", "notes", "deep work blocks",
  "Pomodoro cycles", "morning sessions", "evening reviews", "tagged study time",
];
const CHALLENGE_QUALIFIERS = [
  "this week", "before Friday", "across 3 days", "without skipping breaks",
  "with a linked task", "in one sitting", "before midnight", "during your best hour",
];

export function buildTitlePool(target = 520): string[] {
  const set = new Set<string>();
  const curated = [
    "Focus Rookie", "Deep Work Demon", "Revision Warrior", "Grind Master", "Session Slayer",
    "Focus Phantom", "Lock-In Legend", "Study Strategist", "Discipline Architect", "Night Scholar",
    "Morning Grinder", "Silent Focus", "Peak Performer", "Laser Learner", "Iron Discipline",
    "Quiet Grinder", "Steady Scholar", "Prime Focus", "Core Discipline", "Alpha Session",
  ];
  curated.forEach((t) => set.add(t));
  for (const p of PREFIXES) {
    for (const n of NOUNS) {
      for (const s of SUFFIXES) {
        const label = `${p} ${n}${s}`.replace(/\s+/g, " ").trim();
        if (label.length > 4 && label.length < 36) set.add(label);
        if (set.size >= target) break;
      }
      if (set.size >= target) break;
    }
    if (set.size >= target) break;
  }
  return Array.from(set).slice(0, target);
}

export function buildChallengePool(target = 520): string[] {
  const set = new Set<string>();
  for (const v of CHALLENGE_VERBS) {
    for (const o of CHALLENGE_OBJECTS) {
      for (const q of CHALLENGE_QUALIFIERS) {
        set.add(`${v} ${Math.floor(5 + (hashSeed(v + o) % 120))} ${o} ${q}`);
        if (set.size >= target) break;
      }
      if (set.size >= target) break;
    }
    if (set.size >= target) break;
  }
  return Array.from(set).slice(0, target);
}
