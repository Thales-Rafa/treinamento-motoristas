import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Client Supabase com a service role key: ignora RLS por completo.
 * Uso exclusivo dentro das API routes de treinamento, após toda a validação
 * anti-fraude — nunca deve ser importado em código que roda no navegador.
 */
export function createServiceRoleClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
