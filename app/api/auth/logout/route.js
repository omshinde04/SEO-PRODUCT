import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    await destroySession();

    return NextResponse.json(
      { success: true, message: "Logout successful." },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error) {
    console.error("[AUTH] Logout failed:", error.message);

    return NextResponse.json(
      { success: false, message: "Unable to log out right now." },
      {
        status: 500,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }
}
