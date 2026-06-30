import type { MemberId, ShoppingItem } from "@/lib/domain/types";
export type { MemberId, ShoppingItem };

export const MEMBERS: Record<MemberId, { initial: string; color: string; name: string }> = {
  lea: { initial: "L", color: "#C2603F", name: "Léa" },
  tom: { initial: "T", color: "#6E8BA6", name: "Tom" },
};
