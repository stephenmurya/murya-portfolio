import type { Metadata } from "next";
import { WorkDirectory } from "@/components/work/WorkDirectory";
import { getAllProjects } from "@/lib/cms/api";

export const metadata: Metadata = {
  title: "Work | Stephen Murya",
  description:
    "Explore a curated selection of projects by Stephen Murya, ranging from Product Design to Game Development.",
};

export default async function WorkPage() {
  const projects = await getAllProjects();

  return <WorkDirectory projects={projects} />;
}
