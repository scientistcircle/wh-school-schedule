import { groupLessons } from '../utils/scheduleUtils.js';
import { Link } from 'react-router-dom';

export default function SessionTable({ lessons, showPeriod = false }) {
  const grouped = groupLessons(lessons);

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {showPeriod && <th>Sesi</th>}
            <th>Kelas</th>
            <th>Guru</th>
            <th>Mata Pelajaran</th>
            <th>Ruang</th>
            <th>Catatan</th>
          </tr>
        </thead>
        <tbody>
          {grouped.map((l) => (
            <tr key={l.id} className={l.is_cancelled ? 'is-cancelled' : ''}>
              {showPeriod && <td><strong>{l.period?.period_name ?? '-'}</strong></td>}
              <td>
                <strong>{l.classNameDisplay}</strong>
              </td>
              <td>
                {l.teacher?.name ?? '-'}
                {(l.substitute_teacher?.name || l.substitute_teacher_name) && (
                  <div className="cell-substitute">
                    Pengganti: {l.substitute_teacher?.name ?? l.substitute_teacher_name}
                  </div>
                )}
              </td>
              <td>{l.subject?.name ?? '-'}</td>
              <td>{l.room?.name ?? '-'}</td>
              <td>
                {l.is_cancelled && <span className="tag tag--danger">Dibatalkan</span>}
                {l.notes && <div className="cell-note">{l.notes}</div>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}