import { NextResponse } from "next/server";
import { clearSession } from "@backend/authentification/session";

export async function POST() {
    await clearSession();
    return NextResponse.json({ success: true });
}