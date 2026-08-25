/** Dropdown-værdier fra Uge 35 Praktisk seddel — Datakilder */

export const forplejningTyper = [
  "Morgenmad",
  "Formiddag",
  "Frokost",
  "Eftermiddag",
  "Aftensmad",
  "Aftensforplejning",
  "Madpakker",
  "Disp.1",
  "Disp.2",
] as const;

export type ForplejningType = (typeof forplejningTyper)[number];

export const specifikationer = [
  "Almindelig",
  "Let morgenmad",
  "Mokost",
  "Brunch",
  "Kaffe/the",
  "Kaffe/the med sødt",
  "Kaffe/the med frugt",
  "Kaffe/the med salt",
  "Kaffe/the med brød",
  "Kaffe/the med kage",
  "Kaffe/the med småkage",
  "Natmad",
  "Festmiddag (2 retter)",
  "Festmiddag (3 retter)",
  "Isvand",
  "Ingen forplejning (ude af huset)",
  "Andet (se noter)",
] as const;

export type SpecifikationType = (typeof specifikationer)[number];

export const lokaler = [
  "St. spisesal",
  "L. spisesal",
  "Hele spisesalen",
  "Pejsestuen",
  "Drama",
  "Fordragssalen",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "H10",
  "H11",
  "H12",
  "Gr. rum 1",
  "K3/K4",
  "K5",
  "Hallen",
  "Bålhytten",
  "Kompas",
  "Friluftliv",
  "Rakette",
  "Atriumgården",
  "Kunst",
  "Undervisningskøkken",
  "Lydhuset",
  "Recptionen",
  "Væresler",
  "Ad hoc pedel",
  "På rullevogn",
  "Andet (se noter)",
] as const;

export type LokaleType = (typeof lokaler)[number];

export function inferForplejningFromTitle(title: string): ForplejningType {
  const t = title.toLowerCase();
  if (t.includes("morgenmad") || t.includes("brunch")) return "Morgenmad";
  if (t.includes("frokost")) return "Frokost";
  if (t.includes("aftensmad")) return "Aftensmad";
  if (t.includes("aftensforplejning") || t.includes("fest")) return "Aftensforplejning";
  if (t.includes("formiddag") || t.includes("kaffe") || t.includes("the"))
    return "Formiddag";
  if (t.includes("eftermiddag")) return "Eftermiddag";
  if (t.includes("madpakke")) return "Madpakker";
  return "Morgenmad";
}

export function inferSpecifikationFromTitle(title: string): SpecifikationType {
  const t = title.toLowerCase();
  if (t.includes("let morgenmad")) return "Let morgenmad";
  if (t.includes("brunch")) return "Brunch";
  if (t.includes("mokost")) return "Mokost";
  if (t.includes("natmad")) return "Natmad";
  return "Almindelig";
}
