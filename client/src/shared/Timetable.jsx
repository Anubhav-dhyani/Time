import React, { useMemo, useState } from 'react';

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI'];

function groupByDay(slots) {
  const byDay = Object.fromEntries(DAYS.map((d) => [d, []]));
  for (const s of slots) {
    if (!byDay[s.day]) byDay[s.day] = [];
    byDay[s.day].push(s);
  }
  for (const d of DAYS) {
    byDay[d].sort((a, b) => a.start.localeCompare(b.start));
  }
  return byDay;
}

export default function Timetable({ slots = [], onToggle, onSetLimit, onBook, canBook = false }) {
  const grouped = useMemo(() => groupByDay(slots), [slots]);
  const [selectedDay, setSelectedDay] = useState(null);
  
  // For mobile view, show only one day at a time
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div className="bg-white rounded-xl shadow-md border border-blue-100 p-4 md:p-6">
      {/* Mobile Day Selector */}
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

      <div className={`${isMobile ? 'hidden md:grid' : 'grid'}`} 
           style={{ gridTemplateColumns: `120px repeat(${DAYS.length}, 1fr)` }}>
        {/* Desktop Header */}
        <div className="font-medium p-2 border-b-2 border-blue-200 text-blue-800" />
        {DAYS.map((d) => (
          <div key={d} className="font-medium p-2 border-b-2 border-blue-200 text-blue-800 text-center">{d}</div>
        ))}
        
        {/* Times based on union of starts */}
        {(() => {
          const times = Array.from(new Set(slots.map((s) => `${s.start}-${s.end}`))).sort();
          return times.map((t) => (
            <React.Fragment key={t}>
              <div className="p-3 border-b border-blue-100 text-sm flex items-center justify-center bg-blue-50 text-blue-700 font-medium">
                {t.replace('-', ' - ')}
              </div>
              {DAYS.map((d) => {
                const s = (grouped[d] || []).find((x) => `${x.start}-${x.end}` === t);
                if (!s) return <div key={d} className="border-b border-blue-100 p-2 bg-blue-50"/>;
                
                const bg = s.status === 'occupied' 
                  ? 'bg-red-100 border-red-200' 
                  : 'bg-green-100 border-green-200';
                
                const textColor = s.status === 'occupied' 
                  ? 'text-red-800' 
                  : 'text-green-800';
                
                return (
                  <div key={d} className={`border-b border-blue-100 p-3 ${bg} text-sm space-y-2 transition-all duration-200 hover:shadow-md`}>
                    <div className="flex justify-between items-center">
                      <span className={`text-xs font-medium ${textColor}`}>
                        {s.status === 'occupied' ? 'Booked' : 'Available'}
                      </span>
                      <span className="text-xs font-semibold bg-white px-2 py-1 rounded-full">
                        {s.currentBookings}/{s.maxBookings}
                      </span>
                    </div>
                    <div className="flex gap-2 flex-wrap justify-center">
                      {onToggle && (
                        <button 
                          className="px-2 py-1 text-xs bg-blue-600 text-white rounded-lg transition-colors duration-200 hover:bg-blue-700"
                          onClick={() => onToggle(s)}
                        >
                          Toggle
                        </button>
                      )}
                      {onSetLimit && (
                        <button 
                          className="px-2 py-1 text-xs bg-blue-600 text-white rounded-lg transition-colors duration-200 hover:bg-blue-700"
                          onClick={() => {
                            const v = prompt('Max bookings', s.maxBookings);
                            if (v) onSetLimit(s, parseInt(v, 10));
                          }}
                        >
                          Set limit
                        </button>
                      )}
                      {canBook && s.status === 'available' && s.currentBookings < s.maxBookings && onBook && (
                        <button 
                          className="px-3 py-1 text-xs bg-green-600 text-white rounded-lg transition-colors duration-200 hover:bg-green-700 font-medium"
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

      {/* Mobile View (one day at a time) */}
      {isMobile && (
        <div className="md:hidden space-y-4">
          {(selectedDay ? [selectedDay] : DAYS).map((d) => (
            <div key={d} className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-medium text-blue-800 text-center mb-3">{d}</h3>
              <div className="space-y-3">
                {(grouped[d] || []).map((s) => {
                  const bg = s.status === 'occupied' 
                    ? 'bg-red-100 border-red-200' 
                    : 'bg-green-100 border-green-200';
                  
                  const textColor = s.status === 'occupied' 
                    ? 'text-red-800' 
                    : 'text-green-800';
                  
                  return (
                    <div key={`${d}-${s.start}-${s.end}`} className={`p-3 rounded-lg border ${bg} space-y-2`}>
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{s.start} - {s.end}</span>
                        <span className={`text-xs font-medium ${textColor}`}>
                          {s.status === 'occupied' ? 'Booked' : 'Available'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs">
                          Bookings: {s.currentBookings}/{s.maxBookings}
                        </span>
                        <div className="flex gap-2">
                          {onToggle && (
                            <button 
                              className="px-2 py-1 text-xs bg-blue-600 text-white rounded transition-colors duration-200 hover:bg-blue-700"
                              onClick={() => onToggle(s)}
                            >
                              Toggle
                            </button>
                          )}
                          {onSetLimit && (
                            <button 
                              className="px-2 py-1 text-xs bg-blue-600 text-white rounded transition-colors duration-200 hover:bg-blue-700"
                              onClick={() => {
                                const v = prompt('Max bookings', s.maxBookings);
                                if (v) onSetLimit(s, parseInt(v, 10));
                              }}
                            >
                              Set limit
                            </button>
                          )}
                          {canBook && s.status === 'available' && s.currentBookings < s.maxBookings && onBook && (
                            <button 
                              className="px-3 py-1 text-xs bg-green-600 text-white rounded transition-colors duration-200 hover:bg-green-700 font-medium"
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