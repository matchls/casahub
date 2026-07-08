"use client";
import { useDomotidienState } from "@/lib/state/useDomotidienState";
import { Sidebar } from "./Sidebar";
import { MobileBottomNav } from "./MobileBottomNav";
import { AppHeader } from "./AppHeader";
import { HomeDashboard } from "@/features/dashboard/HomeDashboard";
import { ShoppingListScreen } from "@/features/shopping/ShoppingListScreen";
import { TasksScreen } from "@/features/tasks/TasksScreen";
import { DayViewScreen } from "@/features/agenda/DayViewScreen";
import { AgendaScreen } from "@/features/agenda/AgendaScreen";
import { NotesScreen } from "@/features/notes/NotesScreen";
import { UsefulLinksScreen } from "@/features/links/UsefulLinksScreen";
import { ProfileScreen } from "@/features/profile/ProfileScreen";
import type { AgendaEvent, HouseholdProfile, Note, ShoppingItem, Task, UsefulLink } from "@/lib/domain/types";

interface AppShellProps {
  initialProfile: HouseholdProfile;
  initialAccountEmail: string;
  householdId: string;
  initialShoppingItems: ShoppingItem[];
  initialTasks: Task[];
  initialNotes: Note[];
  initialLinks: UsefulLink[];
  initialEvents: AgendaEvent[];
}

export function AppShell({ initialProfile, initialAccountEmail, householdId, initialShoppingItems, initialTasks, initialNotes, initialLinks, initialEvents }: AppShellProps) {
  const {
    activeView,
    setActiveView,
    shoppingItems,
    tasks,
    notes,
    links,
    events,
    dayItems,
    profile,
    accountEmail,
    shoppingPendingCount,
    tasksPendingCount,
    notesCount,
    linksCount,
    dayItemsCount,
    agendaEventsCount,
    toggleShoppingItem,
    addShoppingItem,
    updateShoppingItem,
    deleteShoppingItem,
    toggleTask,
    addTask,
    updateTask,
    deleteTask,
    addNote,
    updateNote,
    deleteNote,
    addUsefulLink,
    updateUsefulLink,
    deleteUsefulLink,
    addEvent,
    updateEvent,
    deleteEvent,
    updateHouseholdName,
  } = useDomotidienState({ initialProfile, initialAccountEmail, householdId, initialShoppingItems, initialTasks, initialNotes, initialLinks, initialEvents });

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
      ? `${dayItemsCount} chose${dayItemsCount > 1 ? "s" : ""} aujourd'hui`
      : undefined;

  const agendaSubtitle =
    activeView === "calendar"
      ? `${agendaEventsCount} événement${agendaEventsCount > 1 ? "s" : ""} à venir`
      : undefined;

  const notesSubtitle =
    activeView === "notes"
      ? notesCount === 0
        ? "Aucune note partagée"
        : `${notesCount} note${notesCount > 1 ? "s" : ""} partagée${notesCount > 1 ? "s" : ""}`
      : undefined;

  const linksSubtitle =
    activeView === "links"
      ? linksCount === 0
        ? "Aucun lien partagé"
        : `${linksCount} lien${linksCount > 1 ? "s" : ""} partagé${linksCount > 1 ? "s" : ""}`
      : undefined;

  const profileSubtitle =
    activeView === "profile"
      ? `${profile.name} · ${profile.members.length} membres`
      : undefined;

  const activeSubtitle =
    shoppingSubtitle ??
    tasksSubtitle ??
    daySubtitle ??
    agendaSubtitle ??
    notesSubtitle ??
    linksSubtitle ??
    profileSubtitle;

  function renderView() {
    if (activeView === "home") return <HomeDashboard onNavigate={setActiveView} shoppingItems={shoppingItems} tasks={tasks} notes={notes} links={links} events={events} />;
    if (activeView === "shopping") {
      return (
        <ShoppingListScreen
          items={shoppingItems}
          onToggle={toggleShoppingItem}
          onAdd={addShoppingItem}
          onUpdate={updateShoppingItem}
          onDelete={deleteShoppingItem}
          members={profile.members}
        />
      );
    }
    if (activeView === "tasks") {
      return (
        <TasksScreen
          tasks={tasks}
          onToggle={toggleTask}
          onAdd={addTask}
          onUpdate={updateTask}
          onDelete={deleteTask}
          members={profile.members}
        />
      );
    }
    if (activeView === "day") return <DayViewScreen items={dayItems} members={profile.members} />;
    if (activeView === "calendar") return <AgendaScreen events={events} members={profile.members} onAdd={addEvent} onUpdate={updateEvent} onDelete={deleteEvent} />;
    if (activeView === "notes") {
      return <NotesScreen notes={notes} onAdd={addNote} onUpdate={updateNote} onDelete={deleteNote} />;
    }
    if (activeView === "links") {
      return <UsefulLinksScreen links={links} onAdd={addUsefulLink} onUpdate={updateUsefulLink} onDelete={deleteUsefulLink} />;
    }
    if (activeView === "profile") {
      return (
        <ProfileScreen
          profile={profile}
          accountEmail={accountEmail}
          onUpdateName={updateHouseholdName}
        />
      );
    }
    return null;
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-[var(--background)]">
      {/* Sidebar — desktop only (hidden on mobile via Sidebar's CSS) */}
      <Sidebar
        activeView={activeView}
        onNavigate={setActiveView}
        profile={profile}
      />

      {/* Main column */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <AppHeader
          activeView={activeView}
          subtitle={activeSubtitle}
          profile={profile}
        />

        <main className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-5 min-[880px]:px-8 min-[880px]:py-7">
          <div className="max-w-[1060px] mx-auto">{renderView()}</div>
        </main>

        {/* Mobile bottom nav — hidden on desktop via MobileBottomNav's CSS */}
        <MobileBottomNav
          activeView={activeView}
          onNavigate={setActiveView}
          profile={profile}
        />
      </div>
    </div>
  );
}
