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
  // Ensure all slots display at least 5 for maxBookings
  const normalizedSlots = slots.map(s => ({ ...s, maxBookings: (!s.maxBookings || s.maxBookings < 5) ? 5 : s.maxBookings }));
  const grouped = useMemo(() => groupByDay(normalizedSlots), [normalizedSlots]);
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
    normalizedSlots.forEach(slot => {
      timeSet.add(`${slot.start}-${slot.end}`);
    });
    return Array.from(timeSet).sort();
  }, [normalizedSlots]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Desktop View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="w-20 px-2 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Time
              </th>
              {DAYS.map(day => (
                <th key={day} className="px-2 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide min-w-[120px]">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {times.map((time, index) => (
              <tr key={time} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}>
                <td className="px-2 py-2 text-xs font-medium text-gray-700 bg-gray-50 whitespace-nowrap">
                  {time.replace('-', '-')}
                </td>
                {DAYS.map(day => {
                  const slot = (grouped[day] || []).find(s => `${s.start}-${s.end}` === time);
                  if (!slot) {
                    return (
                      <td key={`${day}-${time}`} className="px-2 py-2"></td>
                    );
                  }

                  let bgColor, textColor, statusText;
                  const past = isPast(slot);
                  const effectivePast = (teacherView && slot.initiallyBusy) ? false : past;
                  if (effectivePast) {
                    if (teacherView && !slot.initiallyBusy) {
                      bgColor = 'bg-orange-50 border border-orange-200';
                      textColor = 'text-orange-700';
                      statusText = 'Booking';
                    } else {
                      bgColor = 'bg-red-50 border border-red-200';
                      textColor = 'text-red-700';
                      statusText = 'Unavailable';
                    }
                  } else if (slot.status === 'occupied') {
                    if (teacherView && !slot.initiallyBusy) {
                      bgColor = 'bg-red-50 border border-red-200';
                      textColor = 'text-red-700';
                    } else {
                      bgColor = 'bg-red-600 border border-red-700';
                      textColor = 'text-white';
                    }
                    statusText = 'Busy';
                  } else {
                    bgColor = 'bg-green-50 border border-green-200';
                    textColor = 'text-green-700';
                    statusText = 'Available';
                  }

                  const bookable = canBook && slot.status === 'available' && !effectivePast && (slot.currentBookings < slot.maxBookings);
                  return (
                    <td key={`${day}-${time}`} className="px-2 py-2">
                      <div className={`${bgColor} rounded px-2 py-1.5 text-center`}>
                        <div className={`text-xs font-medium ${textColor} mb-0.5`}>
                          {statusText}
                        </div>
                        {(statusText === 'Available' || statusText === 'Booking') && (
                          <div className="text-xs text-gray-500 mb-1">
                            {slot.currentBookings}/{slot.maxBookings}
                          </div>
                        )}
                        {bookable && (
                          <button
                            className="text-xs px-2 py-0.5 bg-white text-green-600 rounded border hover:bg-green-50 transition-colors font-medium"
                            onClick={() => onBook && onBook(slot)}
                          >
                            Book
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
          <div key={day} className="border-b border-gray-100 last:border-b-0">
            <div className="bg-gray-50 px-3 py-2">
              <h3 className="text-sm font-semibold text-gray-700 text-center">{day}</h3>
            </div>
            <div className="p-2 space-y-2">
              {(grouped[day] || []).map(slot => {
                let bgColor, textColor, statusText;
                const past = isPast(slot);
                const effectivePast = (teacherView && slot.initiallyBusy) ? false : past;
                if (effectivePast) {
                  if (teacherView && !slot.initiallyBusy) {
                    bgColor = 'bg-orange-50 border border-orange-200';
                    textColor = 'text-orange-700';
                    statusText = 'Booking';
                  } else {
                    bgColor = 'bg-red-50 border border-red-200';
                    textColor = 'text-red-700';
                    statusText = 'Unavailable';
                  }
                } else if (slot.status === 'occupied') {
                  if (teacherView && !slot.initiallyBusy) {
                    bgColor = 'bg-red-50 border border-red-200';
                    textColor = 'text-red-700';
                  } else {
                    bgColor = 'bg-red-600 border border-red-700';
                    textColor = 'text-white';
                  }
                  statusText = 'Busy';
                } else {
                  bgColor = 'bg-green-50 border border-green-200';
                  textColor = 'text-green-700';
                  statusText = 'Available';
                }

                const bookable = canBook && slot.status === 'available' && !effectivePast && (slot.currentBookings < slot.maxBookings);
                return (
                  <div key={`${day}-${slot.start}-${slot.end}`} className={`${bgColor} rounded-lg p-2`}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-800">
                        {slot.start} - {slot.end}
                      </span>
                      <span className={`text-xs font-medium ${textColor} px-2 py-0.5 rounded-full bg-white/50`}>
                        {statusText}
                      </span>
                    </div>
                    {(statusText === 'Available' || statusText === 'Booking') && (
                      <div className="text-xs text-gray-600 mb-1">
                        {slot.currentBookings}/{slot.maxBookings} bookings
                      </div>
                    )}
                    {bookable && (
                      <button
                        className="w-full text-sm px-3 py-1.5 bg-white text-green-600 rounded border border-green-200 hover:bg-green-50 transition-colors font-medium"
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