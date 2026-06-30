import type { LinkCategory, UsefulLink } from "@/lib/domain/types";
export type { LinkCategory, UsefulLink };

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
