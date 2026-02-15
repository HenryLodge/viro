import { PatientFeed } from "@/components/provider/PatientFeed";

export default function ProviderPatientsPage() {
  return (
    <div className="container max-w-5xl py-8 px-4 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white/90">Incoming Patients</h1>
        <p className="mt-1 text-sm text-white/40">
          Real-time feed of triaged patients. Click any patient to see full
          details.
        </p>
      </div>
      <PatientFeed />
    </div>
  );
}
