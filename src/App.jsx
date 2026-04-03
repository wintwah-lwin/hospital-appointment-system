import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
// pages
import Landing from "./pages/public/Landing.jsx";
import Login from "./pages/public/Login.jsx";
import PatientDashboard from "./pages/patient/PatientDashboard.jsx";
import PatientBooking from "./pages/patient/PatientBooking.jsx";
import MyBookings from "./pages/patient/MyBookings.jsx";
import EditBooking from "./pages/patient/EditBooking.jsx";
import BookingDetail from "./pages/patient/BookingDetail.jsx";
import StaffDashboard from "./pages/staff/StaffDashboard.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminBookingLoad from "./pages/admin/AdminBookingLoad.jsx";
import AdminSecurity from "./pages/admin/AdminSecurity.jsx";
import AdminDoctors from "./pages/admin/AdminDoctors.jsx";
import AdminPatients from "./pages/admin/AdminPatients.jsx";
import AdminPatientDetail from "./pages/admin/AdminPatientDetail.jsx";
import AdminRoomBookings from "./pages/admin/AdminRoomBookings.jsx";
import AdminAppointments from "./pages/admin/AdminAppointments.jsx";
import AdminAppointmentDetail from "./pages/admin/AdminAppointmentDetail.jsx";
import CheckInKiosk from "./pages/kiosk/CheckInKiosk.jsx";
import AppShell from "./components/AppShell.jsx";
import RequireAuth from "./auth/RequireAuth.jsx";
import { useAuth } from "./auth/AuthContext.jsx";

// 404 / random url -> send user to the right home
function WildcardRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "admin") return <Navigate to="/admin" replace />;
  if (user.role === "staff") return <Navigate to="/staff" replace />;
  return <Navigate to="/patient" replace />;
}

export default function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-zinc-700">
        Loading...
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />

      <Route path="/patient" element={<RequireAuth roles={["patient"]}><AppShell /></RequireAuth>}>
        <Route index element={<PatientDashboard />} />
        <Route path="book" element={<PatientBooking />} />
        <Route path="bookings" element={<MyBookings />} />
        <Route path="bookings/:id/edit" element={<EditBooking />} />
        <Route path="bookings/:id" element={<BookingDetail />} />
      </Route>

      <Route path="/kiosk" element={<CheckInKiosk />} />

      <Route path="/staff" element={<RequireAuth roles={["staff"]}><AppShell /></RequireAuth>}>
        <Route index element={<StaffDashboard />} />
      </Route>

      <Route path="/admin" element={<RequireAuth roles={["admin"]}><AppShell /></RequireAuth>}>
        <Route index element={<AdminDashboard />} />
        <Route path="booking-load" element={<AdminBookingLoad />} />
        <Route path="security" element={<AdminSecurity />} />
        <Route path="doctors" element={<AdminDoctors />} />
        <Route path="patients" element={<AdminPatients />} />
        <Route path="patients/:id" element={<AdminPatientDetail />} />
        <Route path="room-bookings" element={<AdminRoomBookings />} />
        <Route path="appointments" element={<AdminAppointments />} />
        <Route path="appointments/:id" element={<AdminAppointmentDetail />} />
      </Route>

      <Route path="*" element={<WildcardRedirect />} />
    </Routes>
  );
}
