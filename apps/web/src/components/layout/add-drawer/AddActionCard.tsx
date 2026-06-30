interface AddActionCardProps {
  emoji: string;
  label: string;
  desc: string;
  bg: string;
  color: string;
  onClick: () => void;
}

export function AddActionCard({
  emoji,
  label,
  desc,
  bg,
  color,
  onClick,
}: AddActionCardProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-[14px] w-full rounded-[14px] px-[14px] py-[14px] text-left cursor-pointer hover:opacity-90 active:scale-[.98] transition-all"
      style={{ background: bg }}
    >
      <div
        className="w-[44px] h-[44px] rounded-[12px] flex items-center justify-center text-[22px] shrink-0"
        style={{ background: "rgba(255,255,255,.55)" }}
      >
        {emoji}
      </div>

      <div className="flex-1 min-w-0">
        <div
          className="text-[15px] font-semibold leading-tight"
          style={{ color }}
        >
          {label}
        </div>
        <div
          className="text-[12.5px] mt-0.5 opacity-70"
          style={{ color }}
        >
          {desc}
        </div>
      </div>

      <span
        className="text-[20px] leading-none shrink-0 opacity-40"
        style={{ color }}
      >
        ›
      </span>
    </button>
  );
}
