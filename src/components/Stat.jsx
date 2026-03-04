import Badge from "./Badge.jsx";

export default function Stat({ label, value, hint, tone }) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="text-sm text-zinc-500">{label}</div>
      <div className="mt-2 flex items-end justify-between gap-3">
        <div className="text-2xl font-semibold">{value}</div>
        {tone && <Badge tone={tone}>{hint}</Badge>}
      </div>
      {!tone && hint && <div className="mt-2 text-xs text-zinc-500">{hint}</div>}
    </div>
  );
}
