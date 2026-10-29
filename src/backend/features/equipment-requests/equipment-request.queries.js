import { prisma } from "@backend/db/prisma";

export async function getAdminEquipmentRequestPageData() {
    const [requests, equipment] = await Promise.all([
        prisma.equipmentRequest.findMany({
            include: {
                user: { select: { name: true, email: true } },
                product: { select: { marque: true, bureau: true } },
            },
            orderBy: { createdAt: "desc" },
        }),
        prisma.product.findMany({
            where: { stock: { gt: 0 } },
            orderBy: { createdAt: "desc" },
            select: { id: true, marque: true, bureau: true, stock: true },
        }),
    ]);
    return { requests, equipment };
}