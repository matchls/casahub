import type { NoteCategory, Note } from "@/lib/domain/types";
export type { NoteCategory, Note };

export const CATEGORY_META: Record<NoteCategory, { label: string; emoji: string }> = {
  wifi:    { label: "Wi-Fi maison",   emoji: "📶" },
  codes:   { label: "Codes",          emoji: "🔑" },
  numbers: { label: "Numéros utiles", emoji: "📞" },
  ideas:   { label: "Idées",          emoji: "💡" },
};

export const CATEGORY_ORDER: NoteCategory[] = ["wifi", "codes", "numbers", "ideas"];
