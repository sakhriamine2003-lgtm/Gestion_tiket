
import { compare } from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isUserRole, setSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    // 1. Récupérer les données
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email et password sont obligatoires" },
        { status: 400 }
      );
    }

    // 2. Chercher l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Email ou password incorrect" },
        { status: 401 }
      );
    }

    // 3. Vérifier le password
    const passwordCorrect = await compare(password, user.password);

    if (!passwordCorrect) {
      return NextResponse.json(
        { error: "Email ou password incorrect" },
        { status: 401 }
      );
    }

    // 4. Vérifier le rôle
    const role = user.user_role.trim().toLowerCase();

    if (!isUserRole(role)) {
      return NextResponse.json(
        { error: "Rôle invalide" },
        { status: 403 }
      );
    }

    // 5. Créer la session
    await setSession({
      id: user.id,
      name: user.name,
      email: user.email,
      user_role: role,
    });

    // 6. Retourner l'utilisateur
    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      user_role: role,
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

