import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[16px] bg-[var(--surface)] p-[15px]",
        "shadow-[var(--shadow-card)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: CardProps) {
  return (
    <div className={cn("mb-3", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: CardProps) {
  return (
    <h3
      className={cn(
        "font-extrabold text-[var(--text-primary)] leading-tight tracking-[-0.02em]",
        className
      )}
      style={{ fontFamily: "var(--font-display)" }}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardContent({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn("text-[13.5px] text-[var(--text-secondary)]", className)}
      {...props}
    >
      {children}
    </div>
  );
}
