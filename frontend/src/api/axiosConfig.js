import axios from 'axios';

// base url for fastapi server
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const api = axios.create({
    baseURL: API_BASE_URL,
    // Timeout for requests (optional maybe remove in future)
    timeout: 5000
});

// Request interceptor to attach the JWT Token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        const tokenType = localStorage.getItem('tokenType') || 'Bearer';

        if (token) {
            config.headers.Authorization = `${tokenType} ${token}`;
        }
        return config
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
