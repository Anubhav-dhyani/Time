import React, { useMemo, useState } from 'react';

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

export default function Timetable({ slots = [], onSetLimit, onBook, canBook = false, onToggle, isPastSlot }) {
  const grouped = useMemo(() => groupByDay(slots), [slots]);
  const [selectedDay, setSelectedDay] = useState(null);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div className="bg-white rounded-xl shadow-md border border-blue-100 p-4 md:p-6">
      {isMobile && (
        <div className="mb-4 md:hidden">
          <label htmlFor="day-select" className="block text-sm font-medium text-blue-800 mb-2">
            Select Day
          </label>
          <select
            id="day-select"
            className="w-full p-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={selectedDay || ''}
            onChange={(e) => setSelectedDay(e.target.value)}
          >
            <option value="">All Days</option>
            {DAYS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      )}

      <div className={`${isMobile ? 'hidden md:grid' : 'grid'}`} style={{ gridTemplateColumns: `120px repeat(${DAYS.length}, 1fr)` }}>
        <div className="font-medium p-2 border-b-2 border-blue-200 text-blue-800" />
        {DAYS.map((d) => (
          <div key={d} className="font-medium p-2 border-b-2 border-blue-200 text-blue-800 text-center">{d}</div>
        ))}

        {(() => {
          const times = Array.from(new Set(slots.map((s) => `${s.start}-${s.end}`))).sort();
          return times.map((t) => (
            <React.Fragment key={t}>
              <div className="p-3 border-b border-blue-100 text-sm flex items-center justify-center bg-blue-50 text-blue-700 font-medium">
                {t.replace('-', ' - ')}
              </div>
              {DAYS.map((d) => {
                const s = (grouped[d] || []).find((x) => `${x.start}-${x.end}` === t);
                if (!s) return <div key={d} className="border-b border-blue-100 p-2 bg-blue-50" />;

                let bg, textColor, statusText;
                if (s.currentBookings > 0) {
                  bg = 'bg-red-100 border-red-200';
                  textColor = 'text-red-800';
                  statusText = 'Booked';
                } else if (s.status === 'occupied') {
                  bg = 'bg-red-600 border-red-700';
                  textColor = 'text-white';
                  statusText = 'Busy (Setup)';
                } else {
                  bg = 'bg-green-100 border-green-200';
                  textColor = 'text-green-800';
                  statusText = 'Available';
                }

                return (
                  <div key={d} className={`border-b border-blue-100 p-3 ${bg} text-sm space-y-2 transition-all duration-200 hover:shadow-md`}>
                    <div className="flex justify-between items-center">
                      <span className={`text-xs font-medium ${textColor}`}>
                        {statusText}
                      </span>
                      <span className="text-xs font-semibold bg-white px-2 py-1 rounded-full">
                        {s.currentBookings}/{s.maxBookings}
                      </span>
                    </div>
                    <div className="flex gap-2 flex-wrap justify-center">
                      {onSetLimit && (
                        <button
                          className="px-2 py-1 text-xs bg-white text-blue-600 rounded-lg transition-colors duration-200 hover:bg-blue-100"
                          onClick={() => {
                            const v = prompt('Max bookings', s.maxBookings);
                            if (v) onSetLimit(s, parseInt(v, 10));
                          }}
                        >
                          Set limit
                        </button>
                      )}
                      {onToggle && (
                        <button
                          className={`px-2 py-1 text-xs bg-white rounded-lg transition-colors duration-200 font-medium ${s.status === 'occupied' ? 'text-red-700 hover:bg-red-100' : 'text-green-700 hover:bg-green-100'}`}
                          onClick={() => onToggle(s)}
                        >
                          {s.status === 'occupied' ? 'Mark Available' : 'Mark Busy'}
                        </button>
                      )}
                      {canBook && s.status === 'available' && s.currentBookings < s.maxBookings && (!isPastSlot || !isPastSlot(s)) && onBook && (
                        <button
                          className="px-3 py-1 text-xs bg-white text-green-600 rounded-lg transition-colors duration-200 hover:bg-green-100 font-medium"
                          onClick={() => onBook(s)}
                        >
                          Book Now
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </React.Fragment>
          ));
        })()}
      </div>

      {isMobile && (
        <div className="md:hidden space-y-4">
          {(selectedDay ? [selectedDay] : DAYS).map((d) => (
            <div key={d} className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-medium text-blue-800 text-center mb-3">{d}</h3>
              <div className="space-y-3">
                {(grouped[d] || []).map((s) => {
                  let bg, textColor, statusText;
                  if (s.currentBookings > 0) {
                    bg = 'bg-red-100 border-red-200';
                    textColor = 'text-red-800';
                    statusText = 'Booked';
                  } else if (s.status === 'occupied') {
                    bg = 'bg-red-600 border-red-700';
                    textColor = 'text-white';
                    statusText = 'Busy (Setup)';
                  } else {
                    bg = 'bg-green-100 border-green-200';
                    textColor = 'text-green-800';
                    statusText = 'Available';
                  }

                  return (
                    <div key={`${d}-${s.start}-${s.end}`} className={`p-3 rounded-lg border ${bg} space-y-2`}>
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{s.start} - {s.end}</span>
                        <span className={`text-xs font-medium ${textColor}`}>
                          {statusText}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs">
                          Bookings: {s.currentBookings}/{s.maxBookings}
                        </span>
                        <div className="flex gap-2">
                          {onSetLimit && (
                            <button
                              className="px-2 py-1 text-xs bg-white text-blue-600 rounded transition-colors duration-200 hover:bg-blue-100"
                              onClick={() => {
                                const v = prompt('Max bookings', s.maxBookings);
                                if (v) onSetLimit(s, parseInt(v, 10));
                              }}
                            >
                              Set limit
                            </button>
                          )}
                          {onToggle && (
                            <button
                              className={`px-2 py-1 text-xs bg-white rounded transition-colors duration-200 font-medium ${s.status === 'occupied' ? 'text-red-700 hover:bg-red-100' : 'text-green-700 hover:bg-green-100'}`}
                              onClick={() => onToggle(s)}
                            >
                              {s.status === 'occupied' ? 'Mark Available' : 'Mark Busy'}
                            </button>
                          )}
                          {canBook && s.status === 'available' && s.currentBookings < s.maxBookings && (!isPastSlot || !isPastSlot(s)) && onBook && (
                            <button
                              className="px-3 py-1 text-xs bg-white text-green-600 rounded transition-colors duration-200 hover:bg-green-100 font-medium"
                              onClick={() => onBook(s)}
                            >
                              Book
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}