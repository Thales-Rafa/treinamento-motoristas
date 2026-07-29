-- Migração: rastrear motoristas que iniciaram o treinamento mas não concluíram.
-- Rode este script no SQL Editor do Supabase (projeto já em produção).
--
-- Antes: só existia 1 status ('concluido') e só gravávamos uma linha na confirmação.
-- Depois: gravamos a linha já no início (status 'em_andamento') e ela é atualizada
-- para 'concluido' quando o motorista termina de verdade. Continua existindo no máximo
-- 1 linha por CPF (o índice único não muda), então reentrar no link nunca duplica.

alter table public.treinamentos
  drop constraint if exists treinamentos_status_check;

alter table public.treinamentos
  add constraint treinamentos_status_check check (status in ('em_andamento', 'concluido'));

alter table public.treinamentos
  alter column status set default 'em_andamento';

alter table public.treinamentos
  alter column ended_at drop not null;

alter table public.treinamentos
  alter column ended_at drop default;

alter table public.treinamentos
  alter column duracao_assistida set default 0;

alter table public.treinamentos
  alter column video_concluido set default false;
