import { useState } from "react";
import { rescheduleBooking } from "../api/bookings";

export default function BookingDetailsModal({
    booking,
    onClose,
    refreshBookings,
}) {

    const [date, setDate] = useState(booking.booking_date);
    const [startTime, setStartTime] = useState(booking.start_time);
    const [loading, setLoading] = useState(false);

    function calculateEndTime(startTime, duration) {
        const [hours, minutes] = startTime.split(":").map(Number);

        const date = new Date();
        date.setHours(hours);
        date.setMinutes(minutes);

        date.setMinutes(date.getMinutes() + duration);

        return date.toTimeString().slice(0, 5);
    }

    async function handleReschedule() {
        try {
            setLoading(true);

            const endTime = calculateEndTime(
                startTime,
                booking.duration
            );

            await rescheduleBooking(booking.id, {
                booking_date: date,
                start_time: startTime,
                end_time: endTime,
            });

            alert("Booking Rescheduled Successfully");

            refreshBookings();
            onClose();

        } catch (err) {
            console.error("Full Error:", err);
            console.log("Response:", err.response);
            console.log("Data:", err.response?.data);

            alert(JSON.stringify(err.response?.data));
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">

                <div className="flex justify-between items-center mb-6">

                    <h2 className="text-2xl font-bold">
                        Booking Details
                    </h2>

                    <button
                        onClick={onClose}
                        className="text-2xl font-bold text-gray-500 hover:text-red-600"
                    >
                        ✕
                    </button>

                </div>

                <div className="space-y-4">

                    <div className="flex justify-between border-b pb-2">
                        <span className="font-semibold">Plan</span>
                        <span>{booking.plan_name}</span>
                    </div>

                    <div>
                        <label className="font-semibold">
                            Booking Date
                        </label>

                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full mt-1 border rounded-lg p-2"
                        />
                    </div>

                    <div>
                        <label className="font-semibold">
                            Start Time
                        </label>

                        <input
                            type="time"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="w-full mt-1 border rounded-lg p-2"
                        />
                    </div>

                    <div className="flex justify-between border-b pb-2">
                        <span className="font-semibold">End Time</span>
                        <span>
                            {calculateEndTime(startTime, booking.duration)}
                        </span>
                    </div>

                    <div className="flex justify-between border-b pb-2">
                        <span className="font-semibold">Status</span>

                        <span
                            className={`px-3 py-1 rounded-full text-sm ${booking.status === "Confirmed"
                                ? "bg-green-100 text-green-700"
                                : booking.status === "Cancelled"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-yellow-100 text-yellow-700"
                                }`}
                        >
                            {booking.status}
                        </span>
                    </div>

                    <div className="flex justify-between">
                        <span className="font-semibold">Payment</span>

                        <span
                            className={`px-3 py-1 rounded-full text-sm ${booking.payment_status === "Paid"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                                }`}
                        >
                            {booking.payment_status}
                        </span>
                    </div>

                </div>

                <div className="flex justify-end gap-3 mt-8">

                    <button
                        onClick={handleReschedule}
                        disabled={loading}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-5 py-2 rounded-lg"
                    >
                        {loading ? "Saving..." : "Reschedule"}
                    </button>

                    <button
                        className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={onClose}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg"
                    >
                        Close
                    </button>

                </div>

            </div>

        </div>
    );
}