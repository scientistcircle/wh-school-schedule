-- =====================================================================
-- WH SCHOOL SCHEDULE — RLS, trigger, realtime
-- =====================================================================

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
     where p.id = auth.uid() and p.role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    'viewer'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_school_days_touch on public.school_days;
create trigger trg_school_days_touch
  before update on public.school_days
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_lessons_touch on public.lessons;
create trigger trg_lessons_touch
  before update on public.lessons
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_announcements_touch on public.announcements;
create trigger trg_announcements_touch
  before update on public.announcements
  for each row execute function public.touch_updated_at();

create or replace function public.log_school_day_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_action text;
  v_summary text;
begin
  if tg_op = 'INSERT' then
    v_action := 'create';
    v_summary := 'Membuat hari sekolah ' || new.schedule_date::text;
  elsif tg_op = 'UPDATE' then
    if new.status <> old.status then
      v_action := case when new.status = 'published' then 'publish' else 'unpublish' end;
      v_summary := 'Mengubah status ' || old.schedule_date::text || ' menjadi ' || new.status;
    else
      v_action := 'update';
      v_summary := 'Memperbarui hari sekolah ' || new.schedule_date::text;
    end if;
  else
    v_action := 'delete';
    v_summary := 'Menghapus hari sekolah ' || old.schedule_date::text;
  end if;
  insert into public.change_logs (admin_id, entity_type, entity_id, action, change_summary)
  values (auth.uid(), 'school_days', coalesce(new.id, old.id), v_action, v_summary);
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_school_days_log on public.school_days;
create trigger trg_school_days_log
  after insert or update or delete on public.school_days
  for each row execute function public.log_school_day_change();

create or replace function public.log_lesson_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_action text;
begin
  v_action := case tg_op when 'INSERT' then 'create' when 'UPDATE' then 'update' else 'delete' end;
  insert into public.change_logs (admin_id, entity_type, entity_id, action, change_summary)
  values (auth.uid(), 'lessons', coalesce(new.id, old.id), v_action,
          'Pelajaran pada sesi ' || coalesce(new.lesson_period_id, old.lesson_period_id)::text);
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_lessons_log on public.lessons;
create trigger trg_lessons_log
  after insert or update or delete on public.lessons
  for each row execute function public.log_lesson_change();

alter table public.classes          enable row level security;
alter table public.teachers         enable row level security;
alter table public.subjects         enable row level security;
alter table public.rooms            enable row level security;
alter table public.profiles         enable row level security;
alter table public.school_days      enable row level security;
alter table public.daily_activities enable row level security;
alter table public.duty_teachers    enable row level security;
alter table public.lesson_periods   enable row level security;
alter table public.lessons          enable row level security;
alter table public.announcements    enable row level security;
alter table public.change_logs      enable row level security;
alter table public.app_settings     enable row level security;

drop policy if exists classes_select on public.classes;
create policy classes_select on public.classes
  for select using (is_active = true or public.is_admin());
drop policy if exists classes_admin_all on public.classes;
create policy classes_admin_all on public.classes
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists teachers_select on public.teachers;
create policy teachers_select on public.teachers
  for select using (is_active = true or public.is_admin());
drop policy if exists teachers_admin_all on public.teachers;
create policy teachers_admin_all on public.teachers
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists subjects_select on public.subjects;
create policy subjects_select on public.subjects
  for select using (is_active = true or public.is_admin());
drop policy if exists subjects_admin_all on public.subjects;
create policy subjects_admin_all on public.subjects
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists rooms_select on public.rooms;
create policy rooms_select on public.rooms
  for select using (is_active = true or public.is_admin());
drop policy if exists rooms_admin_all on public.rooms;
create policy rooms_admin_all on public.rooms
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists profiles_select_self on public.profiles;
create policy profiles_select_self on public.profiles
  for select using (auth.uid() = id or public.is_admin());

drop policy if exists school_days_public_read on public.school_days;
create policy school_days_public_read on public.school_days
  for select using (status = 'published' or public.is_admin());
drop policy if exists school_days_admin_all on public.school_days;
create policy school_days_admin_all on public.school_days
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists daily_activities_read on public.daily_activities;
create policy daily_activities_read on public.daily_activities
  for select using (
    public.is_admin() or exists (
      select 1 from public.school_days sd
       where sd.id = daily_activities.school_day_id and sd.status = 'published'
    )
  );
drop policy if exists daily_activities_admin_all on public.daily_activities;
create policy daily_activities_admin_all on public.daily_activities
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists duty_teachers_read on public.duty_teachers;
create policy duty_teachers_read on public.duty_teachers
  for select using (
    public.is_admin() or exists (
      select 1 from public.school_days sd
       where sd.id = duty_teachers.school_day_id and sd.status = 'published'
    )
  );
drop policy if exists duty_teachers_admin_all on public.duty_teachers;
create policy duty_teachers_admin_all on public.duty_teachers
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists lesson_periods_read on public.lesson_periods;
create policy lesson_periods_read on public.lesson_periods
  for select using (
    public.is_admin() or exists (
      select 1 from public.school_days sd
       where sd.id = lesson_periods.school_day_id and sd.status = 'published'
    )
  );
drop policy if exists lesson_periods_admin_all on public.lesson_periods;
create policy lesson_periods_admin_all on public.lesson_periods
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists lessons_read on public.lessons;
create policy lessons_read on public.lessons
  for select using (
    public.is_admin() or exists (
      select 1 from public.school_days sd
       where sd.id = lessons.school_day_id and sd.status = 'published'
    )
  );
drop policy if exists lessons_admin_all on public.lessons;
create policy lessons_admin_all on public.lessons
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists announcements_public_read on public.announcements;
create policy announcements_public_read on public.announcements
  for select using (
    public.is_admin() or (is_published = true and current_date between start_date and end_date)
  );
drop policy if exists announcements_admin_all on public.announcements;
create policy announcements_admin_all on public.announcements
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists change_logs_admin_read on public.change_logs;
create policy change_logs_admin_read on public.change_logs
  for select using (public.is_admin());

drop policy if exists app_settings_read on public.app_settings;
create policy app_settings_read on public.app_settings
  for select using (true);
drop policy if exists app_settings_admin_write on public.app_settings;
create policy app_settings_admin_write on public.app_settings
  for all using (public.is_admin()) with check (public.is_admin());

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin alter publication supabase_realtime add table public.school_days;
    exception when duplicate_object then null; end;
    begin alter publication supabase_realtime add table public.lesson_periods;
    exception when duplicate_object then null; end;
    begin alter publication supabase_realtime add table public.lessons;
    exception when duplicate_object then null; end;
    begin alter publication supabase_realtime add table public.daily_activities;
    exception when duplicate_object then null; end;
    begin alter publication supabase_realtime add table public.duty_teachers;
    exception when duplicate_object then null; end;
    begin alter publication supabase_realtime add table public.announcements;
    exception when duplicate_object then null; end;
  end if;
end;
$$;