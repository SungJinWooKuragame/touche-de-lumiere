-- Consolidated schema refresh for Therapy Flow Manage
-- Date: 2025-11-01
-- Purpose: Ensure all required tables, columns, indexes, and helper functions exist
-- This migration is idempotent (uses IF NOT EXISTS / safe ALTERs) and can be run multiple times.

-- Extensions (optional, safe if already present)
create extension if not exists pgcrypto;

-- =====================================
-- SERVICES: multilingual + customization
-- =====================================
alter table if exists public.services
  add column if not exists name_pt text,
  add column if not exists name_en text,
  add column if not exists name_fr text,
  add column if not exists description_pt text,
  add column if not exists description_en text,
  add column if not exists description_fr text,
  add column if not exists icon_name text,
  add column if not exists icon_emoji text,
  add column if not exists hover_color text,
  add column if not exists duration_minutes integer default 60,
  add column if not exists price numeric(10,2) default 0,
  add column if not exists active boolean default true;

-- Helpful indexes
do $$ begin
  if not exists (
    select 1 from pg_indexes where schemaname='public' and indexname='idx_services_active'
  ) then
    create index idx_services_active on public.services(active);
  end if;
end $$;

-- =====================================
-- APPOINTMENTS: ensure needed columns
-- =====================================
alter table if exists public.appointments
  add column if not exists appointment_date date,
  add column if not exists appointment_time text,
  add column if not exists status text default 'pending',
  add column if not exists cancellation_reason text;

do $$ begin
  if not exists (
    select 1 from pg_indexes where schemaname='public' and indexname='idx_appointments_date_time'
  ) then
    create index idx_appointments_date_time on public.appointments(appointment_date, (appointment_time));
  end if;
end $$;

-- =====================================
-- PROFILES: ensure contact fields
-- =====================================
alter table if exists public.profiles
  add column if not exists full_name text,
  add column if not exists email text,
  add column if not exists phone text;

-- =====================================
-- USER ROLES: simple RBAC table
-- =====================================
create table if not exists public.user_roles (
  user_id uuid not null,
  role text not null,
  primary key (user_id, role)
);

do $$ begin
  if not exists (
    select 1 from pg_indexes where schemaname='public' and indexname='idx_user_roles_role'
  ) then
    create index idx_user_roles_role on public.user_roles(role);
  end if;
end $$;

-- =====================================
-- SITE SETTINGS: key/value storage
-- =====================================
create table if not exists public.site_settings (
  key text primary key,
  value text not null
);

-- =====================================
-- OPERATING HOURS: 0..6 (Sun..Sat)
-- =====================================
create table if not exists public.operating_hours (
  day_of_week integer primary key check (day_of_week between 0 and 6),
  is_open boolean not null default false,
  open_time time,
  close_time time
);

-- Seed default hours if table empty (Mon–Fri 08:00–18:00, Sat 08:00–12:00)
do $$ begin
  if (select count(*) = 0 from public.operating_hours) then
    insert into public.operating_hours(day_of_week, is_open, open_time, close_time) values
      (0, false, null, null),
      (1, true,  '08:00', '18:00'),
      (2, true,  '08:00', '18:00'),
      (3, true,  '08:00', '18:00'),
      (4, true,  '08:00', '18:00'),
      (5, true,  '08:00', '18:00'),
      (6, true,  '08:00', '12:00');
  end if;
end $$;

-- =====================================
-- DATE BLOCKS: all-day or time-ranged
-- =====================================
create table if not exists public.date_blocks (
  id bigserial primary key,
  title text not null,
  description text,
  block_type text default 'custom',
  start_date date not null,
  end_date date not null,
  start_time time,
  end_time time,
  created_by uuid
);

do $$ begin
  if not exists (
    select 1 from pg_indexes where schemaname='public' and indexname='idx_date_blocks_start'
  ) then
    create index idx_date_blocks_start on public.date_blocks(start_date);
  end if;
  if not exists (
    select 1 from pg_indexes where schemaname='public' and indexname='idx_date_blocks_end'
  ) then
    create index idx_date_blocks_end on public.date_blocks(end_date);
  end if;
end $$;

-- =====================================
-- RPC: get_busy_time_slots
-- Returns booked slots (start/end) for a given date
-- =====================================
create or replace function public.get_busy_time_slots(p_date date)
returns table (start_time text, end_time text)
language sql
as $$
  select 
    to_char(appointments.appointment_time::time, 'HH24:MI') as start_time,
    to_char((appointments.appointment_time::time + (coalesce(s.duration_minutes,60) || ' minutes')::interval), 'HH24:MI') as end_time
  from public.appointments appointments
  left join public.services s on s.id = appointments.service_id
  where appointments.appointment_date = p_date
    and appointments.status in ('pending','confirmed');
$$;

-- Drop first to allow changing column list without 42P16 (cannot drop columns from view)
drop view if exists public.services_multilingual cascade;

create or replace view public.services_multilingual as
select 
  id,
  coalesce(name_pt, name) as name_pt_fallback,
  name_en,
  name_fr,
  coalesce(description_pt, description) as description_pt_fallback,
  description_en,
  description_fr,
  icon_name,
  icon_emoji,
  hover_color,
  duration_minutes,
  price,
  active
from public.services;

-- Grants (basic; adjust based on your RLS model)
-- Allow anonymous read where sensible
grant select on public.services to anon;
grant select on public.services_multilingual to anon;
grant select on public.operating_hours to anon;
grant select on public.date_blocks to anon;
grant select on public.site_settings to anon;

-- Allow authenticated read/write where needed
grant select, insert, update, delete on public.date_blocks to authenticated;
grant select, update, insert on public.operating_hours to authenticated;
grant select, update, insert on public.site_settings to authenticated;

comment on function public.get_busy_time_slots(p_date date) is 'Returns existing appointments time spans (HH:MM) for the given date.';
