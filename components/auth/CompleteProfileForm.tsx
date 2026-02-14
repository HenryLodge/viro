"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
      <p className="text-center text-sm text-muted-foreground">
        Choose your role to finish setting up your account.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full name</Label>
          <Input
            id="fullName"
            type="text"
            placeholder="Jane Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoComplete="name"
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <Label>I am a</Label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setRole("patient")}
              className={cn(
                "rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                role === "patient"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background hover:bg-accent"
              )}
            >
              Patient
            </button>
            <button
              type="button"
              onClick={() => setRole("provider")}
              className={cn(
                "rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                role === "provider"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background hover:bg-accent"
              )}
            >
              Provider
            </button>
          </div>
        </div>
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Please wait…" : "Continue"}
        </Button>
      </form>
    </div>
  );
}
