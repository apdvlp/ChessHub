import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import api, { API_BASE_URL } from "../api/axios";
import {
  CalendarPlus,
  Trophy,
  CalendarCheck2,
  AlertTriangle,
  XCircle,
  Calendar,
  Sparkles,
  UserCheck
} from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total_slots: 0,
    active_slots: 0,
    holiday_shifted: 0,
    cancelled: 0,
    user: null,
  });
  const [holidays, setHolidays] = useState([]);
  const [userBookings, setUserBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, holidaysRes, bookingsRes] = await Promise.all([
          api.get("/dashboard/stats"),
          api.get("/holidays/"),
          api.get("/bookings/"),
        ]);
        setStats(statsRes.data);
        setHolidays(holidaysRes.data);
        setUserBookings(bookingsRes.data);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const user = stats.user || (localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")) : null);

  // Map holidays by date "YYYY-MM-DD"
  const holidayMap = {};
  holidays.forEach((h) => {
    holidayMap[h.date] = h.name;
  });

  // Map user bookings by date "YYYY-MM-DD"
  const bookingMap = {};
  userBookings.forEach((b) => {
    if (b.status !== "Cancelled") {
      bookingMap[b.date] = b;
    }
  });

  // Helper to generate days for a given month in 2026
  const getMonthDays = (year, monthIndex) => {
    const date = new Date(year, monthIndex, 1);
    const days = [];
    const firstDayIndex = date.getDay();
    const totalDays = new Date(year, monthIndex + 1, 0).getDate();

    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    for (let d = 1; d <= totalDays; d++) {
      const monthStr = String(monthIndex + 1).padStart(2, "0");
      const dayStr = String(d).padStart(2, "0");
      const dateStr = `${year}-${monthStr}-${dayStr}`;
      days.push({
        day: d,
        dateStr,
        holiday: holidayMap[dateStr] || null,
        booking: bookingMap[dateStr] || null,
      });
    }
    return days;
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const dayNamesShort = ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <div className="flex min-h-screen bg-[#0D0D11] text-white font-sans">
      <Sidebar />

      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              Tournament <span className="text-[#7C3AED]">Dashboard</span>
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Overview of your tournament schedule, metrics, and official 2026 calendar.
            </p>
          </div>

          <button
            onClick={() => navigate("/bookings/calendar")}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#7C3AED] to-purple-600 hover:from-purple-600 hover:to-indigo-600 text-white font-bold text-sm shadow-xl shadow-purple-900/40 hover:scale-[1.02] active:scale-95 transition"
          >
            <CalendarPlus className="w-5 h-5 text-emerald-400" />
            <span>Book Tournament</span>
          </button>
        </div>

        {/* 1. USER PROFILE BANNER */}
        <div className="relative bg-gradient-to-r from-[#16161E] via-[#20202B] to-[#16161E] border border-gray-800/80 rounded-3xl p-6 md:p-8 mb-8 overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5 text-center md:text-left">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#7C3AED] to-[#10B981] p-1 shadow-xl">
                <div className="w-full h-full rounded-xl bg-[#16161E] flex items-center justify-center overflow-hidden">
                  {user?.profile_picture_url ? (
                    <img
                      src={`${API_BASE_URL}${user.profile_picture_url}`}
                      alt={user.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Trophy className="w-10 h-10 text-emerald-400" />
                  )}
                </div>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-3 justify-center md:justify-start">
                  <h2 className="text-2xl font-bold text-white">
                    {user?.full_name || "Chess Player"}
                  </h2>
                  {/* Badge */}
                  {stats.active_slots > 0 ? (
                    <span className="px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      {stats.active_slots} Active Tournament Slot{stats.active_slots > 1 ? "s" : ""}
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-gray-800 border border-gray-700 text-gray-400 text-xs font-semibold">
                      No Active Tournament
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-3 justify-center md:justify-start">
                  <span>Age: {user?.age ? `${user.age} yrs` : "N/A"}</span>
                  <span>•</span>
                  <span>Gender: {user?.gender || "N/A"}</span>
                  <span>•</span>
                  <span className="text-purple-400">{user?.email}</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate("/bookings/calendar")}
              className="px-6 py-3 rounded-xl bg-[#7C3AED] hover:bg-purple-600 text-white font-bold text-sm shadow-lg shadow-purple-900/40 transition"
            >
              Book Tournament
            </button>
          </div>
        </div>

        {/* 2. 5 METRIC SUMMARY CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
          {/* Card 1: Total Slots */}
          <div className="bg-[#20202B] border border-gray-800/80 rounded-2xl p-5 shadow-lg flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase font-bold text-gray-400 tracking-wider">
                Total Slots
              </p>
              <h3 className="text-3xl font-extrabold text-white mt-1">
                {stats.total_slots}
              </h3>
            </div>
            <div className="w-11 h-11 rounded-xl bg-purple-950/60 border border-purple-800/50 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-purple-400" />
            </div>
          </div>

          {/* Card 2: Active Slots */}
          <div className="bg-[#20202B] border border-gray-800/80 rounded-2xl p-5 shadow-lg flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase font-bold text-gray-400 tracking-wider">
                Active Slots
              </p>
              <h3 className="text-3xl font-extrabold text-emerald-400 mt-1">
                {stats.active_slots}
              </h3>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-950/60 border border-emerald-800/50 flex items-center justify-center">
              <CalendarCheck2 className="w-5 h-5 text-emerald-400" />
            </div>
          </div>

          {/* Card 3: Payment Pending */}
          <div className="bg-[#20202B] border border-gray-800/80 rounded-2xl p-5 shadow-lg flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase font-bold text-gray-400 tracking-wider">
                Payment Pending
              </p>
              <h3 className="text-3xl font-extrabold text-amber-400 mt-1">
                {stats.payment_pending || 0}
              </h3>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-950/60 border border-amber-800/50 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
          </div>

          {/* Card 4: Holiday Shifted */}
          <div className="bg-[#20202B] border border-gray-800/80 rounded-2xl p-5 shadow-lg flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase font-bold text-gray-400 tracking-wider">
                Holiday Shifted
              </p>
              <h3 className="text-3xl font-extrabold text-purple-400 mt-1">
                {stats.holiday_shifted}
              </h3>
            </div>
            <div className="w-11 h-11 rounded-xl bg-purple-950/60 border border-purple-800/50 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
          </div>

          {/* Card 5: Cancelled */}
          <div className="bg-[#20202B] border border-gray-800/80 rounded-2xl p-5 shadow-lg flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase font-bold text-gray-400 tracking-wider">
                Cancelled
              </p>
              <h3 className="text-3xl font-extrabold text-rose-400 mt-1">
                {stats.cancelled}
              </h3>
            </div>
            <div className="w-11 h-11 rounded-xl bg-rose-950/60 border border-rose-800/50 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-rose-400" />
            </div>
          </div>
        </div>

        {/* 3. FULL 12-MONTH YEAR OVERVIEW CALENDAR (2026) */}
        <div className="bg-[#20202B] border border-gray-800/80 rounded-3xl p-6 md:p-8 shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-gray-800/60 pb-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-400" />
                2026 Full Year Tournament Calendar
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Hover over any marked festival/holiday date to view the official holiday name. Booked slots show in <span className="text-emerald-400 font-semibold">Emerald Green</span>, and pending payments in <span className="text-amber-400 font-semibold">Amber Yellow</span>.
              </p>
            </div>

            {/* Calendar Legend */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
                <span className="text-gray-300">Official Festival / Holiday</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
                <span className="text-gray-300">Booked Slot</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
                <span className="text-gray-300">Payment Pending</span>
              </div>
            </div>
          </div>

          {/* 12 Months Grid (3 columns on desktop) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {monthNames.map((monthName, mIndex) => {
              const days = getMonthDays(2026, mIndex);
              return (
                <div
                  key={monthName}
                  className="bg-[#16161E] border border-gray-800/60 rounded-2xl p-4 flex flex-col"
                >
                  <h3 className="text-sm font-bold text-purple-400 mb-3 text-center uppercase tracking-wider">
                    {monthName} 2026
                  </h3>

                  {/* Day names header */}
                  <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-gray-500 mb-2">
                    {dayNamesShort.map((dn, idx) => (
                      <div key={idx}>{dn}</div>
                    ))}
                  </div>

                  {/* Days grid */}
                  <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium">
                    {days.map((item, idx) => {
                      if (!item) {
                        return <div key={`empty-${idx}`} className="h-7"></div>;
                      }

                      const isHoliday = Boolean(item.holiday);
                      const isBooked = Boolean(item.booking);
                      const isPending = isBooked && item.booking.status === "Payment Pending";

                      return (
                        <div
                          key={item.dateStr}
                          title={
                            isHoliday
                              ? `Festival / Holiday: ${item.holiday}`
                              : isBooked
                              ? `Slot (${item.booking.status}): ${item.booking.time_slot}`
                              : item.dateStr
                          }
                          className={`h-7 rounded-lg flex items-center justify-center text-[11px] relative group cursor-pointer transition-all ${
                            isHoliday
                              ? "bg-rose-950/80 text-rose-300 font-bold border border-rose-500/60 shadow-sm shadow-rose-950 hover:bg-rose-900"
                              : isPending
                              ? "bg-amber-950/80 text-amber-300 font-bold border border-amber-500/60 shadow-sm hover:bg-amber-900"
                              : isBooked
                              ? "bg-emerald-950/90 text-emerald-300 font-bold border border-emerald-500/50 shadow-sm hover:bg-emerald-900"
                              : "text-gray-300 hover:bg-[#20202B]"
                          }`}
                        >
                          {item.day}

                          {/* Hover Tooltip for Festival / Holiday */}
                          {isHoliday && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex items-center gap-1 z-50 bg-[#20202B] text-rose-300 text-[10px] font-extrabold px-2.5 py-1 rounded-xl border border-rose-500/80 shadow-2xl whitespace-nowrap pointer-events-none">
                              <span>🎉</span>
                              <span>{item.holiday}</span>
                            </div>
                          )}

                          {isHoliday && (
                            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                          )}
                          {isBooked && !isHoliday && (
                            <span className={`absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full ${isPending ? "bg-amber-400" : "bg-emerald-400"}`}></span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}