"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthBrandHeader } from "./AuthBrandHeader";
import { AuthSeparator } from "./AuthSeparator";
import { GoogleAuthButton } from "./GoogleAuthButton";
import { inputClass, primaryButtonClass, primaryButtonStyle } from "./authStyles";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push("/");
  }

  return (
    <>
      <AuthBrandHeader
        title="CasaHub"
        subtitle="Le hub partagé de votre foyer."
        titleClassName="text-[34px]"
      />

      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-[11px]">
        <input
          type="email"
          placeholder="lea@exemple.fr"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
          disabled={loading}
        />
        <input
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
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
          {loading ? "Connexion…" : "Se connecter"}
        </button>
      </form>

      <AuthSeparator />
      <GoogleAuthButton />

      <p className="mt-[24px] text-[14px] text-[var(--text-soft)] text-center">
        Pas encore de foyer ?{" "}
        <Link
          href="/signup"
          className="font-bold text-[var(--primary)] hover:opacity-80 transition-opacity"
        >
          Créer un compte
        </Link>
      </p>
    </>
  );
}
