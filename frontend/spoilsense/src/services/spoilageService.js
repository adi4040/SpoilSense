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
