import React, { useEffect, useRef, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./sidebar";

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 768);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const isMobileRef = useRef(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      if (mobile !== isMobileRef.current) {
        isMobileRef.current = mobile;
        setIsMobile(mobile);
        setSidebarOpen(!mobile);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden md:flex">
      <Sidebar
        open={sidebarOpen}
        setOpen={setSidebarOpen}
        isMobile={isMobile}
      />
      <div
        className="w-full min-w-0 flex-1 transition-all duration-300"
        style={{
          marginLeft: isMobile ? 0 : sidebarOpen ? 288 : 80,
        }}
      >
        <div className="w-full min-w-0">
          <header className="flex items-center gap-3 border-b border-gray-200 px-4 py-3 md:hidden">
            <button
              type="button"
              aria-label="Open navigation menu"
              aria-controls="dashboard-sidebar"
              aria-expanded={sidebarOpen}
              onClick={() => setSidebarOpen(true)}
              className="flex h-10 w-10 shrink-0 flex-col items-center justify-center gap-1 rounded-md text-gray-800 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              <span className="h-0.5 w-5 bg-current" />
              <span className="h-0.5 w-5 bg-current" />
              <span className="h-0.5 w-5 bg-current" />
            </button>
            <span className="text-lg font-medium text-gray-800">SpendSpace</span>
          </header>
          <main className="mx-auto w-full max-w-full px-4 py-4 md:max-w-[90%] md:py-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
