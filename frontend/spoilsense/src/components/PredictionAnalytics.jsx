import { useEffect, useState } from "react";
import { LineChart, Line, CartesianGrid, Tooltip, XAxis, YAxis, ResponsiveContainer, Legend, BarChart, Bar } from "recharts";
import { AlertCircle, TrendingUp, Calendar, Clock, Download, Loader } from "lucide-react";
import api from "../services/api";

/**
 * Prediction Analytics Component
 * Displays historical prediction trends from both backend ML and Jetson Nano
 */
const PredictionAnalytics = () => {
  const [backendData, setBackendData] = useState([]);
  const [jetsonData, setJetsonData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [backendStats, setBackendStats] = useState(null);
  const [jetsonStats, setJetsonStats] = useState(null);
  const [timeRange, setTimeRange] = useState("2h");

  const timeRangeOptions = [
    { value: "2h", label: "Last 2 Hours", hours: 2 },
    { value: "12h", label: "Last 12 Hours", hours: 12 },
    { value: "24h", label: "Last 24 Hours", hours: 24 },
    { value: "2d", label: "Last 2 Days", hours: 48 },
    { value: "3d", label: "Last 3 Days", hours: 72 },
    { value: "4d", label: "Last 4 Days", hours: 96 },
    { value: "5d", label: "Last 5 Days", hours: 120 },
    { value: "10d", label: "Last 10 Days", hours: 240 },
    { value: "30d", label: "Last 30 Days", hours: 720 },
    { value: "all", label: "All Data", hours: null },
  ];

  const fetchPredictionAnalytics = async (selectedTimeRange = timeRange) => {
    try {
      setLoading(true);
      setError(null);

      let filteredData = [];
      
      if (selectedTimeRange === "all") {
        const response = await api.get("/analytics/predictions?limit=10000");
        filteredData = response.data?.data || [];
      } else {
        const hoursOption = timeRangeOptions.find(opt => opt.value === selectedTimeRange);
        const hours = hoursOption?.hours || 2;
        const response = await api.get(`/analytics/predictions/by-timerange?hours=${hours}`);
        filteredData = response.data?.data || [];
      }

      if (filteredData && filteredData.length > 0) {
        // Separate by source
        const backend = filteredData.filter(d => d.Source === "backend");
        const jetson = filteredData.filter(d => d.Source === "jetson");

        // Format for Recharts
        const formatData = (data) =>
          data.map((point) => ({
            timestamp: new Date(point.Timestamp).toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            }),
            fullTimestamp: point.Timestamp,
            Label: point.Label,
            SpoilageIndex: parseFloat(point.SpoilageIndex),
            Confidence: parseFloat(point.Confidence),
          }));

        setBackendData(formatData(backend));
        setJetsonData(formatData(jetson));

        // Calculate statistics
        const computeStats = (data) => {
          if (!data.length) return null;
          const indices = data.map(d => d.SpoilageIndex);
          const confidences = data.map(d => d.Confidence);
          return {
            total: data.length,
            spoilage_avg: (indices.reduce((a, b) => a + b, 0) / data.length).toFixed(3),
            spoilage_min: Math.min(...indices).toFixed(3),
            spoilage_max: Math.max(...indices).toFixed(3),
            confidence_avg: (confidences.reduce((a, b) => a + b, 0) / data.length).toFixed(3),
            confidence_min: Math.min(...confidences).toFixed(3),
            confidence_max: Math.max(...confidences).toFixed(3),
          };
        };

        setBackendStats(computeStats(backend.length > 0 ? formatData(backend) : []));
        setJetsonStats(computeStats(jetson.length > 0 ? formatData(jetson) : []));
      } else {
        setError("No prediction data available for the selected time range");
        setBackendData([]);
        setJetsonData([]);
        setBackendStats(null);
        setJetsonStats(null);
      }
    } catch (err) {
      console.error("Failed to fetch prediction analytics:", err);
      setError("Unable to fetch prediction analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictionAnalytics();
  }, [timeRange]);

  useEffect(() => {
    const interval = setInterval(() => fetchPredictionAnalytics(), 30000);
    return () => clearInterval(interval);
  }, [timeRange]);

  if (loading) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Prediction Analytics
          </h2>
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-400 text-sm">Loading prediction data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5" />
          Prediction Analytics
        </h2>
        <div className="flex items-center gap-3 bg-yellow-500/10 border border-yellow-400/20 rounded-lg p-4">
          <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
          <p className="text-yellow-300 text-sm">
            {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Time Range Filter */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              Prediction Analytics
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Backend ML model vs Jetson Nano predictions over time
            </p>
          </div>
        </div>

        {/* Time Range Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-400 font-medium flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Time Range:
          </span>
          <div className="flex gap-2 flex-wrap">
            {timeRangeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setTimeRange(option.value)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                  timeRange === option.value
                    ? "bg-emerald-500/80 text-white border border-emerald-400"
                    : "bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 hover:border-white/20"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Backend Predictions Section */}
      {backendData.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-white">Backend ML Predictions</h3>
            <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">
              {backendData.length} samples
            </span>
          </div>

          {/* Backend Stats */}
          {backendStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-black/20 rounded-lg p-4">
              <div className="space-y-1">
                <p className="text-xs text-gray-500">Spoilage Avg</p>
                <p className="text-lg font-bold text-emerald-300">{backendStats.spoilage_avg}</p>
                <p className="text-xs text-gray-600">
                  {backendStats.spoilage_min} - {backendStats.spoilage_max}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-500">Total Predictions</p>
                <p className="text-lg font-bold text-purple-300">{backendStats.total}</p>
              </div>
            </div>
          )}

          {/* Backend Spoilage Chart */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-white">Spoilage Index Trend</h4>
            <div className="bg-black/20 rounded-lg p-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={backendData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#111",
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: "8px",
                    }}
                    formatter={(value) => value.toFixed(3)}
                  />
                  <XAxis dataKey="timestamp" tick={{ fontSize: 12, fill: "#999" }} angle={-45} height={80} />
                  <YAxis tick={{ fontSize: 12, fill: "#999" }} domain={[0, 1]} />
                  <Line
                    type="monotone"
                    dataKey="SpoilageIndex"
                    stroke="#3b82f6"
                    dot={false}
                    strokeWidth={2}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>


        </div>
      )}

      {/* Jetson Predictions Section */}
      {jetsonData.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-white">Jetson Nano Predictions</h3>
            <span className="text-xs bg-orange-500/20 text-orange-300 px-2 py-1 rounded">
              {jetsonData.length} samples
            </span>
          </div>

          {/* Jetson Stats */}
          {jetsonStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-black/20 rounded-lg p-4">
              <div className="space-y-1">
                <p className="text-xs text-gray-500">Spoilage Avg</p>
                <p className="text-lg font-bold text-emerald-300">{jetsonStats.spoilage_avg}</p>
                <p className="text-xs text-gray-600">
                  {jetsonStats.spoilage_min} - {jetsonStats.spoilage_max}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-500">Total Predictions</p>
                <p className="text-lg font-bold text-purple-300">{jetsonStats.total}</p>
              </div>
            </div>
          )}

          {/* Jetson Spoilage Chart */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-white">Spoilage Index Trend</h4>
            <div className="bg-black/20 rounded-lg p-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={jetsonData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#111",
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: "8px",
                    }}
                    formatter={(value) => value.toFixed(3)}
                  />
                  <XAxis dataKey="timestamp" tick={{ fontSize: 12, fill: "#999" }} angle={-45} height={80} />
                  <YAxis tick={{ fontSize: 12, fill: "#999" }} domain={[0, 1]} />
                  <Line
                    type="monotone"
                    dataKey="SpoilageIndex"
                    stroke="#f97316"
                    dot={false}
                    strokeWidth={2}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>


        </div>
      )}

      {/* Info Box */}
      <div className="bg-cyan-500/5 border border-cyan-400/20 rounded-lg p-4 space-y-2">
        <p className="text-xs font-semibold text-cyan-300">💡 How to Read This</p>
        <ul className="text-xs text-cyan-200/80 space-y-1">
          <li>• <strong>Spoilage Index</strong>: 0 = Fresh, 1 = Fully Rotten (0-1 range)</li>
          <li>• <strong>Confidence</strong>: Model certainty in the prediction (0-1 range)</li>
          <li>• Predictions are automatically logged every time a model runs</li>
          <li>• Compare trends between Backend ML and Jetson Nano for consistency</li>
        </ul>
      </div>
    </div>
  );
};

export default PredictionAnalytics;
