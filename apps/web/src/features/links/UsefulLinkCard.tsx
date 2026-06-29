import { cn } from "@/lib/utils";
import type { UsefulLink, LinkCategory } from "./linksData";
import { CATEGORY_META } from "./linksData";

interface UsefulLinkCardProps {
  category: LinkCategory;
  links: UsefulLink[];
}

export function UsefulLinkCard({ category, links }: UsefulLinkCardProps) {
  if (links.length === 0) return null;

  const meta = CATEGORY_META[category];
  const isReal = (url: string) => url.startsWith("http");

  return (
    <section className="flex flex-col gap-[10px]">
      {/* Category header */}
      <div className="flex items-center gap-[8px] px-1">
        <span className="text-[18px] leading-none">{meta.emoji}</span>
        <h2 className="text-[11px] font-bold uppercase tracking-[.05em] text-[var(--text-muted)]">
          {meta.label}
        </h2>
      </div>

      {/* Links group */}
      <div className="rounded-[16px] bg-[var(--surface)] shadow-[var(--shadow-card)] overflow-hidden">
        {links.map((link, index) => (
          <div
            key={link.id}
            className={index > 0 ? "border-t border-[rgba(44,38,34,0.06)]" : ""}
          >
            <a
              href={link.url}
              target={isReal(link.url) ? "_blank" : undefined}
              rel="noopener noreferrer"
              onClick={!isReal(link.url) ? (e) => e.preventDefault() : undefined}
              className={cn(
                "flex items-center gap-3 px-4 py-[13px] transition-colors",
                isReal(link.url)
                  ? "hover:bg-[rgba(155,110,139,0.04)] cursor-pointer"
                  : "cursor-default"
              )}
            >
              <span className="shrink-0 text-[20px] leading-none">{link.icon}</span>
              <span className="flex-1 min-w-0 text-[15px] font-medium text-[var(--text-primary)] truncate">
                {link.title}
              </span>
              {/* External link arrow */}
              <svg
                className="shrink-0 text-[var(--text-muted)]"
                width="15"
                height="15"
                viewBox="0 0 15 15"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M3 11.5L11.5 3M11.5 3H7M11.5 3V7.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}
