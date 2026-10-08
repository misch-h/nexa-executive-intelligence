"use client";

import { useRef } from "react";
import Image from "next/image";
import { useDialog } from "../lib/useDialog";
import { createPortal } from "react-dom";

export default function ArchitectureModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;
  return <ArchitectureDialog onClose={onClose} />;
}

function ArchitectureDialog({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDivElement>(null);
  useDialog(dialog, onClose);

  return createPortal(
    <div
      ref={dialog}
      tabIndex={-1}
      className="architecture-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="architecture-title"
      aria-describedby="architecture-description"
    >
      <button
        className="architecture-backdrop"
        tabIndex={-1}
        aria-hidden="true"
        type="button"
        onClick={onClose}
        aria-label="Close architecture"
      />

      <section className="architecture-modal">
        <header className="architecture-modal-header">
          <div>
            <div className="architecture-kicker">
              NEXA EXECUTIVE INTELLIGENCE
            </div>

            <h2 id="architecture-title">End-to-end architecture</h2>

            <p id="architecture-description">
              From source data to governed executive intelligence.
            </p>
          </div>

          <button
            type="button"
            className="architecture-close"
            onClick={onClose}
            aria-label="Close architecture"
          >
            ×
          </button>
        </header>

        <div className="architecture-image-area">
          <Image
            width={1774}
            height={887}
            unoptimized
            src="/architecture/nexa-architecture.png"
            alt="Nexa Executive Intelligence end-to-end architecture"
          />
        </div>

        <footer className="architecture-footer">
          <span>
            SOURCE → PLATFORM → GOVERNED METRICS → API → EXECUTIVE EXPERIENCE
          </span>

          <span>
            ESC TO CLOSE
          </span>
        </footer>
      </section>
    </div>,
    document.body
  );
}