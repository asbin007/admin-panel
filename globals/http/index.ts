import axios from "axios";

const API = axios.create({
  // baseURL: "https://nike-backend-1-g9i6.onrender.com/api",
  baseURL: "http://localhost:5000/api",

  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },  
});

const APIS = axios.create({
  // baseURL: "https://nike-backend-1-g9i6.onrender.com/api",
  baseURL: "http://localhost:5000/api",

  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// ✅ Interceptor with Bearer token prefix for proper authentication
APIS.interceptors.request.use((config) => {
  const token = localStorage.getItem("tokenauth");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export { API, APIS };
