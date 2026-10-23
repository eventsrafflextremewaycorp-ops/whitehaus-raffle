import { Check, Monitor, Moon, Sun } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { useDismiss } from "@/hooks/useDismiss";
import { useTheme } from "@/lib/theme";

const OPTIONS = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "system", label: "Match my device", short: "Device", Icon: Monitor },
];

/**
 * Theme picker. `variant="menu"` is the header icon with a small dropdown;
 * `variant="segmented"` is three side-by-side buttons for the mobile menu.
 */
export function ThemeSwitch({ variant = "menu" }) {
  const { choice, setChoice } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const buttonRef = useRef(null);
  const dismiss = useCallback((why) => {
    setOpen(false);
    if (why === "escape") buttonRef.current?.focus();
  }, []);
  useDismiss(open, ref, dismiss);

  if (variant === "segmented") {
    return (
      <div role="radiogroup" aria-label="Theme" className="grid grid-cols-3 gap-1 rounded-lg border border-ink-700 bg-ink-850 p-1">
        {OPTIONS.map(({ value, label, short, Icon }) => (
          <button key={value} type="button" role="radio" aria-checked={choice === value} onClick={() => setChoice(value)} className={`inline-flex items-center justify-center gap-1.5 rounded-md px-2 py-2 text-sm font-medium transition-colors ${choice === value ? "bg-ink-900 text-heading shadow-sm" : "text-ink-300 hover:text-heading"}`}>
            <Icon className="size-4" aria-hidden />
            {short ?? label}
          </button>
        ))}
      </div>
    );
  }

  const Current = OPTIONS.find((o) => o.value === choice)?.Icon ?? Monitor;
  return (
    <div ref={ref} className="relative">
      <button ref={buttonRef} type="button" aria-haspopup="menu" aria-expanded={open} aria-label={`Theme: ${OPTIONS.find((o) => o.value === choice)?.label ?? "Match my device"}. Change theme`} data-testid="theme-button" onClick={() => setOpen((v) => !v)} className="grid size-10 place-items-center rounded-lg text-ink-300 transition-colors hover:bg-ink-800 hover:text-heading">
        <Current className="size-5" aria-hidden />
      </button>
      {open && (
        <div role="menu" aria-label="Theme" className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-ink-700 bg-ink-900 p-1.5 shadow-lg">
          {OPTIONS.map(({ value, label, Icon }) => (
            <button
              key={value}
              type="button"
              role="menuitemradio"
              aria-checked={choice === value}
              onClick={() => {
                setChoice(value);
                setOpen(false);
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-ink-100 hover:bg-ink-800"
            >
              <Icon className="size-4 text-ink-400" aria-hidden />
              <span className="flex-1">{label}</span>
              {choice === value && <Check className="size-4 text-brand-400" aria-hidden />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
