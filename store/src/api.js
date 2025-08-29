import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, // .env se aayega
  withCredentials: true,
});

export default api;
