import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { CertificateDocument } from "@/lib/certificate/CertificateDocument";
import type { Treinamento } from "@/types/treinamento";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const { data: training, error } = await supabase
      .from("treinamentos")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !training) {
      return NextResponse.json({ error: "Treinamento não encontrado." }, { status: 404 });
    }

    const buffer = await renderToBuffer(<CertificateDocument training={training as Treinamento} />);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="termo-${training.matricula}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Erro ao gerar certificado:", error);
    return NextResponse.json({ error: "Erro ao gerar o documento." }, { status: 500 });
  }
}
