export function Pill({
  children,
  tone = "sauge",
}: {
  children: React.ReactNode;
  tone?: "sauge" | "terracotta";
}) {
  const toneClasses =
    tone === "sauge"
      ? "bg-sauge text-sauge-ink"
      : "bg-terracotta-soft text-terracotta-ink";

  return (
    <span
      className={`inline-flex self-start items-center rounded-full px-3.5 py-2 font-mono text-[13px] font-semibold ${toneClasses}`}
    >
      {children}
    </span>
  );
}
