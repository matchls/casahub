import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "shopping" | "tasks" | "agenda" | "notes" | "links";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  default:  "bg-[var(--surface-muted)] text-[var(--text-secondary)]",
  shopping: "bg-[var(--shopping-bg)] text-[var(--shopping-text)]",
  tasks:    "bg-[var(--tasks-bg)] text-[var(--tasks-text)]",
  agenda:   "bg-[var(--agenda-bg)] text-[var(--agenda-text)]",
  notes:    "bg-[var(--notes-bg)] text-[var(--notes-text)]",
  links:    "bg-[var(--links-bg)] text-[var(--links-text)]",
};

export function Badge({ variant = "default", className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
