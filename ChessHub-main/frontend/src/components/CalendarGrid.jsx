import { useState } from "react";
import CalendarDay from "./CalendarDay";
import {
    buildCalendar,
    monthName,
} from "../utils/calendarUtils";

const week = [
    "Sun",
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
];

export default function CalendarGrid({
    selectedDate,
    setSelectedDate,
    holidays,
    bookings,
    onYearChange,
}) {

    const [month, setMonth] = useState(
        new Date().getMonth()
    );

    const [year, setYear] = useState(
        new Date().getFullYear()
    );

    const grid = buildCalendar(year, month);

    function previous() {

        if (month === 0) {

            const y = year - 1;

            setMonth(11);
            setYear(y);

            onYearChange(y);

        } else {

            setMonth(month - 1);

        }

    }

    function next() {

        if (month === 11) {

            const y = year + 1;

            setMonth(0);
            setYear(y);

            onYearChange(y);

        } else {

            setMonth(month + 1);

        }

    }

    return (

        <div className="bg-white rounded-3xl shadow-xl p-6">

            <div className="flex justify-between items-center mb-6">

                <button
                    onClick={previous}
                    className="w-10 h-10 rounded-full bg-gray-100 hover:bg-blue-600 hover:text-white"
                >
                    ←
                </button>

                <h2 className="text-2xl font-bold">
                    {monthName(month)} {year}
                </h2>

                <button
                    onClick={next}
                    className="w-10 h-10 rounded-full bg-gray-100 hover:bg-blue-600 hover:text-white"
                >
                    →
                </button>

            </div>

            <div className="grid grid-cols-7 gap-2 mb-2">

                {week.map((d) => (

                    <div
                        key={d}
                        className="text-center font-bold text-gray-500"
                    >
                        {d}
                    </div>

                ))}

            </div>

            <div className="grid grid-cols-7 gap-2">

                {grid.map((day, index) => (

                    <CalendarDay
                        key={index}
                        day={day}
                        selectedDate={selectedDate}
                        setSelectedDate={setSelectedDate}
                        holidays={holidays}
                        bookings={bookings}
                    />

                ))}

            </div>

        </div>

    );
}