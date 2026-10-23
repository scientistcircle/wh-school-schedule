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
            {/* <th>Catatan</th> <-- DIHAPUS */}
          </tr>
        </thead>
        <tbody>
          {grouped.map((l) => {
            const isCombined = l.classNameDisplay && l.classNameDisplay.includes(',');

            return (
              <tr 
                key={l.id} 
                className={`${l.is_cancelled ? 'is-cancelled' : ''} ${isCombined ? 'row-combined' : ''}`}
              >
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
                
                {/* <td>...</td> <-- KOLOM CATATAN DIHAPUS */}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}