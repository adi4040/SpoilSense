import api from "./api";

export const getStatus = async () => {
  const res = await api.get("/status");
  return res.data;
};

export const getPrediction = async () => {
  const res = await api.post("/predict");
  return res.data;
};

export const resetDevice = async () => {
  const res = await api.post("/reset");
  return res.data;
};

export const getSensors = async () => {
  const res = await api.get("/sensors");
  return res.data;
};

// ── Device config ────────────────────────────────────────────────────────────

export const getDeviceConfig = async () => {
  const res = await api.get("/config");
  return res.data;
};

export const updateDeviceConfig = async (data) => {
  const res = await api.post("/config", data);
  return res.data;
};

export const connectDevice = async () => {
  const res = await api.post("/config/connect");
  return res.data;
};

export const disconnectDevice = async () => {
  const res = await api.post("/config/disconnect");
  return res.data;
};

export const getAvailablePorts = async () => {
  const res = await api.get("/config/ports");
  return res.data;
};

// ── Jetson Nano API ──────────────────────────────────────────────────────────

export const getJetsonResult = async () => {
  try {
    const response = await fetch("https://7248-152-58-30-125.ngrok-free.app/result");
    if (!response.ok) {
      throw new Error(`Jetson API error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch Jetson Nano result:", error);
    throw error;
  }
};

