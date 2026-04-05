import { useEffect, useRef, useState } from "react";
import { getSensors } from "../services/spoilageService";

const MAX_POINTS = 60; // keep last 60 data points in the chart

/**
 * useRealtimeData
 *
 * Returns a rolling array of { time, co2, humidity, temp } objects
 * updated every `intervalMs` milliseconds from GET /sensors.
 */
export function useRealtimeData(intervalMs = 3000) {
  const [series, setSeries] = useState([]);
  const [latest, setLatest] = useState(null);
  const [error, setError]   = useState(false);
  const timerRef            = useRef(null);

  const tick = async () => {
    try {
      const data = await getSensors();
      setError(false);

      // Only push a point when backend has real readings
      if (data.co2 !== null && data.co2 !== undefined) {
        const point = {
          time:     new Date().toLocaleTimeString("en-IN", { hour12: false }),
          co2:      data.co2,
          humidity: data.humidity,
          temp:     data.temp,
        };

        setSeries((prev) => {
          const next = [...prev, point];
          return next.length > MAX_POINTS ? next.slice(next.length - MAX_POINTS) : next;
        });

        setLatest(point);
      }
    } catch {
      setError(true);
    }
  };

  useEffect(() => {
    tick(); // immediate first fetch
    timerRef.current = setInterval(tick, intervalMs);
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs]);

  return { series, latest, error };
}
