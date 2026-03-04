export default function Button({
  children,
  tone = "primary",
  size = "md",
  type = "button",
  disabled = false,
  onClick,
}) {
  const base =
    "inline-flex items-center justify-center rounded-xl border text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-zinc-500/40 disabled:opacity-60 disabled:cursor-not-allowed";
  const sizes = {
    sm: "h-8 px-3",
    md: "h-10 px-4",
  };
  const tones = {
    primary:
      "border-zinc-700 bg-zinc-100 text-zinc-900 hover:bg-white",
    ghost:
      "border-zinc-800 bg-zinc-900/40 text-zinc-100 hover:bg-zinc-900/70",
    danger:
      "border-red-900/40 bg-red-500/10 text-red-200 hover:bg-red-500/15",
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${base} ${sizes[size] || sizes.md} ${tones[tone] || tones.primary}`}
    >
      {children}
    </button>
  );
}
