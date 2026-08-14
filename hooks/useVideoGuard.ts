"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useYouTubeIframeApi } from "./useYouTubeIframeApi";

interface UseVideoGuardOptions {
  /** ID do vídeo no YouTube (não listado). */
  videoId: string | null;
  /** Margem (segundos) tolerada antes de considerar um salto como tentativa de pular. */
  toleranceSeconds?: number;
}

/** Intervalo (ms) do polling que checa a posição atual do player. */
const POLL_INTERVAL_MS = 1000;

/**
 * Controla um player embutido do YouTube (IFrame Player API) para impedir que o motorista
 * avance o treinamento: guarda o ponto mais distante já assistido (`maxTimeReached`, que só
 * cresce) e, a cada tick do polling, rebobina de volta caso `getCurrentTime()` ultrapasse esse
 * ponto além da tolerância. A IFrame API não expõe um evento nativo de "seeking", então esse
 * bloqueio é feito por polling em vez de reagir a um evento — mais lento que o bloqueio
 * instantâneo usado com um <video> nativo, mas isso já era só uma camada de UX: a barreira de
 * segurança real é o tempo decorrido checado no servidor (ver app/api/treinamento/confirm),
 * que independe do player usado.
 */
export function useVideoGuard({ videoId, toleranceSeconds = 4 }: UseVideoGuardOptions) {
  const apiReady = useYouTubeIframeApi();
  const playerRef = useRef<YT.Player | null>(null);
  const maxTimeReachedRef = useRef(0);
  const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [playerReady, setPlayerReady] = useState(false);

  const containerRef = useCallback((node: HTMLDivElement | null) => {
    setContainerEl(node);
  }, []);

  // Cria o player quando a API, o container e o videoId estiverem prontos; destrói ao trocar.
  useEffect(() => {
    if (!apiReady || !containerEl || !videoId || !window.YT) return;

    setPlayerReady(false);
    setErrorMessage(null);

    // A IFrame API substitui o elemento recebido por um <iframe> próprio — se passássemos
    // containerEl diretamente, o React perderia o nó que ele mesmo criou e gerenciar seu
    // ciclo de vida (ex.: o remount duplo do Strict Mode em dev) quebraria a reconciliação.
    // Por isso criamos aqui um filho fora do controle do React só pra API substituir.
    const mountEl = document.createElement("div");
    containerEl.appendChild(mountEl);

    const player = new window.YT.Player(mountEl, {
      videoId,
      playerVars: {
        controls: 1,
        disablekb: 1,
        modestbranding: 1,
        rel: 0,
        iv_load_policy: 3,
        playsinline: 1,
        origin: window.location.origin,
      },
      events: {
        onReady: () => setPlayerReady(true),
        onStateChange: (event) => {
          if (event.data === window.YT!.PlayerState.ENDED) {
            maxTimeReachedRef.current = player.getDuration();
            setProgress(100);
            setIsCompleted(true);
          }
        },
        onError: () => {
          setErrorMessage("Não foi possível carregar o vídeo. Atualize a página e tente novamente.");
        },
      },
    });
    playerRef.current = player;

    return () => {
      player.destroy();
      playerRef.current = null;
      containerEl.replaceChildren();
    };
  }, [apiReady, containerEl, videoId]);

  // Polling: impede avançar além do ponto máximo já assistido.
  useEffect(() => {
    if (!playerReady) return;
    const interval = setInterval(() => {
      const player = playerRef.current;
      if (!player) return;

      const currentTime = player.getCurrentTime();
      const duration = player.getDuration();

      if (currentTime > maxTimeReachedRef.current) {
        maxTimeReachedRef.current = currentTime;
      } else if (currentTime > maxTimeReachedRef.current + toleranceSeconds) {
        player.seekTo(maxTimeReachedRef.current, true);
      }

      if (duration > 0) {
        setProgress(Math.min(100, (maxTimeReachedRef.current / duration) * 100));
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [playerReady, toleranceSeconds]);

  // Desliga seekforward/seekbackward/seekto do Media Session (notificação, tela de bloqueio,
  // fone bluetooth) — esses controles também poderiam ser usados pra pular à frente.
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

  const getWatchedSeconds = useCallback(() => maxTimeReachedRef.current, []);

  return {
    containerRef,
    progress,
    isCompleted,
    errorMessage,
    getWatchedSeconds,
  };
}
