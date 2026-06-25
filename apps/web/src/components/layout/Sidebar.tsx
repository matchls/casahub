"use client";
import { cn } from "@/lib/utils";
import type { View } from "./types";

const topNav: { id: View; emoji: string; label: string }[] = [
  { id: "home", emoji: "🏡", label: "Foyer" },
  { id: "day", emoji: "📆", label: "La journée" },
];

const featureNav: { id: View; emoji: string; label: string }[] = [
  { id: "shopping", emoji: "🛒", label: "Courses" },
  { id: "tasks", emoji: "✅", label: "Tâches" },
  { id: "calendar", emoji: "📅", label: "Calendrier" },
  { id: "notes", emoji: "📝", label: "Notes" },
  { id: "links", emoji: "🔗", label: "Liens utiles" },
];

interface SidebarProps {
  activeView: View;
  onNavigate: (view: View) => void;
  onAdd: () => void;
}

export function Sidebar({ activeView, onNavigate, onAdd }: SidebarProps) {
  return (
    <aside
      className="hidden min-[880px]:flex flex-col w-[248px] shrink-0 h-full pt-[22px] pb-[22px] bg-[var(--surface)]"
      style={{ borderRight: "1px solid rgba(44,38,34,.06)" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-[11px] pl-[22px] pr-[14px] pb-[20px]">
        <div className="w-[38px] h-[38px] rounded-[12px] bg-[var(--primary)] flex items-center justify-center text-[20px] shrink-0">
          🏠
        </div>
        <span
          className="text-[21px] font-extrabold text-[var(--text-primary)] tracking-[-0.02em]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          CasaHub
        </span>
      </div>

      {/* Foyer + La journée */}
      <nav className="flex flex-col gap-[3px] px-[14px]">
        {topNav.map((item) => (
          <NavItem
            key={item.id}
            emoji={item.emoji}
            label={item.label}
            active={activeView === item.id}
            onClick={() => onNavigate(item.id)}
          />
        ))}
      </nav>

      {/* Separator */}
      <div
        className="mx-[10px] my-[14px]"
        style={{ height: "1px", background: "rgba(44,38,34,.07)" }}
      />

      {/* Feature views */}
      <nav className="flex flex-col gap-[3px] px-[14px]">
        {featureNav.map((item) => (
          <NavItem
            key={item.id}
            emoji={item.emoji}
            label={item.label}
            active={activeView === item.id}
            onClick={() => onNavigate(item.id)}
          />
        ))}
      </nav>

      {/* + Ajouter */}
      <div className="px-[14px] mt-[18px]">
        <button
          onClick={onAdd}
          className="w-full rounded-[13px] bg-[var(--primary)] text-white py-[13px] text-[14.5px] font-bold cursor-pointer hover:opacity-90 transition-opacity"
          style={{ boxShadow: "var(--shadow-accent)" }}
        >
          + Ajouter
        </button>
      </div>

      {/* Profile */}
      <button
        onClick={() => onNavigate("profile")}
        className="mt-auto flex items-center gap-[10px] px-[22px] py-[11px] cursor-pointer hover:bg-[var(--surface-muted)] transition-colors text-left"
        style={{ borderTop: "1px solid rgba(44,38,34,.06)" }}
      >
        <div className="w-[32px] h-[32px] rounded-full bg-[#C2603F] text-white flex items-center justify-center font-bold text-[12px] shrink-0">
          L
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13.5px] font-semibold text-[var(--text-primary)] leading-tight">
            Léa &amp; Tom
          </div>
          <div className="text-[11px] text-[var(--text-muted)]">Le Foyer</div>
        </div>
        <span className="text-[var(--placeholder)] text-[18px] leading-none">›</span>
      </button>
    </aside>
  );
}

function NavItem({
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
        "flex items-center gap-[12px] w-full px-[13px] py-[11px] rounded-[12px]",
        "text-[14.5px] font-bold text-left cursor-pointer transition-colors",
        active
          ? "bg-[var(--shopping-bg)] text-[var(--primary)]"
          : "text-[var(--text-primary)] hover:bg-[var(--surface-muted)]"
      )}
    >
      <span className="text-[17px]">{emoji}</span>
      <span>{label}</span>
    </button>
  );
}
