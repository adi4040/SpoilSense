import { useEffect, useState, useRef } from "react";
import { AlertCircle, Loader } from "lucide-react";

const VideoStreamCard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const imageRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    const handleImageLoad = () => {
      if (isMountedRef.current) {
        setLoading(false);
        setError(null);
      }
    };

    const handleImageError = () => {
      if (isMountedRef.current) {
        setLoading(false);
        setError("Unable to connect to video stream. Make sure the Jetson Nano is running.");
      }
    };

    const img = imageRef.current;
    if (img) {
      img.addEventListener("load", handleImageLoad);
      img.addEventListener("error", handleImageError);

      return () => {
        isMountedRef.current = false;
        img.removeEventListener("load", handleImageLoad);
        img.removeEventListener("error", handleImageError);
      };
    }

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return (
    <div className="space-y-1">
      <h2 className="text-lg font-semibold mb-4">Live Video Stream</h2>

      <div className="flex gap-4">
        {/* Left side: Video Stream */}
        <div className="relative w-1/2 h-64 bg-black/50 rounded-xl overflow-hidden border border-white/10 flex items-center justify-center flex-shrink-0">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 z-10">
              <Loader className="w-5 h-5 text-cyan-400 animate-spin" />
              <span className="text-gray-400 text-sm">Connecting...</span>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-red-500/5 border border-red-400/20 z-10">
              <AlertCircle className="w-8 h-8 text-red-400" />
              <p className="text-red-300 text-sm text-center px-4">{error}</p>
            </div>
          )}

          <img
            ref={imageRef}
            src="https://7248-152-58-30-125.ngrok-free.app/stream"
            alt="Live video stream from Jetson Nano"
            className="w-full h-full object-contain"
            style={{ display: loading || error ? "none" : "block" }}
          />
        </div>

        {/* Right side: Info */}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <p className="text-gray-300 text-sm mb-3">
              📹 Real-time video feed from Jetson Nano device
            </p>
            <p className="text-gray-400 text-xs">
              Resolution: 1080×720
            </p>
            <p className="text-gray-400 text-xs">
              Format: MJPEG Stream
            </p>
          </div>
          
          <div className="text-xs text-gray-500">
            <p>Status: {loading ? "Connecting..." : error ? "Disconnected" : "Live"}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoStreamCard;
