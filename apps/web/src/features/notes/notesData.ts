export type NoteCategory = "wifi" | "codes" | "numbers" | "ideas";

export interface Note {
  id: number;
  title: string;
  content: string;
  category: NoteCategory;
  createdBy?: "lea" | "tom";
}

export const CATEGORY_META: Record<
  NoteCategory,
  { label: string; emoji: string }
> = {
  wifi:    { label: "Wi-Fi maison",   emoji: "📶" },
  codes:   { label: "Codes",          emoji: "🔑" },
  numbers: { label: "Numéros utiles", emoji: "📞" },
  ideas:   { label: "Idées",          emoji: "💡" },
};

export const CATEGORY_ORDER: NoteCategory[] = ["wifi", "codes", "numbers", "ideas"];

export const initialNotes: Note[] = [
  { id: 1,  title: "Réseau",               content: "MaisonZen",          category: "wifi",    createdBy: "lea" },
  { id: 2,  title: "Mot de passe",         content: "••••••••",           category: "wifi",    createdBy: "lea" },
  { id: 3,  title: "Porte immeuble",       content: "4521B",              category: "codes",   createdBy: "tom" },
  { id: 4,  title: "Boîte aux lettres",    content: "n°12",               category: "codes",   createdBy: "tom" },
  { id: 5,  title: "Local vélos",          content: "3300#",              category: "codes",   createdBy: "tom" },
  { id: 6,  title: "Plombier",            content: "06 12 34 56 78",      category: "numbers", createdBy: "lea" },
  { id: 7,  title: "Assurance habitation", content: "01 23 45 67 89",     category: "numbers", createdBy: "lea" },
  { id: 8,  title: "Syndic",             content: "01 98 76 54 32",       category: "numbers", createdBy: "lea" },
  { id: 9,  title: "🍜 Resto japonais à tester", content: "",            category: "ideas",   createdBy: "tom" },
  { id: 10, title: "🎬 Film samedi soir",  content: "",                   category: "ideas",   createdBy: "lea" },
  { id: 11, title: "🪴 Plantes pour le balcon", content: "",             category: "ideas",   createdBy: "lea" },
];
