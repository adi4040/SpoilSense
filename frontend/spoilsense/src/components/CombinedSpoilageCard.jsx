import { useEffect, useState, useRef, useMemo } from "react";
import { AlertCircle, CheckCircle, AlertTriangle } from "lucide-react";
import { getPrediction, getJetsonResult } from "../services/spoilageService";

const CombinedSpoilageCard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const hasInitialized = useRef(false);
  const previousDataRef = useRef(null);

  const fetchCombinedData = async () => {
    setError(null);
    try {
      // Fetch from both APIs in parallel
      const [backendRes, jetsonRes] = await Promise.all([
        getPrediction(),
        getJetsonResult(),
      ]);

      // Extract spoilage indices
      const backendIndex = backendRes.spoilage_index || 0;

      // Jetson: overripe + rotten probability
      const jetsonSpoilageIndex =
        ((jetsonRes.probs?.overripe || 0) + (jetsonRes.probs?.rotten || 0)) / 100;

      // Average the two indices
      const averagedIndex = (backendIndex + jetsonSpoilageIndex) / 2;

      const newData = {
        backendIndex: parseFloat(backendIndex.toFixed(3)),
        jetsonIndex: parseFloat(jetsonSpoilageIndex.toFixed(3)),
        averagedIndex: parseFloat(averagedIndex.toFixed(3)),
        jetsonLabel: jetsonRes.label || "unknown",
        jetsonConfidence: jetsonRes.confidence || 0,
        advice: jetsonRes.advice || "",
      };

      // Only update if data actually changed
      if (JSON.stringify(previousDataRef.current) !== JSON.stringify(newData)) {
        setData(newData);
        previousDataRef.current = newData;
      }

      // Only set loading to false on first successful fetch
      if (hasInitialized.current === false) {
        setLoading(false);
        hasInitialized.current = true;
      }
    } catch (err) {
      console.error("Error fetching combined spoilage data:", err);
      setError("Unable to fetch spoilage data from one or both sources.");
      if (hasInitialized.current === false) {
        setLoading(false);
        hasInitialized.current = true;
      }
    }
  };

  useEffect(() => {
    fetchCombinedData();
    // Poll every 15 seconds instead of 5 to reduce refresh frequency
    const interval = setInterval(fetchCombinedData, 15000);
    return () => clearInterval(interval);
  }, []);

  const getSpoilageColor = (index) => {
    if (index < 0.33) return { bg: "bg-green-500/10", border: "border-green-400/20", text: "text-green-300", label: "Fresh" };
    if (index < 0.66) return { bg: "bg-yellow-500/10", border: "border-yellow-400/20", text: "text-yellow-300", label: "Ripe" };
    return { bg: "bg-red-500/10", border: "border-red-400/20", text: "text-red-300", label: "Spoiling" };
  };

  const colors = data ? getSpoilageColor(data.averagedIndex) : {};

  if (loading) {
    return (
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Combined Spoilage Analysis</h2>
        <div className="text-gray-400 text-sm">Loading data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Combined Spoilage Analysis</h2>
        <div className="flex items-start gap-2 bg-red-500/10 border border-red-400/20 rounded-lg p-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Combined Spoilage Analysis</h2>

      {/* Main averaged spoilage index */}
      <div className={`${colors.bg} border ${colors.border} rounded-lg p-4`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-300 text-sm font-medium">Averaged Spoilage Index</span>
          <span className={`${colors.text} text-2xl font-bold`}>{(data.averagedIndex * 100).toFixed(1)}%</span>
        </div>
        <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full ${
              data.averagedIndex < 0.33
                ? "bg-green-500"
                : data.averagedIndex < 0.66
                ? "bg-yellow-500"
                : "bg-red-500"
            }`}
            style={{ width: `${data.averagedIndex * 100}%` }}
          />
        </div>
        <p className={`${colors.text} text-sm mt-2 font-semibold`}>{colors.label}</p>
      </div>

      {/* Data sources breakdown */}
      <div className="grid grid-cols-2 gap-3">
        {/* Backend spoilage */}
        <div className="bg-blue-500/5 border border-blue-400/20 rounded-lg p-3">
          <p className="text-gray-400 text-xs mb-2">Backend Index</p>
          <p className="text-blue-300 text-lg font-semibold">{(data.backendIndex * 100).toFixed(1)}%</p>
          <p className="text-gray-500 text-xs mt-1">Sensor-based</p>
        </div>

        {/* Jetson spoilage */}
        <div className="bg-purple-500/5 border border-purple-400/20 rounded-lg p-3">
          <p className="text-gray-400 text-xs mb-2">Jetson Index</p>
          <p className="text-purple-300 text-lg font-semibold">{(data.jetsonIndex * 100).toFixed(1)}%</p>
          <p className="text-gray-500 text-xs mt-1">Overripe + Rotten</p>
        </div>
      </div>

      {/* Jetson detailed info */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-gray-400 text-xs">Jetson Label</span>
          <span className="text-white text-sm font-semibold capitalize">{data.jetsonLabel}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-400 text-xs">Confidence</span>
          <span className="text-white text-sm font-semibold">{data.jetsonConfidence.toFixed(2)}%</span>
        </div>
        {data.advice && (
          <div className="flex items-start gap-2 pt-2 border-t border-white/5">
            <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-gray-300 text-xs">{data.advice}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CombinedSpoilageCard;
