/**
 * Shared client for the Laravel API.
 *
 * - Base URL: VITE_API_BASE_URL, default "/api" (same origin: Laravel serves this app and the API, and in
 *   development Vite proxies /api and /sanctum to Laravel). Set a full URL such as https://api.example.com/api
 *   only if the API lives on another (sub)domain.
 * - Requests send cookies (Sanctum SPA auth); mutating requests first fetch /sanctum/csrf-cookie and
 *   echo XSRF-TOKEN back as X-XSRF-TOKEN.
 * - Errors are normalised into ApiError (status, message, field errors).
 */
const BASE = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/+$/, "");
/** Origin of the Laravel app ("" = same origin). */
function backendOrigin() {
    return /^https?:\/\//.test(BASE) ? BASE.replace(/\/api$/, "") : "";
}
export class ApiError extends Error {
    status;
    errors;
    constructor(status, message, errors = {}) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.errors = errors;
    }
    get isUnauthenticated() {
        return this.status === 401 || this.status === 419;
    }
    get isValidation() {
        return this.status === 422;
    }
}
function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
function toFieldErrors(value) {
    if (!isRecord(value))
        return {};
    const out = {};
    for (const [key, messages] of Object.entries(value)) {
        if (Array.isArray(messages))
            out[key] = messages.filter((m) => typeof m === "string");
    }
    return out;
}
function buildUrl(path, query) {
    const url = new URL(BASE + path, window.location.origin);
    if (query) {
        for (const [key, value] of Object.entries(query)) {
            if (value !== undefined && value !== null && value !== "")
                url.searchParams.set(key, String(value));
        }
    }
    return url.toString();
}
function readCookie(name) {
    const match = document.cookie.split("; ").find((row) => row.startsWith(`${name}=`));
    return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}
