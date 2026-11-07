-- LUMTERRA - Schéma de base de données PostgreSQL (Supabase)
-- "Signalez. Suivez. Améliorez votre territoire."

-- 1. Extensions
create extension if not exists "pgcrypto";
create extension if not exists "postgis";

-- 2. Énumérations
do $$ begin
  create type public.user_role as enum ('CITOYEN', 'AGENT', 'ADMIN');
exception when duplicate_object then null;
end $$;
do $$ begin
  create type public.report_status as enum ('PENDING', 'VALIDATED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED');
exception when duplicate_object then null;
end $$;
do $$ begin
  create type public.report_severity as enum ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
exception when duplicate_object then null;
end $$;

-- 3. Profils utilisateurs
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  phone text,
  role user_role not null default 'CITOYEN',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. Catégories de signalement
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  icon_name text, -- Nom de l'icône Lucide
  color_hex text,
  created_at timestamptz not null default now()
);

-- 5. Zones territoriales (Quartiers/Villes)
create table if not exists public.territorial_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null, -- 'QUARTIER', 'VILLE', 'COMMUNE'
  parent_id uuid references public.territorial_zones(id),
  geometry geometry(Polygon, 4326),
  created_at timestamptz not null default now()
);

-- 6. Signalements
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  category_id uuid not null references public.categories(id),
  zone_id uuid references public.territorial_zones(id),
  title text not null,
  description text not null,
  latitude double precision not null,
  longitude double precision not null,
  address text,
  status report_status not null default 'PENDING',
  severity report_severity not null default 'LOW',
  ai_analysis jsonb default '{}', -- Stockage des résultats de l'IA
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 7. Images des signalements
create table if not exists public.report_images (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  storage_path text not null,
  url text not null,
  is_primary boolean default false,
  created_at timestamptz not null default now()
);

-- 8. Historique des signalements (Audit Log)
create table if not exists public.report_history (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  user_id uuid references public.profiles(id),
  previous_status report_status,
  new_status report_status,
  comment text,
  created_at timestamptz not null default now()
);

-- 9. Interventions
create table if not exists public.interventions (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  agent_id uuid not null references public.profiles(id),
  description text,
  proof_url text, -- Photo après intervention
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 10. Notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null, -- 'STATUS_CHANGE', 'ASSIGNMENT', 'SYSTEM'
  read_at timestamptz,
  related_report_id uuid references public.reports(id),
  created_at timestamptz not null default now()
);

-- --- Fonctions et Triggers ---

-- Mise à jour automatique de updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists reports_updated_at on public.reports;
create trigger reports_updated_at before update on public.reports for each row execute function public.handle_updated_at();
drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles for each row execute function public.handle_updated_at();
drop trigger if exists interventions_updated_at on public.interventions;
create trigger interventions_updated_at before update on public.interventions for each row execute function public.handle_updated_at();

create or replace function public.log_report_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.report_history (report_id, user_id, new_status)
    values (new.id, (select auth.uid()), new.status);
  elsif new.status is distinct from old.status then
    insert into public.report_history (report_id, user_id, previous_status, new_status)
    values (new.id, (select auth.uid()), old.status, new.status);
  end if;
  return new;
end;
$$;

drop trigger if exists reports_status_history on public.reports;
create trigger reports_status_history
  after insert or update of status on public.reports
  for each row execute function public.log_report_status_change();

-- Création automatique du profil après inscription Auth
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer set search_path = '';

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Rôle courant lu hors RLS pour éviter la récursion dans les politiques.
create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = (select auth.uid())
$$;

grant execute on function public.current_user_role() to authenticated;

-- Stockage public en lecture, avec écriture réservée au dossier de l'utilisateur.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('report-photos', 'report-photos', true, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- --- Row Level Security (RLS) ---

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.reports enable row level security;
alter table public.report_images enable row level security;
alter table public.report_history enable row level security;
alter table public.interventions enable row level security;
alter table public.notifications enable row level security;
alter table public.territorial_zones enable row level security;

-- Profiles: seuls le propriétaire et les agents/admins peuvent lire les données personnelles.
drop policy if exists "Public profiles are viewable by everyone." on public.profiles;
drop policy if exists "Users can view own or managed profiles." on public.profiles;
create policy "Users can view own or managed profiles." on public.profiles for select
using (auth.uid() = id or public.current_user_role() in ('AGENT', 'ADMIN'));
drop policy if exists "Users can update own profile." on public.profiles;
drop policy if exists "Users can update own profile without changing role." on public.profiles;
create policy "Users can update own profile without changing role." on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id and role = public.current_user_role());

