import Link from "next/link";

export const metadata = {
  title: "Page introuvable — Kasaly",
};

export default function NotFound() {
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
          🔍
        </div>
        <h1
          className="text-[24px] font-extrabold text-[var(--text-primary)] tracking-[-0.02em]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Page introuvable
        </h1>
        <p className="text-[15px] text-[var(--text-soft)]">
          Cette page n&apos;existe pas ou plus.
        </p>
        <Link
          href="/"
          className="mt-2 w-full text-center py-4 rounded-[14px] bg-[var(--primary)] text-white font-bold text-[15px] hover:opacity-90 transition-opacity"
          style={{ boxShadow: "0 10px 22px -8px rgba(194,96,63,.7)" }}
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
