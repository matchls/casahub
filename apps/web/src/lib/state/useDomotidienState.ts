"use client";
import { useMemo, useState } from "react";
import type { View } from "@/components/layout/types";
import type {
  AgendaEvent,
  BudgetCategory,
  BudgetEntry,
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
  updateShoppingItem as updateShoppingItemDb,
  deleteShoppingItem as deleteShoppingItemDb,
  mapShoppingRow,
  type UpdateShoppingItemInput,
} from "@/lib/supabase/shopping";
import {
  addTask as addTaskDb,
  toggleTask as toggleTaskDb,
  updateTask as updateTaskDb,
  deleteTask as deleteTaskDb,
  mapTaskRow,
} from "@/lib/supabase/tasks";
import {
  addNote as addNoteDb,
  updateNote as updateNoteDb,
  deleteNote as deleteNoteDb,
  mapNoteRow,
  type UpdateNoteInput,
} from "@/lib/supabase/notes";
import {
  addUsefulLink as addUsefulLinkDb,
  updateUsefulLink as updateUsefulLinkDb,
  deleteUsefulLink as deleteUsefulLinkDb,
  mapLinkRow,
} from "@/lib/supabase/links";
import { addEvent as addEventDb, updateEvent as updateEventDb, deleteEvent as deleteEventDb } from "@/lib/supabase/events";
import { updateHouseholdName as updateHouseholdNameDb } from "@/lib/supabase/households";
import { insertEventSorted, mapEventRow, type EventRow } from "@/lib/domain/agenda";
import {
  addBudgetEntry as addBudgetEntryDb,
  updateBudgetEntry as updateBudgetEntryDb,
  deleteBudgetEntry as deleteBudgetEntryDb,
  createRecurringBudgetExpense as createRecurringBudgetExpenseDb,
  ensureBudgetRecurringOccurrences as ensureBudgetRecurringOccurrencesDb,
  deleteRecurringBudgetOccurrence as deleteRecurringBudgetOccurrenceDb,
  fetchBudgetEntriesForMonth,
  fetchBudgetEntriesForMonthRange,
  mapBudgetEntryRow,
  toEntryMonth,
  type BudgetEntryInput,
  type CreateBudgetEntryInput,
} from "@/lib/supabase/budget";
import {
  buildMonthlyEvolution,
  currentBudgetMonth,
  monthRangeEndingAt,
  BUDGET_EVOLUTION_MONTH_COUNT,
  type BudgetMonthlyEvolutionPoint,
} from "@/features/budget/budgetData";

interface DomotidienStateOptions {
  initialProfile: HouseholdProfile;
  initialAccountEmail: string;
  householdId: string;
  initialShoppingItems: ShoppingItem[];
  initialTasks: Task[];
  initialNotes: Note[];
  initialLinks: UsefulLink[];
  initialEvents: AgendaEvent[];
  initialBudgetCategories: BudgetCategory[];
  initialBudgetEntries: BudgetEntry[];
  initialBudgetEvolution: BudgetMonthlyEvolutionPoint[];
}

