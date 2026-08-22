import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { CheckCircle, Trophy, LayoutDashboard, ListOrdered, Calendar } from "lucide-react";

export default function SuccessPage() {
  const navigate = useNavigate();

  const confirmedJson = sessionStorage.getItem("last_confirmed_booking");
  const confirmedSlots = confirmedJson ? JSON.parse(confirmedJson) : [];

  return (
    <div className="flex min-h-screen bg-[#0D0D11] text-white font-sans">
      <Sidebar />

      <main className="flex-1 p-6 md:p-12 flex items-center justify-center">
        <div className="w-full max-w-md bg-[#20202B] border border-gray-800/80 rounded-3xl p-8 shadow-2xl text-center relative overflow-hidden">
          {/* Background Decor Glow */}
          <div className="absolute -top-20 -left-20 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

          {/* Animated Checkmark */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-950/80 border-2 border-emerald-500 text-emerald-400 mb-6 shadow-xl shadow-emerald-950/80 animate-bounce">
            <CheckCircle className="w-10 h-10" />
          </div>

          <h2 className="text-2xl font-black text-white">Booking Confirmed!</h2>
          <p className="text-xs text-gray-400 mt-2">
            Your tournament slots have been successfully reserved and registered in the system.
          </p>

          {/* Confirmed Slots List */}
          {confirmedSlots.length > 0 && (
            <div className="my-6 bg-[#16161E] rounded-2xl p-4 border border-gray-800 text-left max-h-48 overflow-y-auto space-y-2">
              <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-2">
                Confirmed Tournament Slots ({confirmedSlots.length}):
              </p>
              {confirmedSlots.map((slot) => (
                <div
                  key={slot.id || slot.date}
                  className="flex items-center justify-between p-2 rounded-xl bg-[#20202B] text-xs font-semibold text-gray-200"
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-purple-400" />
                    <span>{slot.date}</span>
                  </div>
                  <span className="text-emerald-400">{slot.time_slot}</span>
                </div>
              ))}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="space-y-3 pt-2">
            <button
              onClick={() => navigate("/bookings")}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-purple-600 text-white font-extrabold text-sm shadow-lg shadow-purple-950/50 hover:opacity-95 transition flex items-center justify-center gap-2"
            >
              <ListOrdered className="w-4 h-4 text-emerald-400" />
              <span>View My Bookings</span>
            </button>

            <button
              onClick={() => navigate("/dashboard")}
              className="w-full py-3 rounded-xl bg-[#16161E] hover:bg-gray-800 text-gray-300 font-bold text-sm border border-gray-800 transition flex items-center justify-center gap-2"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Go to Dashboard</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
