import { useEffect, useState } from "react";
import Card from "../../components/Card.jsx";
import Table from "../../components/Table.jsx";
import Badge from "../../components/Badge.jsx";
import { apiGet } from "../../api/client.js";

export default function Departments() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    apiGet("/api/departments")
      .then((data) => alive && setRows(Array.isArray(data) ? data : []))
      .catch((e) => alive && setError(e.message || "Failed to load"));
    return () => (alive = false);
  }, []);

  const columns = [
    { key: "name", label: "Department" },
    {
      key: "availability",
      label: "Beds",
      render: (r) => (
        <div className="text-sm">
          <span className="font-medium">{r.availableBeds}</span>
          <span className="text-zinc-400"> / {r.capacity}</span>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (r) => {
        const tone =
          r.status === "stable" ? "good" : r.status === "busy" ? "warn" : r.status === "tight" ? "bad" : "neutral";
        return <Badge tone={tone}>{r.status}</Badge>;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Departments</h1>
        <p className="text-sm text-zinc-500 mt-1">Live data from backend</p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="text-sm text-red-700">Error: {error}</div>
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
          <Table columns={columns} rows={rows} />
        </div>
      )}
    </div>
  );
}
