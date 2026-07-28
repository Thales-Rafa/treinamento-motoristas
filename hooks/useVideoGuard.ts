"use client";

import { useCallback, useRef, useState } from "react";

interface UseVideoGuardOptions {
  /** Margem (segundos) tolerada antes de considerar um "seek" como tentativa de pular. */
  toleranceSeconds?: number;
}

/**
 * Controla a reprodução de um <video> nativo para impedir que o motorista avance o
 * treinamento: guarda o ponto mais distante já assistido (`maxTimeReached`, que só
 * cresce) e, a cada evento `seeking`, rebobina de volta caso o novo `currentTime`
 * ultrapasse esse ponto além da tolerância. Isso bloqueia arrastar a barra, atalhos de
 * teclado e alterações de `currentTime` via DevTools — pausar/retroceder continua livre.
 */
export function useVideoGuard({ toleranceSeconds = 0.75 }: UseVideoGuardOptions = {}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const maxTimeReachedRef = useRef(0);
  const [progress, setProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [duration, setDuration] = useState(0);

  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (video) setDuration(video.duration);
  }, []);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.currentTime > maxTimeReachedRef.current) {
      maxTimeReachedRef.current = video.currentTime;
    }
    if (video.duration > 0) {
      setProgress(Math.min(100, (maxTimeReachedRef.current / video.duration) * 100));
    }
  }, []);

  const handleSeeking = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.currentTime > maxTimeReachedRef.current + toleranceSeconds) {
      video.currentTime = maxTimeReachedRef.current;
    }
  }, [toleranceSeconds]);

  const handleEnded = useCallback(() => {
    const video = videoRef.current;
    if (video) maxTimeReachedRef.current = video.duration;
    setIsCompleted(true);
    setProgress(100);
  }, []);

  const getWatchedSeconds = useCallback(() => maxTimeReachedRef.current, []);

  return {
    videoRef,
    progress,
    isCompleted,
    duration,
    getWatchedSeconds,
    handlers: {
      onLoadedMetadata: handleLoadedMetadata,
      onTimeUpdate: handleTimeUpdate,
      onSeeking: handleSeeking,
      onEnded: handleEnded,
    },
  };
}
