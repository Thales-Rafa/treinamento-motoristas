"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import type { DriverInfoInput } from "@/schemas/driverInfo.schema";
import { confirmTraining, startTraining } from "@/services/treinamentoService";

export type TrainingStep = "form" | "video" | "success";

export function useTrainingFlow() {
  const [step, setStep] = useState<TrainingStep>("form");
  const [token, setToken] = useState<string | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [videoDurationSeconds, setVideoDurationSeconds] = useState(0);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [trainingCode, setTrainingCode] = useState<string | null>(null);

  const pageLoadedAtRef = useRef(Date.now());

  const submitDriverInfo = useCallback(async (values: DriverInfoInput) => {
    setIsSubmittingForm(true);
    try {
      const response = await startTraining(values);
      setToken(response.token);
      setVideoId(response.videoId);
      setVideoDurationSeconds(response.videoDurationSeconds);
      setStep("video");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao iniciar o treinamento.");
    } finally {
      setIsSubmittingForm(false);
    }
  }, []);

  const confirmCompletion = useCallback(
    async (watchedSeconds: number) => {
      if (!token) return;
      setIsConfirming(true);
      try {
        const tempoTotalPagina = Math.round((Date.now() - pageLoadedAtRef.current) / 1000);
        const response = await confirmTraining({
          token,
          duracaoAssistida: Math.round(watchedSeconds),
          tempoTotalPagina,
        });
        setTrainingCode(response.id);
        setStep("success");
        toast.success("Treinamento concluído com sucesso!");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro ao confirmar o treinamento.");
      } finally {
        setIsConfirming(false);
      }
    },
    [token],
  );

  return {
    step,
    videoId,
    videoDurationSeconds,
    isSubmittingForm,
    isConfirming,
    trainingCode,
    submitDriverInfo,
    confirmCompletion,
  };
}
