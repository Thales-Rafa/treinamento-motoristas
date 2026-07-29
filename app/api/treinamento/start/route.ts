import { NextResponse } from "next/server";
import { driverInfoSchema } from "@/schemas/driverInfo.schema";
import { createTrainingToken, verifyTrainingToken } from "@/lib/token";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { getClientIp, getDeviceInfo } from "@/lib/requestMetadata";
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

    const videoDurationSeconds = Number(process.env.TRAINING_VIDEO_DURATION_SECONDS ?? 0);
    const videoSrc = process.env.NEXT_PUBLIC_TRAINING_VIDEO_SRC ?? "/videos/treinamento.mp4";
    const userAgent = request.headers.get("user-agent") ?? "";
    const { sistemaOperacional, navegador } = getDeviceInfo(userAgent);
    const ip = getClientIp(request);
    const startedAt = new Date().toISOString();

    const supabase = createServiceRoleClient();

    // Só pode existir 1 linha por CPF: reentrar no link nunca cria duplicata.
    const { data: existing, error: queryError } = await supabase
      .from("treinamentos")
      .select("id, status")
      .eq("cpf", cpf)
      .maybeSingle();

    if (queryError) {
      console.error("Erro ao verificar treinamento existente:", queryError);
      return NextResponse.json({ error: "Erro ao verificar duplicidade." }, { status: 500 });
    }

    if (existing?.status === "concluido") {
      return NextResponse.json(
        { error: "Este CPF já concluiu este treinamento." },
        { status: 409 },
      );
    }

    let recordId: string;

    if (existing) {
      // Já tinha uma tentativa em andamento — atualiza em vez de criar outra linha.
      const { data: updated, error: updateError } = await supabase
        .from("treinamentos")
        .update({
          nome,
          matricula,
          started_at: startedAt,
          duracao_video: videoDurationSeconds,
          ip,
          user_agent: userAgent || null,
          sistema_operacional: sistemaOperacional,
          navegador,
        })
        .eq("id", existing.id)
        .select("id")
        .single();

      if (updateError || !updated) {
        console.error("Erro ao atualizar tentativa em andamento:", updateError);
        return NextResponse.json({ error: "Erro ao iniciar o treinamento." }, { status: 500 });
      }
      recordId = updated.id;
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from("treinamentos")
        .insert({
          nome,
          matricula,
          cpf,
          status: "em_andamento",
          video_concluido: false,
          duracao_assistida: 0,
          duracao_video: videoDurationSeconds,
          started_at: startedAt,
          ip,
          user_agent: userAgent || null,
          sistema_operacional: sistemaOperacional,
          navegador,
        })
        .select("id")
        .single();

      if (insertError || !inserted) {
        if (insertError?.code === "23505") {
          return NextResponse.json(
            { error: "Este CPF já concluiu este treinamento." },
            { status: 409 },
          );
        }
        console.error("Erro ao criar tentativa de treinamento:", insertError);
        return NextResponse.json({ error: "Erro ao iniciar o treinamento." }, { status: 500 });
      }
      recordId = inserted.id;
    }

    const token = createTrainingToken({ id: recordId, nome, matricula, cpf });
    const payload = verifyTrainingToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Erro ao iniciar sessão de treinamento." }, { status: 500 });
    }

    const response: StartTrainingResponse = {
      token,
      startedAt: new Date(payload.iat).toISOString(),
      videoSrc,
      videoDurationSeconds,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Erro inesperado em /api/treinamento/start:", error);
    return NextResponse.json({ error: "Erro inesperado. Tente novamente." }, { status: 500 });
  }
}
