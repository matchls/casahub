"use client";
import { cn } from "@/lib/utils";
import type { View } from "./types";
import type { HouseholdProfile } from "@/lib/domain/types";

const VIEW_META: Record<View, { title: string; subtitle?: string }> = {
  // "home" has no fixed title — it displays the household name instead (see resolvedTitle below).
  home:     { title: "Le Foyer" },
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
  subtitle?: string;
  profile: HouseholdProfile;
}

export function AppHeader({ activeView, subtitle, profile }: AppHeaderProps) {
  const meta = VIEW_META[activeView];
  const resolvedSubtitle = subtitle ?? meta.subtitle;
  const resolvedTitle =
    activeView === "home" ? `${profile.name || meta.title} 🏡` : meta.title;

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
          {resolvedTitle}
        </h1>
        {resolvedSubtitle && (
          <p className="text-[13px] text-[var(--text-muted)] font-semibold mt-[2px]">
            {resolvedSubtitle}
          </p>
        )}
      </div>

      {/* Right: avatars */}
      <div className="flex items-center gap-[14px] shrink-0">
        {/* Overlapping member avatars — real household members, capped so it never overflows */}
        <div className="flex">
          {profile.members.slice(0, 4).map((member, index) => (
            <div
              key={member.id}
              className={cn(
                "w-[34px] h-[34px] rounded-full text-white flex items-center justify-center font-bold text-[13px] border-2 border-[var(--background)]",
                index === 0 ? "z-10 relative" : "-ml-[10px]"
              )}
              style={{ backgroundColor: member.color }}
              title={member.name}
            >
              {member.initial}
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}
