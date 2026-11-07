-- LUMTERRA - Schéma de base de données PostgreSQL (Supabase)
-- "Signalez. Suivez. Améliorez votre territoire."

-- 1. Extensions
create extension if not exists "pgcrypto";
create extension if not exists "postgis";

-- 2. Énumérations
create type user_role as enum ('CITOYEN', 'AGENT', 'ADMIN');
create type report_status as enum ('PENDING', 'VALIDATED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED');
create type report_severity as enum ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

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

create trigger reports_updated_at before update on public.reports for each row execute function public.handle_updated_at();
create trigger profiles_updated_at before update on public.profiles for each row execute function public.handle_updated_at();
create trigger interventions_updated_at before update on public.interventions for each row execute function public.handle_updated_at();

-- Création automatique du profil après inscription Auth
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- --- Row Level Security (RLS) ---

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.reports enable row level security;
alter table public.report_images enable row level security;
alter table public.report_history enable row level security;
alter table public.interventions enable row level security;
alter table public.notifications enable row level security;
alter table public.territorial_zones enable row level security;

-- Profiles: chacun voit son profil, admins voient tout
create policy "Public profiles are viewable by everyone." on public.profiles for select using (true);
create policy "Users can update own profile." on public.profiles for update using (auth.uid() = id);

-- Categories: lecture publique, modif admin
create policy "Categories are viewable by everyone." on public.categories for select using (true);

-- Reports: lecture publique, insertion citoyen, modif agent/admin
create policy "Reports are viewable by everyone." on public.reports for select using (true);
create policy "Citizens can insert reports." on public.reports for insert with check (auth.role() = 'authenticated');
create policy "Authors can update their pending reports." on public.reports for update using (auth.uid() = user_id and status = 'PENDING');
create policy "Agents and Admins can update any report." on public.reports for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('AGENT', 'ADMIN'))
);

-- Report Images
create policy "Report images are viewable by everyone." on public.report_images for select using (true);
create policy "Authenticated users can upload images." on public.report_images for insert with check (auth.role() = 'authenticated');

-- Interventions
create policy "Interventions viewable by agents and admins." on public.interventions for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('AGENT', 'ADMIN'))
);

-- Notifications: seulement le destinataire
create policy "Users can view own notifications." on public.notifications for select using (auth.uid() = user_id);
create policy "Users can update own notifications." on public.notifications for update using (auth.uid() = user_id);
