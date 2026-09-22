"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { nav, site } from "@/lib/site";
import { useCart } from "./CartProvider";
import { useTheme } from "./ThemeProvider";
import { CartIcon, CloseIcon, MenuIcon, UserIcon } from "./Icons";

function ThemeSelect() {
  const { themes, theme, setThemeId, status } = useTheme();
  const dark = themes.filter((t) => t.mode === "dark");
  const light = themes.filter((t) => t.mode === "light");

  return (
    <label className="theme-select">
      <span
        className="theme-dot"
        style={{ background: theme?.swatch ?? "var(--accent)" }}
        aria-hidden="true"
      />
      <span className="sr-only">Site theme</span>
      <select
        value={theme?.id ?? ""}
        onChange={(e) => setThemeId(e.target.value)}
        disabled={themes.length === 0}
        aria-busy={status === "loading"}
      >
        {themes.length === 0 && <option value="">Loading colours…</option>}
        <optgroup label="Dark">
          {dark.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </optgroup>
        <optgroup label="Light">
          {light.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </optgroup>
      </select>
    </label>
  );
}

export function Header() {
  const pathname = usePathname();
  const { count, ready } = useCart();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="site-header">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <div className="header-inner">
        <Link href="/" className="brand" onClick={() => setOpen(false)}>
          {site.title}
        </Link>

        <nav className={`nav ${open ? "is-open" : ""}`} aria-label="Main">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <div className="nav-theme">
            <span className="muted">Theme colours</span>
            <ThemeSelect />
          </div>
        </nav>

        <div className="header-tools">
          <div className="tools-theme">
            <ThemeSelect />
          </div>
          <Link href="/cart" className="icon-link" aria-label={`Cart, ${ready ? count : 0} items`}>
            <CartIcon />
            {ready && count > 0 && <span className="badge">{count}</span>}
          </Link>
          <Link href="/profile" className="icon-link" aria-label="Your profile">
            <UserIcon />
          </Link>
          <button
            type="button"
            className="icon-link menu-toggle"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>
    </header>
  );
}
