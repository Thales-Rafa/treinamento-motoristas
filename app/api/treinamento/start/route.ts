import { NextResponse } from "next/server";
import { driverInfoSchema } from "@/schemas/driverInfo.schema";
import { createTrainingToken, verifyTrainingToken } from "@/lib/token";
import { createServiceRoleClient } from "@/lib/supabase/service";
import type { StartTrainingResponse } from "@/types/treinamento";

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
    }

    const parsed = driverInfoSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
        { status: 400 },
      );
    }

    const { nome, matricula, cpf } = parsed.data;

    const supabase = createServiceRoleClient();
    const { data: existing, error: queryError } = await supabase
      .from("treinamentos")
      .select("id")
      .eq("cpf", cpf)
      .maybeSingle();

    if (queryError) {
      console.error("Erro ao verificar duplicidade de CPF:", queryError);
      return NextResponse.json({ error: "Erro ao verificar duplicidade." }, { status: 500 });
    }

    if (existing) {
      return NextResponse.json(
        { error: "Este CPF já concluiu este treinamento." },
        { status: 409 },
      );
    }

    const token = createTrainingToken({ nome, matricula, cpf });
    const payload = verifyTrainingToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Erro ao iniciar sessão de treinamento." }, { status: 500 });
    }

    const videoDurationSeconds = Number(process.env.TRAINING_VIDEO_DURATION_SECONDS ?? 0);
    const videoSrc = process.env.NEXT_PUBLIC_TRAINING_VIDEO_SRC ?? "/videos/treinamento.mp4";

    const response: StartTrainingResponse = {
      token,
      startedAt: new Date(payload.iat).toISOString(),
      videoSrc,
      videoDurationSeconds,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    // Nunca deixa a função quebrar sem responder JSON (ex.: variável de ambiente
    // faltando em produção) — sempre volta um erro tratável para o cliente.
    console.error("Erro inesperado em /api/treinamento/start:", error);
    return NextResponse.json({ error: "Erro inesperado. Tente novamente." }, { status: 500 });
  }
}
