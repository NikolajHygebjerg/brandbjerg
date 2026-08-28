"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PedelDayRoom } from "@/lib/pedel-utils";
import {
  compressImageFile,
  deleteSetupPhoto,
  listPhotosForRoom,
  PEDEL_SETUP_PHOTO_UPDATED_EVENT,
  saveSetupPhoto,
  type PedelSetupPhoto,
} from "@/lib/pedel-setup-photo-storage";

type PedelSetupPhotoPanelProps = {
  courseId: string;
  courseTitle: string;
  room: PedelDayRoom;
};

export function PedelSetupPhotoPanel({
  courseId,
  courseTitle,
  room,
}: PedelSetupPhotoPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<PedelSetupPhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const spec = room.entries[0]?.spec;

  function refresh() {
    setPhotos(listPhotosForRoom(courseId, room.dayDate, room.lokale));
  }

  useEffect(() => {
    refresh();
    function onUpdate() {
      refresh();
    }
    window.addEventListener(PEDEL_SETUP_PHOTO_UPDATED_EVENT, onUpdate);
    return () =>
      window.removeEventListener(PEDEL_SETUP_PHOTO_UPDATED_EVENT, onUpdate);
  }, [courseId, room.dayDate, room.lokale]);

  async function handleFiles(files: FileList | null) {
    if (!files?.length || !spec) return;
    setUploading(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        const dataUrl = await compressImageFile(file);
        saveSetupPhoto({
          courseId,
          courseTitle,
          date: room.dayDate,
          dayLabel: room.dayLabel,
          lokale: room.lokale,
          spec,
          dataUrl,
          filename: file.name,
        });
      }
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload fejlede");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-blue-950">Fotos af opsætning</p>
          <p className="text-xs text-blue-800">
            Vises for kursusledere med samme lokale og bordopstilling
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          className="h-8 gap-1.5 text-xs"
          disabled={uploading || !spec}
          onClick={() => inputRef.current?.click()}
        >
          <Camera className="size-3.5" />
          {uploading ? "Uploader…" : "Upload foto"}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {error && (
        <p className="mt-2 text-xs text-red-600">{error}</p>
      )}

      {photos.length > 0 ? (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="group relative overflow-hidden rounded-lg border border-blue-200 bg-white"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.dataUrl}
                alt={photo.caption || photo.filename}
                className="aspect-[4/3] w-full object-cover"
              />
              <button
                type="button"
                onClick={() => deleteSetupPhoto(photo.id)}
                className="absolute right-1 top-1 rounded bg-black/50 p-1 text-white opacity-0 transition group-hover:opacity-100"
                aria-label="Slet foto"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-xs text-blue-900/70">
          Ingen fotos endnu — upload billeder af bordopstillingen i lokalet.
        </p>
      )}
    </div>
  );
}
