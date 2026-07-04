"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { createHouseholdInvitation } from "@/lib/supabase/invitations";

type Status = "idle" | "form" | "loading" | "success";

const rowInputClass = cn(
  "flex-1 min-w-0 rounded-[12px] border-[1.5px] border-[var(--border-input)]",
  "bg-[var(--surface)] px-3 py-2 text-[14px] text-[var(--text-primary)]",
  "placeholder:text-[var(--placeholder)] focus:outline-none focus:border-[var(--primary)]",
  "transition-colors"
);

export function InviteMemberRow() {
  const [status, setStatus] = useState<Status>("idle");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);

  function reset() {
    setStatus("idle");
    setEmail("");
    setError(null);
    setInviteLink("");
    setCopied(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;

    setStatus("loading");
    setError(null);
    try {
      const invitation = await createHouseholdInvitation(trimmed);
      setInviteLink(`${window.location.origin}/invite/${invitation.token}`);
      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      setStatus("form");
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (status === "idle") {
    return (
      <button
        type="button"
        onClick={() => setStatus("form")}
        className="flex items-center gap-3 pt-[13px] w-full text-left cursor-pointer group"
      >
        <div className="w-10 h-10 rounded-full border-[1.5px] border-dashed border-[var(--border-input)] flex items-center justify-center shrink-0 group-hover:border-[var(--primary)] transition-colors">
          <span className="text-[18px] text-[var(--text-muted)] group-hover:text-[var(--primary)] leading-none transition-colors">
            +
          </span>
        </div>
        <span className="flex-1 text-[15px] text-[var(--text-secondary)] font-medium group-hover:text-[var(--primary)] transition-colors">
          Inviter un membre
        </span>
      </button>
    );
  }

  if (status === "success") {
    return (
      <div className="pt-[13px] flex flex-col gap-2">
        <p className="text-[13.5px] text-[var(--text-primary)] font-medium">
          Invitation créée. Copie ce lien et envoie-le à la personne.
        </p>
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={inviteLink}
            onFocus={(e) => e.target.select()}
            className={cn(rowInputClass, "bg-[var(--surface-muted)] text-[13px] text-[var(--text-secondary)]")}
          />
          <button
            type="button"
            onClick={handleCopy}
            className="shrink-0 rounded-[12px] bg-[var(--primary)] text-white font-semibold text-[13px] px-3 py-2 hover:opacity-90 transition-opacity cursor-pointer"
          >
            {copied ? "Copié !" : "Copier"}
          </button>
        </div>
        <button
          type="button"
          onClick={reset}
          className="self-start text-[13px] text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors cursor-pointer"
        >
          Inviter quelqu&apos;un d&apos;autre
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleCreate} className="pt-[13px] flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <input
          type="email"
          autoFocus
          required
          placeholder="email@exemple.fr"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === "loading"}
          className={rowInputClass}
        />
        <button
          type="submit"
          disabled={status === "loading" || !email.trim()}
          className="shrink-0 rounded-[12px] bg-[var(--primary)] text-white font-semibold text-[13px] px-3 py-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {status === "loading" ? "Création…" : "Créer l'invitation"}
        </button>
        <button
          type="button"
          onClick={reset}
          disabled={status === "loading"}
          className="shrink-0 text-[13px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors cursor-pointer"
        >
          Annuler
        </button>
      </div>
      {error && <p className="text-[13px] text-red-500">{error}</p>}
    </form>
  );
}
