import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import JSZip from "jszip";
import { createClient } from "@/lib/supabase/server";
import { CertificateDocument } from "@/lib/certificate/CertificateDocument";
import type { Treinamento } from "@/types/treinamento";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_IDS = 100;

function sanitizeFileNamePart(value: string): string {
  return value.replace(/[^A-Za-z0-9-]+/g, "_");
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json().catch(() => null);
    const ids = (body as { ids?: unknown } | null)?.ids;

    if (!Array.isArray(ids) || ids.length === 0 || !ids.every((id) => typeof id === "string")) {
      return NextResponse.json({ error: "Selecione ao menos um treinamento." }, { status: 400 });
    }
    if (ids.length > MAX_IDS) {
      return NextResponse.json(
        { error: `Selecione no máximo ${MAX_IDS} registros por vez.` },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const { data: trainings, error } = await supabase
      .from("treinamentos")
      .select("*")
      .in("id", ids)
      .eq("status", "concluido");

    if (error || !trainings || trainings.length === 0) {
      return NextResponse.json(
        { error: "Nenhum treinamento concluído encontrado para os itens selecionados." },
        { status: 404 },
      );
    }

    const zip = new JSZip();
    for (const training of trainings as Treinamento[]) {
      const buffer = await renderToBuffer(<CertificateDocument training={training} />);
      const fileName = `termo-${sanitizeFileNamePart(training.matricula)}-${sanitizeFileNamePart(training.nome)}.pdf`;
      zip.file(fileName, buffer);
    }

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

    return new NextResponse(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="termos-treinamento.zip"',
      },
    });
  } catch (error) {
    console.error("Erro ao gerar certificados em lote:", error);
    return NextResponse.json({ error: "Erro ao gerar os documentos." }, { status: 500 });
  }
}
