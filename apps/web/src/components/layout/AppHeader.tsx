"use client";
import type { View } from "./types";

const VIEW_META: Record<View, { title: string; subtitle?: string }> = {
  home:     { title: "Le Foyer 🏡", subtitle: "Mardi 24 juin · 12 choses à voir" },
  day:      { title: "La journée ☀️" },
  shopping: { title: "Courses 🛒" },
  tasks:    { title: "Tâches ✅" },
  calendar: { title: "Agenda 📅" },
  notes:    { title: "Notes 📝" },
  links:    { title: "Liens utiles 🔗" },
  profile:  { title: "Profil & foyer 👤" },
};

interface AppHeaderProps {
  activeView: View;
  onAdd: () => void;
  subtitle?: string;
}

export function AppHeader({ activeView, onAdd, subtitle }: AppHeaderProps) {
  const meta = VIEW_META[activeView];
  const resolvedSubtitle = subtitle ?? meta.subtitle;

  return (
    <header
      className="flex items-center gap-[13px] px-4 min-[880px]:px-7 py-[14px] min-[880px]:py-[18px] shrink-0"
      style={{ borderBottom: "1px solid rgba(44,38,34,.05)" }}
    >
      {/* Title */}
      <div className="flex-1 min-w-0">
        <h1
          className="font-extrabold text-[23px] min-[880px]:text-[28px] text-[var(--text-primary)] tracking-[-0.02em] leading-tight"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {meta.title}
        </h1>
        {resolvedSubtitle && (
          <p className="text-[13px] text-[var(--text-muted)] font-semibold mt-[2px]">
            {resolvedSubtitle}
          </p>
        )}
      </div>

      {/* Right: avatars + add button (desktop only) */}
      <div className="flex items-center gap-[14px] shrink-0">
        {/* Overlapping member avatars */}
        <div className="flex">
          <div className="w-[34px] h-[34px] rounded-full bg-[#C2603F] text-white flex items-center justify-center font-bold text-[13px] border-2 border-[var(--background)] z-10 relative">
            L
          </div>
          <div className="w-[34px] h-[34px] rounded-full bg-[#6E8BA6] text-white flex items-center justify-center font-bold text-[13px] border-2 border-[var(--background)] -ml-[10px]">
            T
          </div>
        </div>

        {/* + Ajouter — desktop only */}
        <button
          onClick={onAdd}
          className="hidden min-[880px]:flex items-center rounded-[13px] bg-[var(--primary)] text-white px-[18px] py-[11px] text-[14px] font-bold cursor-pointer hover:opacity-90 transition-opacity"
          style={{ boxShadow: "var(--shadow-accent)" }}
        >
          + Ajouter
        </button>
      </div>
    </header>
  );
}
