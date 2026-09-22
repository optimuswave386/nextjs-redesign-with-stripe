import Link from "next/link";
import { Hero } from "@/components/Hero";
import { Intro } from "@/components/Intro";
import { SkyNote } from "@/components/SkyNote";
import { ProjectRowLink } from "@/components/ProjectRow";
import { ProductTile } from "@/components/ProductTile";
import { getProducts, getProjects } from "@/lib/data";

// Rebuild the page in the background at most once a minute, so database edits show up quickly.
export const revalidate = 60;

export default async function Home() {
  // If the database is down the sections quietly disappear instead of breaking the frontpage.
  const [projects, products] = await Promise.all([
    getProjects().catch((e) => (console.error("[home] projects", e), [])),
    getProducts().catch((e) => (console.error("[home] products", e), [])),
  ]);

  return (
    <>
      <Hero />
      <Intro />

      {projects.length > 0 && (
        <section className="section container" aria-labelledby="work-title">
          <div className="section-head">
            <h2 id="work-title">Selected work</h2>
            <Link href="/portfolio">All projects</Link>
          </div>
          <ul className="work-list">
            {projects.slice(0, 3).map((p) => (
              <ProjectRowLink key={p.slug} project={p} />
            ))}
          </ul>
        </section>
      )}

      {products.length > 0 && (
        <section className="section container" aria-labelledby="shop-title">
          <div className="section-head">
            <h2 id="shop-title">From the shop</h2>
            <Link href="/products">Browse everything</Link>
          </div>
          <ul className="product-grid">
            {products.slice(0, 3).map((p, i) => (
              <ProductTile key={p.id} product={p} index={i} />
            ))}
          </ul>
        </section>
      )}

      <section className="section container" aria-labelledby="sky-title">
        <div className="section-head">
          <h2 id="sky-title">Where the colours come from</h2>
        </div>
        <p className="muted">
          Every colour on this site is sampled from NASA&rsquo;s photograph of the day. Pick a different
          shade from the menu at the top to change the theme.
        </p>
        <SkyNote />
      </section>
    </>
  );
}
