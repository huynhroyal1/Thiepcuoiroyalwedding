"use client";

import type { WeddingPhoto } from "@/types";

type Props = {
  photos: WeddingPhoto[];
};

export function AlbumGrid({ photos }: Props) {
  if (!photos.length) return null;

  return (
    <section className="px-4 py-16">
      <h2 className="mb-8 text-center font-serif text-2xl">Album ảnh</h2>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-3 sm:gap-3">
        {photos.map((photo, idx) => (
          <div
            key={photo.id}
            className={`relative overflow-hidden rounded-lg ${
              idx === 0 ? "col-span-2 row-span-2" : ""
            }`}
            style={{ aspectRatio: idx === 0 ? "1/1" : "3/4" }}
          >
            <img
              src={photo.url}
              alt={photo.caption ?? ""}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
