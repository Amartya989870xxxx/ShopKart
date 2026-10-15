import axios from "axios";

// In production, API requests route through the Vercel /api proxy to avoid cross-origin cookie issues.
// In local development, requests default to http://localhost:5001 unless VITE_API_URL is set.
const defaultBaseURL = import.meta.env.PROD ? "/api" : "http://localhost:5001";
const baseURL = import.meta.env.VITE_API_URL || defaultBaseURL;

const api = axios.create({
  baseURL,
  withCredentials: true,
});

export default api;