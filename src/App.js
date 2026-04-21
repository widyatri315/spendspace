import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import IncomePage from "./pages/incomePage";
import IncomePopup from "./pages/incomePopup";
import ExpensePage from "./pages/expensePage";
import ExpensePopup from "./pages/expensePopup";
import Dashboard from "./pages/dashboard";

import DashboardLayout from "./components/DashboardLayout";
import { RegisterProvider } from "./context/RegisterContext";
import Verify from "./pages/verify";
import { useLocation } from "react-router-dom";

function App() {
 
  return (
    <RegisterProvider>
      <Routes>

        {/* AUTH PAGES (NO SIDEBAR) */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify" element={<Verify />} />


        {/* REDIRECT ROOT */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* DASHBOARD PAGES (WITH SIDEBAR) */}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/incomePage" element={<IncomePage />} />
          <Route path="/incomePopup" element={<IncomePopup />} />
          <Route path="/expensePage" element={<ExpensePage />} />
          <Route path="/expensePopup" element={<ExpensePopup />} />
        </Route>

        {/* DEFAULT */}
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </RegisterProvider>
  );
}

export default App;
