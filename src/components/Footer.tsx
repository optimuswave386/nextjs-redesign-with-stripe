import Link from "next/link";
import { nav, site } from "@/lib/site";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div>
          <p className="footer-name">{site.title}</p>
          <p className="muted small">© {new Date().getFullYear()}. All rights reserved.</p>
        </div>
        <nav aria-label="Footer" className="footer-links">
          {nav.map((n) => (
            <Link key={n.href} href={n.href}>
              {n.label}
            </Link>
          ))}
        </nav>
        <ul className="footer-links" aria-label="Elsewhere">
          {site.socials.map((s) => (
            <li key={s.label}>
              <a href={s.href} target="_blank" rel="noreferrer">
                {s.label}
              </a>
            </li>
          ))}
        </ul>
        <p className="muted small footer-credit">
          Sky photograph from NASA&rsquo;s{" "}
          <a href="https://apod.nasa.gov/apod/" target="_blank" rel="noreferrer">
            Astronomy Picture of the Day
          </a>
          . <br />Credit belongs to each image&rsquo;s author
          . <br />Site generated with Claude
        </p>
      </div>
    </footer>
  );
}
