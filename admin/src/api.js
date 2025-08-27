import axios from 'axios';

const api = axios.create({
  baseURL: '/api',        // Vite proxy karega -> http://localhost:4000
  withCredentials: true   // httpOnly cookie bhejne/lenne ke liye
});

export default api;
