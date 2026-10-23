import { AlertTriangle, Inbox, Loader2 } from "lucide-react";
export function LoadingState({ label = "Loading…" }) {
    return (<div role="status" className="flex items-center justify-center gap-3 py-16 text-ink-300">
      <Loader2 className="size-5 animate-spin" aria-hidden/>
      <span>{label}</span>
    </div>);
}
export function ErrorMessage({ title = "Something went wrong", message, action }) {
    return (<div role="alert" className="flex gap-3 rounded-xl border border-brand-700/50 bg-brand-700/10 p-4 text-sm">
      <AlertTriangle className="mt-0.5 size-5 shrink-0 text-brand-400" aria-hidden/>
      <div className="space-y-2">
        <p className="font-semibold text-heading">{title}</p>
        <p className="text-ink-300">{message}</p>
        {action}
      </div>
    </div>);
}
export function EmptyState({ title, message, icon, action }) {
    return (<div className="flex flex-col items-center gap-3 rounded-[var(--radius-card)] border border-dashed border-ink-700 px-6 py-14 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-ink-800 text-ink-300">
        {icon ?? <Inbox className="size-6" aria-hidden/>}
      </span>
      <h3 className="text-lg font-semibold text-heading">{title}</h3>
      {message && <p className="max-w-md text-sm text-ink-300">{message}</p>}
      {action}
    </div>);
}
export function Skeleton({ className = "" }) {
    return <div aria-hidden className={`animate-pulse rounded-lg bg-ink-800 ${className}`}/>;
}
