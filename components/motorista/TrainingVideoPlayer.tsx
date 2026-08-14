"use client";

import { cn } from "@/lib/utils";

interface TrainingVideoPlayerProps {
  containerRef: (node: HTMLDivElement | null) => void;
  progress: number;
  isCompleted: boolean;
  errorMessage: string | null;
}

// Proporção largura/altura do vídeo (ex.: "9/16" para vídeo em retrato, "16/9" para
// paisagem). Configurável porque o vídeo do YouTube pode não ser paisagem (ex.: Shorts).
const VIDEO_ASPECT_RATIO = process.env.NEXT_PUBLIC_TRAINING_VIDEO_ASPECT_RATIO || "16/9";

export function TrainingVideoPlayer({
  containerRef,
  progress,
  isCompleted,
  errorMessage,
}: TrainingVideoPlayerProps) {
  return (
    <div className="w-full max-w-3xl mx-auto rounded-xl border bg-card shadow-sm overflow-hidden">
      <div className="flex justify-center bg-black">
        {/*
          A altura é o eixo que manda (limitada à viewport) e a largura é calculada a
          partir de VIDEO_ASPECT_RATIO — funciona tanto para vídeo em retrato (ex.: Shorts)
          quanto em paisagem, sem esticar nem sobrar barra preta além do necessário.
        */}
        <div
          className="relative"
          style={{
            aspectRatio: VIDEO_ASPECT_RATIO,
            height: "min(75vh, 640px)",
            maxWidth: "100%",
            width: "auto",
          }}
        >
          <div ref={containerRef} className="absolute inset-0 h-full w-full" />

          {errorMessage && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 p-4 text-center text-white">
              <p className="text-sm">{errorMessage}</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 border-t bg-card px-4 py-3">
        {/* Barra somente visual: reflete o ponto máximo já assistido, não é possível pular. */}
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
      </div>
    </div>
  );
}
