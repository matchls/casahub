"use client";
import { useState, useEffect } from "react";
import { EventQuickAddForm } from "./add-drawer/EventQuickAddForm";

type Step = "form" | "success";

interface AddEventDrawerProps {
  onClose: () => void;
  onAddEvent: (title: string, eventDate: string, eventTime?: string, location?: string) => void;
}

export function AddEventDrawer({ onClose, onAddEvent }: AddEventDrawerProps) {
  const [step, setStep] = useState<Step>("form");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function handleEventSubmit(title: string, eventDate: string, eventTime?: string, location?: string) {
    onAddEvent(title, eventDate, eventTime, location);
    setStep("success");
    setTimeout(onClose, 1300);
  }

  const panelTitle = step === "success" ? "Ajouté !" : "📅 Événement";

  return (
    /* Scrim */
    <div
      className="fixed inset-0 z-50 flex items-end min-[880px]:items-center justify-center"
      style={{ background: "rgba(33,29,26,.45)" }}
      onClick={onClose}
    >
      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-drawer-title"
        className="w-full min-[880px]:w-auto min-[880px]:min-w-[460px] min-[880px]:max-w-[520px] bg-[var(--surface)] rounded-t-[24px] min-[880px]:rounded-[24px] px-6 pb-8 pt-5 max-h-[90dvh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag pill — mobile only */}
        <div className="flex justify-center mb-4 min-[880px]:hidden">
          <div
            className="w-[40px] h-[4px] rounded-full"
            style={{ background: "rgba(44,38,34,.15)" }}
          />
        </div>

        {/* Header row */}
        <div className="flex items-center justify-between mb-5">
          <h2
            id="add-drawer-title"
            className="text-[22px] font-extrabold text-[var(--text-primary)] tracking-[-0.02em]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {panelTitle}
          </h2>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--surface-muted)] focus-visible:outline-[2px] focus-visible:outline-[var(--primary)] transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Step: event form */}
        {step === "form" && (
          <EventQuickAddForm onCancel={onClose} onSubmit={handleEventSubmit} />
        )}

        {/* Step: success confirmation */}
        {step === "success" && (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <div
              className="w-[64px] h-[64px] rounded-full flex items-center justify-center text-[32px]"
              style={{ background: "var(--agenda-bg)" }}
            >
              📅
            </div>
            <p className="text-[17px] font-bold text-[var(--text-primary)]">
              Ajouté avec succès !
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
