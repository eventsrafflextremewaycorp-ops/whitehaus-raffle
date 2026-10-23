export const REGISTER_ROUTE = "/register";
export const REGISTERED_CUSTOMERS_ROUTE = "/registered-customers";
export const DRAW_ROUTE = "/draw";
export const STAFF_ROUTE = "/staff";
export const ACCOUNT_ROUTE = "/account";
export const LOGIN_ROUTE = "/login";
export const FORGOT_PASSWORD_ROUTE = "/forgot-password";
export const RESET_PASSWORD_ROUTE = "/reset-password";
/** Links everyone sees. */
export const PUBLIC_NAV = [
    { href: "/promo-mechanics", label: "Promo Mechanics" },
    { href: "/participating-branches", label: "Branches" },
    { href: "/prizes", label: "Prizes" },
    { href: "/winners", label: "Winners" },
];
/** Links that appear in the header only after a staff member has signed in. */
export const STAFF_TOP_NAV = [
    { href: REGISTERED_CUSTOMERS_ROUTE, label: "Registered Customers", short: "Customers" },
    { href: DRAW_ROUTE, label: "Draw" },
];
/** Sub-navigation of the staff area (login required). */
export const STAFF_NAV = [
    { href: REGISTERED_CUSTOMERS_ROUTE, label: "Registered customers" },
    { href: `${REGISTERED_CUSTOMERS_ROUTE}/receipts`, label: "Company receipts" },
    { href: DRAW_ROUTE, label: "Draw" },
    { href: `${DRAW_ROUTE}/tickets`, label: "Tickets" },
    { href: `${DRAW_ROUTE}/winners`, label: "Winners" },
    { href: STAFF_ROUTE, label: "Staff accounts", needs: "manage_staff" },
];
/**
 * Routes where the global Register button must NOT appear.
 * Everything else in the public site shows it.
 */
// The draw is part of the same staff area, so it is hidden there too.
const ROUTES_WITHOUT_REGISTER = [REGISTERED_CUSTOMERS_ROUTE, DRAW_ROUTE, STAFF_ROUTE, ACCOUNT_ROUTE, LOGIN_ROUTE, FORGOT_PASSWORD_ROUTE, RESET_PASSWORD_ROUTE];
export function showsRegisterButton(pathname) {
    return !ROUTES_WITHOUT_REGISTER.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}
export function isActive(pathname, href) {
    return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
export const OFFICIAL_CONTACT = {
    email: "retail.mktg@xtremewaycorp.com",
    phone: "+69171139386", // as published on the live mechanics page
    website: "https://xtremewaycorp.com/whitehaus",
};
