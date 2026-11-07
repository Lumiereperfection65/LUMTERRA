-- LUMTERRA — schéma Supabase. À exécuter dans : Supabase > SQL Editor.
create extension if not exists "pgcrypto";

-- 1) Profils utilisateurs (liés à auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2) Signalements
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  category text not null,
  description text not null default '',
  latitude double precision not null,
  longitude double precision not null,
  photo_url text,
  status text not null default 'pending' check (status in ('pending','in_progress','resolved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists reports_user_idx on public.reports (user_id, created_at desc);
create index if not exists reports_status_idx on public.reports (status);

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists reports_touch on public.reports;
create trigger reports_touch before update on public.reports
  for each row execute function public.touch_updated_at();

-- 3) Row Level Security
alter table public.profiles enable row level security;
alter table public.reports  enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select to authenticated using (id = auth.uid());
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- Tous les utilisateurs connectés voient les signalements (carte collective)
drop policy if exists "reports_select_all" on public.reports;
create policy "reports_select_all" on public.reports for select to authenticated using (true);
drop policy if exists "reports_insert_own" on public.reports;
create policy "reports_insert_own" on public.reports for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "reports_update_own" on public.reports;
create policy "reports_update_own" on public.reports for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "reports_delete_own" on public.reports;
create policy "reports_delete_own" on public.reports for delete to authenticated using (user_id = auth.uid());

-- 4) Stockage des photos (bucket public en lecture, écriture dans son propre dossier)
insert into storage.buckets (id, name, public) values ('report-photos', 'report-photos', true)
on conflict (id) do nothing;

drop policy if exists "photos_read" on storage.objects;
create policy "photos_read" on storage.objects for select using (bucket_id = 'report-photos');
drop policy if exists "photos_insert_own_folder" on storage.objects;
create policy "photos_insert_own_folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'report-photos' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "photos_delete_own_folder" on storage.objects;
create policy "photos_delete_own_folder" on storage.objects for delete to authenticated
  using (bucket_id = 'report-photos' and (storage.foldername(name))[1] = auth.uid()::text);
