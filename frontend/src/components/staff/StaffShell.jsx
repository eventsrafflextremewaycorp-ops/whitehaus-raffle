import { Link } from "@/lib/router";
import { usePathname } from "@/lib/router";
import { createContext, useContext, useMemo } from "react";
import { AdminLogin } from "@/components/registered-customer/AdminLogin";
import { Button } from "@/components/ui/Button";
import { ErrorMessage, LoadingState } from "@/components/ui/States";
import { useAuth } from "@/context/AuthContext";
import { STAFF_NAV } from "@/lib/site";

const StaffContext = createContext(null);
/** What the signed-in account may do. The API enforces the same rules; this only decides what the screens offer. */
export function useCan() {
    const { user } = useStaff();
    return {
        role: user.role ?? "staff",
        records: Boolean(user.can?.manage_records),
        staff: Boolean(user.can?.manage_staff),
        admins: Boolean(user.can?.manage_admins),
    };
}
export function useStaff() {
    const value = useContext(StaffContext);
    if (!value)
        throw new Error("useStaff must be used inside <StaffShell>");
    return value;
}
/**
 * Login gate for the whole staff area (registered customers, receipts, draw, tickets, winners).
 * Who is signed in comes from <AuthProvider>, shared with the header. This only decides what the browser
 * shows - the server re-checks the session and the gates on every request. Each browser has its own
 * session, so the same staff account can be signed in on several browsers or devices at once.
 */
export function StaffShell({ children }) {
    const pathname = usePathname() ?? "";
    const auth = useAuth();
    const context = useMemo(() => (auth.user ? { user: auth.user, onUnauthenticated: auth.expire } : null), [auth.user, auth.expire]);
    if (auth.status === "checking")
        return <LoadingState label="Checking your session…"/>;
    if (auth.status === "error") {
        return (<ErrorMessage title="Unable to reach the server" message={auth.error} action={<Button variant="secondary" size="sm" onClick={auth.retry}>
            Try again
          </Button>}/>);
    }
    if (!context)
        return <AdminLogin notice={auth.notice} onSignedIn={auth.signIn}/>;
    return (<StaffContext.Provider value={context}>
      <div className="space-y-6">
        <nav aria-label="Staff area" className="-mx-1 flex flex-wrap gap-1">
          {STAFF_NAV.filter((item) => !item.needs || context.user.can?.[item.needs]).map((item) => {
            // Exact match for the section roots so "Draw" is not active on /draw/tickets.
            const active = pathname === item.href;
            return (<Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${active ? "bg-ink-700 text-heading" : "text-ink-300 hover:bg-ink-850 hover:text-heading"}`}>
                {item.label}
              </Link>);
        })}
        </nav>
        {children}
      </div>
    </StaffContext.Provider>);
}
