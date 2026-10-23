import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";

export { useLocation, useNavigate };

/**
 * <Link href="/path"> for internal routes (client-side navigation, no page reload).
 * External URLs, mailto:/tel: links and #anchors render a plain <a>.
 */
export function Link({ href, ...props }) {
  if (/^(https?:|mailto:|tel:|#)/.test(href)) return <a href={href} {...props} />;
  return <RouterLink to={href} {...props} />;
}

export function usePathname() {
  return useLocation().pathname;
}
