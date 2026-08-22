import { FaBell, FaChessPawn, FaUserCircle } from "react-icons/fa";

export default function Navbar() {
    const userName = localStorage.getItem("username") || "Guest User";

    return (
        <nav className="bg-white border-b border-gray-200 shadow-sm h-20 flex items-center justify-between px-8">

            {/* Left Side */}
            <div className="flex items-center gap-3">

                <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
                    <FaChessPawn className="text-white text-2xl" />
                </div>

                <div>
                    <h1 className="text-2xl font-bold text-gray-800">
                        ChessHub
                    </h1>

                    <p className="text-sm text-gray-500">
                        Chess  Platform
                    </p>
                </div>

            </div>

            {/* Right Side */}
            <div className="flex items-center gap-6">

                {/* Notification */}
                <button className="relative text-gray-600 hover:text-blue-600 transition">
                    <FaBell className="text-2xl" />

                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] rounded-full px-1.5">
                        3
                    </span>
                </button>

                {/* User Info */}
                <div className="flex items-center gap-3">

                    <div className="text-right">
                        <h3 className="font-semibold text-gray-800">
                            {userName}
                        </h3>

                        <p className="text-sm text-gray-500">
                            Chess Player
                        </p>
                    </div>

                    <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
                        <FaUserCircle className="text-white text-3xl" />
                    </div>

                </div>

            </div>

        </nav>
    );
}