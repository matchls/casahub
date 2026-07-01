"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthBrandHeader } from "./AuthBrandHeader";
import { AuthSeparator } from "./AuthSeparator";
import { GoogleAuthButton } from "./GoogleAuthButton";
import { AuthTextInput } from "./AuthTextInput";
import { primaryButtonClass, primaryButtonStyle } from "./authStyles";

export function SignupForm() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { first_name: firstName } },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push("/onboarding");
  }

  return (
    <>
      <AuthBrandHeader
        title="Créer un compte"
        subtitle="Rejoignez votre foyer CasaHub."
        titleClassName="text-[30px] text-center"
      />

      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-[14px]">
        <AuthTextInput
          id="signup-firstname"
          label="Prénom"
          placeholder="Léa"
          autoComplete="given-name"
          value={firstName}
          onChange={setFirstName}
          disabled={loading}
        />
        <AuthTextInput
          id="signup-email"
          label="E-mail"
          type="email"
          placeholder="lea@exemple.fr"
          autoComplete="email"
          value={email}
          onChange={setEmail}
          disabled={loading}
        />
        <AuthTextInput
          id="signup-password"
          label="Mot de passe"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          value={password}
          onChange={setPassword}
          disabled={loading}
        />
        <AuthTextInput
          id="signup-confirm"
          label="Confirmer le mot de passe"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          value={confirm}
          onChange={setConfirm}
          disabled={loading}
        />
        {error && (
          <p className="text-[13px] text-red-500 text-center">{error}</p>
        )}
        <button
          type="submit"
          className={primaryButtonClass}
          style={primaryButtonStyle}
          disabled={loading}
        >
          {loading ? "Création…" : "Créer mon compte"}
        </button>
      </form>

      <AuthSeparator />
      <GoogleAuthButton />

      <p className="mt-[24px] text-[14px] text-[var(--text-soft)] text-center">
        Déjà un compte ?{" "}
        <Link
          href="/login"
          className="font-bold text-[var(--primary)] hover:opacity-80 transition-opacity"
        >
          Se connecter
        </Link>
      </p>
    </>
  );
}
