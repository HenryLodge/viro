import Link from "next/link";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { ViroLogo } from "@/components/ViroLogo";

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-white/[0.06] bg-[hsl(218,50%,10%)]/90 backdrop-blur-md sticky top-0 z-10">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <Link href="/patient/intake">
            <ViroLogo className="text-xl" variant="light" />
          </Link>
          <nav className="flex items-center gap-1">
            <Link
              href="/patient/intake"
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-white/50 hover:text-white/80 hover:bg-white/[0.04] transition-all"
            >
              Intake
            </Link>
            <Link
              href="/patient/results"
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-white/50 hover:text-white/80 hover:bg-white/[0.04] transition-all"
            >
              Results
            </Link>
            <Link
              href="/patient/status"
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-white/50 hover:text-white/80 hover:bg-white/[0.04] transition-all"
            >
              Status
            </Link>
            <div className="ml-2 pl-2 border-l border-white/10">
              <SignOutButton />
            </div>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
