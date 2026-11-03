// import { requireRole } from "@backend/auth/session";
import { prisma } from "@/lib/prisma";

export default async function AfficherUsers() {
    // await requireRole("admin");

    const users = await prisma.user.findMany();
        // orderBy: { name: "asc" },);

    return (
        <div>
            <h1 className="text-2xl ">Liste des utilisateurs</h1>

            {users.map((user) => (
                <div key={user.id}>
                    <h2>{user.name}</h2>
                    <p>{user.email}</p>
                    <p>-----------------------------</p>
                </div>
            ))}
        </div>
    );
}