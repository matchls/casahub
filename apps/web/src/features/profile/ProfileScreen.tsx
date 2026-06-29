"use client";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { HouseholdMemberCard } from "./HouseholdMemberCard";
import { householdProfile, mockAccountEmail } from "./profileData";

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className="relative inline-flex h-[26px] w-[46px] shrink-0 cursor-pointer rounded-full transition-colors"
      style={{ backgroundColor: checked ? "var(--primary)" : "var(--surface-muted)" }}
    >
      <span
        className="absolute top-[3px] left-[3px] h-[20px] w-[20px] rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.15)] transition-transform"
        style={{ transform: checked ? "translateX(20px)" : "translateX(0)" }}
      />
    </button>
  );
}

function RowItem({
  icon,
  label,
  children,
}: {
  icon: string;
  label: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 py-[13px] border-b border-[var(--border)] last:border-b-0">
      <span className="text-[18px] w-6 text-center shrink-0 leading-none">{icon}</span>
      <span className="flex-1 text-[15px] text-[var(--text-primary)] font-medium">
        {label}
      </span>
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-[0.06em] px-1 mb-2">
      {children}
    </p>
  );
}

export function ProfileScreen() {
  const [notifs, setNotifs]    = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [dailyMsg, setDailyMsg] = useState(true);

  const { name, type, createdAtLabel, members } = householdProfile;

  return (
    <div className="max-w-[720px] flex flex-col gap-5">

      {/* ── Foyer card ──────────────────────────────────────── */}
      <Card
        className="flex items-center gap-4 !p-4"
        style={{ backgroundColor: "var(--shopping-bg)", boxShadow: "none" }}
      >
        <div className="w-[52px] h-[52px] rounded-[14px] bg-[var(--primary)] flex items-center justify-center text-[26px] shrink-0 shadow-[var(--shadow-accent)]">
          🏡
        </div>
        <div className="min-w-0">
          <h2
            className="font-extrabold text-[18px] text-[var(--text-primary)] tracking-[-0.02em] leading-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {name}
          </h2>
          <p className="text-[13px] text-[var(--shopping-text)] font-semibold mt-[3px]">
            {type} · {members.length} membres · {createdAtLabel}
          </p>
        </div>
      </Card>

      {/* ── Membres ─────────────────────────────────────────── */}
      <div>
        <SectionLabel>Membres</SectionLabel>
        <Card className="!p-4">
          {members.map((m, i) => (
            <HouseholdMemberCard key={m.id} member={m} isCurrentUser={i === 0} />
          ))}

          {/* Invite row */}
          <div className="flex items-center gap-3 pt-[13px] cursor-pointer group">
            <div className="w-10 h-10 rounded-full border-[1.5px] border-dashed border-[var(--border-input)] flex items-center justify-center shrink-0 group-hover:border-[var(--primary)] transition-colors">
              <span className="text-[18px] text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors leading-none">
                +
              </span>
            </div>
            <span className="flex-1 text-[15px] text-[var(--text-secondary)] font-medium group-hover:text-[var(--primary)] transition-colors">
              Inviter un membre
            </span>
            <span className="text-[var(--text-muted)] text-[16px] leading-none">›</span>
          </div>
        </Card>
      </div>

      {/* ── Préférences ─────────────────────────────────────── */}
      <div>
        <SectionLabel>Préférences</SectionLabel>
        <Card className="!p-4">
          <RowItem icon="🔔" label="Notifications du foyer">
            <Toggle checked={notifs} onChange={() => setNotifs((v) => !v)} />
          </RowItem>
          <RowItem icon="🌙" label="Thème sombre">
            <Toggle checked={darkMode} onChange={() => setDarkMode((v) => !v)} />
          </RowItem>
          <RowItem icon="💬" label="Message du jour">
            <Toggle checked={dailyMsg} onChange={() => setDailyMsg((v) => !v)} />
          </RowItem>
        </Card>
      </div>

      {/* ── Compte ──────────────────────────────────────────── */}
      <div>
        <SectionLabel>Compte</SectionLabel>
        <Card className="!p-4">
          <RowItem icon="✉️" label={mockAccountEmail}>
            <span className="text-[12px] font-bold px-[10px] py-[4px] rounded-full bg-[var(--tasks-bg)] text-[var(--tasks-text)] shrink-0">
              Connecté
            </span>
          </RowItem>

          <div className="pt-4">
            <button className="w-full flex items-center justify-center gap-2 py-[13px] px-4 rounded-[14px] border-[1.5px] border-[rgba(194,96,63,0.3)] text-[var(--primary)] font-semibold text-[15px] hover:bg-[var(--shopping-bg)] transition-colors cursor-pointer">
              Se déconnecter
            </button>
          </div>
        </Card>
      </div>

    </div>
  );
}
