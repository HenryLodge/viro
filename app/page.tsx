import Link from "next/link";
import { ViroLogo } from "@/components/ViroLogo";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[hsl(218,50%,12%)] via-[hsl(218,48%,14%)] to-[hsl(218,45%,18%)]">
      {/* ── Background layers ── */}

      {/* Subtle dot grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle, hsl(195,65%,70%) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Large glowing blobs */}
      <div className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[700px] w-[700px] rounded-full bg-[hsl(195,65%,48%)] opacity-[0.05] blur-[160px] animate-subtle-pulse" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full bg-[hsl(218,60%,30%)] opacity-[0.08] blur-[120px]" />

      {/* Radar / sonar rings — centered behind the logo */}
      <div className="pointer-events-none absolute top-[28%] left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="animate-radar-1 h-[400px] w-[400px] rounded-full border border-[hsl(195,65%,48%)]/20" />
      </div>
      <div className="pointer-events-none absolute top-[28%] left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="animate-radar-2 h-[400px] w-[400px] rounded-full border border-[hsl(195,65%,48%)]/15" />
      </div>
      <div className="pointer-events-none absolute top-[28%] left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="animate-radar-3 h-[400px] w-[400px] rounded-full border border-[hsl(195,65%,48%)]/10" />
      </div>

      {/* Floating micro-particles */}
      <div className="pointer-events-none absolute bottom-0 left-[10%] h-2 w-2 rounded-full bg-[hsl(195,65%,55%)] animate-float-1" />
      <div className="pointer-events-none absolute bottom-0 left-[25%] h-1.5 w-1.5 rounded-full bg-[hsl(195,80%,65%)] animate-float-2" />
      <div className="pointer-events-none absolute bottom-0 left-[55%] h-2.5 w-2.5 rounded-full bg-[hsl(195,65%,50%)] animate-float-3" />
      <div className="pointer-events-none absolute bottom-0 left-[75%] h-1.5 w-1.5 rounded-full bg-[hsl(195,70%,60%)] animate-float-4" />
      <div className="pointer-events-none absolute bottom-0 left-[40%] h-2 w-2 rounded-full bg-[hsl(195,65%,55%)] animate-float-5" />
      <div className="pointer-events-none absolute bottom-0 left-[88%] h-1 w-1 rounded-full bg-[hsl(195,80%,70%)] animate-float-6" />

      {/* ── Content ── */}
      <div className="relative z-10 flex flex-col items-center min-h-screen">
        {/* Hero area */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-12 text-center max-w-2xl mx-auto">
          {/* Logo */}
          <div className="animate-fade-in-up">
            <ViroLogo className="text-7xl sm:text-8xl" variant="light" />
          </div>

          {/* Tagline */}
          <p className="animate-fade-in-up-d1 mt-5 text-[hsl(195,65%,55%)] text-xs sm:text-sm font-semibold tracking-[0.2em] uppercase">
            Viral Intelligence &amp; Response Orchestrator
          </p>

          {/* Description */}
          <p className="animate-fade-in-up-d2 mt-6 text-[hsl(210,20%,65%)] text-base sm:text-lg leading-relaxed max-w-md">
            Triage patients in seconds. Route to the right hospital.
            Detect outbreaks before they cascade.
          </p>

          {/* CTA */}
          <div className="animate-fade-in-up-d3 mt-10 flex flex-col sm:flex-row gap-3">
            <Link
              href="/login?tab=signup"
              className="group inline-flex items-center justify-center rounded-xl bg-[hsl(195,65%,48%)] px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[hsl(195,65%,48%)]/25 hover:shadow-[hsl(195,65%,48%)]/40 hover:bg-[hsl(195,65%,44%)] transition-all duration-300"
            >
              Get started
              <svg
                className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                />
              </svg>
            </Link>
            <Link
              href="/login?tab=signin"
              className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-8 py-3.5 text-sm font-semibold text-white/80 hover:bg-white/10 hover:text-white transition-all duration-300"
            >
              Sign in
            </Link>
          </div>
        </div>

        {/* ── Feature strip at the bottom ── */}
        <div className="animate-fade-in-up-d4 w-full border-t border-white/[0.06] bg-white/[0.02] backdrop-blur-sm">
          <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.06] px-6">
            {/* Feature 1 */}
            <div className="flex items-center gap-4 py-8 sm:py-10 sm:px-8">
              <div className="flex-shrink-0 flex h-11 w-11 items-center justify-center rounded-xl bg-[hsl(195,65%,48%)]/10 ring-1 ring-[hsl(195,65%,48%)]/20">
                <svg className="h-5 w-5 text-[hsl(195,65%,55%)]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714a2.25 2.25 0 0 0 .659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-2.47 2.47a2.25 2.25 0 0 1-1.591.659H9.061a2.25 2.25 0 0 1-1.591-.659L5 14.5m14 0V5.846a2.25 2.25 0 0 0-1.836-2.213M5 14.5V5.846a2.25 2.25 0 0 1 1.836-2.213" />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-white/90">AI Triage</p>
                <p className="text-xs text-white/40 mt-0.5">Urgency tier in seconds</p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-center gap-4 py-8 sm:py-10 sm:px-8">
              <div className="flex-shrink-0 flex h-11 w-11 items-center justify-center rounded-xl bg-[hsl(195,65%,48%)]/10 ring-1 ring-[hsl(195,65%,48%)]/20">
                <svg className="h-5 w-5 text-[hsl(195,65%,55%)]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-white/90">Smart Routing</p>
                <p className="text-xs text-white/40 mt-0.5">Capacity, specialty &amp; distance</p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-center gap-4 py-8 sm:py-10 sm:px-8">
              <div className="flex-shrink-0 flex h-11 w-11 items-center justify-center rounded-xl bg-[hsl(195,65%,48%)]/10 ring-1 ring-[hsl(195,65%,48%)]/20">
                <svg className="h-5 w-5 text-[hsl(195,65%,55%)]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5a17.92 17.92 0 0 1-8.716-2.247m0 0A8.966 8.966 0 0 1 3 12c0-1.264.26-2.467.73-3.56" />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-white/90">Global Intelligence</p>
                <p className="text-xs text-white/40 mt-0.5">Live outbreak monitoring</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
