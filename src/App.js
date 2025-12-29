import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import InputProfile from "./pages/InputProfile";
import Profile from "./pages/Profile";
import IncomePage from "./pages/incomePage";
import IncomePopup from "./pages/incomePopup";
import DashboardLayout from "./components/DashboardLayout";
import ExpensePage from "./pages/expensePage";
import ExpensePopup from "./pages/expensePopup";
import Dashboard from "./pages/dashboard";

function App() {
  return (
    <Routes>
      {/* AUTH PAGES (NO SIDEBAR) */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* DASHBOARD PAGES (WITH SIDEBAR) */
      <Route path="/" element={<Navigate to="/login" replace />} />
      }
      <Route element={<DashboardLayout />}>
          <Route path="/register" element={<Register />} />
          <Route path="/inputprofile" element={<InputProfile />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/incomePage" element={<IncomePage />} />
          <Route path="/incomePopup" element={<IncomePopup />} />
          <Route path="/expensePage" element={<ExpensePage />} />
          <Route path="/expensePopup" element={<ExpensePopup />} />
      </Route>

      {/* DEFAULT */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;