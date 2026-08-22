import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import api from "../api/axios";
import { createOrder, verifyPayment } from "../api/payment";
import loadRazorpay from "../utils/loadRazorpay";
import {
  Calendar,
  Clock,
  Tag,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Trash2,
  RefreshCw,
  X,
  Sparkles,
  Search,
  Filter,
  CreditCard,
  Lock
} from "lucide-react";

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [payingBookingId, setPayingBookingId] = useState(null);

  // Reschedule state
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [holidayAlert, setHolidayAlert] = useState(null); // { holiday_name: "Holi" } if collision

  // Cancel dialog state
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Search/Filter state
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    fetchBookingsAndHolidays();
  }, []);

  const fetchBookingsAndHolidays = async () => {
    setLoading(true);
    try {
      const [bookingsRes, holidaysRes] = await Promise.all([
        api.get("/bookings/"),
        api.get("/holidays/"),
      ]);
      setBookings(bookingsRes.data);
      setHolidays(holidaysRes.data);
    } catch (err) {
      console.error("Error loading slot bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (booking) => {
    setSelectedBooking(booking);
    setRescheduleDate(booking.date);
    setHolidayAlert(null);
    setShowCancelConfirm(false);
  };

  const closeModal = () => {
    setSelectedBooking(null);
    setHolidayAlert(null);
    setShowCancelConfirm(false);
  };

  // Pay Pending Booking action handler via Razorpay
  const handlePayPending = async (bookingToPay) => {
    if (!bookingToPay) return;
    setPayingBookingId(bookingToPay.id);

    try {
      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_TLek8cbBEt5xJD";
      const totalAmount = bookingToPay.price;

      // 1. Create Razorpay order
      const orderRes = await createOrder(totalAmount);
      const razorpayOrder = orderRes.data;

      // 2. Load Razorpay SDK
      const sdkLoaded = await loadRazorpay();
      if (!sdkLoaded) {
        alert("Failed to load Razorpay SDK. Please check your network connection.");
        setPayingBookingId(null);
        return;
      }

      // 3. Configure Razorpay Options
      const options = {
        key: razorpayKey,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency || "INR",
        name: "ChessHub",
        description: `Complete Payment - ${bookingToPay.plan_type} (${bookingToPay.date})`,
        order_id: razorpayOrder.id,
        handler: async function (response) {
          try {
            await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            // Confirm payment on backend
            await api.put(`/bookings/${bookingToPay.id}/confirm-payment`);

            alert("Payment successful! Your tournament slot is now confirmed (Booked).");
            setSelectedBooking(null);
            fetchBookingsAndHolidays();
          } catch (err) {
            console.error("Payment verification error:", err);
            alert("Payment verification failed. Please try again.");
          } finally {
            setPayingBookingId(null);
          }
        },
        modal: {
          ondismiss: function () {
            setPayingBookingId(null);
          },
        },
        theme: {
          color: "#7C3AED",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response) {
        alert(`Payment failed: ${response.error.description}`);
        setPayingBookingId(null);
      });
      rzp.open();
    } catch (err) {
      console.error("Payment initiation error:", err);
      alert(err.response?.data?.detail || "Failed to initiate payment checkout.");
      setPayingBookingId(null);
    }
  };

  // Reschedule action handler
  const handleReschedule = async (forceHolidayShift = false) => {
    if (!selectedBooking || !rescheduleDate) return;

    try {
      const res = await api.put(`/bookings/${selectedBooking.id}/reschedule`, {
        new_date: rescheduleDate,
        force_holiday_shift: forceHolidayShift,
      });

      if (res.data.requires_holiday_confirmation) {
        // Trigger Holiday Alert Modal
        setHolidayAlert({
          holiday_name: res.data.holiday_name,
          message: res.data.message,
        });
      } else {
        // Success
        setHolidayAlert(null);
        setSelectedBooking(null);
        fetchBookingsAndHolidays();
      }
    } catch (err) {
      console.error("Reschedule error:", err);
      alert(err.response?.data?.detail || "Failed to reschedule booking");
    }
  };

  // Cancel booking action handler
  const handleCancelBooking = async () => {
    if (!selectedBooking) return;

    try {
      await api.delete(`/bookings/${selectedBooking.id}/cancel`);
      setShowCancelConfirm(false);
      setSelectedBooking(null);
      fetchBookingsAndHolidays();
    } catch (err) {
      console.error("Cancel error:", err);
      alert("Failed to cancel booking slot.");
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (statusFilter === "All") return true;
    return b.status === statusFilter;
  });

  return (
    <div className="flex min-h-screen bg-[#0D0D11] text-white font-sans">
      <Sidebar />

      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              Slot <span className="text-[#7C3AED]">Management</span>
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              View your booked tournament slots, complete pending payments, reschedule dates with holiday alerts, or cancel bookings.
            </p>
          </div>

          {/* Filter dropdown */}
          <div className="flex items-center gap-2 bg-[#20202B] px-4 py-2.5 rounded-2xl border border-gray-800">
            <Filter className="w-4 h-4 text-purple-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Booked">Booked</option>
              <option value="Payment Pending">Payment Pending</option>
              <option value="Holiday Shifted">Holiday Shifted</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* TABULAR LIST OF BOOKED SLOTS */}
        <div className="bg-[#20202B] border border-gray-800/80 rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-[#16161E] border-b border-gray-800 text-xs font-extrabold text-gray-400 uppercase tracking-wider">
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6">Time Slot</th>
                  <th className="py-4 px-6">Plan Type</th>
                  <th className="py-4 px-6">Price</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-xs text-gray-400">
                      Loading your tournament slots...
                    </td>
                  </tr>
                ) : filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-xs text-gray-500">
                      No tournament bookings found.
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((b) => (
                    <tr
                      key={b.id}
                      onClick={() => handleRowClick(b)}
                      className="hover:bg-[#16161E]/80 cursor-pointer transition-colors duration-150"
                    >
                      <td className="py-4 px-6 font-bold text-white flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-purple-400 shrink-0" />
                        <span>{b.date}</span>
                      </td>
                      <td className="py-4 px-6 text-gray-300 font-semibold">
                        {b.time_slot}
                      </td>
                      <td className="py-4 px-6 text-gray-300 font-medium">
                        <span className="px-2.5 py-1 rounded-lg bg-[#16161E] border border-gray-800 text-xs">
                          {b.plan_type}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-extrabold text-emerald-400">
                        ₹{b.price}
                      </td>
                      <td className="py-4 px-6">
                        {b.status === "Booked" && (
                          <span className="px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 w-max">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Booked
                          </span>
                        )}
                        {b.status === "Payment Pending" && (
                          <span className="px-3 py-1 rounded-full bg-amber-950/90 border border-amber-500/60 text-amber-300 text-xs font-bold flex items-center gap-1.5 w-max animate-pulse">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Payment Pending
                          </span>
                        )}
                        {b.status === "Holiday Shifted" && (
                          <span className="px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1.5 w-max">
                            <AlertTriangle className="w-3.5 h-3.5" /> Holiday Shifted
                          </span>
                        )}
                        {b.status === "Cancelled" && (
                          <span className="px-3 py-1 rounded-full bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-1.5 w-max">
                            <XCircle className="w-3.5 h-3.5" /> Cancelled
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right text-xs text-purple-400 font-bold hover:underline">
                        {b.status === "Payment Pending" ? (
                          <span className="text-amber-400 font-extrabold">Pay Now →</span>
                        ) : (
                          "Manage Slot →"
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* SLOT DETAILS MODAL */}
        {selectedBooking && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#20202B] border border-gray-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative">
              <button
                type="button"
                onClick={closeModal}
                className="absolute top-5 right-5 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                <Tag className="w-5 h-5 text-[#7C3AED]" />
                Tournament Slot Details
              </h2>
              <p className="text-xs text-gray-400 mb-6">Booking ID: #{selectedBooking.id}</p>

              {/* Details card */}
              <div className="bg-[#16161E] rounded-2xl p-4 border border-gray-800/80 space-y-2 mb-6 text-xs text-gray-300">
                <div className="flex justify-between">
                  <span>Current Date:</span>
                  <span className="text-white font-bold">{selectedBooking.date}</span>
                </div>
                <div className="flex justify-between">
                  <span>Time Slot:</span>
                  <span className="text-white font-bold">{selectedBooking.time_slot}</span>
                </div>
                <div className="flex justify-between">
                  <span>Plan Type:</span>
                  <span className="text-white font-bold">{selectedBooking.plan_type}</span>
                </div>
                <div className="flex justify-between">
                  <span>Price:</span>
                  <span className="text-emerald-400 font-bold">₹{selectedBooking.price}</span>
                </div>
                <div className="flex justify-between">
                  <span>Current Status:</span>
                  <span className={`font-bold ${selectedBooking.status === "Payment Pending" ? "text-amber-400" : "text-purple-300"}`}>
                    {selectedBooking.status}
                  </span>
                </div>
              </div>

              {/* PAYMENT PENDING RE-PAY ACTION BANNER */}
              {selectedBooking.status === "Payment Pending" && (
                <div className="mb-6 p-4 rounded-2xl bg-amber-950/40 border border-amber-500/50 space-y-3">
                  <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Payment Pending for this Slot</span>
                  </div>
                  <p className="text-[11px] text-gray-300">
                    Complete your payment now using Razorpay to confirm and lock in your tournament slot.
                  </p>
                  <button
                    type="button"
                    onClick={() => handlePayPending(selectedBooking)}
                    disabled={payingBookingId === selectedBooking.id}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-extrabold text-xs shadow-lg transition flex items-center justify-center gap-2"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>{payingBookingId === selectedBooking.id ? "Opening Razorpay Checkout..." : `Pay ₹${selectedBooking.price} Now via Razorpay`}</span>
                  </button>
                </div>
              )}


              {/* Reschedule Feature */}
              {selectedBooking.status !== "Cancelled" && (
                <div className="mb-6 p-4 rounded-2xl bg-[#16161E] border border-gray-800">
                  <label className="block text-xs font-bold text-gray-300 mb-2 flex items-center gap-1.5">
                    <RefreshCw className="w-4 h-4 text-purple-400" />
                    Reschedule Date:
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="date"
                      value={rescheduleDate}
                      onChange={(e) => setRescheduleDate(e.target.value)}
                      className="bg-[#20202B] border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#7C3AED] flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => handleReschedule(false)}
                      className="px-4 py-2 rounded-xl bg-[#7C3AED] hover:bg-purple-600 text-white font-bold text-xs shadow-md transition"
                    >
                      Update Date
                    </button>
                  </div>
                </div>
              )}

              {/* Cancel / Delete Feature */}
              {selectedBooking.status !== "Cancelled" && (
                <div className="border-t border-gray-800/60 pt-4 flex justify-between items-center">
                  <span className="text-xs text-gray-400">Want to cancel this slot?</span>
                  <button
                    type="button"
                    onClick={() => setShowCancelConfirm(true)}
                    className="px-4 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 font-bold text-xs flex items-center gap-1.5 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Cancel Slot
                  </button>
                </div>
              )}

              {/* HOLIDAY ALERT MODAL OVERLAY */}
              {holidayAlert && (
                <div className="absolute inset-0 bg-[#20202B] rounded-3xl p-6 flex flex-col justify-between border-2 border-amber-500/80 z-20">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-amber-950/80 border border-amber-500 flex items-center justify-center mb-4">
                      <AlertTriangle className="w-7 h-7 text-amber-400" />
                    </div>

                    <h3 className="text-lg font-bold text-amber-300">
                      Official Holiday Collision Alert
                    </h3>
                    <p className="text-xs text-gray-300 mt-2 leading-relaxed">
                      Selected date is a holiday: <strong className="text-white">{holidayAlert.holiday_name}</strong>.
                      Slot will be shifted automatically.
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setHolidayAlert(null)}
                      className="px-4 py-2.5 rounded-xl bg-[#16161E] hover:bg-gray-800 text-gray-300 font-bold text-xs border border-gray-700 transition"
                    >
                      Change Date
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReschedule(true)}
                      className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-extrabold text-xs shadow-lg transition"
                    >
                      Proceed & Shift Slot
                    </button>
                  </div>
                </div>
              )}

              {/* CANCEL CONFIRMATION DIALOG */}
              {showCancelConfirm && (
                <div className="absolute inset-0 bg-[#20202B] rounded-3xl p-6 flex flex-col justify-between border-2 border-rose-600/80 z-20">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-rose-950/80 border border-rose-600 flex items-center justify-center mb-4">
                      <XCircle className="w-7 h-7 text-rose-400" />
                    </div>

                    <h3 className="text-lg font-bold text-rose-300">
                      Confirm Slot Cancellation
                    </h3>
                    <p className="text-xs text-gray-300 mt-2 leading-relaxed">
                      Are you sure you want to cancel this tournament slot on <strong className="text-white">{selectedBooking.date}</strong>?
                    </p>
                    <p className="text-xs text-rose-400 font-bold mt-1">
                      This action cannot be undone.
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowCancelConfirm(false)}
                      className="px-4 py-2.5 rounded-xl bg-[#16161E] hover:bg-gray-800 text-gray-300 font-bold text-xs border border-gray-700 transition"
                    >
                      Keep Booking
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelBooking}
                      className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-lg transition"
                    >
                      Confirm Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}