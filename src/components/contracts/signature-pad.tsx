"use client";

import { useEffect, useRef, useState } from "react";
import { Eraser, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

type SignaturePadProps = {
  value?: string;
  onChange: (dataUrl: string) => void;
  label?: string;
  disabled?: boolean;
};

export function SignaturePad({
  value,
  onChange,
  label = "Underskrift",
  disabled = false,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const [hasStroke, setHasStroke] = useState(Boolean(value));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (value) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setHasStroke(true);
      };
      img.src = value;
    }
  }, [value]);

  function getPoint(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  function startDraw(e: React.PointerEvent<HTMLCanvasElement>) {
    if (disabled) return;
    drawingRef.current = true;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const point = getPoint(e);
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
    canvas.setPointerCapture(e.pointerId);
  }

  function draw(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current || disabled) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const point = getPoint(e);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    setHasStroke(true);
  }

  function endDraw(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const canvas = canvasRef.current!;
    canvas.releasePointerCapture(e.pointerId);
    onChange(canvas.toDataURL("image/png"));
  }

  function clear() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasStroke(false);
    onChange("");
  }

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const img = new Image();
      img.onload = () => {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const scale = Math.min(
          canvas.width / img.width,
          canvas.height / img.height,
        );
        const w = img.width * scale;
        const h = img.height * scale;
        const x = (canvas.width - w) / 2;
        const y = (canvas.height - h) / 2;
        ctx.drawImage(img, x, y, w, h);
        setHasStroke(true);
        onChange(canvas.toDataURL("image/png"));
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-slate-700">{label}</p>
        {!disabled && (
          <div className="flex gap-2">
            <label className="inline-flex cursor-pointer items-center gap-1 text-xs text-slate-600 hover:text-slate-900">
              <Upload className="h-3.5 w-3.5" />
              Upload foto
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUpload}
              />
            </label>
            <button
              type="button"
              onClick={clear}
              className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900"
            >
              <Eraser className="h-3.5 w-3.5" />
              Ryd
            </button>
          </div>
        )}
      </div>
      <div className="overflow-hidden rounded-lg border border-slate-300 bg-white">
        <canvas
          ref={canvasRef}
          width={600}
          height={180}
          className={`h-36 w-full touch-none ${disabled ? "cursor-not-allowed opacity-70" : "cursor-crosshair"}`}
          onPointerDown={startDraw}
          onPointerMove={draw}
          onPointerUp={endDraw}
          onPointerLeave={endDraw}
        />
      </div>
      {!hasStroke && !disabled && (
        <p className="text-xs text-slate-500">
          Tegn med mus, finger eller upload et foto af din underskrift
        </p>
      )}
    </div>
  );
}

export function SignaturePreview({
  signature,
  label,
}: {
  signature?: { dataUrl: string; signedAt: string; signedByName: string };
  label: string;
}) {
  if (!signature?.dataUrl) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
        {label} — endnu ikke underskrevet
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={signature.dataUrl}
        alt={label}
        className="mt-2 h-24 w-full object-contain"
      />
      <p className="mt-2 text-sm text-slate-700">{signature.signedByName}</p>
      <p className="text-xs text-slate-500">
        {new Date(signature.signedAt).toLocaleString("da-DK")}
      </p>
    </div>
  );
}
