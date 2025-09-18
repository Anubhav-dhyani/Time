import React, { useMemo } from 'react';

// --- No changes to the logic part ---
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

  // Unified slot status/color logic (borders are removed from here and applied to the table cells)
  function getSlotDisplay(slot, context) {
    const permanentBusy = Boolean(slot.initiallyBusy);
    const busy = slot.status === 'occupied';
    const past = isPast(slot);
    if (permanentBusy) {
      return { // Dark Red for "Class"
        bgColor: 'bg-red-600',
        textColor: 'text-white',
        statusText: 'Class',
        showBookings: true,
      };
    }
    if (busy) {
      return { // Light Red for "Busy"
        bgColor: 'bg-red-100',
        textColor: 'text-red-800',
        statusText: 'Busy',
        showBookings: true,
      };
    }
    if (context === 'teacher' && past) {
        return { // Orange for past Teacher slots
          bgColor: 'bg-orange-100',
          textColor: 'text-orange-800',
          statusText: 'Booking',
          showBookings: true,
        };
    }
    if (context === 'student' && past) {
      return { // Yellow for past Student slots
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-800',
        statusText: 'Unavailable',
        showBookings: true,
      };
    }
    return { // Green for "Available"
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
      statusText: 'Available',
      showBookings: true,
    };
  }

  const times = useMemo(() => {
    const timeSet = new Set();
    normalizedSlots.forEach(slot => {
      timeSet.add(`${slot.start}-${slot.end}`);
    });
    return Array.from(timeSet).sort();
  }, [normalizedSlots]);

  // --- Start of the new redesigned JSX ---
  return (
    <div className="bg-white rounded-lg border border-gray-300 shadow-sm p-1 sm:p-2">
      <div className="overflow-x-auto">
        {/* --- DESKTOP VIEW --- */}
        <div className="hidden md:block">
            <table className="w-full border-collapse text-center">
            <thead>
                <tr className="bg-gray-100">
                <th className="sticky left-0 bg-gray-100 z-10 p-2 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider border-2 border-gray-300 w-32">
                    Time
                </th>
                {DAYS.map(day => (
                    <th key={day} className="p-2 text-sm font-semibold text-gray-700 uppercase tracking-wider border-2 border-gray-300 min-w-[140px]">
                    {day}
                    </th>
                ))}
                </tr>
            </thead>
            <tbody>
                {times.map((time, index) => (
                <tr key={time} className="even:bg-white odd:bg-gray-50">
                    <td className="sticky left-0 z-10 p-2 text-sm font-semibold text-gray-800 whitespace-nowrap border-2 border-gray-300" style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f9fafb' }}>
                    {time.replace('-', ' - ')}
                    </td>
                    {DAYS.map(day => {
                    const slot = (grouped[day] || []).find(s => `${s.start}-${s.end}` === time);
                    if (!slot) {
                        return (
                        <td key={`${day}-${time}`} className="border-2 border-gray-300"></td>
                        );
                    }
                    
                    const context = teacherView ? 'teacher' : 'student';
                    const { bgColor, textColor, statusText, showBookings } = getSlotDisplay(slot, context);
                    const bookable = canBook && statusText === 'Available' && (slot.currentBookings < slot.maxBookings);

                    return (
                        <td key={`${day}-${time}`} className={`p-2 align-middle border-2 border-gray-300 ${bgColor}`}>
                        <div className="flex flex-col h-full items-center justify-center">
                            <div className={`text-base font-bold ${textColor}`}>
                            {statusText}
                            </div>
                            {showBookings && (
                            <div className="text-sm text-gray-600 mt-1">
                                {slot.currentBookings} / {slot.maxBookings}
                            </div>
                            )}
                            <div className="flex-grow"></div> {/* Pushes button to the bottom if content is sparse */}
                            {bookable && (
                            <button
                                className="w-full mt-2 text-sm px-3 py-1 bg-white text-green-700 rounded-md border border-green-400 hover:bg-green-50 transition-colors font-semibold shadow-sm"
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

        {/* --- MOBILE VIEW --- */}
        <div className="md:hidden">
            {DAYS.map(day => (
            <div key={day} className="mb-4">
                <div className="bg-gray-100 p-2 rounded-t-lg border-x-2 border-t-2 border-gray-300">
                    <h3 className="text-base font-bold text-gray-800 text-center">{day}</h3>
                </div>
                <div className="border-2 border-t-0 border-gray-300 rounded-b-lg p-2 space-y-2">
                {(grouped[day] || []).length > 0 ? (
                    (grouped[day] || []).map(slot => {
                        const context = teacherView ? 'teacher' : 'student';
                        const { bgColor, textColor, statusText, showBookings } = getSlotDisplay(slot, context);
                        const bookable = canBook && statusText === 'Available' && (slot.currentBookings < slot.maxBookings);
                        return (
                        <div key={`${day}-${slot.start}`} className={`${bgColor} rounded-md p-3 shadow-sm border border-gray-300`}>
                            <div className="flex justify-between items-center mb-1.5">
                            <span className="text-base font-bold text-gray-900">
                                {slot.start} - {slot.end}
                            </span>
                            <span className={`text-sm font-semibold ${textColor}`}>
                                {statusText}
                            </span>
                            </div>
                            {showBookings && (
                            <div className="text-sm text-gray-600 mb-2">
                                Bookings: {slot.currentBookings}/{slot.maxBookings}
                            </div>
                            )}
                            {bookable && (
                            <button
                                className="w-full text-base px-3 py-1.5 bg-white text-green-700 rounded-md border-2 border-green-400 hover:bg-green-50 transition-colors font-bold"
                                onClick={() => onBook && onBook(slot)}
                            >
                                Book Now
                            </button>
                            )}
                        </div>
                        );
                    })
                ) : (
                    <div className="text-center text-sm text-gray-500 py-4">No slots available.</div>
                )}
                </div>
            </div>
            ))}
        </div>
      </div>
    </div>
  );
}