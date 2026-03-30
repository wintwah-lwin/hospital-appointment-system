import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Landing from "./pages/public/Landing.jsx";
import PatientDashboard from "./pages/PatientDashboard.jsx";
import PatientBooking from "./pages/PatientBooking.jsx";
import MyBookings from "./pages/MyBookings.jsx";
import EditBooking from "./pages/EditBooking.jsx";
import BookingDetail from "./pages/BookingDetail.jsx";
import StaffDashboard from "./pages/StaffDashboard.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import AdminBookingLoad from "./pages/AdminBookingLoad.jsx";
import AdminSecurity from "./pages/admin/AdminSecurity.jsx";
import AdminDoctors from "./pages/admin/AdminDoctors.jsx";
import AdminPatients from "./pages/admin/AdminPatients.jsx";
import AdminPatientDetail from "./pages/admin/AdminPatientDetail.jsx";
import CheckInKiosk from "./pages/CheckInKiosk.jsx";
import HospitalStatus from "./pages/public/HospitalStatus.jsx";
import AppShell from "./components/AppShell.jsx";
import RequireAuth from "./auth/RequireAuth.jsx";
import { useAuth } from "./auth/AuthContext.jsx";

export default function App() {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-zinc-700">Loading...</div>;

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

      <Route path="/status" element={<RequireAuth roles={["patient", "admin", "staff"]}><AppShell /></RequireAuth>}>
        <Route index element={<HospitalStatus />} />
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
      </Route>

      <Route path="*" element={
        user
          ? user.role === "admin"
            ? <Navigate to="/admin" replace />
            : user.role === "staff"
              ? <Navigate to="/staff" replace />
              : <Navigate to="/patient" replace />
          : <Navigate to="/login" replace />
      } />
    </Routes>
  );
}
