import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./sidebar";

const DashboardLayout = () => {
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1">
        <div className="max-w-[90%] md:max-w-[80%] mx-auto py-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;