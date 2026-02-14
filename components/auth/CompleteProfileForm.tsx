"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type ProfileRole = "patient" | "provider";

const ROLE_HOMES: Record<ProfileRole, string> = {
  patient: "/patient/intake",
  provider: "/provider/dashboard",
};

export function CompleteProfileForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<ProfileRole>("patient");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/auth/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, full_name: fullName || undefined }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not save profile.");
      setLoading(false);
      return;
    }
    router.push(ROLE_HOMES[role]);
    router.refresh();
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <p className="text-center text-sm text-white/50">
        Choose your role to finish setting up your account.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
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
          {loading ? "Please wait\u2026" : "Continue"}
        </button>
      </form>
    </div>
  );
}
