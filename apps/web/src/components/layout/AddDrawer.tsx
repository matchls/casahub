"use client";

interface AddDrawerProps {
  onClose: () => void;
}

const ADD_OPTIONS = [
  {
    emoji: "🛒",
    label: "Article de courses",
    desc: "À la liste partagée",
    bg: "var(--shopping-bg)",
    color: "var(--shopping-text)",
  },
  {
    emoji: "✅",
    label: "Tâche",
    desc: "À faire, assignable",
    bg: "var(--tasks-bg)",
    color: "var(--tasks-text)",
  },
  {
    emoji: "📅",
    label: "Événement",
    desc: "Au calendrier du foyer",
    bg: "var(--agenda-bg)",
    color: "var(--agenda-text)",
  },
  {
    emoji: "📝",
    label: "Note",
    desc: "Wi-Fi, code, info pratique",
    bg: "var(--notes-bg)",
    color: "var(--notes-text)",
  },
];

export function AddDrawer({ onClose }: AddDrawerProps) {
  return (
    /* Scrim */
    <div
      className="fixed inset-0 z-50 flex items-end min-[880px]:items-center justify-center"
      style={{ background: "rgba(33,29,26,.4)" }}
      onClick={onClose}
    >
      {/* Panel */}
      <div
        className="w-full min-[880px]:w-auto min-[880px]:min-w-[460px] min-[880px]:max-w-[520px] bg-[var(--surface)] rounded-t-[24px] min-[880px]:rounded-[24px] px-6 pb-8 pt-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag pill (mobile only) */}
        <div className="flex justify-center mb-5 min-[880px]:hidden">
          <div
            className="w-[40px] h-[4px] rounded-full"
            style={{ background: "rgba(44,38,34,.15)" }}
          />
        </div>

        <h2
          className="text-[22px] font-extrabold text-[var(--text-primary)] tracking-[-0.02em] mb-5"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Ajouter au foyer
        </h2>

        <div className="flex flex-col gap-[10px]">
          {ADD_OPTIONS.map((opt) => (
            <button
              key={opt.label}
              onClick={onClose}
              className="flex items-center gap-[14px] w-full rounded-[14px] px-[14px] py-[14px] text-left cursor-pointer hover:opacity-90 transition-opacity"
              style={{ background: opt.bg }}
            >
              {/* Icon */}
              <div
                className="w-[44px] h-[44px] rounded-[12px] flex items-center justify-center text-[22px] shrink-0"
                style={{ background: "rgba(255,255,255,.55)" }}
              >
                {opt.emoji}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <div
                  className="text-[15px] font-semibold leading-tight"
                  style={{ color: opt.color }}
                >
                  {opt.label}
                </div>
                <div
                  className="text-[12.5px] mt-0.5 opacity-70"
                  style={{ color: opt.color }}
                >
                  {opt.desc}
                </div>
              </div>

              {/* Chevron */}
              <span
                className="text-[18px] leading-none shrink-0"
                style={{ color: "var(--placeholder)" }}
              >
                ›
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
