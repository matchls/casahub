"use client";
import { cn } from "@/lib/utils";
import type { BudgetCategory } from "@/lib/domain/types";
import { formatCents, type BudgetTargetStatus } from "./budgetData";

interface BudgetCategoryCardProps {
  category: BudgetCategory;
  totalCents: number;
  sharePercent: number;
  /** Equal per-person share, in cents — omitted (null) when it can't be validly computed. */
  perPersonCents: number | null;
  /** Planned-vs-actual for this category this month (issue #113) — omitted when no target is set, which keeps the card exactly as it looked before targets existed. */
  targetStatus?: BudgetTargetStatus;
  onClick: () => void;
}

export function BudgetCategoryCard({
  category,
  totalCents,
  sharePercent,
  perPersonCents,
  targetStatus,
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
      {targetStatus ? (
        <>
          <div className="text-[15px] font-bold mt-[2px] tabular-nums" style={{ color: "#3A7A70" }}>
            {formatCents(totalCents)}
            <span className="text-[12px] font-semibold opacity-60"> / {formatCents(targetStatus.plannedCents)}</span>
          </div>
          <div className="h-[4px] rounded-full bg-black/[.08] mt-[6px] overflow-hidden">
            <div
              className={cn("h-full rounded-full", targetStatus.isOverspent ? "bg-red-500" : "bg-[var(--budget-accent)]")}
              style={{ width: `${targetStatus.progressPercent}%` }}
            />
          </div>
          <div
            className={cn(
              "text-[11px] font-semibold mt-[4px] tabular-nums",
              targetStatus.isOverspent ? "text-red-500" : "text-[var(--budget-text)] opacity-60"
            )}
          >
            {targetStatus.isOverspent ? "Dépassement " : "Reste "}
            {formatCents(targetStatus.gapCents)}
          </div>
        </>
      ) : (
        <>
          <div className="text-[15px] font-bold mt-[2px] tabular-nums" style={{ color: "#3A7A70" }}>
            {formatCents(totalCents)}
          </div>
          {perPersonCents !== null && (
            <div className="text-[11px] font-semibold mt-[1px] tabular-nums text-[var(--budget-text)] opacity-60">
              {formatCents(perPersonCents)} / personne
            </div>
          )}
        </>
      )}
    </button>
  );
}
