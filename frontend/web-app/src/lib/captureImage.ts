// Client-side image helpers. Captures/uploads are downscaled to a JPEG data URI
// so they stay well under the request-body limits and never ship megapixel blobs.

const MAX_DIM = 900;
const QUALITY = 0.72;

function drawToDataUri(source: CanvasImageSource, w: number, h: number): string {
  const scale = Math.min(1, MAX_DIM / Math.max(w, h));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', QUALITY);
}

/** Snapshot the current frame of a playing <video> element. */
export function captureVideoFrame(video: HTMLVideoElement): string {
  return drawToDataUri(video, video.videoWidth, video.videoHeight);
}

/** Read an uploaded/pasted image File into a compressed data URI. */
export function fileToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please choose an image file.'));
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const uri = drawToDataUri(img, img.naturalWidth, img.naturalHeight);
      URL.revokeObjectURL(url);
      resolve(uri);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read that image.'));
    };
    img.src = url;
  });
}
