import { useEffect, useState } from "react";
import { getSensors } from "../services/spoilageService";

const statRow = (label, value, unit = "") => (
  <div className="flex items-center justify-between py-2 border-b border-white/10 last:border-0">
    <span className="text-gray-400 text-sm">{label}</span>
    <span className="text-white font-semibold">
      {value !== null && value !== undefined ? `${value} ${unit}`.trim() : "—"}
    </span>
  </div>
);

const SensorCard = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getSensors();
        setData(res);
      } catch (err) {
        console.error(err);
      }
    };

    fetch();
    const interval = setInterval(fetch, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-1">
      <h2 className="text-lg font-semibold mb-4">Live Sensor Readings</h2>

      {!data || (data.temp === null && data.co2 === null) ? (
        <p className="text-gray-400 text-sm">Waiting for device data...</p>
      ) : (
        <div>
          {statRow("Temperature", data.temp, "°C")}
          {statRow("CO₂ (latest)", data.co2, "ppm")}
          {statRow("CO₂ (avg)", data.co2_avg, "ppm")}
          {statRow("Humidity", data.humidity, "%")}
        </div>
      )}
    </div>
  );
};

export default SensorCard;
