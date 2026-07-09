"use client";
import { useEffect } from "react";
import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app] unhandled error:", error);
  }, [error]);

  return (
    <div
      className="min-h-dvh flex items-center justify-center px-6 py-10"
      style={{
        background: "radial-gradient(circle at 50% 18%, #FBF5EB, #EFE5D4)",
      }}
    >
      <div className="w-full max-w-[440px] flex flex-col items-center text-center gap-4">
        <div
          className="w-[64px] h-[64px] rounded-[18px] bg-[var(--primary)] flex items-center justify-center text-[30px]"
          style={{ boxShadow: "var(--shadow-accent)" }}
        >
          ⚠️
        </div>
        <h1
          className="text-[24px] font-extrabold text-[var(--text-primary)] tracking-[-0.02em]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Une erreur est survenue
        </h1>
        <p className="text-[15px] text-[var(--text-soft)]">
          Kasaly a rencontré un problème inattendu. Réessayez, ou revenez à
          l&apos;accueil si le problème persiste.
        </p>
        <div className="w-full flex flex-col gap-[10px] mt-2">
          <button
            onClick={reset}
            className="w-full py-4 rounded-[14px] bg-[var(--primary)] text-white font-bold text-[15px] hover:opacity-90 transition-opacity cursor-pointer"
            style={{ boxShadow: "0 10px 22px -8px rgba(194,96,63,.7)" }}
          >
            Réessayer
          </button>
          <Link
            href="/"
            className="w-full text-center py-4 rounded-[14px] border-[1.5px] border-[var(--border-input)] text-[var(--text-primary)] font-semibold text-[15px] hover:bg-[var(--surface-muted)] transition-colors"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
