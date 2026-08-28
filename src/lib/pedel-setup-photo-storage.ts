import type { LokaleSpecifikation } from "./mock-data";
import { PEDEL_EVALUATION_UPDATED_EVENT } from "./pedel-evaluation-storage";

const KEY = "brandbjerg-pedel-setup-photos";
export const PEDEL_SETUP_PHOTO_UPDATED_EVENT = "brandbjerg-pedel-setup-photo-updated";

export interface PedelSetupPhoto {
  id: string;
  courseId: string;
  courseTitle: string;
  date: string;
  dayLabel: string;
  lokale: string;
  bordopstilling: string;
  antalPersoner: number;
  dataUrl: string;
  filename: string;
  caption: string;
  uploadedAt: string;
}

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function emitUpdate() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(PEDEL_SETUP_PHOTO_UPDATED_EVENT));
    window.dispatchEvent(new CustomEvent(PEDEL_EVALUATION_UPDATED_EVENT));
  }
}

function loadAll(): PedelSetupPhoto[] {
  if (typeof window === "undefined") return [];
  return safeParse<PedelSetupPhoto[]>(localStorage.getItem(KEY)) ?? [];
}

function saveAll(photos: PedelSetupPhoto[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(photos));
  emitUpdate();
}

export function specLookupKey(
  lokale: string,
  bordopstilling: string,
  antalPersoner: number,
): string {
  return `${lokale.trim().toLowerCase()}::${bordopstilling.trim().toLowerCase()}::${antalPersoner}`;
}

export async function compressImageFile(
  file: File,
  maxWidth = 960,
): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Kun billedfiler understøttes");
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Kunne ikke læse fil"));
    reader.readAsDataURL(file);
  });

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => reject(new Error("Kunne ikke behandle billede"));
    img.src = dataUrl;
  });
}

export function saveSetupPhoto(input: {
  courseId: string;
  courseTitle: string;
  date: string;
  dayLabel: string;
  lokale: string;
  spec: LokaleSpecifikation;
  dataUrl: string;
  filename: string;
  caption?: string;
}): PedelSetupPhoto {
  const photo: PedelSetupPhoto = {
    id: `psp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    courseId: input.courseId,
    courseTitle: input.courseTitle,
    date: input.date,
    dayLabel: input.dayLabel,
    lokale: input.lokale,
    bordopstilling: input.spec.bordopstilling || "Normal",
    antalPersoner: input.spec.antalPersoner || 0,
    dataUrl: input.dataUrl,
    filename: input.filename,
    caption: input.caption?.trim() ?? "",
    uploadedAt: new Date().toISOString(),
  };
  saveAll([photo, ...loadAll()]);
  return photo;
}

export function deleteSetupPhoto(id: string): void {
  saveAll(loadAll().filter((p) => p.id !== id));
}

export function listPhotosForRoom(
  courseId: string,
  date: string,
  lokale: string,
): PedelSetupPhoto[] {
  return loadAll()
    .filter(
      (p) =>
        p.courseId === courseId && p.date === date && p.lokale === lokale,
    )
    .sort(
      (a, b) =>
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
    );
}

/** Inspiration til kursusleder: match lokale + bordopstilling + personer */
export function listPhotosForLokaleSpec(
  spec: Pick<LokaleSpecifikation, "lokale" | "bordopstilling" | "antalPersoner">,
): PedelSetupPhoto[] {
  if (!spec.lokale.trim()) return [];
  const key = specLookupKey(
    spec.lokale,
    spec.bordopstilling || "Normal",
    spec.antalPersoner || 0,
  );

  return loadAll()
    .filter((p) => {
      const photoKey = specLookupKey(
        p.lokale,
        p.bordopstilling,
        p.antalPersoner,
      );
      if (photoKey === key) return true;
      return (
        p.lokale.toLowerCase() === spec.lokale.toLowerCase() &&
        (spec.antalPersoner === 0 ||
          Math.abs(p.antalPersoner - spec.antalPersoner) <= 5)
      );
    })
    .sort(
      (a, b) =>
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
    )
    .slice(0, 12);
}
