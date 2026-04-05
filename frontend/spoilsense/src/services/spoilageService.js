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