export type MemberId = "lea" | "tom";

export interface ShoppingItem {
  id: number;
  label: string;
  quantity?: number;
  done: boolean;
  assignedTo: MemberId;
}

export const MEMBERS: Record<MemberId, { initial: string; color: string; name: string }> = {
  lea: { initial: "L", color: "#C2603F", name: "Léa" },
  tom: { initial: "T", color: "#6E8BA6", name: "Tom" },
};

export const initialShoppingItems: ShoppingItem[] = [
  { id: 1, label: "Lait demi-écrémé", quantity: 2, done: false, assignedTo: "lea" },
  { id: 2, label: "Café en grains",               done: false, assignedTo: "tom" },
  { id: 3, label: "Éponges",                       done: false, assignedTo: "lea" },
  { id: 4, label: "Pommes",           quantity: 6, done: false, assignedTo: "tom" },
  { id: 5, label: "Pain de mie",                   done: false, assignedTo: "lea" },
  { id: 6, label: "Yaourts nature",                done: false, assignedTo: "tom" },
  { id: 7, label: "Riz",                           done: false, assignedTo: "lea" },
  { id: 8, label: "Tomates",                       done: false, assignedTo: "tom" },
];
