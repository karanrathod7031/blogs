import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '../lib/firebase';

interface UploadImageOptions {
  folder: string;
  maxWidth?: number;
  maxHeight?: number;
  square?: boolean;
  quality?: number;
}

function sanitizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'image';
}

async function loadImage(file: File): Promise<HTMLImageElement> {
  const objectUrl = URL.createObjectURL(file);

  try {
    return await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to decode image'));
      img.src = objectUrl;
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return await new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Failed to encode image'));
        return;
      }
      resolve(blob);
    }, 'image/jpeg', quality);
  });
}

async function optimizeImage(file: File, options: UploadImageOptions): Promise<Blob> {
  const image = await loadImage(file);
  const canvas = document.createElement('canvas');
  const quality = options.quality ?? 0.8;

  if (options.square) {
    const size = Math.min(options.maxWidth ?? 400, options.maxHeight ?? 400);
    const sourceWidth = image.width;
    const sourceHeight = image.height;
    const minDim = Math.min(sourceWidth, sourceHeight);
    const sx = (sourceWidth - minDim) / 2;
    const sy = (sourceHeight - minDim) / 2;

    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d');
    ctx?.drawImage(image, sx, sy, minDim, minDim, 0, 0, size, size);
    return canvasToBlob(canvas, quality);
  }

  let width = image.width;
  let height = image.height;
  const maxWidth = options.maxWidth ?? 1200;
  const maxHeight = options.maxHeight ?? 800;

  if (width > height) {
    if (width > maxWidth) {
      height *= maxWidth / width;
      width = maxWidth;
    }
  } else if (height > maxHeight) {
    width *= maxHeight / height;
    height = maxHeight;
  }

  canvas.width = Math.round(width);
  canvas.height = Math.round(height);

  const ctx = canvas.getContext('2d');
  ctx?.drawImage(image, 0, 0, canvas.width, canvas.height);

  let blob = await canvasToBlob(canvas, quality);
  if (blob.size > 800_000 && quality > 0.5) {
    blob = await canvasToBlob(canvas, 0.5);
  }

  return blob;
}

export async function uploadOptimizedImage(file: File, options: UploadImageOptions): Promise<string> {
  const blob = await optimizeImage(file, options);
  const fileName = `${Date.now()}-${sanitizeName(file.name).replace(/\.[^.]+$/, '')}.jpg`;
  const storageRef = ref(storage, `${options.folder}/${fileName}`);

  await uploadBytes(storageRef, blob, {
    contentType: 'image/jpeg',
    cacheControl: 'public,max-age=31536000,immutable'
  });

  return getDownloadURL(storageRef);
}
