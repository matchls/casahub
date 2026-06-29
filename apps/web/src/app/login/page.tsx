import { AuthLayout } from "@/features/auth/AuthLayout";
import { LoginForm } from "@/features/auth/LoginForm";

export const metadata = {
  title: "Connexion — CasaHub",
};

export default function LoginPage() {
  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  );
}