async function ensureCsrfCookie(force = false) {
    if (!force && readCookie("XSRF-TOKEN"))
        return;
    const res = await fetch(`${backendOrigin()}/sanctum/csrf-cookie`, { credentials: "include" });
    if (!res.ok)
        throw new ApiError(res.status, "Could not start a secure session. Please try again.");
}
async function errorFrom(res) {
    let payload = null;
    try {
        payload = await res.json();
    }
    catch {
        // Non-JSON error body.
    }
    const message = isRecord(payload) && typeof payload.message === "string" && payload.message
        ? payload.message
        : res.status === 419
            ? "Your session expired. Please refresh the page and try again."
            : res.status === 429
                ? "Too many attempts. Please wait a minute and try again."
                : `Request failed (${res.status}).`;
    return new ApiError(res.status, message, isRecord(payload) ? toFieldErrors(payload.errors) : {});
}
async function send(path, options, retried = false) {
    const { method = "GET", query, body, signal } = options;
    const headers = { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" };
    let payload;
    if (body instanceof FormData) {
        payload = body;
    }
    else if (body) {
        headers["Content-Type"] = "application/json";
        payload = JSON.stringify(body);
    }
    if (method !== "GET") {
        await ensureCsrfCookie(retried);
        const token = readCookie("XSRF-TOKEN");
        if (token)
            headers["X-XSRF-TOKEN"] = token;
    }
    let res;
    try {
        res = await fetch(buildUrl(path, query), {
            method,
            headers,
            body: payload,
            signal,
            credentials: "include",
            cache: "no-store",
        });
    }
    catch (err) {
        if (err instanceof DOMException && err.name === "AbortError")
            throw err;
        throw new ApiError(0, "We couldn't reach the WhiteHaus server. Check your connection and try again.");
    }
    // Stale CSRF token (e.g. session expired): refresh it once and retry.
    if (res.status === 419 && method !== "GET" && !retried)
        return send(path, options, true);
    if (!res.ok)
        throw await errorFrom(res);
    return res;
}
async function request(path, options = {}) {
    const res = await send(path, options);
    return (await res.json());
}
/** Downloads a file response and saves it in the browser. */
async function download(path, query, fallbackName) {
    const res = await send(path, { query });
    const blob = await res.blob();
    const disposition = res.headers.get("Content-Disposition") ?? "";
    const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
    const filename = match ? decodeURIComponent(match[1]) : fallbackName;
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(href), 1000);
}
/* ----------------------------- Public endpoints ----------------------------- */
export async function getPromotion() {
    return (await request("/promotion")).data;
}
export async function getBranches() {
    return (await request("/branches")).data;
}
export async function getPrizes() {
    return (await request("/prizes")).data;
}
export async function getWinners() {
    return (await request("/winners")).data;
}
export async function submitRegistration(form) {
    const body = new FormData();
    body.set("full_name", form.full_name);
    body.set("email", form.email);
    body.set("contact_number", form.contact_number);
    body.set("address", form.address);
    body.set("unit", form.unit);
    body.set("branch_id", form.branch_id);
    body.set("purchase_date", form.purchase_date);
    body.set("reference_number", form.reference_number);
    if (form.proof_of_purchase)
        body.set("proof_of_purchase", form.proof_of_purchase);
    body.set("privacy_consent", form.privacy_consent ? "1" : "0");
    body.set("terms", form.terms ? "1" : "0");
    return request("/registrations", { method: "POST", body });
}
/* ------------------------------ Admin endpoints ----------------------------- */
export async function login(email, password) {
    return (await request("/auth/login", { method: "POST", body: { email, password } })).data;
}
export async function logout() {
    await request("/auth/logout", { method: "POST" });
}
export async function getCurrentAdmin() {
    return (await request("/auth/me")).data;
}
function filterQuery(filters) {
    return {
        search: filters.search.trim(),
        date_from: filters.dateFrom,
        date_to: filters.dateTo,
        status: filters.status === "all" ? undefined : filters.status,
    };
}
export async function getRegisteredCustomers(filters, page, perPage, signal) {
    return request("/registered-customers", {
        query: { ...filterQuery(filters), page, per_page: perPage },
        signal,
    });
}
export async function downloadRegisteredCustomers(filters) {
    await download("/registered-customers/export", filterQuery(filters), "whitehaus-registered-customers.csv");
}
export async function setValidation(id, validated) {
    return (await request(`/registered-customers/${id}/validation`, {
        method: "PATCH",
        body: { validated },
    })).data;
}
/** Opens a registration's proof-of-purchase image in a new tab (auth cookie required). */
export async function openProof(id) {
    const tab = window.open("", "_blank");
    try {
        const res = await send(`/registered-customers/${id}/proof`, {});
        const href = URL.createObjectURL(await res.blob());
        if (tab)
            tab.location.href = href;
        else
            window.location.href = href;
    }
    catch (err) {
        tab?.close();
        throw err;
    }
}
export async function getReceipts(search, status, page) {
    return request("/company-receipts", {
        query: { search: search.trim(), status: status === "all" ? undefined : status, page },
    });
}
export async function addReceipt(receiptNumber, dateBought) {
    return request("/company-receipts", {
        method: "POST",
        body: { receipt_number: receiptNumber, date_bought: dateBought || null },
    });
}
export async function importReceipts(file) {
    const body = new FormData();
    body.set("file", file);
    return request("/company-receipts/import", { method: "POST", body });
}
export async function deleteReceipt(id) {
    await request(`/company-receipts/${id}`, { method: "DELETE" });
}
/* ------------------- Home banner and prize photos (admin, superadmin) ------------------- */
export async function uploadBanner(file) {
    const body = new FormData();
    body.set("image", file);
    return (await request("/site/banner", { method: "POST", body })).data.banner_url;
}
export async function deleteBanner() {
    return (await request("/site/banner", { method: "DELETE" })).data.banner_url;
}
export async function uploadPrizeImage(id, file) {
    const body = new FormData();
    body.set("image", file);
    return (await request(`/prizes/${id}/image`, { method: "POST", body })).data;
}
export async function deletePrizeImage(id) {
    return (await request(`/prizes/${id}/image`, { method: "DELETE" })).data;
}
/* ------------------------------- Draw (staff) ------------------------------- */
export async function getDrawState(includeWinners) {
    return (await request("/draw", { query: { include_winners: includeWinners ? 1 : undefined } })).data;
}
/** The winner is chosen and saved by Laravel; the browser only animates. */
export async function spinDraw(includeWinners) {
    const res = await request("/draw/spin", {
        method: "POST",
        body: { include_winners: includeWinners },
    });
    return { winner: res.data.winner, state: res.state };
}
export async function getDrawTickets(search, entry, page) {
    return request("/draw/tickets", { query: { search: search.trim(), entry: entry === "all" ? undefined : entry, page } });
}
export async function getDrawWinners() {
    return request("/draw/winners");
}
export async function undoLastDraw() {
    await request("/draw/winners/latest", { method: "DELETE" });
}
export async function publishWinners(published) {
    await request("/draw/winners/publish", { method: "POST", body: { published } });
}
export async function assignPrize(winnerId, prizeId) {
    await request(`/draw/winners/${winnerId}/prize`, { method: "PATCH", body: { prize_id: prizeId } });
}
/* ------------------------------ Staff accounts ------------------------------ */
/** Returns { data: [...accounts], meta: { assignable_roles } }. */
export async function getStaff() {
    return request("/staff");
}
export async function addStaff(name, email, password, role) {
    return (await request("/staff", { method: "POST", body: { name, email, password, role } })).data;
}
export async function updateStaff(id, name, email, role) {
    return (await request(`/staff/${id}`, { method: "PATCH", body: { name, email, role } })).data;
}
export async function resetStaffPassword(id, password) {
    await request(`/staff/${id}/password`, { method: "POST", body: { password } });
}
export async function setStaffActive(id, active) {
    return (await request(`/staff/${id}/active`, { method: "PATCH", body: { active } })).data;
}
/* ---------------------------- Your own password ----------------------------- */
/** Signed in: change your own password (any role). */
export async function changeOwnPassword(currentPassword, password, passwordConfirmation) {
    return request("/account/password", {
        method: "POST",
        body: { current_password: currentPassword, password, password_confirmation: passwordConfirmation },
    });
}
/** Signed out: e-mail a reset link. The reply is the same whether or not the e-mail has an account. */
export async function forgotPassword(email) {
    return request("/auth/forgot-password", { method: "POST", body: { email } });
}
/** Signed out: set a new password with the token from the e-mail. */
export async function resetPasswordWithToken(token, email, password, passwordConfirmation) {
    return request("/auth/reset-password", {
        method: "POST",
        body: { token, email, password, password_confirmation: passwordConfirmation },
    });
}
