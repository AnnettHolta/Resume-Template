"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AVATAR_CHANGED_EVENT,
  compressImageToWebpBlob,
  deleteAvatarBlob,
  getAvatarBlob,
  saveAvatarBlob,
} from "@/lib/avatarStorage";

export function useAvatarBlob() {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const activeUrlRef = useRef<string | null>(null);

  const setObjectUrl = useCallback((blob: Blob | null) => {
    if (activeUrlRef.current) {
      URL.revokeObjectURL(activeUrlRef.current);
      activeUrlRef.current = null;
    }
    if (!blob) {
      setAvatarUrl(null);
      return;
    }
    const nextUrl = URL.createObjectURL(blob);
    activeUrlRef.current = nextUrl;
    setAvatarUrl(nextUrl);
  }, []);

  const refreshAvatar = useCallback(async () => {
    const blob = await getAvatarBlob();
    setObjectUrl(blob);
  }, [setObjectUrl]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const blob = await getAvatarBlob();
      if (!cancelled) {
        setObjectUrl(blob);
      }
    };

    void load();

    const handleAvatarChanged = () => {
      void load();
    };

    window.addEventListener(AVATAR_CHANGED_EVENT, handleAvatarChanged);
    return () => {
      cancelled = true;
      window.removeEventListener(AVATAR_CHANGED_EVENT, handleAvatarChanged);
      if (activeUrlRef.current) {
        URL.revokeObjectURL(activeUrlRef.current);
        activeUrlRef.current = null;
      }
    };
  }, [setObjectUrl]);

  const uploadAvatar = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        setErrorMessage("Please select an image file.");
        return;
      }
      setIsProcessing(true);
      setErrorMessage(null);
      try {
        const webpBlob = await compressImageToWebpBlob(file);
        await saveAvatarBlob(webpBlob);
        setObjectUrl(webpBlob);
      } catch {
        setErrorMessage("Could not process that image.");
      } finally {
        setIsProcessing(false);
      }
    },
    [setObjectUrl],
  );

  const removeAvatar = useCallback(async () => {
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      await deleteAvatarBlob();
      setObjectUrl(null);
    } finally {
      setIsProcessing(false);
    }
  }, [setObjectUrl]);

  return {
    avatarUrl,
    isProcessing,
    errorMessage,
    uploadAvatar,
    removeAvatar,
    refreshAvatar,
  };
}
