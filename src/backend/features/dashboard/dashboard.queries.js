import { prisma } from "@backend/db/prisma";

export async function getAdminDashboardData(userId) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const trendStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 89));
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const tomorrowStart = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    const [
        ticketStatuses,
        ticketsCreatedThisMonth,
        ticketsCreatedLastMonth,
        resolvedThisMonth,
        resolvedLastMonth,
        recentTickets,
        dailyTicketCounts,
        todayFaultReports,
        productCount,
        availableProductCount,
        stockTotal,
        clientCount,
        notificationCount,
        notifications,
    ] = await Promise.all([
        prisma.ticket.groupBy({ by: ["status"], _count: { _all: true } }),
        prisma.ticket.groupBy({
            by: ["status"],
            where: { createdAt: { gte: monthStart } },
            _count: { _all: true },
        }),
        prisma.ticket.groupBy({
            by: ["status"],
            where: { createdAt: { gte: previousMonthStart, lt: monthStart } },
            _count: { _all: true },
        }),
        prisma.ticket.count({
            where: { status: "RESOLVED", updatedAt: { gte: monthStart } },
        }),
        prisma.ticket.count({
            where: {
                status: "RESOLVED",
                updatedAt: { gte: previousMonthStart, lt: monthStart },
            },
        }),
        prisma.ticket.findMany({
            take: 8,
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                title: true,
                status: true,
                createdAt: true,
                user: { select: { name: true } },
            },
        }),
        prisma.$queryRaw`
            SELECT TO_CHAR(DATE_TRUNC('day', "createdAt" AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS day, COUNT(*)::int AS count
            FROM "Ticket"
            WHERE "createdAt" >= ${trendStart}
            GROUP BY DATE_TRUNC('day', "createdAt" AT TIME ZONE 'UTC')
            ORDER BY DATE_TRUNC('day', "createdAt" AT TIME ZONE 'UTC')
        `,
        prisma.faultReport.findMany({
            where: { createdAt: { gte: todayStart, lt: tomorrowStart } },
            take: 8,
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                status: true,
                createdAt: true,
                user: { select: { name: true } },
                product: { select: { marque: true, bureau: true } },
            },
        }),
        prisma.product.count(),
        prisma.product.count({ where: { stock: { gt: 0 } } }),
        prisma.product.aggregate({ _sum: { stock: true } }),
        prisma.user.count({ where: { user_role: "utilisateur" } }),
        prisma.notification.count({ where: { userId } }),
        prisma.notification.findMany({
            where: { userId },
            take: 5,
            orderBy: { createdAt: "desc" },
            select: { id: true, message: true, createdAt: true },
        }),
    ]);

    return {
        ticketStatuses,
        ticketsCreatedThisMonth,
        ticketsCreatedLastMonth,
        resolvedThisMonth,
        resolvedLastMonth,
        recentTickets,
        dailyTicketCounts,
        trendEndDay: now.toISOString().slice(0, 10),
        todayFaultReports,
        productCount,
        availableProductCount,
        stockTotal,
        clientCount,
        notificationCount,
        notifications,
    };
}