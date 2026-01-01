export const EXERCISE_CATALOG = [
  { exercise: "Liegestütz", unit: "Anzahl", S: 300, M: 600, L: 1200, XL: 1800 },
  { exercise: "Klimmzüge", unit: "Anzahl", S: 50, M: 100, L: 200, XL: 300 },
  { exercise: "Kniebeugen", unit: "Anzahl", S: 300, M: 600, L: 1200, XL: 1800 },
  { exercise: "Joggen", unit: "km", S: 20, M: 40, L: 60, XL: 80 },
  { exercise: "Wandern", unit: "hm", S: 500, M: 1000, L: 2000, XL: 3000 },
  { exercise: "Plank", unit: "min", S: 15, M: 30, L: 60, XL: 90 },
  { exercise: "Sit-ups", unit: "Anzahl", S: 300, M: 600, L: 1200, XL: 1800 },
  { exercise: "Radfahren", unit: "km", S: 50, M: 100, L: 200, XL: 300 },
  { exercise: "Workout (HIIT)", unit: "min", S: 60, M: 90, L: 120, XL: 180 },
] as const;

export type Exercise = (typeof EXERCISE_CATALOG)[number]["exercise"];
