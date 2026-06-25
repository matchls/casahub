"use client";
import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { MobileBottomNav } from "./MobileBottomNav";
import { AppHeader } from "./AppHeader";
import { AddDrawer } from "./AddDrawer";
import type { View } from "./types";

/* Minimal placeholder tiles for the home view, illustrating the bento layout */
function HomePlaceholder() {
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Courses — spans full width on mobile, half on desktop */}
      <div
        className="col-span-2 min-[880px]:col-span-1 rounded-[24px] p-[22px] min-h-[150px]"
        style={{ background: "var(--shopping-bg)" }}
      >
        <div className="flex justify-between items-start">
          <span className="text-[32px]">🛒</span>
          <span className="rounded-full bg-[var(--shopping-accent)] text-white text-[13px] font-bold px-3 py-1">8</span>
        </div>
        <div
          className="font-extrabold text-[22px] text-[var(--shopping-text)] mt-[14px] tracking-[-0.02em]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Courses
        </div>
        <div className="text-[14px] text-[#A8623F] mt-1">Lait · Café · Éponges · +5</div>
      </div>

      {/* Tâches */}
      <div
        className="rounded-[24px] p-[22px] min-h-[150px]"
        style={{ background: "var(--tasks-bg)" }}
      >
        <div className="flex justify-between items-start">
          <span className="text-[30px]">✅</span>
          <span className="rounded-full bg-[var(--tasks-accent)] text-white text-[12px] font-bold px-3 py-1">4</span>
        </div>
        <div
          className="font-extrabold text-[20px] text-[var(--tasks-text)] mt-3 tracking-[-0.02em]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Tâches
        </div>
        <div className="text-[13.5px] text-[#6E8456] mt-1">à faire aujourd&apos;hui</div>
      </div>

      {/* Agenda */}
      <div
        className="rounded-[24px] p-[22px] min-h-[150px]"
        style={{ background: "var(--agenda-bg)" }}
      >
        <span className="text-[30px]">📅</span>
        <div
          className="font-extrabold text-[18px] text-[var(--agenda-text)] mt-3 tracking-[-0.02em]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Agenda
        </div>
        <div className="text-[13px] text-[#5E7790] mt-1">Médecin · 14:00</div>
      </div>

      {/* Notes */}
      <div
        className="rounded-[24px] p-[22px] min-h-[150px]"
        style={{ background: "var(--notes-bg)" }}
      >
        <span className="text-[30px]">📝</span>
        <div
          className="font-extrabold text-[18px] text-[var(--notes-text)] mt-3 tracking-[-0.02em]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Notes
        </div>
        <div className="text-[13px] text-[#8A7536] mt-1">WiFi · codes</div>
      </div>

      {/* Liens — spans full width */}
      <div
        className="col-span-2 rounded-[24px] p-[22px] min-h-[120px]"
        style={{ background: "var(--links-bg)" }}
      >
        <span className="text-[30px]">🔗</span>
        <div
          className="font-extrabold text-[18px] text-[var(--links-text)] mt-3 tracking-[-0.02em]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Liens utiles
        </div>
        <div className="text-[13px] text-[#8A6A82] mt-1">Drive · assurances</div>
      </div>
    </div>
  );
}

/* Simple placeholder for non-home views */
function ViewPlaceholder({ view }: { view: View }) {
  const meta: Record<View, { emoji: string; label: string; color: string }> = {
    home:     { emoji: "🏡", label: "Foyer",          color: "var(--shopping-text)" },
    day:      { emoji: "📆", label: "La journée",     color: "var(--agenda-text)" },
    shopping: { emoji: "🛒", label: "Courses",        color: "var(--shopping-text)" },
    tasks:    { emoji: "✅", label: "Tâches",         color: "var(--tasks-text)" },
    calendar: { emoji: "📅", label: "Calendrier",     color: "var(--agenda-text)" },
    notes:    { emoji: "📝", label: "Notes",          color: "var(--notes-text)" },
    links:    { emoji: "🔗", label: "Liens utiles",   color: "var(--links-text)" },
    profile:  { emoji: "👤", label: "Profil",         color: "var(--text-secondary)" },
  };

  const m = meta[view];

  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 text-center">
      <span className="text-[64px] opacity-40">{m.emoji}</span>
      <p className="text-[15px] font-semibold" style={{ color: m.color, opacity: 0.5 }}>
        L&apos;écran « {m.label} » sera ici dans une prochaine issue.
      </p>
    </div>
  );
}

export function AppShell() {
  const [activeView, setActiveView] = useState<View>("home");
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)]">
      {/* Sidebar — desktop only (hidden on mobile via Sidebar's CSS) */}
      <Sidebar
        activeView={activeView}
        onNavigate={setActiveView}
        onAdd={() => setAddOpen(true)}
      />

      {/* Main column */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <AppHeader activeView={activeView} onAdd={() => setAddOpen(true)} />

        <main className="flex-1 overflow-auto px-4 py-5 min-[880px]:px-8 min-[880px]:py-7">
          <div className="max-w-[1060px] mx-auto">
            {activeView === "home" ? (
              <HomePlaceholder />
            ) : (
              <ViewPlaceholder view={activeView} />
            )}
          </div>
        </main>

        {/* Mobile bottom nav — hidden on desktop via MobileBottomNav's CSS */}
        <MobileBottomNav
          activeView={activeView}
          onNavigate={setActiveView}
          onAdd={() => setAddOpen(true)}
        />
      </div>

      {/* Add drawer (modal/sheet) */}
      {addOpen && <AddDrawer onClose={() => setAddOpen(false)} />}
    </div>
  );
}
