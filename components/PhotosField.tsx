"use client";

import React from "react";
import { t } from "@/lib/i18n";
import { readPhotoAsDataUrl } from "@/lib/photos";
import type { Lang } from "@/lib/types";
import { Button, IconPlus, IconTrash } from "./ui";

export function PhotosField({
  lang,
  value,
  onChange,
}: {
  lang: Lang;
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [busy, setBusy] = React.useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      const added = await Promise.all(Array.from(files).map(readPhotoAsDataUrl));
      onChange([...value, ...added]);
    } finally {
      setBusy(false);
    }
  };

  const remove = (index: number) => onChange(value.filter((_, i) => i !== index));

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={(e) => {
          void handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

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

      <Button type="button" onClick={() => inputRef.current?.click()} disabled={busy} full>
        <IconPlus />
        {busy ? t("processingPhotos", lang) : t("addPhotos", lang)}
      </Button>
    </div>
  );
}
