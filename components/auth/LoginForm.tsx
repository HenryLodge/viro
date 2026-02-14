"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Tab = "signin" | "signup";
type ProfileRole = "patient" | "provider";

const ROLE_HOMES: Record<ProfileRole, string> = {
  patient: "/patient/intake",
  provider: "/provider/dashboard",
};

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "signup" ? "signup" : "signin";

  const [tab, setTab] = useState<Tab>(initialTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<ProfileRole>("patient");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }
    const res = await fetch("/api/auth/profile");
    if (!res.ok) {
      setError("Could not load profile. Please try again.");
      setLoading(false);
      return;
    }
    const profile = await res.json();
    const home = ROLE_HOMES[profile.role as ProfileRole] ?? "/";
    router.push(home);
    router.refresh();
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }
    const res = await fetch("/api/auth/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, full_name: fullName || undefined }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not create profile.");
      setLoading(false);
      return;
    }
    const home = ROLE_HOMES[role];
    router.push(home);
    router.refresh();
  }

  const onSubmit = tab === "signin" ? handleSignIn : handleSignUp;

  return (
    <div className="w-full space-y-6">
      {/* Tab toggle */}
      <div className="flex rounded-xl bg-white/[0.06] p-1 ring-1 ring-white/[0.08]">
        <button
          type="button"
          onClick={() => { setTab("signin"); setError(null); }}
          className={cn(
            "flex-1 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all",
            tab === "signin"
              ? "bg-[hsl(195,65%,48%)] text-white shadow-sm"
              : "text-white/50 hover:text-white/80"
          )}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => { setTab("signup"); setError(null); }}
          className={cn(
            "flex-1 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all",
            tab === "signup"
              ? "bg-[hsl(195,65%,48%)] text-white shadow-sm"
              : "text-white/50 hover:text-white/80"
          )}
        >
          Sign up
        </button>
      </div>

      {/* Form */}
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label
            htmlFor="email"
            className="text-xs font-semibold uppercase tracking-wider text-white/50"
          >
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            disabled={loading}
            className="h-11 rounded-lg border-white/10 bg-white/[0.06] text-white placeholder:text-white/30 focus-visible:ring-[hsl(195,65%,48%)] focus-visible:border-[hsl(195,65%,48%)]"
          />
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="password"
            className="text-xs font-semibold uppercase tracking-wider text-white/50"
          >
            Password
          </Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete={tab === "signin" ? "current-password" : "new-password"}
            disabled={loading}
            minLength={6}
            className="h-11 rounded-lg border-white/10 bg-white/[0.06] text-white placeholder:text-white/30 focus-visible:ring-[hsl(195,65%,48%)] focus-visible:border-[hsl(195,65%,48%)]"
          />
        </div>

        {tab === "signup" && (
          <>
            <div className="space-y-1.5">
              <Label
                htmlFor="fullName"
                className="text-xs font-semibold uppercase tracking-wider text-white/50"
              >
                Full name
              </Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Jane Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
                disabled={loading}
                className="h-11 rounded-lg border-white/10 bg-white/[0.06] text-white placeholder:text-white/30 focus-visible:ring-[hsl(195,65%,48%)] focus-visible:border-[hsl(195,65%,48%)]"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-white/50">
                I am a
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("patient")}
                  className={cn(
                    "rounded-lg border-2 px-3 py-2.5 text-sm font-semibold transition-all",
                    role === "patient"
                      ? "border-[hsl(195,65%,48%)] bg-[hsl(195,65%,48%)]/15 text-[hsl(195,65%,60%)]"
                      : "border-white/10 bg-white/[0.04] text-white/50 hover:border-white/20"
                  )}
                >
                  Patient
                </button>
                <button
                  type="button"
                  onClick={() => setRole("provider")}
                  className={cn(
                    "rounded-lg border-2 px-3 py-2.5 text-sm font-semibold transition-all",
                    role === "provider"
                      ? "border-[hsl(195,65%,48%)] bg-[hsl(195,65%,48%)]/15 text-[hsl(195,65%,60%)]"
                      : "border-white/10 bg-white/[0.04] text-white/50 hover:border-white/20"
                  )}
                >
                  Provider
                </button>
              </div>
            </div>
          </>
        )}

        {error && (
          <p className="text-sm text-red-400 font-medium" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 rounded-lg bg-[hsl(195,65%,48%)] text-sm font-semibold text-white shadow-lg shadow-[hsl(195,65%,48%)]/25 hover:bg-[hsl(195,65%,42%)] disabled:opacity-50 transition-all"
        >
          {loading
            ? "Please wait\u2026"
            : tab === "signin"
              ? "Sign in"
              : "Create account"}
        </button>
      </form>
    </div>
  );
}
