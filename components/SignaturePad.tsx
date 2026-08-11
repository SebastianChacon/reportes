"use client";

import React from "react";
import { Button } from "./ui";

/**
 * Finger-drawn signature on a canvas. Pointer events cover touch, pen and
 * mouse; `touch-action: none` on the canvas stops the page from scrolling
 * out from under the stroke.
 */
export function SignaturePad({
  label,
  hint,
  clearLabel,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  clearLabel: string;
  value: string | null;
  onChange: (dataUrl: string | null) => void;
}) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const drawing = React.useRef(false);
  const dirty = React.useRef(false);
  const [hasInk, setHasInk] = React.useState(Boolean(value));

  /** Size the backing store to the device pixel ratio so strokes stay crisp. */
  const setupCanvas = React.useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0) return;
    const dpr = window.devicePixelRatio || 1;

    // Preserve whatever is already drawn across a resize.
    const previous = dirty.current ? canvas.toDataURL("image/png") : value;

    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    // `--ink`, written out: a canvas cannot read a custom property, and this
    // stroke is also what ends up in the PDF. It was #18181b — a blue-tinted
    // near-black from a palette this product no longer uses, which made the
    // one handwritten mark on the page the only cool-toned thing on it.
    ctx.strokeStyle = "#111111";

    if (previous) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height);
      img.src = previous;
    }
  }, [value]);

  React.useEffect(() => {
    setupCanvas();
    // Mobile browsers fire `resize` on every scroll (URL bar collapsing) and
    // whenever the keyboard opens. Re-running setup then would snapshot and
    // asynchronously redraw the signature — flickering, and losing an in-flight
    // stroke. Only the width actually matters here.
    let lastWidth = canvasRef.current?.getBoundingClientRect().width ?? 0;
    const onResize = () => {
      const width = canvasRef.current?.getBoundingClientRect().width ?? 0;
      if (width === lastWidth || drawing.current) return;
      lastWidth = width;
      setupCanvas();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // Re-running on every `value` change would wipe strokes mid-signature.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pointFrom = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    const { x, y } = pointFrom(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = pointFrom(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    dirty.current = true;
    if (!hasInk) setHasInk(true);
  };

  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    const canvas = canvasRef.current;
    if (canvas && dirty.current) onChange(canvas.toDataURL("image/png"));
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    dirty.current = false;
    setHasInk(false);
    onChange(null);
  };

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <span className="text-sm font-medium">{label}</span>
        {hasInk && (
          <Button variant="ghost" onClick={clear} className="!min-h-9 !px-2 !py-1 !text-xs">
            {clearLabel}
          </Button>
        )}
      </div>
      <div className="relative overflow-hidden rounded-xl border-[1.5px] border-[color:var(--line)] bg-white">
        <canvas
          ref={canvasRef}
          className="signature-pad block h-32 w-full"
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
          onPointerCancel={end}
        />
        {!hasInk && (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-zinc-400">
            {hint}
          </span>
        )}
      </div>
    </div>
  );
}
