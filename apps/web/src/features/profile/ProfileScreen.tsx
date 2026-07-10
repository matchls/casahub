"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { HouseholdMemberCard } from "./HouseholdMemberCard";
import { InviteMemberRow } from "./InviteMemberRow";
import type { HouseholdProfile } from "@/lib/domain/types";

const HOUSEHOLD_NAME_MAX_LENGTH = 60;

function HouseholdNameEditor({
  name,
  isAdmin,
  onSave,
}: {
  name: string;
  isAdmin: boolean;
  onSave: (name: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startEditing() {
    setValue(name);
    setError(null);
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    setError(null);
  }

  async function handleSave() {
    const trimmed = value.trim();
    if (!trimmed) {
      setError("Le nom du foyer est obligatoire.");
      return;
    }
    if (trimmed.length > HOUSEHOLD_NAME_MAX_LENGTH) {
      setError(`Le nom ne peut pas dépasser ${HOUSEHOLD_NAME_MAX_LENGTH} caractères.`);
      return;
    }
    if (trimmed === name) {
      setEditing(false);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(trimmed);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-2 min-w-0">
        <h2
          className="font-extrabold text-[18px] text-[var(--text-primary)] tracking-[-0.02em] leading-tight truncate"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {name}
        </h2>
        {isAdmin && (
          <button
            type="button"
            onClick={startEditing}
            className="shrink-0 text-[12px] font-bold text-[var(--primary)] hover:opacity-80 transition-opacity cursor-pointer"
          >
            Modifier
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        maxLength={HOUSEHOLD_NAME_MAX_LENGTH}
        disabled={saving}
        className="w-full rounded-[10px] border-[1.5px] border-[var(--border-input)] bg-[var(--surface)] px-3 py-[7px] text-[15px] font-semibold text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] transition-colors"
      />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-[10px] bg-[var(--primary)] text-white font-semibold text-[13px] px-3 py-[6px] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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

function RowItem({
  icon,
  label,
  disabled = false,
  children,
}: {
  icon: string;
  label: string;
  disabled?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 py-[13px] border-b border-[var(--border)] last:border-b-0",
        disabled && "opacity-50"
      )}
    >
      <span className="text-[18px] w-6 text-center shrink-0 leading-none">{icon}</span>
      <span className="flex-1 min-w-0 truncate text-[15px] text-[var(--text-primary)] font-medium">
        {label}
      </span>
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-[0.06em] px-1 mb-2">
      {children}
    </p>
  );
}

interface ProfileScreenProps {
  profile: HouseholdProfile;
  accountEmail: string;
  onUpdateName: (name: string) => Promise<void>;
}

export function ProfileScreen({ profile, accountEmail, onUpdateName }: ProfileScreenProps) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const { name, type, createdAtLabel, currentUserIsAdmin, members } = profile;

  return (
    <div className="max-w-[720px] flex flex-col gap-5">

      {/* ── Foyer card ──────────────────────────────────────── */}
      <Card
        className="flex items-center gap-4 !p-4"
        style={{ backgroundColor: "var(--shopping-bg)", boxShadow: "none" }}
      >
        <div className="w-[52px] h-[52px] rounded-[14px] bg-[var(--primary)] flex items-center justify-center text-[26px] shrink-0 shadow-[var(--shadow-accent)]">
          🏡
        </div>
        <div className="min-w-0 flex-1">
          <HouseholdNameEditor name={name} isAdmin={currentUserIsAdmin} onSave={onUpdateName} />
          <p className="text-[13px] text-[var(--shopping-text)] font-semibold mt-[3px]">
            {type} · {members.length} membres · {createdAtLabel}
          </p>
        </div>
      </Card>

      {/* ── Membres ─────────────────────────────────────────── */}
      <div>
        <SectionLabel>Membres</SectionLabel>
        <Card className="!p-4">
          {members.map((m, i) => (
            <HouseholdMemberCard key={m.id} member={m} isCurrentUser={i === 0} />
          ))}

          {/* Invite row — only the household admin can invite new members */}
          {currentUserIsAdmin && <InviteMemberRow />}
        </Card>
      </div>

      {/* ── Préférences ─────────────────────────────────────── */}
      <div>
        <SectionLabel>Préférences</SectionLabel>
        <Card className="!p-4">
          <RowItem icon="🔔" label="Notifications du foyer" disabled>
            <Badge>Bientôt</Badge>
          </RowItem>
          <RowItem icon="💬" label="Message du jour" disabled>
            <Badge>Bientôt</Badge>
          </RowItem>
        </Card>
      </div>

      {/* ── Compte ──────────────────────────────────────────── */}
      <div>
        <SectionLabel>Compte</SectionLabel>
        <Card className="!p-4">
          <RowItem icon="✉️" label={accountEmail}>
            <span className="text-[12px] font-bold px-[10px] py-[4px] rounded-full bg-[var(--tasks-bg)] text-[var(--tasks-text)] shrink-0">
              Connecté
            </span>
          </RowItem>

          <div className="pt-4">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 py-[13px] px-4 rounded-[14px] border-[1.5px] border-[rgba(194,96,63,0.3)] text-[var(--primary)] font-semibold text-[15px] hover:bg-[var(--shopping-bg)] transition-colors cursor-pointer"
            >
              Se déconnecter
            </button>
          </div>
        </Card>
      </div>

    </div>
  );
}
