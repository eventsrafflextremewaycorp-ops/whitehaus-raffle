import { PRIVACY_STATEMENT } from "@/lib/content/promo";
export function PrivacyStatement() {
    return (<div className="space-y-4 text-sm leading-relaxed text-ink-300">
      <p>{PRIVACY_STATEMENT.intro}</p>
      <p>{PRIVACY_STATEMENT.purposesLead}</p>
      <ul className="space-y-2">
        {PRIVACY_STATEMENT.purposes.map((p) => (<li key={p.title} className="rounded-lg bg-ink-850 px-4 py-3">
            <strong className="text-heading">{p.title}:</strong> {p.body}
          </li>))}
      </ul>
      {PRIVACY_STATEMENT.paragraphs.map((p) => (<p key={p}>{p}</p>))}
    </div>);
}
