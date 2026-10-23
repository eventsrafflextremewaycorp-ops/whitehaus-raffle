/**
 * Light / dark / system theme.
 *
 * The choice ("light", "dark" or "system") is kept in localStorage under `gx-theme`; "system" follows the
 * device setting and changes live when the device switches. The resolved value is written to
 * <html data-theme="light|dark">, which index.css uses to swap the colour tokens. index.html applies it
 * before the first paint so the page never flashes the wrong colours.
 */
import { useCallback, useEffect, useState } from "react";

const KEY = "gx-theme";
const META_COLORS = { light: "#f5f6fa", dark: "#07080b" };

export const THEME_CHOICES = ["light", "dark", "system"];

export function getStoredTheme() {
    try {
        const v = localStorage.getItem(KEY);
        return v === "light" || v === "dark" ? v : "system";
    }
    catch {
        return "system";
    }
}

function systemPrefersDark() {
    return typeof matchMedia === "function" && matchMedia("(prefers-color-scheme: dark)").matches;
}

export function resolveTheme(choice) {
    return choice === "system" ? (systemPrefersDark() ? "dark" : "light") : choice;
}

export function applyTheme(choice) {
    const resolved = resolveTheme(choice);
    document.documentElement.dataset.theme = resolved;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", META_COLORS[resolved]);
    return resolved;
}

export function saveTheme(choice) {
    try {
        if (choice === "system")
            localStorage.removeItem(KEY);
        else
            localStorage.setItem(KEY, choice);
    }
    catch {
        // Storage can be blocked (private windows); the choice then lasts until the page is reloaded.
    }
    applyTheme(choice);
    window.dispatchEvent(new Event("gx-theme-change"));
}

/** { choice, resolved, setChoice } - re-renders when the choice changes here, in another tab, or the device theme flips. */
export function useTheme() {
    const [choice, setChoiceState] = useState(getStoredTheme);
    const [resolved, setResolved] = useState(() => resolveTheme(getStoredTheme()));

    useEffect(() => {
        const sync = () => {
            const c = getStoredTheme();
            setChoiceState(c);
            setResolved(applyTheme(c));
        };
        window.addEventListener("gx-theme-change", sync);
        window.addEventListener("storage", sync);
        const media = typeof matchMedia === "function" ? matchMedia("(prefers-color-scheme: dark)") : null;
        media?.addEventListener?.("change", sync);
        sync();
        return () => {
            window.removeEventListener("gx-theme-change", sync);
            window.removeEventListener("storage", sync);
            media?.removeEventListener?.("change", sync);
        };
    }, []);

    const setChoice = useCallback((c) => saveTheme(c), []);
    return { choice, resolved, setChoice };
}
