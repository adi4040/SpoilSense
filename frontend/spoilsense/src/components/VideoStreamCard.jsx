import { useEffect, useState, useRef } from "react";
import { AlertCircle, Loader } from "lucide-react";

const VideoStreamCard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const canvasRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    const streamMJPEG = async () => {
      try {
        const response = await fetch(
          "https://stardust-reacquire-riverside.ngrok-free.dev/stream",
          {
            headers: {
              "ngrok-skip-browser-warning": "true",
              "ngrok-skip-iframe-browser-warning": "true",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Stream error: ${response.status}`);
        }

        const reader = response.body.getReader();
        let buffer = new Uint8Array(0);
        const SOI = 0xffd8; // JPEG Start of Image
        const EOI = 0xffd9; // JPEG End of Image

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (!isMountedRef.current) break;

          // Append new data to buffer
          const newBuffer = new Uint8Array(buffer.length + value.length);
          newBuffer.set(buffer);
          newBuffer.set(value, buffer.length);
          buffer = newBuffer;

          // Find JPEG frames (0xFFD8...0xFFD9)
          let i = 0;
          while (i < buffer.length - 1) {
            if (buffer[i] === 0xff && buffer[i + 1] === 0xd8) {
              // Found SOI, look for EOI
              let j = i + 2;
              while (j < buffer.length - 1) {
                if (buffer[j] === 0xff && buffer[j + 1] === 0xd9) {
                  // Found EOI
                  const jpegData = buffer.slice(i, j + 2);
                  const blob = new Blob([jpegData], { type: "image/jpeg" });
                  const url = URL.createObjectURL(blob);

                  const img = new Image();
                  img.onload = () => {
                    if (isMountedRef.current && canvasRef.current) {
                      const canvas = canvasRef.current;
                      const ctx = canvas.getContext("2d");
                      canvas.width = img.width;
                      canvas.height = img.height;
                      ctx.drawImage(img, 0, 0);
                      setLoading(false);
                      setError(null);
                    }
                    URL.revokeObjectURL(url);
                  };
                  img.onerror = () => {
                    console.error("Failed to load JPEG frame");
                    URL.revokeObjectURL(url);
                  };
                  img.src = url;

                  // Remove processed frame from buffer
                  buffer = buffer.slice(j + 2);
                  i = 0;
                  break;
                }
                j++;
              }
              if (j < buffer.length - 1) continue;
              i++;
            } else {
              i++;
            }
          }
        }
      } catch (err) {
        if (isMountedRef.current) {
          console.error("Stream error:", err);
          setLoading(false);
          setError("Unable to connect to video stream. Check if Jetson Nano is running and ngrok tunnel is active.");
        }
      }
    };

    streamMJPEG();

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

          <canvas
            ref={canvasRef}
            className="w-full h-full object-contain bg-black"
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
