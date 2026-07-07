import { AuthLayout } from "@/features/auth/AuthLayout";
import { SignupForm } from "@/features/auth/SignupForm";

export const metadata = {
  title: "Créer un compte — Kasaly",
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <AuthLayout>
      <SignupForm next={next} />
    </AuthLayout>
  );
}
