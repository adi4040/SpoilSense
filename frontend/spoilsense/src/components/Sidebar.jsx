import { LayoutDashboard, BarChart3, Settings } from "lucide-react";

const Sidebar = () => {
  return (
    <div className="w-64 h-full bg-white/5 backdrop-blur-xl border-r border-white/10 p-6 text-white">
      
      {/* Profile */}
      <div className="mb-10">
        <div className="w-16 h-16 bg-white rounded-full mb-3"></div>
        <h2 className="text-white font-semibold">Adi</h2>
        <p className="text-white/70 text-sm">AIoT Dashboard</p>
      </div>

      {/* Navigation */}
      <nav className="space-y-4">
        <div className="flex items-center gap-3 text-gray-400 cursor-pointer hover:text-white hover:bg-white/10 p-2 rounded-lg transition duration-300">
          <LayoutDashboard size={20} />
          <span>Overview</span>
        </div>

        <div className="flex items-center gap-3 text-gray-400 cursor-pointer hover:text-white hover:bg-white/10 p-2 rounded-lg transition duration-300">
          <BarChart3 size={20} />
          <span>Analytics</span>
        </div>

        <div className="flex items-center gap-3 text-gray-400 cursor-pointer hover:text-white hover:bg-white/10 p-2 rounded-lg transition duration-300">
          <Settings size={20} />
          <span>Settings</span>
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;