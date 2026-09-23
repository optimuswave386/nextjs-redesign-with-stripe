"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);

    try {
      if (mode === "signup") {
        const res = await fetch("/api/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Could not create that account.");
          return;
        }
      }

      const res = await signIn("credentials", { email, password, redirect: false });
      if (res?.error) {
        setError("Invalid email or password");
      } else {
        router.push("/profile");
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <fieldset className="field">      
      {mode === "signup" && (
        <>
        <h1 style={{ paddingBottom: '10px' }}>Signup</h1>
        <input className="field" value={name} onChange={(e) => setName(e.target.value)} type="text" placeholder="Full name" />
        </>
      )}
      {mode === "login" && (
        <>
        <h1 style={{ paddingBottom: '10px' }}>Login</h1>
        </>
      )}
      <input className="field" value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" required />
      <input className="field" 
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        type="password"
        placeholder="Password"
        minLength={8}
        required
      />
      {error && <p role="alert">{error}</p>}
      <button type="submit" disabled={busy} className="btn">
        {mode === "login" ? "Log in" : "Create account"}
      </button>
      <button type="button" onClick={() => setMode(mode === "login" ? "signup" : "login")} className="btn btn-ghost">
        {mode === "login" ? "Need an account? Sign up" : "Already have an account? Log in"}
      </button>
      </fieldset>
    </form>
  );
}
