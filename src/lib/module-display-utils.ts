import type { CourseModule } from "./mock-data";

/** Visningsnavn for underviser/rolle i moduloversigten */
export function moduleUnderviserLabel(mod: CourseModule): string {
  if (mod.underviser.trim()) return mod.underviser.trim();
  if (mod.rolle.trim()) return mod.rolle.trim();
  return "";
}
