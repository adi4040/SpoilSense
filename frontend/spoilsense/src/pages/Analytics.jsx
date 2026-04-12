import { useRealtimeData } from "../hooks/useRealtimeData";
import CO2ChartCard from "../components/CO2ChartCard";
import CO2HistoricalTrends from "../components/CO2HistoricalTrends";
import PredictionAnalytics from "../components/PredictionAnalytics";
import DashboardLayout from "../layouts/DashboardLayout";

/* ── Top summary stat ── */
function StatPill({ label, value, unit, accent }) {
  return (
    <div className="flex flex-col gap-0.5 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
      <span className="text-[10px] text-gray-500 uppercase tracking-widest">{label}</span>
      <span className={`text-xl font-bold ${accent}`}>
        {value !== null && value !== undefined ? value : "—"}
        <span className="text-sm font-normal text-gray-500 ml-1">{unit}</span>
      </span>
    </div>
  );
}

export default function AnalyticsPage() {
  const { series, latest, error } = useRealtimeData(3000);

  return (
    <DashboardLayout>
      {/* ── Page header ── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Analytics</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Real-time sensor telemetry · auto-refresh every 3 s
          </p>
        </div>

        {/* Live indicator */}
        <div className="flex items-center gap-2 mt-1">
          {error ? (
            <span className="text-xs text-rose-400 border border-rose-400/30 bg-rose-400/10 px-3 py-1 rounded-full">
              ⚠ Backend unreachable
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </span>
          )}
        </div>
      </div>

      {/* ── Quick stats row ── */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <StatPill label="CO₂ (current)"  value={latest?.co2}      unit="ppm" accent="text-emerald-300" />
        <StatPill label="Humidity"        value={latest?.humidity}  unit="%"   accent="text-sky-300"     />
        <StatPill label="Temperature"     value={latest?.temp}      unit="°C"  accent="text-orange-300"  />
        <StatPill label="Data points"     value={series.length}     unit=""    accent="text-purple-300"  />
      </div>

      {/* ── Chart grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
        <CO2ChartCard
          title="CO₂ Concentration"
          dataKey="co2"
          unit="ppm"
          series={series}
          description="Carbon dioxide level · thresholds: 600 / 1000 ppm"
        />
        <CO2ChartCard
          title="Relative Humidity"
          dataKey="humidity"
          unit="%"
          series={series}
          description="Ambient humidity · thresholds: 60 / 80 %"
        />
        <CO2ChartCard
          title="Temperature"
          dataKey="temp"
          unit="°C"
          series={series}
          description="Sensor temperature · thresholds: 28 / 35 °C"
        />
      </div>

      {/* ── Historical Trends Section ── */}
      <CO2HistoricalTrends />

      {/* ── Prediction Analytics Section ── */}
      <div className="mt-8">
        <PredictionAnalytics />
      </div>

      {/* ── Empty state ── */}
      {series.length === 0 && !error && (
        <div className="mt-12 flex flex-col items-center gap-3 text-center">
          <div className="w-10 h-10 border-2 border-white/20 border-t-emerald-400 rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Waiting for sensor data…</p>
          <p className="text-gray-700 text-xs">
            Make sure the device is connected and the backend is running.
          </p>
        </div>
      )}
    </DashboardLayout>
  );
}
