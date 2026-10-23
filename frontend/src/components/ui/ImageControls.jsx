import { Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";

/**
 * Upload / change / remove buttons for an admin-managed image.
 * `onPick(file)` and `onRemove()` return promises; errors are shown by the caller through `error`.
 */
export function ImageControls({ hasImage, busy, onPick, onRemove, label = "image", compact = false, className = "" }) {
  const input = useRef(null);
  const [confirming, setConfirming] = useState(false);
  const size = compact ? "h-8 px-2.5 text-xs" : "h-9 px-3 text-sm";
  const btn = `inline-flex items-center gap-1.5 rounded-lg border font-semibold shadow-sm transition-colors disabled:opacity-60 ${size}`;

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        tabIndex={-1}
        aria-label={`Choose ${label} file`}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) onPick(file);
        }}
      />
      <button type="button" disabled={busy} onClick={() => input.current?.click()} className={`${btn} border-brand-600 bg-brand-600 text-white hover:bg-brand-500`}>
        <Upload className="size-4" aria-hidden />
        {busy ? "Uploading…" : hasImage ? `Change ${label}` : `Upload ${label}`}
      </button>
      {hasImage &&
        (confirming ? (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-ink-600 bg-ink-900 px-2 py-1 text-xs text-ink-100 shadow-sm">
            Remove this {label}?
            <button type="button" disabled={busy} onClick={() => { setConfirming(false); onRemove(); }} className="rounded-md bg-brand-600 px-2 py-1 font-semibold text-white hover:bg-brand-500">
              Yes, remove
            </button>
            <button type="button" onClick={() => setConfirming(false)} className="rounded-md px-2 py-1 font-semibold text-ink-300 hover:bg-ink-800">
              Keep
            </button>
          </span>
        ) : (
          <button type="button" disabled={busy} onClick={() => setConfirming(true)} className={`${btn} border-ink-600 bg-ink-900 text-ink-100 hover:border-ink-400`}>
            <Trash2 className="size-4" aria-hidden />
            Remove
          </button>
        ))}
    </div>
  );
}
