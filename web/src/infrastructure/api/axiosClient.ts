import axios from "axios";

import { API_ROUTES } from "@/infrastructure/config/apiRoutes";

export const axiosClient = axios.create({
  baseURL: API_ROUTES.BASE_URL,
  timeout: 5000,
  headers: {
    "Content-Type": "application/json",
  },
});
