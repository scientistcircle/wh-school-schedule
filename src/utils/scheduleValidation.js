// =====================================================================
// Validasi jadwal — dipakai di editor pelajaran.
// Semua fungsi mengembalikan array pesan (bisa kosong = tidak ada masalah).
// =====================================================================

// Validasi satu entri sebelum disimpan.
export function validateLessonInput(lesson) {
  const errors = [];
  if (!lesson.class_id) errors.push('Kelas wajib dipilih.');
  if (!lesson.teacher_id) errors.push('Guru wajib dipilih.');
  if (!lesson.subject_id) errors.push('Mata pelajaran wajib dipilih.');
  if (!lesson.room_id) errors.push('Ruang wajib dipilih.');
  return errors;
}

// Deteksi konflik guru: guru sama, sesi sama (waktu sama), kelas berbeda.
// Return array of { periodName, teacherName, classes: [...] }.
export function detectTeacherConflicts(lessons, periods, teachers) {
  const periodMap = new Map(periods.map((p) => [p.id, p]));
  const teacherMap = new Map(teachers.map((t) => [t.id, t]));
  const groups = new Map(); // key: `${period_id}::${teacher_id}`

  for (const l of lessons) {
    if (l.is_cancelled) continue;
    if (!l.lesson_period_id || !l.teacher_id) continue;
    // Guru pengganti tidak dihitung konflik (mereka menggantikan).
    const key = `${l.lesson_period_id}::${l.teacher_id}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(l);
  }

  const conflicts = [];
  for (const [key, rows] of groups) {
    if (rows.length < 2) continue;
    const [periodId, teacherId] = key.split('::');
    conflicts.push({
      type: 'teacher',
      periodName: periodMap.get(periodId)?.period_name ?? 'Sesi',
      teacherName: teacherMap.get(teacherId)?.name ?? 'Guru',
      classes: rows.map((r) => r.class?.name ?? '?'),
    });
  }
  return conflicts;
}

// Deteksi konflik ruang: ruang sama, sesi sama, kelas berbeda.
export function detectRoomConflicts(lessons, periods, rooms) {
  const periodMap = new Map(periods.map((p) => [p.id, p]));
  const roomMap = new Map(rooms.map((r) => [r.id, r]));
  const groups = new Map(); // key: `${period_id}::${room_id}`

  for (const l of lessons) {
    if (l.is_cancelled) continue;
    if (!l.lesson_period_id || !l.room_id) continue;
    const key = `${l.lesson_period_id}::${l.room_id}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(l);
  }

  const conflicts = [];
  for (const [key, rows] of groups) {
    if (rows.length < 2) continue;
    const [periodId, roomId] = key.split('::');
    conflicts.push({
      type: 'room',
      periodName: periodMap.get(periodId)?.period_name ?? 'Sesi',
      roomName: roomMap.get(roomId)?.name ?? 'Ruang',
      classes: rows.map((r) => r.class?.name ?? '?'),
    });
  }
  return conflicts;
}

// Deteksi ketidaksesuaian waktu antara daily_activities dan lesson_periods
// yang memiliki kode sama (mis. KBM1 di agenda 08:00–08:50 tapi di sesi 08:00–08:55).
export function detectTimeMismatch(activities, periods) {
  const byCode = new Map();
  for (const a of activities) {
    if (!a.activity_code) continue;
    byCode.set(a.activity_code, { name: a.activity_name, start: a.start_time, end: a.end_time });
  }
  const mismatches = [];
  for (const p of periods) {
    const act = byCode.get(p.period_code);
    if (!act) continue;
    if (act.start !== p.start_time || act.end !== p.end_time) {
      mismatches.push({
        periodName: p.period_name,
        code: p.period_code,
        agenda: `${act.start.slice(0, 5)}–${act.end.slice(0, 5)}`,
        session: `${p.start_time.slice(0, 5)}–${p.end_time.slice(0, 5)}`,
      });
    }
  }
  return mismatches;
}