"use client";
import { useRef, useState, type FormEvent } from "react";
import { HELP_CATEGORIES, HELP_PAGES, HELP_SEVERITIES } from "@/lib/help";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { CloseIcon } from "./Icons";
import { useTheme } from "./ThemeProvider";

type Status = "idle" | "sending" | "sent";
type Profile = { name?: string; email?: string };

export function ReportIssue() {
  const dialog = useRef<HTMLDialogElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [ticket, setTicket] = useState("");
  const [profile] = useLocalStorage<Profile>("profile-v1", {});
  const { theme, apod } = useTheme();

  function open() {
    form.current?.reset();
    setStatus("idle");
    setErrors({});
    setFormError("");
    dialog.current?.showModal();
    requestAnimationFrame(() => form.current?.querySelector<HTMLInputElement>("input[name=name]")?.focus());
  }
  const close = () => dialog.current?.close();

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const get = (k: string) => String(fd.get(k) ?? "");

    setStatus("sending");
    setErrors({});
    setFormError("");

    try {
      const res = await fetch("/api/help", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: get("name"),
          email: get("email"),
          category: get("category"),
          page: get("page"),
          severity: get("severity"),
          description: get("description"),
          company: get("company"), // honeypot
          diagnostics: fd.get("diagnostics")
            ? {
                browser: navigator.userAgent,
                language: navigator.language,
                screen: `${window.innerWidth}x${window.innerHeight}`,
                theme: theme?.id ?? "none",
                photoDate: apod?.date ?? "none",
              }
            : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors(data.errors ?? {});
        setFormError(data.error ?? "Something went wrong. Try again.");
        setStatus("idle");
        return;
      }
      setTicket(data.ticketId);
      setStatus("sent");
    } catch {
      setFormError("We couldn't reach the server. Check your connection and try again.");
      setStatus("idle");
    }
  }

  const invalid = (k: string) => (errors[k] ? true : undefined);

  return (
    <>
      <button type="button" className="btn" onClick={open}>
        Report a problem
      </button>

      <dialog
        ref={dialog}
        className="modal"
        aria-labelledby="report-title"
        onClick={(e) => e.target === e.currentTarget && close()}
      >
        <div className="modal-body">
          {status === "sent" ? (
            <div>
              <div className="modal-head">
                <h2 id="report-title">Thanks, we&rsquo;ve got it</h2>
                <button type="button" className="icon-link" aria-label="Close" onClick={close}>
                  <CloseIcon />
                </button>
              </div>
              <p>
                Your report is logged as <span className="ticket">{ticket}</span>. Keep that reference if you
                contact us again.
              </p>
              <div className="modal-actions">
                <button type="button" className="btn" onClick={close}>
                  Close
                </button>
              </div>
            </div>
          ) : (
            <form ref={form} onSubmit={onSubmit} noValidate>
              <div className="modal-head">
                <h2 id="report-title">Report a problem</h2>
                <button type="button" className="icon-link" aria-label="Close" onClick={close}>
                  <CloseIcon />
                </button>
              </div>
              <p className="muted">Tell us what went wrong and we&rsquo;ll look into it.</p>

              <div className="field-row">
                <div className="field">
                  <label htmlFor="r-name">Name</label>
                  <input id="r-name" name="name" autoComplete="name" defaultValue={profile.name ?? ""} required aria-invalid={invalid("name")} />
                  {errors.name && <span className="error">{errors.name}</span>}
                </div>
                <div className="field">
                  <label htmlFor="r-email">Email</label>
                  <input id="r-email" name="email" type="email" autoComplete="email" defaultValue={profile.email ?? ""} required aria-invalid={invalid("email")} />
                  {errors.email && <span className="error">{errors.email}</span>}
                </div>
              </div>

              <div className="field-row">
                <div className="field">
                  <label htmlFor="r-category">What kind of problem is it?</label>
                  <select id="r-category" name="category" defaultValue="" required aria-invalid={invalid("category")}>
                    <option value="" disabled>
                      Choose one
                    </option>
                    {HELP_CATEGORIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                  {errors.category && <span className="error">{errors.category}</span>}
                </div>
                <div className="field">
                  <label htmlFor="r-page">Where did it happen?</label>
                  <select id="r-page" name="page" defaultValue="" required aria-invalid={invalid("page")}>
                    <option value="" disabled>
                      Choose a page
                    </option>
                    {HELP_PAGES.map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                  {errors.page && <span className="error">{errors.page}</span>}
                </div>
              </div>

              <fieldset className="field">
                <legend>How much does it affect you?</legend>
                {HELP_SEVERITIES.map((s) => (
                  <label key={s.value} className="choice">
                    <input type="radio" name="severity" value={s.value} required />
                    {s.label}
                  </label>
                ))}
                {errors.severity && <span className="error">{errors.severity}</span>}
              </fieldset>

              <div className="field">
                <label htmlFor="r-description">What happened?</label>
                <textarea
                  id="r-description"
                  name="description"
                  required
                  minLength={10}
                  placeholder="What you did, what you expected, and what you saw instead."
                  aria-invalid={invalid("description")}
                />
                {errors.description && <span className="error">{errors.description}</span>}
              </div>

              <div className="field">
                <label className="choice">
                  <input type="checkbox" name="diagnostics" defaultChecked />
                  Include my browser, screen size and theme so you can reproduce it
                </label>
              </div>

              {/* Honeypot: hidden from people, tempting to bots. */}
              <div className="hp" aria-hidden="true">
                <label>
                  Company
                  <input name="company" tabIndex={-1} autoComplete="off" />
                </label>
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn" disabled={status === "sending"}>
                  {status === "sending" ? "Sending…" : "Send report"}
                </button>
                <button type="button" className="btn btn-ghost" onClick={close}>
                  Cancel
                </button>
              </div>
              <p className="form-status" role="alert">
                {formError}
              </p>
            </form>
          )}
        </div>
      </dialog>
    </>
  );
}
