import type { FileRepository } from "@/domain/repositories/FileRepository";

import { API_ROUTES } from "../config/apiRoutes";
import axiosClient from "../http/axiosClient";
import type { HttpClient } from "../http/HttpClient";
import { FILE_TRANSFER_TIMEOUT_MS } from "../http/timeouts";

// With responseType "blob" an error body is a Blob too, so the AppError carries no API code:
// callers show one generic message for any failure.
const createFileRepository = (http: HttpClient): FileRepository => ({
  download: (fileId) =>
    http.get<Blob>(API_ROUTES.FILE(fileId), {
      responseType: "blob",
      timeout: FILE_TRANSFER_TIMEOUT_MS,
    }),
});

export const fileRepository: FileRepository = createFileRepository(axiosClient);
