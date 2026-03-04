export default function Input({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  inputMode,
  type = "text",
}) {
  return (
    <label className="block">
      {label ? <div className="mb-1 text-xs text-zinc-400">{label}</div> : null}
      <input
        className="w-full h-10 rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-500/40"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        inputMode={inputMode}
        type={type}
      />
    </label>
  );
}
