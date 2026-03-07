import axios from "axios";
import { auth } from "./auth";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = auth.getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});