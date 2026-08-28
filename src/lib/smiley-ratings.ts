export type SmileyScore = 1 | 2 | 3 | 4 | 5;

export const SMILEY_OPTIONS: Array<{
  score: SmileyScore;
  emoji: string;
  label: string;
}> = [
  { score: 1, emoji: "😠", label: "Meget utilfreds" },
  { score: 2, emoji: "😕", label: "Utilfreds" },
  { score: 3, emoji: "😐", label: "Neutral" },
  { score: 4, emoji: "🙂", label: "Tilfreds" },
  { score: 5, emoji: "😄", label: "Meget tilfreds" },
];
