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

  const play = useCallback(async () => {
    const el = audioRef.current;
    if (!el || !src) return false;
    el.volume = 0.55;
    try {
      await el.play();
      setPlaying(true);
      dispatchMusicEvent("invitation:music:play");
      return true;
    } catch {
      setPlaying(false);
      return false;
    }
  }, [src]);

  const pause = useCallback(() => {
    const el = audioRef.current;
    if (el) el.pause();
    setPlaying(false);
    dispatchMusicEvent("invitation:music:pause");
  }, []);

  useEffect(() => {
    if (!src) return;
    const el = audioRef.current;
    if (!el) return;
    el.muted = false;
    void play();
  }, [src, play]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onPlay = () => { setPlaying(true); dispatchMusicEvent("invitation:music:play"); };
    const onPause = () => { setPlaying(false); dispatchMusicEvent("invitation:music:pause"); };
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    return () => { el.removeEventListener("play", onPlay); el.removeEventListener("pause", onPause); };
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
      <audio ref={audioRef} src={src} loop preload="auto" playsInline />
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
