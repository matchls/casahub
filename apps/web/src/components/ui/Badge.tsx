import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "shopping" | "tasks" | "agenda" | "notes" | "links";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  default:  "bg-[var(--surface-muted)] text-[var(--text-secondary)]",
  shopping: "bg-[var(--shopping-accent)] text-white",
  tasks:    "bg-[var(--tasks-accent)] text-white",
  agenda:   "bg-[var(--agenda-accent)] text-white",
  notes:    "bg-[var(--notes-accent)] text-white",
  links:    "bg-[var(--links-accent)] text-white",
};

export function Badge({ variant = "default", className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-[13px] font-bold",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
