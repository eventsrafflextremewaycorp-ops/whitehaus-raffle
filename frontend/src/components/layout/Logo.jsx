import { Link } from "@/lib/router";
import { useState } from "react";
import { useTheme } from "@/lib/theme";
/**
 * Two logo files in public/brand/ (see README):
 *   whitehaus_black.png  - dark logo, used on the light theme (white background)
 *   whitehaus_white.png  - light logo, used on the dark theme (black background)
 * If a file is missing the plain text name shows instead, so the header never has a broken image.
 */
const LOGOS = { light: "/brand/whitehaus_black.png", dark: "/brand/whitehaus_white.png" };
export function Logo({ className = "", imgClassName = "h-8 w-auto sm:h-9" }) {
    const { resolved } = useTheme();
    const [failed, setFailed] = useState({});
    const hasMark = !failed[resolved];
    return (<Link href="/" className={`inline-flex items-center rounded-md ${className}`} aria-label="WhiteHaus home">
      {hasMark ? (
        <img key={resolved} src={LOGOS[resolved]} alt="" width={1000} height={177} className={imgClassName} onError={() => setFailed((f) => ({ ...f, [resolved]: true }))}/>) : (<span className="font-display text-lg font-bold uppercase tracking-wide text-heading">
          White<span className="text-brand-400">Haus</span>
        </span>)}
    </Link>);
}
