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

// ✅ Interceptor with raw token (no Bearer prefix) - backend expects raw token
APIS.interceptors.request.use((config) => {
  const token = localStorage.getItem("tokenauth");
  if (token) {
    config.headers.Authorization = token;
  }
  return config;
});

export { API, APIS };
