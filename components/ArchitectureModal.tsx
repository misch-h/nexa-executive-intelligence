"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function ArchitectureModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="architecture-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Nexa Executive Intelligence architecture"
    >
      <button
        className="architecture-backdrop"
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

            <h2>End-to-end architecture</h2>

            <p>
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
          <img
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