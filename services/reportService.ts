import { createClient } from "@/lib/supabase/client";
import { onlyDigits } from "@/lib/validators/cpf";
import type { Treinamento } from "@/types/treinamento";

export interface TrainingsQueryParams {
  search: string;
  dateFrom: string | null;
  dateTo: string | null;
  sortColumn: keyof Treinamento;
  sortAscending: boolean;
}

export interface TrainingsQueryResult {
  data: Treinamento[];
  count: number;
}

function buildFilteredQuery(
  supabase: ReturnType<typeof createClient>,
  { search, dateFrom, dateTo, sortColumn, sortAscending }: TrainingsQueryParams,
  countExact: boolean,
) {
  let query = supabase
    .from("treinamentos")
    .select("*", countExact ? { count: "exact" } : undefined);

  const term = search.trim().replace(/[,()]/g, "");
  if (term) {
    const cpfDigits = onlyDigits(term);
    const orParts = [`nome.ilike.%${term}%`, `matricula.ilike.%${term}%`];
    if (cpfDigits) orParts.push(`cpf.ilike.%${cpfDigits}%`);
    query = query.or(orParts.join(","));
  }

  if (dateFrom) query = query.gte("created_at", `${dateFrom}T00:00:00`);
  if (dateTo) query = query.lte("created_at", `${dateTo}T23:59:59`);

  return query.order(sortColumn, { ascending: sortAscending });
}

export async function fetchTrainings(
  params: TrainingsQueryParams & { page: number; pageSize: number },
): Promise<TrainingsQueryResult> {
  const supabase = createClient();
  const { page, pageSize } = params;
  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data, count, error } = await buildFilteredQuery(supabase, params, true).range(from, to);
  if (error) throw new Error(error.message);

  return { data: (data ?? []) as Treinamento[], count: count ?? 0 };
}

/** Busca todos os registros que casam com o filtro atual (para exportação). */
export async function fetchAllMatchingTrainings(
  params: TrainingsQueryParams,
): Promise<Treinamento[]> {
  const supabase = createClient();
  const { data, error } = await buildFilteredQuery(supabase, params, false).range(0, 9999);
  if (error) throw new Error(error.message);
  return (data ?? []) as Treinamento[];
}
