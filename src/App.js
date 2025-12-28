import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import InputProfile from "./pages/InputProfile";
import Profile from "./pages/Profile";
import IncomePage from "./pages/incomePage";
import IncomePopup from "./pages/incomePopup";
import DashboardLayout from "./components/DashboardLayout";

function App() {
  return (
    <Routes>
      {/* AUTH PAGES (NO SIDEBAR) */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* DASHBOARD PAGES (WITH SIDEBAR) */}
      <Route element={<DashboardLayout />}>
      <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/inputprofile" element={<InputProfile />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/incomePage" element={<IncomePage />} />
          <Route path="/incomePopup" element={<IncomePopup />} />
      </Route>

      {/* DEFAULT */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
