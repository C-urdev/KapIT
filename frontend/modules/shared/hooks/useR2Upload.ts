import { useState, useCallback } from 'react';
import { uploadFileToR2 } from '../utils/r2UploadHelper';

export type UploadState = 
  | 'IDLE' 
  | 'REQUESTING_URL' 
  | 'UPLOADING' 
  | 'CONFIRMING' 
  | 'SUCCESS' 
  | 'ERROR';

export interface UseR2UploadOptions {
  presignEndpoint: string;
  confirmEndpoint: string;
  onSuccess?: (resumeData: any) => void;
  onError?: (error: Error) => void;
}

/**
 * A robust finite state machine hook for managing the two-phase R2 presigned upload flow.
 * Locks the UI during transitions to prevent duplicate submissions and handles the
 * entire process: Presign -> PUT to R2 (with backoff) -> Confirm.
 */
export const useR2Upload = ({
  presignEndpoint,
  confirmEndpoint,
  onSuccess,
  onError
}: UseR2UploadOptions) => {
  const [status, setStatus] = useState<UploadState>('IDLE');
  const [error, setError] = useState<string | null>(null);
  
  // Optionally, track progress percentage if desired (though standard fetch doesn't support upload progress natively)
  const [progress, setProgress] = useState<number>(0);

  const reset = useCallback(() => {
    setStatus('IDLE');
    setError(null);
    setProgress(0);
  }, []);

  const startUpload = useCallback(async (file: File) => {
    // 1. STATE LOCK: Prevent duplicate triggers
    if (status !== 'IDLE' && status !== 'ERROR') {
      return;
    }

    try {
      setStatus('REQUESTING_URL');
      setError(null);
      setProgress(10);

      // 2. Request Presigned URL
      const presignResponse = await fetch(presignEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          fileSize: file.size
        })
      });

      if (!presignResponse.ok) {
        const data = await presignResponse.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to get upload URL');
      }

      const { uploadUrl, objectKey } = await presignResponse.json();

      // 3. Upload to R2 (using exponential backoff helper)
      setStatus('UPLOADING');
      setProgress(30);
      
      await uploadFileToR2(uploadUrl, file, file.type);

      // 4. Confirm Upload with Backend
      setStatus('CONFIRMING');
      setProgress(80);

      const confirmResponse = await fetch(confirmEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          objectKey,
          contentType: file.type,
          fileSize: file.size
        })
      });

      if (!confirmResponse.ok) {
        const data = await confirmResponse.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to confirm upload');
      }

      const { resume } = await confirmResponse.json();

      // 5. Success
      setStatus('SUCCESS');
      setProgress(100);
      if (onSuccess) onSuccess(resume);

    } catch (err: any) {
      setStatus('ERROR');
      setError(err.message || 'An unexpected error occurred');
      if (onError) onError(err);
    }
  }, [status, presignEndpoint, confirmEndpoint, onSuccess, onError]);

  return {
    status,
    error,
    progress,
    startUpload,
    reset,
    isProcessing: status !== 'IDLE' && status !== 'SUCCESS' && status !== 'ERROR',
  };
};
