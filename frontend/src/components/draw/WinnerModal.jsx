import { PartyPopper, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
export function WinnerModal({ winner, onClose }) {
    const closeRef = useRef(null);
    useEffect(() => {
        closeRef.current?.focus();
        const onKey = (e) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);
    return (<div className="fixed inset-0 z-50 grid place-items-center bg-scrim/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="winner-title" onClick={(e) => e.stopPropagation()} className="relative w-full max-w-lg rounded-2xl border border-brand-500/50 bg-ink-900 p-8 text-center shadow-2xl">
        <button ref={closeRef} type="button" onClick={onClose} aria-label="Close" className="absolute right-3 top-3 grid size-9 place-items-center rounded-lg text-ink-400 hover:bg-ink-800 hover:text-heading">
          <X className="size-5" aria-hidden/>
        </button>
        <PartyPopper className="mx-auto size-12 text-brand-400" aria-hidden/>
        <h2 id="winner-title" className="mt-3 text-3xl font-bold text-heading">
          Congratulations!!
        </h2>
        <p className="mt-1 text-sm font-semibold uppercase tracking-widest text-brand-400">
          Draw {winner.draw_number} · {winner.category}
        </p>
        <p className="mt-6 break-all font-mono text-xl font-bold text-heading sm:text-2xl" data-testid="winner-ticket">
          {winner.ticket_code}
        </p>
        <p className="mt-3 text-lg text-ink-100">{winner.full_name}</p>
        <p className="text-sm text-ink-400">{winner.branch ?? "—"}</p>
        <Button className="mt-8" onClick={onClose}>
          Continue
        </Button>
      </div>
    </div>);
}
