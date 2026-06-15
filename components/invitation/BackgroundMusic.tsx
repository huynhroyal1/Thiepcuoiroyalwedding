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
  const audioContextRef = useRef<AudioContext | null>(null);
  const hasAttemptedRef = useRef(false);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const play = useCallback(async () => {
    const el = audioRef.current;
    if (!el || !src) return false;

    // Try AudioContext approach first (more reliable for autoplay)
    try {
      const ctx = getAudioContext();
      if (ctx.state === "suspended") {
        await ctx.resume();
      }
    } catch {
      // AudioContext not supported, fall through to HTML5 Audio
    }

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
  }, [src, getAudioContext]);

  const pause = useCallback(() => {
    const el = audioRef.current;
    if (el) el.pause();
    setPlaying(false);
    dispatchMusicEvent("invitation:music:pause");
  }, []);

  useEffect(() => {
    if (!src || hasAttemptedRef.current) return;
    hasAttemptedRef.current = true;

    const el = audioRef.current;
    if (!el) return;

    // Try autoplay immediately (works on localhost)
    const attemptPlay = async () => {
      el.muted = false;
      const success = await play();
      if (!success) {
        // If autoplay blocked, try muted autoplay then unmute
        el.muted = true;
        try {
          await el.play();
          // Small delay then unmute
          setTimeout(() => {
            el.muted = false;
            setPlaying(true);
            dispatchMusicEvent("invitation:music:play");
          }, 100);
        } catch {
          // Still blocked, user needs to interact
          setPlaying(false);
        }
      }
    };

    attemptPlay();
  }, [src, play]);

  // Listen for ANY user interaction to start music
  useEffect(() => {
    if (!src) return;

    const events: (keyof DocumentEventMap)[] = ["click", "touchstart", "keydown", "scroll", "wheel"];
    const handler = async () => {
      const el = audioRef.current;
      if (!el || playing) return;

      el.muted = false;
      try {
        await el.play();
        setPlaying(true);
        dispatchMusicEvent("invitation:music:play");
      } catch {
        // Still blocked
      }

      // Remove listeners after first successful/failed attempt
      events.forEach((e) => document.removeEventListener(e, handler));
    };

    events.forEach((e) => document.addEventListener(e, handler, { once: true, passive: true }));

    return () => {
      events.forEach((e) => document.removeEventListener(e, handler));
    };
  }, [src, playing]);

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
