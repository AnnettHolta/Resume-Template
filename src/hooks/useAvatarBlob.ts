"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  AVATAR_CHANGED_EVENT,
  changeAvatarGallery,
  compressImageToWebpBlob,
  getAvatarGallery,
  type AvatarGallery,
} from "@/lib/avatarStorage";
import { createClientId } from "@/lib/clientId";

export function useAvatarBlob(
  resumeId?: string,
  canEdit = true,
  canEditNow?: () => boolean,
) {
  const [gallery, setGallery] = useState<AvatarGallery>({
    photos: [],
    selectedId: null,
  });
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [isProcessing, setProcessing] = useState(false);
  const [errorMessage, setError] = useState<string | null>(null);
  const authority = useRef({ resumeId, canEdit, canEditNow });
  useLayoutEffect(() => {
    authority.current = { resumeId, canEdit, canEditNow };
    return () => {
      authority.current = { resumeId: undefined, canEdit: false, canEditNow };
    };
  }, [resumeId, canEdit, canEditNow]);
  const allowed = useCallback(
    (id: string) =>
      authority.current.resumeId === id &&
      authority.current.canEdit &&
      (authority.current.canEditNow?.() ?? true),
    [],
  );

  useEffect(() => {
    let cancelled = false;
    let sequence = 0;
    const load = async () => {
      const current = ++sequence;
      try {
        const next = resumeId
          ? await getAvatarGallery(resumeId)
          : { photos: [], selectedId: null };
        if (!cancelled && current === sequence) setGallery(next);
      } catch {
        if (!cancelled) setError("Could not load saved photos.");
      }
    };
    void load();
    window.addEventListener(AVATAR_CHANGED_EVENT, load);
    return () => {
      cancelled = true;
      window.removeEventListener(AVATAR_CHANGED_EVENT, load);
    };
  }, [resumeId]);

  useEffect(() => {
    const next = Object.fromEntries(
      gallery.photos.map(({ id, blob }) => [id, URL.createObjectURL(blob)]),
    );
    // Object URLs are browser resources and must be created and revoked in an effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUrls(next);
    return () => Object.values(next).forEach((url) => URL.revokeObjectURL(url));
  }, [gallery]);

  const mutate = useCallback(
    async (change: (gallery: AvatarGallery) => AvatarGallery) => {
      const id = authority.current.resumeId;
      if (!id || !allowed(id)) return;
      setProcessing(true);
      setError(null);
      try {
        await changeAvatarGallery(id, change, () => allowed(id));
      } catch {
        setError("Could not save your photo changes.");
      } finally {
        setProcessing(false);
      }
    },
    [allowed],
  );

  const uploadAvatar = useCallback(
    async (file: File) => {
      const id = authority.current.resumeId;
      if (!id || !allowed(id)) return;
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file.");
        return;
      }
      setProcessing(true);
      setError(null);
      try {
        const blob = await compressImageToWebpBlob(file);
        if (!allowed(id)) return;
        const photoId = createClientId();
        await changeAvatarGallery(
          id,
          (current) => ({
            photos: [{ id: photoId, blob }, ...current.photos].slice(0, 5),
            selectedId: photoId,
          }),
          () => allowed(id),
        );
      } catch {
        setError("Could not process or save that image.");
      } finally {
        setProcessing(false);
      }
    },
    [allowed],
  );

  return {
    gallery,
    urls,
    avatarUrl: gallery.selectedId ? (urls[gallery.selectedId] ?? null) : null,
    isProcessing,
    errorMessage,
    uploadAvatar,
    selectAvatar: (id: string | null) =>
      mutate((current) => ({ ...current, selectedId: id })),
    deleteAvatar: (id: string) =>
      mutate((current) => ({
        photos: current.photos.filter((photo) => photo.id !== id),
        selectedId: current.selectedId === id ? null : current.selectedId,
      })),
  };
}
