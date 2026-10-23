export const inputClasses = "block w-full rounded-lg border border-ink-600 bg-ink-850 px-3.5 py-2.5 text-sm text-heading placeholder:text-ink-400 transition-colors hover:border-ink-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/30 aria-[invalid=true]:border-brand-500 disabled:opacity-60";
export function Field({ id, label, error, hint, required, children, className = "" }) {
    return (<div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink-100">
        {label}
        {required && (<span className="ml-0.5 text-brand-400" aria-hidden>
            *
          </span>)}
      </label>
      {children}
      {hint && !error && (<p id={`${id}-hint`} className="mt-1.5 text-xs text-ink-400">
          {hint}
        </p>)}
      {error && (<p id={`${id}-error`} className="mt-1.5 text-xs font-medium text-brand-300">
          {error}
        </p>)}
    </div>);
}
export function describedBy(id, error, hint) {
    if (error)
        return `${id}-error`;
    return hint ? `${id}-hint` : undefined;
}
export function TextInput(props) {
    return <input {...props} className={`${inputClasses} ${props.className ?? ""}`}/>;
}
export function TextArea(props) {
    return <textarea {...props} className={`${inputClasses} min-h-24 ${props.className ?? ""}`}/>;
}
export function Select(props) {
    return <select {...props} className={`${inputClasses} ${props.className ?? ""}`}/>;
}
