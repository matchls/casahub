"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { ShoppingItem } from "./shoppingData";
import type { UpdateShoppingItemInput } from "@/lib/supabase/shopping";
import type { HouseholdMember } from "@/lib/domain/types";

interface ShoppingItemRowProps {
  item: ShoppingItem;
  onToggle: (id: string) => void;
  onUpdate: (id: string, input: UpdateShoppingItemInput) => Promise<void>;
  onDelete: (id: string) => void;
  members: HouseholdMember[];
}

export function ShoppingItemRow({ item, onToggle, onUpdate, onDelete, members }: ShoppingItemRowProps) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(item.label);
  const [quantity, setQuantity] = useState(item.quantity?.toString() ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const member = item.assignedTo ? members.find((m) => m.id === item.assignedTo) : undefined;

  function startEditing(e: React.MouseEvent) {
    e.stopPropagation();
    setLabel(item.label);
    setQuantity(item.quantity?.toString() ?? "");
    setError(null);
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    setError(null);
  }

  async function handleSave() {
    const trimmed = label.trim();
    if (!trimmed) {
      setError("Le nom de l'article est obligatoire.");
      return;
    }
    const trimmedQty = quantity.trim();
    const parsedQuantity = trimmedQty ? Number(trimmedQty) : undefined;
    if (trimmedQty && (!Number.isFinite(parsedQuantity) || (parsedQuantity as number) <= 0)) {
      setError("Quantité invalide.");
      return;
    }
    if (trimmed === item.label && parsedQuantity === item.quantity) {
      setEditing(false);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onUpdate(item.id, { label: trimmed, quantity: parsedQuantity });
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-2 px-4 py-[11px]">
        <div className="flex items-center gap-2">
          <input
            autoFocus
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            disabled={saving}
            className="flex-1 min-w-0 rounded-[10px] border-[1.5px] border-[var(--border-input)] bg-[var(--surface)] px-3 py-[7px] text-[15px] font-medium text-[var(--text-primary)] focus:outline-none focus:border-[var(--shopping-accent)] transition-colors"
          />
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            disabled={saving}
            placeholder="Qté"
            aria-label="Quantité"
            className="w-[64px] shrink-0 rounded-[10px] border-[1.5px] border-[var(--border-input)] bg-[var(--surface)] px-2 py-[7px] text-[15px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--shopping-accent)] transition-colors"
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-[10px] bg-[var(--shopping-accent)] text-white font-semibold text-[13px] px-3 py-[6px] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
          <button
            type="button"
            onClick={cancelEditing}
            disabled={saving}
            className="text-[13px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors cursor-pointer"
          >
            Annuler
          </button>
        </div>
        {error && <p className="text-[13px] text-red-500">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-4 py-[11px]">
      {/* Square checkbox */}
      <button
        role="checkbox"
        aria-checked={item.done}
        onClick={() => onToggle(item.id)}
        className={cn(
          "shrink-0 w-[22px] h-[22px] rounded-[6px] border-2 flex items-center justify-center",
          "cursor-pointer transition-colors",
          item.done
            ? "bg-[var(--shopping-accent)] border-[var(--shopping-accent)]"
            : "bg-transparent border-[rgba(44,38,34,0.20)] hover:border-[var(--shopping-accent)]"
        )}
        aria-label={item.done ? "Marquer comme à prendre" : "Marquer comme pris"}
      >
        {item.done && (
          <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
            <path
              d="M1 4L4.5 7.5L11 1"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      {/* Label + optional quantity (separate spans so only label gets line-through) */}
      <div className="flex-1 min-w-0 flex items-baseline gap-1">
        <span
          className={cn(
            "text-[15px] font-medium truncate",
            item.done
              ? "text-[var(--text-muted)] line-through"
              : "text-[var(--text-primary)]"
          )}
        >
          {item.label}
        </span>
        {item.quantity !== undefined && (
          <span className="shrink-0 text-[13px] text-[var(--text-muted)] font-normal">
            ×{item.quantity}
          </span>
        )}
      </div>

      {/* Member avatar (optional — only shown when the item is actually assigned) */}
      {member && (
        <div
          className="shrink-0 w-[28px] h-[28px] rounded-full flex items-center justify-center text-white text-[11px] font-bold"
          style={{ backgroundColor: member.color }}
          title={member.name}
        >
          {member.initial}
        </div>
      )}

      {/* Edit */}
      <button
        type="button"
        onClick={startEditing}
        aria-label="Modifier la course"
        className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[13px] leading-none text-[var(--text-muted)] opacity-50 hover:opacity-100 hover:text-[var(--shopping-accent)] cursor-pointer transition-opacity"
      >
        ✎
      </button>

      {/* Delete */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(item.id);
        }}
        aria-label="Supprimer la course"
        className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[15px] leading-none text-[var(--text-muted)] opacity-50 hover:opacity-100 hover:text-red-500 cursor-pointer transition-opacity"
      >
        ×
      </button>
    </div>
  );
}
