import { Link } from "@/lib/router";
import { ArrowLeft, ArrowRight, CheckCircle2, Copy, ShieldCheck, Upload } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { PrivacyStatement } from "./PrivacyStatement";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/PageHeader";
import { ErrorMessage } from "@/components/ui/States";
import { Field, Select, TextArea, TextInput, describedBy } from "@/components/ui/FormField";
import { ApiError, submitRegistration } from "@/lib/api";
import { formatDateTime, todayInManila } from "@/lib/format";
const EMPTY = {
    full_name: "",
    email: "",
    contact_number: "",
    address: "",
    unit: "",
    branch_id: "",
    purchase_date: "",
    reference_number: "",
    proof_of_purchase: null,
    privacy_consent: false,
    terms: false,
};
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "application/pdf"];
const REGION_ORDER = ["Metro Manila", "North Luzon", "South Luzon", "Visayas & Mindanao", "Website"];
export function RegistrationFlow({ promotion, branches }) {
    const [step, setStep] = useState("privacy");
    const [form, setForm] = useState(EMPTY);
    const [errors, setErrors] = useState({});
    const [formError, setFormError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [receipt, setReceipt] = useState(null);
    const formRef = useRef(null);
    const maxDate = useMemo(() => {
        const today = todayInManila();
        return today < promotion.period_end ? today : promotion.period_end;
    }, [promotion.period_end]);
    const branchGroups = useMemo(() => REGION_ORDER.map((region) => ({ region, items: branches.filter((b) => b.region === region) })).filter((g) => g.items.length > 0), [branches]);
    function update(key, value) {
        setForm((f) => ({ ...f, [key]: value }));
        if (errors[key]) {
            setErrors((prev) => {
                const next = { ...prev };
                delete next[key];
                return next;
            });
        }
    }
    const err = (key) => errors[key]?.[0];
    function validateLocally() {
        const e = {};
        const required = [
            ["full_name", "Enter your full name."],
            ["email", "Enter your email address."],
            ["contact_number", "Enter your contact number."],
            ["address", "Enter your complete address."],
            ["unit", "Select a participating unit."],
            ["branch_id", "Select the participating branch."],
            ["purchase_date", "Enter the purchase date."],
            ["reference_number", "Enter the reference number."],
        ];
        for (const [key, message] of required) {
            if (!String(form[key] ?? "").trim())
                e[key] = [message];
        }
        if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
            e.email = ["Enter a valid email address."];
        if (form.purchase_date && (form.purchase_date < promotion.period_start || form.purchase_date > maxDate)) {
            e.purchase_date = ["The purchase date must fall within the promo period and cannot be in the future."];
        }
        if (!form.proof_of_purchase) {
            e.proof_of_purchase = ["Upload your proof of purchase."];
        }
        else {
            if (!ACCEPTED_TYPES.includes(form.proof_of_purchase.type))
                e.proof_of_purchase = ["Upload a JPG, PNG or PDF file."];
            else if (form.proof_of_purchase.size > promotion.proof_max_kb * 1024)
                e.proof_of_purchase = ["The proof of purchase image must not be larger than 2 MB."];
        }
        if (!form.terms)
            e.terms = ["Please agree to the terms and conditions."];
        return e;
    }
    function focusFirstError(fieldErrors) {
        const first = Object.keys(fieldErrors)[0];
        if (!first)
            return;
        requestAnimationFrame(() => formRef.current?.querySelector(`[name="${first}"]`)?.focus());
    }
    async function onSubmit(event) {
        event.preventDefault();
        setFormError(null);
        const local = validateLocally();
        if (Object.keys(local).length > 0) {
            setErrors(local);
            focusFirstError(local);
            return;
        }
        setSubmitting(true);
        try {
            const res = await submitRegistration(form);
            setReceipt(res.data);
            setStep("done");
            window.scrollTo({ top: 0 });
        }
        catch (e) {
            if (e instanceof ApiError && e.isValidation) {
                setErrors(e.errors);
                setFormError("Please check the highlighted fields.");
                focusFirstError(e.errors);
            }
            else {
                setFormError(e instanceof Error ? e.message : "Registration failed. Please try again.");
            }
        }
        finally {
            setSubmitting(false);
        }
    }
    /* ---------------------------- Step 1: privacy ---------------------------- */
    if (step === "privacy") {
        return (<Card className="p-6 sm:p-8">
        <StepLabel current={1}/>
        <h2 className="mt-2 flex items-center gap-2 text-2xl font-bold text-heading">
          <ShieldCheck className="size-6 text-brand-400" aria-hidden/> Data Privacy Statement
        </h2>
        <div className="mt-5 max-h-[26rem] overflow-y-auto rounded-xl border border-ink-700 bg-ink-950 p-5" tabIndex={0} aria-label="Data Privacy Statement">
          <PrivacyStatement />
        </div>
        <label className="mt-6 flex cursor-pointer items-start gap-3 text-sm text-ink-100">
          <input type="checkbox" checked={form.privacy_consent} onChange={(e) => update("privacy_consent", e.target.checked)} className="mt-0.5 size-4 accent-brand-600"/>
          I have read the Data Privacy Statement and consent to the collection and processing of my personal information for this
          promo.
        </label>
        <div className="mt-6 flex justify-end">
          <Button size="lg" disabled={!form.privacy_consent} onClick={() => setStep("form")}>
            Continue <ArrowRight className="size-4" aria-hidden/>
          </Button>
        </div>
      </Card>);
    }
    /* ------------------------------ Step 3: done ----------------------------- */
    if (step === "done" && receipt) {
        return (<Card className="p-6 text-center sm:p-10">
        <CheckCircle2 className="mx-auto size-14 text-success-400" aria-hidden/>
        <h2 className="mt-4 text-2xl font-bold text-heading">Registration received</h2>
        <p className="mx-auto mt-3 max-w-md text-ink-300">
          Complete full payment for your iPhone at your selected branch to qualify for the freebies and the electronic raffle.
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-400" role="status">
          {receipt.email_sent
                ? "Your ticket number was also sent to your e-mail."
                : "We couldn't send the confirmation e-mail, so please keep the ticket number below."}
        </p>
        <dl className="mx-auto mt-6 max-w-sm space-y-2 rounded-xl bg-ink-850 p-4 text-left text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-ink-400">Reference number</dt>
            <dd className="flex items-center gap-2 font-semibold text-heading">
              {receipt.reference_number}
              <button type="button" className="text-ink-400 hover:text-heading" aria-label="Copy reference number" onClick={() => void navigator.clipboard?.writeText(receipt.reference_number)}>
                <Copy className="size-4" aria-hidden/>
              </button>
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-400">Ticket number</dt>
            <dd className="flex items-center gap-2 font-mono text-xs font-semibold text-heading sm:text-sm">
              {receipt.ticket_code}
              <button type="button" className="text-ink-400 hover:text-heading" aria-label="Copy ticket number" onClick={() => void navigator.clipboard?.writeText(receipt.ticket_code)}>
                <Copy className="size-4" aria-hidden/>
              </button>
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-400">Registered</dt>
            <dd className="text-heading">{formatDateTime(receipt.registered_at)}</dd>
          </div>
        </dl>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/promo-mechanics" variant="secondary">
            Review the mechanics
          </ButtonLink>
          <ButtonLink href="/participating-branches" variant="secondary">
            Find your branch
          </ButtonLink>
        </div>
      </Card>);
    }
    /* ------------------------------ Step 2: form ----------------------------- */
    return (<Card className="p-6 sm:p-8">
      <StepLabel current={2}/>
      <h2 className="mt-2 text-2xl font-bold text-heading">Your order details</h2>
      <p className="mt-1 text-sm text-ink-400">
        All fields are required. <span aria-hidden className="text-brand-400">*</span>
      </p>

      <form ref={formRef} onSubmit={onSubmit} noValidate className="mt-6 space-y-8">
        {formError && <ErrorMessage title="Registration not submitted" message={formError}/>}

        <fieldset className="grid gap-5 sm:grid-cols-2">
          <legend className="mb-4 text-sm font-semibold uppercase tracking-wider text-ink-300">Contact information</legend>
          <Field id="full_name" label="Full name" required error={err("full_name")} className="sm:col-span-2">
            <TextInput id="full_name" name="full_name" autoComplete="name" value={form.full_name} onChange={(e) => update("full_name", e.target.value)} aria-invalid={!!err("full_name")} aria-describedby={describedBy("full_name", err("full_name"))} maxLength={150}/>
          </Field>
          <Field id="email" label="Email" required error={err("email")}>
            <TextInput id="email" name="email" type="email" autoComplete="email" value={form.email} onChange={(e) => update("email", e.target.value)} aria-invalid={!!err("email")} aria-describedby={describedBy("email", err("email"))}/>
          </Field>
          <Field id="contact_number" label="Contact number" required error={err("contact_number")} hint="e.g. 0917 123 4567">
            <TextInput id="contact_number" name="contact_number" type="tel" autoComplete="tel" inputMode="tel" value={form.contact_number} onChange={(e) => update("contact_number", e.target.value)} aria-invalid={!!err("contact_number")} aria-describedby={describedBy("contact_number", err("contact_number"), true)}/>
          </Field>
          <Field id="address" label="Complete address" required error={err("address")} hint="Prizes for online purchases are delivered to this address." className="sm:col-span-2">
            <TextArea id="address" name="address" autoComplete="street-address" value={form.address} onChange={(e) => update("address", e.target.value)} aria-invalid={!!err("address")} aria-describedby={describedBy("address", err("address"), true)} maxLength={500}/>
          </Field>
        </fieldset>

        <fieldset className="grid gap-5 sm:grid-cols-2">
          <legend className="mb-4 text-sm font-semibold uppercase tracking-wider text-ink-300">Purchase</legend>
          <Field id="unit" label="Participating unit" required error={err("unit")}>
            <Select id="unit" name="unit" value={form.unit} onChange={(e) => update("unit", e.target.value)} aria-invalid={!!err("unit")} aria-describedby={describedBy("unit", err("unit"))}>
              <option value="">Select unit</option>
              {promotion.units.map((u) => (<option key={u} value={u}>
                  {u}
                </option>))}
            </Select>
          </Field>
          <Field id="branch_id" label="Participating branch" required error={err("branch_id")}>
            <Select id="branch_id" name="branch_id" value={form.branch_id} onChange={(e) => update("branch_id", e.target.value)} aria-invalid={!!err("branch_id")} aria-describedby={describedBy("branch_id", err("branch_id"))}>
              <option value="">Select branch</option>
              {branchGroups.map((g) => (<optgroup key={g.region} label={g.region}>
                  {g.items.map((b) => (<option key={b.id} value={String(b.id)}>
                      {b.is_online ? "Website - WhiteHaus" : `WhiteHaus - ${b.name}`}
                    </option>))}
                </optgroup>))}
            </Select>
          </Field>
          <Field id="purchase_date" label="Purchase date" required error={err("purchase_date")} hint="Within the promo period.">
            <TextInput id="purchase_date" name="purchase_date" type="date" min={promotion.period_start} max={maxDate} value={form.purchase_date} onChange={(e) => update("purchase_date", e.target.value)} aria-invalid={!!err("purchase_date")} aria-describedby={describedBy("purchase_date", err("purchase_date"), true)}/>
          </Field>
          <Field id="reference_number" label="Reference number" required error={err("reference_number")} hint="Order or receipt reference.">
            <TextInput id="reference_number" name="reference_number" autoComplete="off" value={form.reference_number} onChange={(e) => update("reference_number", e.target.value)} aria-invalid={!!err("reference_number")} aria-describedby={describedBy("reference_number", err("reference_number"), true)} maxLength={100}/>
          </Field>

          <Field id="proof_of_purchase" label="Proof of purchase image" required error={err("proof_of_purchase")} hint="JPG, PNG or PDF, up to 2 MB." className="sm:col-span-2">
            <label htmlFor="proof_of_purchase" className="flex cursor-pointer items-center gap-4 rounded-xl border border-dashed border-ink-600 bg-ink-850 p-4 hover:border-ink-400 focus-within:border-brand-400">
              <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-ink-800 text-brand-400">
                <Upload className="size-5" aria-hidden/>
              </span>
              <span className="min-w-0 text-sm">
                <span className="block truncate font-medium text-heading">
                  {form.proof_of_purchase ? form.proof_of_purchase.name : "Choose an image"}
                </span>
                <span className="text-ink-400">
                  {form.proof_of_purchase ? `${(form.proof_of_purchase.size / 1024 / 1024).toFixed(2)} MB` : "Receipt or order confirmation"}
                </span>
              </span>
              <input id="proof_of_purchase" name="proof_of_purchase" type="file" accept="image/jpeg,image/png,application/pdf,.jpg,.jpeg,.png,.pdf" className="sr-only" onChange={(e) => update("proof_of_purchase", e.target.files?.[0] ?? null)} aria-invalid={!!err("proof_of_purchase")} aria-describedby={describedBy("proof_of_purchase", err("proof_of_purchase"), true)}/>
            </label>
          </Field>
        </fieldset>

        <div>
          <label className="flex cursor-pointer items-start gap-3 text-sm text-ink-100">
            <input type="checkbox" name="terms" checked={form.terms} onChange={(e) => update("terms", e.target.checked)} className="mt-0.5 size-4 accent-brand-600" aria-invalid={!!err("terms")} aria-describedby={err("terms") ? "terms-error" : undefined}/>
            <span>
              By ticking this box I have read and agree to the{" "}
              <Link href="/promo-mechanics" target="_blank" className="font-semibold text-brand-300 underline-offset-4 hover:underline">
                terms and conditions
              </Link>
              . <span className="text-brand-400">*</span>
            </span>
          </label>
          {err("terms") && (<p id="terms-error" className="mt-1.5 text-xs font-medium text-brand-300">
              {err("terms")}
            </p>)}
          {err("privacy_consent") && <p className="mt-1.5 text-xs font-medium text-brand-300">{err("privacy_consent")}</p>}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-ink-800 pt-6 sm:flex-row sm:justify-between">
          <Button variant="ghost" onClick={() => setStep("privacy")} disabled={submitting}>
            <ArrowLeft className="size-4" aria-hidden/> Back
          </Button>
          <Button type="submit" size="lg" disabled={submitting} aria-busy={submitting}>
            {submitting ? "Submitting…" : "Submit registration"}
          </Button>
        </div>
      </form>
    </Card>);
}
function StepLabel({ current }) {
    return (<p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-brand-400">
      Step {current} of 2 · {current === 1 ? "Privacy consent" : "Registration form"}
    </p>);
}
