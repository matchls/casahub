"use client";
import { useState, useEffect } from "react";
import { AddActionCard } from "./add-drawer/AddActionCard";
import { QuickAddForm } from "./add-drawer/QuickAddForm";

interface ActionOption {
  id: string;
  emoji: string;
  label: string;
  desc: string;
  placeholder: string;
  bg: string;
  color: string;
}

const ADD_OPTIONS: ActionOption[] = [
  {
    id: "shopping",
    emoji: "🛒",
    label: "Course",
    desc: "Ajouter un article à la liste",
    placeholder: "Ex : lait, pain, café...",
    bg: "var(--shopping-bg)",
    color: "var(--shopping-text)",
  },
  {
    id: "tasks",
    emoji: "✅",
    label: "Tâche",
    desc: "Créer une tâche pour le foyer",
    placeholder: "Ex : sortir les poubelles...",
    bg: "var(--tasks-bg)",
    color: "var(--tasks-text)",
  },
  {
    id: "agenda",
    emoji: "📅",
    label: "Événement",
    desc: "Ajouter une date importante",
    placeholder: "Ex : dîner, médecin...",
    bg: "var(--agenda-bg)",
    color: "var(--agenda-text)",
  },
  {
    id: "notes",
    emoji: "📝",
    label: "Note",
    desc: "Mémoriser une information",
    placeholder: "Ex : code, idée, info utile...",
    bg: "var(--notes-bg)",
    color: "var(--notes-text)",
  },
  {
    id: "links",
    emoji: "🔗",
    label: "Lien",
    desc: "Partager un raccourci utile",
    placeholder: "Ex : Drive partagé...",
    bg: "var(--links-bg)",
    color: "var(--links-text)",
  },
];

type Step = "list" | "form" | "success";

interface AddDrawerProps {
  onClose: () => void;
}

export function AddDrawer({ onClose }: AddDrawerProps) {
  const [step, setStep] = useState<Step>("list");
  const [selected, setSelected] = useState<ActionOption | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function handleSelect(option: ActionOption) {
    setSelected(option);
    setStep("form");
  }

  function handleSubmit() {
    setStep("success");
    setTimeout(onClose, 1300);
  }

  const panelTitle =
    step === "success"
      ? "Ajouté !"
      : step === "form"
      ? `${selected?.emoji} ${selected?.label}`
      : "Ajouter au foyer";

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

        {/* Step: action list */}
        {step === "list" && (
          <div className="flex flex-col gap-[10px]">
            {ADD_OPTIONS.map((opt) => (
              <AddActionCard
                key={opt.id}
                emoji={opt.emoji}
                label={opt.label}
                desc={opt.desc}
                bg={opt.bg}
                color={opt.color}
                onClick={() => handleSelect(opt)}
              />
            ))}
          </div>
        )}

        {/* Step: quick-add form */}
        {step === "form" && selected && (
          <QuickAddForm
            emoji={selected.emoji}
            label={selected.label}
            placeholder={selected.placeholder}
            bg={selected.bg}
            color={selected.color}
            onBack={() => setStep("list")}
            onSubmit={handleSubmit}
          />
        )}

        {/* Step: success confirmation */}
        {step === "success" && selected && (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <div
              className="w-[64px] h-[64px] rounded-full flex items-center justify-center text-[32px]"
              style={{ background: selected.bg }}
            >
              {selected.emoji}
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
