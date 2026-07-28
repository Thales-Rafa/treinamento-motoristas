import { NextResponse } from "next/server";
import { UAParser } from "ua-parser-js";
import { confirmTrainingSchema } from "@/schemas/confirmTraining.schema";
import { driverInfoSchema } from "@/schemas/driverInfo.schema";
import { verifyTrainingToken } from "@/lib/token";
import { createServiceRoleClient } from "@/lib/supabase/service";
import type { ConfirmTrainingResponse } from "@/types/treinamento";

// Margem de tolerância (segundos) para variações de rede/precisão do player.
const TOLERANCE_SECONDS = 5;

function getClientIp(request: Request): string | null {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() ?? null;
  return request.headers.get("x-real-ip");
}

export async function POST(request: Request) {
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
  const { nome, matricula, cpf } = driverInfo.data;

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

  const { data: existing } = await supabase
    .from("treinamentos")
    .select("id")
    .eq("cpf", cpf)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "Este CPF já concluiu este treinamento." },
      { status: 409 },
    );
  }

  const userAgent = request.headers.get("user-agent") ?? "";
  const { os, browser } = UAParser(userAgent);
  const ip = getClientIp(request);

  const { data: inserted, error: insertError } = await supabase
    .from("treinamentos")
    .insert({
      nome,
      matricula,
      cpf,
      status: "concluido",
      video_concluido: true,
      duracao_assistida: Math.round(duracaoAssistida),
      duracao_video: videoDurationSeconds,
      started_at: new Date(tokenPayload.iat).toISOString(),
      ended_at: new Date().toISOString(),
      tempo_total_pagina: Math.round(tempoTotalPagina),
      ip,
      user_agent: userAgent || null,
      sistema_operacional: os.name ? `${os.name} ${os.version ?? ""}`.trim() : null,
      navegador: browser.name ? `${browser.name} ${browser.version ?? ""}`.trim() : null,
    })
    .select("id, created_at")
    .single();

  if (insertError) {
    // Corrida entre a checagem de duplicidade e o insert: o índice único no banco garante
    // consistência mesmo se duas requisições chegarem ao mesmo tempo.
    if (insertError.code === "23505") {
      return NextResponse.json(
        { error: "Este CPF já concluiu este treinamento." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: "Erro ao registrar o treinamento." }, { status: 500 });
  }

  const response: ConfirmTrainingResponse = {
    id: inserted.id,
    createdAt: inserted.created_at,
  };

  return NextResponse.json(response, { status: 201 });
}
