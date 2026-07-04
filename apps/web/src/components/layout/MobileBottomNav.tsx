"use client";
import { cn } from "@/lib/utils";
import type { View } from "./types";
import type { HouseholdProfile } from "@/lib/domain/types";

interface MobileBottomNavProps {
  activeView: View;
  onNavigate: (view: View) => void;
  profile: HouseholdProfile;
}

export function MobileBottomNav({
  activeView,
  onNavigate,
  profile,
}: MobileBottomNavProps) {
  const currentUser = profile.members[0];

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
          style={{ background: currentUser?.color ?? "var(--primary)" }}
        >
          {currentUser?.initial ?? "?"}
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
