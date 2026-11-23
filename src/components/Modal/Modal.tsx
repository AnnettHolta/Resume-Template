"use client";

import {
  useEffectEvent,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { useModalBackdrop } from "./ModalController";
import styles from "./Modal.module.scss";

interface ModalProps {
  isOpen: boolean;
  titleId: string;
  descriptionId?: string;
  className?: string;
  onClose: () => void;
  onExit?: () => void;
  children: ReactNode;
}

const TAB_STOP = "button, input, select, textarea, a[href], [tabindex]";

function canFocus(element: HTMLElement) {
  return (
    element.isConnected &&
    !element.matches(":disabled") &&
    element.getClientRects().length > 0
  );
}

export function Modal({
  isOpen,
  titleId,
  descriptionId,
  className,
  onClose,
  onExit,
  children,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeDialog = useRef<(() => void) | null>(null);
  const notifyExit = useEffectEvent(() => onExit?.());
  const attachBackdrop = useModalBackdrop();
  const [showContent, setShowContent] = useState(isOpen);
  if (isOpen && !showContent) setShowContent(true);
  useBodyScrollLock(isOpen);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (!isOpen) {
      if (!dialog.open) return;

      delete dialog.dataset.visible;
      dialog.getBoundingClientRect();
      const fade = document.hidden
        ? undefined
        : dialog
            .getAnimations?.()
            .find(
              (animation) =>
                "transitionProperty" in animation &&
                animation.transitionProperty === "opacity",
            );
      let cancelled = false;
      const onVisibilityChange = () => {
        if (document.hidden) finish();
      };
      const finish = () => {
        if (cancelled) return;
        cancelled = true;
        document.removeEventListener("visibilitychange", onVisibilityChange);
        closeDialog.current?.();
        setShowContent(false);
        notifyExit();
      };
      if (fade) {
        document.addEventListener("visibilitychange", onVisibilityChange);
        void fade.finished.then(finish, finish);
      } else finish();

      return () => {
        cancelled = true;
        document.removeEventListener("visibilitychange", onVisibilityChange);
      };
    }

    if (dialog.open) {
      dialog.dataset.visible = "";
      return;
    }

    const active = document.activeElement;
    const opener =
      active instanceof HTMLElement && active !== document.body ? active : null;
    const focusScope = opener?.closest("dialog, section, header, nav");
    dialog.showModal();
    const detachBackdrop = attachBackdrop(dialog);
    dialog.querySelector<HTMLElement>("[data-dialog-focus]")?.focus();
    // Calculate the starting style while the dialog is in the top layer.
    dialog.getBoundingClientRect();
    dialog.dataset.visible = "";

    closeDialog.current = () => {
      delete dialog.dataset.visible;
      dialog.close();
      detachBackdrop();
      closeDialog.current = null;
      // A confirmed deletion can remove the opener during the same commit.
      queueMicrotask(() => {
        if (dialog.open) return;
        if (opener && canFocus(opener)) {
          opener.focus({ preventScroll: true });
        } else {
          const fallback = Array.from(
            focusScope?.querySelectorAll<HTMLElement>(TAB_STOP) ?? [],
          ).find((element) => element.tabIndex >= 0 && canFocus(element));
          fallback?.focus({ preventScroll: true });
        }
      });
    };
  }, [isOpen, attachBackdrop]);

  useLayoutEffect(() => () => closeDialog.current?.(), []);

  return (
    <dialog
      ref={dialogRef}
      className={`${styles.modal} ${className ?? ""} no-print`}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault();
        if (isOpen) onClose();
      }}
      onClickCapture={(event) => {
        if (isOpen) return;
        event.preventDefault();
        event.stopPropagation();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < rect.left ||
          event.clientX >= rect.right ||
          event.clientY < rect.top ||
          event.clientY >= rect.bottom
        )
          onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          if (isOpen) onClose();
          return;
        }
        if (!isOpen) {
          event.preventDefault();
          return;
        }
        if (event.key !== "Tab" || event.defaultPrevented) return;
        const stops = Array.from(
          event.currentTarget.querySelectorAll<HTMLElement>(TAB_STOP),
        ).filter(
          (element) =>
            element.tabIndex >= 0 &&
            canFocus(element) &&
            !element.matches('input[type="radio"]:not(:checked)'),
        );
        const first = stops[0];
        const last = stops.at(-1);
        const active = document.activeElement;
        if (
          event.shiftKey &&
          (active === first || active === event.currentTarget)
        ) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && active === last) {
          event.preventDefault();
          first?.focus();
        }
      }}
    >
      {showContent && children}
    </dialog>
  );
}
