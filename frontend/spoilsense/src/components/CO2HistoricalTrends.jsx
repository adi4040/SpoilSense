import { useEffect, useState } from "react";
import { LineChart, Line, CartesianGrid, Tooltip, XAxis, YAxis, ResponsiveContainer, Legend } from "recharts";
import { AlertCircle, TrendingUp, Calendar, Clock, Download, Loader } from "lucide-react";
import api from "../services/api";

/**
 * Historical CO2 Trends Component
 * Fetches readings from data logger with time range filtering
 */
const CO2HistoricalTrends = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [timeRange, setTimeRange] = useState("2h"); // Default: last 2 hours
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [downloadError, setDownloadError] = useState(null);

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

  const fetchHistoricalData = async (selectedTimeRange = timeRange) => {
    try {
      setLoading(true);
      setError(null);

      let response;
      
      if (selectedTimeRange === "all") {
        // Fetch all data
        response = await api.get("/analytics/data?limit=10000");
      } else {
        // Fetch data by time range
        const hoursOption = timeRangeOptions.find(opt => opt.value === selectedTimeRange);
        const hours = hoursOption?.hours || 2;
        response = await api.get(`/analytics/data/by-timerange?hours=${hours}`);
      }
      
      if (response.data?.data && response.data.data.length > 0) {
        // Format data for Recharts
        const formattedData = response.data.data.map((point) => ({
          timestamp: new Date(point.Timestamp).toLocaleTimeString("en-IN", { 
            hour: "2-digit", 
            minute: "2-digit",
            second: "2-digit"
          }),
          fullTimestamp: point.Timestamp,
          CO2: parseFloat(point.CO2),
          Temperature: parseFloat(point.Temperature),
          Humidity: parseFloat(point.Humidity),
        }));

        setData(formattedData);
      } else {
        setError("No data available for the selected time range");
      }

      // Fetch statistics
      const statsResponse = await api.get("/analytics/data/stats");
      if (statsResponse.data) {
        setStats(statsResponse.data);
      }
    } catch (err) {
      console.error("Failed to fetch historical data:", err);
      setError("Unable to fetch historical trend data");
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    try {
      setDownloadingPDF(true);
      setDownloadError(null);

      // Get hours from current time range
      const hoursOption = timeRangeOptions.find(opt => opt.value === timeRange);
      const hours = hoursOption?.hours || 2;

      // Fetch PDF from backend
      const response = await api.get(`/analytics/export/pdf?hours=${hours}`, {
        responseType: 'blob'
      });

      // Create blob URL and trigger download
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', `SpoilSense_Report_${hoursOption?.label.replace(' ', '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      console.log("✓ PDF downloaded successfully");
    } catch (err) {
      console.error("Failed to download PDF:", err);
      setDownloadError("Unable to generate PDF report");
    } finally {
      setDownloadingPDF(false);
    }
  };

  useEffect(() => {
    fetchHistoricalData();
  }, [timeRange]);

  useEffect(() => {
    // Refresh every 30 seconds
    const interval = setInterval(() => fetchHistoricalData(), 30000);
    return () => clearInterval(interval);
  }, [timeRange]);

  if (loading) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Trends Over Time
          </h2>
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-400 text-sm">Loading historical data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || data.length === 0) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5" />
          Trends Over Time
        </h2>
        <div className="flex items-center gap-3 bg-yellow-500/10 border border-yellow-400/20 rounded-lg p-4">
          <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
          <p className="text-yellow-300 text-sm">
            {error || "No historical data available yet. Start collecting data to see trends."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
      {/* Header & Time Range Filter */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              Trends Over Time
            </h2>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {timeRange === "all" 
                ? "All collected data" 
                : `Last ${data.length} readings`}
            </p>
          </div>
        </div>

        {/* Time Range Filter Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-400 font-medium flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Filter:
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

          {/* PDF Export Button */}
          <div className="ml-auto">
            <button
              onClick={downloadPDF}
              disabled={downloadingPDF || data.length === 0}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                downloadingPDF || data.length === 0
                  ? "bg-gray-500/20 text-gray-400 border border-gray-500/20 cursor-not-allowed"
                  : "bg-blue-500/20 text-blue-300 border border-blue-400/30 hover:bg-blue-500/30 hover:border-blue-400/50"
              }`}
              title={data.length === 0 ? "No data available for export" : "Download analytics report as PDF"}
            >
              {downloadingPDF ? (
                <>
                  <Loader className="w-3 h-3 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-3 h-3" />
                  Export PDF
                </>
              )}
            </button>
          </div>
        </div>

        {/* Download Error Message */}
        {downloadError && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-400/20 rounded-lg p-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-xs text-red-300">{downloadError}</p>
          </div>
        )}
      </div>

      {/* Statistics Summary */}
      {stats && (
        <div className="grid grid-cols-3 gap-3 bg-white/[0.02] rounded-lg p-4">
          <div className="space-y-1">
            <p className="text-xs text-gray-500">CO₂ Average</p>
            <p className="text-lg font-bold text-emerald-300">
              {stats.co2_avg} <span className="text-xs text-gray-500">ppm</span>
            </p>
            <p className="text-xs text-gray-600">
              Min: {stats.co2_min} | Max: {stats.co2_max}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-gray-500">Temperature Average</p>
            <p className="text-lg font-bold text-orange-300">
              {stats.temperature_avg} <span className="text-xs text-gray-500">°C</span>
            </p>
            <p className="text-xs text-gray-600">
              Min: {stats.temperature_min} | Max: {stats.temperature_max}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-gray-500">Humidity Average</p>
            <p className="text-lg font-bold text-sky-300">
              {stats.humidity_avg} <span className="text-xs text-gray-500">%</span>
            </p>
            <p className="text-xs text-gray-600">
              Min: {stats.humidity_min} | Max: {stats.humidity_max}
            </p>
          </div>
        </div>
      )}

      {/* CO2 Trend Chart */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-white">CO₂ Concentration Trend</h3>
        <div className="bg-black/20 rounded-lg p-4 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#111",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: "8px",
                  padding: "8px",
                }}
                labelStyle={{ color: "#fff" }}
                formatter={(value) => [value.toFixed(2), "CO₂ (ppm)"]}
                labelFormatter={(label) => `Time: ${label}`}
              />
              <XAxis
                dataKey="timestamp"
                tick={{ fontSize: 12, fill: "#999" }}
                angle={-45}
                height={80}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#999" }}
                label={{ value: "CO₂ (ppm)", angle: -90, position: "insideLeft", fill: "#999" }}
              />
              <Line
                type="monotone"
                dataKey="CO2"
                stroke="#22d3a0"
                dot={false}
                strokeWidth={2}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-gray-500">
          Shows CO₂ concentration variation across collected samples. Higher values may indicate spoilage progression.
        </p>
      </div>

      {/* Multi-parameter Trend Chart */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-white">Multi-Parameter Comparison</h3>
        <div className="bg-black/20 rounded-lg p-4 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#111",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: "8px",
                  padding: "8px",
                }}
                labelStyle={{ color: "#fff" }}
                formatter={(value) => value.toFixed(2)}
              />
              <XAxis
                dataKey="timestamp"
                tick={{ fontSize: 12, fill: "#999" }}
                angle={-45}
                height={80}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#999" }}
                label={{ value: "Value", angle: -90, position: "insideLeft", fill: "#999" }}
              />
              <Legend wrapperStyle={{ paddingTop: "20px" }} />
              <Line
                type="monotone"
                dataKey="CO2"
                stroke="#22d3a0"
                dot={false}
                strokeWidth={1.5}
                isAnimationActive={false}
                name="CO₂ (ppm)"
              />
              <Line
                type="monotone"
                dataKey="Temperature"
                stroke="#fb923c"
                dot={false}
                strokeWidth={1.5}
                isAnimationActive={false}
                name="Temperature (°C) × 10"
              />
              <Line
                type="monotone"
                dataKey="Humidity"
                stroke="#38bdf8"
                dot={false}
                strokeWidth={1.5}
                isAnimationActive={false}
                name="Humidity (%)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-gray-500">
          Normalized view showing all three parameters. Use this to identify correlations between sensors.
        </p>
      </div>

      {/* Info Box */}
      <div className="bg-emerald-500/5 border border-emerald-400/20 rounded-lg p-3 space-y-2">
        <p className="text-xs font-semibold text-emerald-300">💡 Insight</p>
        <p className="text-xs text-emerald-200/80">
          The data shown here represents the last {data.length} readings stored in the CSV database. 
          Data is automatically collected every time the sensor sends a reading after the warmup period.
        </p>
      </div>
    </div>
  );
};

export default CO2HistoricalTrends;
