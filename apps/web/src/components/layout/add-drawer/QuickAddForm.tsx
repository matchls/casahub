"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface QuickAddFormProps {
  emoji: string;
  label: string;
  placeholder: string;
  bg: string;
  color: string;
  onBack: () => void;
  onSubmit: (value: string) => void;
}

export function QuickAddForm({
  emoji,
  label,
  placeholder,
  bg,
  color,
  onBack,
  onSubmit,
}: QuickAddFormProps) {
  const [value, setValue] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (value.trim()) onSubmit(value.trim());
  }

  return (
    <div>
      {/* Colored badge showing the selected action type */}
      <div
        className="inline-flex items-center gap-[8px] rounded-[10px] px-[12px] py-[8px] mb-5"
        style={{ background: bg }}
      >
        <span className="text-[18px] leading-none">{emoji}</span>
        <span className="text-[13px] font-semibold" style={{ color }}>
          {label}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          id="quick-add-input"
          label="Libellé"
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus
        />

        <div className="flex gap-[10px] mt-1">
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={onBack}
            className="shrink-0"
          >
            ← Retour
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={!value.trim()}
            className="flex-1"
          >
            Ajouter
          </Button>
        </div>
      </form>
    </div>
  );
}
