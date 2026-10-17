// =====================================================================
// Validasi jadwal — dipakai di editor pelajaran.
// =====================================================================

export function validateLessonInput(lesson) {
  const errors = [];
  if (!lesson.class_id) errors.push('Kelas wajib dipilih.');
  if (!lesson.teacher_id) errors.push('Guru wajib dipilih.');
  if (!lesson.subject_id) errors.push('Mata pelajaran wajib dipilih.');
  if (!lesson.room_id) errors.push('Ruang wajib dipilih.');
  return errors;
}

// Deteksi konflik guru: guru sama, sesi sama, TAPI mapel/ruang berbeda.
// Jika mapel & ruang SAMA, itu kelas gabungan (bukan konflik).
export function detectTeacherConflicts(lessons, periods, teachers) {
  const periodMap = new Map(periods.map((p) => [p.id, p]));
  const teacherMap = new Map(teachers.map((t) => [t.id, t]));
  
  // Group by period_id dan teacher_id
  const groups = new Map(); 
  for (const l of lessons) {
    if (l.is_cancelled) continue;
    if (!l.lesson_period_id || !l.teacher_id) continue;
    
    const key = `${l.lesson_period_id}::${l.teacher_id}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(l);
  }

  const conflicts = [];
  for (const [key, rows] of groups) {
    if (rows.length < 2) continue;
    
    // Cek apakah semuanya kelas gabungan (subject_id dan room_id sama persis)
    const isCombinedClass = rows.every(r => 
      r.subject_id === rows[0].subject_id && 
      r.room_id === rows[0].room_id
    );
    
    if (isCombinedClass) continue; // Abaikan jika kelas gabungan

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

// Deteksi konflik ruang: ruang sama, sesi sama, TAPI guru/mapel berbeda.
// Jika guru & mapel SAMA, itu kelas gabungan (bukan konflik).
export function detectRoomConflicts(lessons, periods, rooms) {
  const periodMap = new Map(periods.map((p) => [p.id, p]));
  const roomMap = new Map(rooms.map((r) => [r.id, r]));
  
  const groups = new Map(); 
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

    // Cek apakah semuanya kelas gabungan (teacher_id dan subject_id sama persis)
    const isCombinedClass = rows.every(r => 
      r.teacher_id === rows[0].teacher_id && 
      r.subject_id === rows[0].subject_id
    );

    if (isCombinedClass) continue; // Abaikan jika kelas gabungan

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