-- Categories: lecture publique, modif admin
drop policy if exists "Categories are viewable by everyone." on public.categories;
create policy "Categories are viewable by everyone." on public.categories for select using (true);

-- Reports: lecture publique, insertion citoyen, modif agent/admin
drop policy if exists "Reports are viewable by everyone." on public.reports;
create policy "Reports are viewable by everyone." on public.reports for select using (true);
drop policy if exists "Citizens can insert reports." on public.reports;
create policy "Citizens can insert reports." on public.reports for insert
with check (auth.uid() = user_id);
drop policy if exists "Authors can update their pending reports." on public.reports;
create policy "Authors can update their pending reports." on public.reports for update
using (auth.uid() = user_id and status = 'PENDING')
with check (auth.uid() = user_id and status = 'PENDING');
drop policy if exists "Agents and Admins can update any report." on public.reports;
create policy "Agents and Admins can update any report." on public.reports for update
using (public.current_user_role() in ('AGENT', 'ADMIN'))
with check (public.current_user_role() in ('AGENT', 'ADMIN'));
drop policy if exists "Authors can delete their pending reports." on public.reports;
create policy "Authors can delete their pending reports." on public.reports for delete
using (
  (auth.uid() = user_id and status = 'PENDING')
  or public.current_user_role() in ('AGENT', 'ADMIN')
);

-- Report Images
drop policy if exists "Report images are viewable by everyone." on public.report_images;
create policy "Report images are viewable by everyone." on public.report_images for select using (true);
drop policy if exists "Authenticated users can upload images." on public.report_images;
create policy "Report owners and managers can add images." on public.report_images for insert
with check (
  exists (
    select 1 from public.reports
    where reports.id = report_images.report_id
      and (reports.user_id = auth.uid() or public.current_user_role() in ('AGENT', 'ADMIN'))
  )
);

-- Interventions
drop policy if exists "Interventions viewable by agents and admins." on public.interventions;
create policy "Interventions viewable by agents and admins." on public.interventions for select using (
  public.current_user_role() in ('AGENT', 'ADMIN')
);
drop policy if exists "Agents and admins can create interventions." on public.interventions;
create policy "Agents and admins can create interventions." on public.interventions for insert
with check (
  public.current_user_role() = 'ADMIN'
  or (public.current_user_role() = 'AGENT' and agent_id = auth.uid())
);
drop policy if exists "Agents and admins can update interventions." on public.interventions;
create policy "Agents and admins can update interventions." on public.interventions for update
using (
  public.current_user_role() = 'ADMIN'
  or (public.current_user_role() = 'AGENT' and agent_id = auth.uid())
)
with check (
  public.current_user_role() = 'ADMIN'
  or (public.current_user_role() = 'AGENT' and agent_id = auth.uid())
);

-- Notifications: seulement le destinataire
drop policy if exists "Users can view own notifications." on public.notifications;
create policy "Users can view own notifications." on public.notifications for select using (auth.uid() = user_id);
drop policy if exists "Users can update own notifications." on public.notifications;
create policy "Users can update own notifications." on public.notifications for update using (auth.uid() = user_id);
drop policy if exists "Users can view own report history." on public.report_history;
create policy "Users can view own report history." on public.report_history for select
using (
  exists (select 1 from public.reports where reports.id = report_history.report_id and reports.user_id = auth.uid())
  or public.current_user_role() in ('AGENT', 'ADMIN')
);

-- Les médias restent publiquement accessibles car le bucket est public.
drop policy if exists "Report photos can be read publicly." on storage.objects;
create policy "Report photos can be read publicly." on storage.objects for select
using (bucket_id = 'report-photos');
drop policy if exists "Users can upload photos to own folder." on storage.objects;
create policy "Users can upload photos to own folder." on storage.objects for insert
with check (
  bucket_id = 'report-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
drop policy if exists "Users can update photos in own folder." on storage.objects;
create policy "Users can update photos in own folder." on storage.objects for update
using (
  bucket_id = 'report-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'report-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
drop policy if exists "Users can delete photos in own folder." on storage.objects;
create policy "Users can delete photos in own folder." on storage.objects for delete
using (
  bucket_id = 'report-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
