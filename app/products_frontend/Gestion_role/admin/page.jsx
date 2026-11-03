import { requireRole } from "@backend/auth/session";
import { getAdminDashboardData } from "@backend/features/dashboard/dashboard.queries";
import AdminDashboard from "@frontend/features/dashboard/AdminDashboard";

export default async function AdminPage() {
    const user = await requireRole("admin");
    const dashboard = await getAdminDashboardData(user.id);

    return <AdminDashboard user={{ name: user.name, email: user.email }} dashboard={dashboard} />;
}
