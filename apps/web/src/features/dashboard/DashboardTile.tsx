import { cn } from "@/lib/utils";

export type TileTheme = "shopping" | "tasks" | "agenda" | "notes" | "links";

interface ThemeTokens {
  bg:            string;
  titleColor:    string;
  subtitleColor: string;
  badgeBg:       string;
}

const THEMES: Record<TileTheme, ThemeTokens> = {
  shopping: {
    bg:            "var(--shopping-bg)",
    titleColor:    "var(--shopping-text)",
    subtitleColor: "#A8623F",
    badgeBg:       "var(--shopping-accent)",
  },
  tasks: {
    bg:            "var(--tasks-bg)",
    titleColor:    "var(--tasks-text)",
    subtitleColor: "#6E8456",
    badgeBg:       "var(--tasks-accent)",
  },
  agenda: {
    bg:            "var(--agenda-bg)",
    titleColor:    "var(--agenda-text)",
    subtitleColor: "#5E7790",
    badgeBg:       "var(--agenda-accent)",
  },
  notes: {
    bg:            "var(--notes-bg)",
    titleColor:    "var(--notes-text)",
    subtitleColor: "#8A7536",
    badgeBg:       "var(--notes-accent)",
  },
  links: {
    bg:            "var(--links-bg)",
    titleColor:    "var(--links-text)",
    subtitleColor: "#8A6A82",
    badgeBg:       "var(--links-accent)",
  },
};

interface DashboardTileProps {
  theme:      TileTheme;
  emoji:      string;
  title:      string;
  subtitle:   string;
  badge?:     number;
  className?: string;
  minH?:      string;
  onClick?:   () => void;
}

export function DashboardTile({
  theme,
  emoji,
  title,
  subtitle,
  badge,
  className,
  minH = "min-h-[150px]",
  onClick,
}: DashboardTileProps) {
  const t = THEMES[theme];

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-[24px] p-[22px] text-left w-full",
        "transition-opacity hover:opacity-90 active:opacity-80 cursor-pointer",
        minH,
        className
      )}
      style={{ background: t.bg }}
    >
      {/* Icon row: emoji left, count badge right */}
      <div className="flex justify-between items-start">
        <span className="text-[30px] leading-none">{emoji}</span>
        {badge !== undefined && (
          <span
            className="rounded-full text-white text-[12px] font-bold px-[11px] py-[3px] leading-tight"
            style={{ background: t.badgeBg }}
          >
            {badge}
          </span>
        )}
      </div>

      {/* Section title */}
      <div
        className="font-extrabold text-[20px] mt-[14px] tracking-[-0.02em]"
        style={{ fontFamily: "var(--font-display)", color: t.titleColor }}
      >
        {title}
      </div>

      {/* Short content preview */}
      <div className="text-[13.5px] mt-[4px]" style={{ color: t.subtitleColor }}>
        {subtitle}
      </div>
    </button>
  );
}
