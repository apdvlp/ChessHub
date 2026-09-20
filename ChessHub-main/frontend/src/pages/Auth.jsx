import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { API_BASE_URL } from "../api/axios";
import {
  Trophy,
  Mail,
  Lock,
  User,
  Calendar,
  Upload,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Sparkles
} from "lucide-react";

export default function Auth() {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register state
  const [regFullName, setRegFullName] = useState("");
  const [regAge, setRegAge] = useState("");
  const [regGender, setRegGender] = useState("Male");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regFile, setRegFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setRegFile(file);
      setFilePreview(URL.createObjectURL(file));
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/login", {
        email: loginEmail.trim(),
        password: loginPassword,
      });

      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid Email or Password");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("full_name", regFullName.trim());
      formData.append("email", regEmail.trim());
      formData.append("password", regPassword);
      if (regAge) formData.append("age", regAge);
      if (regGender) formData.append("gender", regGender);
      if (regFile) formData.append("profile_picture", regFile);

      const res = await api.post("/auth/register", formData);

      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed. Try another email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D11] text-white flex flex-col md:flex-row font-sans">
      {/* Left side: High-contrast chess background graphics + branding */}
      <div className="md:w-1/2 bg-gradient-to-br from-[#16161E] via-[#0D0D11] to-[#20202B] p-8 md:p-16 flex flex-col justify-between relative overflow-hidden border-r border-gray-800/40">
        {/* Glow circles background decor */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Branding header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#7C3AED] to-[#10B981] flex items-center justify-center shadow-lg shadow-purple-900/50">
            <Trophy className="w-7 h-7 text-white" />
          </div>
          <div>
            <span className="text-2xl font-black tracking-wider text-white">
              Chess<span className="text-[#7C3AED]">Hub</span>
            </span>
            <span className="block text-xs uppercase font-bold text-emerald-400 tracking-widest">
              Grandmaster Tournament Platform
            </span>
          </div>
        </div>

        {/* Chess Graphic Visual */}
        <div className="relative z-10 my-12 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-900/40 border border-purple-500/30 text-purple-300 text-xs font-semibold mb-6">
            <Sparkles className="w-4 h-4 text-emerald-400" /> Professional Tournament Scheduling
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Play, Compete, <br />
            <span className="bg-gradient-to-r from-purple-400 via-emerald-400 to-indigo-400 bg-clip-text text-transparent">
              Win.
            </span>
          </h1>
          <p className="mt-4 text-gray-400 max-w-md leading-relaxed text-sm md:text-base">
            Book your tournament slots, manage schedule shifts around national holidays, and track your competitive match performance seamlessly.
          </p>

          {/* Feature Highlights */}
          <div className="mt-8 space-y-3">
            {[
              "Automated 2026 Holiday Conflict Rescheduling",
              "Basic, Monthly Premium & Custom Booking Plans",
              "Real-time Slot Status & Tournament Dashboard",
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center gap-3 text-xs md:text-sm text-gray-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Left Footer */}
        <div className="relative z-10 text-xs text-gray-500">
          © 2026 ChessHub. All rights reserved.
        </div>
      </div>

      {/* Right side: Card with toggle tabs ("Login" and "Register") */}
      <div className="md:w-1/2 bg-[#0D0D11] p-6 md:p-12 flex items-center justify-center relative">
        <div className="w-full max-w-md bg-[#20202B] border border-gray-800/80 rounded-3xl p-8 shadow-2xl shadow-purple-950/20 backdrop-blur-xl">
          {/* Toggle Tabs */}
          <div className="flex bg-[#16161E] p-1.5 rounded-2xl mb-6 border border-gray-800/60">
            <button
              type="button"
              onClick={() => {
                setIsRegister(false);
                setError("");
              }}
              className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 ${
                !isRegister
                  ? "bg-[#7C3AED] text-white shadow-md shadow-purple-900/30"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegister(true);
                setError("");
              }}
              className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 ${
                isRegister
                  ? "bg-[#7C3AED] text-white shadow-md shadow-purple-900/30"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Register
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* LOGIN FORM */}
          {!isRegister ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="player@chesshub.com"
                    className="w-full bg-[#16161E] border border-gray-700/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#7C3AED] transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#16161E] border border-gray-700/60 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#7C3AED] transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-[#7C3AED] to-purple-600 text-white font-bold text-sm shadow-lg shadow-purple-900/40 hover:opacity-95 active:scale-[0.99] transition disabled:opacity-50"
              >
                {loading ? "Signing in..." : "Sign In to ChessHub"}
              </button>
            </form>
          ) : (
            /* REGISTER FORM */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="Magnus Carlsen"
                    className="w-full bg-[#16161E] border border-gray-700/60 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#7C3AED]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Age
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="number"
                      required
                      min="5"
                      max="120"
                      value={regAge}
                      onChange={(e) => setRegAge(e.target.value)}
                      placeholder="28"
                      className="w-full bg-[#16161E] border border-gray-700/60 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#7C3AED]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Gender
                  </label>
                  <select
                    value={regGender}
                    onChange={(e) => setRegGender(e.target.value)}
                    className="w-full bg-[#16161E] border border-gray-700/60 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#7C3AED]"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="magnus@chess.com"
                    className="w-full bg-[#16161E] border border-gray-700/60 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#7C3AED]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#16161E] border border-gray-700/60 rounded-xl pl-10 pr-10 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#7C3AED]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-2.5 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Profile Picture Upload with Preview */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Profile Picture
                </label>
                <div className="flex items-center gap-3 bg-[#16161E] p-2 rounded-xl border border-gray-700/60">
                  <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center overflow-hidden border border-gray-700 shrink-0">
                    {filePreview ? (
                      <img src={filePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <label className="flex-1 cursor-pointer">
                    <span className="text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5" />
                      {regFile ? regFile.name : "Upload Avatar Picture"}
                    </span>
                    <span className="block text-[10px] text-gray-500">
                      {regFile ? "Image selected" : "PNG, JPG up to 5MB"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-[#10B981] to-emerald-600 text-white font-bold text-sm shadow-lg shadow-emerald-950/40 hover:opacity-95 active:scale-[0.99] transition disabled:opacity-50"
              >
                {loading ? "Creating Account..." : "Create Free Account"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}