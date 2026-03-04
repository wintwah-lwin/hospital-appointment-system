export default function Select({ label, value, onChange, options = [] }) {
  return (
    <label className="block">
      {label ? <div className="mb-1 text-xs text-zinc-400">{label}</div> : null}
      <select
        className="w-full h-10 rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500/40"
        value={value}
        onChange={onChange}
      >
        {options.map((o) => (
          <option key={o} value={o} className="bg-zinc-950">
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
