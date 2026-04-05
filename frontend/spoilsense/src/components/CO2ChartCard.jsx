import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */

function getColorProfile(key, value) {
  if (key === "co2") {
    if (value === null || value === undefined) return "neutral";
    if (value < 600)  return "green";
    if (value < 1000) return "yellow";
    return "red";
  }
  if (key === "humidity") {
    if (value === null || value === undefined) return "neutral";
    if (value < 60)  return "green";
    if (value < 80)  return "yellow";
    return "red";
  }
  if (key === "temp") {
    if (value === null || value === undefined) return "neutral";
    if (value < 28)  return "green";
    if (value < 35)  return "yellow";
    return "red";
  }
  return "neutral";

}


const PALETTE = {
  green:   { stroke: "#22d3a0", gradStart: "rgba(34,211,160,0.35)", gradEnd: "rgba(34,211,160,0)",  glow: "0 0 18px rgba(34,211,160,0.45)" },
  yellow:  { stroke: "#facc15", gradStart: "rgba(250,204,21,0.35)",  gradEnd: "rgba(250,204,21,0)",   glow: "0 0 18px rgba(250,204,21,0.45)"  },
  red:     { stroke: "#f43f5e", gradStart: "rgba(244,63,94,0.35)",   gradEnd: "rgba(244,63,94,0)",    glow: "0 0 18px rgba(244,63,94,0.45)"   },
  neutral: { stroke: "#6b7280", gradStart: "rgba(107,114,128,0.2)",  gradEnd: "rgba(107,114,128,0)",  glow: "none"                             },
};

const STATUS_LABEL = {
  green:   { text: "Stable",  cls: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30" },
  yellow:  { text: "Moderate", cls: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30"   },
  red:     { text: "High",    cls: "text-rose-400 bg-rose-400/10 border-rose-400/30"          },
  neutral: { text: "No data", cls: "text-gray-500 bg-white/5 border-white/10"                 },
};

function pctChange(series, key) {
  if (!series || series.length < 2) return null;
  const prev = series[series.length - 2][key];
  const curr = series[series.length - 1][key];
  if (prev === null || prev === undefined || prev === 0) return null;
  return (((curr - prev) / Math.abs(prev)) * 100).toFixed(2);
}

/* ─────────────────────────────────────────────
   Custom Tooltip
───────────────────────────────────────────── */
function ChartTooltip({ active, payload, label, unit }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#111] border border-white/10 rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-gray-400 mb-1">{label}</p>
      <p className="text-white font-semibold">
        {payload[0].value} <span className="text-gray-400">{unit}</span>
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────
   CO2ChartCard (reusable)
───────────────────────────────────────────── */
export default function CO2ChartCard({ title, dataKey, unit, series, description }) {
  const latestVal   = series.length ? series[series.length - 1][dataKey] : null;
  const profile     = getColorProfile(dataKey, latestVal);
  const palette     = PALETTE[profile];
  const status      = STATUS_LABEL[profile];
  const pct         = pctChange(series, dataKey);
  const pctUp       = pct !== null && parseFloat(pct) > 0;
  const gradId      = `grad-${dataKey}`;
  const visibleData = series.slice(-100);

  // Thin the x-axis labels for readability
  const tickInterval = Math.max(1, Math.floor((visibleData.length - 1) / 5));

  return (
    <div
      className="relative bg-white/[0.04] border border-white/10 rounded-2xl p-5 flex flex-col gap-3
                 hover:bg-white/[0.07] hover:border-white/20 transition-all duration-300 overflow-hidden"
    >
      {/* Subtle corner glow */}
      <div
        className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none opacity-25 blur-3xl"
        style={{ background: palette.gradStart }}
      />

      {/* Header row */}
      <div className="flex items-start justify-between z-10">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-widest">{title}</p>
          <p className="text-3xl font-bold text-white mt-1 tracking-tight">
            {latestVal !== null && latestVal !== undefined ? latestVal : "—"}
            <span className="text-base font-normal text-gray-500 ml-1">{unit}</span>
          </p>
          {description && <p className="text-xs text-gray-600 mt-0.5">{description}</p>}
        </div>

        <div className="flex flex-col items-end gap-2">
          {/* Status badge */}
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${status.cls}`}>
            {status.text}
          </span>

          {/* % change */}
          {pct !== null && (
            <span
              className={`text-xs font-semibold flex items-center gap-0.5 ${
                pctUp ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {pctUp ? "▲" : "▼"} {Math.abs(pct)}%
            </span>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="z-10 h-36">
        {series.length < 2 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-gray-600 text-xs">Collecting data…</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={visibleData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={palette.stroke} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={palette.stroke} stopOpacity={0}   />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />

              <XAxis
                dataKey="time"
                tick={{ fill: "#4b5563", fontSize: 9 }}
                tickLine={false}
                axisLine={false}
                interval={tickInterval}
              />

              <YAxis
                tick={{ fill: "#4b5563", fontSize: 9 }}
                tickLine={false}
                axisLine={false}
                width={40}
                tickFormatter={(v) => `${v}`}
              />

              <Tooltip content={<ChartTooltip unit={unit} />} />

              <Area
                type="monotone"
                dataKey={dataKey}
                stroke={palette.stroke}
                strokeWidth={2}
                fill={`url(#${gradId})`}
                dot={false}
                activeDot={{
                  r: 4,
                  fill: palette.stroke,
                  strokeWidth: 0,
                  style: { filter: palette.glow },
                }}
                isAnimationActive={true}
                animationDuration={600}
                animationEasing="ease-out"
                style={{ filter: `drop-shadow(0 0 6px ${palette.stroke}88)` }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Bottom meta row */}
      <div className="flex items-center justify-between z-10 border-t border-white/5 pt-2">
        <span className="text-[10px] text-gray-600">
          {series.length} samples · live
        </span>
        <span className="text-[10px] text-gray-600">
          {series.length
            ? `Last: ${series[series.length - 1].time}`
            : "—"}
        </span>
      </div>
    </div>
  );
}
