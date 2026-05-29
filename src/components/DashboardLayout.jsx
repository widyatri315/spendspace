import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./sidebar";

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);

  useEffect(() => {
    const handleResize = () => setSidebarOpen(window.innerWidth >= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div
        className="flex-1 w-full transition-all duration-300"
        style={{
          marginLeft: sidebarOpen ? 0 : 0, // adjust jika perlu offset
        }}
      >
        <div className="w-screen md:w-auto flex-1">
  <div className="max-w-full md:max-w-[90%] mx-auto py-4 md:py-6 px-4">
    <Outlet />
  </div>
  </div>
      </div>
    </div>
  );
};

export default DashboardLayout;