import type { Note } from "@/lib/domain/types";

export const initialNotes: Note[] = [
  { id: 1,  title: "Réseau",               content: "MaisonZen",                    category: "wifi",    createdBy: "lea" },
  { id: 2,  title: "Mot de passe",         content: "••••••••",                     category: "wifi",    createdBy: "lea" },
  { id: 3,  title: "Porte immeuble",       content: "enregistré dans les documents", category: "codes",   createdBy: "tom" },
  { id: 4,  title: "Boîte aux lettres",    content: "voir note sécurisée",           category: "codes",   createdBy: "tom" },
  { id: 5,  title: "Local vélos",          content: "accès partagé",                 category: "codes",   createdBy: "tom" },
  { id: 6,  title: "Plombier",             content: "contact enregistré",            category: "numbers", createdBy: "lea" },
  { id: 7,  title: "Assurance habitation", content: "contact enregistré",            category: "numbers", createdBy: "lea" },
  { id: 8,  title: "Syndic",              content: "contact enregistré",             category: "numbers", createdBy: "lea" },
  { id: 9,  title: "🍜 Resto japonais à tester", content: "",                        category: "ideas",   createdBy: "tom" },
  { id: 10, title: "🎬 Film samedi soir",  content: "",                              category: "ideas",   createdBy: "lea" },
  { id: 11, title: "🪴 Plantes pour le balcon",  content: "",                        category: "ideas",   createdBy: "lea" },
];
