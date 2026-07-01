"use client";
import { useMemo, useState } from "react";

// Monotonic counter for non-shopping item IDs (tasks, notes, links).
let _idCounter = 1000;
function nextId() {
  return ++_idCounter;
}
import type { View } from "@/components/layout/types";
import type {
  AgendaEvent,
  HouseholdProfile,
  Note,
  ShoppingItem,
  Task,
  TimelineItem,
  UsefulLink,
} from "@/lib/domain/types";
import {
  addShoppingItem as addShoppingItemDb,
  toggleShoppingItem as toggleShoppingItemDb,
} from "@/lib/supabase/shopping";
import {
  addTask as addTaskDb,
  toggleTask as toggleTaskDb,
} from "@/lib/supabase/tasks";
import {
  agendaEvents,
  dayTimelineItems,
  initialLinks,
  initialNotes,
} from "@/lib/mocks";

interface CasaHubStateOptions {
  initialProfile: HouseholdProfile;
  initialAccountEmail: string;
  householdId: string;
  initialShoppingItems: ShoppingItem[];
  initialTasks: Task[];
}

export function useCasaHubState({
  initialProfile,
  initialAccountEmail,
  householdId,
  initialShoppingItems,
  initialTasks,
}: CasaHubStateOptions) {
  // Navigation
  const [activeView, setActiveView] = useState<View>("home");
  const [addOpen, setAddOpen] = useState(false);

  // Data
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>(initialShoppingItems);
  const [tasks, setTasks] = useState<Task[]>(initialTasks ?? []);
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [links, setLinks] = useState<UsefulLink[]>(initialLinks);
  const [events] = useState<AgendaEvent[]>(agendaEvents);
  const [dayItems] = useState<TimelineItem[]>(dayTimelineItems);
  const [profile] = useState<HouseholdProfile>(initialProfile);

  // Computed counters
  const shoppingPendingCount = useMemo(
    () => shoppingItems.filter((i) => !i.done).length,
    [shoppingItems]
  );
  const tasksPendingCount = useMemo(
    () => tasks.filter((t) => !t.done).length,
    [tasks]
  );
  const notesCount = notes.length;
  const linksCount = links.length;
  const dayItemsCount = dayItems.length;
  const agendaEventsCount = events.length;

  // Actions — navigation
  function openAddDrawer() {
    setAddOpen(true);
  }
  function closeAddDrawer() {
    setAddOpen(false);
  }

  // Actions — shopping (Supabase-backed with optimistic updates)
  async function toggleShoppingItem(id: string) {
    const prevItems = shoppingItems;
    const item = prevItems.find((i) => i.id === id);
    if (!item) return;
    setShoppingItems((items) =>
      items.map((i) => (i.id === id ? { ...i, done: !i.done } : i))
    );
    try {
      await toggleShoppingItemDb(id, !item.done);
    } catch (err) {
      console.error("[shopping] toggle failed:", err);
      setShoppingItems(prevItems);
    }
  }

  async function addShoppingItem(label: string) {
    const tempId = `temp-${Date.now()}`;
    const tempItem: ShoppingItem = { id: tempId, label, done: false, assignedTo: "lea" };
    setShoppingItems((prev) => [tempItem, ...prev]);
    try {
      const row = await addShoppingItemDb(householdId, label);
      setShoppingItems((prev) =>
        prev.map((i) =>
          i.id === tempId
            ? { id: row.id, label: row.label, quantity: row.quantity ?? undefined, done: row.done, assignedTo: "lea" }
            : i
        )
      );
    } catch (err) {
      console.error("[shopping] add failed:", err);
      setShoppingItems((prev) => prev.filter((i) => i.id !== tempId));
    }
  }

  // Actions — tasks (Supabase-backed with optimistic updates)
  async function toggleTask(id: string) {
    const prevTasks = tasks;
    const task = prevTasks.find((t) => t.id === id);
    if (!task) return;
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
    try {
      await toggleTaskDb(id, !task.done);
    } catch (err) {
      console.error("[tasks] toggle failed:", err);
      setTasks(prevTasks);
    }
  }

  async function addTask(title: string) {
    const tempId = `temp-${Date.now()}`;
    const tempTask: Task = { id: tempId, title, dueLabel: "Sans date", dueType: "none", done: false, assignedTo: "lea" };
    setTasks((prev) => [tempTask, ...prev]);
    try {
      const row = await addTaskDb(householdId, title);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === tempId
            ? { id: row.id, title: row.title, dueLabel: row.due_label ?? "Sans date", dueType: (row.due_type as Task["dueType"]) ?? "none", done: row.done, assignedTo: "lea" }
            : t
        )
      );
    } catch (err) {
      console.error("[tasks] add failed:", err);
      setTasks((prev) => prev.filter((t) => t.id !== tempId));
    }
  }

  // Actions — notes
  function addNote(title: string) {
    const newNote: Note = {
      id: nextId(),
      title,
      content: "",
      category: "ideas",
      createdBy: "lea",
    };
    setNotes((prev) => [...prev, newNote]);
  }

  // Actions — links
  function addUsefulLink(title: string, url: string) {
    const trimmed = url.trim();
    const normalizedUrl =
      trimmed && !trimmed.startsWith("http") ? `https://${trimmed}` : trimmed || "#";
    const newLink: UsefulLink = {
      id: nextId(),
      title,
      url: normalizedUrl,
      category: "ideas",
      icon: "🔗",
      createdBy: "lea",
    };
    setLinks((prev) => [...prev, newLink]);
  }

  return {
    // Navigation
    activeView,
    setActiveView,
    addOpen,
    openAddDrawer,
    closeAddDrawer,

    // Data
    shoppingItems,
    tasks,
    notes,
    links,
    events,
    dayItems,
    profile,
    accountEmail: initialAccountEmail,

    // Computed counters
    shoppingPendingCount,
    tasksPendingCount,
    notesCount,
    linksCount,
    dayItemsCount,
    agendaEventsCount,

    // Actions
    toggleShoppingItem,
    addShoppingItem,
    toggleTask,
    addTask,
    addNote,
    addUsefulLink,
  };
}
