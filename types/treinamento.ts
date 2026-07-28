export type TreinamentoStatus = "concluido";

/** Linha da tabela `treinamentos` no Supabase. */
export interface Treinamento {
  id: string;
  nome: string;
  matricula: string;
  cpf: string;
  status: TreinamentoStatus;
  video_concluido: boolean;
  duracao_assistida: number;
  duracao_video: number;
  started_at: string;
  ended_at: string;
  tempo_total_pagina: number | null;
  ip: string | null;
  user_agent: string | null;
  sistema_operacional: string | null;
  navegador: string | null;
  created_at: string;
}

export interface StartTrainingResponse {
  token: string;
  startedAt: string;
  videoSrc: string;
  videoDurationSeconds: number;
}

export interface ConfirmTrainingResponse {
  id: string;
  createdAt: string;
}

export interface ApiErrorResponse {
  error: string;
}
