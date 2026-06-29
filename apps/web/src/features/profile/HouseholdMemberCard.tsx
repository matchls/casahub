import type { HouseholdMember } from "./profileData";

interface HouseholdMemberCardProps {
  member: HouseholdMember;
  isCurrentUser?: boolean;
}

export function HouseholdMemberCard({ member, isCurrentUser }: HouseholdMemberCardProps) {
  return (
    <div className="flex items-center gap-3 py-[13px] border-b border-[var(--border)] last:border-b-0">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-[15px] text-white shrink-0"
        style={{ backgroundColor: member.color }}
      >
        {member.initial}
      </div>

      <div className="flex-1 min-w-0 flex items-center gap-2">
        <span className="font-semibold text-[15px] text-[var(--text-primary)]">
          {member.name}
        </span>
        {isCurrentUser && (
          <span className="text-[13px] text-[var(--text-muted)]">· vous</span>
        )}
      </div>

      <span
        className={`text-[12px] font-bold px-[10px] py-[4px] rounded-full shrink-0 ${
          member.role === "admin"
            ? "bg-[var(--shopping-bg)] text-[var(--shopping-text)]"
            : "bg-[var(--surface-muted)] text-[var(--text-muted)]"
        }`}
      >
        {member.role === "admin" ? "Admin" : "Membre"}
      </span>
    </div>
  );
}
