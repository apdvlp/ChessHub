import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import api from "../api/axios";
import { createOrder, verifyPayment } from "../api/payment";
import loadRazorpay from "../utils/loadRazorpay";
import { ShieldCheck, Loader2, CreditCard, Lock, CheckCircle2 } from "lucide-react";

export default function PaymentProcessing() {
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Processing Payment...");

  const pendingJson = sessionStorage.getItem("pending_booking");
  const pendingBooking = pendingJson ? JSON.parse(pendingJson) : null;

  useEffect(() => {
    if (!pendingBooking) {
      navigate("/bookings/calendar");
    }
  }, [pendingBooking, navigate]);

  const handleSavePaymentPending = async (reason) => {
    try {
      const slotsPayload = pendingBooking.dates.map((dateStr) => ({
        date: dateStr,
        time_slot: pendingBooking.time_slot,
        plan_type: pendingBooking.plan_type,
        price: pendingBooking.price_per_slot || 300,
        status: "Payment Pending",
      }));

      const res = await api.post("/bookings/", { slots: slotsPayload });
      sessionStorage.setItem("last_confirmed_booking", JSON.stringify(res.data));
      sessionStorage.removeItem("pending_booking");

      alert(`Payment ${reason}. Your tournament slot has been recorded with 'Payment Pending' status. You can complete your payment anytime from the View Tournaments page.`);
      navigate("/bookings");
    } catch (err) {
      console.error("Error saving pending booking:", err);
      setProcessing(false);
    }
  };

  const handlePayNow = async () => {
    if (!pendingBooking) return;
    setProcessing(true);

    try {
      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_TLek8cbBEt5xJD";
      const totalAmount = pendingBooking.total_price;

      // 1. Create Razorpay order on FastAPI Backend
      setStatusMessage("Creating Razorpay Order...");
      const orderRes = await createOrder(totalAmount);
      const razorpayOrder = orderRes.data;

      // 2. Load Razorpay Checkout SDK
      setStatusMessage("Loading Razorpay Checkout SDK...");
      const sdkLoaded = await loadRazorpay();

      if (!sdkLoaded) {
        alert("Failed to load Razorpay SDK. Saving slot with Payment Pending status.");
        await handleSavePaymentPending("SDK Load Failed");
        return;
      }

      // 3. Configure Razorpay Options
      const options = {
        key: razorpayKey,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency || "INR",
        name: "ChessHub",
        description: `Tournament Booking - ${pendingBooking.plan_type}`,
        order_id: razorpayOrder.id,
        handler: async function (response) {
          try {
            setStatusMessage("Verifying Payment Signature...");
            // Verify payment on backend
            await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            // 4. Save confirmed bookings to database
            setStatusMessage("Finalizing Booking...");
            const slotsPayload = pendingBooking.dates.map((dateStr) => ({
              date: dateStr,
              time_slot: pendingBooking.time_slot,
              plan_type: pendingBooking.plan_type,
              price: pendingBooking.price_per_slot || 300,
              status: "Booked",
            }));

            const res = await api.post("/bookings/", { slots: slotsPayload });
            sessionStorage.setItem("last_confirmed_booking", JSON.stringify(res.data));
            sessionStorage.removeItem("pending_booking");

            navigate("/bookings/success-page");
          } catch (err) {
            console.error("Payment verification error:", err);
            await handleSavePaymentPending("Verification Error");
          }
        },
        modal: {
          ondismiss: async function () {
            await handleSavePaymentPending("Cancelled by User");
          },
        },
        theme: {
          color: "#7C3AED",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", async function (response) {
        console.error("Razorpay Payment Failed:", response.error);
        await handleSavePaymentPending("Failed");
      });

      rzp.open();
    } catch (err) {
      console.error("Payment initialization error:", err);
      await handleSavePaymentPending("Initialization Failed");
    }
  };


  if (!pendingBooking) return null;

  return (
    <div className="flex min-h-screen bg-[#0D0D11] text-white font-sans">
      <Sidebar />

      <main className="flex-1 p-6 md:p-12 flex items-center justify-center">
        <div className="w-full max-w-lg bg-[#20202B] border border-gray-800/80 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          {/* Top Glow Decor */}
          <div className="absolute -top-16 -right-16 w-60 h-60 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>

          {processing ? (
            /* PAYMENT PROCESSING / CHECKOUT OPEN ANIMATION */
            <div className="py-12 text-center space-y-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-purple-950/60 border border-purple-500/50 shadow-xl relative">
                <Loader2 className="w-10 h-10 text-[#7C3AED] animate-spin" />
              </div>

              <div>
                <h2 className="text-2xl font-black text-white">
                  {statusMessage}
                </h2>
                <p className="text-xs text-emerald-400 font-semibold mt-2 animate-pulse">
                  Complete your payment in the Razorpay popup window...
                </p>
              </div>

              <div className="bg-[#16161E] p-4 rounded-2xl border border-gray-800 text-xs text-gray-400 max-w-xs mx-auto">
                <div className="flex justify-between mb-1">
                  <span>Merchant:</span>
                  <span className="text-white font-bold">ChessHub Tournaments</span>
                </div>
                <div className="flex justify-between">
                  <span>Amount:</span>
                  <span className="text-emerald-400 font-extrabold">₹{pendingBooking.total_price}</span>
                </div>
              </div>
            </div>
          ) : (
            /* PAYMENT CHECKOUT SUMMARY */
            <div>
              <div className="flex items-center gap-3 mb-6 border-b border-gray-800/60 pb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-600/50 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Tournament Checkout</h2>
                  <p className="text-xs text-gray-400">Review order summary & pay with Razorpay Gateway</p>
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-[#16161E] rounded-2xl p-5 border border-gray-800/80 mb-6 space-y-3">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Selected Plan:</span>
                  <span className="text-white font-bold">{pendingBooking.plan_type}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Time Slot:</span>
                  <span className="text-white font-bold">{pendingBooking.time_slot}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Total Dates:</span>
                  <span className="text-white font-bold">{pendingBooking.dates.length} Slot(s)</span>
                </div>

                <div className="border-t border-gray-800 pt-3 flex justify-between items-center text-sm font-extrabold text-white">
                  <span>Grand Total:</span>
                  <span className="text-2xl text-emerald-400">₹{pendingBooking.total_price}</span>
                </div>
              </div>

              {/* Payment Gateway Badge */}
              <div className="mb-6 space-y-2">
                <label className="block text-xs font-semibold text-gray-300">
                  Payment Gateway:
                </label>
                <div className="p-3.5 rounded-xl bg-[#16161E] border border-[#7C3AED] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <div>
                      <p className="text-xs font-bold text-white">Razorpay Secure Checkout</p>
                      <p className="text-[10px] text-gray-400">UPI, Cards, NetBanking & Wallets</p>
                    </div>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-[#7C3AED]" />
                </div>
              </div>

              {/* Pay Now Action Button */}
              <button
                type="button"
                onClick={handlePayNow}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#7C3AED] to-purple-600 text-white font-black text-base shadow-xl shadow-purple-950/50 hover:opacity-95 active:scale-[0.99] transition flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4 text-emerald-400" />
                <span>Pay ₹{pendingBooking.total_price} via Razorpay</span>
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}