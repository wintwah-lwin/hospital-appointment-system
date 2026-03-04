export default function Card({ title, subtitle, children, right }) {
  return (
    <div className="rounded-2xl border bg-white shadow-sm">
      {(title || subtitle || right) && (
        <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-4">
          <div>
            {title && <div className="font-semibold">{title}</div>}
            {subtitle && <div className="text-sm text-zinc-500">{subtitle}</div>}
          </div>
          {right}
        </div>
      )}
      <div className="px-5 pb-5">{children}</div>
    </div>
  );
}
