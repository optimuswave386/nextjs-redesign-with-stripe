import "server-only";
import type { Document } from "mongodb";
import { getDb, hasDb } from "./mongodb";
import { fallbackProjects, PROJECT_STATUSES, type Project } from "./projects";
import { fallbackProducts, PRODUCT_KINDS, TAX_CODES, type Product } from "./products";

// Collection names. Change these if your database uses different ones.
const PROJECTS = "projects";
const PRODUCTS = "products";

const isStr = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;
const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
// Only web and mail links are allowed, so a bad database value can't become a javascript: link.
const safeHref = (v: unknown) => (typeof v === "string" && /^(https?:\/\/|mailto:)/i.test(v) ? v : null);

// --- Adapt these two functions if your documents are shaped differently. ---

export function toProject(doc: Document): Project | null {
  if (!isStr(doc.title)) return null;
  const links = Array.isArray(doc.links)
    ? doc.links.flatMap((l: Document) => {
        const href = safeHref(l?.href);
        return href && isStr(l?.label) ? [{ label: String(l.label), href }] : [];
      })
    : [];
  return {
    slug: isStr(doc.slug) ? doc.slug : slugify(doc.title),
    title: doc.title,
    index: doc.index,
    summary: isStr(doc.summary) ? doc.summary : "",
    year: doc.year != null ? String(doc.year) : "",
    status: PROJECT_STATUSES.includes(doc.status) ? doc.status : "Live",
    tags: Array.isArray(doc.tags) ? doc.tags.filter(isStr) : [],
    description: Array.isArray(doc.description) ? doc.description.filter(isStr) : [],
    image: isStr(doc.image) ? doc.image : "",
    links,
  };
}

export function toProduct(doc: Document): Product | null {
  const id = isStr(doc.id) ? doc.id : isStr(doc.slug) ? doc.slug : doc._id != null ? String(doc._id) : "";
  const price = Number(doc.price);
  if (!id || !isStr(doc.name) || !Number.isFinite(price) || price < 0) return null;
  return {
    id,
    name: doc.name,
    blurb: isStr(doc.blurb) ? doc.blurb : "",
    price: Math.round(price), // cents
    kind: PRODUCT_KINDS.includes(doc.kind) ? doc.kind : "digital",
    imgUrl: doc.imgUrl,
    tax_code: TAX_CODES.includes(doc.tax_code) ? doc.tax_code : "txcd_10103000" //digital only
  };
}

// ---------------------------------------------------------------------------

let warned = false;
function warnNoDb() {
  if (!warned) {
    warned = true;
    console.warn("[data] MONGODB_URI is not set, so the built-in sample projects and products are being used.");
  }
}

export async function getProjectForSlug(slug: string): Promise<Project[]> {
  if (!hasDb) {
    warnNoDb();
    return fallbackProjects;
  }
  const db = await getDb();
  const docs = await db.collection(PROJECTS).find({slug: slug}).sort({ order: 1, year: -1 }).toArray();
  return docs.map(toProject).filter((p): p is Project => p !== null);
}

export async function getProjects(): Promise<Project[]> {
  if (!hasDb) {
    warnNoDb();
    return fallbackProjects;
  }
  const db = await getDb();
  const docs = await db.collection(PROJECTS).find({}).sort({ order: 1, year: -1 }).toArray();
  return docs.map(toProject).filter((p): p is Project => p !== null);
}

export async function getProducts(): Promise<Product[]> {
  if (!hasDb) {
    warnNoDb();
    return fallbackProducts;
  }
  const db = await getDb();
  const docs = await db.collection(PRODUCTS).find({}).sort({ order: 1, name: 1 }).toArray();
  return docs.map(toProduct).filter((p): p is Product => p !== null);
}
