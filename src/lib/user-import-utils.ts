import * as XLSX from "xlsx";
import {
  ALL_USER_ROLES,
  userRoleLabels,
  type UserRole,
} from "./auth-types";

export const USER_IMPORT_COLUMN_HINTS = {
  navn: ["navn", "name", "fulde navn"],
  email: ["email", "e-mail", "mail", "e mail"],
  telefon: ["telefon", "telefonnummer", "phone", "tlf", "mobil"],
  titel: ["titel", "rolle", "role", "brugertype", "brugerrolle", "stilling"],
} as const;

export const USER_IMPORT_DEFAULT_PASSWORD = "Brandbjerg1234";

export interface ParsedUserImportRow {
  rowNumber: number;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
}

export interface UserImportRowError {
  rowNumber: number;
  message: string;
}

export interface UserImportParseResult {
  rows: ParsedUserImportRow[];
  errors: UserImportRowError[];
}

export interface UserImportBatchError {
  rowNumber: number;
  email: string;
  message: string;
}

export interface UserImportBatchResult {
  created: number;
  skipped: number;
  errors: UserImportBatchError[];
}

const ROLE_ALIASES: Record<string, UserRole> = {
  admin: "admin",
  administrator: "admin",
  kursusleder: "kursusleder",
  "kursus leder": "kursusleder",
  hojskolelaerer: "hojskolelaerer",
  "hojskole laerer": "hojskolelaerer",
  højskolelærer: "hojskolelaerer",
  "højskole lærer": "hojskolelaerer",
  kursist: "kursist",
  deltager: "kursist",
  koekkenleder: "koekkenleder",
  "kokkenleder": "koekkenleder",
  køkkenleder: "koekkenleder",
  "køkken leder": "koekkenleder",
  koekkenassistent: "koekkenassistent",
  "kokkenassistent": "koekkenassistent",
  køkkenassistent: "koekkenassistent",
  "køkken assistent": "koekkenassistent",
  rengoringsleder: "rengoringsleder",
  rengøringsleder: "rengoringsleder",
  "rengøring leder": "rengoringsleder",
  rengoringsassistent: "rengoringsassistent",
  rengøringsassistent: "rengoringsassistent",
  "rengøring assistent": "rengoringsassistent",
  pedelleder: "pedelleder",
  "pedel leder": "pedelleder",
  pedelassistent: "pedelassistent",
  "pedel assistent": "pedelassistent",
  kontor: "kontor",
};

function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ");
}

function cellText(value: unknown): string {
  if (value == null) return "";
  return String(value).trim();
}

function findColumnIndex(
  headers: string[],
  aliases: readonly string[],
): number {
  return headers.findIndex((h) => aliases.includes(h));
}

function parseRoleFromTitel(raw: string): UserRole | null {
  const normalized = normalizeHeader(raw);
  if (!normalized) return null;

  if (ROLE_ALIASES[normalized]) {
    return ROLE_ALIASES[normalized];
  }

  for (const role of ALL_USER_ROLES) {
    const label = normalizeHeader(userRoleLabels[role]);
    if (normalized === label || normalized === role) {
      return role;
    }
  }

  for (const [alias, role] of Object.entries(ROLE_ALIASES)) {
    if (normalized.includes(alias) || alias.includes(normalized)) {
      return role;
    }
  }

  return null;
}

function sheetToMatrix(buffer: ArrayBuffer): string[][] {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(
    sheet,
    { header: 1, defval: "" },
  );
  return rows.map((row) => row.map((cell) => cellText(cell)));
}

export function parseUserImportFile(buffer: ArrayBuffer): UserImportParseResult {
  const matrix = sheetToMatrix(buffer);
  const errors: UserImportRowError[] = [];
  const rows: ParsedUserImportRow[] = [];

  if (matrix.length === 0) {
    return {
      rows: [],
      errors: [{ rowNumber: 0, message: "Arket er tomt." }],
    };
  }

  const headerRowIndex = matrix.findIndex((row) =>
    row.some((cell) => cell.trim().length > 0),
  );
  if (headerRowIndex < 0) {
    return {
      rows: [],
      errors: [{ rowNumber: 0, message: "Kunne ikke finde kolonneoverskrifter." }],
    };
  }

  const headers = matrix[headerRowIndex].map(normalizeHeader);
  const nameIdx = findColumnIndex(headers, USER_IMPORT_COLUMN_HINTS.navn);
  const emailIdx = findColumnIndex(headers, USER_IMPORT_COLUMN_HINTS.email);
  const phoneIdx = findColumnIndex(headers, USER_IMPORT_COLUMN_HINTS.telefon);
  const titelIdx = findColumnIndex(headers, USER_IMPORT_COLUMN_HINTS.titel);

  if (nameIdx < 0 || emailIdx < 0 || titelIdx < 0) {
    const missing: string[] = [];
    if (nameIdx < 0) missing.push("Navn");
    if (emailIdx < 0) missing.push("email");
    if (titelIdx < 0) missing.push("Titel");
    return {
      rows: [],
      errors: [
        {
          rowNumber: headerRowIndex + 1,
          message: `Manglende kolonner: ${missing.join(", ")}. Se formatguide nedenfor.`,
        },
      ],
    };
  }

  for (let i = headerRowIndex + 1; i < matrix.length; i++) {
    const line = matrix[i];
    const rowNumber = i + 1;
    const name = cellText(line[nameIdx]);
    const email = cellText(line[emailIdx]).toLowerCase();
    const phone = phoneIdx >= 0 ? cellText(line[phoneIdx]) : "";
    const titel = cellText(line[titelIdx]);

    const rowEmpty = !name && !email && !titel && !phone;
    if (rowEmpty) continue;

    if (!name) {
      errors.push({ rowNumber, message: "Navn mangler." });
      continue;
    }
    if (!email || !email.includes("@")) {
      errors.push({ rowNumber, message: "Ugyldig eller manglende e-mail." });
      continue;
    }
    const role = parseRoleFromTitel(titel);
    if (!role) {
      errors.push({
        rowNumber,
        message: `Ukendt titel/rolle: «${titel}». Brug fx «Kursusleder» eller «Kontor».`,
      });
      continue;
    }

    rows.push({
      rowNumber,
      name,
      email,
      phone: phone || undefined,
      role,
    });
  }

  if (rows.length === 0 && errors.length === 0) {
    errors.push({
      rowNumber: 0,
      message: "Ingen brugerrækker fundet under overskriften.",
    });
  }

  return { rows, errors };
}

export function buildUserImportTemplateWorkbook(): ArrayBuffer {
  const exampleRows = [
    ["Navn", "email", "telefonnummer", "Titel"],
    [
      "Anna Andersen",
      "anna@brandbjerg.dk",
      "12345678",
      "Kontor",
    ],
    [
      "Bo Jensen",
      "bo@brandbjerg.dk",
      "87654321",
      "Rengøringsassistent",
    ],
    [
      "Mette Hansen",
      "mette@example.dk",
      "11223344",
      "Kursist",
    ],
  ];

  const sheet = XLSX.utils.aoa_to_sheet(exampleRows);
  sheet["!cols"] = [{ wch: 22 }, { wch: 28 }, { wch: 14 }, { wch: 22 }];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Brugere");
  return XLSX.write(workbook, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
}

export function downloadUserImportTemplate(): void {
  const buffer = buildUserImportTemplateWorkbook();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "brugere-skabelon.xlsx";
  link.click();
  URL.revokeObjectURL(url);
}

export function acceptedImportFileName(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return (
    lower.endsWith(".xlsx") ||
    lower.endsWith(".xls") ||
    lower.endsWith(".csv")
  );
}
