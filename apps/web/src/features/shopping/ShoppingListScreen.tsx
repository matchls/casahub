"use client";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { initialShoppingItems } from "./shoppingData";
import type { ShoppingItem } from "./shoppingData";
import { ShoppingItemRow } from "./ShoppingItemRow";

interface ShoppingListScreenProps {
  onPendingCountChange?: (count: number) => void;
}

export function ShoppingListScreen({ onPendingCountChange }: ShoppingListScreenProps) {
  const [items, setItems] = useState<ShoppingItem[]>(initialShoppingItems);
  const [draft, setDraft] = useState("");
  const nextIdRef = useRef(initialShoppingItems.length + 1);
  const inputRef = useRef<HTMLInputElement>(null);

  const pendingItems = items.filter((i) => !i.done);
  const doneItems = items.filter((i) => i.done);

  useEffect(() => {
    onPendingCountChange?.(pendingItems.length);
  }, [pendingItems.length, onPendingCountChange]);

  function handleToggle(id: number) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
  }

  function handleAdd() {
    const trimmed = draft.trim();
    if (!trimmed) return;

    const newItem: ShoppingItem = {
      id: nextIdRef.current++,
      label: trimmed,
      done: false,
      assignedTo: "lea",
    };

    setItems((prev) => [newItem, ...prev]);
    setDraft("");
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleAdd();
  }

  return (
    <div className="max-w-[720px] flex flex-col gap-5">
      {/* Add item */}
      <Card className="flex items-center gap-3 !p-[14px]">
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ajouter un article..."
          className={cn(
            "flex-1 min-w-0 bg-transparent text-[15px] text-[var(--text-primary)]",
            "placeholder:text-[var(--placeholder)] focus:outline-none"
          )}
        />
        <button
          onClick={handleAdd}
          disabled={!draft.trim()}
          aria-label="Ajouter un article"
          className={cn(
            "shrink-0 w-9 h-9 rounded-[10px] flex items-center justify-center",
            "text-white text-[22px] font-light leading-none",
            "cursor-pointer transition-opacity",
            "bg-[var(--shopping-accent)] shadow-[var(--shadow-accent)]",
            "hover:opacity-90 disabled:opacity-35 disabled:cursor-not-allowed"
          )}
        >
          +
        </button>
      </Card>

      {/* Empty state */}
      {items.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <span className="text-[56px] opacity-40">🛒</span>
          <p className="text-[15px] font-semibold text-[var(--text-muted)]">
            Votre liste de courses est vide.
          </p>
          <p className="text-[13px] text-[var(--text-soft)]">
            Ajoutez un article ci-dessus pour commencer.
          </p>
        </div>
      )}

      {/* À prendre */}
      {pendingItems.length > 0 && (
        <section>
          <h2 className="text-[11px] font-bold uppercase tracking-[.05em] text-[var(--text-muted)] mb-3 px-1">
            À prendre · {pendingItems.length}
          </h2>
          <div className="rounded-[16px] bg-[var(--surface)] shadow-[var(--shadow-card)] overflow-hidden">
            {pendingItems.map((item, index) => (
              <div
                key={item.id}
                className={index > 0 ? "border-t border-[rgba(44,38,34,0.06)]" : ""}
              >
                <ShoppingItemRow item={item} onToggle={handleToggle} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Déjà pris */}
      {doneItems.length > 0 && (
        <section>
          <h2 className="text-[11px] font-bold uppercase tracking-[.05em] text-[var(--text-muted)] mb-3 px-1">
            Déjà pris · {doneItems.length}
          </h2>
          <div className="rounded-[16px] bg-[var(--surface-muted)] shadow-[var(--shadow-card)] overflow-hidden">
            {doneItems.map((item, index) => (
              <div
                key={item.id}
                className={index > 0 ? "border-t border-[rgba(44,38,34,0.06)]" : ""}
              >
                <ShoppingItemRow item={item} onToggle={handleToggle} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
