import { ChevronDown, KeyRound, LogOut, Users } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDismiss } from "@/hooks/useDismiss";
import { initials, useAuth } from "@/context/AuthContext";
import { Link, usePathname, useNavigate } from "@/lib/router";
import { ACCOUNT_ROUTE, STAFF_ROUTE } from "@/lib/site";

const ROLE_LABELS = { superadmin: "Superadmin", admin: "Admin", staff: "Staff" };

/** Round badge with the person's initials. */
export function Avatar({ name, email, className = "size-9 text-sm" }) {
  return (
    <span aria-hidden className={`grid shrink-0 place-items-center rounded-full bg-brand-600 font-display font-bold text-white ${className}`}>
      {initials(name, email)}
    </span>
  );
}

/** Top-right account menu for signed-in staff: initials, name, My account, Staff accounts, Sign out. */
export function AccountMenu() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const buttonRef = useRef(null);
  const dismiss = useCallback((why) => {
    setOpen(false);
    if (why === "escape") buttonRef.current?.focus();
  }, []);
  useDismiss(open, ref, dismiss);
  useEffect(() => setOpen(false), [pathname]);

  if (!user) return null;
  const role = user.role ?? "staff";

  async function onSignOut() {
    setOpen(false);
    try {
      await signOut();
    } finally {
      navigate("/");
    }
  }

  return (
    <div ref={ref} className="relative">
      <button ref={buttonRef} type="button" aria-haspopup="menu" aria-expanded={open} aria-label={`Account menu for ${user.name}`} data-testid="account-button" onClick={() => setOpen((v) => !v)} className="flex items-center gap-2 rounded-full border border-ink-700 bg-ink-900 py-1 pl-1 pr-1 transition-colors hover:border-ink-400 sm:pr-2 xl:pr-3">
        <Avatar name={user.name} email={user.email} />
        <span className="hidden max-w-32 truncate text-sm font-medium text-heading xl:block">{user.name}</span>
        <ChevronDown className="hidden size-4 text-ink-400 sm:block" aria-hidden />
      </button>

      {open && (
        <div role="menu" aria-label="Account" className="absolute right-0 z-50 mt-2 w-72 rounded-xl border border-ink-700 bg-ink-900 p-1.5 shadow-lg">
          <div className="flex items-center gap-3 px-3 py-3">
            <Avatar name={user.name} email={user.email} className="size-11 text-base" />
            <div className="min-w-0">
              <p className="truncate font-medium text-heading">{user.name}</p>
              <p className="truncate text-xs text-ink-400">{user.email}</p>
              <span className="mt-1 inline-block rounded-full bg-ink-800 px-2 py-0.5 text-xs font-medium text-ink-200">{ROLE_LABELS[role] ?? role}</span>
            </div>
          </div>
          <div className="my-1 border-t border-ink-800" />
          <Link href={ACCOUNT_ROUTE} role="menuitem" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-ink-100 hover:bg-ink-800">
            <KeyRound className="size-4 text-ink-400" aria-hidden /> My account
          </Link>
          {user.can?.manage_staff && (
            <Link href={STAFF_ROUTE} role="menuitem" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-ink-100 hover:bg-ink-800">
              <Users className="size-4 text-ink-400" aria-hidden /> Staff accounts
            </Link>
          )}
          <div className="my-1 border-t border-ink-800" />
          <button type="button" role="menuitem" onClick={onSignOut} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-ink-100 hover:bg-ink-800">
            <LogOut className="size-4 text-ink-400" aria-hidden /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
