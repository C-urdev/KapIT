/**
 * Delays execution for a specified number of milliseconds.
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Executes a PUT request to R2 using the provided presigned URL,
 * applying an exponential backoff strategy for resilience against
 * transient network failures (e.g., 502, 503, or rate limits).
 * 
 * @param uploadUrl - The presigned PUT URL.
 * @param file - The file blob to upload.
 * @param contentType - The exact MIME type the presigned URL was locked to.
 * @param maxRetries - Maximum number of retry attempts (default: 3).
 * @param baseDelayMs - Base delay in milliseconds for backoff (default: 500).
 * 
 * @returns A Promise that resolves when the upload is successful.
 * @throws The last error encountered if all retries are exhausted.
 */
export const uploadFileToR2 = async (
  uploadUrl: string,
  file: File | Blob,
  contentType: string,
  maxRetries: number = 3,
  baseDelayMs: number = 500
): Promise<void> => {
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      const response = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': contentType,
        },
      });

      if (response.ok) {
        return;
      }

      // 4xx errors (except 429) are usually non-retryable client errors
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        const text = await response.text().catch(() => '');
        throw new Error(`Upload failed with status ${response.status}: ${text}`);
      }

      // If we reach here, it's a 5xx or 429, which might be retryable
      if (attempt >= maxRetries) {
        throw new Error(`Upload failed after ${maxRetries} retries with status ${response.status}.`);
      }
    } catch (error) {
      if (attempt >= maxRetries) {
        throw error;
      }
    }

    attempt++;
    
    // Exponential backoff with a small jitter to avoid thundering herds
    const backoffTime = baseDelayMs * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 100;
    
    await delay(backoffTime + jitter);
  }
};
