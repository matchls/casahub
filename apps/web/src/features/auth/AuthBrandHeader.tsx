import Image from "next/image";

interface AuthBrandHeaderProps {
  title: string;
  subtitle: string;
  /** Tailwind size + optional alignment classes for the h1, e.g. "text-[34px]" */
  titleClassName?: string;
}

export function AuthBrandHeader({
  title,
  subtitle,
  titleClassName = "text-[34px]",
}: AuthBrandHeaderProps) {
  return (
    <>
      <Image
        src="/logo.png"
        alt="Logo Kasaly"
        width={78}
        height={78}
        priority
        className="rounded-[23px] shrink-0"
        style={{ boxShadow: "0 16px 34px -12px rgba(194,96,63,.6)" }}
      />
      <h1
        className={`font-extrabold text-[var(--text-primary)] tracking-[-0.02em] mt-[18px] ${titleClassName}`}
        style={{ fontFamily: "var(--font-display)" }}
      >
        {title}
      </h1>
      <p className="text-[15px] text-[var(--text-soft)] mt-[6px] mb-[26px] text-center">
        {subtitle}
      </p>
    </>
  );
}
