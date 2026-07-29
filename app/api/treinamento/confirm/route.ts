import { NextResponse } from "next/server";
import { confirmTrainingSchema } from "@/schemas/confirmTraining.schema";
import { driverInfoSchema } from "@/schemas/driverInfo.schema";
import { verifyTrainingToken } from "@/lib/token";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { getClientIp, getDeviceInfo } from "@/lib/requestMetadata";
import type { ConfirmTrainingResponse } from "@/types/treinamento";

// Margem de tolerância (segundos) para variações de rede/precisão do player.
const TOLERANCE_SECONDS = 5;

export async function POST(request: Request) {
  try {
    return await handleConfirm(request);
  } catch (error) {
    // Nunca deixa a função quebrar sem responder JSON (ex.: variável de ambiente
    // faltando em produção) — sempre volta um erro tratável para o cliente.
    console.error("Erro inesperado em /api/treinamento/confirm:", error);
    return NextResponse.json({ error: "Erro inesperado. Tente novamente." }, { status: 500 });
  }
}

async function handleConfirm(request: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const parsed = confirmTrainingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  }

  const { token, duracaoAssistida, tempoTotalPagina } = parsed.data;

  // 1. Token precisa ter sido emitido pelo servidor (assinatura HMAC válida) e não expirado.
  const tokenPayload = verifyTrainingToken(token);
  if (!tokenPayload) {
    return NextResponse.json(
      { error: "Sessão de treinamento inválida ou expirada. Recarregue a página e assista ao vídeo novamente." },
      { status: 401 },
    );
  }

  // 2. Os dados carregados no token nunca são confiados sem revalidação de formato.
  const driverInfo = driverInfoSchema.safeParse({
    nome: tokenPayload.nome,
    matricula: tokenPayload.matricula,
    cpf: tokenPayload.cpf,
  });
  if (!driverInfo.success) {
    return NextResponse.json({ error: "Dados da sessão inválidos." }, { status: 400 });
  }
  const { cpf } = driverInfo.data;

  const videoDurationSeconds = Number(process.env.TRAINING_VIDEO_DURATION_SECONDS ?? 0);

  // 3. Checagem central anti-fraude: o relógio do servidor não pode ser manipulado pelo
  // cliente, então o tempo decorrido desde a emissão do token é a prova real de que o
  // vídeo não poderia ter sido concluído mais rápido do que a duração informada.
  const elapsedSeconds = (Date.now() - tokenPayload.iat) / 1000;
  if (elapsedSeconds < videoDurationSeconds - TOLERANCE_SECONDS) {
    return NextResponse.json(
      { error: "Tempo insuficiente para concluir o treinamento." },
      { status: 400 },
    );
  }

  // 4. Defesa em profundidade sobre o valor reportado pelo cliente (spoofável, mas ainda
  // assim verificado — a barreira real é a checagem de tempo decorrido acima).
  if (duracaoAssistida < videoDurationSeconds - TOLERANCE_SECONDS) {
    return NextResponse.json(
      { error: "O vídeo não foi assistido até o final." },
      { status: 400 },
    );
  }

  const supabase = createServiceRoleClient();
  const userAgent = request.headers.get("user-agent") ?? "";
  const { sistemaOperacional, navegador } = getDeviceInfo(userAgent);
  const ip = getClientIp(request);

  // Atualiza a MESMA linha criada em /start (por id, vindo do token) — nunca insere uma
  // nova. A condição `status = em_andamento` garante atomicidade: se a linha já tiver
  // sido concluída por outra requisição (ex.: duas abas), 0 linhas são afetadas aqui.
  const { data: updated, error: updateError } = await supabase
    .from("treinamentos")
    .update({
      status: "concluido",
      video_concluido: true,
      duracao_assistida: Math.round(duracaoAssistida),
      duracao_video: videoDurationSeconds,
      ended_at: new Date().toISOString(),
      tempo_total_pagina: Math.round(tempoTotalPagina),
      ip,
      user_agent: userAgent || null,
      sistema_operacional: sistemaOperacional,
      navegador,
    })
    .eq("id", tokenPayload.id)
    .eq("cpf", cpf)
    .eq("status", "em_andamento")
    .select("id, ended_at")
    .maybeSingle();

  if (updateError) {
    if (updateError.code === "23505") {
      return NextResponse.json(
        { error: "Este CPF já concluiu este treinamento." },
        { status: 409 },
      );
    }
    console.error("Erro ao registrar conclusão do treinamento:", updateError);
    return NextResponse.json({ error: "Erro ao registrar o treinamento." }, { status: 500 });
  }

  if (!updated) {
    // Sessão não encontrada mais como "em andamento" — ou já foi concluída antes,
    // ou o registro não existe (token muito antigo/corrompido).
    return NextResponse.json(
      { error: "Este CPF já concluiu este treinamento." },
      { status: 409 },
    );
  }

  const response: ConfirmTrainingResponse = {
    id: updated.id,
    createdAt: updated.ended_at,
  };

  return NextResponse.json(response, { status: 201 });
}
