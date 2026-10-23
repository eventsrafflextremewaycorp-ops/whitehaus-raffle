import { LogIn, Menu, UserPlus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { AccountMenu, Avatar } from "@/components/layout/AccountMenu";
import { ThemeSwitch } from "@/components/layout/ThemeSwitch";
import { useAuth } from "@/context/AuthContext";
import { Link, usePathname } from "@/lib/router";
import { ACCOUNT_ROUTE, LOGIN_ROUTE, PUBLIC_NAV, REGISTER_ROUTE, STAFF_ROUTE, STAFF_TOP_NAV, isActive, showsRegisterButton } from "@/lib/site";
import { Logo } from "./Logo";

/**
 * Site header.
 * Visitors see the public links, a Login button and Register. After signing in, Registered Customers and
 * Draw appear and Login becomes the account menu (initials). The Register button follows the same
 * route rule as before: hidden on staff pages.
 */
export function Header() {
  const pathname = usePathname() ?? "/";
  const { user, status, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const showRegister = showsRegisterButton(pathname);
  const signedIn = Boolean(user);
  const nav = signedIn ? [...PUBLIC_NAV, ...STAFF_TOP_NAV] : PUBLIC_NAV;

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const loginActive = pathname === LOGIN_ROUTE;
  const linkClass = (active) => `whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors ${active ? "bg-ink-800 text-heading" : "text-ink-300 hover:bg-ink-850 hover:text-heading"}`;

  return (
    <header
      onClick={(e) => {
        // Any link inside the header (logo, Register, nav) closes the mobile menu.
        if (e.target instanceof Element && e.target.closest("a")) setOpen(false);
      }}
      className="sticky top-0 z-40 border-b border-ink-800 bg-ink-950/90 backdrop-blur supports-[backdrop-filter]:bg-ink-950/75"
    >
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-md focus:bg-ink-900 focus:px-3 focus:py-2 focus:text-heading">
        Skip to content
      </a>

      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <Logo />

        <nav aria-label="Main" className="ml-auto hidden xl:block">
          <ul className="flex items-center gap-1">
            {nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} aria-current={isActive(pathname, item.href) ? "page" : undefined} className={linkClass(isActive(pathname, item.href))}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-1.5 xl:ml-2">
          <div className="hidden sm:block">
            <ThemeSwitch />
          </div>

          {signedIn ? (
            <AccountMenu />
          ) : status === "checking" ? (
            <span aria-hidden className="size-9 animate-pulse rounded-full bg-ink-800" />
          ) : (
            <ButtonLink href={LOGIN_ROUTE} variant="secondary" size="sm" className="max-sm:hidden" aria-current={loginActive ? "page" : undefined} data-testid="login-button">
              <LogIn className="size-4" aria-hidden />
              Login
            </ButtonLink>
          )}

          {showRegister && (
            <ButtonLink href={REGISTER_ROUTE} size="sm" className={signedIn ? "max-sm:hidden" : ""} aria-current={pathname === REGISTER_ROUTE ? "page" : undefined} data-testid="global-register-button">
              <UserPlus className="size-4" aria-hidden />
              Register
            </ButtonLink>
          )}

          <button type="button" className="grid size-10 place-items-center rounded-lg text-ink-100 hover:bg-ink-800 xl:hidden" aria-expanded={open} aria-controls="mobile-nav" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen((v) => !v)}>
            {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label="Main" className="border-t border-ink-800 bg-ink-950 xl:hidden">
          <div className="mx-auto max-w-6xl space-y-3 px-4 py-3 sm:px-6">
            {signedIn && (
              <div className="flex items-center gap-3 rounded-lg bg-ink-850 px-3 py-3">
                <Avatar name={user.name} email={user.email} className="size-10 text-sm" />
                <div className="min-w-0">
                  <p className="truncate font-medium text-heading">{user.name}</p>
                  <p className="truncate text-xs text-ink-400">{user.email}</p>
                </div>
              </div>
            )}
            <ul className="space-y-1">
              {nav.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link href={item.href} aria-current={active ? "page" : undefined} className={`block rounded-lg px-3 py-3 text-base font-medium ${active ? "bg-ink-800 text-heading" : "text-ink-300 hover:bg-ink-850 hover:text-heading"}`}>
                      {item.label}
                    </Link>
                  </li>
                );
              })}
              {signedIn && (
                <>
                  <li>
                    <Link href={ACCOUNT_ROUTE} aria-current={isActive(pathname, ACCOUNT_ROUTE) ? "page" : undefined} className="block rounded-lg px-3 py-3 text-base font-medium text-ink-300 hover:bg-ink-850 hover:text-heading">
                      My account
                    </Link>
                  </li>
                  {user.can?.manage_staff && (
                    <li>
                      <Link href={STAFF_ROUTE} className="block rounded-lg px-3 py-3 text-base font-medium text-ink-300 hover:bg-ink-850 hover:text-heading">
                        Staff accounts
                      </Link>
                    </li>
                  )}
                </>
              )}
              {signedIn && showRegister && (
                <li>
                  <Link href={REGISTER_ROUTE} className="block rounded-lg px-3 py-3 text-base font-medium text-ink-300 hover:bg-ink-850 hover:text-heading sm:hidden">
                    Register
                  </Link>
                </li>
              )}
              {!signedIn && status !== "checking" && (
                <li>
                  <Link href={LOGIN_ROUTE} className="block rounded-lg px-3 py-3 text-base font-medium text-ink-300 hover:bg-ink-850 hover:text-heading">
                    Login
                  </Link>
                </li>
              )}
            </ul>
            <div>
              <p className="mb-1.5 px-1 text-xs font-medium uppercase tracking-wide text-ink-400">Theme</p>
              <ThemeSwitch variant="segmented" />
            </div>
            {signedIn && (
              <button type="button" onClick={() => signOut().finally(() => setOpen(false))} className="w-full rounded-lg border border-ink-700 px-3 py-3 text-base font-medium text-ink-100 hover:bg-ink-850">
                Sign out
              </button>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
