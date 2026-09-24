/**
 * Darslik video pleyeri.
 *
 * NEGA BRAUZERNING O'Z BOSHQARUVI EMAS:
 *   `<video controls>` har brauzerda boshqacha ko'rinadi, tezlikni
 *   o'zgartirish ba'zilarida yashirin menyuda, "keyingi dars" tugmasi esa
 *   umuman yo'q. Darslik uchun kerak bo'lgan uchta narsa — to'xtagan joydan
 *   davom etish, tezlikni boshqarish va darsdan darsga o'tish — standart
 *   boshqaruvda yo'q edi.
 *
 * MOBIL HAQIQATI:
 *   iOS Safari to'liq ekranni faqat videoning O'Z usuli bilan beradi
 *   (`webkitEnterFullscreen`) — konteynerni `requestFullscreen` qilish u
 *   yerda ishlamaydi. Shuning uchun ikkala yo'l ham sinaladi.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Loader2,
  Maximize,
  Minimize,
  Pause,
  PictureInPicture2,
  Play,
  RotateCcw,
  RotateCw,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SPEEDS = [0.75, 1, 1.25, 1.5, 2] as const;
const SKIP_SECONDS = 10;

/** Boshqaruv paneli harakatsizlikdan keyin shuncha vaqtda yashiriladi. */
const HIDE_CONTROLS_MS = 2600;

