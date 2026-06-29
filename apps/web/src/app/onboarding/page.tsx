import { OnboardingLayout } from "@/features/onboarding/OnboardingLayout";
import { CreateHouseholdForm } from "@/features/onboarding/CreateHouseholdForm";

export const metadata = {
  title: "Créer votre foyer — CasaHub",
};

export default function OnboardingPage() {
  return (
    <OnboardingLayout>
      <CreateHouseholdForm />
    </OnboardingLayout>
  );
}
