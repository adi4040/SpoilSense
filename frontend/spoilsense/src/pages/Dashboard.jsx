import DashboardLayout from "../layouts/DashboardLayout";
import StatusCard from "../components/StatusCard";
import SpoilageCard from "../components/SpoilageCard";
import SensorCard from "../components/SensorCard";
import VideoStreamCard from "../components/VideoStreamCard";
import CombinedSpoilageCard from "../components/CombinedSpoilageCard";

const Dashboard = () => {
  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold text-white mb-6">
        SpoilSense Dashboard
      </h1>

      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="bg-gradient-to-br from-teal-500/20 via-cyan-500/10 to-transparent backdrop-blur-lg border border-teal-400/20 rounded-2xl text-white p-6 hover:from-teal-500/30 transition duration-300 cursor-pointer">
          <StatusCard />
        </div>

        <div className="bg-gradient-to-br from-purple-500/20 via-pink-500/10 to-transparent backdrop-blur-lg border border-purple-400/20 rounded-2xl text-white p-6 hover:from-purple-500/30 transition duration-300 cursor-pointer">
          <SpoilageCard />
        </div>

        <div className="bg-gradient-to-br from-blue-500/20 via-indigo-500/10 to-transparent backdrop-blur-lg border border-blue-400/20 rounded-2xl text-white p-6 hover:from-blue-500/30 transition duration-300 cursor-pointer">
          <SensorCard />
        </div>
      </div>

      <div className="bg-gradient-to-br from-orange-500/20 via-amber-500/10 to-transparent backdrop-blur-lg border border-orange-400/20 rounded-2xl text-white p-6 hover:from-orange-500/30 transition duration-300 mb-6">
        <VideoStreamCard />
      </div>

      <div className="bg-gradient-to-br from-rose-500/20 via-pink-500/10 to-transparent backdrop-blur-lg border border-rose-400/20 rounded-2xl text-white p-6 hover:from-rose-500/30 transition duration-300">
        <CombinedSpoilageCard />
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;