
import "server-only";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import {
    signAccessToken,
    verifyAccessToken,
} from "@/lib/auth/jwt";

export const AUTH_COOKIE = "admin_session";

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
};

export async function createSession(user) {
    const token = await signAccessToken(user);
    const cookieStore = await cookies();

    cookieStore.set(AUTH_COOKIE, token, {
        ...COOKIE_OPTIONS,
        maxAge: 15 * 60,
    });
}

export async function destroySession() {
    const cookieStore = await cookies();

    cookieStore.set(AUTH_COOKIE, "", {
        ...COOKIE_OPTIONS,
        maxAge: 0,
        expires: new Date(0),
    });
}

export async function getAuthenticatedUser() {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE)?.value;

    if (!token) {
        return null;
    }

    try {
        const payload = await verifyAccessToken(token);

        await connectDB();

        const user = await User.findById(payload.sub)
            .select("name email role isActive tokenVersion")
            .lean();

        if (
            !user ||
            !user.isActive ||
            user.role !== "admin" ||
            user.tokenVersion !== payload.tokenVersion
        ) {
            return null;
        }

        return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
        };
    } catch {
        return null;
    }
}
