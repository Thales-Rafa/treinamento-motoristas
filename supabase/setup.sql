-- Sistema de Treinamento de Motoristas — setup completo do banco.
-- Rode este script inteiro no SQL Editor do seu projeto Supabase (Database > SQL Editor).

create extension if not exists "pgcrypto";

create table if not exists public.treinamentos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  matricula text not null,
  cpf text not null,
  status text not null default 'em_andamento' check (status in ('em_andamento', 'concluido')),
  video_concluido boolean not null default false,
  duracao_assistida integer not null default 0,
  duracao_video integer not null,
  started_at timestamptz not null,
  ended_at timestamptz,
  tempo_total_pagina integer,
  ip text,
  user_agent text,
  sistema_operacional text,
  navegador text,
  created_at timestamptz not null default now()
);

-- No máximo 1 linha por CPF: reentrar no link atualiza a mesma linha (status
-- 'em_andamento') em vez de criar outra, e uma vez 'concluido' não pode ser refeito.
create unique index if not exists treinamentos_cpf_key on public.treinamentos (cpf);

create index if not exists treinamentos_created_at_idx on public.treinamentos (created_at desc);

alter table public.treinamentos enable row level security;

-- Nenhuma policy de INSERT/UPDATE/DELETE é criada para `anon`/`authenticated`:
-- a única forma de gravar é através da API route do servidor, que usa a
-- service role key (bypassa RLS) somente depois de validar tudo no backend.

-- Apenas usuários autenticados (administradores logados via Supabase Auth)
-- podem ler os registros — usado pelo relatório em /admin.
create policy "Admins autenticados podem ler treinamentos"
  on public.treinamentos
  for select
  to authenticated
  using (true);

-- Para criar o primeiro usuário administrador:
-- Supabase Dashboard > Authentication > Users > Add user (defina e-mail e senha).
