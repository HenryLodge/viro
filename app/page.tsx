import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container flex h-14 items-center justify-between px-4 sm:px-6">
          <span className="font-semibold text-foreground">VIRO</span>
          <nav className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="container px-4 sm:px-6 pt-20 pb-16 sm:pt-28 sm:pb-24 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Viral Intelligence & Response Orchestrator
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground sm:text-xl">
            AI-powered triage, smart hospital routing, and real-time outbreak
            intelligence — so the right patients get to the right care, fast.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-base font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Get started
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-6 py-3 text-base font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              Sign in
            </Link>
          </div>
        </section>

        <section className="border-t border-border/40 bg-muted/30 py-16 sm:py-20">
          <div className="container px-4 sm:px-6">
            <h2 className="text-center text-2xl font-semibold text-foreground sm:text-3xl">
              One platform. Three layers of response.
            </h2>
            <div className="mt-12 grid gap-8 sm:grid-cols-3 sm:gap-10 max-w-4xl mx-auto">
              <div className="rounded-xl border border-border bg-card p-6 text-center shadow-sm">
                <span className="text-3xl font-bold text-primary">1</span>
                <h3 className="mt-3 font-semibold text-foreground">
                  Patient triage
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Submit symptoms and risk factors. AI returns an urgency tier
                  and clear next steps in seconds.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-6 text-center shadow-sm">
                <span className="text-3xl font-bold text-primary">2</span>
                <h3 className="mt-3 font-semibold text-foreground">
                  Smart routing
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Get matched to nearby facilities by capacity, specialty, and
                  wait time — not just distance.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-6 text-center shadow-sm">
                <span className="text-3xl font-bold text-primary">3</span>
                <h3 className="mt-3 font-semibold text-foreground">
                  Global intelligence
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Health teams see outbreak patterns, anomaly alerts, and
                  cascading threats on a live globe.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20">
          <div className="container px-4 sm:px-6 text-center">
            <p className="text-muted-foreground text-sm">
              Built for InnovAIte 2026 · AINU Hackathon
            </p>
            <div className="mt-8">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Enter VIRO
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/40 py-6">
        <div className="container px-4 sm:px-6 text-center text-sm text-muted-foreground">
          VIRO — Viral Intelligence & Response Orchestrator
        </div>
      </footer>
    </div>
  );
}
