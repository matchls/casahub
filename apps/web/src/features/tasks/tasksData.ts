export type MemberId = "lea" | "tom";
export type DueType = "date" | "recurrence" | "none";

export interface Task {
  id: number;
  title: string;
  dueLabel: string;
  dueType: DueType;
  done: boolean;
  assignedTo: MemberId;
}

export const MEMBERS: Record<MemberId, { initial: string; color: string; name: string }> = {
  lea: { initial: "L", color: "#C2603F", name: "Léa" },
  tom: { initial: "T", color: "#6E8BA6", name: "Tom" },
};

export const initialTasks: Task[] = [
  { id: 1, title: "Sortir les poubelles",  dueLabel: "Ce soir",          dueType: "date",       done: false, assignedTo: "tom" },
  { id: 2, title: "Appeler le syndic",     dueLabel: "Demain",           dueType: "date",       done: false, assignedTo: "lea" },
  { id: 3, title: "Réserver le resto 🎂",  dueLabel: "Sans date",        dueType: "none",       done: false, assignedTo: "tom" },
  { id: 4, title: "Arroser les plantes",   dueLabel: "Tous les 3 jours", dueType: "recurrence", done: false, assignedTo: "lea" },
];
