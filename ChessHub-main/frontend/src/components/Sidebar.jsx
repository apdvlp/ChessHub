import { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  CalendarPlus,
  ListOrdered,
  LogOut,
  ChevronDown,
  ChevronRight,
  Trophy,
  UserCheck
} from "lucide-react";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const isBookingsActive = location.pathname.startsWith("/bookings");
  const [bookingsOpen, setBookingsOpen] = useState(isBookingsActive || true);

  const userJson = localStorage.getItem("user");
  const user = userJson ? JSON.parse(userJson) : null;

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/auth");
  }

  return (
    <aside className="w-64 bg-[#16161E] border-r border-gray-800/60 min-h-screen flex flex-col justify-between select-none font-sans">
      <div>
        {/* Branding Logo */}
        <div className="p-6 flex items-center gap-3 border-b border-gray-800/40">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#7C3AED] to-[#10B981] flex items-center justify-center shadow-lg shadow-purple-900/30">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wider text-white flex items-center gap-1">
              Chess<span className="text-[#7C3AED]">Hub</span>
            </h1>
            <p className="text-[10px] uppercase font-semibold text-emerald-400 tracking-widest">
              Tournament Portal
            </p>
          </div>
        </div>

        {/* User Mini Profile info */}
        {user && (
          <div className="px-6 py-4 border-b border-gray-800/40 flex items-center gap-3 bg-[#20202B]/40">
            <div className="w-9 h-9 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm overflow-hidden border border-purple-400/40">
              {user.profile_picture_url ? (
                <img
                  src={`http://127.0.0.1:8000${user.profile_picture_url}`}
                  alt={user.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                user.full_name?.charAt(0).toUpperCase() || "U"
              )}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-white truncate">
                {user.full_name}
              </p>
              <p className="text-xs text-gray-400 truncate flex items-center gap-1">
                <UserCheck className="w-3 h-3 text-emerald-400 inline" /> Player
              </p>
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="p-4 space-y-2">
          {/* Dashboard */}
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                isActive
                  ? "bg-[#7C3AED] text-white shadow-lg shadow-purple-900/40 font-semibold"
                  : "text-gray-400 hover:text-white hover:bg-[#20202B]"
              }`
            }
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Dashboard</span>
          </NavLink>

          {/* Bookings Dropdown */}
          <div className="space-y-1">
            <button
              onClick={() => setBookingsOpen(!bookingsOpen)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                isBookingsActive
                  ? "text-purple-400 bg-[#20202B]/80 font-semibold"
                  : "text-gray-400 hover:text-white hover:bg-[#20202B]"
              }`}
            >
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5" />
                <span>Bookings</span>
              </div>
              {bookingsOpen ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>

            {/* Dropdown Items */}
            {bookingsOpen && (
              <div className="pl-6 space-y-1 border-l-2 border-purple-900/40 ml-4 py-1">
                <NavLink
                  to="/bookings/calendar"
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? "bg-[#7C3AED] text-white font-semibold shadow-sm"
                        : "text-gray-400 hover:text-white hover:bg-[#20202B]"
                    }`
                  }
                >
                  <CalendarPlus className="w-4 h-4 text-emerald-400" />
                  <span>Book Your Tournament</span>
                </NavLink>

                <NavLink
                  to="/bookings"
                  end
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? "bg-[#7C3AED] text-white font-semibold shadow-sm"
                        : "text-gray-400 hover:text-white hover:bg-[#20202B]"
                    }`
                  }
                >
                  <ListOrdered className="w-4 h-4 text-purple-400" />
                  <span>View Tournaments</span>
                </NavLink>
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* Logout */}
      <div className="p-4 border-t border-gray-800/40">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 bg-[#20202B] hover:bg-rose-900/40 text-rose-400 hover:text-rose-300 py-3 rounded-xl font-semibold text-sm transition-all duration-200 border border-gray-800 hover:border-rose-700/50"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}