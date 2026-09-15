import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isUserRole } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const user_role = body.user_role;

    if (!name || !email || password.length < 6 || !isUserRole(user_role)) {
      return NextResponse.json(
        { error: "name, email, password (6 characters minimum) and a valid user_role are required" },
        { status: 400 },
      );
    }

    const user = await prisma.user.create({
      data: { name, email, password: await hash(password, 12), user_role },
      select: { id: true, name: true, email: true, user_role: true },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json({ error: "This email is already registered" }, { status: 409 });
    }
    return NextResponse.json({ error: "Unable to create user" }, { status: 500 });
  }

  
}
