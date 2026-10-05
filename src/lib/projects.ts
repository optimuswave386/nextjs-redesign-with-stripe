import { Int32, NumericType } from "mongodb";
import seed from "../../data/projects.json";

export type Project = {
  slug: string;
  title: string;
  summary: string;
  year: string;
  status: "Live" | "In progress" | "Archived";
  tags: string[];
  links: { label: string; href: string }[];
  description: string[];
  image: string;
  index: string;
};

export const PROJECT_STATUSES: Project["status"][] = ["Live", "In progress", "Archived"];

// Used when MONGODB_URI isn't set, and as the source for `npm run seed`.
export const fallbackProjects = seed as Project[];
