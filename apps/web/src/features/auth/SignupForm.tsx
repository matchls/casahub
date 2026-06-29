"use client";
import Link from "next/link";
import { useState } from "react";

const inputClass =
  "w-full rounded-[14px] border-[1.5px] border-[rgba(44,38,34,.10)] bg-[var(--surface)] px-4 py-[15px] text-[15px] text-[var(--text-primary)] placeholder:text-[var(--placeholder)] focus:outline-none focus:border-[var(--primary)] transition-colors";

const labelClass =
  "text-[12px] font-bold uppercase tracking-[.05em] text-[var(--text-muted)]";

export function SignupForm() {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: brancher Supabase auth
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

      {/* Title */}
      <h1
        className="text-[30px] font-extrabold text-[var(--text-primary)] tracking-[-0.02em] mt-[18px] text-center"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Créer un compte
      </h1>
      <p className="text-[15px] text-[var(--text-soft)] mt-[6px] mb-[26px] text-center">
        Rejoignez votre foyer CasaHub.
      </p>

      {/* Form */}
      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-[14px]">
        {/* Prénom */}
        <div className="flex flex-col gap-[6px]">
          <label className={labelClass} htmlFor="signup-firstname">
            Prénom
          </label>
          <input
            id="signup-firstname"
            type="text"
            placeholder="Léa"
            autoComplete="given-name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className={inputClass}
          />
        </div>

        {/* E-mail */}
        <div className="flex flex-col gap-[6px]">
          <label className={labelClass} htmlFor="signup-email">
            E-mail
          </label>
          <input
            id="signup-email"
            type="email"
            placeholder="lea@exemple.fr"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </div>

        {/* Mot de passe */}
        <div className="flex flex-col gap-[6px]">
          <label className={labelClass} htmlFor="signup-password">
            Mot de passe
          </label>
          <input
            id="signup-password"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
        </div>

        {/* Confirmation */}
        <div className="flex flex-col gap-[6px]">
          <label className={labelClass} htmlFor="signup-confirm">
            Confirmer le mot de passe
          </label>
          <input
            id="signup-confirm"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={inputClass}
          />
        </div>

        {/* Primary button */}
        <button
          type="submit"
          className="w-full mt-[3px] rounded-[14px] bg-[var(--primary)] text-white py-4 text-[16px] font-bold cursor-pointer hover:opacity-90 transition-opacity"
          style={{ boxShadow: "0 10px 22px -8px rgba(194,96,63,.7)" }}
        >
          Créer mon compte
        </button>
      </form>

      {/* Separator */}
      <div className="flex items-center gap-3 w-full my-[14px]">
        <div className="flex-1 h-px bg-[rgba(44,38,34,.10)]" />
        <span className="text-[12px] text-[#A89E92]">ou</span>
        <div className="flex-1 h-px bg-[rgba(44,38,34,.10)]" />
      </div>

      {/* Google button */}
      <button
        type="button"
        className="w-full rounded-[14px] bg-[var(--surface)] border-[1.5px] border-[rgba(44,38,34,.10)] py-[14px] text-[15px] font-semibold text-[var(--text-primary)] cursor-pointer hover:bg-[var(--surface-muted)] transition-colors"
      >
        Continuer avec Google
      </button>

      {/* Link to login */}
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
