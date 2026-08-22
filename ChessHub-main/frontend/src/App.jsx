import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import BookingCalendar from "./pages/BookingCalendar";
import PaymentProcessing from "./pages/PaymentProcessing";
import SuccessPage from "./pages/SuccessPage";
import MyBookings from "./pages/MyBookings";
import ProtectedRoute from "./hooks/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Authentication */}
        <Route path="/auth" element={<Auth />} />

        {/* Protected Dashboard & Booking Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bookings/calendar"
          element={
            <ProtectedRoute>
              <BookingCalendar />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bookings/payment"
          element={
            <ProtectedRoute>
              <PaymentProcessing />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bookings/success-page"
          element={
            <ProtectedRoute>
              <SuccessPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bookings"
          element={
            <ProtectedRoute>
              <MyBookings />
            </ProtectedRoute>
          }
        />

        {/* Default Fallback Redirect */}
        <Route path="/" element={<Navigate to="/auth" replace />} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
