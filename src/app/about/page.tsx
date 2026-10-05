import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";
import { DesignNotes } from "@/components/DesignNotes";

export const metadata: Metadata = { title: "About" };

// Nothing on this page is per-request, so Next would build it once and the notes would never change.
// This re-fetches them from the database at most once an hour.
export const revalidate = 3600;

export default function AboutPage() {
  return (
    <div className="container">
      <header className="page-head">
        <h1>About me</h1>
        <p>
          {site.name}, based in {site.location}.
        </p>
      </header>

      <div className="about-grid">
        <div>
          {site.bio.map((para) => (
            <p key={para}>{para}</p>
          ))}
          <p>
            Want to talk about a project, or have a question? Write to{" "}
            <a href={`mailto:${site.email}`}>{site.email}</a>, or find me on the sites listed on the right.
            If something on this site isn&rsquo;t working, use the <Link href="/help">help center</Link>.
          </p>

          <div className="about-designnotes">
            <DesignNotes limit={50} />
          </div>

        </div>

        <aside className="facts">
          <h2>What I&rsquo;m into</h2>
          <ul>
            {site.interests.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
          <h2>What I build with</h2>
          <ul>
            {site.stack.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
          <h2>Elsewhere</h2>
          <ul>
            {site.socials.map((s) => (
              <li key={s.label}>
                <a href={s.href} target="_blank" rel="noreferrer">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
