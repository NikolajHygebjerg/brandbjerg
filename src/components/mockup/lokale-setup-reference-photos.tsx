"use client";

import { useEffect, useState } from "react";
import type { LokaleSpecifikation } from "@/lib/mock-data";
import {
  listPhotosForLokaleSpec,
  PEDEL_SETUP_PHOTO_UPDATED_EVENT,
  type PedelSetupPhoto,
} from "@/lib/pedel-setup-photo-storage";

type LokaleSetupReferencePhotosProps = {
  spec: LokaleSpecifikation;
};

export function LokaleSetupReferencePhotos({
  spec,
}: LokaleSetupReferencePhotosProps) {
  const [photos, setPhotos] = useState<PedelSetupPhoto[]>([]);

  useEffect(() => {
    function refresh() {
      setPhotos(listPhotosForLokaleSpec(spec));
    }
    refresh();
    window.addEventListener(PEDEL_SETUP_PHOTO_UPDATED_EVENT, refresh);
    return () =>
      window.removeEventListener(PEDEL_SETUP_PHOTO_UPDATED_EVENT, refresh);
  }, [spec.lokale, spec.bordopstilling, spec.antalPersoner]);

  if (!spec.lokale.trim() || photos.length === 0) return null;

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-3">
      <p className="text-xs font-medium text-blue-900">
        Referencefotos fra pedel — {spec.lokale}
        {spec.antalPersoner > 0 ? ` · ${spec.antalPersoner} pers.` : ""}
        {spec.bordopstilling && spec.bordopstilling !== "Normal"
          ? ` · ${spec.bordopstilling}`
          : ""}
      </p>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {photos.slice(0, 6).map((photo) => (
          <figure key={photo.id} className="overflow-hidden rounded-md border border-blue-100 bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.dataUrl}
              alt={`Opsætning ${photo.lokale}`}
              className="aspect-[4/3] w-full object-cover"
            />
            <figcaption className="truncate px-1.5 py-1 text-[10px] text-slate-500">
              {photo.courseTitle}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
