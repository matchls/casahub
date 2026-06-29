export type LinkCategory = "home" | "health" | "documents" | "admin" | "services" | "ideas";

export interface UsefulLink {
  id: number;
  title: string;
  url: string;
  category: LinkCategory;
  icon: string;
  createdBy?: "lea" | "tom";
}

export const CATEGORY_META: Record<LinkCategory, { label: string; emoji: string }> = {
  home:      { label: "Logement",      emoji: "🏠" },
  health:    { label: "Santé",         emoji: "❤️" },
  documents: { label: "Documents",     emoji: "📁" },
  admin:     { label: "Administratif", emoji: "📋" },
  services:  { label: "Services",      emoji: "🛠️" },
  ideas:     { label: "Idées",         emoji: "💡" },
};

export const CATEGORY_ORDER: LinkCategory[] = [
  "home",
  "health",
  "documents",
  "admin",
  "services",
  "ideas",
];

export const initialLinks: UsefulLink[] = [
  { id: 1,  title: "Assurance habitation",   url: "#",                              category: "home",      icon: "🛡️",  createdBy: "lea" },
  { id: 2,  title: "Bail & état des lieux",  url: "#",                              category: "home",      icon: "📄",  createdBy: "tom" },
  { id: 3,  title: "Espace Ameli",           url: "https://www.ameli.fr",           category: "health",    icon: "🩺",  createdBy: "lea" },
  { id: 4,  title: "Mutuelle",               url: "#",                              category: "health",    icon: "💊",  createdBy: "tom" },
  { id: 5,  title: "Drive partagé du foyer", url: "#",                              category: "documents", icon: "📂",  createdBy: "lea" },
  { id: 6,  title: "Assurance voiture",      url: "#",                              category: "documents", icon: "🚗",  createdBy: "tom" },
  { id: 7,  title: "Service-public.fr",      url: "https://www.service-public.fr",  category: "admin",     icon: "🏛️",  createdBy: "lea" },
  { id: 8,  title: "Impôts en ligne",        url: "https://www.impots.gouv.fr",     category: "admin",     icon: "📊",  createdBy: "tom" },
  { id: 9,  title: "Planning ménage",        url: "#",                              category: "services",  icon: "🧹",  createdBy: "lea" },
  { id: 10, title: "Idées week-end",         url: "#",                              category: "ideas",     icon: "💡",  createdBy: "tom" },
];
