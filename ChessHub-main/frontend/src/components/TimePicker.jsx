import { toISO } from "../utils/calendarUtils";
import { useEffect, useState } from "react";

function pad(n) {
    return String(n).padStart(2, "0");
}

export default function TimePicker({
    selected,
    setSelected,
    selectedDate,
    bookings,
    duration = 60,
}) {
    const selectedISO = toISO(selectedDate);

    const bookedSlots = bookings
        .filter((b) => b.booking_date === selectedISO)
        .map((b) => b.start_time.slice(0, 5));

    // hour: 1-12, minute: 0-59, meridiem: AM/PM
    const [hour, setHour] = useState(11);
    const [minute, setMinute] = useState(0);
    const [meridiem, setMeridiem] = useState("AM");

    // initialize from selected if provided
    useEffect(() => {
        if (!selected) return;

        const start = selected.split("-")[0];
        const [hh, mm] = start.split(":").map(Number);
        const isPM = hh >= 12;
        const displayHour = hh % 12 === 0 ? 12 : hh % 12;
        setHour(displayHour);
        setMinute(mm);
        setMeridiem(isPM ? "PM" : "AM");
    }, [selected]);

    useEffect(() => {
        // compute slot string and setSelected
        const h24 = (hour % 12) + (meridiem === "PM" ? 12 : 0);
        const start = `${pad(h24)}:${pad(minute)}`;

        // compute end time by adding duration
        const dt = new Date();
        dt.setHours(h24, minute, 0, 0);
        dt.setMinutes(dt.getMinutes() + Number(duration));
        const end = `${pad(dt.getHours())}:${pad(dt.getMinutes())}`;

        const slot = `${start}-${end}`;
        setSelected(slot);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hour, minute, meridiem, duration]);

    const hours = Array.from({ length: 12 }, (_, i) => i + 1);
    const minutes = Array.from({ length: 60 }, (_, i) => i);

    const startTimeStr = (() => {
        const h24 = (hour % 12) + (meridiem === "PM" ? 12 : 0);
        return `${pad(h24)}:${pad(minute)}`;
    })();

    const isBooked = bookedSlots.includes(startTimeStr);

    return (
        <div>
            <h2 className="text-xl font-bold mb-4">Select Time</h2>

            <div className="flex gap-3 items-start">

                {/* Hours column */}
                <div className="w-1/3 bg-white rounded-lg shadow-inner p-2">
                    <div className="flex gap-2 mb-2">
                        {hours.map((h) => (
                            <button
                                key={`h-${h}`}
                                onClick={() => setHour(h)}
                                className={`flex-1 px-2 py-2 rounded-md text-sm font-semibold ${
                                    hour === h
                                        ? "bg-blue-600 text-white border-2 border-white"
                                        : "bg-gray-100 text-gray-800"
                                }`}
                            >
                                {pad(h)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Minutes column */}
                <div className="w-1/3 bg-white rounded-lg shadow-inner p-2">
                    <div className="flex gap-2 mb-2 flex-wrap">
                        {minutes.map((m) => (
                            <button
                                key={`m-${m}`}
                                onClick={() => setMinute(m)}
                                className={`w-16 px-2 py-2 rounded-md text-sm font-semibold ${
                                    minute === m
                                        ? "bg-blue-600 text-white border-2 border-white"
                                        : "bg-gray-100 text-gray-800"
                                }`}
                            >
                                {pad(m)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* AM/PM column */}
                <div className="w-1/3 bg-white rounded-lg shadow-inner p-2">
                    <div className="flex flex-col gap-2">
                        {(["AM", "PM"]).map((p) => (
                            <button
                                key={p}
                                onClick={() => setMeridiem(p)}
                                className={`px-4 py-3 rounded-md text-sm font-semibold ${
                                    meridiem === p
                                        ? "bg-blue-600 text-white border-2 border-white"
                                        : "bg-gray-100 text-gray-800"
                                }`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </div>

            </div>

            <div className="mt-4">
                <div className="flex items-center gap-3">
                    <div className={`px-4 py-2 rounded-lg font-semibold ${isBooked ? 'bg-red-500 text-white' : 'bg-green-600 text-white'}`}>
                        {startTimeStr}
                    </div>
                    <div className="text-sm text-gray-600">→</div>
                    <div className="px-4 py-2 rounded-lg font-semibold bg-gray-200 text-gray-800">
                        {selected ? selected.split("-")[1] : "--:--"}
                    </div>
                    {isBooked && (
                        <div className="ml-3 text-red-600 font-medium">Booked</div>
                    )}
                </div>
            </div>
        </div>
    );
}