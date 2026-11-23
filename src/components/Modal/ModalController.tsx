"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  type ReactNode,
} from "react";

function attachStandalone(dialog: HTMLDialogElement) {
  dialog.dataset.backdrop = "";
  return () => {
    delete dialog.dataset.backdrop;
  };
}

const ModalContext = createContext(attachStandalone);

export function ModalController({ children }: { children: ReactNode }) {
  const openDialogs = useRef(new Set<HTMLDialogElement>());
  const attach = useCallback((dialog: HTMLDialogElement) => {
    const dialogs = openDialogs.current;
    if (dialogs.size === 0) dialog.dataset.backdrop = "";
    dialogs.add(dialog);

    return () => {
      dialogs.delete(dialog);
      delete dialog.dataset.backdrop;
      const first = dialogs.values().next().value;
      if (first) first.dataset.backdrop = "";
    };
  }, []);

  return (
    <ModalContext.Provider value={attach}>{children}</ModalContext.Provider>
  );
}

export function useModalBackdrop() {
  return useContext(ModalContext);
}
