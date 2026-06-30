import type { HouseholdProfile } from "@/lib/domain/types";

export const householdProfile: HouseholdProfile = {
  name: "Chez Léa & Tom",
  type: "Couple",
  createdAtLabel: "Depuis mars 2024",
  members: [
    { id: "lea", name: "Léa", role: "admin",  initial: "L", color: "#C2603F" },
    { id: "tom", name: "Tom", role: "member", initial: "T", color: "#6E8BA6" },
  ],
};

export const mockAccountEmail = "lea@casahub.app";
