import { cn } from "@/lib/utils";

type AvatarSize = "sm" | "md" | "lg";

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  initials?: string;
  src?: string;
  alt?: string;
  size?: AvatarSize;
}

const sizeStyles: Record<AvatarSize, string> = {
  sm: "h-8 w-8 text-[11px]",
  md: "h-9 w-9 text-[13px]",
  lg: "h-[38px] w-[38px] text-[14px]",
};

export function Avatar({
  initials,
  src,
  alt,
  size = "md",
  className,
  ...props
}: AvatarProps) {
  return (
    <div
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center rounded-full",
        "bg-[var(--surface-muted)] text-[var(--text-secondary)] font-bold overflow-hidden",
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt ?? ""} className="h-full w-full object-cover" />
      ) : (
        <span>{initials ?? "?"}</span>
      )}
    </div>
  );
}
