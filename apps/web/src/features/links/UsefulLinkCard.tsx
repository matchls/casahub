"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { UsefulLink, LinkCategory } from "./linksData";
import { CATEGORY_META } from "./linksData";

interface UsefulLinkCardProps {
  category: LinkCategory;
  links: UsefulLink[];
  onUpdate: (id: string, title: string, url: string) => Promise<void>;
  onDelete: (id: string) => void;
}

const inputClass =
  "min-w-0 rounded-[10px] border-[1.5px] border-[var(--border-input)] bg-[var(--surface)] px-3 py-[6px] text-[14px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--links-accent)] transition-colors";

function LinkEditForm({
  link,
  onUpdate,
  onDone,
}: {
  link: UsefulLink;
  onUpdate: (id: string, title: string, url: string) => Promise<void>;
  onDone: () => void;
}) {
  const [title, setTitle] = useState(link.title);
  const [url, setUrl] = useState(link.url);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Le titre est obligatoire.");
      return;
    }
    const trimmedUrl = url.trim();
    if (trimmedTitle === link.title && trimmedUrl === link.url) {
      onDone();
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onUpdate(link.id, trimmedTitle, trimmedUrl);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="flex-1 min-w-0 flex flex-col gap-[6px] px-4 py-[10px]">
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        disabled={saving}
        className={inputClass}
      />
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        disabled={saving}
        placeholder="https://..."
        className={inputClass}
      />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-[8px] bg-[var(--links-accent)] text-white font-semibold text-[12px] px-[10px] py-[4px] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
        <button
          type="button"
          onClick={onDone}
          disabled={saving}
          className="text-[12px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors cursor-pointer"
        >
          Annuler
        </button>
      </div>
      {error && <p className="text-[12px] text-red-500">{error}</p>}
    </form>
  );
}

export function UsefulLinkCard({ category, links, onUpdate, onDelete }: UsefulLinkCardProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  if (links.length === 0) return null;

  const meta = CATEGORY_META[category];
  const isReal = (url: string) => url.startsWith("http");

  function handleDelete(id: string) {
    if (confirm("Supprimer ce lien ?")) {
      onDelete(id);
    }
  }

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
            className={cn(
              "flex items-center",
              index > 0 ? "border-t border-[rgba(44,38,34,0.06)]" : ""
            )}
          >
            {editingId === link.id ? (
              <LinkEditForm link={link} onUpdate={onUpdate} onDone={() => setEditingId(null)} />
            ) : (
              <>
                <a
                  href={link.url}
                  target={isReal(link.url) ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  onClick={!isReal(link.url) ? (e) => e.preventDefault() : undefined}
                  className={cn(
                    "flex-1 min-w-0 flex items-center gap-3 px-4 py-[13px] transition-colors",
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

                {/* Edit — sibling of the <a>, not nested inside it, so it never triggers navigation */}
                <button
                  type="button"
                  onClick={() => setEditingId(link.id)}
                  aria-label="Modifier le lien"
                  className="shrink-0 w-6 h-6 mr-1 rounded-full flex items-center justify-center text-[13px] leading-none text-[var(--text-muted)] opacity-50 hover:opacity-100 hover:text-[var(--links-text)] cursor-pointer transition-opacity"
                >
                  ✎
                </button>

                {/* Delete — sibling of the <a>, not nested inside it, so it never triggers navigation */}
                <button
                  type="button"
                  onClick={() => handleDelete(link.id)}
                  aria-label="Supprimer le lien"
                  className="shrink-0 w-6 h-6 mr-3 rounded-full flex items-center justify-center text-[15px] leading-none text-[var(--text-muted)] opacity-50 hover:opacity-100 hover:text-red-500 cursor-pointer transition-opacity"
                >
                  ×
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
