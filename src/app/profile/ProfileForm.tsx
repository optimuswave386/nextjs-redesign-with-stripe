"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type Profile = {
  name: string;
  email: string;
  address: string;
  city: string;
  zipcode: string;
  phone: string;
};

const FIELDS: { name: keyof Omit<Profile, "email">; label: string; autoComplete: string }[] = [
  { name: "name", label: "Full name", autoComplete: "name" },
  { name: "address", label: "Street address", autoComplete: "street-address" },
  { name: "city", label: "City", autoComplete: "address-level2" },
  { name: "zipcode", label: "Postal code", autoComplete: "postal-code" },
  { name: "phone", label: "Phone", autoComplete: "tel" },
];

export function ProfileForm({ initial }: { initial: Profile }) {
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const updates = Object.fromEntries(FIELDS.map((f) => [f.name, String(fd.get(f.name) ?? "").trim()]));

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Could not save your details.");
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your details.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} onChange={() => setSaved(false)}>
      <div className="field">
        <label htmlFor="p-email">Email</label>
        <input id="p-email" type="email" value={initial.email} disabled />
      </div>
      {FIELDS.map((f) => (
        <div className="field" key={f.name}>
          <label htmlFor={`p-${f.name}`}>{f.label}</label>
          <input
            id={`p-${f.name}`}
            name={f.name}
            type="text"
            autoComplete={f.autoComplete}
            defaultValue={initial[f.name]}
          />
        </div>
      ))}
      <button type="submit" className="btn" disabled={busy}>
        Save details
      </button>
      <p className="form-status" role="status">
        {error || (saved ? "Saved." : "")}
      </p>
    </form>
  );
}
