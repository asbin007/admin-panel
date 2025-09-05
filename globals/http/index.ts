import axios from "axios";

const API = axios.create({
  baseURL: "https://nike-backend-1-g9i6.onrender.com/api",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },  
});

const APIS = axios.create({
  baseURL: "https://nike-backend-1-g9i6.onrender.com/api",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// ✅ Interceptor with raw token (no Bearer prefix)
APIS.interceptors.request.use((config) => {
  const token = localStorage.getItem("tokenauth");
  if (token) {
    config.headers.Authorization = token;
  }
  return config;
});

// Add error handling interceptors
const handleError = (error: unknown) => {
  const axiosError = error as { code?: string; response?: { status?: number }; message?: string };
  
  if (axiosError.code === 'ERR_NETWORK') {
    console.error('🌐 Network Error: Backend server unreachable');
    console.error('💡 Make sure the Render backend is running and accessible');
    return Promise.reject({
      ...axiosError,
      message: 'Server connection failed. Please check your internet connection or try again later.'
    });
  }
  
  if (axiosError.response?.status === 403) {
    console.error('🚫 Forbidden: CORS policy or authentication issue');
    return Promise.reject({
      ...axiosError,
      message: 'Access denied. Please refresh the page and try again.'
    });
  }
  
  if (axiosError.response?.status === 404) {
    console.error('❌ Not Found: API endpoint does not exist');
    return Promise.reject({
      ...axiosError,
      message: 'Requested resource not found.'
    });
  }
  
  return Promise.reject(axiosError);
};

// Add error interceptors
API.interceptors.response.use(
  (response) => response,
  handleError
);

APIS.interceptors.response.use(
  (response) => response,
  handleError
);

export { API, APIS };
