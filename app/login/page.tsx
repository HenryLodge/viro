import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "@/components/auth/LoginForm";
import { CompleteProfileForm } from "@/components/auth/CompleteProfileForm";
import { ViroLogo } from "@/components/ViroLogo";
import Link from "next/link";

const ROLE_HOMES: Record<string, string> = {
  patient: "/patient/intake",
  provider: "/provider/dashboard",
};

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  /* Not logged in → show login / sign-up */
  if (!user) {
    return (
      <Shell>
        <Link href="/" className="transition-opacity hover:opacity-80">
          <ViroLogo className="text-5xl sm:text-6xl" variant="light" />
        </Link>
        <p className="mt-3 text-[hsl(195,65%,55%)] text-xs font-semibold tracking-[0.15em] uppercase">
          Sign in to continue
        </p>
        <div className="mt-8 w-full max-w-sm">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
        <Link
          href="/"
          className="mt-8 text-xs text-white/30 hover:text-white/60 transition-colors"
        >
          &larr; Back to home
        </Link>
      </Shell>
    );
  }

  /* Has profile + role → redirect to role home */
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role && ROLE_HOMES[profile.role]) {
    redirect(ROLE_HOMES[profile.role]);
  }

  /* Logged in but no role → complete profile */
  return (
    <Shell>
      <ViroLogo className="text-5xl sm:text-6xl" variant="light" />
      <p className="mt-3 text-xs text-white/50 font-semibold tracking-[0.15em] uppercase">
        One more step &mdash; choose your role
      </p>
      <div className="mt-8 w-full max-w-sm">
        <CompleteProfileForm />
      </div>
    </Shell>
  );
}

/* Shared dark centered shell — matches landing page theme */
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-[hsl(218,50%,12%)] via-[hsl(218,48%,14%)] to-[hsl(218,45%,18%)]">
      {/* Dot grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle, hsl(195,65%,70%) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      {/* Glow */}
      <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-[hsl(195,65%,48%)] opacity-[0.04] blur-[140px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-[hsl(218,60%,30%)] opacity-[0.06] blur-[100px]" />

      <main className="relative z-10 flex flex-col items-center px-6 py-16 text-center w-full animate-fade-in-up">
        {children}
      </main>
    </div>
  );
}
