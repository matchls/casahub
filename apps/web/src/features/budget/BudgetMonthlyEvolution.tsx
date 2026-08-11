"use client";
import { cn } from "@/lib/utils";
import type { BudgetMonthlyEvolutionPoint } from "./budgetData";
import { formatCentsCompact, formatShortBudgetMonthLabel } from "./budgetData";

interface BudgetMonthlyEvolutionProps {
  points: BudgetMonthlyEvolutionPoint[];
  selectedMonth: string;
}

const CHART_HEIGHT = 88;

export function BudgetMonthlyEvolution({ points, selectedMonth }: BudgetMonthlyEvolutionProps) {
  const hasAnySpending = points.some((point) => point.amountCents > 0);

  if (!hasAnySpending) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
        <span className="text-[40px] opacity-40">📈</span>
        <p className="text-[14px] font-semibold text-[var(--text-muted)]">
          Aucune dépense sur les derniers mois.
        </p>
      </div>
    );
  }

  const maxCents = Math.max(...points.map((point) => point.amountCents));

  return (
    <div className="flex items-end justify-between gap-[4px] min-[420px]:gap-[10px]">
      {points.map((point) => {
        const isSelected = point.month === selectedMonth;
        const barHeight = point.amountCents > 0 ? Math.max(4, Math.round((point.amountCents / maxCents) * CHART_HEIGHT)) : 2;

        return (
          <div key={point.month} className="flex-1 min-w-0 flex flex-col items-center gap-[6px]">
            <span
              className={cn(
                "text-[10px] min-[420px]:text-[11px] font-bold tabular-nums leading-none whitespace-nowrap",
                isSelected ? "text-[var(--budget-text)]" : "text-[var(--text-muted)]"
              )}
            >
              {point.amountCents > 0 ? formatCentsCompact(point.amountCents) : "—"}
            </span>
            <div
              className="w-full flex items-end justify-center"
              style={{ height: CHART_HEIGHT }}
            >
              <div
                className={cn(
                  "w-full max-w-[30px] rounded-t-[6px] transition-colors",
                  isSelected ? "bg-[var(--budget-accent)]" : "bg-[var(--budget-bg)]"
                )}
                style={{ height: barHeight }}
              />
            </div>
            <span
              className={cn(
                "text-[10.5px] min-[420px]:text-[11px] font-semibold whitespace-nowrap",
                isSelected ? "text-[var(--budget-text)]" : "text-[var(--text-muted)]"
              )}
            >
              {formatShortBudgetMonthLabel(point.month)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
