import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AuthLayout } from "@/features/auth/AuthLayout";
import { primaryButtonClass, primaryButtonStyle } from "@/features/auth/authStyles";
import { AcceptInvitationCard } from "@/features/invitations/AcceptInvitationCard";

export const metadata = {
  title: "Rejoindre un foyer — CasaHub",
};

export const dynamic = "force-dynamic";

function InviteMessage({ emoji, title, body }: { emoji: string; title: string; body: string }) {
  return (
    <div className="w-full flex flex-col items-center text-center gap-3">
      <span className="text-[48px] opacity-70">{emoji}</span>
      <h1
        className="text-[22px] font-extrabold text-[var(--text-primary)] tracking-[-0.02em]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {title}
      </h1>
      <p className="text-[15px] text-[var(--text-soft)]">{body}</p>
      <Link
        href="/"
        className="mt-2 text-[14px] font-bold text-[var(--primary)] hover:opacity-80 transition-opacity"
      >
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const next = `/invite/${token}`;
    return (
      <AuthLayout>
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
            Rejoindre un foyer
          </h1>
          <p className="text-[15px] text-[var(--text-soft)]">
            Connecte-toi ou crée un compte pour accepter cette invitation.
          </p>
          <div className="w-full flex flex-col gap-[10px] mt-2">
            <Link
              href={`/login?next=${encodeURIComponent(next)}`}
              className={`${primaryButtonClass} block text-center`}
              style={primaryButtonStyle}
            >
              Se connecter
            </Link>
            <Link
              href={`/signup?next=${encodeURIComponent(next)}`}
              className="w-full text-center py-4 rounded-[14px] border-[1.5px] border-[var(--border-input)] text-[var(--text-primary)] font-semibold text-[15px] hover:bg-[var(--surface-muted)] transition-colors"
            >
              Créer un compte
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  const { data, error } = await supabase
    .rpc("get_household_invitation", { invite_token: token })
    .maybeSingle();

  const invitation = data as {
    household_name: string;
    invited_email: string;
    status: "pending" | "expired" | "accepted";
  } | null;

  if (error || !invitation) {
    return (
      <AuthLayout>
        <InviteMessage
          emoji="🔗"
          title="Invitation introuvable"
          body="Ce lien d'invitation n'est pas valide."
        />
      </AuthLayout>
    );
  }

  if (invitation.status === "expired") {
    return (
      <AuthLayout>
        <InviteMessage
          emoji="⏳"
          title="Invitation expirée"
          body="Ce lien a expiré. Demande à l'administrateur du foyer de t'en envoyer un nouveau."
        />
      </AuthLayout>
    );
  }

  if (invitation.status === "accepted") {
    return (
      <AuthLayout>
        <InviteMessage
          emoji="✅"
          title="Invitation déjà utilisée"
          body="Cette invitation a déjà été acceptée."
        />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <AcceptInvitationCard token={token} householdName={invitation.household_name} />
    </AuthLayout>
  );
}
