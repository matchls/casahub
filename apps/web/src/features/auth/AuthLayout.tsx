interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 py-10"
      style={{
        background: "radial-gradient(circle at 50% 18%, #FBF5EB, #EFE5D4)",
      }}
    >
      <div className="w-full max-w-[380px] flex flex-col items-center">
        {children}
      </div>
    </div>
  );
}
