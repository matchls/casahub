"use client";
import type { BudgetCategory } from "@/lib/domain/types";
import { formatCents } from "./budgetData";

interface BudgetCategoryCardProps {
  category: BudgetCategory;
  totalCents: number;
  sharePercent: number;
  /** Equal per-person share, in cents — omitted (null) when it can't be validly computed. */
  perPersonCents: number | null;
  onClick: () => void;
}

export function BudgetCategoryCard({
  category,
  totalCents,
  sharePercent,
  perPersonCents,
  onClick,
}: BudgetCategoryCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-[18px] p-[16px] text-left w-full transition-opacity hover:opacity-90 active:opacity-80 cursor-pointer bg-[var(--budget-bg)]"
    >
      <div className="flex justify-between items-start">
        <span className="text-[26px] leading-none">{category.icon}</span>
        {totalCents > 0 && (
          <span className="rounded-full text-white text-[11px] font-bold px-[9px] py-[2px] leading-tight bg-[var(--budget-accent)]">
            {sharePercent}%
          </span>
        )}
      </div>
      <div
        className="font-extrabold text-[16px] mt-[10px] tracking-[-0.01em] text-[var(--budget-text)]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {category.name}
      </div>
      <div className="text-[15px] font-bold mt-[2px] tabular-nums" style={{ color: "#3A7A70" }}>
        {formatCents(totalCents)}
      </div>
      {perPersonCents !== null && (
        <div className="text-[11px] font-semibold mt-[1px] tabular-nums text-[var(--budget-text)] opacity-60">
          {formatCents(perPersonCents)} / personne
        </div>
      )}
    </button>
  );
}
