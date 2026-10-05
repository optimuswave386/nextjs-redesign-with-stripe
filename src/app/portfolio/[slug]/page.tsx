
import Image from 'next/image'
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProjectForSlug } from "@/lib/data";
import type { Project } from "@/lib/projects";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getProject(slug: string) {
    let project: Project[] | null = null;
    try {
        project = await getProjectForSlug(slug);
    } catch (e) {
        console.error("[portfolio]", e);
        return null;
    }
    return project;
}

export default async function PortfolioSubpage({params}: PageProps) {

    const resolvedParams = await params;
    const slug = resolvedParams.slug;
    
    let project: Project[] | null = null;
    project = await getProject(slug);
    
    if (!project  || project.length === 0) {
        notFound();
    }

    //console.log(project);

    return (
    <div className='container'>
    { project && project.length > 0 ? (
      <>
      <header className="page-head">
        <h2>Project: {project[0].title}</h2>
      </header>
      <div style={{ marginBottom: "clamp(56px, 8vw, 112px)" }}>        
        <p>{ project[0].description?.join(" ") }</p>
        <Image src={`/assets/images/projects/${project[0].image}`} alt={project[0].title} 
          width={768} height={450} 
          style={{ maxWidth: "100%", width: "auto", height: "auto", marginTop: "1rem" }}
          loading="eager"
        />
      </div>
      </>
      ) : (
      <>
      <header className="page-head">
        <h2>Error: {slug}</h2>
      </header>
      <div style={{ marginBottom: "clamp(56px, 8vw, 112px)" }}>
        <p>Sorry, we couldn't find a project for <strong>{slug}</strong>.</p>
        <Link 
          href="/portfolio" 
          style={{ textDecoration: 'none' }}
        >
          View All Projects
        </Link>
      </div>
      </>
        )}
    </div>
  );

}
