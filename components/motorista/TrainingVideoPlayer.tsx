"use client";

import { useState, type RefObject } from "react";
import { Pause, Play, RotateCw, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TrainingVideoPlayerProps {
  src: string;
  videoRef: RefObject<HTMLVideoElement | null>;
  progress: number;
  isCompleted: boolean;
  /** Proporção largura/altura real do vídeo (ex.: 0.46 para um vídeo em retrato). */
  aspectRatio: number | null;
  isStalled: boolean;
  onReload: () => void;
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
  aspectRatio,
  isStalled,
  onReload,
  onLoadedMetadata,
  onTimeUpdate,
  onSeeking,
  onEnded,
}: TrainingVideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

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
    <div className="w-full max-w-3xl mx-auto rounded-xl border bg-card shadow-sm overflow-hidden">
      <div className="flex justify-center bg-black">
        {/*
          A altura é o eixo que manda (limitada à viewport) e a largura é calculada a
          partir da proporção real do vídeo — funciona tanto para vídeo em retrato quanto
          em paisagem, sem esticar nem sobrar barra preta além do necessário.
        */}
        <div
          className="relative"
          style={{
            aspectRatio: aspectRatio ?? 16 / 9,
            height: "min(75vh, 640px)",
            maxWidth: "100%",
            width: "auto",
          }}
        >
          <video
            ref={videoRef}
            src={src}
            className="pointer-events-none h-full w-full object-contain"
            controls={false}
            controlsList="nodownload noremoteplayback nofullscreen"
            disablePictureInPicture
            disableRemotePlayback
            playsInline
            onLoadedMetadata={onLoadedMetadata}
            onTimeUpdate={onTimeUpdate}
            onSeeking={onSeeking}
            onEnded={onEnded}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />

          {/*
            Overlay sempre presente por cima do vídeo: no Android/Chrome, tocar duas
            vezes direto no <video> aciona o gesto nativo de avançar/voltar 10s, que
            depois briga com o nosso bloqueio de avanço. Com o overlay, o toque nunca
            chega ao elemento de vídeo (que fica com pointer-events-none acima).
          */}
          <button
            type="button"
            onClick={togglePlay}
            onDoubleClick={(event) => event.preventDefault()}
            onContextMenu={(event) => event.preventDefault()}
            aria-label={isPlaying ? "Pausar vídeo" : "Reproduzir vídeo"}
            className={cn(
              "absolute inset-0 flex items-center justify-center transition",
              !isPlaying && "bg-black/30 hover:bg-black/40",
            )}
          >
            {!isPlaying && (
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-black shadow-lg">
                <Play className="ml-1 h-7 w-7" fill="currentColor" />
              </span>
            )}
          </button>

          {isStalled && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 p-4 text-center text-white">
              <p className="text-sm">O vídeo travou. Toque para continuar de onde parou.</p>
              <Button
                type="button"
                variant="secondary"
                onClick={(event) => {
                  event.stopPropagation();
                  onReload();
                }}
              >
                <RotateCw className="h-4 w-4" />
                Recarregar vídeo
              </Button>
            </div>
          )}
        </div>
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
