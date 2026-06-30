"use client";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { UsefulLinkCard } from "./UsefulLinkCard";
import { CATEGORY_ORDER } from "./linksData";
import type { UsefulLink } from "@/lib/domain/types";

interface UsefulLinksScreenProps {
  links: UsefulLink[];
  onAdd: (title: string, url: string) => void;
}

export function UsefulLinksScreen({ links, onAdd }: UsefulLinksScreenProps) {
  const [draftTitle, setDraftTitle] = useState("");
  const [draftUrl, setDraftUrl] = useState("");
  const titleInputRef = useRef<HTMLInputElement>(null);

  function handleAdd() {
    const trimmedTitle = draftTitle.trim();
    if (!trimmedTitle) return;
    onAdd(trimmedTitle, draftUrl.trim());
    setDraftTitle("");
    setDraftUrl("");
    titleInputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleAdd();
  }

  const categoriesWithLinks = CATEGORY_ORDER.filter((cat) =>
    links.some((l) => l.category === cat)
  );

  return (
    <div className="max-w-[720px] flex flex-col gap-5">
      {/* Quick-add */}
      <Card className="flex flex-col gap-[10px] !p-[14px]">
        <div className="flex items-center gap-3">
          <input
            ref={titleInputRef}
            type="text"
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Titre du lien..."
            className={cn(
              "flex-1 min-w-0 bg-transparent text-[15px] text-[var(--text-primary)]",
              "placeholder:text-[var(--placeholder)] focus:outline-none"
            )}
          />
          <button
            onClick={handleAdd}
            disabled={!draftTitle.trim()}
            aria-label="Ajouter un lien"
            className={cn(
              "shrink-0 w-9 h-9 rounded-[10px] flex items-center justify-center",
              "text-white text-[22px] font-light leading-none",
              "cursor-pointer transition-opacity",
              "bg-[var(--links-accent)]",
              "shadow-[0_8px_18px_-8px_rgba(155,110,139,.7)]",
              "hover:opacity-90 disabled:opacity-35 disabled:cursor-not-allowed"
            )}
          >
            +
          </button>
        </div>
        <input
          type="url"
          value={draftUrl}
          onChange={(e) => setDraftUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="https://... (optionnel)"
          className={cn(
            "w-full bg-transparent text-[13px] text-[var(--text-secondary)]",
            "placeholder:text-[var(--placeholder)] focus:outline-none",
            "border-t border-[rgba(44,38,34,0.06)] pt-[10px]"
          )}
        />
      </Card>

      {/* Empty state */}
      {links.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <span className="text-[56px] opacity-40">🔗</span>
          <p className="text-[15px] font-semibold text-[var(--text-muted)]">
            Aucun lien partagé pour le moment.
          </p>
          <p className="text-[13px] text-[var(--text-soft)]">
            Ajoutez un lien ci-dessus pour commencer.
          </p>
        </div>
      )}

      {/* Categories */}
      {categoriesWithLinks.map((category) => (
        <UsefulLinkCard
          key={category}
          category={category}
          links={links.filter((l) => l.category === category)}
        />
      ))}
    </div>
  );
}
