import { prisma } from "@backend/db/prisma";

export async function getAdminDashboardData() {
    const [requestStatuses, faultStatuses, productCount, availableProductCount, stockTotal, userCount, recentRequests, recentFaultReports] = await Promise.all([
        prisma.equipmentRequest.groupBy({ by: ["status"], _count: { _all: true } }),
        prisma.faultReport.groupBy({ by: ["status"], _count: { _all: true } }),
        prisma.product.count(),
        prisma.product.count({ where: { stock: { gt: 0 } } }),
        prisma.product.aggregate({ _sum: { stock: true } }),
        prisma.user.count(),
        prisma.equipmentRequest.findMany({
            take: 5,
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                status: true,
                createdAt: true,
                user: { select: { name: true } },
                product: { select: { marque: true, bureau: true } },
            },
        }),
        prisma.faultReport.findMany({
            take: 5,
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                status: true,
                createdAt: true,
                user: { select: { name: true } },
                product: { select: { marque: true, bureau: true } },
            },
        }),
    ]);
    return { requestStatuses, faultStatuses, productCount, availableProductCount, stockTotal, userCount, recentRequests, recentFaultReports };
}