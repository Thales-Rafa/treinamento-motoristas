"use client";

import { useRef, useState, type RefObject } from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TrainingVideoPlayerProps {
  src: string;
  videoRef: RefObject<HTMLVideoElement | null>;
  progress: number;
  isCompleted: boolean;
  onLoadedMetadata: () => void;
  onTimeUpdate: () => void;
  onSeeking: () => void;
  onEnded: () => void;
}

export function TrainingVideoPlayer({
  src,
  videoRef,
  progress,
  isCompleted,
  onLoadedMetadata,
  onTimeUpdate,
  onSeeking,
  onEnded,
}: TrainingVideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  return (
    <div
      ref={containerRef}
      className="w-full max-w-3xl mx-auto rounded-xl border bg-card shadow-sm overflow-hidden"
    >
      <div className="relative aspect-video bg-black">
        <video
          ref={videoRef}
          src={src}
          className="h-full w-full"
          controls={false}
          controlsList="nodownload noremoteplayback nofullscreen"
          disablePictureInPicture
          disableRemotePlayback
          playsInline
          onContextMenu={(event) => event.preventDefault()}
          onLoadedMetadata={onLoadedMetadata}
          onTimeUpdate={onTimeUpdate}
          onSeeking={onSeeking}
          onEnded={onEnded}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onClick={togglePlay}
        />

        {!isPlaying && (
          <button
            type="button"
            onClick={togglePlay}
            aria-label="Reproduzir vídeo"
            className="absolute inset-0 flex items-center justify-center bg-black/30 transition hover:bg-black/40"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-black shadow-lg">
              <Play className="ml-1 h-7 w-7" fill="currentColor" />
            </span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-3 border-t bg-card px-4 py-3">
        <Button type="button" variant="ghost" size="icon" onClick={togglePlay} aria-label={isPlaying ? "Pausar" : "Reproduzir"}>
          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </Button>

        {/* Barra somente visual: sem onClick/onMouseDown, não é possível arrastar para pular. */}
        <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full bg-primary transition-[width] duration-150",
              isCompleted && "bg-emerald-500",
            )}
            style={{ width: `${progress}%` }}
          />
        </div>

        <span className="w-12 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
          {Math.round(progress)}%
        </span>

        <Button type="button" variant="ghost" size="icon" onClick={toggleMute} aria-label={isMuted ? "Ativar som" : "Silenciar"}>
          {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </Button>
      </div>
    </div>
  );
}
