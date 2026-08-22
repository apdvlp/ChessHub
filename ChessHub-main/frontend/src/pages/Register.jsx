import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../api/auth";
import {
    FaChessKnight,
    FaUser,
    FaEnvelope,
    FaLock,
    FaEye,
    FaEyeSlash,
} from "react-icons/fa";

export default function Register() {
    const navigate = useNavigate();

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [form, setForm] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    async function handleRegister(e) {
        e.preventDefault();

        if (form.password !== form.confirmPassword) {
            alert("Passwords do not match.");
            return;
        }

        try {
            await registerUser({
                username: form.username,
                email: form.email,
                password: form.password,
            });

            alert("Registration Successful!");
            navigate("/");
        } catch (err) {
            console.error(err);

            if (err.response?.data?.username) {
                alert(err.response.data.username[0]);
            } else if (err.response?.data?.email) {
                alert(err.response.data.email[0]);
            } else {
                alert("Registration Failed");
            }
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-sky-200 via-white to-indigo-200 relative overflow-hidden">

            {/* Background Blur */}
            <div className="absolute w-80 h-80 bg-blue-400/30 rounded-full blur-3xl -top-20 -left-20"></div>

            <div className="absolute w-96 h-96 bg-purple-400/30 rounded-full blur-3xl -bottom-20 -right-20"></div>

            {/* Glass Card */}
            <div className="relative w-full max-w-md mx-5 rounded-3xl bg-white/25 backdrop-blur-3xl border border-white/40 shadow-2xl p-8">

                {/* Logo */}
                <div className="flex flex-col items-center">

                    <div className="w-20 h-20 rounded-3xl bg-white/50 flex items-center justify-center shadow-lg">
                        <FaChessKnight className="text-4xl text-blue-600" />
                    </div>

                    <h1 className="mt-5 text-4xl font-bold text-gray-800">
                        Create Account
                    </h1>

                    <p className="mt-2 text-gray-600">
                        Join ChessHub today
                    </p>

                </div>

                {/* Form */}
                <form
                    onSubmit={handleRegister}
                    className="mt-8 space-y-5"
                >

                    {/* Username */}
                    <div className="flex items-center bg-white/60 rounded-2xl px-4 py-4 border border-white/40">

                        <FaUser className="text-gray-500 mr-3" />

                        <input
                            type="text"
                            placeholder="Username"
                            value={form.username}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    username: e.target.value,
                                })
                            }
                            className="w-full bg-transparent outline-none placeholder-gray-500"
                            required
                        />

                    </div>

                    {/* Email */}
                    <div className="flex items-center bg-white/60 rounded-2xl px-4 py-4 border border-white/40">

                        <FaEnvelope className="text-gray-500 mr-3" />

                        <input
                            type="email"
                            placeholder="Email"
                            value={form.email}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    email: e.target.value,
                                })
                            }
                            className="w-full bg-transparent outline-none placeholder-gray-500"
                            required
                        />

                    </div>

                    {/* Password */}
                    <div className="flex items-center bg-white/60 rounded-2xl px-4 py-4 border border-white/40">

                        <FaLock className="text-gray-500 mr-3" />

                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Password"
                            value={form.password}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    password: e.target.value,
                                })
                            }
                            className="w-full bg-transparent outline-none placeholder-gray-500"
                            required
                        />

                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>

                    </div>

                    {/* Confirm Password */}
                    <div className="flex items-center bg-white/60 rounded-2xl px-4 py-4 border border-white/40">

                        <FaLock className="text-gray-500 mr-3" />

                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm Password"
                            value={form.confirmPassword}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    confirmPassword: e.target.value,
                                })
                            }
                            className="w-full bg-transparent outline-none placeholder-gray-500"
                            required
                        />

                        <button
                            type="button"
                            onClick={() =>
                                setShowConfirmPassword(!showConfirmPassword)
                            }
                        >
                            {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>

                    </div>

                    {/* Register Button */}
                    <button
                        type="submit"
                        className="w-full py-4 rounded-2xl bg-linear-to-r from-blue-600 to-indigo-600 text-white font-semibold text-lg shadow-xl hover:scale-[1.02] active:scale-95 transition"
                    >
                        Create Account
                    </button>

                </form>

                {/* Divider */}
                <div className="flex items-center my-8">

                    <div className="flex-1 border-t border-gray-300"></div>

                    <span className="px-4 text-gray-500 text-sm">
                        OR
                    </span>

                    <div className="flex-1 border-t border-gray-300"></div>

                </div>

                {/* Login */}
                <div className="text-center">

                    <p className="text-gray-600">
                        Already have an account?
                    </p>

                    <Link
                        to="/"
                        className="inline-block mt-4 px-8 py-3 rounded-2xl border border-blue-600 text-blue-600 font-semibold hover:bg-blue-600 hover:text-white transition"
                    >
                        Login
                    </Link>

                </div>

            </div>

        </div>
    );
}