'use client';

import React, { useMemo, useRef, useState } from 'react';
import { Cropper } from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import { Loader2, X } from 'lucide-react';

const OUTPUT_SIZE = 1024;
const MIN_OUTPUT_SIZE = 640;
const MAX_SAFE_BYTES = 170 * 1024;

const estimateDataUrlBytes = (dataUrl) => {
  const payload = String(dataUrl || '').split(',')[1] || '';
  if (!payload) return 0;
  return Math.ceil((payload.length * 3) / 4);
};

const toCroppedDataUrl = (cropper) => {
  let targetSize = OUTPUT_SIZE;
  let quality = 0.92;
  let bestDataUrl = '';

  while (targetSize >= MIN_OUTPUT_SIZE) {
    const canvas = cropper?.getCroppedCanvas({
      width: targetSize,
      height: targetSize,
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high',
    });

    if (!canvas) {
      throw new Error('Unable to process cropped image.');
    }

    quality = 0.92;
    while (quality >= 0.7) {
      const candidate = canvas.toDataURL('image/jpeg', quality);
      bestDataUrl = candidate;
      if (estimateDataUrlBytes(candidate) <= MAX_SAFE_BYTES) {
        return candidate;
      }
      quality -= 0.06;
    }

    targetSize -= 128;
  }

  if (!bestDataUrl) {
    throw new Error('Unable to process cropped image.');
  }

  return bestDataUrl;
};

export default function ImageCropperModal({
  isOpen,
  imageSrc,
  title = 'Crop image',
  confirmLabel = 'Apply crop',
  onClose,
  onConfirm,
}) {
  const cropperRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [lockSquare] = useState(true);

  const canConfirm = useMemo(() => Boolean(imageSrc && !busy), [busy, imageSrc]);

  const handleConfirm = async () => {
    if (!canConfirm) return;
    try {
      setBusy(true);
      setError('');
      const instance = cropperRef.current?.cropper;
      const croppedDataUrl = toCroppedDataUrl(instance);
      await onConfirm?.(croppedDataUrl);
    } catch (nextError) {
      setError(nextError?.message || 'Failed to crop image.');
    } finally {
      setBusy(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-[960px] overflow-hidden rounded-2xl border border-[#a3b18a] bg-[#f8fbf6] shadow-2xl dark:border-[#444d57] dark:bg-[#22272b]">
        <div className="flex items-center justify-between border-b border-[#d6d3c9] px-4 py-3 dark:border-[#444d57]">
          <div>
            <h3 className="text-lg font-semibold text-[#1f3a2a] dark:text-white">{title}</h3>
            <p className="text-xs text-[#5f6f52] dark:text-[#b3bcc5]">
              Drag and resize the crop box directly. Use mouse wheel or pinch to zoom image.
            </p>
          </div>
          <button
            type="button"
            onClick={busy ? undefined : onClose}
            className="rounded-full p-2 text-[#3a5a40] hover:bg-[#eef6ee] disabled:opacity-50 dark:text-white dark:hover:bg-[#353c44]"
            disabled={busy}
            aria-label="Close cropper"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5">
          <div className="relative h-[340px] w-full overflow-hidden rounded-2xl border border-[#bfd0af] bg-[#121416] dark:border-[#444d57] sm:h-[500px]">
            {imageSrc ? (
              <Cropper
                ref={cropperRef}
                src={imageSrc}
                style={{ height: '100%', width: '100%' }}
                viewMode={1}
                dragMode="move"
                aspectRatio={lockSquare ? 1 : NaN}
                autoCrop
                autoCropArea={0.7}
                guides
                center
                highlight
                background={false}
                responsive
                modal
                movable
                zoomable
                zoomOnTouch
                zoomOnWheel
                wheelZoomRatio={0.12}
                cropBoxMovable
                cropBoxResizable
                toggleDragModeOnDblclick={false}
              />
            ) : null}
          </div>

          {error ? <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p> : null}

          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="rounded-xl border border-[#a3b18a] px-4 py-2 text-[#344e41] hover:bg-[#f5f5f2] disabled:opacity-50 dark:border-[#444d57] dark:text-white dark:hover:bg-[#353c44]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!canConfirm}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#3a5a40] px-4 py-2 font-semibold text-white hover:bg-[#344e41] disabled:opacity-60 dark:bg-[#6f9b74] dark:text-[#121416] dark:hover:bg-[#82ad86]"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {busy ? 'Applying...' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
