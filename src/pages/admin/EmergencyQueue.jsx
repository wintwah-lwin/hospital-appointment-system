import { useEffect, useMemo, useState } from "react";
import Card from "../../components/Card.jsx";
import Table from "../../components/Table.jsx";
import Badge from "../../components/Badge.jsx";
import Button from "../../components/Button.jsx";
import Input from "../../components/Input.jsx";
import Select from "../../components/Select.jsx";
import { apiDelete, apiGet, apiPost } from "../../api/client.js";

export default function EmergencyQueue() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [ticket, setTicket] = useState("");
  const [priority, setPriority] = useState("High");
  const [etaMins, setEtaMins] = useState("10");
  const [notes, setNotes] = useState("");

  const priorityTone = (p) => {
    if (p === "Critical") return "bad";
    if (p === "High") return "warn";
    if (p === "Medium") return "info";
    return "neutral";
  };

  const load = async () => {
    setError("");
    try {
      const data = await apiGet("/api/emergency");
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Failed to load");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const columns = useMemo(
    () => [
      { key: "ticket", label: "Ticket" },
      {
        key: "priority",
        label: "Priority",
        render: (r) => <Badge tone={priorityTone(r.priority)}>{r.priority}</Badge>,
      },
      { key: "etaMins", label: "ETA (mins)" },
      { key: "notes", label: "Notes" },
      {
        key: "actions",
        label: "Actions",
        render: (r) => (
          <div className="flex gap-2">
            <Button
              size="sm"
              tone="ghost"
              onClick={async () => {
                if (!confirm(`Remove ${r.ticket}?`)) return;
                try {
                  await apiDelete(`/api/emergency/${r._id}`);
                  await load();
                } catch (e) {
                  alert(e.message);
                }
              }}
            >
              Delete
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  const onAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiPost("/api/emergency", {
        ticket: ticket.trim() || undefined,
        priority,
        etaMins: Number(etaMins),
        notes,
      });
      setTicket("");
      setPriority("High");
      setEtaMins("10");
      setNotes("");
      await load();
    } catch (e2) {
      setError(e2.message || "Failed to add");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-zinc-100">Emergency Queue</h1>

      <Card>
        <div className="text-sm text-zinc-300 font-medium">Add ER Ticket</div>
        <form onSubmit={onAdd} className="mt-3 grid gap-3 md:grid-cols-4">
          <Input label="Ticket" value={ticket} onChange={(e) => setTicket(e.target.value)} placeholder="E-1040" />
          <Select
            label="Priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            options={["Critical", "High", "Medium", "Low"]}
          />
          <Input
            label="ETA (mins)"
            value={etaMins}
            onChange={(e) => setEtaMins(e.target.value)}
            inputMode="numeric"
            placeholder="10"
          />
          <Input label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Short note" />
          <div className="md:col-span-4 flex items-center justify-end gap-2">
            <Button type="button" tone="ghost" onClick={load}>
              Refresh
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Adding..." : "Add Ticket"}
            </Button>
          </div>
        </form>
        {error ? <div className="mt-3 text-sm text-red-300">Error: {error}</div> : null}
      </Card>

      <Card>
        <div className="text-sm text-zinc-300 mb-3">Live ER queue</div>
        <Table columns={columns} rows={rows} />
      </Card>
    </div>
  );
}
