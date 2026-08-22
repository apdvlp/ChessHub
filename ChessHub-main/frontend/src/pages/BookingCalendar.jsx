import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import api from "../api/axios";
import {
  Calendar as CalendarIcon,
  Clock,
  Check,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CreditCard,
  Tag,
  Sparkles,
  Ban
} from "lucide-react";

// Helper to compute a default 1-hour slot from start hour, minute & ampm
function formatOneHourSlot(hourStr, minuteStr, ampmStr) {
  let h = parseInt(hourStr, 10);
  if (ampmStr === "PM" && h < 12) h += 12;
  if (ampmStr === "AM" && h === 12) h = 0;

  const startMinutes = h * 60 + parseInt(minuteStr, 10);
  const endMinutes = (startMinutes + 60) % 1440;

  const formatTime = (totalMin) => {
    let hh = Math.floor(totalMin / 60);
    const mm = String(totalMin % 60).padStart(2, "0");
    const period = hh >= 12 ? "PM" : "AM";
    let dispH = hh % 12;
    if (dispH === 0) dispH = 12;
    const dispHStr = String(dispH).padStart(2, "0");
    return `${dispHStr}:${mm} ${period}`;
  };

  return `${formatTime(startMinutes)} - ${formatTime(endMinutes)}`;
}

