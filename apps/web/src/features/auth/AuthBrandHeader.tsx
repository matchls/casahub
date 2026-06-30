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
      <div
        className="w-[78px] h-[78px] rounded-[23px] bg-[var(--primary)] flex items-center justify-center text-[40px]"
        style={{ boxShadow: "0 16px 34px -12px rgba(194,96,63,.6)" }}
      >
        🏠
      </div>
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
