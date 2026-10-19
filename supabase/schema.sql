-- Factify Serverless persistence schema
-- Execute in Supabase SQL Editor for FTY-18.2

create extension if not exists pgcrypto;

create table if not exists public.verifications_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  input_text text not null,
  input_kind text not null default 'text',
  classification text not null,
  confidence integer not null check (confidence >= 0 and confidence <= 100),
  engine text not null default 'local',
  analysis_origin text,
  processing_ms integer,
  providers jsonb not null default '[]'::jsonb,
  result_json jsonb not null
);

create index if not exists idx_verifications_log_created_at
  on public.verifications_log (created_at desc);

create table if not exists public.user_feedback (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  verification_id uuid not null references public.verifications_log(id) on delete cascade,
  vote text not null check (vote in ('helpful', 'not_helpful')),
  comment text
);

create index if not exists idx_user_feedback_verification_id
  on public.user_feedback (verification_id);
