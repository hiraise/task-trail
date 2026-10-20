import { AxiosHttpClient } from "./AxiosHttpClient";

const axiosClient = new AxiosHttpClient(import.meta.env.VITE_API_URL || "http://localhost:8080");

export default axiosClient;
