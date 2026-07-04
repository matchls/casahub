"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { acceptHouseholdInvitation } from "@/lib/supabase/invitations";
import { primaryButtonClass, primaryButtonStyle } from "@/features/auth/authStyles";

interface AcceptInvitationCardProps {
  token: string;
  householdName: string;
}

export function AcceptInvitationCard({ token, householdName }: AcceptInvitationCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAccept() {
    setLoading(true);
    setError(null);
    try {
      await acceptHouseholdInvitation(token);
      router.refresh();
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      setLoading(false);
    }
  }

  return (
    <div className="w-full flex flex-col items-center text-center gap-4">
      <div
        className="w-[64px] h-[64px] rounded-[18px] bg-[var(--primary)] flex items-center justify-center text-[30px]"
        style={{ boxShadow: "var(--shadow-accent)" }}
      >
        🏡
      </div>
      <h1
        className="text-[24px] font-extrabold text-[var(--text-primary)] tracking-[-0.02em]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Rejoindre {householdName}
      </h1>
      <p className="text-[15px] text-[var(--text-soft)]">
        Tu as été invité·e à rejoindre ce foyer sur Domotidien.
      </p>
      {error && <p className="text-[13px] text-red-500 text-center">{error}</p>}
      <button
        onClick={handleAccept}
        disabled={loading}
        className={primaryButtonClass}
        style={primaryButtonStyle}
      >
        {loading ? "Un instant…" : "Rejoindre le foyer"}
      </button>
    </div>
  );
}
