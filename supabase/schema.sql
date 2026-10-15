-- =====================================================================
-- WH SCHOOL SCHEDULE — Schema
-- =====================================================================

create extension if not exists "pgcrypto";

create table if not exists public.classes (
  id            uuid primary key default gen_random_uuid(),
  name          text not null unique,
  grade_level   text,
  display_order int  not null default 0,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);
create index if not exists idx_classes_active_order
  on public.classes (is_active, display_order);

create table if not exists public.teachers (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_teachers_active on public.teachers (is_active);

create table if not exists public.subjects (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_subjects_active on public.subjects (is_active);

create table if not exists public.rooms (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_rooms_active on public.rooms (is_active);

create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Pengguna',
  role         text not null default 'viewer'
                 check (role in ('admin','viewer')),
  created_at   timestamptz not null default now()
);

create table if not exists public.school_days (
  id            uuid primary key default gen_random_uuid(),
  schedule_date date not null unique,
  status        text not null default 'draft'
                  check (status in ('draft','published')),
  notes         text,
  published_at  timestamptz,
  created_by    uuid references public.profiles(id),
  updated_by    uuid references public.profiles(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_school_days_status on public.school_days (status);

create table if not exists public.daily_activities (
  id             uuid primary key default gen_random_uuid(),
  school_day_id  uuid not null references public.school_days(id) on delete cascade,
  activity_name  text not null,
  activity_code  text check (activity_code in
                   ('APEL','PICKET','KBM1','KBM2','ISTIRAHAT','KBM3','KBM4','DZUHUR','KBM5')),
  start_time     time not null,
  end_time       time not null,
  display_order  int  not null default 0,
  constraint daily_activities_time_valid check (end_time > start_time)
);
create index if not exists idx_daily_activities_day_order
  on public.daily_activities (school_day_id, display_order);

create unique index if not exists uq_daily_activities_day_code
  on public.daily_activities (school_day_id, activity_code)
  where activity_code is not null;

create table if not exists public.duty_teachers (
  id             uuid primary key default gen_random_uuid(),
  school_day_id  uuid not null references public.school_days(id) on delete cascade,
  teacher_id     uuid not null references public.teachers(id) on delete restrict,
  display_order  int  not null default 0,
  unique (school_day_id, teacher_id)
);
create index if not exists idx_duty_teachers_day
  on public.duty_teachers (school_day_id, display_order);

create table if not exists public.lesson_periods (
  id             uuid primary key default gen_random_uuid(),
  school_day_id  uuid not null references public.school_days(id) on delete cascade,
  period_code    text not null check (period_code in ('KBM1','KBM2','KBM3','KBM4','KBM5')),
  period_name    text not null,
  start_time     time not null,
  end_time       time not null,
  display_order  int  not null default 0,
  constraint lesson_periods_time_valid check (end_time > start_time),
  unique (school_day_id, period_code),
  unique (id, school_day_id)
);
create index if not exists idx_lesson_periods_day_order
  on public.lesson_periods (school_day_id, display_order);

create table if not exists public.lessons (
  id                      uuid primary key default gen_random_uuid(),
  school_day_id           uuid not null,
  lesson_period_id        uuid not null,
  class_id                uuid not null references public.classes(id)  on delete restrict,
  teacher_id              uuid not null references public.teachers(id) on delete restrict,
  subject_id              uuid not null references public.subjects(id) on delete restrict,
  room_id                 uuid not null references public.rooms(id)    on delete restrict,
  substitute_teacher_id   uuid references public.teachers(id) on delete set null,
  substitute_teacher_name text,
  notes                   text,
  is_cancelled            boolean not null default false,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  constraint lessons_period_day_fk
    foreign key (lesson_period_id, school_day_id)
    references public.lesson_periods (id, school_day_id)
    on delete cascade,
  constraint lessons_unique_class_period
    unique (lesson_period_id, class_id)
);

create index if not exists idx_lessons_day_class on public.lessons (school_day_id, class_id);
create index if not exists idx_lessons_teacher   on public.lessons (teacher_id);
create index if not exists idx_lessons_room      on public.lessons (room_id);
create index if not exists idx_lessons_period    on public.lessons (lesson_period_id);

create table if not exists public.announcements (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  content       text not null,
  importance    text not null default 'normal'
                  check (importance in ('low','normal','high','urgent')),
  start_date    date not null default current_date,
  end_date      date not null default current_date,
  is_published  boolean not null default false,
  created_by    uuid references public.profiles(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint announcements_date_order check (end_date >= start_date)
);
create index if not exists idx_announcements_active
  on public.announcements (is_published, start_date, end_date);

create table if not exists public.change_logs (
  id              uuid primary key default gen_random_uuid(),
  admin_id        uuid references public.profiles(id),
  entity_type     text not null,
  entity_id       uuid,
  action          text not null
                    check (action in ('create','update','publish','unpublish','delete')),
  change_summary  text,
  metadata        jsonb,
  changed_at      timestamptz not null default now()
);
create index if not exists idx_change_logs_changed_at on public.change_logs (changed_at desc);
create index if not exists idx_change_logs_entity     on public.change_logs (entity_type, entity_id);

create table if not exists public.app_settings (
  key         text primary key,
  value       jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references public.profiles(id)
);