import { useEffect } from "react";

/** Calls `onDismiss` on Escape or a click/tap outside `ref` while `open` is true. */
export function useDismiss(open, ref, onDismiss) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onDismiss("escape");
    const onPointer = (e) => ref.current && !ref.current.contains(e.target) && onDismiss("outside");
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open, ref, onDismiss]);
}
