import React, { useMemo } from 'react';

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

  return (
    <div className="bg-white p-4 rounded shadow overflow-auto">
      <div className="grid" style={{ gridTemplateColumns: `120px repeat(${DAYS.length}, 1fr)` }}>
        <div className="font-medium p-2 border" />
        {DAYS.map((d) => (
          <div key={d} className="font-medium p-2 border text-center">{d}</div>
        ))}
        {/* Times based on union of starts */}
        {(() => {
          const times = Array.from(new Set(slots.map((s) => `${s.start}-${s.end}`))).sort();
          return times.map((t) => (
            <React.Fragment key={t}>
              <div className="p-2 border text-sm flex items-center">{t}</div>
              {DAYS.map((d) => {
                const s = (grouped[d] || []).find((x) => `${x.start}-${x.end}` === t);
                if (!s) return <div key={d} className="border p-2 bg-gray-100"/>;
                const bg = s.status === 'occupied' ? 'bg-slot-occupied text-white' : 'bg-slot-available';
                return (
                  <div key={d} className={`border p-2 ${bg} text-sm space-y-2`}>
                    <div className="flex justify-between">
                      <span>{s.status}</span>
                      <span>{s.currentBookings}/{s.maxBookings}</span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {onToggle && (
                        <button className="px-2 py-1 text-xs bg-white/70 rounded" onClick={() => onToggle(s)}>Toggle</button>
                      )}
                      {onSetLimit && (
                        <button className="px-2 py-1 text-xs bg-white/70 rounded" onClick={() => {
                          const v = prompt('Max bookings', s.maxBookings);
                          if (v) onSetLimit(s, parseInt(v, 10));
                        }}>Set limit</button>
                      )}
                      {canBook && s.status === 'available' && s.currentBookings < s.maxBookings && onBook && (
                        <button className="px-2 py-1 text-xs bg-white rounded" onClick={() => onBook(s)}>Book</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </React.Fragment>
          ));
        })()}
      </div>
    </div>
  );
}
