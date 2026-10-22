import { API_URL } from "../config/apiRoutes";

import { AxiosHttpClient } from "./AxiosHttpClient";

const axiosClient = new AxiosHttpClient(API_URL);

export default axiosClient;
