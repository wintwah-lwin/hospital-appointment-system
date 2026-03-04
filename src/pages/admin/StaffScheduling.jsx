import Card from "../../components/Card.jsx";

export default function StaffScheduling() {
  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-2xl font-semibold">Staff Scheduling</h2>
        <p className="text-sm text-zinc-500">
          UI placeholder. Later: scheduling algorithm + constraints.
        </p>
      </div>

      <Card title="Scheduler (Placeholder)" subtitle="Later: drag-drop + conflict detection">
        <div className="rounded-2xl border bg-zinc-50 p-6 text-sm text-zinc-600">
          Planned features:
          <ul className="list-disc ml-5 mt-2">
            <li>Shift templates (morning/evening/night)</li>
            <li>Coverage constraints per department</li>
            <li>Conflict detection (overlaps, max hours)</li>
            <li>Auto-suggest schedule (algorithm later)</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}
