import { Card } from "@/components/ui/Card";
import { dayTimelineItems } from "./agendaData";
import { TimelineItemRow } from "./TimelineItemRow";

export function DayViewScreen() {
  if (dayTimelineItems.length === 0) {
    return (
      <div className="max-w-[720px] flex flex-col items-center justify-center gap-3 py-20 text-center">
        <span className="text-[56px] opacity-40">☀️</span>
        <p className="text-[15px] font-semibold text-[var(--text-muted)]">
          Rien de prévu aujourd&apos;hui.
        </p>
        <p className="text-[13px] text-[var(--text-soft)]">
          Profitez-en pour souffler !
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-[720px] flex flex-col gap-5">
      <Card className="!p-5">
        <div className="flex flex-col">
          {dayTimelineItems.map((item, index) => (
            <TimelineItemRow
              key={item.id}
              item={item}
              isLast={index === dayTimelineItems.length - 1}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}
