"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Music2 } from "lucide-react";

type Props = {
  src: string | null | undefined;
};

function dispatchMusicEvent(type: "invitation:music:play" | "invitation:music:pause") {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(type));
  }
}

export function BackgroundMusic({ src }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const initializedRef = useRef(false);

  const tryUnmute = useCallback(async (el: HTMLAudioElement) => {
    el.volume = 0.55;
    el.muted = false;
    try {
      await el.play();
      setPlaying(true);
      dispatchMusicEvent("invitation:music:play");
    } catch {
      setPlaying(false);
    }
  }, []);

  const play = useCallback(async () => {
    const el = audioRef.current;
    if (!el || !src) return false;
    return tryUnmute(el);
  }, [src, tryUnmute]);

  const pause = useCallback(() => {
    const el = audioRef.current;
    if (el) el.pause();
    setPlaying(false);
    dispatchMusicEvent("invitation:music:pause");
  }, []);

  useEffect(() => {
    if (!src || initializedRef.current) return;
    initializedRef.current = true;

    const el = audioRef.current;
    if (!el) return;

    // Bắt đầu muted để browser cho phép autoplay,
    // rồi mới thử bỏ mute để phát ra âm thanh.
    el.muted = true;
    el.volume = 0.55;

    const attemptUnmute = async () => {
      const audioEl = audioRef.current;
      if (!audioEl) return;

      if (audioEl.muted) {
        // Nếu đang muted: thử phát muted trước, rồi unmute.
        try {
          await audioEl.play();
          await tryUnmute(audioEl);
        } catch {
          // Browser vẫn chặn, đợi tương tác của user.
          setPlaying(false);
        }
      } else {
        await tryUnmute(audioEl);
      }
    };

    // Thử ngay lập tức khi mount.
    void attemptUnmute();

    // Mọi tương tác đầu tiên đều có thể là user gesture.
    const events: (keyof DocumentEventMap)[] = [
      "click",
      "touchstart",
      "keydown",
    ];
    const handler = async () => {
      await attemptUnmute();
      events.forEach((eventName) => document.removeEventListener(eventName, handler));
    };
    events.forEach((eventName) =>
      document.addEventListener(eventName, handler, { once: true, passive: true }),
    );

    return () => {
      events.forEach((eventName) => document.removeEventListener(eventName, handler));
    };
  }, [src, tryUnmute]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onPlay = () => { setPlaying(true); dispatchMusicEvent("invitation:music:play"); };
    const onPause = () => { setPlaying(false); dispatchMusicEvent("invitation:music:pause"); };
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    return () => {
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
    };
  }, []);

  const toggle = useCallback(async () => {
    if (playing) {
      pause();
    } else {
      await play();
    }
  }, [playing, pause, play]);

  if (!src) return null;

  return (
    <>
      <audio ref={audioRef} src={src} loop preload="auto" playsInline muted />
      <button
        type="button"
        onClick={() => void toggle()}
        className="invitation-music-disc-btn fixed right-3 top-3 z-[95] sm:right-4 sm:top-4"
        aria-label={playing ? "Tạm dừng nhạc nền" : "Phát nhạc nền"}
        title={playing ? "Tạm dừng nhạc" : "Phát nhạc"}
      >
        <span
          className={`invitation-music-disc ${playing ? "invitation-music-disc--spinning" : "invitation-music-disc--spinning"}`}
        >
          <Music2 className="invitation-music-disc__icon h-5 w-5" strokeWidth={2} />
        </span>
      </button>
    </>
  );
}
