insert into public.classes (name, grade_level, display_order) values
  ('X1','X',10), ('X2','X',11), ('X3','X',12), ('X4','X',13),
  ('X5','X',14), ('X6','X',15), ('X7','X',16), ('X8','X',17),
  ('XI PA','XI',20), ('XI PI','XI',21),
  ('XII Science 1','XII',30), ('XII Science 2','XII',31),
  ('XII Science 3','XII',32), ('XII Science 4','XII',33),
  ('XII Social 1','XII',40), ('XII Social 2','XII',41),
  ('XII Social 3','XII',42)
on conflict (name) do nothing;

insert into public.teachers (name) values
  ('Ms. Alin'), ('Ms. Syihabul'), ('Mr. Dili'),
  ('Mr. Adi'), ('Mr. Rafly'), ('Mr. Muzaka'), ('Ms. Aqila'),
  ('Mr. Amir'), ('Mr. Aufa'), ('Mr. Arif'),
  ('Ms. Dasilah'), ('Mr. Shidqi'),
  ('Mr. Aniq'), ('Mr. Wakid'), ('Ms. Ulya'), ('Mr. Jazari'),
  ('Mr. Kun'), ('Mr. Nalta'), ('Ms. Rinda')
on conflict (name) do nothing;

insert into public.subjects (name) values
  ('Informatics'), ('Mathematics'), ('Tajwid & Tahsin'),
  ('Natural Science'), ('Social Science'), ('English'), ('TO Ruang Guru')
on conflict (name) do nothing;

insert into public.rooms (name) values
  ('H1.02'), ('H1.03'), ('H1.04'), ('H1.05'), ('H1.06'),
  ('SU3.01'), ('SU3.02'), ('SU3.03'), ('SU3.04'), ('SU3.05'),
  ('D1'), ('AHC 5'),
  ('SU1.01'), ('SU1.02'), ('SU1.03'), ('SU1.04'), ('SU1.05')
on conflict (name) do nothing;

insert into public.school_days (schedule_date, status, notes)
values ('2026-10-14', 'draft', 'Data contoh untuk demonstrasi.')
on conflict (schedule_date) do nothing;

with day as (select id from public.school_days where schedule_date = '2026-10-14')
insert into public.daily_activities
  (school_day_id, activity_name, activity_code, start_time, end_time, display_order)
select day.id, v.name, v.code, v.st, v.et, v.ord
  from day cross join (values
    ('Apel','APEL','07:30'::time,'07:45'::time,1),
    ('Picket','PICKET','07:45'::time,'08:00'::time,2),
    ('KBM 1','KBM1','08:00'::time,'08:50'::time,3),
    ('KBM 2','KBM2','08:50'::time,'09:40'::time,4),
    ('Istirahat','ISTIRAHAT','09:40'::time,'10:00'::time,5),
    ('KBM 3','KBM3','10:00'::time,'10:50'::time,6),
    ('KBM 4','KBM4','10:50'::time,'11:40'::time,7),
    ('Dzuhur Break','DZUHUR','11:40'::time,'12:45'::time,8),
    ('KBM 5','KBM5','12:45'::time,'13:35'::time,9)
  ) as v(name, code, st, et, ord)
on conflict do nothing;
with day as (select id from public.school_days where schedule_date = '2026-10-14')
insert into public.lesson_periods
  (school_day_id, period_code, period_name, start_time, end_time, display_order)
select day.id, v.code, v.name, v.st, v.et, v.ord
  from day cross join (values
    ('KBM1','KBM 1','08:00'::time,'08:50'::time,1),
    ('KBM2','KBM 2','08:50'::time,'09:40'::time,2),
    ('KBM3','KBM 3','10:00'::time,'10:50'::time,3),
    ('KBM4','KBM 4','10:50'::time,'11:40'::time,4),
    ('KBM5','KBM 5','12:45'::time,'13:35'::time,5)
  ) as v(code,name,st,et,ord)
on conflict (school_day_id, period_code) do nothing;

with day as (select id from public.school_days where schedule_date = '2026-10-14')
insert into public.duty_teachers (school_day_id, teacher_id, display_order)
select day.id, t.id, v.ord
  from day cross join (values ('Ms. Alin',1),('Ms. Syihabul',2),('Mr. Dili',3)) as v(name, ord)
  join public.teachers t on t.name = v.name
on conflict (school_day_id, teacher_id) do nothing;

with ctx as (
  select sd.id as day_id, lp.id as period_id
    from public.school_days sd
    join public.lesson_periods lp on lp.school_day_id = sd.id and lp.period_code = 'KBM1'
   where sd.schedule_date = '2026-10-14'
)
insert into public.lessons
  (school_day_id, lesson_period_id, class_id, teacher_id, subject_id, room_id)
select ctx.day_id, ctx.period_id, c.id, t.id, s.id, r.id
  from ctx cross join (values
    ('X1','Mr. Adi','Informatics','H1.02'),
    ('X2','Mr. Rafly','Mathematics','H1.03'),
    ('X3','Mr. Muzaka','Tajwid & Tahsin','H1.04'),
    ('X4','Ms. Aqila','Tajwid & Tahsin','SU3.01'),
    ('X5','Mr. Amir','Mathematics','SU3.02'),
    ('X6','Mr. Aufa','Natural Science','SU3.03'),
    ('X7','Mr. Arif','Social Science','SU3.04'),
    ('X8','Mr. Syihabul','Social Science','SU3.05'),
    ('XI PA','Ms. Dasilah','English','D1'),
    ('XI PI','Mr. Shidqi','Mathematics','AHC 5'),
    ('XII Science 1','Mr. Aniq','TO Ruang Guru','H1.05'),
    ('XII Social 1','Mr. Wakid','TO Ruang Guru','H1.06'),
    ('XII Science 2','Ms. Ulya','TO Ruang Guru','SU1.01'),
    ('XII Science 3','Mr. Jazari','TO Ruang Guru','SU1.02'),
    ('XII Science 4','Mr. Kun','TO Ruang Guru','SU1.03'),
    ('XII Social 2','Mr. Nalta','TO Ruang Guru','SU1.04'),
    ('XII Social 3','Ms. Rinda','TO Ruang Guru','SU1.05')
  ) as v(class_name, teacher_name, subject_name, room_name)
  join public.classes  c on c.name = v.class_name
  join public.teachers t on t.name = v.teacher_name
  join public.subjects s on s.name = v.subject_name
  join public.rooms    r on r.name = v.room_name
on conflict (lesson_period_id, class_id) do nothing;

insert into public.announcements
  (title, content, importance, start_date, end_date, is_published)
values
  ('Selamat datang di WH School Schedule',
   'Jadwal harian kini dapat dilihat langsung melalui browser laptop.',
   'normal', current_date, current_date + interval '30 days', true),
  ('Contoh: Perubahan ruang KBM 1 kelas X1',
   'Kelas X1 KBM 1 berpindah ke ruang H1.02. Mohon diperhatikan.',
   'high', current_date, current_date + interval '7 days', true)
on conflict do nothing;