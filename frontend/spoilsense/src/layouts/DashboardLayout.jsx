import Sidebar from "../components/Sidebar";

const DashboardLayout = ({ children }) => {
  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0d0d0d]">

      {/* MAIN GLASS PANEL */}
      <div className="relative w-[95%] h-[92%] bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] flex overflow-hidden">

        {/* Light diffusion overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/10 pointer-events-none"></div>

        <Sidebar />

        {/* Main content with radial depth layer */}
        <div className="relative flex-1 p-8 overflow-auto">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent)] pointer-events-none"></div>
          {children}
        </div>

      </div>
    </div>
  );
};

export default DashboardLayout;