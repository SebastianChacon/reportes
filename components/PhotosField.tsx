"use client";

import React from "react";
import { t } from "@/lib/i18n";
import { readPhotoAsDataUrl } from "@/lib/photos";
import type { Lang } from "@/lib/types";
import { Button, IconCamera, IconImage, IconTrash } from "./ui";

/** Enough for a before/after walkthrough; past this the payload stops being emailable. */
const MAX_PHOTOS = 12;

export function PhotosField({
  lang,
  value,
  onChange,
}: {
  lang: Lang;
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const galleryRef = React.useRef<HTMLInputElement>(null);
  const cameraRef = React.useRef<HTMLInputElement>(null);
  const [busy, setBusy] = React.useState(false);
  const [failed, setFailed] = React.useState(0);

  const full = value.length >= MAX_PHOTOS;

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    setFailed(0);
    try {
      const room = MAX_PHOTOS - value.length;
      const picked = Array.from(files).slice(0, Math.max(0, room));
      // One unreadable file (HEIC on some Android browsers, a corrupt download)
      // must not throw away the photos that decoded fine alongside it.
      const results = await Promise.allSettled(picked.map(readPhotoAsDataUrl));
      const added = results
        .filter((r): r is PromiseFulfilledResult<string> => r.status === "fulfilled")
        .map((r) => r.value);
      const rejected = results.length - added.length + (files.length - picked.length);
      if (added.length > 0) onChange([...value, ...added]);
      setFailed(rejected);
    } finally {
      setBusy(false);
    }
  };

  const remove = (index: number) => onChange(value.filter((_, i) => i !== index));

  // Two inputs, because one cannot be both: `capture` forces the camera and
  // hides the gallery entirely on iOS and most Android browsers.
  const inputProps = {
    type: "file" as const,
    accept: "image/*",
    multiple: true,
    className: "hidden",
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      const { files } = e.target;
      e.target.value = "";
      handleFiles(files).catch(() => setBusy(false));
    },
  };

  return (
    <div>
      <input ref={galleryRef} {...inputProps} />
      <input ref={cameraRef} capture="environment" {...inputProps} />

      {value.length > 0 && (
        <ul className="mb-3 grid grid-cols-3 gap-2">
          {value.map((src, i) => (
            <li
              key={i}
              className="relative aspect-square overflow-hidden rounded-xl border border-[color:var(--line)]"
            >
              {/* data-URLs, not remote images — next/image gains nothing here */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                aria-label={`${t("remove", lang)} ${i + 1}`}
                onClick={() => remove(i)}
                className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white"
              >
                <IconTrash />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <Button
          type="button"
          onClick={() => cameraRef.current?.click()}
          disabled={busy || full}
          className="flex-1"
        >
          <IconCamera />
          {busy ? t("processingPhotos", lang) : t("takePhoto", lang)}
        </Button>
        <Button
          type="button"
          onClick={() => galleryRef.current?.click()}
          disabled={busy || full}
          className="flex-1"
        >
          <IconImage />
          {t("chooseFromGallery", lang)}
        </Button>
      </div>

      {full && (
        <p className="mt-2 text-xs text-[color:var(--ink-muted)]">
          {t("photosMax", lang).replace("{n}", String(MAX_PHOTOS))}
        </p>
      )}
      {failed > 0 && (
        <p className="mt-2 text-xs text-[color:var(--color-clay-600)]">
          {t("photosFailed", lang).replace("{n}", String(failed))}
        </p>
      )}
    </div>
  );
}
