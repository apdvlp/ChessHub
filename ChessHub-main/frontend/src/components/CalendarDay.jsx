import { toISO } from "../utils/calendarUtils";

export default function CalendarDay({
    day,
    selectedDate,
    setSelectedDate,
    holidays,
    bookings,
}) {
    if (!day) {
        return <div className="aspect-square"></div>;
    }

    const iso = toISO(day);

    const dayHolidays = holidays.filter(
        (h) => h.date === iso
    );

    const hasHoliday = dayHolidays.length > 0;

    // Check whether this date has any bookings
    const bookedCount = bookings.filter(
        (b) => b.booking_date === iso
    ).length;

    const isSaturday = day.getDay() === 6;
    const isSunday = day.getDay() === 0;

    const weekend = isSaturday || isSunday;

    const today = toISO(new Date()) === iso;

    const selected =
        selectedDate &&
        toISO(selectedDate) === iso;

    let bg =
        "bg-white border-gray-200 hover:bg-blue-50";

    if (hasHoliday) {
        bg = "bg-red-100 border-red-400 text-red-700";
    }
    else if (weekend) {
        bg = "bg-orange-100 border-orange-300 text-orange-700";
    }
    else if (selected) {
        bg = "bg-blue-600 border-blue-600 text-white";
    }
    else if (today) {
        bg = "bg-green-100 border-green-500";
    }
    else if (bookedCount > 0) {
        // Only highlight the day
        bg = "bg-blue-50 border-blue-300";
    }

    return (
        <button
            // ❌ Don't disable booked dates
            // Only disable holidays and weekends
            disabled={hasHoliday || weekend}
            onClick={() => setSelectedDate(day)}
            className={`aspect-square border rounded-xl p-2 transition-all ${bg}
            ${hasHoliday || weekend
                ? "cursor-not-allowed"
                : "hover:shadow-lg"
            }`}
        >
            <div className="flex justify-between items-center">

                <span className="font-bold">
                    {day.getDate()}
                </span>

                {today && (
                    <span className="text-xs font-semibold">
                        Today
                    </span>
                )}

            </div>

            {hasHoliday && (
                <div className="mt-2 space-y-1">
                    {dayHolidays.map((holiday, index) => (
                        <div key={index} className="space-y-0.5">
                            <p className="text-[10px] font-semibold leading-tight">
                                {holiday.name}
                            </p>
                            <span className="inline-block text-[8px] font-extrabold uppercase bg-red-600 text-white px-1 py-0.5 rounded">
                                Disabled
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {!hasHoliday && weekend && (
                <div className="mt-3">
                    <p className="text-[10px] font-semibold">
                        {isSunday ? "Sunday" : "Saturday"}
                    </p>
                </div>
            )}

            {/* Show how many bookings exist */}
            {!hasHoliday && !weekend && bookedCount > 0 && (
                <div className="mt-3">
                    <p className="text-[10px] font-semibold text-blue-600">
                        {bookedCount} Booked
                    </p>
                </div>
            )}
        </button>
    );
}