interface LessonPlayerProps {
  /** Dars almashganda pleyer to'liq qayta yaratilsin uchun `key` ham shu bo'ladi. */
  src: string;
  title: string;
  /** Saqlangan to'xtash joyi (soniya). 0 bo'lsa boshidan. */
  startAt?: number;
  onProgress?: (position: number, duration: number) => void;
  onEnded?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  autoPlay?: boolean;
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function LessonPlayer({
  src,
  title,
  startAt = 0,
  onProgress,
  onEnded,
  onNext,
  nextLabel,
  autoPlay = false,
}: LessonPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [playing, setPlaying] = useState(false);
  const [waiting, setWaiting] = useState(true);
  const [failed, setFailed] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [speed, setSpeed] = useState<number>(1);
  const [fullscreen, setFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);

  /**
   * `onProgress` ni ref orqali chaqiramiz: u ota komponentda har renderda
   * qayta yaratilishi mumkin va `timeupdate` tinglovchisini bekorga qayta
   * ulab turardi.
   */
  const progressRef = useRef(onProgress);
  progressRef.current = onProgress;
  const endedRef = useRef(onEnded);
  endedRef.current = onEnded;

  const showControls = useCallback(() => {
    setControlsVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      // Pauzada panel doim ko'rinib tursin — foydalanuvchi nimadir qidirayapti.
      if (videoRef.current && !videoRef.current.paused) setControlsVisible(false);
    }, HIDE_CONTROLS_MS);
  }, []);

  useEffect(
    () => () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    },
    [],
  );

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) void video.play().catch(() => setFailed(true));
    else video.pause();
    showControls();
  }, [showControls]);

  const seekBy = useCallback(
    (delta: number) => {
      const video = videoRef.current;
      if (!video || !Number.isFinite(video.duration)) return;
      video.currentTime = Math.min(Math.max(video.currentTime + delta, 0), video.duration);
      showControls();
    },
    [showControls],
  );

  const toggleFullscreen = useCallback(() => {
    const shell = shellRef.current;
    const video = videoRef.current as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null;
    if (!shell) return;

    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => undefined);
      return;
    }
    if (shell.requestFullscreen) {
      void shell.requestFullscreen().catch(() => {
        // iOS Safari konteynerni to'liq ekranga chiqara olmaydi.
        video?.webkitEnterFullscreen?.();
      });
      return;
    }
    video?.webkitEnterFullscreen?.();
  }, []);

  const togglePip = useCallback(() => {
    const video = videoRef.current;
    if (!video || !document.pictureInPictureEnabled) return;
    if (document.pictureInPictureElement) void document.exitPictureInPicture().catch(() => undefined);
    else void video.requestPictureInPicture().catch(() => undefined);
  }, []);

  // Fullscreen holatini brauzer o'zgartirsa ham (Esc) kuzatamiz.
  useEffect(() => {
    const sync = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  /**
   * Klaviatura — faqat pleyer fokusda bo'lganda.
   *
   * Butun oyna bo'ylab tinglash NOTO'G'RI bo'lardi: foydalanuvchi qidiruv
   * maydoniga "f" yozsa, video to'liq ekranga o'tib ketardi.
   */
  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const video = videoRef.current;
      if (!video) return;
      const key = event.key.toLowerCase();

      const handled = () => {
        event.preventDefault();
        event.stopPropagation();
        showControls();
      };

      if (key === " " || key === "k") return handled(), togglePlay();
      if (key === "arrowright") return handled(), seekBy(5);
      if (key === "arrowleft") return handled(), seekBy(-5);
      if (key === "l") return handled(), seekBy(SKIP_SECONDS);
      if (key === "j") return handled(), seekBy(-SKIP_SECONDS);
      if (key === "f") return handled(), toggleFullscreen();
      if (key === "m") {
        handled();
        video.muted = !video.muted;
        return;
      }
      if (key === "arrowup") {
        handled();
        video.volume = Math.min(video.volume + 0.1, 1);
        return;
      }
      if (key === "arrowdown") {
        handled();
        video.volume = Math.max(video.volume - 0.1, 0);
      }
    },
    [seekBy, showControls, togglePlay, toggleFullscreen],
  );

  const progressPercent = duration > 0 ? (current / duration) * 100 : 0;
  const bufferedPercent = duration > 0 ? (buffered / duration) * 100 : 0;

  return (
    <div
      ref={shellRef}
      tabIndex={0}
      role="region"
      aria-label={title}
      onKeyDown={onKeyDown}
      onMouseMove={showControls}
      onMouseLeave={() => {
        if (videoRef.current && !videoRef.current.paused) setControlsVisible(false);
      }}
      className={cn(
        "group relative w-full overflow-hidden bg-black outline-none",
        "focus-visible:ring-2 focus-visible:ring-primary",
        fullscreen ? "h-full rounded-none" : "aspect-video rounded-xl",
      )}
    >
      <video
        ref={videoRef}
        src={src}
        autoPlay={autoPlay}
        playsInline
        preload="metadata"
        controlsList="nodownload"
        className="h-full w-full"
        onClick={togglePlay}
        onLoadedMetadata={(e) => {
          const video = e.currentTarget;
          setDuration(video.duration);
          setVolume(video.volume);
          setMuted(video.muted);
          if (startAt > 0 && startAt < video.duration - 5) video.currentTime = startAt;
          setWaiting(false);
        }}
        onPlay={() => {
          setPlaying(true);
          showControls();
        }}
        onPause={() => {
          setPlaying(false);
          setControlsVisible(true);
        }}
        onWaiting={() => setWaiting(true)}
        onPlaying={() => setWaiting(false)}
        onError={() => {
          setFailed(true);
          setWaiting(false);
        }}
        onTimeUpdate={(e) => {
          const video = e.currentTarget;
          setCurrent(video.currentTime);
          if (video.buffered.length > 0) {
            setBuffered(video.buffered.end(video.buffered.length - 1));
          }
          progressRef.current?.(video.currentTime, video.duration);
        }}
        onVolumeChange={(e) => {
          setVolume(e.currentTarget.volume);
          setMuted(e.currentTarget.muted);
        }}
        onEnded={() => {
          setPlaying(false);
          setControlsVisible(true);
          endedRef.current?.();
        }}
      />

      {/* Yuklanmoqda */}
      {waiting && !failed ? (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <Loader2 className="h-9 w-9 animate-spin text-white/80" aria-hidden="true" />
        </div>
      ) : null}

      {/* Xatolik — jimgina qora ekran qoldirmaymiz */}
      {failed ? (
        <div className="absolute inset-0 grid place-items-center bg-black/85 px-6 text-center">
          <div>
            <p className="text-sm font-semibold text-white">Videoni yuklab bo'lmadi</p>
            <p className="mt-1 text-xs text-white/70">
              Internet aloqasini tekshirib, sahifani yangilang.
            </p>
          </div>
        </div>
      ) : null}

      {/* Markazdagi katta tugma — faqat pauzada */}
      {!playing && !waiting && !failed ? (
        <button
          type="button"
          onClick={togglePlay}
          aria-label="Ijro"
          className="absolute inset-0 grid place-items-center"
        >
          <span className="grid h-16 w-16 place-items-center rounded-full bg-black/55 backdrop-blur-sm transition-transform hover:scale-105">
            <Play className="ml-1 h-7 w-7 fill-white text-white" aria-hidden="true" />
          </span>
        </button>
      ) : null}

      {/* Boshqaruv paneli */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-3 pb-2 pt-8 transition-opacity duration-200 sm:px-4",
          controlsVisible || !playing ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        {/* Vaqt chizig'i */}
        <div className="relative mb-2 h-1.5">
          <div className="absolute inset-0 rounded-full bg-white/25" />
          <div className="absolute inset-y-0 left-0 rounded-full bg-white/35" style={{ width: `${bufferedPercent}%` }} />
          <div className="absolute inset-y-0 left-0 rounded-full bg-cta-green" style={{ width: `${progressPercent}%` }} />
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={current}
            onChange={(e) => {
              const video = videoRef.current;
              if (!video) return;
              video.currentTime = Number(e.target.value);
              setCurrent(Number(e.target.value));
            }}
            aria-label="Video vaqti"
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </div>

        <div className="flex items-center gap-1 text-white sm:gap-1.5">
          <button type="button" onClick={togglePlay} aria-label={playing ? "Pauza" : "Ijro"} className="rounded p-1.5 hover:bg-white/15">
            {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </button>

          <button type="button" onClick={() => seekBy(-SKIP_SECONDS)} aria-label="10 soniya orqaga" className="hidden rounded p-1.5 hover:bg-white/15 sm:block">
            <RotateCcw className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => seekBy(SKIP_SECONDS)} aria-label="10 soniya oldinga" className="hidden rounded p-1.5 hover:bg-white/15 sm:block">
            <RotateCw className="h-4 w-4" />
          </button>

          <div className="group/vol flex items-center">
            <button
              type="button"
              onClick={() => {
                const video = videoRef.current;
                if (video) video.muted = !video.muted;
              }}
              aria-label={muted ? "Ovozni yoqish" : "Ovozni o'chirish"}
              className="rounded p-1.5 hover:bg-white/15"
            >
              {muted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              onChange={(e) => {
                const video = videoRef.current;
                if (!video) return;
                video.volume = Number(e.target.value);
                video.muted = Number(e.target.value) === 0;
              }}
              aria-label="Ovoz balandligi"
              className="h-1 w-0 cursor-pointer accent-white opacity-0 transition-all duration-200 group-hover/vol:ml-1.5 group-hover/vol:w-16 group-hover/vol:opacity-100"
            />
          </div>

          <span className="ml-1 whitespace-nowrap font-mono text-[11px] tabular-nums text-white/85 sm:text-xs">
            {formatTime(current)} / {formatTime(duration)}
          </span>

          <span className="flex-1" />

          {onNext ? (
            <button
              type="button"
              onClick={onNext}
              className="flex items-center gap-1 rounded px-2 py-1.5 text-xs font-semibold hover:bg-white/15"
            >
              <SkipForward className="h-4 w-4" />
              <span className="hidden sm:inline">{nextLabel}</span>
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => {
              const next = SPEEDS[(SPEEDS.indexOf(speed as (typeof SPEEDS)[number]) + 1) % SPEEDS.length];
              setSpeed(next);
              if (videoRef.current) videoRef.current.playbackRate = next;
            }}
            aria-label="Ijro tezligi"
            className="min-w-[2.5rem] rounded px-1.5 py-1.5 font-mono text-xs font-semibold hover:bg-white/15"
          >
            {speed}×
          </button>

          {typeof document !== "undefined" && document.pictureInPictureEnabled ? (
            <button type="button" onClick={togglePip} aria-label="Kichik oynada" className="hidden rounded p-1.5 hover:bg-white/15 md:block">
              <PictureInPicture2 className="h-4 w-4" />
            </button>
          ) : null}

          <button type="button" onClick={toggleFullscreen} aria-label="To'liq ekran" className="rounded p-1.5 hover:bg-white/15">
            {fullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
