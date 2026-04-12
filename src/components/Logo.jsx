import { Link } from "react-router-dom";

export default function Logo({ className = "h-11 w-11", showText = true, asLink = true }) {
  const img = (
    <img
      src="/intellicare-logo.svg"
      alt="IntelliCare"
      className={`${className} object-contain`}
    />
  );
  const content = (
    <>
      {img}
      {showText && <span className="font-semibold text-slate-900 text-sm">IntelliCare</span>}
    </>
  );
  if (asLink) {
    return <Link to="/" className="inline-flex items-center gap-2">{content}</Link>;
  }
  return <span className="inline-flex items-center gap-2">{content}</span>;
}
