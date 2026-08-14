"use client";

import { useEffect, useState } from "react";

const IFRAME_API_SRC = "https://www.youtube.com/iframe_api";

/**
 * Carrega o script global da YouTube IFrame Player API uma única vez (idempotente mesmo
 * com múltiplos componentes montando o hook) e resolve `apiReady` quando `window.YT.Player`
 * fica disponível.
 */
export function useYouTubeIframeApi() {
  const [apiReady, setApiReady] = useState(
    () => typeof window !== "undefined" && Boolean(window.YT?.Player),
  );

  useEffect(() => {
    if (apiReady) return;
    if (typeof window === "undefined") return;

    if (window.YT?.Player) {
      setApiReady(true);
      return;
    }

    const previousHandler = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousHandler?.();
      setApiReady(true);
    };

    if (!document.querySelector(`script[src="${IFRAME_API_SRC}"]`)) {
      const script = document.createElement("script");
      script.src = IFRAME_API_SRC;
      script.async = true;
      document.head.appendChild(script);
    }

    return () => {
      window.onYouTubeIframeAPIReady = previousHandler;
    };
  }, [apiReady]);

  return apiReady;
}
