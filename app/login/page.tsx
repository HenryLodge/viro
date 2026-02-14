import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "@/components/auth/LoginForm";
import { CompleteProfileForm } from "@/components/auth/CompleteProfileForm";

const ROLE_HOMES: Record<string, string> = {
  patient: "/patient/intake",
  provider: "/provider/dashboard",
};

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-b from-background to-muted/30">
        <main className="flex flex-col items-center space-y-8 text-center">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              VIRO
            </h1>
            <p className="mt-2 text-muted-foreground">
              Viral Intelligence & Response Orchestrator
            </p>
          </div>
          <LoginForm />
        </main>
      </div>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role && ROLE_HOMES[profile.role]) {
    redirect(ROLE_HOMES[profile.role]);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-b from-background to-muted/30">
      <main className="flex flex-col items-center space-y-8 text-center">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            VIRO
          </h1>
          <p className="mt-2 text-muted-foreground">
            Complete your profile
          </p>
        </div>
        <CompleteProfileForm />
      </main>
    </div>
  );
}
