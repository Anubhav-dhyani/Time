import React, { useMemo } from 'react';

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

function groupByDay(slots) {
  const byDay = Object.fromEntries(DAYS.map((d) => [d, []]));
  for (const s of slots) {
    if (!DAYS.includes(s.day)) continue;
    byDay[s.day].push(s);
  }
  for (const d of DAYS) {
    byDay[d].sort((a, b) => a.start.localeCompare(b.start));
  }
  return byDay;
}

export default function Timetable({ slots = [], canBook = false, onBook, isPastSlot, teacherView = false }) {
  const grouped = useMemo(() => groupByDay(slots), [slots]);
  const dayToIndex = (d) => ({ SUN:0, MON:1, TUE:2, WED:3, THU:4, FRI:5, SAT:6 })[d] ?? -1;
  const nowHM = () => {
    const dt = new Date();
    return `${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`;
  };
  const timeLTE = (a,b) => String(a || '').localeCompare(String(b || '')) <= 0;
  const defaultIsPast = (slot) => {
    const si = dayToIndex(slot.day);
    if (si < 0) return false;
    const today = new Date().getDay();
    if (si < today) return true;
    if (si > today) return false;
    const end = slot.end || slot.start;
    return timeLTE(end, nowHM());
  };
  const isPast = (slot) => (typeof isPastSlot === 'function' ? isPastSlot(slot) : defaultIsPast(slot));

  // Get all unique time slots
  const times = useMemo(() => {
    const timeSet = new Set();
    slots.forEach(slot => {
      timeSet.add(`${slot.start}-${slot.end}`);
    });
    return Array.from(timeSet).sort();
  }, [slots]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Desktop View */}
      <div className="hidden md:block overflow-hidden">
        <table className="w-full">
          <thead>
            <tr>
              <th className="w-32 p-4 bg-gray-100 border-b-2 border-gray-300 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                Time
              </th>
              {DAYS.map(day => (
                <th key={day} className="p-4 bg-gray-100 border-b-2 border-gray-300 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {times.map(time => (
              <tr key={time} className="hover:bg-gray-50 transition-colors duration-150">
                <td className="p-4 border-b border-gray-200 text-sm font-medium text-gray-900 bg-gray-50">
                  {time.replace('-', ' - ')}
                </td>
                {DAYS.map(day => {
                  const slot = (grouped[day] || []).find(s => `${s.start}-${s.end}` === time);
                  if (!slot) {
                    return (
                      <td key={`${day}-${time}`} className="p-4 border-b border-gray-200 bg-white"></td>
                    );
                  }

                  let bgColor, textColor, statusText;
                  const past = isPast(slot);
                  const effectivePast = (teacherView && slot.initiallyBusy) ? false : past;
                  if (effectivePast) {
                    bgColor = 'bg-red-100';
                    textColor = 'text-red-800';
                    statusText = 'Unavailable';
                  } else if (slot.status === 'occupied') {
                    if (teacherView && !slot.initiallyBusy) {
                      bgColor = 'bg-red-100';
                      textColor = 'text-red-800';
                    } else {
                      bgColor = 'bg-red-800';
                      textColor = 'text-white';
                    }
                    statusText = 'Busy';
                  } else {
                    bgColor = 'bg-green-100';
                    textColor = 'text-green-800';
                    statusText = 'Available';
                  }

                  const bookable = canBook && slot.status === 'available' && !effectivePast && (slot.currentBookings < slot.maxBookings);
                  return (
                    <td key={`${day}-${time}`} className="p-4 border-b border-gray-200">
                      <div className={`${bgColor} rounded-lg p-3 text-center shadow-sm`}>
                        <span className={`text-sm font-medium ${textColor}`}>
                          {statusText}
                        </span>
                        {slot.status === 'available' && (
                          <div className="mt-1 text-xs text-gray-600">
                            {slot.currentBookings}/{slot.maxBookings} bookings
                          </div>
                        )}
                        {bookable && (
                          <button
                            className="mt-2 inline-flex items-center px-3 py-1 text-xs bg-white text-red-600 rounded-md transition-colors duration-200 hover:bg-red-100 font-medium"
                            onClick={() => onBook && onBook(slot)}
                          >
                            Book Now
                          </button>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile View */}
      <div className="md:hidden">
        {DAYS.map(day => (
          <div key={day} className="border-b border-gray-200 last:border-b-0">
            <div className="bg-gray-100 p-3">
              <h3 className="text-sm font-semibold text-gray-900 text-center">{day}</h3>
            </div>
            <div className="p-3 grid gap-3">
              {(grouped[day] || []).map(slot => {
                let bgColor, textColor, statusText;
                const past = isPast(slot);
                const effectivePast = (teacherView && slot.initiallyBusy) ? false : past;
                if (effectivePast) {
                  bgColor = 'bg-red-100';
                  textColor = 'text-red-800';
                  statusText = 'Unavailable';
                } else if (slot.status === 'occupied') {
                  if (teacherView && !slot.initiallyBusy) {
                    bgColor = 'bg-red-100';
                    textColor = 'text-red-800';
                  } else {
                    bgColor = 'bg-red-800';
                    textColor = 'text-white';
                  }
                  statusText = 'Busy';
                } else {
                  bgColor = 'bg-green-100';
                  textColor = 'text-green-800';
                  statusText = 'Available';
                }

                const bookable = canBook && slot.status === 'available' && !effectivePast && (slot.currentBookings < slot.maxBookings);
                return (
                  <div key={`${day}-${slot.start}-${slot.end}`} className={`${bgColor} rounded-lg p-3 shadow-sm`}>
                    <div className="flex justify-between items-center">
                      <span className={`text-sm font-medium ${textColor}`}>
                        {slot.start} - {slot.end}
                      </span>
                      <span className={`text-xs font-medium ${textColor}`}>
                        {statusText}
                      </span>
                    </div>
                    {slot.status === 'available' && (
                      <div className="mt-1 text-xs text-gray-600">
                        {slot.currentBookings}/{slot.maxBookings} bookings
                      </div>
                    )}
                    {bookable && (
                      <button
                        className="mt-2 w-full inline-flex items-center justify-center px-3 py-2 text-xs bg-white text-red-600 rounded-md transition-colors duration-200 hover:bg-red-100 font-medium"
                        onClick={() => onBook && onBook(slot)}
                      >
                        Book Now
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}