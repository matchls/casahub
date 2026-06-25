import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-[var(--primary)] text-white font-bold hover:opacity-90 shadow-[var(--shadow-accent)]",
  secondary:
    "bg-[var(--surface)] border-[1.5px] border-[var(--border-input)] text-[var(--text-primary)] font-semibold hover:bg-[var(--surface-muted)]",
  ghost:
    "bg-transparent text-[var(--text-secondary)] font-semibold hover:bg-[var(--surface-muted)]",
};

const sizeStyles: Record<Size, string> = {
  sm: "px-4 py-2.5 text-[13px]",
  md: "px-4 py-3 text-[14.5px]",
  lg: "px-5 py-4 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-[14px] transition-all cursor-pointer",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
