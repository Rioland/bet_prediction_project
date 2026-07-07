import axios from "axios";

import { API_URL } from "@/lib/api-url";

const api = axios.create({
  baseURL: API_URL,
  timeout: 90_000,
});

export default api;
