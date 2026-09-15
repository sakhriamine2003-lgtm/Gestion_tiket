import axios from "axios";

const api = axios.create({
  baseURL: "/backend/api",
});

export default api;