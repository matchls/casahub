"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";
import { Input, Avatar } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { createHouseholdWithMember } from "@/lib/supabase/households";

type HouseholdType = "couple" | "colocation" | "famille";

const HOUSEHOLD_TYPES = [
  { value: "couple" as HouseholdType,     label: "Couple",      emoji: "💑" },
  { value: "colocation" as HouseholdType, label: "Colocation",  emoji: "🏘️" },
  { value: "famille" as HouseholdType,    label: "Famille",     emoji: "👨‍👩‍👧" },
];

const TYPE_MAP: Record<HouseholdType, "Couple" | "Colocation" | "Famille"> = {
  couple: "Couple",
  colocation: "Colocation",
  famille: "Famille",
};

const FIRST_MEMBER_COLOR = "#C2603F";

function deriveDisplayName(user: User): string {
  const meta = user.user_metadata as Record<string, string | undefined>;
  const fromMeta = meta.full_name?.trim() || meta.name?.trim();
  if (fromMeta) return fromMeta;
  return user.email?.split("@")[0] ?? "Membre";
}

function HouseholdTypeButton({
  emoji,
  label,
  selected,
  onClick,
}: {
  emoji: string;
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex flex-col items-center justify-center gap-[6px] py-[14px] rounded-[14px]",
        "border-[1.5px] transition-all cursor-pointer font-semibold text-[14px] w-full",
        selected
          ? "border-[var(--primary)] text-[var(--primary)] hover:opacity-90"
          : "border-[var(--border-input)] bg-[var(--surface)] text-[var(--text-primary)] hover:bg-[var(--surface-muted)]"
      )}
      style={
        selected
          ? {
              background: "rgba(194,96,63,.10)",
              boxShadow: "0 4px 12px -6px rgba(194,96,63,.30)",
            }
          : undefined
      }
    >
      <span className="text-[22px]">{emoji}</span>
      {label}
    </button>
  );
}

export function CreateHouseholdForm() {
  const router = useRouter();
  const [householdName, setHouseholdName] = useState("");
  const [householdType, setHouseholdType] = useState<HouseholdType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data: { user } }) => setCurrentUser(user));
  }, []);

  const displayName = currentUser ? deriveDisplayName(currentUser) : "Vous";
  const initial = displayName[0].toUpperCase();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!householdName.trim() || !householdType) return;
    if (!currentUser) {
      setError("Vous devez être connecté pour créer un foyer.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createHouseholdWithMember({
        householdName: householdName.trim(),
        householdType: TYPE_MAP[householdType],
        displayName,
        initial,
        color: FIRST_MEMBER_COLOR,
      });
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      setLoading(false);
    }
  }

  return (
    <>
      {/* Logo */}
      <div
        className="w-[78px] h-[78px] rounded-[23px] bg-[var(--primary)] flex items-center justify-center text-[40px]"
        style={{ boxShadow: "0 16px 34px -12px rgba(194,96,63,.6)" }}
      >
        🏠
      </div>

      {/* Step indicator */}
      <div className="w-full mt-[22px]">
        <div className="flex justify-between items-center mb-[8px]">
          <span className="text-[12px] font-bold uppercase tracking-[.05em] text-[var(--text-muted)]">
            Étape 1 sur 2
          </span>
        </div>
        <div className="w-full h-[4px] rounded-full bg-[rgba(44,38,34,.08)]">
          <div className="h-full w-1/2 rounded-full bg-[var(--primary)]" />
        </div>
      </div>

      {/* Title */}
      <h1
        className="text-[28px] font-extrabold text-[var(--text-primary)] tracking-[-0.02em] mt-[18px] text-center"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Créer votre foyer
      </h1>
      <p className="text-[15px] text-[var(--text-soft)] mt-[6px] mb-[26px] text-center">
        Centralisez votre quotidien à plusieurs.
      </p>

      {/* Form */}
      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-[18px]">
        {/* Household name */}
        <Input
          id="household-name"
          label="Nom du foyer"
          type="text"
          placeholder="Notre appart'"
          value={householdName}
          onChange={(e) => setHouseholdName(e.target.value)}
        />

        {/* Household type */}
        <div className="flex flex-col gap-[6px]">
          <span className="text-[12px] font-bold uppercase tracking-[.05em] text-[var(--text-muted)]">
            Type de foyer
          </span>
          <div className="grid grid-cols-3 gap-[8px]">
            {HOUSEHOLD_TYPES.map(({ value, label, emoji }) => (
              <HouseholdTypeButton
                key={value}
                emoji={emoji}
                label={label}
                selected={householdType === value}
                onClick={() => setHouseholdType(value)}
              />
            ))}
          </div>
        </div>

        {/* Members */}
        <div className="flex flex-col gap-[6px]">
          <span className="text-[12px] font-bold uppercase tracking-[.05em] text-[var(--text-muted)]">
            Membres
          </span>
          <div className="flex flex-col gap-[10px] rounded-[16px] border-[1.5px] border-[var(--border-input)] bg-[var(--surface)] p-[14px]">
            {/* Current user */}
            <div className="flex items-center gap-[10px]">
              <Avatar initials={initial} size="md" />
              <div className="flex-1">
                <span className="text-[14px] font-semibold text-[var(--text-primary)]">
                  {displayName}
                </span>
                <span className="ml-[6px] text-[12px] text-[var(--text-muted)]">
                  · vous
                </span>
              </div>
              <span className="text-[12px] font-bold uppercase tracking-[.04em] px-[10px] py-[4px] rounded-full bg-[var(--surface-muted)] text-[var(--text-muted)]">
                Admin
              </span>
            </div>

            <div className="h-px bg-[rgba(44,38,34,.06)]" />

            {/* Invite member */}
            <button
              type="button"
              className="flex items-center gap-[10px] cursor-pointer group w-full text-left"
            >
              <div className="h-9 w-9 rounded-full border-[1.5px] border-dashed border-[var(--border-input)] flex items-center justify-center text-[var(--text-muted)] leading-none group-hover:border-[var(--primary)] group-hover:text-[var(--primary)] transition-colors shrink-0">
                +
              </div>
              <span className="text-[14px] font-semibold text-[var(--text-secondary)] group-hover:text-[var(--primary)] transition-colors">
                Inviter un membre
              </span>
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="text-[13px] text-red-500 text-center">{error}</p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !householdName.trim() || !householdType}
          className="w-full mt-[3px] rounded-[14px] bg-[var(--primary)] text-white py-4 text-[16px] font-bold cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ boxShadow: "0 10px 22px -8px rgba(194,96,63,.7)" }}
        >
          {loading ? "Création en cours…" : "Créer le foyer"}
        </button>
      </form>

      {/* Skip */}
      <Link
        href="/"
        className="mt-[18px] text-[14px] text-[var(--text-soft)] hover:text-[var(--text-secondary)] transition-colors"
      >
        Passer pour le moment
      </Link>
    </>
  );
}
