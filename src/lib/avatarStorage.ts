import { del, get, set, update } from "idb-keyval";

export const AVATAR_BLOB_KEY = "resume-template-avatar-v1";
export const AVATAR_SIZE_PX = 512;
export const AVATAR_WEBP_QUALITY = 0.8;
export const AVATAR_CHANGED_EVENT = "resume-avatar-changed";

interface DecodedImage {
  width: number;
  height: number;
  draw: (
    ctx: CanvasRenderingContext2D,
    sx: number,
    sy: number,
    sw: number,
    sh: number,
    dx: number,
    dy: number,
    dw: number,
    dh: number,
  ) => void;
  cleanup: () => void;
}

async function decodeImage(file: File): Promise<DecodedImage> {
  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(file);
    return {
      width: bitmap.width,
      height: bitmap.height,
      draw: (ctx, sx, sy, sw, sh, dx, dy, dw, dh) => {
        ctx.drawImage(bitmap, sx, sy, sw, sh, dx, dy, dw, dh);
      },
      cleanup: () => bitmap.close(),
    };
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("Failed to decode image"));
      element.src = objectUrl;
    });

    return {
      width: img.naturalWidth || img.width,
      height: img.naturalHeight || img.height,
      draw: (ctx, sx, sy, sw, sh, dx, dy, dw, dh) => {
        ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
      },
      cleanup: () => URL.revokeObjectURL(objectUrl),
    };
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error;
  }
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mimeType, quality);
  });
}

export async function compressImageToWebpBlob(file: File): Promise<Blob> {
  const decoded = await decodeImage(file);
  try {
    const canvas = document.createElement("canvas");
    canvas.width = AVATAR_SIZE_PX;
    canvas.height = AVATAR_SIZE_PX;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Canvas 2D context is unavailable");
    }

    const side = Math.min(decoded.width, decoded.height);
    const sx = (decoded.width - side) / 2;
    const sy = (decoded.height - side) / 2;

    decoded.draw(ctx, sx, sy, side, side, 0, 0, AVATAR_SIZE_PX, AVATAR_SIZE_PX);

    const webpBlob = await canvasToBlob(
      canvas,
      "image/webp",
      AVATAR_WEBP_QUALITY,
    );
    if (webpBlob && webpBlob.type === "image/webp") {
      return webpBlob;
    }

    const fallbackBlob = await canvasToBlob(
      canvas,
      "image/jpeg",
      AVATAR_WEBP_QUALITY,
    );
    if (fallbackBlob) {
      return fallbackBlob;
    }

    throw new Error("Failed to encode image blob");
  } finally {
    decoded.cleanup();
  }
}

export function notifyAvatarChanged(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AVATAR_CHANGED_EVENT));
  }
}

export async function getAvatarBlob(): Promise<Blob | null> {
  if (typeof window === "undefined") return null;
  try {
    const blob = await get<Blob>(AVATAR_BLOB_KEY);
    return blob instanceof Blob ? blob : null;
  } catch {
    return null;
  }
}

export async function saveAvatarBlob(blob: Blob): Promise<void> {
  if (typeof window === "undefined") return;
  await set(AVATAR_BLOB_KEY, blob);
  notifyAvatarChanged();
}

export async function deleteAvatarBlob(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    await del(AVATAR_BLOB_KEY);
  } catch {
    // Ignore IndexedDB deletion errors
  }
  notifyAvatarChanged();
}

export interface SavedAvatar {
  id: string;
  blob: Blob;
}
export interface AvatarGallery {
  photos: SavedAvatar[];
  selectedId: string | null;
}
const emptyGallery = (): AvatarGallery => ({ photos: [], selectedId: null });
const galleryKey = (resumeId: string) =>
  `resume-template-avatar-gallery-v1:${resumeId}`;

export async function getAvatarGallery(
  resumeId: string,
): Promise<AvatarGallery> {
  if (typeof window === "undefined") return emptyGallery();
  return (await get<AvatarGallery>(galleryKey(resumeId))) ?? emptyGallery();
}

const pendingWrites = new Set<Promise<unknown>>();
let writeFailed = false;
function trackWrite<T>(work: Promise<T>): Promise<T> {
  pendingWrites.add(work);
  void work.then(
    () => pendingWrites.delete(work),
    () => {
      writeFailed = true;
      pendingWrites.delete(work);
    },
  );
  return work;
}

export async function changeAvatarGallery(
  resumeId: string,
  change: (gallery: AvatarGallery) => AvatarGallery,
  canEdit: () => boolean = () => true,
): Promise<void> {
  if (!canEdit()) throw new Error("Editing is no longer available.");
  await trackWrite(
    update<AvatarGallery>(galleryKey(resumeId), (current) => {
      return change(current ?? emptyGallery());
    }),
  );
  notifyAvatarChanged();
}

export async function clearAvatarGallery(resumeId: string): Promise<void> {
  await trackWrite(del(galleryKey(resumeId)));
  notifyAvatarChanged();
}

/** Call only when adopting the existing local resume, never when importing. */
export async function migrateLegacyAvatar(resumeId: string): Promise<void> {
  const blob = await get<Blob>(AVATAR_BLOB_KEY);
  if (!(blob instanceof Blob)) return;
  await update<AvatarGallery>(galleryKey(resumeId), (current) => {
    if (current) return current;
    const id = crypto.randomUUID();
    return { photos: [{ id, blob }], selectedId: id };
  });
  await del(AVATAR_BLOB_KEY);
  notifyAvatarChanged();
}

export async function flushAvatarWrites(): Promise<boolean> {
  while (pendingWrites.size) await Promise.allSettled([...pendingWrites]);
  const success = !writeFailed;
  writeFailed = false;
  return success;
}
