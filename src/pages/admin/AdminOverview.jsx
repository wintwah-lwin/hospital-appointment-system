import Stat from "../../components/Stat.jsx";
import Card from "../../components/Card.jsx";
import { hospitalSnapshot } from "../../mock/data.js";

export default function AdminOverview() {
  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-2xl font-semibold">Admin Overview</h2>
        <p className="text-sm text-zinc-500">Operational snapshot (mock now).</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Beds Available" value={hospitalSnapshot.availableBeds} hint="Across wards" />
        <Stat label="ICU Available" value={hospitalSnapshot.icuAvailable} hint="Critical care" />
        <Stat label="ER Queue" value={hospitalSnapshot.erQueue} hint="Live tickets" />
        <Stat label="Avg Wait" value={`${hospitalSnapshot.avgWaitMins}m`} hint="ER estimate" />
      </div>

      <Card title="Real-time Dashboard (Placeholder)" subtitle="Later: websockets + live updates">
        <div className="rounded-2xl border bg-zinc-50 p-6 text-sm text-zinc-600">
          This box is reserved for charts (bed utilization trend, workload forecast, staffing coverage).
        </div>
      </Card>
    </div>
  );
}
