import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import expenseIcon from "../assets/expence.png";
import incomeIcon from "../assets/income.png";
import toggle_icon from "../assets/sidebarClose.png";
import logoutIcon from "../assets/logout.png";
import homeIcon from "../assets/home.png";
import budgetIcon from "../assets/budget.png";

import { logout } from "../firebase";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [open, setOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // handle resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);

      if (!mobile) setOpen(true);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const menus = [
    { title: "Dashboard", src: homeIcon, path: "/dashboard" },
    { title: "Income", src: incomeIcon, path: "/incomePage" },
    { title: "Expense", src: expenseIcon, path: "/expensePage" },
    { title: "Budget", src: budgetIcon, path: "/budgetPage" }
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  return (
    <>
      {/* overlay mobile */}
      {isMobile && open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* sidebar */}
      <div
        className={`
          fixed md:relative
          ${open ? "w-72" : "w-20"}
          bg-gray-800 h-screen p-5 pt-8
          flex flex-col
          transition-all duration-300
          z-50
          ${isMobile && !open ? "-translate-x-full" : ""}
        `}
      >
        {/* toggle button */}
        <img
          src={toggle_icon}
          className={`
            absolute cursor-pointer -right-3 top-9 w-7
            border-2 border-gray-800 rounded-full shadow-sm
            transition-transform duration-300
            ${!open ? "rotate-180" : ""}
          `}
          onClick={() => setOpen(!open)}
        />

        {/* logo */}
        <div className="flex items-center gap-x-4">
          <h1
            className={`
              text-white font-medium text-xl
              transition-all duration-200
              ${!open ? "scale-0" : ""}
            `}
          >
            SpendSpace
          </h1>
        </div>

        {/* menu */}
        <ul className="pt-6">
          {menus.map((menu, index) => {
            const isActive = location.pathname === menu.path;

            return (
              <li
                key={index}
                onClick={() => {
                  navigate(menu.path);
                  if (isMobile) setOpen(false);
                }}
                className={`flex items-center gap-x-4 p-2 mt-2 rounded-md cursor-pointer text-sm
                  ${
                    isActive
                      ? "bg-orange-500 text-white"
                      : "text-gray-300 hover:bg-gray-700"
                  }`}
              >
                <img src={menu.src} alt={menu.title} className="w-6 h-6" />

                <span className={`${!open ? "hidden" : ""} duration-200`}>
                  {menu.title}
                </span>
              </li>
            );
          })}
        </ul>

        {/* logout */}
        <ul className="mt-auto">
          <li
            onClick={handleLogout}
            className="flex items-center gap-x-4 p-2 rounded-md cursor-pointer text-sm
              text-red-400 hover:bg-red-500 hover:text-white"
          >
            <img src={logoutIcon} alt="Logout" className="w-6 h-6" />

            <span className={`${!open ? "hidden" : ""} duration-200`}>
              Logout
            </span>
          </li>
        </ul>
      </div>
    </>
  );
};

export default Sidebar;