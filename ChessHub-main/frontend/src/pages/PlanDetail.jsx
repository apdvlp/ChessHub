import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    getPlan,
    getPlans,
    getCalendar,
    createPassOrder,
    verifyPassPayment,
} from "../api/bookings";
import loadRazorpay from "../utils/loadRazorpay";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import Loader from "../components/Loader";
import CalendarGrid from "../components/CalendarGrid";
import PlanCard from "../components/PlanCard";

export default function PlanDetail() {
    const navigate = useNavigate();
    const { id } = useParams();

    const [plan, setPlan] = useState(null);
    const [otherPlans, setOtherPlans] = useState([]);
    const [calendarData, setCalendarData] = useState({
        holidays: [],
        bookings: [],
    });
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        loadPage();
    }, [id]);

    async function loadPage() {
        setLoading(true);

        try {
            const [planRes, calendarRes, plansRes] = await Promise.all([
                getPlan(id),
                getCalendar(new Date().getFullYear()),
                getPlans(),
            ]);

            setPlan(planRes.data);
            setCalendarData({
                holidays: calendarRes.data.holidays || [],
                bookings: calendarRes.data.bookings || [],
            });
            setOtherPlans(
                plansRes.data.filter((item) => item.id !== planRes.data.id)
            );
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function handleBuyNow() {
        if (!plan) return;

        setProcessing(true);

        try {
            const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
            const useFakePayment = !razorpayKey;

            const res = await createPassOrder(plan.id);

            if (useFakePayment) {
                await verifyPassPayment({
                    plan_id: plan.id,
                    razorpay_order_id: res.data.order_id,
                    razorpay_payment_id: "fake_payment_id",
                    razorpay_signature: "fake_signature",
                });

                alert("Pass Purchased Successfully (dev mode)");
                navigate("/dashboard");
                return;
            }

            const loaded = await loadRazorpay();

            if (!loaded) {
                alert("Unable to load Razorpay.");
                return;
            }

            const options = {
                key: razorpayKey,
                amount: res.data.amount,
                currency: res.data.currency,
                order_id: res.data.order_id,
                name: "ChessHub",
                description: plan.name,
                handler: async function (response) {
                    try {
                        await verifyPassPayment({
                            plan_id: plan.id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        });

                        alert("Pass Purchased Successfully");
                        navigate("/dashboard");
                    } catch (err) {
                        console.error(err);
                        alert("Payment verification failed.");
                    }
                },
                theme: {
                    color: "#2563eb",
                },
            };

            const razorpay = new window.Razorpay(options);
            razorpay.open();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.error || "Unable to purchase pass.");
        } finally {
            setProcessing(false);
        }
    }

    if (loading) {
        return <Loader />;
    }

    if (!plan) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-3xl font-bold mb-4">Plan not found</h2>
                    <button
                        onClick={() => navigate("/plans")}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
                    >
                        Back to Plans
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            <Navbar />

            <div className="flex min-h-screen bg-gray-100">
                <Sidebar />

                <main className="flex-1 p-8">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-8">
                        <div>
                            <h1 className="text-4xl font-bold tracking-tight text-slate-900">
                                {plan.name}
                            </h1>
                            <p className="mt-3 text-gray-600 max-w-2xl">
                                Explore the monthly pass details, view the booking calendar, and purchase the plan using Razorpay.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={() => navigate("/plans")}
                                className="bg-white border border-slate-300 text-slate-900 px-5 py-3 rounded-xl shadow-sm hover:bg-slate-50"
                            >
                                All Plans
                            </button>
                            <button
                                onClick={handleBuyNow}
                                disabled={processing}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl shadow"
                            >
                                {processing ? "Processing..." : "Buy Now"}
                            </button>
                        </div>
                    </div>

                    <div className="grid gap-8 xl:grid-cols-3">
                        <section className="xl:col-span-2 bg-white rounded-3xl shadow-lg p-8">
                            <div className="grid gap-6 lg:grid-cols-2">
                                <div className="space-y-3 p-6 bg-slate-50 rounded-3xl">
                                    <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
                                        Monthly Package
                                    </p>
                                    <h2 className="text-3xl font-bold text-slate-900">
                                        ₹ {plan.monthly_price}
                                    </h2>
                                    <p className="text-slate-600">
                                        ₹ {plan.session_price} per session. Book up to {plan.monthly_slots} sessions per month with this plan.
                                    </p>
                                </div>

                                <div className="space-y-4 p-6 border border-slate-200 rounded-3xl">
                                    {/* Duration removed from plan details */}
                                    <div>
                                        <p className="text-sm text-slate-500">Monthly Slots</p>
                                        <p className="text-xl font-semibold text-slate-900">{plan.monthly_slots}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500">Weekly Limit</p>
                                        <p className="text-xl font-semibold text-slate-900">{plan.weekly_slots}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 space-y-4">
                                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                                    <h2 className="text-xl font-semibold text-slate-900 mb-3">Package Details</h2>
                                    <p className="text-slate-600 whitespace-pre-line">
                                        {plan.description || "No description available for this plan."}
                                    </p>
                                </div>

                                <div className="rounded-3xl border border-slate-200 bg-white p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-xl font-semibold text-slate-900">Monthly Booking Calendar</h2>
                                        <p className="text-sm text-slate-500">Select a date to preview booked slots.</p>
                                    </div>

                                    {/* Slot selector right above the calendar */}
                                    <div className="mb-4">
                                        {/* simple hourly slot selector for preview */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="rounded-lg">
                                                <p className="text-sm text-slate-500 mb-2">Preview Slot</p>
                                                <select
                                                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 shadow-sm focus:border-blue-500 focus:outline-none"
                                                    onChange={(e) => {
                                                        // we only preview; no-op for now
                                                    }}
                                                >
                                                    <option value="">Select a 1-hour slot</option>
                                                    {Array.from({ length: 16 }, (_, i) => 6 + i).map((h) => {
                                                        const toLabel = (hh) => {
                                                            const mer = hh >= 12 ? "PM" : "AM";
                                                            const disp = ((hh + 11) % 12) + 1;
                                                            return `${disp}:00 ${mer}`;
                                                        };

                                                        return (
                                                            <option key={h} value={`${String(h).padStart(2, "0")}:00-${String(h + 1).padStart(2, "0")}:00`}>
                                                                {toLabel(h)} - {toLabel(h + 1)}
                                                            </option>
                                                        );
                                                    })}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <CalendarGrid
                                        selectedDate={selectedDate}
                                        setSelectedDate={setSelectedDate}
                                        holidays={calendarData.holidays}
                                        bookings={calendarData.bookings}
                                        onYearChange={async (year) => {
                                            const res = await getCalendar(year);
                                            setCalendarData({
                                                holidays: res.data.holidays || [],
                                                bookings: res.data.bookings || [],
                                            });
                                        }}
                                    />
                                </div>
                            </div>
                        </section>

                        <aside className="space-y-6">
                            <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                                <h2 className="text-xl font-semibold text-slate-900">Quick Summary</h2>
                                    <div className="space-y-3 text-slate-600">
                                    <p><span className="font-semibold text-slate-900">Price:</span> ₹ {plan.monthly_price}</p>
                                    <p><span className="font-semibold text-slate-900">Monthly Slots:</span> {plan.monthly_slots}</p>
                                    <p><span className="font-semibold text-slate-900">Weekly Limit:</span> {plan.weekly_slots}</p>
                                </div>
                            </div>

                            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
                                <h2 className="text-lg font-semibold text-slate-900 mb-4">Available Plans</h2>
                                {otherPlans.length === 0 ? (
                                    <p className="text-slate-500">No other plans available.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {otherPlans.slice(0, 3).map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={() => navigate(`/plans/${item.id}`)}
                                                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left hover:bg-slate-50"
                                            >
                                                <p className="font-semibold text-slate-900">{item.name}</p>
                                                <p className="text-sm text-slate-500">₹ {item.monthly_price}</p>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </aside>
                    </div>
                </main>
            </div>
        </>
    );
}
