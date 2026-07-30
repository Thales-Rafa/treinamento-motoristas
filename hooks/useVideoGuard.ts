"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseVideoGuardOptions {
  /** Margem (segundos) tolerada antes de considerar um "seek" como tentativa de pular. */
  toleranceSeconds?: number;
}

/** Tempo (ms) sem progresso após um "waiting" para considerar o vídeo travado de verdade. */
const STALL_TIMEOUT_MS = 8000;

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
 *
 * Além disso, o hook desativa os atalhos de avanço/retrocesso do próprio sistema (gesto
 * de tocar duas vezes no Chrome Android e os controles de mídia da notificação/tela de
 * bloqueio) — sem isso, esses gestos nativos disparavam o mesmo "seeking" que o nosso
 * bloqueio revertia, e a briga entre os dois é a causa mais provável de o vídeo travar em
 * alguns aparelhos. Como rede de segurança final, se o vídeo ficar "preso" (evento
 * `waiting` sem recuperar) por tempo demais, `isStalled` fica true e `reloadVideo` permite
 * recarregar sem perder o progresso já assistido.
 */
export function useVideoGuard({ toleranceSeconds = 4 }: UseVideoGuardOptions = {}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const maxTimeReachedRef = useRef(0);
  const lastCorrectionAtRef = useRef(0);
  const [progress, setProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const [isStalled, setIsStalled] = useState(false);

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

  // Desliga seekforward/seekbackward/seekto do Media Session (notificação, tela de
  // bloqueio, fone bluetooth) — essas ações também disparam "seeking" no vídeo.
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    const noop = () => {};
    const actions = ["seekbackward", "seekforward", "seekto"] as const;
    actions.forEach((action) => {
      try {
        navigator.mediaSession.setActionHandler(action, noop);
      } catch {
        // Navegador não suporta essa ação específica — ignora.
      }
    });
    return () => {
      actions.forEach((action) => {
        try {
          navigator.mediaSession.setActionHandler(action, null);
        } catch {
          // ignora
        }
      });
    };
  }, []);

  // Detecta travamento real (evento "waiting" sem recuperação) para oferecer um jeito de
  // recarregar em vez de deixar o motorista preso sem nenhuma saída.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let stallTimer: ReturnType<typeof setTimeout> | null = null;
    const clearStallTimer = () => {
      if (stallTimer) {
        clearTimeout(stallTimer);
        stallTimer = null;
      }
    };
    const handleWaiting = () => {
      clearStallTimer();
      stallTimer = setTimeout(() => setIsStalled(true), STALL_TIMEOUT_MS);
    };
    const handleRecovered = () => {
      clearStallTimer();
      setIsStalled(false);
    };

    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("playing", handleRecovered);
    video.addEventListener("canplay", handleRecovered);
    video.addEventListener("timeupdate", handleRecovered);

    return () => {
      clearStallTimer();
      video.removeEventListener("waiting", handleWaiting);
      video.removeEventListener("playing", handleRecovered);
      video.removeEventListener("canplay", handleRecovered);
      video.removeEventListener("timeupdate", handleRecovered);
    };
  }, []);

  const reloadVideo = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const resumeAt = maxTimeReachedRef.current;
    setIsStalled(false);
    const handleReady = () => {
      video.currentTime = resumeAt;
      video.play().catch(() => {});
      video.removeEventListener("loadedmetadata", handleReady);
    };
    video.addEventListener("loadedmetadata", handleReady);
    video.load();
  }, []);

  return {
    videoRef,
    progress,
    isCompleted,
    duration,
    aspectRatio,
    isStalled,
    reloadVideo,
    getWatchedSeconds,
    handlers: {
      onLoadedMetadata: handleLoadedMetadata,
      onTimeUpdate: handleTimeUpdate,
      onSeeking: handleSeeking,
      onEnded: handleEnded,
    },
  };
}
