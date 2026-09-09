import { AdminDashboard } from "@/components/admin-dashboard";
import {
  getAdminContent,
  getAdminReports,
  getAdminStats,
  getAdminUsers,
} from "@/lib/actions/admin";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [stats, users, reports, content] = await Promise.all([
    getAdminStats(),
    getAdminUsers(),
    getAdminReports(),
    getAdminContent(),
  ]);

  return (
    <AdminDashboard
      stats={stats}
      users={users}
      reports={reports}
      posts={content.posts}
      replies={content.replies}
    />
  );
}
