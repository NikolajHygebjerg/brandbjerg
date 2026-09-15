import type { CourseModule } from "./mock-data";

function isWorkshopModule(mod: CourseModule): boolean {
  return Boolean(mod.erWorkshops);
}

function isHeldagsturModule(mod: CourseModule): boolean {
  return Boolean(
    mod.erHeldagstur ||
      mod.overskrift.trim().toLowerCase() === "heldagstur",
  );
}

function moduleUbakTekst(mod: CourseModule): string {
  return (mod.ubakTekst ?? mod.ubakBeskrivelse ?? "").trim();
}

/** Danske feltnavne til fejlbeskeder (som i modulplan). */
export function getModuleKlarMissingFields(mod: CourseModule): string[] {
  const missing: string[] = [];

  if (mod.erMaltid) {
    const meal = mod.maltid;
    if (!meal?.forplejning?.trim()) missing.push("Forplejning");
    if (!meal?.specifikation?.trim()) missing.push("Specifikation");
    return missing;
  }

  if (isHeldagsturModule(mod)) {
    return missing;
  }

  if (isWorkshopModule(mod)) {
    if (!mod.overskrift.trim()) missing.push("Overskrift");
    const options = (mod.workshops ?? []).filter((w) => w.overskrift.trim());
    if (options.length === 0) missing.push("Workshop-valg");
    else if (!options.every((w) => w.maxDeltagere > 0)) {
      missing.push("Workshop kapacitet");
    }
    appendCoreModuleFields(mod, missing);
    return missing;
  }

  appendCoreModuleFields(mod, missing);
  appendUbakFields(mod, missing);
  return missing;
}

function appendCoreModuleFields(mod: CourseModule, missing: string[]) {
  if (!mod.overskrift.trim()) missing.push("Overskrift");
  if (!mod.underviser.trim()) missing.push("Underviser");
  if (!mod.underviserEmail.trim()) missing.push("Mail");
  if (
    (mod.rolle === "Foredragsholder" || mod.underviserType === "ekstern") &&
    (!Number.isFinite(mod.pris) || mod.pris <= 0)
  ) {
    missing.push("Pris");
  }
  if (!mod.broedtekst.trim()) missing.push("Brødtekst");
}

function appendUbakFields(mod: CourseModule, missing: string[]) {
  if (mod.timing.ubak > 0 && !moduleUbakTekst(mod)) {
    missing.push("UBAK tekst");
  } else if (mod.timing.ubak <= 0) {
    missing.push("UBAK tid");
  }
}

export function canMarkModuleKlar(mod: CourseModule): boolean {
  return getModuleKlarMissingFields(mod).length === 0;
}

export function formatModuleKlarMissingMessage(mod: CourseModule): string {
  const fields = getModuleKlarMissingFields(mod);
  if (fields.length === 0) return "";
  return `Udfyld først: ${fields.join(", ")}`;
}
