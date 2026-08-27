import { createClient } from "@/lib/supabase/client";
import { onlyDigits } from "@/lib/validators/cpf";
import type { Treinamento, TreinamentoStatus } from "@/types/treinamento";

export interface TrainingsQueryParams {
  status: TreinamentoStatus;
  search: string;
  dateFrom: string | null;
  dateTo: string | null;
  dateColumn: keyof Treinamento;
  sortColumn: keyof Treinamento;
  sortAscending: boolean;
}

// Sem paginação: a lista inteira é carregada de uma vez (facilita selecionar todos).
// Esse teto é só uma proteção contra uma consulta acidentalmente gigante.
const MAX_ROWS = 5000;

function buildFilteredQuery(
  supabase: ReturnType<typeof createClient>,
  { status, search, dateFrom, dateTo, dateColumn, sortColumn, sortAscending }: TrainingsQueryParams,
) {
  let query = supabase.from("treinamentos").select("*").eq("status", status);

  const term = search.trim().replace(/[,()]/g, "");
  if (term) {
    const cpfDigits = onlyDigits(term);
    const orParts = [`nome.ilike.%${term}%`, `matricula.ilike.%${term}%`];
    if (cpfDigits) orParts.push(`cpf.ilike.%${cpfDigits}%`);
    query = query.or(orParts.join(","));
  }

  if (dateFrom) query = query.gte(dateColumn, new Date(`${dateFrom}T00:00:00`).toISOString());
  if (dateTo) query = query.lte(dateColumn, new Date(`${dateTo}T23:59:59.999`).toISOString());


  return query.order(sortColumn, { ascending: sortAscending }).range(0, MAX_ROWS - 1);
}

/** Busca todos os registros que casam com o filtro atual (lista e exportação usam a mesma). */
export async function fetchTrainings(params: TrainingsQueryParams): Promise<Treinamento[]> {
  const supabase = createClient();
  const { data, error } = await buildFilteredQuery(supabase, params);
  if (error) throw new Error(error.message);
  return (data ?? []) as Treinamento[];
}
