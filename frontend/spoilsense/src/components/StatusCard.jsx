import { useEffect, useRef, useState } from "react";
import { getStatus, resetDevice } from "../services/spoilageService";

const StatusCard = () => {
  const [status, setStatus]       = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [resetting, setResetting]   = useState(false);
  const [feedback, setFeedback]     = useState(null); // { type: "success"|"error", msg }
  const confirmTimerRef             = useRef(null);

  const fetchStatus = async () => {
    try {
      const data = await getStatus();
      setStatus(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => {
      clearInterval(interval);
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
    };
  }, []);

  const handleResetClick = () => {
    if (!confirming) {
      // First click → ask for confirmation; auto-cancel after 4 s
      setConfirming(true);
      confirmTimerRef.current = setTimeout(() => setConfirming(false), 4000);
      return;
    }

    // Second click → confirmed, execute reset
    clearTimeout(confirmTimerRef.current);
    setConfirming(false);
    executeReset();
  };

  const handleCancelReset = () => {
    clearTimeout(confirmTimerRef.current);
    setConfirming(false);
  };

  const executeReset = async () => {
    setResetting(true);
    try {
      await resetDevice();
      setFeedback({ type: "success", msg: "Device reset successfully." });
      await fetchStatus(); // refresh immediately
    } catch (err) {
      console.error(err);
      setFeedback({ type: "error", msg: "Reset failed. Try again." });
    } finally {
      setResetting(false);
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg border border-white/10 rounded-2xl p-6 text-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Device Status</h2>

        {/* Reset button area */}
        <div className="flex items-center gap-2">
          {confirming && (
            <button
              id="cancel-reset-btn"
              onClick={handleCancelReset}
              className="text-xs px-2 py-1 rounded-lg border border-white/20 text-gray-300 hover:bg-white/10 transition-all"
            >
              Cancel
            </button>
          )}
          <button
            id="reset-device-btn"
            onClick={handleResetClick}
            disabled={resetting}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-all duration-200
              ${confirming
                ? "bg-red-500/80 border-red-400 text-white animate-pulse hover:bg-red-500"
                : resetting
                  ? "bg-white/5 border-white/10 text-gray-500 cursor-not-allowed"
                  : "bg-white/5 border-white/15 text-gray-300 hover:bg-red-500/20 hover:border-red-400/50 hover:text-red-300"
              }`}
          >
            {resetting ? "Resetting…" : confirming ? "Confirm Reset?" : "Reset Device"}
          </button>
        </div>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div
          className={`mb-3 text-xs px-3 py-2 rounded-lg border ${
            feedback.type === "success"
              ? "bg-green-500/15 border-green-500/30 text-green-300"
              : "bg-red-500/15 border-red-500/30 text-red-300"
          }`}
        >
          {feedback.msg}
        </div>
      )}

      {/* Status info */}
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