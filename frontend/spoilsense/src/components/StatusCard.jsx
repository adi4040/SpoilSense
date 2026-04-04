import { useEffect, useState } from "react";
import { getStatus } from "../services/spoilageService";

const StatusCard = () => {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await getStatus();
        setStatus(data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 3000); // auto refresh

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white/10 backdrop-blur-lg border border-white/10 rounded-2xl p-6 text-white">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-lg font-semibold">Device Status</h2>
      </div>

      {status ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`w-3 h-3 rounded-full ${
                status.connected
                  ? "bg-green-400 animate-pulse shadow-[0_0_6px_2px_rgba(74,222,128,0.6)]"
                  : "bg-red-500 shadow-[0_0_6px_2px_rgba(239,68,68,0.6)]"
              }`}
            />
            <span className={status.connected ? "text-green-400" : "text-red-400"}>
              {status.connected ? "Connected" : "Disconnected"}
            </span>
          </div>

          <p>
            Ready:{" "}
            <span className={status.ready ? "text-green-400" : "text-yellow-400"}>
              {status.ready ? "Yes" : "No"}
            </span>
          </p>

          <p>Buffer: {status.buffer_size}</p>
          <p>Elapsed: {status.elapsed_s}s</p>
        </div>
      ) : (
        <p className="text-gray-400">Loading...</p>
      )}
    </div>
  );
};

export default StatusCard;