import { LayoutDashboard, BarChart3, Settings } from "lucide-react";
import { NavLink } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/",          icon: <LayoutDashboard size={18} />, label: "Overview"  },
  { to: "/analytics", icon: <BarChart3 size={18} />,       label: "Analytics" },
  { to: "/settings",  icon: <Settings size={18} />,        label: "Settings"  },
];

const Sidebar = () => {
  return (
    <div className="w-64 h-full bg-white/5 backdrop-blur-xl border-r border-white/10 p-6 text-white flex flex-col">

      {/* Profile */}
      <div className="mb-10">
        <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-full mb-3 flex items-center justify-center text-black font-bold text-xl shadow-lg shadow-emerald-500/20">
          A
        </div>
        {/* <h2 className="text-white font-semibold">Adi</h2> */}
        <p className="text-white/50 text-xs mt-0.5">AIoT Dashboard</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer
              ${isActive
                ? "bg-white/10 text-white border border-white/15 shadow-inner"
                : "text-gray-500 hover:text-gray-200 hover:bg-white/5"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={isActive ? "text-emerald-400" : ""}>{icon}</span>
                {label}
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_2px_rgba(52,211,153,0.6)]" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer hint */}
      <p className="text-[10px] text-gray-700 mt-4 text-center">SpoilSense v1.0</p>
    </div>
  );
};

export default Sidebar;
