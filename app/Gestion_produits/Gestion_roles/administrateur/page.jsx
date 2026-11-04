import { requireRole } from "@backend/authentification/session";
import { getAdminDashboardData } from "@backend/features/tableau-de-bord/tableauBord.queries";
import AdminDashboard from "@frontend/features/tableau-de-bord/TableauDeBordAdmin";

export default async function AdminPage() {
    const user = await requireRole("admin");
    const dashboard = await getAdminDashboardData(user.id);

    return <AdminDashboard user={{ name: user.name, email: user.email }} dashboard={dashboard} />;
}
