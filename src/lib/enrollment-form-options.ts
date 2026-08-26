export const countryOptions = [
  "Danmark",
  "Sverige",
  "Norge",
  "Tyskland",
  "Storbritannien",
  "Andet",
] as const;

export const accommodationOptions = [
  { value: "dobbelt", label: "Delt dobbeltværelse (inkl. i prisen)" },
  { value: "enkelt", label: "Enkeltværelse (+1.400 kr.)" },
] as const;

export const heardFromOptions = [
  "Vælg",
  "Hjemmeside / nyhedsbrev",
  "Facebook / sociale medier",
  "Annonce / avis",
  "Ven eller bekendt",
  "Tidligere kursist",
  "Brandbjerg Højskoles venner / BHV",
  "Andet",
] as const;

export const dietaryOptions = [
  "Vælg",
  "Ingen særlige hensyn",
  "Vegetar",
  "Veganer",
  "Diabetes",
  "Allergi (angiv under «Andre hensyn»)",
  "Andet (angiv under «Andre hensyn»)",
] as const;

export const ENKELTVAERELSE_TILLÆG = 1400;
export const SENGETØJ_TILLÆG = 150;
export const INDMELDELSES_GEBYR = 500;
