import { AuthLayout } from "@/features/auth/AuthLayout";
import { SignupForm } from "@/features/auth/SignupForm";

export const metadata = {
  title: "Créer un compte — CasaHub",
};

export default function SignupPage() {
  return (
    <AuthLayout>
      <SignupForm />
    </AuthLayout>
  );
}
