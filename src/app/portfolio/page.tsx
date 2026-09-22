import type { Metadata } from "next";
import { ProjectRowFull } from "@/components/ProjectRow";
import { getProjects } from "@/lib/data";
import type { Project } from "@/lib/projects";

export const metadata: Metadata = { title: "Portfolio" };
export const revalidate = 60;

export default async function PortfolioPage() {
  let projects: Project[] | null = null;
  try {
    projects = await getProjects();
  } catch (e) {
    console.error("[portfolio]", e);
  }

  return (
    <div className="container">
      <header className="page-head">
        <h1>Portfolio</h1>
        <p>What I&rsquo;m building now, and what I&rsquo;ve built before. Newest first.</p>
      </header>
      {projects === null ? (
        <div className="empty">
          <p>My projects couldn&rsquo;t load just now. Reload the page in a moment.</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="empty">
          <p>Projects are on their way.</p>
        </div>
      ) : (
        <ul className="work-list" style={{ marginBottom: "clamp(56px, 8vw, 112px)" }}>
          {projects.map((p) => (
            <ProjectRowFull key={p.slug} project={p} />
          ))}
        </ul>
      )}
    </div>
  );
}
