import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Authentication required." },
        {
          status: 401,
          headers: { "Cache-Control": "no-store" },
        }
      );
    }

    return NextResponse.json(
      { success: true, user },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error) {
    console.error("[AUTH] Session check failed:", error.message);

    return NextResponse.json(
      { success: false, message: "Unable to verify session." },
      {
        status: 500,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }
}
