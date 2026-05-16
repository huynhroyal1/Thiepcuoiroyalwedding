"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import "swiper/css";

type Props = {
  children: ReactNode[];
  /** Khớp thứ tự với children — dùng làm key slide */
  slideKeys: string[];
  /** ms giữa mỗi lần autoplay chuyển slide */
  autoMs?: number;
  className?: string;
};

/**
 * Swiper: 1 / 2 / 3 slide theo breakpoint, kéo/swipe, autoplay.
 */
export function CarouselThree({ children, slideKeys, autoMs = 3000, className = "" }: Props) {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    setReduceMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  if (children.length === 0) return null;

  return (
    <Swiper
      className={`w-full min-w-0 !pb-2 ${className}`}
      modules={[Autoplay]}
      spaceBetween={16}
      slidesPerView={1}
      grabCursor
      rewind={children.length > 1}
      breakpoints={{
        640: { slidesPerView: 2, spaceBetween: 16 },
        1024: { slidesPerView: 3, spaceBetween: 20 },
      }}
      autoplay={
        reduceMotion || children.length <= 1
          ? false
          : {
              delay: autoMs,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }
      }
    >
      {children.map((node, i) => (
        <SwiperSlide key={slideKeys[i] ?? String(i)} className="!flex !h-auto">
          <div className="flex h-full w-full min-w-0 flex-col">{node}</div>
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
