"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import { Navigation, Pagination, Keyboard } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import type { WeddingPhoto } from "@/types";

type Props = {
  photos: WeddingPhoto[];
};

const PX_PER_SECOND = 18;

export function AlbumSwiper({ photos }: Props) {
  const swiperRef = useRef<SwiperType | null>(null);
  const [isReady, setIsReady] = useState(false);
  const lastTickRef = useRef(performance.now());
  const rafRef = useRef(0);

  const autoplayEnabled = photos.length > 1;

  useEffect(() => {
    if (!autoplayEnabled || !isReady || !swiperRef.current) return;

    const swiper = swiperRef.current;

    const tick = (time: number) => {
      const dt = (time - lastTickRef.current) / 1000;
      lastTickRef.current = time;

      if (!swiper.destroyed && !swiper.isEnd && !swiper.isBeginning) {
        swiper.slideNext(dt * PX_PER_SECOND, false);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    lastTickRef.current = performance.now();
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [autoplayEnabled, isReady]);

  const onSwiper = useCallback((swiper: SwiperType) => {
    swiperRef.current = swiper;
    setIsReady(true);
  }, []);

  if (!photos.length) return null;

  return (
    <section className="px-2 py-16">
      <h2 className="mb-8 text-center font-serif text-2xl">Album ảnh</h2>
      <Swiper
        modules={[Navigation, Pagination, Keyboard]}
        onSwiper={onSwiper}
        slidesPerView={1.05}
        centeredSlides
        spaceBetween={12}
        loop
        keyboard
        speed={1000}
        navigation
        pagination={{ clickable: true }}
        className="album-swiper"
        style={{ maxWidth: 720, margin: "0 auto" }}
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
