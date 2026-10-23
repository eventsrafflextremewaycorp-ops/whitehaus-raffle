import { Link } from "@/lib/router";
const base = "inline-flex items-center justify-center gap-2 rounded-lg font-semibold whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400";
const variants = {
    primary: "bg-brand-600 text-white hover:bg-brand-500 active:bg-brand-700",
    secondary: "border border-ink-600 bg-ink-850 text-ink-100 hover:border-ink-400 hover:bg-ink-800",
    ghost: "text-ink-300 hover:bg-ink-800 hover:text-heading",
    danger: "border border-brand-700/60 text-brand-300 hover:bg-brand-700/15",
};
const sizes = {
    sm: "h-9 px-3 text-sm",
    md: "h-11 px-4 text-sm",
    lg: "h-12 px-6 text-base",
};
export function buttonClasses(variant = "primary", size = "md", extra = "") {
    return [base, variants[variant], sizes[size], extra].filter(Boolean).join(" ");
}
export function Button({ variant = "primary", size = "md", className = "", type = "button", ...props }) {
    return <button type={type} className={buttonClasses(variant, size, className)} {...props}/>;
}
export function ButtonLink({ variant = "primary", size = "md", className = "", ...props }) {
    return <Link className={buttonClasses(variant, size, className)} {...props}/>;
}
