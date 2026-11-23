import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AVATAR_CHANGED_EVENT,
  AVATAR_SIZE_PX,
  AVATAR_WEBP_QUALITY,
  compressImageToWebpBlob,
  deleteAvatarBlob,
  getAvatarBlob,
  saveAvatarBlob,
} from "@/lib/avatarStorage";

describe("avatarStorage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("compresses an image to a 512x512 WebP blob at 80% quality", async () => {
    const closeMock = vi.fn();
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn().mockResolvedValue({
        width: 1024,
        height: 768,
        close: closeMock,
      }),
    );

    const drawImageMock = vi.fn();
    const expectedBlob = new Blob(["webp-bytes"], { type: "image/webp" });
    const toBlobMock = vi.fn((cb: (blob: Blob | null) => void) => {
      cb(expectedBlob);
    });

    const originalCreateElement = document.createElement.bind(document);
    let createdCanvas: HTMLCanvasElement | null = null;
    vi.spyOn(document, "createElement").mockImplementation(((
      tagName: string,
    ) => {
      if (tagName === "canvas") {
        createdCanvas = originalCreateElement("canvas");
        vi.spyOn(createdCanvas, "getContext").mockReturnValue({
          drawImage: drawImageMock,
        } as unknown as CanvasRenderingContext2D);
        vi.spyOn(createdCanvas, "toBlob").mockImplementation(toBlobMock);
        return createdCanvas;
      }
      return originalCreateElement(tagName);
    }) as typeof document.createElement);

    const inputFile = new File(["png"], "photo.png", { type: "image/png" });
    const result = await compressImageToWebpBlob(inputFile);

    expect(result).toBe(expectedBlob);
    expect(createdCanvas).not.toBeNull();
    expect(createdCanvas!.width).toBe(AVATAR_SIZE_PX);
    expect(createdCanvas!.height).toBe(AVATAR_SIZE_PX);
    expect(drawImageMock).toHaveBeenCalledWith(
      expect.anything(),
      128,
      0,
      768,
      768,
      0,
      0,
      512,
      512,
    );
    expect(toBlobMock).toHaveBeenCalledWith(
      expect.any(Function),
      "image/webp",
      AVATAR_WEBP_QUALITY,
    );
    expect(closeMock).toHaveBeenCalledTimes(1);
  });

  it("stores, retrieves, and deletes avatar blobs in IndexedDB", async () => {
    const changeListener = vi.fn();
    window.addEventListener(AVATAR_CHANGED_EVENT, changeListener);

    const blob = new Blob(["avatar"], { type: "image/webp" });
    await saveAvatarBlob(blob);

    const loaded = await getAvatarBlob();
    expect(loaded).toBeInstanceOf(Blob);
    expect(loaded?.type).toBe("image/webp");

    await deleteAvatarBlob();
    expect(await getAvatarBlob()).toBeNull();
    expect(changeListener).toHaveBeenCalledTimes(2);

    window.removeEventListener(AVATAR_CHANGED_EVENT, changeListener);
  });
});
