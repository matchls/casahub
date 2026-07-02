import type { View } from "@/components/layout/types";
import type { ShoppingItem, Task } from "@/lib/domain/types";
import { DashboardTile } from "./DashboardTile";
import { events, notes, links } from "./dashboardData";

interface HomeDashboardProps {
  onNavigate: (view: View) => void;
  shoppingItems: ShoppingItem[];
  tasks: Task[];
}

export function HomeDashboard({ onNavigate, shoppingItems, tasks }: HomeDashboardProps) {
  const pendingShoppingItems = shoppingItems.filter((i) => !i.done);
  const shoppingLabels = pendingShoppingItems.map((i) => i.label);
  const extraShopping = shoppingLabels.length - 3;
  const shoppingPreview =
    shoppingLabels.length === 0
      ? "Liste vide"
      : shoppingLabels.slice(0, 3).join(" · ") +
        (extraShopping > 0 ? ` · +${extraShopping}` : "");

  const pendingTasks = tasks.filter((t) => !t.done).length;
  const tasksSubtitle = pendingTasks === 0 ? "Aucune tâche à faire" : `${pendingTasks} à faire`;

  const nextEvent = events[0];
  const agendaPreview = nextEvent
    ? `${nextEvent.label} · ${nextEvent.time}`
    : "Aucun événement";

  // "Wi-Fi · Code alarme"
  const notesPreview = notes
    .map((n) => n.label.split(":")[0].trim())
    .join(" · ");

  const linksPreview = links.map((l) => l.label).join(" · ");

  return (
    <div className="grid grid-cols-2 min-[880px]:grid-cols-6 gap-4">
      {/* Courses — full width mobile / half desktop */}
      <DashboardTile
        theme="shopping"
        emoji="🛒"
        title="Courses"
        subtitle={shoppingPreview}
        badge={pendingShoppingItems.length}
        className="col-span-2 min-[880px]:col-span-3"
        minH="min-h-[170px]"
        onClick={() => onNavigate("shopping")}
      />

      {/* Tâches — half mobile / half desktop */}
      <DashboardTile
        theme="tasks"
        emoji="✅"
        title="Tâches"
        subtitle={tasksSubtitle}
        badge={pendingTasks}
        className="col-span-1 min-[880px]:col-span-3"
        minH="min-h-[170px]"
        onClick={() => onNavigate("tasks")}
      />

      {/* Agenda — half mobile / 1/3 desktop */}
      <DashboardTile
        theme="agenda"
        emoji="📅"
        title="Agenda"
        subtitle={agendaPreview}
        className="col-span-1 min-[880px]:col-span-2"
        minH="min-h-[140px]"
        onClick={() => onNavigate("calendar")}
      />

      {/* Notes — half mobile / 1/3 desktop */}
      <DashboardTile
        theme="notes"
        emoji="📝"
        title="Notes"
        subtitle={notesPreview}
        className="col-span-1 min-[880px]:col-span-2"
        minH="min-h-[140px]"
        onClick={() => onNavigate("notes")}
      />

      {/* Liens utiles — half mobile / 1/3 desktop */}
      <DashboardTile
        theme="links"
        emoji="🔗"
        title="Liens utiles"
        subtitle={linksPreview}
        className="col-span-1 min-[880px]:col-span-2"
        minH="min-h-[140px]"
        onClick={() => onNavigate("links")}
      />
    </div>
  );
}
