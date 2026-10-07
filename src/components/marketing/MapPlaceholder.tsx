import { siteConfig } from "@/lib/site-config";

export function MapPlaceholder() {
  return (
    <div className="relative flex h-72 items-center justify-center overflow-hidden rounded-2xl bg-sauge sm:h-[420px]">
      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(63,111,99,0.10) 0 1px, transparent 1px 46px), repeating-linear-gradient(90deg, rgba(63,111,99,0.10) 0 1px, transparent 1px 46px)",
        }}
      />
      <div className="relative flex flex-col items-center gap-2">
        <span className="h-5.5 w-5.5 rounded-full border-4 border-linen bg-terracotta shadow-lg" />
        <span className="rounded-lg bg-linen px-3.5 py-2 text-sm font-semibold">
          {siteConfig.adresseLigne1}
        </span>
        <span className="font-mono text-xs text-[#7F8880]">
          carte interactive
        </span>
      </div>
    </div>
  );
}
