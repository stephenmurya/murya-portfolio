import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { getAllProjects } from "@/lib/cms/api";

export const dynamic = "force-dynamic";

const analyticsUrl = "https://vercel.com/stephenmurya/murya/analytics";

export default async function AdminPage() {
  const projects = await getAllProjects();

  return (
    <AdminDashboard
      initialProjects={projects}
      analyticsUrl={analyticsUrl}
    />
  );
}
