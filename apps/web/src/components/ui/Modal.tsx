"use client";
import { useEffect, useId, useRef } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

/**
 * Small, dependency-free modal: fixed-position dimmed backdrop + centered
 * panel. Not a full focus trap (Tab can still leave the dialog) — on open it
 * moves focus into the panel and closes on Escape; on close it restores
 * focus to whatever was focused before opening. That's a deliberately
 * light-touch accessibility baseline, not a full trap implementation.
 */
export function Modal({ open, onClose, title, children }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(44,38,34,0.45)]"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[440px] max-h-[85vh] flex flex-col rounded-[20px] bg-[var(--surface)] shadow-[var(--shadow-card)] focus:outline-none"
      >
        <div
          className="flex items-center justify-between gap-3 px-5 py-4 shrink-0"
          style={{ borderBottom: "1px solid rgba(44,38,34,.06)" }}
        >
          <h2
            id={titleId}
            className="text-[16px] font-extrabold text-[var(--text-primary)] tracking-[-0.01em]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[18px] leading-none text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)] cursor-pointer transition-colors"
          >
            ×
          </button>
        </div>

        <div className="px-5 py-4 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
