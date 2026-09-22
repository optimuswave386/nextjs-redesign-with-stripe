import type { Metadata } from "next";
import { ReportIssue } from "@/components/ReportIssue";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Help center" };

const faqs = [
  {
    q: "How do I change the site colours?",
    a: "Use the colour menu in the header. Its options are sampled from NASA’s photograph of the day, in a dark and a light version of each shade. Your choice is remembered on this device.",
  },
  {
    q: "Why did the colours change overnight?",
    a: "NASA publishes a new photograph every day. If your chosen shade isn’t in today’s photo, the site picks the closest match in the same light or dark setting.",
  },
  {
    q: "The header photo isn’t showing.",
    a: "The photo comes from NASA, which occasionally rate-limits requests or shows a video instead of an image. The site falls back to its default colours and switches over when NASA responds. Reloading the page in a few minutes usually fixes it.",
  },
  {
    q: "Where did my cart go?",
    a: "Your cart is saved in this browser. It won’t follow you to another device, and clearing your browsing data removes it.",
  },
  {
    q: "Where can I see my past orders?",
    a: "On your profile page, under Orders.",
  },
];

export default function HelpPage() {
  return (
    <div className="container">
      <header className="page-head">
        <h1>Help center</h1>
        <p>Quick answers first. If your problem isn&rsquo;t covered, tell us what happened.</p>
      </header>

      <div className="help-cta">
        <ReportIssue />
        <span className="muted">
          Or email <a href={`mailto:${site.email}`}>{site.email}</a>.
        </span>
      </div>

      <section className="faq" aria-label="Frequently asked questions" style={{ marginBottom: "clamp(56px, 8vw, 112px)" }}>
        {faqs.map((f) => (
          <details key={f.q}>
            <summary>{f.q}</summary>
            <p>{f.a}</p>
          </details>
        ))}
      </section>
    </div>
  );
}
