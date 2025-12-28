import Sidebar from "../components/sidebar";
import { Outlet } from "react-router-dom";

const DashboardLayout = () => {
  return (
    <main className="min-h-screen flex">
      <Sidebar />

      <div className="flex-1">
        <div className="max-w-[90%] md:max-w-[80%] mx-auto py-6">
          <Outlet />
        </div>
      </div>
    </main>
  );
};

export default DashboardLayout;