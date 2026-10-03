import "server-only";
import type { Document } from "mongodb";
import { getDb, hasDb } from "@/lib/mongodb";

// --- Types -------------------------------------------------------------------
// What the component renders. Documents in the `designnotes` collection are checked against this
// shape in toDesignNote() below, because TypeScript can't verify what the database really returns.

type NoteLink = { href: string; label: string; category: string };

export type DesignNote = {
  id: string;
  dateLabel: string | null; // e.g. "10.02.2026", or null when the stored date is missing or invalid
  note: string;
  links: NoteLink[];
};

// --- Data --------------------------------------------------------------------

const COLLECTION = "designnotes";
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

const isStr = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;
// Only web and mail links are allowed, so a bad database value can't become a javascript: link.
const safeHref = (v: unknown) => (typeof v === "string" && /^(https?:\/\/|mailto:)/i.test(v) ? v : null);

const dateFormat = new Intl.DateTimeFormat("en-US", {
  month: "2-digit",
  day: "2-digit",
  year: "numeric",
  timeZone: "UTC",
});

function formatDate(value: unknown): string | null {
  if (value == null) return null;
  const d = new Date(value as string | number | Date);
  return Number.isNaN(d.getTime()) ? null : dateFormat.format(d).replace(/\//g, ".");
}

// Stored shape: { _id, note, datenoted, links: { hrefs: [[url, text, category], ...] } }
export function toDesignNote(doc: Document): DesignNote | null {
  if (!isStr(doc.note)) return null;
  const hrefs: unknown[] = Array.isArray(doc.links?.hrefs) ? doc.links.hrefs : [];
  const links = hrefs.flatMap((entry): NoteLink[] => {
    if (!Array.isArray(entry)) return [];
    const [url, text, category] = entry;
    const href = safeHref(url);
    return href && isStr(text) ? [{ href, label: text, category: isStr(category) ? category : "" }] : [];
  });
  return { id: String(doc._id), dateLabel: formatDate(doc.datenoted), note: doc.note, links };
}

async function getDesignNotes(limit: number): Promise<DesignNote[]> {
  if (!hasDb) return []; // same idea as the projects and products fallbacks: no database, nothing to show
  // limit(0) means "no limit" and a negative limit behaves oddly in MongoDB, so keep it in range.
  const count = Math.min(Math.max(Math.trunc(limit) || DEFAULT_LIMIT, 1), MAX_LIMIT);
  const db = await getDb();
  const docs = await db
    .collection(COLLECTION)
    .find({}, { projection: { note: 1, datenoted: 1, links: 1 } })
    .sort({ order: 1, datenoted: -1 })
    .limit(count)
    .toArray();
  return docs.map(toDesignNote).filter((n): n is DesignNote => n !== null);
}

// --- Component ---------------------------------------------------------------

export async function DesignNotes({ limit = DEFAULT_LIMIT }: { limit?: number }) {
  const notes = await getDesignNotes(limit);
  if (notes.length === 0) return null;

  return (
    <>
      {/* h2, because the About page already has an h1 */}
      <h2>My Design Notes</h2>
      <section className="designnotes">
        {notes.map((n) => (
          <article key={n.id}>
            <p>
              {n.dateLabel && (
                <>
                  <strong>{n.dateLabel}</strong>
                  <br />
                </>
              )}
              {n.note}
            </p>
            <ul className="note">
              {n.links.map((l, i) => (
                <li key={`${l.href}-${i}`}>
                  {l.category && <span className="category">{l.category}</span>}&#8594;
                  <span className="linktext">
                    <a className="weblink" href={l.href}>
                      {l.label}
                    </a>
                  </span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </>
  );
}
