import { useEffect, useState } from "react";
import { getPrediction } from "../services/spoilageService";

const SpoilageCard = () => {
  const [data, setData] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    const fetchPrediction = async () => {
      try {
        const res = await getPrediction();
        setData(res);
        setErrorMsg(null); // clear any previous error once data arrives
      } catch (err) {
        const detail = err?.response?.data?.detail;
        if (detail) {
          setErrorMsg(detail); // e.g. "Not enough data: 12/30 readings collected."
        } else {
          setErrorMsg("Unable to fetch prediction.");
        }
        console.error(err);
      }
    };

    fetchPrediction();
    const interval = setInterval(fetchPrediction, 5000);

    return () => clearInterval(interval);
  }, []);

  // Still waiting for first ever response
  if (!data && !errorMsg) {
    return (
      <div className="space-y-1">
        <h2 className="text-lg font-semibold mb-4">Spoilage Status</h2>
        <p className="text-gray-400 text-sm">Initializing...</p>
      </div>
    );
  }

  // Buffer not ready yet — show detail message from backend
  if (errorMsg && !data) {
    return (
      <div className="space-y-2">
        <h2 className="text-lg font-semibold mb-3">Spoilage Status</h2>
        <div className="flex items-start gap-2 bg-yellow-500/10 border border-yellow-400/20 rounded-xl p-3">
          <span className="text-yellow-400 text-lg mt-0.5">⏳</span>
          <p className="text-yellow-300 text-sm leading-relaxed">{errorMsg}</p>
        </div>
        <p className="text-gray-500 text-xs">Collecting sensor readings, please wait...</p>
      </div>
    );
  }

  const percentage = Math.round(data.spoilage_index * 100);
  const remaining = 100 - percentage;

  const barColor =
    percentage < 40 ? "bg-green-400" :
    percentage < 70 ? "bg-yellow-400" :
    "bg-red-400";

  return (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold mb-4">Spoilage Status</h2>

      <p className="text-2xl font-bold uppercase mb-2">{data.label}</p>

      <p className="text-gray-300 mb-4">Spoilage Index: {percentage}%</p>

      {/* Progress Bar */}
      <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden mb-4">
        <div
          className={`h-full ${barColor} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <p className="text-sm text-gray-400">Shelf Life Remaining: {remaining}%</p>
    </div>
  );
};

export default SpoilageCard;