export function useDomotidienState({
  initialProfile,
  initialAccountEmail,
  householdId,
  initialShoppingItems,
  initialTasks,
  initialNotes,
  initialLinks,
  initialEvents,
  initialBudgetCategories,
  initialBudgetEntries,
  initialBudgetEvolution,
}: DomotidienStateOptions) {
  // Navigation
  const [activeView, setActiveView] = useState<View>("home");

  // Data
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>(initialShoppingItems);
  const [tasks, setTasks] = useState<Task[]>(initialTasks ?? []);
  const [notes, setNotes] = useState<Note[]>(initialNotes ?? []);
  const [budgetCategories] = useState<BudgetCategory[]>(initialBudgetCategories ?? []);
  const [budgetEntries, setBudgetEntries] = useState<BudgetEntry[]>(initialBudgetEntries ?? []);
  const [budgetEvolution, setBudgetEvolution] = useState<BudgetMonthlyEvolutionPoint[]>(
    initialBudgetEvolution ?? []
  );
  const [budgetMonth, setBudgetMonthState] = useState<string>(currentBudgetMonth());
  const [budgetMonthLoading, setBudgetMonthLoading] = useState(false);
  const [links, setLinks] = useState<UsefulLink[]>(initialLinks ?? []);
  const [events, setEvents] = useState<AgendaEvent[]>(initialEvents ?? []);
  const [profile, setProfile] = useState<HouseholdProfile>(initialProfile);

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
        prev.map((i) => (i.id === tempId ? mapShoppingRow(row) : i))
      );
    } catch (err) {
      console.error("[shopping] add failed:", err);
      setShoppingItems((prev) => prev.filter((i) => i.id !== tempId));
    }
  }

  async function updateShoppingItem(id: string, input: UpdateShoppingItemInput) {
    const prevItems = shoppingItems;
    setShoppingItems((items) =>
      items.map((i) => (i.id === id ? { ...i, label: input.label, quantity: input.quantity } : i))
    );
    try {
      await updateShoppingItemDb(id, input);
    } catch (err) {
      console.error("[shopping] update failed:", err);
      setShoppingItems(prevItems);
      throw err;
    }
  }

  async function deleteShoppingItem(id: string) {
    const prevItems = shoppingItems;
    setShoppingItems((items) => items.filter((i) => i.id !== id));
    try {
      await deleteShoppingItemDb(id);
    } catch (err) {
      console.error("[shopping] delete failed:", err);
      setShoppingItems(prevItems);
      alert("La suppression de l'article a échoué. Réessayez.");
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
        prev.map((t) => (t.id === tempId ? mapTaskRow(row) : t))
      );
    } catch (err) {
      console.error("[tasks] add failed:", err);
      setTasks((prev) => prev.filter((t) => t.id !== tempId));
    }
  }

  async function updateTask(id: string, title: string) {
    const prevTasks = tasks;
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, title } : t)));
    try {
      await updateTaskDb(id, title);
    } catch (err) {
      console.error("[tasks] update failed:", err);
      setTasks(prevTasks);
      throw err;
    }
  }

  async function deleteTask(id: string) {
    const prevTasks = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      await deleteTaskDb(id);
    } catch (err) {
      console.error("[tasks] delete failed:", err);
      setTasks(prevTasks);
      alert("La suppression de la tâche a échoué. Réessayez.");
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
        prev.map((n) => (n.id === tempId ? mapNoteRow(row) : n))
      );
    } catch (err) {
      console.error("[notes] add failed:", err);
      setNotes((prev) => prev.filter((n) => n.id !== tempId));
    }
  }

  async function updateNote(id: string, input: UpdateNoteInput) {
    const prevNotes = notes;
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, title: input.title, content: input.content } : n))
    );
    try {
      await updateNoteDb(id, input);
    } catch (err) {
      console.error("[notes] update failed:", err);
      setNotes(prevNotes);
      throw err;
    }
  }

  async function deleteNote(id: string) {
    const prevNotes = notes;
    setNotes((prev) => prev.filter((n) => n.id !== id));
    try {
      await deleteNoteDb(id);
    } catch (err) {
      console.error("[notes] delete failed:", err);
      setNotes(prevNotes);
      alert("La suppression de la note a échoué. Réessayez.");
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
        prev.map((l) => (l.id === tempId ? mapLinkRow(row) : l))
      );
    } catch (err) {
      console.error("[links] add failed:", err);
      setLinks((prev) => prev.filter((l) => l.id !== tempId));
    }
  }

  async function updateUsefulLink(id: string, title: string, url: string) {
    const trimmed = url.trim();
    const normalizedUrl =
      trimmed && !trimmed.startsWith("http") ? `https://${trimmed}` : trimmed || "#";
    const prevLinks = links;
    setLinks((prev) =>
      prev.map((l) => (l.id === id ? { ...l, title, url: normalizedUrl } : l))
    );
    try {
      await updateUsefulLinkDb(id, { title, url: normalizedUrl });
    } catch (err) {
      console.error("[links] update failed:", err);
      setLinks(prevLinks);
      throw err;
    }
  }

  async function deleteUsefulLink(id: string) {
    const prevLinks = links;
    setLinks((prev) => prev.filter((l) => l.id !== id));
    try {
      await deleteUsefulLinkDb(id);
    } catch (err) {
      console.error("[links] delete failed:", err);
      setLinks(prevLinks);
      alert("La suppression du lien a échoué. Réessayez.");
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

  async function updateEvent(id: string, title: string, eventDate: string, eventTime?: string, location?: string) {
    const prevEvents = events;
    const existing = prevEvents.find((e) => e.id === id);
    if (!existing) return;

    function resort(prev: AgendaEvent[], updated: AgendaEvent | null) {
      const withoutId = prev.filter((e) => e.id !== id);
      return updated ? insertEventSorted(withoutId, updated) : withoutId;
    }

    const optimisticRow: EventRow = {
      id,
      title,
      event_date: eventDate,
      event_time: eventTime || null,
      location: location || null,
      assigned_to: existing.assignedTo ?? null,
    };
    setEvents((prev) => resort(prev, mapEventRow(optimisticRow, new Date())));

    try {
      const row = await updateEventDb(id, title, eventDate, eventTime, location);
      setEvents((prev) => resort(prev, mapEventRow(row, new Date())));
    } catch (err) {
      console.error("[events] update failed:", err);
      setEvents(prevEvents);
      throw err;
    }
  }

  async function deleteEvent(id: string) {
    const prevEvents = events;
    setEvents((prev) => prev.filter((e) => e.id !== id));
    try {
      await deleteEventDb(id);
    } catch (err) {
      console.error("[events] delete failed:", err);
      setEvents(prevEvents);
      alert("La suppression de l'événement a échoué. Réessayez.");
    }
  }

  // Actions — budget (Supabase-backed with optimistic updates)
  // Entries are fetched one month at a time rather than preloaded like the
  // other modules, so switching months re-fetches from Supabase instead of
  // filtering an already-loaded list.

  // Materializes any missing recurring occurrences across the 6-month
  // evolution window ending at `centerMonth`, then returns that window.
  // Must run before every read that depends on recurring occurrences being
  // present, so a month that was never manually opened before isn't
  // undercounted (issue #105) — mirrors the ensure-then-load ordering used
  // by the initial server load in app/page.tsx.
  async function ensureRecurringOccurrences(centerMonth: string): Promise<string[]> {
    const months = monthRangeEndingAt(centerMonth, BUDGET_EVOLUTION_MONTH_COUNT);
    await ensureBudgetRecurringOccurrencesDb(householdId, months[0], months[months.length - 1]);
    return months;
  }

  // Re-fetches the 6-month evolution window ending at `centerMonth`. Used on
  // month switch and after every add/edit/delete, since an entry's date can
  // land anywhere (not just the currently viewed month), so patching the
  // evolution totals in place isn't reliably correct — a small, cheap
  // (entry_month + amount_cents only) re-fetch is simpler and always right.
  async function refreshBudgetEvolution(centerMonth: string) {
    try {
      const months = await ensureRecurringOccurrences(centerMonth);
      const rows = await fetchBudgetEntriesForMonthRange(
        householdId,
        months[0],
        months[months.length - 1]
      );
      setBudgetEvolution(buildMonthlyEvolution(months, rows));
    } catch (err) {
      console.error("[budget] evolution fetch failed:", err);
    }
  }

  async function setBudgetMonth(month: string) {
    setBudgetMonthState(month);
    setBudgetMonthLoading(true);
    try {
      await ensureRecurringOccurrences(month);
      const [freshEntries] = await Promise.all([
        fetchBudgetEntriesForMonth(householdId, month),
        refreshBudgetEvolution(month),
      ]);
      setBudgetEntries(freshEntries);
    } catch (err) {
      console.error("[budget] month fetch failed:", err);
    } finally {
      setBudgetMonthLoading(false);
    }
  }

  async function addBudgetEntry(input: CreateBudgetEntryInput) {
    const tempId = `temp-${Date.now()}`;
    const entryMonth = toEntryMonth(input.entryDate);
    const belongsToVisibleMonth = entryMonth === budgetMonth;
    if (belongsToVisibleMonth) {
      setBudgetEntries((prev) => [
        {
          id: tempId,
          title: input.title,
          amountCents: input.amountCents,
          categoryId: input.categoryId,
          entryDate: input.entryDate,
          entryMonth,
          kind: input.kind,
          note: input.note,
        },
        ...prev,
      ]);
    }
    try {
      const row =
        input.recurrence === "monthly"
          ? await createRecurringBudgetExpenseDb(householdId, input, input.creationRequestId)
          : await addBudgetEntryDb(householdId, input);
      const saved = mapBudgetEntryRow(row);
      setBudgetEntries((prev) =>
        belongsToVisibleMonth ? prev.map((e) => (e.id === tempId ? saved : e)) : prev
      );
      refreshBudgetEvolution(budgetMonth);
    } catch (err) {
      console.error("[budget] add failed:", err);
      if (belongsToVisibleMonth) {
        setBudgetEntries((prev) => prev.filter((e) => e.id !== tempId));
      }
      throw err;
    }
  }

  async function updateBudgetEntry(id: string, input: BudgetEntryInput) {
    const prevEntries = budgetEntries;
    const entryMonth = toEntryMonth(input.entryDate);
    setBudgetEntries((prev) => {
      // The edited date may have moved the entry out of the visible month.
      if (entryMonth !== budgetMonth) return prev.filter((e) => e.id !== id);
      return prev.map((e) =>
        e.id === id
          ? {
              ...e,
              title: input.title,
              amountCents: input.amountCents,
              categoryId: input.categoryId,
              entryDate: input.entryDate,
              entryMonth,
              kind: input.kind,
              note: input.note,
            }
          : e
      );
    });
    try {
      await updateBudgetEntryDb(id, input);
      refreshBudgetEvolution(budgetMonth);
    } catch (err) {
      console.error("[budget] update failed:", err);
      setBudgetEntries(prevEntries);
      throw err;
    }
  }

  async function deleteBudgetEntry(id: string) {
    const prevEntries = budgetEntries;
    const target = budgetEntries.find((e) => e.id === id);
    setBudgetEntries((prev) => prev.filter((e) => e.id !== id));
    try {
      // A recurring occurrence must register a durable skip alongside its
      // deletion, or the next ensureRecurringOccurrences call recreates it
      // (issue #105) — a plain one-off entry keeps today's behavior exactly.
      if (target?.recurringExpenseId) {
        await deleteRecurringBudgetOccurrenceDb(id);
      } else {
        await deleteBudgetEntryDb(id);
      }
      refreshBudgetEvolution(budgetMonth);
    } catch (err) {
      console.error("[budget] delete failed:", err);
      setBudgetEntries(prevEntries);
      alert("La suppression de la dépense a échoué. Réessayez.");
    }
  }

  // Actions — household (Supabase-backed with optimistic update)
  async function updateHouseholdName(name: string) {
    const prevProfile = profile;
    setProfile((p) => ({ ...p, name }));
    try {
      await updateHouseholdNameDb(householdId, name);
    } catch (err) {
      console.error("[household] update name failed:", err);
      setProfile(prevProfile);
      throw err;
    }
  }

  return {
    // Navigation
    activeView,
    setActiveView,

    // Data
    shoppingItems,
    tasks,
    notes,
    links,
    events,
    dayItems,
    profile,
    accountEmail: initialAccountEmail,
    budgetCategories,
    budgetEntries,
    budgetEvolution,
    budgetMonth,
    budgetMonthLoading,

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
    setBudgetMonth,
    addBudgetEntry,
    updateBudgetEntry,
    deleteBudgetEntry,
    updateHouseholdName,
  };
}
