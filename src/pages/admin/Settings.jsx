import Card from "../../components/Card.jsx";

export default function Settings() {
  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-2xl font-semibold">Settings</h2>
        <p className="text-sm text-zinc-500">Placeholder settings page.</p>
      </div>

      <Card title="System Settings" subtitle="Later: roles, permissions, hospital config">
        <div className="grid gap-3 text-sm text-zinc-600">
          <div className="rounded-2xl border bg-zinc-50 p-4">
            <div className="font-medium text-zinc-800">Authentication</div>
            <div className="mt-1">Add JWT login + role-based access later.</div>
          </div>
          <div className="rounded-2xl border bg-zinc-50 p-4">
            <div className="font-medium text-zinc-800">Notifications</div>
            <div className="mt-1">Add email/SMS/WhatsApp alerts later.</div>
          </div>
          <div className="rounded-2xl border bg-zinc-50 p-4">
            <div className="font-medium text-zinc-800">Integrations</div>
            <div className="mt-1">Connect to hospital DB / APIs later.</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
