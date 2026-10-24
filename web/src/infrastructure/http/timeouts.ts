/** Default API request timeout. */
export const REQUEST_TIMEOUT_MS = 5_000;

/**
 * Timeout for requests that send emails within the request (ADR-0017): password reset, members,
 * project creation, mail settings. The server waits for SMTP up to 10 seconds and responds within 15 —
 * the contract asks the client to wait at least 20 seconds (addProjectMembers in api/openapi.yaml).
 */
export const MAIL_REQUEST_TIMEOUT_MS = 20_000;

/**
 * Timeout for file transfers: attachments go up to 25 MB both ways (ADR-0037), which the default
 * 5 seconds cannot carry on a slow link.
 */
export const FILE_TRANSFER_TIMEOUT_MS = 120_000;
