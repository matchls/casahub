"use client";
import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { MobileBottomNav } from "./MobileBottomNav";
import { AppHeader } from "./AppHeader";
import { AddDrawer } from "./AddDrawer";
import { HomeDashboard } from "@/features/dashboard/HomeDashboard";
import { ShoppingListScreen } from "@/features/shopping/ShoppingListScreen";
import { initialShoppingItems } from "@/features/shopping/shoppingData";
import { TasksScreen } from "@/features/tasks/TasksScreen";
import { initialTasks } from "@/features/tasks/tasksData";
import { DayViewScreen } from "@/features/agenda/DayViewScreen";
import { AgendaScreen } from "@/features/agenda/AgendaScreen";
import { dayTimelineItems, agendaEvents } from "@/features/agenda/agendaData";
import { NotesScreen } from "@/features/notes/NotesScreen";
import { initialNotes } from "@/features/notes/notesData";
import type { View } from "./types";

/* Simple placeholder for non-implemented views */
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
  const [shoppingPendingCount, setShoppingPendingCount] = useState(
    initialShoppingItems.filter((i) => !i.done).length
  );
  const [tasksPendingCount, setTasksPendingCount] = useState(
    initialTasks.filter((t) => !t.done).length
  );
  const [notesCount, setNotesCount] = useState(initialNotes.length);

  const shoppingSubtitle =
    activeView === "shopping"
      ? shoppingPendingCount === 0
        ? "Liste vide"
        : `${shoppingPendingCount} article${shoppingPendingCount > 1 ? "s" : ""} à prendre`
      : undefined;

  const tasksSubtitle =
    activeView === "tasks"
      ? tasksPendingCount === 0
        ? "Aucune tâche à faire"
        : `${tasksPendingCount} à faire`
      : undefined;

  const daySubtitle =
    activeView === "day"
      ? `${dayTimelineItems.length} chose${dayTimelineItems.length > 1 ? "s" : ""} aujourd'hui`
      : undefined;

  const agendaSubtitle =
    activeView === "calendar"
      ? `${agendaEvents.length} événement${agendaEvents.length > 1 ? "s" : ""} à venir`
      : undefined;

  const notesSubtitle =
    activeView === "notes"
      ? notesCount === 0
        ? "Aucune note partagée"
        : `${notesCount} note${notesCount > 1 ? "s" : ""} partagée${notesCount > 1 ? "s" : ""}`
      : undefined;

  const activeSubtitle = shoppingSubtitle ?? tasksSubtitle ?? daySubtitle ?? agendaSubtitle ?? notesSubtitle;

  function renderView() {
    if (activeView === "home") return <HomeDashboard onNavigate={setActiveView} />;
    if (activeView === "shopping") {
      return <ShoppingListScreen onPendingCountChange={setShoppingPendingCount} />;
    }
    if (activeView === "tasks") {
      return <TasksScreen onPendingCountChange={setTasksPendingCount} />;
    }
    if (activeView === "day") return <DayViewScreen />;
    if (activeView === "calendar") return <AgendaScreen />;
    if (activeView === "notes") return <NotesScreen onNotesCountChange={setNotesCount} />;
    return <ViewPlaceholder view={activeView} />;
  }

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
        <AppHeader
          activeView={activeView}
          onAdd={() => setAddOpen(true)}
          subtitle={activeSubtitle}
        />

        <main className="flex-1 overflow-auto px-4 py-5 min-[880px]:px-8 min-[880px]:py-7">
          <div className="max-w-[1060px] mx-auto">{renderView()}</div>
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
