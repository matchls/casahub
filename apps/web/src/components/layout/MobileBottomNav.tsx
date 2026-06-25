"use client";
import { cn } from "@/lib/utils";
import type { View } from "./types";

interface MobileBottomNavProps {
  activeView: View;
  onNavigate: (view: View) => void;
  onAdd: () => void;
}

export function MobileBottomNav({
  activeView,
  onNavigate,
  onAdd,
}: MobileBottomNavProps) {
  return (
    <nav
      className="flex min-[880px]:hidden items-center h-[60px] px-[10px] bg-[var(--surface)] shrink-0"
      style={{ borderTop: "1px solid rgba(44,38,34,.08)" }}
    >
      {/* Foyer */}
      <TabButton
        emoji="🏡"
        label="Foyer"
        active={activeView === "home"}
        onClick={() => onNavigate("home")}
      />

      {/* Journée */}
      <TabButton
        emoji="📆"
        label="Journée"
        active={activeView === "day"}
        onClick={() => onNavigate("day")}
      />

      {/* Central + button */}
      <div className="flex-1 flex items-center justify-center">
        <button
          onClick={onAdd}
          className="w-[52px] h-[52px] rounded-full bg-[var(--primary)] text-white flex items-center justify-center text-[28px] font-light cursor-pointer -mt-6 hover:opacity-90 transition-opacity"
          style={{ boxShadow: "var(--shadow-accent)" }}
          aria-label="Ajouter"
        >
          +
        </button>
      </div>

      {/* Agenda */}
      <TabButton
        emoji="📅"
        label="Agenda"
        active={activeView === "calendar"}
        onClick={() => onNavigate("calendar")}
      />

      {/* Profil (avatar) */}
      <button
        onClick={() => onNavigate("profile")}
        className="flex-1 flex flex-col items-center gap-[3px] cursor-pointer"
      >
        <div
          className={cn(
            "w-[26px] h-[26px] rounded-full flex items-center justify-center font-bold text-[10px] text-white",
            activeView === "profile" ? "opacity-100" : "opacity-80"
          )}
          style={{ background: "#C2603F" }}
        >
          L
        </div>
        <span
          className={cn(
            "text-[11px] font-bold",
            activeView === "profile"
              ? "text-[var(--primary)]"
              : "text-[var(--text-soft)]"
          )}
        >
          Profil
        </span>
      </button>
    </nav>
  );
}

function TabButton({
  emoji,
  label,
  active,
  onClick,
}: {
  emoji: string;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 flex flex-col items-center gap-[3px] cursor-pointer",
        active ? "text-[var(--primary)]" : "text-[var(--text-soft)]"
      )}
    >
      <span className="text-[22px] leading-none">{emoji}</span>
      <span className="text-[11px] font-bold">{label}</span>
    </button>
  );
}
