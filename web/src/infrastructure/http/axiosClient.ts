import { AxiosHttpClient } from "./AxiosHttpClient";

const axiosClient = new AxiosHttpClient(process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080");

export default axiosClient;
