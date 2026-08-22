import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getCalendar } from "../api/bookings";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import Loader from "../components/Loader";
import GoogleCalendar from "../components/GoogleCalendar";

export default function CalendarPage() {
  const navigate = useNavigate();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState({
    holidays: [],
    bookings: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCalendar(new Date().getFullYear());
  }, []);

  async function loadCalendar(year = new Date().getFullYear()) {
    try {
      const res = await getCalendar(year);
      setCalendarData({
        holidays: res.data.holidays || [],
        bookings: res.data.bookings || [],
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <Loader />;
  }

  const selectedISO = selectedDate
    ? selectedDate.toISOString().slice(0, 10)
    : "";

  const dayEvents = [
    ...calendarData.holidays
      .filter((h) => h.date === selectedISO)
      .map((h) => ({ type: "Holiday", title: h.name, color: "red" })),
    ...calendarData.bookings
      .filter((b) => b.booking_date === selectedISO)
      .map((b) => ({
        type: "Booking",
        title: `${b.start_time?.slice(0, 5)} Chess Session`,
        color: "blue",
      })),
  ];

  return (
    <>
      <Navbar />

      <div className="flex min-h-screen bg-gray-100">
        <Sidebar />

        <main className="flex-1 p-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-800">
              📅 Sessions Calendar
            </h1>

            <button
              onClick={() => navigate("/plans")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold shadow"
            >
              Book a Session
            </button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Calendar */}
            <div className="xl:col-span-2">
              <GoogleCalendar
                holidays={calendarData.holidays}
                bookings={calendarData.bookings}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                onYearChange={loadCalendar}
              />
            </div>

            {/* Selected day details */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 h-fit">
              <h2 className="text-xl font-bold text-gray-800 mb-1">
                {selectedDate.toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </h2>

              <p className="text-sm text-gray-500 mb-6">
                {dayEvents.length === 0
                  ? "No sessions scheduled for this day."
                  : `${dayEvents.length} session${dayEvents.length > 1 ? "s" : ""} scheduled`}
              </p>

              {dayEvents.length === 0 ? (
                <div className="bg-gray-50 rounded-xl p-6 text-center text-gray-500">
                  <p className="text-3xl mb-2">🗓️</p>
                  <p className="font-medium">This day is wide open.</p>
                  <p className="text-sm mt-1">
                    Book a chess session to get started.
                  </p>

                  <button
                    onClick={() => navigate("/plans")}
                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold"
                  >
                    Book Now
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {dayEvents.map((event, index) => (
                    <div
                      key={index}
                      className={`flex items-start gap-3 rounded-xl p-4 ${
                        event.color === "red"
                          ? "bg-red-50 border border-red-200"
                          : "bg-blue-50 border border-blue-200"
                      }`}
                    >
                      <span
                        className={`w-2.5 h-2.5 rounded-full mt-1.5 ${
                          event.color === "red" ? "bg-red-500" : "bg-blue-500"
                        }`}
                      />

                      <div>
                        <p
                          className={`text-xs font-semibold uppercase tracking-wide ${
                            event.color === "red" ? "text-red-600" : "text-blue-600"
                          }`}
                        >
                          {event.type}
                        </p>

                        <p className="text-gray-800 font-medium mt-0.5">
                          {event.title}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
