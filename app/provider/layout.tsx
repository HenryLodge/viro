import Link from "next/link";
import { SignOutButton } from "@/components/auth/SignOutButton";

export default function ProviderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container flex h-14 items-center justify-between px-4 sm:px-6">
          <Link href="/provider/dashboard" className="font-semibold text-foreground">
            VIRO
          </Link>
          <SignOutButton />
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
