import Link from "next/link";
import type { Project } from "@/lib/projects";

// Compact version for the home page: the whole row links to the portfolio entry.
export function ProjectRowLink({ project }: { project: Project }) {
  return (
    <li>
      <Link href={`/portfolio#${project.slug}`} className="work-row">
        <span className="work-year">{project.year}</span>
        <div>
          <h3 className="work-title">{project.title}</h3>
          <p className="work-summary">{project.summary}</p>
        </div>
      </Link>
    </li>
  );
}

// Full version for the portfolio page.
export function ProjectRowFull({ project }: { project: Project }) {
  return (
    <li id={project.slug} className="work-row">
      <span className="work-year">{project.year}</span>
      <div>
        <p className="work-status">{project.status}</p>
        <h2 className="work-title">{project.title}</h2>
        <p className="work-summary">{project.summary}</p>
        <p className="work-meta">Built with {project.tags.join(", ")}</p>
        <p className="work-more"><Link className="small" href={`/portfolio/${project.slug}`}>More...</Link></p>
      </div>
      <div className="work-links">
        {project.links.map((l) => (
          <a key={l.label} href={l.href} target="_blank" rel="noreferrer">
            {l.label}
          </a>
        ))}
      </div>
    </li>
  );
}
