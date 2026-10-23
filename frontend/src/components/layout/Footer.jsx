import { Link } from "@/lib/router";
import { Mail, Globe } from "lucide-react";
import { PUBLIC_NAV, OFFICIAL_CONTACT } from "@/lib/site";
import { Logo } from "./Logo";
import { PROMO } from "@/lib/content/promo";
export function Footer() {
    return (<footer className="mt-20 border-t border-ink-800 bg-ink-900">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div className="space-y-3">
          <Logo imgClassName="h-11 w-auto"/>
          <p className="text-sm text-ink-400">
            A promotion of Xtremeway Corp. Winner notifications come only from the official email and contact number
            listed in the promo mechanics.
          </p>
        </div>

        <nav aria-label="Footer">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-300">Campaign</h2>
          <ul className="space-y-2 text-sm">
            {PUBLIC_NAV.map((item) => (<li key={item.href}>
                <Link href={item.href} className="text-ink-400 hover:text-heading">
                  {item.label}
                </Link>
              </li>))}
            <li>
              <Link href="/privacy" className="text-ink-400 hover:text-heading">
                Data Privacy Statement
              </Link>
            </li>
          </ul>
        </nav>

        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-300">Official channels</h2>
          <ul className="space-y-2 text-sm">
            <li>
              <a href={`mailto:${OFFICIAL_CONTACT.email}`} className="inline-flex items-center gap-2 text-ink-400 hover:text-heading">
                <Mail className="size-4" aria-hidden/>
                {OFFICIAL_CONTACT.email}
              </a>
            </li>
            <li>
              <a href={OFFICIAL_CONTACT.website} className="inline-flex items-center gap-2 text-ink-400 hover:text-heading" rel="noopener noreferrer" target="_blank">
                <Globe className="size-4" aria-hidden/>
                xtremewaycorp.com/whitehaus
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-ink-800">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-ink-400 sm:px-6">
          {PROMO.permitNo} · © {new Date().getFullYear()} Xtremeway Corp.
        </p>
      </div>
    </footer>);
}
