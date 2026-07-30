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
 *
 * A tolerância é generosa (poucos segundos) de propósito: em celulares com conexão
 * instável o próprio navegador reajusta o `currentTime` sozinho ao rebufferizar, e uma
 * tolerância apertada demais fazia essa correção brigar com o navegador e travar o vídeo
 * em alguns aparelhos. A correção também é adiada com `requestAnimationFrame` (em vez de
 * mexer no `currentTime` dentro do próprio evento `seeking`), o que é mais estável entre
 * navegadores mobile.
 */
export function useVideoGuard({ toleranceSeconds = 4 }: UseVideoGuardOptions = {}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const maxTimeReachedRef = useRef(0);
  const lastCorrectionAtRef = useRef(0);
  const [progress, setProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);

  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    setDuration(video.duration);
    if (video.videoWidth > 0 && video.videoHeight > 0) {
      setAspectRatio(video.videoWidth / video.videoHeight);
    }
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
    // Evita brigar com o navegador enquanto ele ainda está carregando/rebufferizando.
    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;

    const now = Date.now();
    if (now - lastCorrectionAtRef.current < 500) return;

    if (video.currentTime > maxTimeReachedRef.current + toleranceSeconds) {
      lastCorrectionAtRef.current = now;
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.currentTime = maxTimeReachedRef.current;
        }
      });
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
    aspectRatio,
    getWatchedSeconds,
    handlers: {
      onLoadedMetadata: handleLoadedMetadata,
      onTimeUpdate: handleTimeUpdate,
      onSeeking: handleSeeking,
      onEnded: handleEnded,
    },
  };
}
