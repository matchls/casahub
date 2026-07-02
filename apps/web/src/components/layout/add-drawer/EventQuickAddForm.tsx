"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface EventQuickAddFormProps {
  emoji: string;
  label: string;
  placeholder: string;
  bg: string;
  color: string;
  onBack: () => void;
  onSubmit: (title: string, eventDate: string, eventTime?: string, location?: string) => void;
}

function todayIsoDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function EventQuickAddForm({
  emoji,
  label,
  placeholder,
  bg,
  color,
  onBack,
  onSubmit,
}: EventQuickAddFormProps) {
  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState(todayIsoDate());
  const [eventTime, setEventTime] = useState("");
  const [location, setLocation] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle || !eventDate) return;
    onSubmit(trimmedTitle, eventDate, eventTime || undefined, location.trim() || undefined);
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
          id="event-title"
          label="Titre"
          placeholder={placeholder}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />

        <div className="flex gap-3">
          <Input
            id="event-date"
            label="Date"
            type="date"
            min={todayIsoDate()}
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            className="flex-1"
          />
          <Input
            id="event-time"
            label="Heure (optionnel)"
            type="time"
            value={eventTime}
            onChange={(e) => setEventTime(e.target.value)}
            className="flex-1"
          />
        </div>

        <Input
          id="event-location"
          label="Lieu (optionnel)"
          placeholder="Ex : Cabinet Dr. Roche"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
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
            disabled={!title.trim() || !eventDate}
            className="flex-1"
          >
            Ajouter
          </Button>
        </div>
      </form>
    </div>
  );
}
