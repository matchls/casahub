import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, className, id, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={id}
          className="text-[12px] font-bold uppercase tracking-[.05em] text-[var(--text-muted)]"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        className={cn(
          "w-full rounded-[14px] border-[1.5px] border-[var(--border-input)]",
          "bg-[var(--surface)] px-4 py-[15px] text-[15px] text-[var(--text-primary)]",
          "placeholder:text-[var(--placeholder)]",
          "focus:outline-none focus:border-[var(--primary)]",
          "transition-colors",
          className
        )}
        {...props}
      />
    </div>
  );
}
