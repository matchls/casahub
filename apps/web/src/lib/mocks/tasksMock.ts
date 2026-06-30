import type { Task } from "@/lib/domain/types";

export const initialTasks: Task[] = [
  { id: 1, title: "Sortir les poubelles",  dueLabel: "Ce soir",          dueType: "date",       done: false, assignedTo: "tom" },
  { id: 2, title: "Appeler le syndic",     dueLabel: "Demain",           dueType: "date",       done: false, assignedTo: "lea" },
  { id: 3, title: "Réserver le resto 🎂",  dueLabel: "Sans date",        dueType: "none",       done: false, assignedTo: "tom" },
  { id: 4, title: "Arroser les plantes",   dueLabel: "Tous les 3 jours", dueType: "recurrence", done: false, assignedTo: "lea" },
];
