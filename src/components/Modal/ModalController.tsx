"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { GeneralConfirmModal } from "@/components/GeneralConfirmModal/GeneralConfirmModal";

export interface ConfirmOptions {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
}

function attachStandalone(dialog: HTMLDialogElement) {
  dialog.dataset.backdrop = "";
  return () => {
    delete dialog.dataset.backdrop;
  };
}

const ModalContext = createContext(attachStandalone);
const ConfirmContext = createContext<(options: ConfirmOptions) => void>(
  (options) => {
    options.onConfirm();
  },
);

export function ModalController({ children }: { children: ReactNode }) {
  const openDialogs = useRef(new Set<HTMLDialogElement>());
  const [confirmRequest, setConfirmRequest] = useState<ConfirmOptions | null>(
    null,
  );
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

  const openConfirm = useCallback((options: ConfirmOptions) => {
    setConfirmRequest(options);
  }, []);

  return (
    <ModalContext.Provider value={attach}>
      <ConfirmContext.Provider value={openConfirm}>
        {children}
        <GeneralConfirmModal
          isOpen={confirmRequest !== null}
          title={confirmRequest?.title ?? ""}
          description={confirmRequest?.description ?? ""}
          confirmLabel={confirmRequest?.confirmLabel}
          cancelLabel={confirmRequest?.cancelLabel}
          isDestructive={confirmRequest?.isDestructive}
          onCancel={() => setConfirmRequest(null)}
          onConfirm={() => {
            const action = confirmRequest?.onConfirm;
            setConfirmRequest(null);
            action?.();
          }}
        />
      </ConfirmContext.Provider>
    </ModalContext.Provider>
  );
}

export function useModalBackdrop() {
  return useContext(ModalContext);
}

export function useConfirmModal() {
  return useContext(ConfirmContext);
}
