import { Suspense } from "react";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginPageFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-app px-4">
      <div className="panel w-full max-w-md p-6">
        <p className="text-center text-sm text-muted">
          Loading sign-in page...
        </p>
      </div>
    </main>
  );
}