const TABS = [
    { value: "all", label: "All" },
    { value: "unvalidated", label: "Unvalidated" },
    { value: "validated", label: "Validated" },
];
export function StatusTabs({ value, onChange }) {
    return (<div role="group" aria-label="Validation status" className="inline-flex rounded-lg border border-ink-700 bg-ink-900 p-1">
      {TABS.map((tab) => (<button key={tab.value} type="button" aria-pressed={value === tab.value} onClick={() => onChange(tab.value)} className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors ${value === tab.value ? "bg-ink-700 text-heading" : "text-ink-400 hover:text-heading"}`}>
          {tab.label}
        </button>))}
    </div>);
}
