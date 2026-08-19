export function PhotoPlaceholder({
  label,
  className = "",
  tone = "sable",
}: {
  label: string;
  className?: string;
  tone?: "sable" | "terracotta";
}) {
  const bg = tone === "sable" ? "placeholder-photo" : "placeholder-photo-terracotta";
  return (
    <div
      className={`${bg} flex items-center justify-center rounded-2xl ${className}`}
    >
      <span className="rounded-md bg-linen px-3.5 py-2 font-mono text-[13px] text-faint">
        {label}
      </span>
    </div>
  );
}
