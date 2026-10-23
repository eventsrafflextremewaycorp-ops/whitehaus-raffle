/** Shared page hero used by every public page except the homepage. */
export function PageHeader({ eyebrow, title, description, children }) {
    return (<section className="bg-grid relative border-b border-ink-800">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        {eyebrow && (<p className="mb-3 font-display text-xs font-semibold uppercase tracking-[0.2em] text-brand-400">{eyebrow}</p>)}
        <h1 className="text-3xl font-bold text-heading sm:text-4xl">{title}</h1>
        {description && <div className="mt-4 max-w-2xl text-base text-ink-300">{description}</div>}
        {children && <div className="mt-6">{children}</div>}
      </div>
    </section>);
}
export function Container({ children, className = "" }) {
    return <div className={`mx-auto w-full px-4 sm:px-6 ${className.includes("max-w-") ? "" : "max-w-6xl"} ${className}`}>{children}</div>;
}
export function Card({ children, className = "" }) {
    return (<div className={`rounded-[var(--radius-card)] border border-ink-700 bg-ink-900 shadow-sm ${className}`}>{children}</div>);
}
