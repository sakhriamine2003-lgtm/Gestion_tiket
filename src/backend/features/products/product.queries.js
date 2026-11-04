import { prisma } from "@backend/db/prisma";

export function listProducts() {
    return prisma.product.findMany({ orderBy: { createdAt: "desc" } });
}

export function getProductForEdit(id) {
    return prisma.product.findUnique({ where: { id } });
}

export function getProductWithAssignments(id) {
    return prisma.product.findUnique({
        where: { id },
        include: {
            equipmentRequests: {
                where: { status: "Acceptée" },
                orderBy: { createdAt: "desc" },
                include: { user: { select: { id: true, name: true, email: true } } },
            },
        },
    });
}