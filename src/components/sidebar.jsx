import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import expenseIcon from "../assets/expence.png";
import incomeIcon from "../assets/income.png";
import toggle_icon from "../assets/sidebarClose.png";
import logoutIcon from "../assets/logout.png";
import homeIcon from "../assets/home.png";
import { auth, db, logout } from "../firebase";

const Sidebar = () => {
  let navigate = useNavigate();
  const location = window.location;
  const [open, setOpen] = useState(true);

 const menus = [
  { title: "Dashboard", src: homeIcon, path: "/dashboard" },
  { title: "Income", src: incomeIcon, path: "/incomePage" },
  { title: "Expense", src: expenseIcon, path: "/expensePage" },
];

 const logoutMenu = 
 { title: "Logout", src: logoutIcon, path: "/login", action: "logout" };

  return (
    <div className={` ${open ? "w-72" : "w-20 "} bg-gray-800 h-screen p-5  pt-8 relative duration-300 flex flex-col`}> 
      <img
        src={toggle_icon}
        className={`absolute cursor-pointer -right-3 top-9 w-7 border-dark-gray-800 shadow-sm
         border-2 rounded-full  ${!open && "rotate-180"}`}
         onClick={() => setOpen(!open)}
      />
      <div className="flex gap-x-4 items-center">
        <h1 className={`text-white origin-left font-medium text-xl duration-200 ${!open && "scale-0"}`}>
          SpendSpace
        </h1>
      </div>

       <ul className="pt-6">
        {menus.map((menu, index) => {
          const isActive = location.pathname === menu.path;

          return (
            <li
              key={index}
              onClick={() => {
                if (menu.action === "logout") {
                  logout();
                  navigate("/login");
                } else {
                  navigate(menu.path);
                }
              }}
              className={`flex items-center gap-x-4 p-2 mt-2 rounded-md cursor-pointer text-sm
                ${
                  isActive
                    ? "bg-orange-500 text-white"
                    : "text-gray-300 hover:bg-gray-700"
                }
              `}
            >
              <img src={menu.src} alt={menu.title} className="w-6 h-6" />
              <span className={`${!open && "hidden"} duration-200`}>
                {menu.title}
              </span>
            </li>
          );
        })}
      </ul>
      <ul className="mt-auto">
        <li
          onClick={() => {
            logout();
            navigate("/login");
          }}
          className="flex items-center gap-x-4 p-2 rounded-md cursor-pointer text-sm
                    text-red-400 hover:bg-red-500 hover:text-white"
        >
          <img src={logoutMenu.src} alt="Logout" className="w-6 h-6" />
          <span className={`${!open && "hidden"} duration-200`}>
            Logout
          </span>
        </li>
      </ul>
    </div>  
  );
};

export default Sidebar;