import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

import expenseIcon from "../assets/expence.png";
import incomeIcon from "../assets/income.png";
import toggleIcon from "../assets/sidebarClose.png";
import logoutIcon from "../assets/logout.png";
import homeIcon from "../assets/home.png";
import budgetIcon from "../assets/budget.png";

import { logout } from "../firebase";

const Sidebar = ({ open, setOpen, isMobile }) => {
  const navigate = useNavigate();
  const location = useLocation();

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
      {isMobile && open && (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        id="dashboard-sidebar"
        aria-label="Main navigation"
        aria-hidden={isMobile && !open}
        className={`
          fixed left-0 top-0
          ${open ? "w-72" : "w-20"}
          max-w-[calc(100vw-1rem)] bg-gray-800 h-screen h-[100dvh] p-5 pt-8
          flex flex-col overflow-y-auto
          transition-all duration-300
          z-50
          ${isMobile ? (open ? "translate-x-0 visible" : "-translate-x-full invisible") : ""}
        `}
      >
        <button
          type="button"
          aria-label="Close navigation menu"
          className="md:hidden self-end mb-2 rounded-md px-2 py-1 text-sm text-gray-300 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400"
          onClick={() => setOpen(false)}
        >
          Close
        </button>

        <button
          type="button"
          aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
          aria-expanded={open}
          className="hidden md:block absolute cursor-pointer right-3 top-9 w-7 rounded-full border-2 border-gray-800 bg-white shadow-sm transition-transform duration-300 focus:outline-none focus:ring-2 focus:ring-orange-400"
          onClick={() => setOpen(!open)}
        >
          <img
            src={toggleIcon}
            alt=""
            className={`w-full rounded-full ${!open ? "rotate-180" : ""}`}
          />
        </button>

        <div className="flex items-center gap-x-4">
          <h1
            className={`
              text-white font-medium text-xl whitespace-nowrap
              transition-all duration-200
              ${!open ? "md:hidden" : ""}
            `}
          >
            SpendSpace
          </h1>
        </div>

        <nav aria-label="Dashboard pages">
          <ul className="pt-6">
            {menus.map((menu) => {
              const isActive = location.pathname === menu.path;

              return (
                <li key={menu.path} className="mt-2">
                  <button
                    type="button"
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => {
                      navigate(menu.path);
                      if (isMobile) setOpen(false);
                    }}
                    className={`flex w-full items-center gap-x-4 p-2 rounded-md text-left text-sm
                      ${
                        isActive
                          ? "bg-orange-500 text-white"
                          : "text-gray-300 hover:bg-gray-700"
                      }`}
                  >
                    <img src={menu.src} alt="" className="w-6 h-6 shrink-0" />
                    <span className={`${!open ? "md:hidden" : ""} duration-200`}>
                      {menu.title}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <ul className="mt-auto">
          <li>
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-x-4 p-2 rounded-md text-left text-sm text-red-400 hover:bg-red-500 hover:text-white"
            >
              <img src={logoutIcon} alt="" className="w-6 h-6 shrink-0" />
              <span className={`${!open ? "md:hidden" : ""} duration-200`}>
                Logout
              </span>
            </button>
          </li>
        </ul>
      </aside>
    </>
  );
};

export default Sidebar;
