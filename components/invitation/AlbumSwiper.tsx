"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination, Keyboard } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import type { WeddingPhoto } from "@/types";

type Props = {
  photos: WeddingPhoto[];
};

export function AlbumSwiper({ photos }: Props) {
  if (!photos.length) return null;

  return (
    <section className="px-2 py-16">
      <h2 className="mb-8 text-center font-serif text-2xl">Album ảnh</h2>
      <Swiper
        modules={[Autoplay, Navigation, Pagination, Keyboard]}
        slidesPerView={1.05}
        centeredSlides
        spaceBetween={12}
        loop
        keyboard
        speed={1000}
        navigation
        pagination={{ clickable: true }}
        autoplay={{ delay: 2200, disableOnInteraction: false, pauseOnMouseEnter: true }}
        className="album-swiper"
        style={{ maxWidth: 720, margin: "0 auto", height: 520 }}
        observer
        observeParents
        watchSlidesProgress
      >
        {photos.map((photo) => (
          <SwiperSlide key={photo.id} className="!flex items-center justify-center">
            <img
              src={photo.url}
              alt={photo.caption ?? ""}
              loading="lazy"
              className="h-[50vh] max-h-[520px] w-auto max-w-[92vw] select-none rounded-xl object-contain"
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