export default function BookingCalendar() {
  const navigate = useNavigate();

  // Selected Plan: "Basic", "Monthly", "Custom"
  const [activePlan, setActivePlan] = useState("Basic");

  // Selected dates array: ["YYYY-MM-DD", ...]
  const [selectedDates, setSelectedDates] = useState([]);

  // Time picker state
  const [hour, setHour] = useState("10");
  const [minute, setMinute] = useState("00");
  const [ampm, setAmPm] = useState("AM");

  // Monthly Premium weekdays state (up to 2 weekdays e.g. [1, 3] for Mon, Wed)
  const [selectedWeekdays, setSelectedWeekdays] = useState([]);

  // Validation alert message
  const [validationAlert, setValidationAlert] = useState("");

  // Holidays and occupied slots from backend
  const [holidays, setHolidays] = useState([]);
  const [occupiedSlots, setOccupiedSlots] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(2); // 0-indexed: 2 = March 2026
  const [currentYear, setCurrentYear] = useState(2026);

  useEffect(() => {
    async function fetchData() {
      try {
        const [holidaysRes, occupiedRes] = await Promise.all([
          api.get("/holidays/"),
          api.get("/bookings/occupied-slots")
        ]);
        setHolidays(holidaysRes.data);
        setOccupiedSlots(occupiedRes.data);
      } catch (err) {
        console.error("Error fetching calendar data:", err);
      }
    }
    fetchData();
  }, []);

  const holidayMap = {};
  holidays.forEach((h) => {
    holidayMap[h.date] = h.name;
  });

  // Default 1-Hour Time Slot generator (e.g., "10:00 AM - 11:00 AM")
  const formattedTimeSlot = formatOneHourSlot(hour, minute, ampm);

  // Helper to check if a date + timeSlot is already occupied by another active booking
  const checkSlotOccupied = (dateStr, timeSlotStr) => {
    return occupiedSlots.some((s) => s.date === dateStr && s.time_slot === timeSlotStr);
  };

  // Automatically re-validate selected dates when timing (1-hour slot) changes
  useEffect(() => {
    if (selectedDates.length === 0) return;
    const invalidDates = selectedDates.filter((d) => checkSlotOccupied(d, formattedTimeSlot));
    if (invalidDates.length > 0) {
      setSelectedDates((prev) => prev.filter((d) => !invalidDates.includes(d)));
      setValidationAlert(
        `The slot '${formattedTimeSlot}' is already booked on ${invalidDates.join(", ")}. Dates deselected. Try another time slot or date.`
      );
    }
  }, [formattedTimeSlot, occupiedSlots]);

  // Reset selected dates when switching plan
  const handlePlanChange = (plan) => {
    setActivePlan(plan);
    setSelectedDates([]);
    setSelectedWeekdays([]);
    setValidationAlert("");
  };

  // Toggle date selection on calendar
  const handleDateClick = (dateStr, holidayName) => {
    if (holidayName) {
      setValidationAlert(`Booking is disabled on official holidays: ${holidayName} (${dateStr}). Please select an available date.`);
      return;
    }

    if (checkSlotOccupied(dateStr, formattedTimeSlot)) {
      setValidationAlert(`The 1-hour slot '${formattedTimeSlot}' on ${dateStr} is already booked by another player. Please select another time or date.`);
      return;
    }

    setValidationAlert("");

    if (activePlan === "Basic") {
      // Basic plan allows exactly 1 date
      setSelectedDates([dateStr]);
    } else if (activePlan === "Custom") {
      if (selectedDates.includes(dateStr)) {
        setSelectedDates(selectedDates.filter((d) => d !== dateStr));
      } else {
        if (selectedDates.length >= 8) {
          setValidationAlert("Custom Plan allows a maximum of 8 specific dates.");
          return;
        }
        setSelectedDates([...selectedDates, dateStr]);
      }
    }
  };

  // Handle Monthly Premium weekday selection (auto-populates 8 recurring dates, skipping holidays & occupied slots)
  const toggleWeekday = (dayIndex) => {
    let updated = [];
    if (selectedWeekdays.includes(dayIndex)) {
      updated = selectedWeekdays.filter((w) => w !== dayIndex);
    } else {
      if (selectedWeekdays.length >= 2) {
        setValidationAlert("Monthly Premium plan allows selecting up to 2 recurring weekdays.");
        return;
      }
      updated = [...selectedWeekdays, dayIndex];
    }
    setSelectedWeekdays(updated);
    setValidationAlert("");

    // Auto populate dates for current month up to 8 slots (skipping holidays & occupied slots)
    if (updated.length === 0) {
      setSelectedDates([]);
      return;
    }

    const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const autoDates = [];

    for (let d = 1; d <= totalDaysInMonth; d++) {
      const dt = new Date(currentYear, currentMonth, d);
      const dayOfWeek = dt.getDay(); // 0 = Sun, 1 = Mon ...
      if (updated.includes(dayOfWeek)) {
        const monthStr = String(currentMonth + 1).padStart(2, "0");
        const dayStr = String(d).padStart(2, "0");
        const dateStr = `${currentYear}-${monthStr}-${dayStr}`;
        if (!holidayMap[dateStr] && !checkSlotOccupied(dateStr, formattedTimeSlot)) {
          autoDates.push(dateStr);
          if (autoDates.length >= 8) break;
        }
      }
    }

    setSelectedDates(autoDates);
  };

  // Price calculation
  const getPrice = () => {
    if (activePlan === "Basic") return 300;
    if (activePlan === "Monthly") return 2400;
    if (activePlan === "Custom") return selectedDates.length * 300;
    return 0;
  };

  // Proceed to payment simulation
  const handleConfirmBooking = () => {
    if (selectedDates.length === 0) {
      setValidationAlert("Please select at least one tournament slot date.");
      return;
    }

    if (activePlan === "Custom" && selectedDates.length > 8) {
      setValidationAlert("Custom Plan maximum limit is 8 slots.");
      return;
    }

    const bookingPayload = {
      plan_type: activePlan === "Basic" ? "Basic" : activePlan === "Monthly" ? "Monthly Premium" : "Custom",
      time_slot: formattedTimeSlot,
      price_per_slot: activePlan === "Monthly" ? 300 : 300,
      total_price: getPrice(),
      dates: selectedDates,
    };

    sessionStorage.setItem("pending_booking", JSON.stringify(bookingPayload));
    navigate("/bookings/payment");
  };

  // Calendar Helper functions
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

  const calendarDays = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const monthStr = String(currentMonth + 1).padStart(2, "0");
    const dayStr = String(d).padStart(2, "0");
    const dateStr = `${currentYear}-${monthStr}-${dayStr}`;
    calendarDays.push({
      day: d,
      dateStr,
      holiday: holidayMap[dateStr] || null,
    });
  }

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const weekdaysList = [
    { label: "Sun", val: 0 },
    { label: "Mon", val: 1 },
    { label: "Tue", val: 2 },
    { label: "Wed", val: 3 },
    { label: "Thu", val: 4 },
    { label: "Fri", val: 5 },
    { label: "Sat", val: 6 },
  ];

  return (
    <div className="flex min-h-screen bg-[#0D0D11] text-white font-sans">
      <Sidebar />

      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            Tournament <span className="text-[#7C3AED]">Booking System</span>
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Choose a plan, pick your time slot, and select tournament dates on the interactive calendar.
          </p>
        </div>

        {/* 1. PLAN SELECTOR TABS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          {/* Plan 1: Basic */}
          <div
            onClick={() => handlePlanChange("Basic")}
            className={`cursor-pointer bg-[#20202B] border rounded-2xl p-5 transition-all duration-200 relative overflow-hidden ${
              activePlan === "Basic"
                ? "border-[#7C3AED] shadow-xl shadow-purple-950/50 bg-gradient-to-b from-[#20202B] to-[#16161E]"
                : "border-gray-800/80 hover:border-gray-700"
            }`}
          >
            {activePlan === "Basic" && (
              <span className="absolute top-0 right-0 bg-[#7C3AED] text-white text-[10px] uppercase font-extrabold px-3 py-1 rounded-bl-xl">
                Selected
              </span>
            )}
            <h3 className="text-lg font-bold text-white">Basic Plan</h3>
            <p className="text-2xl font-black text-emerald-400 my-1">₹300</p>
            <p className="text-xs text-gray-400">Single slot tournament entry.</p>
          </div>

          {/* Plan 2: Monthly Premium */}
          <div
            onClick={() => handlePlanChange("Monthly")}
            className={`cursor-pointer bg-[#20202B] border rounded-2xl p-5 transition-all duration-200 relative overflow-hidden ${
              activePlan === "Monthly"
                ? "border-[#7C3AED] shadow-xl shadow-purple-950/50 bg-gradient-to-b from-[#20202B] to-[#16161E]"
                : "border-gray-800/80 hover:border-gray-700"
            }`}
          >
            {activePlan === "Monthly" && (
              <span className="absolute top-0 right-0 bg-[#7C3AED] text-white text-[10px] uppercase font-extrabold px-3 py-1 rounded-bl-xl">
                Selected
              </span>
            )}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-1.5">
                Monthly Premium <Sparkles className="w-4 h-4 text-amber-400 inline" />
              </h3>
            </div>
            <p className="text-2xl font-black text-emerald-400 my-1">₹2400</p>
            <p className="text-xs text-gray-400">
              8 slots auto-populated for selected recurring weekdays.
            </p>
          </div>

          {/* Plan 3: Custom */}
          <div
            onClick={() => handlePlanChange("Custom")}
            className={`cursor-pointer bg-[#20202B] border rounded-2xl p-5 transition-all duration-200 relative overflow-hidden ${
              activePlan === "Custom"
                ? "border-[#7C3AED] shadow-xl shadow-purple-950/50 bg-gradient-to-b from-[#20202B] to-[#16161E]"
                : "border-gray-800/80 hover:border-gray-700"
            }`}
          >
            {activePlan === "Custom" && (
              <span className="absolute top-0 right-0 bg-[#7C3AED] text-white text-[10px] uppercase font-extrabold px-3 py-1 rounded-bl-xl">
                Selected
              </span>
            )}
            <h3 className="text-lg font-bold text-white">Custom Plan</h3>
            <p className="text-2xl font-black text-emerald-400 my-1">₹300 / slot</p>
            <p className="text-xs text-gray-400">
              Pick up to a maximum of 8 specific tournament dates.
            </p>
          </div>
        </div>

        {/* Validation Alert Banner */}
        {validationAlert && (
          <div className="mb-6 p-4 rounded-xl bg-amber-950/80 border border-amber-500/50 text-amber-300 text-xs flex items-center gap-2.5 shadow-lg">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <span className="font-medium">{validationAlert}</span>
          </div>
        )}

        {/* MAIN SCHEDULING AREA GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column (2 cols): Time Picker & Interactive Calendar */}
          <div className="lg:col-span-2 space-y-6">
            {/* TIME PICKER CARD */}
            <div className="bg-[#20202B] border border-gray-800/80 rounded-2xl p-6 shadow-xl">
              <h3 className="text-sm uppercase tracking-wider font-extrabold text-gray-300 flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-[#7C3AED]" />
                Select Tournament Time Slot
              </h3>

              <div className="flex flex-wrap items-center gap-4">
                {/* Hour selector */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 mb-1">
                    Hour
                  </label>
                  <select
                    value={hour}
                    onChange={(e) => setHour(e.target.value)}
                    className="bg-[#16161E] border border-gray-700 rounded-xl px-4 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-[#7C3AED]"
                  >
                    {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <span className="text-xl font-bold text-gray-500 mt-5">:</span>

                {/* Minute selector */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 mb-1">
                    Minute
                  </label>
                  <select
                    value={minute}
                    onChange={(e) => setMinute(e.target.value)}
                    className="bg-[#16161E] border border-gray-700 rounded-xl px-4 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-[#7C3AED]"
                  >
                    <option value="00">00</option>
                    <option value="15">15</option>
                    <option value="30">30</option>
                    <option value="45">45</option>
                  </select>
                </div>

                {/* AM / PM selector */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 mb-1">
                    Period
                  </label>
                  <select
                    value={ampm}
                    onChange={(e) => setAmPm(e.target.value)}
                    className="bg-[#16161E] border border-gray-700 rounded-xl px-4 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-[#7C3AED]"
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>

                {/* Time Display Badge */}
                <div className="mt-5 sm:mt-0 sm:ml-auto bg-[#16161E] px-4 py-2.5 rounded-xl border border-purple-900/40 text-xs font-semibold text-purple-300">
                  Default 1-Hour Slot: <span className="text-emerald-400 font-extrabold">{formattedTimeSlot}</span>
                </div>
              </div>

              <p className="text-[11px] text-gray-400 mt-3 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
                Choosing a start time automatically buys a default 1-hour slot. Other players can book on the same date at different times.
              </p>

              {/* Monthly Premium Weekday Selector */}
              {activePlan === "Monthly" && (
                <div className="mt-6 pt-4 border-t border-gray-800/60">
                  <p className="text-xs font-bold text-gray-300 mb-2">
                    Select Up to 2 Recurring Weekdays (Auto-populates 8 slots):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {weekdaysList.map((wd) => {
                      const isSel = selectedWeekdays.includes(wd.val);
                      return (
                        <button
                          key={wd.val}
                          type="button"
                          onClick={() => toggleWeekday(wd.val)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                            isSel
                              ? "bg-[#7C3AED] text-white shadow-md"
                              : "bg-[#16161E] text-gray-400 hover:text-white border border-gray-800"
                          }`}
                        >
                          {wd.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* INTERACTIVE MONTHLY CALENDAR CARD */}
            <div className="bg-[#20202B] border border-gray-800/80 rounded-2xl p-6 shadow-xl">
              {/* Calendar Header Controls */}
              <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-800/60">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-emerald-400" />
                  {monthNames[currentMonth]} {currentYear}
                </h3>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (currentMonth > 0) setCurrentMonth(currentMonth - 1);
                    }}
                    disabled={currentMonth === 0}
                    className="p-2 rounded-xl bg-[#16161E] hover:bg-gray-800 text-gray-300 disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (currentMonth < 11) setCurrentMonth(currentMonth + 1);
                    }}
                    disabled={currentMonth === 11}
                    className="p-2 rounded-xl bg-[#16161E] hover:bg-gray-800 text-gray-300 disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-gray-400 mb-3">
                {weekdaysList.map((wd) => (
                  <div key={wd.val}>{wd.label}</div>
                ))}
              </div>

              {/* Grid of days */}
              <div className="grid grid-cols-7 gap-2 text-center">
                {calendarDays.map((item, idx) => {
                  if (!item) {
                    return <div key={`empty-cal-${idx}`} className="h-14"></div>;
                  }

                  const isSelected = selectedDates.includes(item.dateStr);
                  const isHoliday = Boolean(item.holiday);

                  return (
                    <button
                      type="button"
                      key={item.dateStr}
                      onClick={() => handleDateClick(item.dateStr, item.holiday)}
                      disabled={isHoliday}
                      aria-disabled={isHoliday}
                      title={isHoliday ? `Festival / Holiday: ${item.holiday} (Disabled)` : `Select ${item.dateStr}`}
                      className={`h-14 rounded-xl p-1.5 flex flex-col justify-between text-left transition-all duration-200 relative group border w-full ${
                        isSelected
                          ? "bg-gradient-to-b from-[#7C3AED] to-purple-800 text-white font-extrabold border-purple-400 shadow-lg shadow-purple-950/60 scale-[1.03]"
                          : isHoliday
                          ? "bg-rose-950/60 border-rose-800/80 text-rose-300 cursor-not-allowed opacity-80 hover:bg-rose-900/60"
                          : "bg-[#16161E] border-gray-800/80 text-gray-300 hover:border-purple-600 hover:bg-[#20202B] cursor-pointer"
                      }`}
                    >
                      {/* Floating hover tooltip for Festival / Holiday */}
                      {isHoliday && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex items-center gap-1.5 z-50 bg-[#20202B] text-rose-300 text-xs font-extrabold px-3 py-1.5 rounded-xl border border-rose-500 shadow-2xl whitespace-nowrap pointer-events-none">
                          <span>🎉 Festival:</span>
                          <span className="text-white font-bold">{item.holiday}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-bold">{item.day}</span>
                        {isSelected && <Check className="w-3 h-3 text-emerald-400" />}
                        {isHoliday && <Ban className="w-3 h-3 text-rose-400" />}
                      </div>

                      {/* Holiday Tag & Disabled Indicator Display */}
                      {isHoliday && (
                        <div className="mt-auto flex items-center justify-between gap-1 w-full overflow-hidden">
                          <span className="text-[9px] font-bold text-rose-300 truncate block bg-rose-950/90 px-1 py-0.5 rounded border border-rose-700/50 max-w-[65%]">
                            {item.holiday}
                          </span>
                          <span className="text-[8px] font-extrabold uppercase text-white bg-rose-700 px-1 py-0.5 rounded shrink-0">
                            Disabled
                          </span>
                        </div>
                      )}
                    </button>

                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column (1 col): Selected Slots Side-Panel */}
          <div className="lg:col-span-1">
            <div className="bg-[#20202B] border border-gray-800/80 rounded-2xl p-6 shadow-2xl sticky top-6">
              <h3 className="text-base font-bold text-white border-b border-gray-800/60 pb-3 mb-4 flex items-center justify-between">
                <span>Selected Slots</span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-purple-900/60 border border-purple-600/40 text-purple-300">
                  {selectedDates.length} Slot{selectedDates.length !== 1 ? "s" : ""}
                </span>
              </h3>

              {/* Selected Dates Live List */}
              <div className="max-h-60 overflow-y-auto space-y-2 mb-6 pr-1">
                {selectedDates.length === 0 ? (
                  <div className="text-center py-8 text-xs text-gray-500 border border-dashed border-gray-800 rounded-xl">
                    No dates selected yet. <br /> Click dates on calendar.
                  </div>
                ) : (
                  selectedDates.sort().map((d) => (
                    <div
                      key={d}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-[#16161E] border border-gray-800 text-xs font-semibold"
                    >
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{d}</span>
                      </div>
                      <span className="text-purple-300 font-bold">{formattedTimeSlot}</span>
                    </div>
                  ))
                )}
              </div>

              {/* Summary Price Calculation */}
              <div className="bg-[#16161E] rounded-xl p-4 border border-gray-800/80 space-y-2 mb-6">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Plan Type:</span>
                  <span className="text-white font-bold">{activePlan}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Total Slots:</span>
                  <span className="text-white font-bold">{selectedDates.length}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Rate:</span>
                  <span className="text-white font-bold">
                    {activePlan === "Monthly" ? "Flat ₹2400 (8 slots)" : "₹300 / slot"}
                  </span>
                </div>

                <div className="border-t border-gray-800 pt-2 flex items-center justify-between text-sm font-extrabold text-white">
                  <span>Total Payable:</span>
                  <span className="text-xl text-emerald-400">₹{getPrice()}</span>
                </div>
              </div>

              {/* Confirm Booking Primary Button */}
              <button
                type="button"
                onClick={handleConfirmBooking}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-purple-600 text-white font-extrabold text-sm shadow-xl shadow-purple-950/60 hover:opacity-95 active:scale-[0.99] transition flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <span>Confirm Booking</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}