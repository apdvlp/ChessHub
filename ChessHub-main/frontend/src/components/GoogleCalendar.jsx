import { useState } from "react";
import { buildCalendar, monthName, toISO } from "../utils/calendarUtils";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const EVENT_COLORS = [
  { bg: "#1a73e8", text: "#ffffff" }, // Google Blue
  { bg: "#0b8043", text: "#ffffff" }, // Green
  { bg: "#f4511e", text: "#ffffff" }, // Orange
  { bg: "#d50000", text: "#ffffff" }, // Red
  { bg: "#8e24aa", text: "#ffffff" }, // Purple
  { bg: "#188038", text: "#ffffff" }, // Dark Green
];

export default function GoogleCalendar({
  holidays = [],
  bookings = [],
  selectedDate,
  onSelectDate,
  onYearChange,
}) {
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());

  const grid = buildCalendar(year, month);
  const todayISO = toISO(new Date());

  // Build a map of events per date
  const eventsByDate = {};
  holidays.forEach((h) => {
    if (!eventsByDate[h.date]) eventsByDate[h.date] = [];
    eventsByDate[h.date].push({
      type: "holiday",
      title: h.name,
      color: "#e53935",
    });
  });

  bookings.forEach((b) => {
    if (!eventsByDate[b.booking_date]) eventsByDate[b.booking_date] = [];
    eventsByDate[b.booking_date].push({
      type: "booking",
      title: `${b.start_time?.slice(0, 5)}`,
      color: "#1a73e8",
    });
  });

  function previous() {
    if (month === 0) {
      const y = year - 1;
      setMonth(11);
      setYear(y);
      onYearChange?.(y);
    } else {
      setMonth(month - 1);
    }
  }

  function next() {
    if (month === 11) {
      const y = year + 1;
      setMonth(0);
      setYear(y);
      onYearChange?.(y);
    } else {
      setMonth(month + 1);
    }
  }

  function goToday() {
    setMonth(new Date().getMonth());
    setYear(new Date().getFullYear());
    onYearChange?.(new Date().getFullYear());
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <button
            onClick={goToday}
            className="border border-gray-300 rounded-lg px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Today
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={previous}
              className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-600"
              aria-label="Previous month"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <button
              onClick={next}
              className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-600"
              aria-label="Next month"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          <h2 className="text-2xl font-semibold text-gray-800">
            {monthName(month)} {year}
          </h2>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full inline-block" style={{ background: "#e53935" }} />
            Holiday
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full inline-block" style={{ background: "#1a73e8" }} />
            Booking
          </span>
        </div>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-sm font-medium text-gray-500"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 auto-rows-fr">
        {grid.map((day, index) => {
          if (!day) {
            return <div key={index} className="border-r border-b border-gray-100 bg-gray-50/50 min-h-27.5" />;
          }

          const iso = toISO(day);
          const isToday = iso === todayISO;
          const isSelected = selectedDate && toISO(selectedDate) === iso;
          const events = eventsByDate[iso] || [];
          const dayOfMonth = day.getDate();

          return (
            <div
              key={index}
              onClick={() => onSelectDate?.(day)}
              className={`border-r border-b border-gray-100 min-h-27.5 p-1.5 cursor-pointer transition-colors ${
                isSelected ? "bg-blue-50 ring-2 ring-inset ring-blue-400" : "hover:bg-gray-50"
              }`}
            >
              <div className="flex items-start justify-between">
                <span
                  className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium ${
                    isToday
                      ? "bg-blue-600 text-white"
                      : isSelected
                      ? "bg-blue-600 text-white"
                      : "text-gray-700"
                  }`}
                >
                  {day.getDate()}
                </span>

                {events.length > 0 && (
                  <span className="text-[10px] text-gray-400 font-medium">
                    {events.length} {events.length === 1 ? "event" : "events"}
                  </span>
                )}
              </div>

              <div className="mt-1 space-y-0.5">
                {events.slice(0, 3).map((event, i) => (
                  <div
                    key={i}
                    className="px-1.5 py-0.5 rounded text-[11px] font-medium truncate flex items-center justify-between gap-1"
                    style={{ background: event.color, color: "#fff" }}
                    title={event.title}
                  >
                    <span className="truncate">{event.title}</span>
                    {event.type === "holiday" && (
                      <span className="text-[8px] uppercase font-bold bg-black/40 px-1 rounded shrink-0">
                        Disabled
                      </span>
                    )}
                  </div>
                ))}

                {events.length > 3 && (
                  <div className="px-1.5 text-[11px] text-gray-500 font-medium">
                    +{events.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
