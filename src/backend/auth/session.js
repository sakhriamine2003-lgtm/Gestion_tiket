import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const roles = ["admin", "utilisateur", "responsable"];
const sessionCookie = "ticket_session";
const sessionSecret = process.env.AUTH_SECRET || "development-only-change-this-secret";

function encode(value) {
    return Buffer.from(value, "utf8").toString("base64url");
}

function decode(value) {
    return Buffer.from(value, "base64url").toString("utf8");
}

function sign(value) {
    return crypto.createHmac("sha256", sessionSecret).update(value).digest("base64url");
}

function createSession(user) {
    const payload = { ...user, expiresAt: Date.now() + 1000 * 60 * 60 * 8 };
    const encodedPayload = encode(JSON.stringify(payload));
    return `${encodedPayload}.${sign(encodedPayload)}`;
}

function readSession(value) {
    try {
        const [encodedPayload, signature] = value.split(".");
        if (!encodedPayload || !signature || sign(encodedPayload) !== signature)
            return null;
        const payload = JSON.parse(decode(encodedPayload));
        if (payload.expiresAt < Date.now() || !roles.includes(payload.user_role))
            return null;
        return { id: payload.id, name: payload.name, email: payload.email, user_role: payload.user_role };
    }
    catch {
        return null;
    }
}

export async function setSession(user) {
    const cookieStore = await cookies();
    cookieStore.set(sessionCookie, createSession(user), {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 8,
        path: "/",
    });
}

export async function clearSession() {
    const cookieStore = await cookies();
    cookieStore.delete(sessionCookie);
}

export async function getSession() {
    const cookieStore = await cookies();
    const value = cookieStore.get(sessionCookie)?.value;
    return value ? readSession(value) : null;
}

export async function requireRole(role) {
    const user = await getSession();
    if (!user)
        redirect("/login");
    if (user.user_role !== role)
        redirect(`/${user.user_role}`);
    return user;
}

export function isUserRole(value) {
    return typeof value === "string" && roles.includes(value);
}