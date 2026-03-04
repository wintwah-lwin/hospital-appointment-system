import { useEffect, useMemo, useState } from "react";
import Card from "../../components/Card.jsx";
import Table from "../../components/Table.jsx";
import Badge from "../../components/Badge.jsx";
import Button from "../../components/Button.jsx";
import Input from "../../components/Input.jsx";
import Select from "../../components/Select.jsx";
import { apiDelete, apiGet, apiPatch, apiPost } from "../../api/client.js";

export default function BedManagement() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [bedId, setBedId] = useState("");
  const [ward, setWard] = useState("General Ward");
  const [type, setType] = useState("Standard");
  const [status, setStatus] = useState("Available");

  const load = async () => {
    setError("");
    try {
      const data = await apiGet("/api/beds");
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Failed to load beds");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const columns = useMemo(
    () => [
      { key: "bedId", label: "Bed ID" },
      { key: "ward", label: "Ward" },
      { key: "type", label: "Type" },
      {
        key: "status",
        label: "Status",
        render: (r) => (
          <Badge tone={r.status === "Available" ? "good" : "warn"}>{r.status}</Badge>
        ),
      },
      {
        key: "actions",
        label: "Actions",
        render: (r) => (
          <div className="flex gap-2">
            <Button
              size="sm"
              tone="ghost"
              onClick={async () => {
                try {
                  await apiPatch(`/api/beds/${r._id}/toggle`);
                  await load();
                } catch (e) {
                  alert(e.message);
                }
              }}
            >
              Toggle
            </Button>
            <Button
              size="sm"
              tone="ghost"
              onClick={async () => {
                if (!confirm(`Delete bed ${r.bedId}?`)) return;
                try {
                  await apiDelete(`/api/beds/${r._id}`);
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
    setError("");
    try {
      await apiPost("/api/beds", {
        bedId: bedId.trim(),
        ward,
        type,
        status,
      });
      setBedId("");
      setWard("General Ward");
      setType("Standard");
      setStatus("Available");
      await load();
    } catch (e2) {
      setError(e2.message || "Failed to add bed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-zinc-100">Bed Management</h1>

      <Card>
        <div className="text-sm text-zinc-300 font-medium">Add Bed</div>
        <form onSubmit={onAdd} className="mt-3 grid gap-3 md:grid-cols-4">
          <Input label="Bed ID" value={bedId} onChange={(e) => setBedId(e.target.value)} placeholder="B-05" required />
          <Select
            label="Ward"
            value={ward}
            onChange={(e) => setWard(e.target.value)}
            options={["General Ward", "ICU", "Emergency", "Pediatrics", "Surgery"]}
          />
          <Select
            label="Type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            options={["Standard", "ICU", "Observation", "Isolation"]}
          />
          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={["Available", "Occupied"]}
          />

          <div className="md:col-span-4 flex items-center justify-end gap-2">
            <Button type="button" tone="ghost" onClick={load}>
              Refresh
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Adding..." : "Add Bed"}
            </Button>
          </div>
        </form>

        {error ? <div className="mt-3 text-sm text-red-300">Error: {error}</div> : null}
      </Card>

      <Card>
        <div className="text-sm text-zinc-300 mb-3">Live beds</div>
        <Table columns={columns} rows={rows} />
      </Card>
    </div>
  );
}
