import { useEffect } from "react";

const DEFAULT_TITLE = "WhiteHaus — iPhone 18 Pro & Pro Max Promo";

/** Sets the browser tab title for the current page ("Prizes · WhiteHaus"). */
export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · WhiteHaus` : DEFAULT_TITLE;
  }, [title]);
}
