import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

const memoryIdb = new Map<string, unknown>();

vi.mock("idb-keyval", () => ({
  get: vi.fn(async (key: string) => memoryIdb.get(key)),
  set: vi.fn(async (key: string, val: unknown) => {
    memoryIdb.set(key, val);
  }),
  del: vi.fn(async (key: string) => {
    memoryIdb.delete(key);
  }),
}));

if (typeof window !== "undefined") {
  if (!HTMLDialogElement.prototype.showModal) {
    HTMLDialogElement.prototype.showModal = function () {
      this.open = true;
    };
    HTMLDialogElement.prototype.close = function () {
      this.open = false;
    };
  }
  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = (cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    };
  }
}
