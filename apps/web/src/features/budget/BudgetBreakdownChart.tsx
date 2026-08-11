"use client";
import type { BudgetBreakdownSlice } from "./budgetData";
import { formatCents } from "./budgetData";

interface BudgetBreakdownChartProps {
  breakdown: BudgetBreakdownSlice[];
}

// Reuses the app's existing per-module accent colors (shopping/notes/tasks/
// agenda/links/budget) so the chart stays visually consistent with the rest
// of Kasaly instead of introducing a new ad-hoc palette.
const SLICE_COLORS = [
  "#C2603F", // shopping terracotta
  "#C99A3F", // notes gold
  "#7E9B6E", // tasks green
  "#6E8BA6", // agenda blue
  "#9B6E8B", // links mauve
  "#4F8F84", // budget teal
];

const RADIUS = 40;
const STROKE_WIDTH = 16;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function BudgetBreakdownChart({ breakdown }: BudgetBreakdownChartProps) {
  const totalCents = breakdown.reduce((sum, slice) => sum + slice.amountCents, 0);

  if (totalCents === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
        <span className="text-[40px] opacity-40">📊</span>
        <p className="text-[14px] font-semibold text-[var(--text-muted)]">Aucune dépense ce mois-ci.</p>
        <p className="text-[12.5px] text-[var(--text-soft)]">
          Ajoutez une dépense pour visualiser la répartition.
        </p>
      </div>
    );
  }

  // Colors are assigned by each category's position in the full (unfiltered)
  // breakdown, so a category keeps the same color across months even if it
  // has zero spending some months and drops out of `slices` below.
  const colorByCategoryId = new Map(
    breakdown.map((slice, index) => [slice.category.id, SLICE_COLORS[index % SLICE_COLORS.length]])
  );
  const slices = breakdown.filter((slice) => slice.amountCents > 0);

  // Arc geometry uses the exact cents fraction (not the rounded display
  // percentage) so slices tile the circle exactly with no gaps/overlaps —
  // only the legend shows the rounded, card-matching percentage. Built via
  // reduce (not a mutable variable closed over by the JSX map below) so each
  // slice's cumulative start position is computed as plain derived data.
  const arcs = slices.reduce<{ id: string; color: string | undefined; dash: number; dashOffset: number }[]>(
    (acc, slice) => {
      const fractionSoFar = acc.reduce((sum, arc) => sum + arc.dash, 0) / CIRCUMFERENCE;
      const fraction = slice.amountCents / totalCents;
      acc.push({
        id: slice.category.id,
        color: colorByCategoryId.get(slice.category.id),
        dash: fraction * CIRCUMFERENCE,
        dashOffset: -fractionSoFar * CIRCUMFERENCE,
      });
      return acc;
    },
    []
  );

  return (
    <div className="flex flex-col min-[560px]:flex-row items-center gap-5">
      <svg viewBox="0 0 100 100" className="w-[150px] h-[150px] shrink-0 -rotate-90" aria-hidden="true">
        <circle cx="50" cy="50" r={RADIUS} fill="none" stroke="var(--surface-muted)" strokeWidth={STROKE_WIDTH} />
        {arcs.map((arc) => (
          <circle
            key={arc.id}
            cx="50"
            cy="50"
            r={RADIUS}
            fill="none"
            stroke={arc.color}
            strokeWidth={STROKE_WIDTH}
            strokeDasharray={`${arc.dash} ${CIRCUMFERENCE - arc.dash}`}
            strokeDashoffset={arc.dashOffset}
          />
        ))}
      </svg>

      <ul className="flex-1 min-w-0 w-full flex flex-col gap-[8px]">
        {slices.map((slice) => (
          <li key={slice.category.id} className="flex items-center gap-[8px] text-[13.5px]">
            <span
              className="shrink-0 w-[10px] h-[10px] rounded-full"
              style={{ background: colorByCategoryId.get(slice.category.id) }}
              aria-hidden="true"
            />
            <span className="shrink-0">{slice.category.icon}</span>
            <span className="flex-1 min-w-0 truncate font-semibold text-[var(--text-primary)]">
              {slice.category.name}
            </span>
            <span className="shrink-0 tabular-nums text-[var(--text-secondary)]">
              {formatCents(slice.amountCents)}
            </span>
            <span className="shrink-0 w-[36px] text-right tabular-nums font-bold text-[var(--text-muted)]">
              {slice.sharePercent}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
