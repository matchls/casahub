"use client";
import Link from "next/link";
import { useState } from "react";
import { AuthBrandHeader } from "./AuthBrandHeader";
import { AuthSeparator } from "./AuthSeparator";
import { GoogleAuthButton } from "./GoogleAuthButton";
import { inputClass, primaryButtonClass, primaryButtonStyle } from "./authStyles";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: brancher Supabase auth
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
        />
        <input
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />
        <button type="submit" className={primaryButtonClass} style={primaryButtonStyle}>
          Se connecter
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
