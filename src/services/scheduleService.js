import { supabase } from './supabaseClient.js';

// Ambil seluruh data hari sekolah dalam satu panggilan paralel.
export async function getFullSchoolDay(dateString) {
  const { data: day, error: dayError } = await supabase
    .from('school_days')
    .select('id, schedule_date, status, notes, published_at, updated_at')
    .eq('schedule_date', dateString)
    .maybeSingle();

  if (dayError) return { data: null, error: dayError };
  if (!day) return { data: null, error: null, notFound: true };

  const [activitiesRes, dutyRes, periodsRes, lessonsRes] = await Promise.all([
    supabase
      .from('daily_activities')
      .select('id, activity_name, activity_code, start_time, end_time, display_order')
      .eq('school_day_id', day.id)
      .order('display_order'),
    supabase
      .from('duty_teachers')
      .select('id, display_order, teacher:teacher_id(id, name)')
      .eq('school_day_id', day.id)
      .order('display_order'),
    supabase
      .from('lesson_periods')
      .select('id, period_code, period_name, start_time, end_time, display_order')
      .eq('school_day_id', day.id)
      .order('display_order'),
    supabase
      .from('lessons')
      .select(`
        id, notes, is_cancelled, substitute_teacher_name,
        class:class_id(id, name, grade_level),
        teacher:teacher_id(id, name),
        substitute_teacher:substitute_teacher_id(id, name),
        subject:subject_id(id, name),
        room:room_id(id, name),
        period:lesson_period_id(id, period_code, period_name, start_time, end_time, display_order)
      `)
      .eq('school_day_id', day.id),
  ]);

  const firstError =
    activitiesRes.error || dutyRes.error || periodsRes.error || lessonsRes.error;
  if (firstError) return { data: null, error: firstError };

  return {
    data: {
      day,
      activities: activitiesRes.data ?? [],
      duty: dutyRes.data ?? [],
      periods: periodsRes.data ?? [],
      lessons: lessonsRes.data ?? [],
    },
    error: null,
  };
}