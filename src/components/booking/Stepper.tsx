const steps = ["Créneau", "Vos coordonnées", "Confirmation"];

export function Stepper({ current }: { current: 1 | 2 | 3 }) {
  return (
    <div className="flex w-full max-w-[880px] items-center gap-4">
      {steps.map((label, i) => {
        const n = i + 1;
        const state = n < current ? "done" : n === current ? "current" : "upcoming";
        return (
          <div key={label} className="flex flex-1 items-center gap-4 last:flex-none">
            <div className="flex items-center gap-2.5">
              <span
                className={
                  "flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full text-[15px] font-semibold " +
                  (state === "done"
                    ? "bg-sauge text-accent"
                    : state === "current"
                      ? "bg-accent text-white"
                      : "bg-sable text-faint")
                }
              >
                {state === "done" ? "✓" : n}
              </span>
              <span
                className={
                  "hidden text-[16.5px] sm:inline " +
                  (state === "upcoming" ? "text-faint" : state === "current" ? "font-semibold text-ink" : "text-body")
                }
              >
                {label}
              </span>
            </div>
            {n !== steps.length && (
              <span
                className={
                  "h-[1.5px] flex-1 " + (state === "done" ? "bg-accent" : "bg-border-strong")
                }
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
