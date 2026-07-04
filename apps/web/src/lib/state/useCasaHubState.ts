"use client";
import { useMemo, useState } from "react";
import type { View } from "@/components/layout/types";
import type {
  AgendaEvent,
  HouseholdProfile,
  LinkCategory,
  Note,
  NoteCategory,
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
import { addNote as addNoteDb } from "@/lib/supabase/notes";
import { addUsefulLink as addUsefulLinkDb } from "@/lib/supabase/links";
import { addEvent as addEventDb } from "@/lib/supabase/events";
import { insertEventSorted, mapEventRow, type EventRow } from "@/lib/domain/agenda";

interface CasaHubStateOptions {
  initialProfile: HouseholdProfile;
  initialAccountEmail: string;
  householdId: string;
  initialShoppingItems: ShoppingItem[];
  initialTasks: Task[];
  initialNotes: Note[];
  initialLinks: UsefulLink[];
  initialEvents: AgendaEvent[];
}

export function useCasaHubState({
  initialProfile,
  initialAccountEmail,
  householdId,
  initialShoppingItems,
  initialTasks,
  initialNotes,
  initialLinks,
  initialEvents,
}: CasaHubStateOptions) {
  // Navigation
  const [activeView, setActiveView] = useState<View>("home");
  const [addOpen, setAddOpen] = useState(false);

  // Data
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>(initialShoppingItems);
  const [tasks, setTasks] = useState<Task[]>(initialTasks ?? []);
  const [notes, setNotes] = useState<Note[]>(initialNotes ?? []);
  const [links, setLinks] = useState<UsefulLink[]>(initialLinks ?? []);
  const [events, setEvents] = useState<AgendaEvent[]>(initialEvents ?? []);
  const [profile] = useState<HouseholdProfile>(initialProfile);

  // "La journée" — derived from today's real events and incomplete tasks (no mock data).
  const dayItems = useMemo<TimelineItem[]>(() => {
    const todayEvents: TimelineItem[] = events
      .filter((e) => e.group === "today")
      .map((e) => ({
        id: e.id,
        type: e.type,
        title: e.title,
        time: e.time,
        location: e.location,
        assignedTo: e.assignedTo,
      }));

    const incompleteTasks: TimelineItem[] = tasks
      .filter((t) => !t.done)
      .map((t) => ({
        id: t.id,
        type: "task",
        title: t.title,
        assignedTo: t.assignedTo,
      }));

    return [...todayEvents, ...incompleteTasks];
  }, [events, tasks]);

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
    const tempItem: ShoppingItem = { id: tempId, label, done: false };
    setShoppingItems((prev) => [tempItem, ...prev]);
    try {
      const row = await addShoppingItemDb(householdId, label);
      setShoppingItems((prev) =>
        prev.map((i) =>
          i.id === tempId
            ? { id: row.id, label: row.label, quantity: row.quantity ?? undefined, done: row.done, assignedTo: row.assigned_to ?? undefined }
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
    const tempTask: Task = { id: tempId, title, dueLabel: "Sans date", dueType: "none", done: false };
    setTasks((prev) => [tempTask, ...prev]);
    try {
      const row = await addTaskDb(householdId, title);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === tempId
            ? { id: row.id, title: row.title, dueLabel: row.due_label ?? "Sans date", dueType: (row.due_type as Task["dueType"]) ?? "none", done: row.done, assignedTo: row.assigned_to ?? undefined }
            : t
        )
      );
    } catch (err) {
      console.error("[tasks] add failed:", err);
      setTasks((prev) => prev.filter((t) => t.id !== tempId));
    }
  }

  // Actions — notes (Supabase-backed with optimistic updates)
  async function addNote(title: string, category: NoteCategory, content: string = "") {
    const tempId = `temp-${Date.now()}`;
    const tempNote: Note = { id: tempId, title, content, category };
    setNotes((prev) => [tempNote, ...prev]);
    try {
      const row = await addNoteDb(householdId, title, category, content);
      setNotes((prev) =>
        prev.map((n) =>
          n.id === tempId
            ? { id: row.id, title: row.title, content: row.content, category: row.category as NoteCategory, createdBy: row.created_by ?? undefined }
            : n
        )
      );
    } catch (err) {
      console.error("[notes] add failed:", err);
      setNotes((prev) => prev.filter((n) => n.id !== tempId));
    }
  }

  // Actions — links (Supabase-backed with optimistic updates)
  async function addUsefulLink(title: string, url: string) {
    const trimmed = url.trim();
    const normalizedUrl =
      trimmed && !trimmed.startsWith("http") ? `https://${trimmed}` : trimmed || "#";
    const category: LinkCategory = "ideas";
    const icon = "🔗";

    const tempId = `temp-${Date.now()}`;
    const tempLink: UsefulLink = {
      id: tempId,
      title,
      url: normalizedUrl,
      category,
      icon,
    };
    setLinks((prev) => [...prev, tempLink]);
    try {
      const row = await addUsefulLinkDb(householdId, title, normalizedUrl, category, icon);
      setLinks((prev) =>
        prev.map((l) =>
          l.id === tempId
            ? { id: row.id, title: row.title, url: row.url, category: row.category as LinkCategory, icon: row.icon, createdBy: row.created_by ?? undefined }
            : l
        )
      );
    } catch (err) {
      console.error("[links] add failed:", err);
      setLinks((prev) => prev.filter((l) => l.id !== tempId));
    }
  }

  // Actions — agenda (Supabase-backed with optimistic updates)
  async function addEvent(title: string, eventDate: string, eventTime?: string, location?: string) {
    const tempId = `temp-${Date.now()}`;
    const tempRow: EventRow = {
      id: tempId,
      title,
      event_date: eventDate,
      event_time: eventTime || null,
      location: location || null,
      assigned_to: null,
    };
    const tempEvent = mapEventRow(tempRow, new Date());
    if (tempEvent) {
      setEvents((prev) => insertEventSorted(prev, tempEvent));
    }
    try {
      const row = await addEventDb(householdId, title, eventDate, eventTime, location);
      const savedEvent = mapEventRow(row, new Date());
      if (!savedEvent) {
        console.warn("[events] added event is in the past and won't be shown:", row);
      }
      setEvents((prev) =>
        prev
          .map((e) => (e.id === tempId ? savedEvent : e))
          .filter((e): e is AgendaEvent => e !== null)
      );
    } catch (err) {
      console.error("[events] add failed:", err);
      setEvents((prev) => prev.filter((e) => e.id !== tempId));
      throw err;
    }
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
    addEvent,
  };
}
