import { Route, Routes, Navigate } from "react-router-dom";
import "./App.css";
import InputProfile from "./pages/InputProfile";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import IncomePage from "./pages/incomePage";
import IncomePopup from "./pages/incomePopup";

function App() {
  return (
    <div className="App">
      <div className="max-w-[90%] md:max-w-[80%] mx-auto">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/inputprofile" element={<InputProfile />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/incomePage" element={<IncomePage />} />
          <Route path="/incomePopup" element={<IncomePopup />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;