import { useEffect, useState } from "react";
import { getPrediction } from "../services/spoilageService";

const SpoilageCard = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchPrediction = async () => {
      try {
        const res = await getPrediction();
        setData(res);
      } catch (err) {
        console.error(err);
      }
    };

    fetchPrediction();
    const interval = setInterval(fetchPrediction, 5000);

    return () => clearInterval(interval);
  }, []);

  if (!data) {
    return (
      <div className="bg-white/10 backdrop-blur-lg border border-white/10 rounded-2xl p-6 text-white">
        Loading...
      </div>
    );
  }

  const percentage = Math.round(data.spoilage_index * 100);
  const remaining = 100 - percentage;

  return (
    <div className="bg-white/10 backdrop-blur-lg border border-white/10 rounded-2xl p-6 text-white">
      <h2 className="text-lg font-semibold mb-4">Spoilage Status</h2>

      <p className="text-2xl font-bold uppercase mb-2">
        {data.label}
      </p>

      <p className="text-gray-300 mb-4">
        Spoilage Index: {percentage}%
      </p>

      {/* Progress Bar */}
      <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-green-400"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>

      <p className="text-sm text-gray-400">
        Shelf Life Remaining: {remaining}%
      </p>
    </div>
  );
};

export default SpoilageCard;