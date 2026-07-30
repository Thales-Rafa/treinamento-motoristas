"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DriverInfoForm } from "@/components/motorista/DriverInfoForm";
import { TrainingVideoPlayer } from "@/components/motorista/TrainingVideoPlayer";
import { ConfirmTrainingDialog } from "@/components/motorista/ConfirmTrainingDialog";
import { useTrainingFlow } from "@/hooks/useTrainingFlow";
import { useVideoGuard } from "@/hooks/useVideoGuard";

export function TrainingFlow() {
  const {
    step,
    videoSrc,
    isSubmittingForm,
    isConfirming,
    trainingCode,
    submitDriverInfo,
    confirmCompletion,
  } = useTrainingFlow();

  const { videoRef, progress, isCompleted, aspectRatio, isStalled, reloadVideo, getWatchedSeconds, handlers } =
    useVideoGuard();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  if (step === "success") {
    return (
      <Card className="w-full max-w-lg text-center">
        <CardHeader className="items-center">
          <CheckCircle2 className="h-14 w-14 text-emerald-500" />
          <CardTitle className="text-2xl">Treinamento concluído!</CardTitle>
          <CardDescription>
            Seu registro foi salvo com sucesso. Obrigado por concluir o treinamento.
          </CardDescription>
        </CardHeader>
        {trainingCode && (
          <CardContent className="flex flex-col items-center gap-2">
            <p className="text-sm text-muted-foreground">Código do treinamento</p>
            <p className="w-full max-w-xs break-all rounded-md bg-muted px-3 py-2 font-mono text-xs">
              {trainingCode}
            </p>
          </CardContent>
        )}
      </Card>
    );
  }

  if (step === "video" && videoSrc) {
    return (
      <div className="flex w-full flex-col items-center gap-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Vídeo de treinamento</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Assista até o final para liberar a confirmação. Pausar é permitido, mas não é
            possível avançar o vídeo.
          </p>
        </div>

        <TrainingVideoPlayer
          src={videoSrc}
          videoRef={videoRef}
          progress={progress}
          isCompleted={isCompleted}
          aspectRatio={aspectRatio}
          isStalled={isStalled}
          onReload={reloadVideo}
          onLoadedMetadata={handlers.onLoadedMetadata}
          onTimeUpdate={handlers.onTimeUpdate}
          onSeeking={handlers.onSeeking}
          onEnded={handlers.onEnded}
        />

        <Button
          size="lg"
          className="w-full max-w-3xl"
          disabled={!isCompleted}
          onClick={() => setIsDialogOpen(true)}
        >
          Confirmar que concluí o treinamento
        </Button>

        <ConfirmTrainingDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          isSubmitting={isConfirming}
          onConfirm={() => confirmCompletion(getWatchedSeconds())}
        />
      </div>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">Treinamento de motoristas</CardTitle>
        <CardDescription>
          Preencha seus dados para liberar o vídeo de treinamento obrigatório.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DriverInfoForm onSubmit={submitDriverInfo} isSubmitting={isSubmittingForm} />
      </CardContent>
    </Card>
  );
}
