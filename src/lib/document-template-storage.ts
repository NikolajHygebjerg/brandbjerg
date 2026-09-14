const KEY = "brandbjerg-document-templates";

export type DocumentTemplateId = "velkomst-afvikling" | "drikkevarerseddel";

export interface DocumentTemplate {
  id: DocumentTemplateId;
  title: string;
  description: string;
  body: string;
  updatedAt?: string;
}

const DEFAULTS: Record<DocumentTemplateId, DocumentTemplate> = {
  "velkomst-afvikling": {
    id: "velkomst-afvikling",
    title: "Velkomst ved afvikling",
    description:
      "Forslag til velkomst inkl. praktiske beskeder — bruges på kurset, redigeres pr. kursus af kursusleder.",
    body: `Velkommen til {{kursusTitel}}!

Praktisk information:
• Indskrivning: følg skiltning til kontor/reception
• Måltider: morgenmad, frokost og aftensmad i spisesalen — se program for tider
• Værelser: nøgle udleveres ved ankomst
• WiFi: netværk og kode oplyses ved velkomst
• Kontakt: henvend dig til kursusleder eller kontoret ved spørgsmål

Vi glæder os til en god uge sammen.`,
  },
  drikkevarerseddel: {
    id: "drikkevarerseddel",
    title: "Drikkevarerseddel",
    description:
      "Master til print af drikkevarer — baseret på Drikkevarerseddel NY Master. Redigeres her; enkelte kurser kan tilføje noter ved print.",
    body: `DRINKOVARER — {{kursusTitel}}

Kaffe · te · saft · mælk · vand
Opvarmning / servering jf. køkkenplan

(Tilpas linjer efter master-PDF — se forhåndsvisning ved print)`,
  },
};

function loadAll(): Partial<Record<DocumentTemplateId, DocumentTemplate>> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Partial<Record<DocumentTemplateId, DocumentTemplate>>;
  } catch {
    return {};
  }
}

function saveAll(data: Partial<Record<DocumentTemplateId, DocumentTemplate>>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function listDocumentTemplates(): DocumentTemplate[] {
  const stored = loadAll();
  return (Object.keys(DEFAULTS) as DocumentTemplateId[]).map(
    (id) => ({
      ...DEFAULTS[id],
      ...stored[id],
      id,
    }),
  );
}

export function getDocumentTemplate(id: DocumentTemplateId): DocumentTemplate {
  const stored = loadAll()[id];
  return { ...DEFAULTS[id], ...stored, id };
}

export function saveDocumentTemplate(
  id: DocumentTemplateId,
  body: string,
): DocumentTemplate {
  const stored = loadAll();
  const next: DocumentTemplate = {
    ...getDocumentTemplate(id),
    body,
    updatedAt: new Date().toISOString(),
  };
  stored[id] = next;
  saveAll(stored);
  return next;
}

export function applyDocumentPlaceholders(
  text: string,
  vars: Record<string, string>,
): string {
  let out = text;
  for (const [key, value] of Object.entries(vars)) {
    out = out.replaceAll(`{{${key}}}`, value);
  }
  return out;
}
