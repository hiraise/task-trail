/** Stored files served by GET /v1/files/{fileId} (ADR-0013, ADR-0037). */
export interface FileRepository {
  /**
   * The file's content through the API client: an attachment needs a session, and the client
   * refreshes an expired one, which a plain link cannot do (ADR-0037).
   */
  download(fileId: string): Promise<Blob>;
}
