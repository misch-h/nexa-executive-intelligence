"use client";

import { useRef, type ReactNode } from "react";
import { useDialog } from "../lib/useDialog";

export default function MarketplaceDialog({ titleId, descriptionId, onClose, children, modal = false }: {
  titleId: string; descriptionId: string; onClose: () => void; children: ReactNode; modal?: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useDialog(dialog, onClose, true);
  return <dialog ref={dialog} className={modal ? "marketplace-dialog marketplace-access-modal" : "marketplace-dialog marketplace-detail"}
    tabIndex={-1} aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId} onCancel={(event) => { event.preventDefault(); onClose(); }} onClick={(event) => {
      if (event.target !== event.currentTarget) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
    }}>{children}</dialog>;
}
