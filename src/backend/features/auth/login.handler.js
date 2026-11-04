import { compare } from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@backend/db/prisma";
import { isUserRole, setSession } from "@backend/auth/session";

export async function POST(request) {
    try {
        const { email, password } = await request.json();
        if (!email || !password) {
            return NextResponse.json({ error: "Email et password sont obligatoires" }, { status: 400 });
        }
        const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
        if (!user) {
            return NextResponse.json({ error: "Email ou password incorrect" }, { status: 401 });
        }
        const passwordCorrect = await compare(password, user.password);
        if (!passwordCorrect) {
            return NextResponse.json({ error: "Email ou password incorrect" }, { status: 401 });
        }
        const role = user.user_role.trim().toLowerCase();
        if (!isUserRole(role)) {
            return NextResponse.json({ error: "Rôle invalide" }, { status: 403 });
        }
        await setSession({ id: user.id, name: user.name, email: user.email, user_role: role });
        return NextResponse.json({ id: user.id, name: user.name, email: user.email, user_role: role });
    }
    catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}